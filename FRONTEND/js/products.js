/* =================================================================
   products.js — Card-grid product list + floating create/edit modals
   UPDATED: Searchable supplier dropdown combobox with auto-fill
================================================================= */
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let allProducts       = [];
let editingProductId  = null;
let deletingProductId = null;
let allSuppliers      = []; // loaded from localStorage for combobox

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

/* ── Load Suppliers from localStorage ────────────────────── */
function loadSuppliersForCombobox() {
  try {
    const data = localStorage.getItem('haneus_suppliers');
    allSuppliers = data ? JSON.parse(data) : [];
  } catch {
    allSuppliers = [];
  }
}

/* ── Supplier Searchable Dropdown Logic ───────────────────── */
function onSupplierSearchInput() {
  const val = (document.getElementById('pSupplierSearch')?.value || '').toLowerCase().trim();
  showSupplierSuggestions(val);
}

function onSupplierSearchFocus() {
  loadSuppliersForCombobox();
  const val = (document.getElementById('pSupplierSearch')?.value || '').toLowerCase().trim();
  showSupplierSuggestions(val);
}

function showSupplierSuggestions(query) {
  const dd = document.getElementById('supplierComboDropdown');
  const list = document.getElementById('supplierComboList');
  if (!dd || !list) return;

  if (allSuppliers.length === 0) {
    list.innerHTML = '<div class="supplier-combo-empty">No suppliers in system. Add suppliers first.</div>';
    dd.style.display = 'block';
    return;
  }

  const filtered = allSuppliers.filter(s => {
    const name = (s.name || s.owner || '').toLowerCase();
    const company = (s.companyName || s.company || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    if (!query) return true;
    return name.includes(query) || company.includes(query) || email.includes(query) || phone.includes(query);
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="supplier-combo-empty">No matching suppliers found</div>';
    dd.style.display = 'block';
    return;
  }

  list.innerHTML = filtered.map(s => {
    const name = escHtml(s.name || s.owner || '');
    const company = escHtml(s.companyName || s.company || '');
    const phone = escHtml(s.phone || '');
    const email = escHtml(s.email || '');
    return `
      <div class="supplier-combo-item" onclick="selectSupplier(${s.id})">
        <div class="supplier-combo-name">${name}</div>
        <div class="supplier-combo-detail">
          ${company ? `<span>🏢 ${company}</span>` : ''}
          ${phone ? `<span>📞 ${phone}</span>` : ''}
          ${email ? `<span>✉ ${email}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  dd.style.display = 'block';
}

function selectSupplier(id) {
  const s = allSuppliers.find(x => x.id === id);
  if (!s) return;

  // Fill all 4 fields
  document.getElementById('pSupplierName').value = s.name || s.owner || '';
  document.getElementById('pSupplierPhone').value = s.phone || '';
  document.getElementById('pSupplierEmail').value = s.email || '';
  document.getElementById('pSupplierCompany').value = s.companyName || s.company || '';

  // Update search field to show selected supplier
  const searchEl = document.getElementById('pSupplierSearch');
  if (searchEl) searchEl.value = `✓ ${s.name || s.owner || ''} — ${s.companyName || s.company || ''}`;

  closeSupplierCombobox();

  // Brief highlight animation
  ['pSupplierName','pSupplierPhone','pSupplierEmail','pSupplierCompany'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el && el.value) {
      el.style.transition = 'background 0.3s';
      el.style.background = 'rgba(196,123,66,0.15)';
      setTimeout(() => { el.style.background = ''; }, 800);
    }
  });
}

function clearSupplierSelection() {
  document.getElementById('pSupplierSearch').value = '';
  document.getElementById('pSupplierName').value = '';
  document.getElementById('pSupplierPhone').value = '';
  document.getElementById('pSupplierEmail').value = '';
  document.getElementById('pSupplierCompany').value = '';
}

function closeSupplierCombobox() {
  const dd = document.getElementById('supplierComboDropdown');
  if (dd) dd.style.display = 'none';
}

// Close combobox when clicking outside
document.addEventListener('click', e => {
  const wrap = document.getElementById('supplierComboboxWrap');
  if (wrap && !wrap.contains(e.target)) {
    closeSupplierCombobox();
  }
});

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

  // Get enriched supplier data from localStorage mapping
  let supplierData = null;
  try {
    const mapStr = localStorage.getItem('haneus_supplier_product_map');
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map[id]) supplierData = map[id];
    }
  } catch {}

  const supplierName = (supplierData && supplierData.supplierName) || p.supplier_name || '';
  const supplierContact = p.supplier_contact || '';
  // Parse phone/email from combined supplier_contact field (format: "phone | email")
  let parsedPhone = '', parsedEmail = '';
  if (supplierContact && supplierContact.includes('|')) {
    const parts = supplierContact.split('|').map(s => s.trim());
    parsedPhone = parts[0] || '';
    parsedEmail = parts[1] || '';
  } else if (supplierContact) {
    if (supplierContact.includes('@')) parsedEmail = supplierContact;
    else parsedPhone = supplierContact;
  }
  const supplierPhone = (supplierData && supplierData.supplierPhone) || parsedPhone;
  const supplierEmail = (supplierData && supplierData.supplierEmail) || parsedEmail;
  const supplierCompany = (supplierData && supplierData.supplierCompany) || '';

  const lbl = 'font-size:0.7rem;color:#999;text-transform:uppercase;margin-bottom:0.2rem;';

  document.getElementById('pvModal').style.display = 'flex';
  document.getElementById('pvModalBody').innerHTML = `
    <div style="text-align:center;margin-bottom:1.25rem;">
      <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}"
           onerror="this.src='${fallback}'"
           style="width:160px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid #ddd;" />
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
      <div><div style="${lbl}">Name</div><div style="font-weight:600;">${escHtml(p.name)}</div></div>
      <div><div style="${lbl}">Category</div><div>${escHtml(p.category)}</div></div>
      <div><div style="${lbl}">Selling Price</div><div style="font-weight:600;color:#c47b42;">&#8369;${parseFloat(p.price).toFixed(2)}</div></div>
      <div><div style="${lbl}">Cost Per Unit</div><div>&#8369;${parseFloat(p.cost || 0).toFixed(2)}</div></div>
      <div><div style="${lbl}">Stock</div><div>${p.stock} ${escHtml(p.unit || '')}</div></div>
      <div><div style="${lbl}">Status</div><div style="color:${statusCls};font-weight:600;">${escHtml(p.stock_status)}</div></div>
      <div><div style="${lbl}">Reorder At</div><div>${p.low_stock_threshold}</div></div>
      <div><div style="${lbl}">Unit</div><div>${escHtml(p.unit || '—')}</div></div>
    </div>
    ${supplierName || supplierContact ? `
    <div style="margin-top:1rem;padding-top:0.75rem;border-top:1px solid #e1c8b2;">
      <div style="font-size:0.75rem;font-weight:600;color:#6e4f3e;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.5rem;">Supplier Information</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
        <div style="grid-column:1/-1;"><div style="${lbl}">Supplier Name</div><div>${escHtml(supplierName) || '—'}</div></div>
        ${supplierPhone ? `<div><div style="${lbl}">Contact Number</div><div>${escHtml(supplierPhone)}</div></div>` : ''}
        ${supplierEmail ? `<div><div style="${lbl}">Email Address</div><div>${escHtml(supplierEmail)}</div></div>` : ''}
        ${supplierCompany ? `<div style="grid-column:1/-1;"><div style="${lbl}">Company Name</div><div>${escHtml(supplierCompany)}</div></div>` : ''}
        ${!supplierPhone && !supplierEmail && !supplierCompany && supplierContact ? `<div style="grid-column:1/-1;"><div style="${lbl}">Contact</div><div>${escHtml(supplierContact)}</div></div>` : ''}
      </div>
    </div>` : ''}
    ${p.description ? `<div style="margin-top:0.75rem;"><div style="${lbl}">Description</div><div style="font-size:0.875rem;color:#555;">${escHtml(p.description)}</div></div>` : ''}
  `;
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
  loadSuppliersForCombobox();

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
  document.getElementById('pSupplierSearch').value = '';
  document.getElementById('pSupplierName').value = '';
  document.getElementById('pSupplierPhone').value = '';
  document.getElementById('pSupplierEmail').value = '';
  document.getElementById('pSupplierCompany').value = '';
  resetImagePreview();
  closeSupplierCombobox();

  document.getElementById('productModal').style.display = 'flex';
  lucide.createIcons();
}

function openEditModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  loadSuppliersForCombobox();

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

  // Populate supplier fields
  // First check if there's a mapping from supplier page
  let supplierFromMap = null;
  try {
    const mapStr = localStorage.getItem('haneus_supplier_product_map');
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map[id]) supplierFromMap = map[id];
    }
  } catch {}

  if (supplierFromMap) {
    document.getElementById('pSupplierName').value = supplierFromMap.supplierName || p.supplier_name || '';
    document.getElementById('pSupplierPhone').value = supplierFromMap.supplierPhone || '';
    document.getElementById('pSupplierEmail').value = supplierFromMap.supplierEmail || '';
    document.getElementById('pSupplierCompany').value = supplierFromMap.supplierCompany || '';
    const sn = supplierFromMap.supplierName || p.supplier_name || '';
    const sc = supplierFromMap.supplierCompany || '';
    document.getElementById('pSupplierSearch').value = sn ? `✓ ${sn}${sc ? ' — ' + sc : ''}` : '';
  } else {
    document.getElementById('pSupplierName').value = p.supplier_name || '';
    document.getElementById('pSupplierPhone').value = p.supplier_phone || '';
    document.getElementById('pSupplierEmail').value = p.supplier_email || '';
    document.getElementById('pSupplierCompany').value = p.supplier_company || '';
    document.getElementById('pSupplierSearch').value = p.supplier_name ? `✓ ${p.supplier_name}` : '';
  }

  closeSupplierCombobox();

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
  closeSupplierCombobox();
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
  const supplierName    = document.getElementById('pSupplierName').value.trim();
  const supplierPhone   = document.getElementById('pSupplierPhone').value.trim();
  const supplierEmail   = document.getElementById('pSupplierEmail').value.trim();
  const supplierCompany = document.getElementById('pSupplierCompany').value.trim();
  const imageFile = document.getElementById('pImage')?.files[0];

  // Build supplier_contact as combined string for backward compatibility
  const supplierContact = [supplierPhone, supplierEmail].filter(Boolean).join(' | ');

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
                   supplier_name: supplierName || null,
                   supplier_contact: supplierContact || null,
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

    // After save, update the localStorage supplier-product mapping
    // so View modals in products/managestock can display supplier info
    const savedProduct = await res.json().catch(() => null);
    const productId = savedProduct?.id || editingProductId;
    if (productId && supplierName) {
      try {
        const mapStr = localStorage.getItem('haneus_supplier_product_map');
        const map = mapStr ? JSON.parse(mapStr) : {};
        map[productId] = {
          supplierName: supplierName,
          supplierPhone: supplierPhone,
          supplierEmail: supplierEmail,
          supplierCompany: supplierCompany
        };
        localStorage.setItem('haneus_supplier_product_map', JSON.stringify(map));
      } catch (e) { console.error('Failed to update supplier mapping:', e); }
    }

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

// -- AJAX Auto-Refresh -----------------------------------------
if (typeof startAutoRefresh === 'function') {
  startAutoRefresh(() => loadProducts(), 20000, 'products');
}
