/* =================================================================
   products.js — Card-grid product list + floating create/edit modals
================================================================= */
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let allProducts       = [];
let editingProductId  = null;
let deletingProductId = null;

// ── Pagination state ───────────────────────────────────────────────
let currentPage        = 1;
const itemsPerPage     = 12;
let totalPages         = 1;
let currentFilteredList = [];

// ── Request control ────────────────────────────────────────────────
let _productsAbort = null;  // AbortController for request cancellation
let _debounceTimer = null;  // Debounce timer for search

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return String(s||'').replace(/'/g,"\\'"); }

/* ── Image preview helper ───────────────────────────────────── */
function resetImagePreview() {
  const inp = document.getElementById('pImage');
  if (inp) inp.value = '';
  const nameEl = document.getElementById('pImageFileName');
  if (nameEl) nameEl.textContent = 'Choose File';
  const preview = document.getElementById('pImagePreview');
  if (preview) {
    preview.innerHTML =
      '<i data-lucide="image" style="width:28px;height:28px;opacity:0.3;"></i>' +
      '<span class="fc-no-img">No image selected</span>';
    lucide.createIcons();
  }
}

document.getElementById('pImage')?.addEventListener('change', function () {
  const file    = this.files[0];
  const nameEl  = document.getElementById('pImageFileName');
  const preview = document.getElementById('pImagePreview');
  if (!file) { resetImagePreview(); return; }
  if (nameEl) nameEl.textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => {
    if (preview)
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" class="fc-img-thumb">`;
  };
  reader.readAsDataURL(file);
});

async function loadProducts() {
  // Cancel any in-flight request before starting a new one
  if (_productsAbort) _productsAbort.abort();
  _productsAbort = new AbortController();

  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<p style="color:var(--mocha);padding:2rem;">Loading products...</p>';
  try {
    const res  = await fetch(`${API}/products/view/?page=1&limit=100`, { signal: _productsAbort.signal });
    const data = await res.json();
    // Handle paginated response format
    allProducts = data.products || data.results || data;
    applyFilterSort();
  } catch (err) {
    if (err.name === 'AbortError') return; // Cancelled — ignore
    grid.innerHTML = '<p style="color:#dc2626;padding:2rem;">Failed to load products. Is the backend running?</p>';
  }
}

function applyFilterSort() {
  const q    = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const sort = document.getElementById('productSort')?.value || '';
  let list = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
  if (sort === 'name-asc')   list.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'name-desc')  list.sort((a,b) => b.name.localeCompare(a.name));
  if (sort === 'price-asc')  list.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
  if (sort === 'price-desc') list.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
  currentFilteredList = list;
  currentPage = 1;
  totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));
  renderGrid(list.slice(0, itemsPerPage));
  renderPaginationControls();
}

function renderPaginationControls() {
  const container = document.getElementById('paginationControls');
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
  let startPage = Math.max(1, currentPage - 2);
  let endPage   = Math.min(totalPages, currentPage + 2);
  if (endPage - startPage < 4) {
    if (startPage === 1) endPage   = Math.min(totalPages, startPage + 4);
    if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
  }
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  const start = (currentPage - 1) * itemsPerPage;
  renderGrid(currentFilteredList.slice(start, start + itemsPerPage));
  renderPaginationControls();
}

function renderGrid(products) {
  const grid     = document.getElementById('productsGrid');
  const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package" style="width:56px;height:56px;"></i>
        <p style="margin-top:0.5rem;">No products found.</p>
      </div>`;
    lucide.createIcons();
    return;
  }
  grid.innerHTML = products.map(p => {
    const statusCls = p.stock_status === 'In Stock'  ? 'status-in-stock'
                    : p.stock_status === 'Low Stock'  ? 'status-low' : 'status-out';
    const imgSrc    = p.image_url || fallback;
    return `
      <div class="product-card">
        <div class="product-card-img">
          <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}"
               onerror="this.src='${fallback}'" loading="lazy" />
        </div>
        <div class="product-card-body">
          <div class="product-card-row">
            <div class="product-card-name" title="${escHtml(p.name)}">${escHtml(p.name)}</div>
            <div class="product-card-category">${escHtml(p.category)}</div>
          </div>
          <div class="product-card-row">
            <div class="product-card-price">&#8369;${parseFloat(p.price).toFixed(2)}</div>
            <span class="product-card-status ${statusCls}">${escHtml(p.stock_status)}</span>
          </div>
        </div>
        <div class="product-card-actions">
          <button class="btn-icon" title="View" onclick="openProductViewModal(${p.id})"
                  style="color:#0284c7;background:#dbeafe;border:none;border-radius:0.375rem;padding:0.35rem;cursor:pointer;">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn-icon btn-icon-edit" title="Edit" onclick="openEditModal(${p.id})">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-icon btn-icon-del" title="Delete"
                  onclick="openDeleteModal(${p.id}, '${escAttr(p.name)}')">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>`;
  }).join('');
  lucide.createIcons();
}

// ── Product View Modal ────────────────────────────────────────────
function openProductViewModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;

  const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
  const imgSrc   = p.image_url || fallback;
  const statusCls = p.stock_status === 'In Stock'  ? '#16a34a'
                  : p.stock_status === 'Low Stock'  ? '#b45309' : '#b91c1c';

  document.getElementById('pvModal').style.display = 'flex';
  document.getElementById('pvModalBody').innerHTML = `
    <div style="text-align:center;margin-bottom:1.25rem;">
      <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}"
           onerror="this.src='${fallback}'"
           style="width:160px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid #ddd;" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Name</div><div style="font-weight:600;">${escHtml(p.name)}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Category</div><div>${escHtml(p.category)}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Price</div><div style="font-weight:600;color:#c47b42;">&#8369;${parseFloat(p.price).toFixed(2)}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Cost</div><div>&#8369;${parseFloat(p.cost || 0).toFixed(2)}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Stock</div><div>${p.stock} ${escHtml(p.unit || '')}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Status</div><div style="color:${statusCls};font-weight:600;">${escHtml(p.stock_status)}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Reorder At</div><div>${p.low_stock_threshold}</div></div>
      <div><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Unit</div><div>${escHtml(p.unit || '—')}</div></div>
      ${p.supplier_name ? `<div style="grid-column:1/-1;"><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Supplier</div><div>${escHtml(p.supplier_name)}</div></div>` : ''}
      ${p.supplier_contact ? `<div style="grid-column:1/-1;"><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Supplier Contact</div><div>${escHtml(p.supplier_contact)}</div></div>` : ''}
      ${p.description ? `<div style="grid-column:1/-1;"><div style="font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;">Description</div><div style="font-size:0.875rem;color:#555;">${escHtml(p.description)}</div></div>` : ''}
    </div>`;
  lucide.createIcons();
}
function closeProductViewModal() {
  document.getElementById('pvModal').style.display = 'none';
}
window.addEventListener('click', e => {
  if (e.target === document.getElementById('pvModal')) closeProductViewModal();
});

document.getElementById('productSearch')?.addEventListener('input', function() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(applyFilterSort, 300);
});
document.getElementById('productSort')?.addEventListener('change', applyFilterSort);

function openCreateModal() {
  editingProductId = null;
  document.getElementById('modalTitle').textContent       = 'Create Product';
  document.getElementById('saveProductBtn').textContent   = 'Create Product';
  document.getElementById('pName').value      = '';
  document.getElementById('pCategory').value  = '';
  document.getElementById('pPrice').value     = '';
  document.getElementById('pCost').value      = '';
  document.getElementById('pStock').value     = '0';
  document.getElementById('pUnit').value      = 'Piece/Item';
  document.getElementById('pDesc').value      = '';
  document.getElementById('pThreshold').value = '10';
  document.getElementById('pSupplierName').value = '';
  document.getElementById('pSupplierContact').value = '';
  resetImagePreview();
  document.getElementById('productModal').style.display = 'flex';
  lucide.createIcons();
}

function openEditModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById('modalTitle').textContent       = 'Edit Product';
  document.getElementById('saveProductBtn').textContent   = 'Save Changes';
  document.getElementById('pName').value      = p.name;
  document.getElementById('pCategory').value  = p.category;
  document.getElementById('pPrice').value     = parseFloat(p.price).toFixed(2);
  document.getElementById('pCost').value      = p.cost ? parseFloat(p.cost).toFixed(2) : '';
  document.getElementById('pStock').value     = p.stock ?? 0;
  document.getElementById('pUnit').value      = p.unit || 'Piece/Item';
  document.getElementById('pDesc').value      = p.description || '';
  document.getElementById('pThreshold').value = p.low_stock_threshold ?? 10;
  document.getElementById('pSupplierName').value = p.supplier_name || '';
  document.getElementById('pSupplierContact').value = p.supplier_contact || '';
  // File inputs cannot be pre-filled; show existing image if available
  const inp = document.getElementById('pImage');
  if (inp) inp.value = '';
  const nameEl  = document.getElementById('pImageFileName');
  if (nameEl) nameEl.textContent = 'Choose File';
  const preview = document.getElementById('pImagePreview');
  if (preview) {
    if (p.image_url) {
      preview.innerHTML = `<img src="${escHtml(p.image_url)}" alt="${escHtml(p.name)}" class="fc-img-thumb">`;
    } else {
      preview.innerHTML =
        '<i data-lucide="image" style="width:28px;height:28px;opacity:0.3;"></i>' +
        '<span class="fc-no-img">No image selected</span>';
      lucide.createIcons();
    }
  }
  document.getElementById('productModal').style.display = 'flex';
  lucide.createIcons();
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  editingProductId = null;
}

async function submitProductForm() {
  const name      = document.getElementById('pName').value.trim();
  const category  = document.getElementById('pCategory').value;
  const price     = parseFloat(document.getElementById('pPrice').value);
  const cost      = parseFloat(document.getElementById('pCost').value);
  const stock     = parseInt(document.getElementById('pStock').value, 10) || 0;
  const unit      = document.getElementById('pUnit').value;
  const desc      = document.getElementById('pDesc').value.trim();
  const threshold = parseInt(document.getElementById('pThreshold').value, 10);
  const supplierName = document.getElementById('pSupplierName').value.trim();
  const supplierContact = document.getElementById('pSupplierContact').value.trim();
  const imageFile = document.getElementById('pImage')?.files[0];

  if (!name)                      { showErrorModal('Product name is required.');         return; }
  if (!category)                  { showErrorModal('Please select a category.');         return; }
  if (isNaN(price) || price < 0)  { showErrorModal('Please enter a valid selling price.'); return; }
  if (isNaN(cost)  || cost  < 0)  { showErrorModal('Please enter a valid cost per unit.'); return; }
  if (!unit)                      { showErrorModal('Please select a unit of measure.');  return; }
  if (isNaN(threshold) || threshold < 0) { showErrorModal('Please enter a valid low-stock threshold.'); return; }

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving…';

  try {
    // Upload image file via /api/upload/ if provided, otherwise keep existing or null
    let imageUrl = null;
    if (imageFile) {
      try {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadRes = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        const urlPath = uploadData.url.startsWith('/') ? uploadData.url : '/' + uploadData.url;
        imageUrl = `${window.location.origin}${urlPath}`;
      } catch (uploadErr) {
        console.error('Image upload error:', uploadErr);
        showErrorModal('Failed to upload image. Product will be saved without image.');
      }
    } else if (editingProductId) {
      // Keep the existing image_url when editing without a new file
      const existing = allProducts.find(x => x.id === editingProductId);
      imageUrl = existing ? (existing.image_url || null) : null;
    }

    const body = { name, category, price, cost, stock, unit,
                   description: desc, low_stock_threshold: threshold,
                   supplier_name: supplierName || null, supplier_contact: supplierContact || null,
                   image_url: imageUrl };
    let res;
    if (editingProductId) {
      res = await fetch(`${API}/products/edit/${editingProductId}/`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
    } else {
      res = await fetch(`${API}/products/create/`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
    }
    if (!res.ok) { const err = await res.json(); showErrorModal(JSON.stringify(err.errors||err.error||err)); return; }
    closeProductModal();
    loadProducts();
  } catch { showErrorModal('Failed to save. Is the backend running?'); }
  finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = editingProductId ? 'Save Changes' : 'Create Product';
  }
}

function openDeleteModal(id, name) {
  deletingProductId = id;
  document.getElementById('deleteMsg').textContent =
    `Delete "${name}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
  lucide.createIcons();
}
function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deletingProductId = null;
}
async function confirmDelete() {
  try {
    const res = await fetch(`${API}/products/delete/${deletingProductId}/`, { method:'DELETE' });
    if (res.status === 204 || res.ok) { closeDeleteModal(); loadProducts(); }
    else showErrorModal('Failed to delete product.');
  } catch { showErrorModal('Failed to delete product.'); }
}

window.addEventListener('click', e => {
  if (e.target === document.getElementById('productModal')) closeProductModal();
  if (e.target === document.getElementById('deleteModal'))  closeDeleteModal();
});

loadProducts();
