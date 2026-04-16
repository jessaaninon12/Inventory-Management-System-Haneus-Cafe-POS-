/* =================================================================
   supplier.js — Supplier card grid with add / edit / delete / view.
   Data persisted in localStorage. Extend to use API when available.
   
   FIXED: Save button clickability, data persistence, button visibility
   ADDED: Multi-select product dropdown, restructured fields, view modal,
          card layout with image top + action buttons below image
================================================================= */
'use strict';

lucide.createIcons();

// ── API + LocalStorage Persistence ─────────────────────────────
const SUPPLIER_STORAGE_KEY = 'haneus_suppliers';
const PRODUCTS_API = 'http://127.0.0.1:8000/api';

function loadSuppliers() {
  try {
    const data = localStorage.getItem(SUPPLIER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveSuppliers() {
  try {
    localStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(suppliers));
    return true;
  } catch (e) {
    console.error('Failed to save suppliers to localStorage:', e);
    return false;
  }
}

let suppliers = loadSuppliers();
let nextId = suppliers.length ? Math.max(...suppliers.map(s => s.id)) + 1 : 1;
let editingId   = null;
let deletingId  = null;
let allApiProducts = []; // products fetched from backend
let selectedProductIds = []; // selected product IDs for current supplier

// ── Migrate old data format ────────────────────────────────────
(function migrateData() {
  let changed = false;
  suppliers.forEach(s => {
    if (s.owner && !s.name) { s.name = s.owner; delete s.owner; changed = true; }
    if (s.company && !s.companyName) { s.companyName = s.company; delete s.company; changed = true; }
    if (!s.productIds) { s.productIds = []; changed = true; }
  });
  if (changed) saveSuppliers();
})();

// ── Helpers ────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const FALLBACK_IMG = 'https://ui-avatars.com/api/?name=Supplier&background=c47b42&color=fff&size=80';

// ── Fetch Products from Backend ────────────────────────────────
async function fetchProducts() {
  try {
    const res = await fetch(`${PRODUCTS_API}/products/view/?page=1&limit=200`);
    const data = await res.json();
    allApiProducts = data.products || data.results || data;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    allApiProducts = [];
  }
}

// ── Multi-Select Product Dropdown ──────────────────────────────
function toggleProductDropdown() {
  const dd = document.getElementById('productDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    document.getElementById('productDropdownSearch').value = '';
    renderProductDropdownList(allApiProducts);
    document.getElementById('productDropdownSearch').focus();
  }
}

function closeProductDropdown() {
  const dd = document.getElementById('productDropdown');
  if (dd) dd.style.display = 'none';
}

function renderProductDropdownList(products) {
  const list = document.getElementById('productDropdownList');
  if (!list) return;

  if (!products || products.length === 0) {
    list.innerHTML = '<div class="multi-select-empty">No products found</div>';
    return;
  }

  list.innerHTML = products.map(p => {
    const checked = selectedProductIds.includes(p.id) ? 'checked' : '';
    const price = parseFloat(p.price || 0).toFixed(2);
    return `
      <label class="multi-select-item" data-product-id="${p.id}">
        <input type="checkbox" ${checked} onchange="toggleProductSelection(${p.id})" />
        <span class="multi-select-item-text">${escHtml(p.name)}, ₱${price}</span>
      </label>`;
  }).join('');
}

function filterProductDropdown() {
  const q = (document.getElementById('productDropdownSearch')?.value || '').toLowerCase();
  const filtered = allApiProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q)
  );
  renderProductDropdownList(filtered);
}

function toggleProductSelection(productId) {
  const idx = selectedProductIds.indexOf(productId);
  if (idx === -1) {
    selectedProductIds.push(productId);
  } else {
    selectedProductIds.splice(idx, 1);
  }
  renderSelectedProductTags();
  updateProductSelectPlaceholder();
}

function removeProductSelection(productId) {
  selectedProductIds = selectedProductIds.filter(id => id !== productId);
  renderSelectedProductTags();
  updateProductSelectPlaceholder();
  const dd = document.getElementById('productDropdown');
  if (dd && dd.style.display !== 'none') {
    filterProductDropdown();
  }
}

function renderSelectedProductTags() {
  const container = document.getElementById('selectedProductTags');
  if (!container) return;
  if (selectedProductIds.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = selectedProductIds.map(id => {
    const p = allApiProducts.find(x => x.id === id);
    const name = p ? p.name : `Product #${id}`;
    return `<span class="product-tag-selected">
      ${escHtml(name)}
      <button type="button" onclick="removeProductSelection(${id})" class="product-tag-remove" title="Remove">&times;</button>
    </span>`;
  }).join('');
}

function updateProductSelectPlaceholder() {
  const ph = document.getElementById('productSelectPlaceholder');
  if (!ph) return;
  if (selectedProductIds.length === 0) {
    ph.textContent = 'Select products…';
    ph.classList.remove('has-selection');
  } else {
    ph.textContent = `${selectedProductIds.length} product(s) selected`;
    ph.classList.add('has-selection');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  const wrapper = document.getElementById('productMultiSelect');
  if (wrapper && !wrapper.contains(e.target)) {
    closeProductDropdown();
  }
});

// ── Render ─────────────────────────────────────────────────────
function renderSuppliers(list) {
  const grid = document.getElementById('supplierGrid');
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i data-lucide="truck" style="width:56px;height:56px;"></i>
        <p style="margin-top:0.5rem;">No suppliers found.</p>
      </div>`;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = list.map(s => {
    const img = s.image || FALLBACK_IMG;
    
    // Build product tags from productIds
    let tagsHtml = '';
    if (s.productIds && s.productIds.length > 0 && allApiProducts.length > 0) {
      const tags = s.productIds.map(id => {
        const p = allApiProducts.find(x => x.id === id);
        return p ? `<span class="product-tag">${escHtml(p.name)}</span>` : '';
      }).filter(Boolean).join('');
      if (tags) {
        tagsHtml = `
        <div>
          <div class="supplier-products-label">Supplied Products</div>
          <div class="supplier-tags">${tags}</div>
        </div>`;
      }
    }
    // Fallback: show old comma-separated products if no productIds
    if (!tagsHtml && s.products && s.products.length > 0) {
      const tags = s.products.map(p => `<span class="product-tag">${escHtml(p)}</span>`).join('');
      tagsHtml = `
      <div>
        <div class="supplier-products-label">Supplied Products</div>
        <div class="supplier-tags">${tags}</div>
      </div>`;
    }

    return `
      <div class="supplier-card">
        <div class="supplier-body">
          <div class="supplier-info">
            <div class="supplier-company">${escHtml(s.name || s.owner || '')}</div>
            ${s.companyName || s.company ? `<div class="supplier-owner">
              <i data-lucide="building-2"></i>
              ${escHtml(s.companyName || s.company || '')}
            </div>` : ''}
            ${s.email ? `<div class="supplier-detail">
              <i data-lucide="mail"></i>
              <a href="mailto:${escHtml(s.email)}">${escHtml(s.email)}</a>
            </div>` : ''}
            ${s.phone ? `<div class="supplier-detail">
              <i data-lucide="phone"></i>
              ${escHtml(s.phone)}
            </div>` : ''}
            ${s.address ? `<div class="supplier-detail">
              <i data-lucide="map-pin"></i>
              ${escHtml(s.address)}
            </div>` : ''}
          </div>
          <div class="supplier-img-wrap">
            <img class="supplier-img" src="${escHtml(img)}" alt="${escHtml(s.name || s.owner || '')}"
                 onerror="this.src='${FALLBACK_IMG}'" loading="lazy" />
          </div>
        </div>

        <!-- Action buttons below image -->
        <div class="supplier-card-actions-bottom">
          <button class="btn-icon btn-icon-view" title="View" onclick="openViewSupplierModal(${s.id})" type="button">
            <i data-lucide="eye"></i>
          </button>
          <button class="btn-icon btn-icon-edit" title="Edit" onclick="openEditModal(${s.id})" type="button">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-icon btn-icon-del" title="Delete" onclick="openDeleteModal(${s.id})" type="button">
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        ${tagsHtml}
      </div>`;
  }).join('');

  lucide.createIcons();
}

function applySearch() {
  const q = (document.getElementById('supplierSearch')?.value || '').toLowerCase();
  const filtered = suppliers.filter(s =>
    (s.name || s.owner || '').toLowerCase().includes(q) ||
    (s.companyName || s.company || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q)
  );
  renderSuppliers(filtered);
}

// ── View Supplier Modal ────────────────────────────────────────
function openViewSupplierModal(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  const img = s.image || FALLBACK_IMG;

  // Build product tags
  let productsHtml = '<span style="color:var(--mocha);">None</span>';
  if (s.productIds && s.productIds.length > 0 && allApiProducts.length > 0) {
    const tags = s.productIds.map(pid => {
      const p = allApiProducts.find(x => x.id === pid);
      return p ? `<span class="product-tag">${escHtml(p.name)} — ₱${parseFloat(p.price||0).toFixed(2)}</span>` : '';
    }).filter(Boolean).join('');
    if (tags) productsHtml = `<div class="supplier-tags" style="margin-top:0.25rem;">${tags}</div>`;
  } else if (s.products && s.products.length > 0) {
    productsHtml = `<div class="supplier-tags" style="margin-top:0.25rem;">${s.products.map(p => `<span class="product-tag">${escHtml(p)}</span>`).join('')}</div>`;
  }

  document.getElementById('viewSupplierBody').innerHTML = `
    <div style="text-align:center;margin-bottom:1.25rem;">
      <img src="${escHtml(img)}" alt="${escHtml(s.name || s.owner || '')}"
           onerror="this.src='${FALLBACK_IMG}'"
           style="width:120px;height:120px;object-fit:cover;border-radius:0.75rem;border:2px solid var(--latte);" />
    </div>
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div class="sv-row"><span class="sv-label">Supplier Name</span><span class="sv-val">${escHtml(s.name || s.owner || '—')}</span></div>
      <div class="sv-row"><span class="sv-label">Company Name</span><span class="sv-val">${escHtml(s.companyName || s.company || '—')}</span></div>
      <div class="sv-row"><span class="sv-label">Contact Number</span><span class="sv-val">${escHtml(s.phone || '—')}</span></div>
      <div class="sv-row"><span class="sv-label">Email Address</span><span class="sv-val">${s.email ? `<a href="mailto:${escHtml(s.email)}" style="color:var(--primary);">${escHtml(s.email)}</a>` : '—'}</span></div>
      <div class="sv-row"><span class="sv-label">Address</span><span class="sv-val">${escHtml(s.address || '—')}</span></div>
      <div style="margin-top:0.5rem;">
        <div class="sv-label" style="margin-bottom:0.3rem;">Supplied Products</div>
        ${productsHtml}
      </div>
    </div>`;
  document.getElementById('viewSupplierModal').style.display = 'flex';
  lucide.createIcons();
}

function closeViewSupplierModal() {
  document.getElementById('viewSupplierModal').style.display = 'none';
}

// ── Image upload preview ───────────────────────────────────────
function setImagePreview(src) {
  const wrap = document.getElementById('sImagePreview');
  const img  = document.getElementById('sImagePreviewImg');
  if (src) {
    img.src = src;
    wrap.style.display = 'block';
  } else {
    img.src = '';
    wrap.style.display = 'none';
  }
}

function clearFileInput() {
  const fi = document.getElementById('sImageFile');
  if (fi) fi.value = '';
  setImagePreview('');
}

document.getElementById('sImageFile')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) { setImagePreview(''); return; }
  const reader = new FileReader();
  reader.onload = (ev) => setImagePreview(ev.target.result);
  reader.readAsDataURL(file);
});

// ── Add Supplier Modal ─────────────────────────────────────────
async function openAddModal() {
  editingId = null;
  selectedProductIds = [];
  document.getElementById('modalTitle').textContent = 'Add Supplier';
  document.getElementById('saveSupplierBtn').textContent = 'Save';
  document.getElementById('sName').value        = '';
  document.getElementById('sPhone').value       = '';
  document.getElementById('sEmail').value       = '';
  document.getElementById('sCompanyName').value  = '';
  document.getElementById('sAddress').value      = '';
  clearFileInput();

  await fetchProducts();
  renderSelectedProductTags();
  updateProductSelectPlaceholder();
  closeProductDropdown();

  document.getElementById('supplierModal').style.display = 'flex';
  lucide.createIcons();
}

// ── Edit Supplier Modal ────────────────────────────────────────
async function openEditModal(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  selectedProductIds = [...(s.productIds || [])];
  document.getElementById('modalTitle').textContent  = 'Edit Supplier';
  document.getElementById('saveSupplierBtn').textContent = 'Save Changes';
  document.getElementById('sName').value        = s.name || s.owner || '';
  document.getElementById('sPhone').value       = s.phone || '';
  document.getElementById('sEmail').value       = s.email || '';
  document.getElementById('sCompanyName').value  = s.companyName || s.company || '';
  document.getElementById('sAddress').value      = s.address || '';
  clearFileInput();
  if (s.image) setImagePreview(s.image);

  await fetchProducts();
  renderSelectedProductTags();
  updateProductSelectPlaceholder();
  closeProductDropdown();

  document.getElementById('supplierModal').style.display = 'flex';
  lucide.createIcons();
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
  editingId = null;
  closeProductDropdown();
}

function submitSupplierForm() {
  const name        = document.getElementById('sName').value.trim();
  const phone       = document.getElementById('sPhone').value.trim();
  const email       = document.getElementById('sEmail').value.trim();
  const companyName = document.getElementById('sCompanyName').value.trim();
  const address     = document.getElementById('sAddress').value.trim();
  const productIds  = [...selectedProductIds];

  const products = productIds.map(id => {
    const p = allApiProducts.find(x => x.id === id);
    return p ? p.name : '';
  }).filter(Boolean);

  const fileInput = document.getElementById('sImageFile');
  const previewImg = document.getElementById('sImagePreviewImg');
  const newDataUrl = (fileInput && fileInput.files[0]) ? previewImg.src : null;

  if (!name) { showErrorModal('Supplier name is required.'); return; }

  const saveBtn = document.getElementById('saveSupplierBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    if (editingId !== null) {
      const idx = suppliers.findIndex(s => s.id === editingId);
      if (idx !== -1) {
        const image = newDataUrl !== null ? newDataUrl : suppliers[idx].image;
        suppliers[idx] = { ...suppliers[idx], name, phone, email, companyName, address, products, productIds, image };
      }
    } else {
      const image = newDataUrl || '';
      suppliers.push({ id: nextId++, name, phone, email, companyName, address, products, productIds, image });
    }

    const saved = saveSuppliers();
    if (!saved) {
      showErrorModal('Failed to save supplier. LocalStorage may be full.');
      return;
    }

    updateSupplierProductMapping();
    closeSupplierModal();
    renderSuppliers(suppliers);
    showSuccessModal(editingId !== null ? 'Supplier updated successfully!' : 'Supplier added successfully!');

  } catch (err) {
    console.error('Error saving supplier:', err);
    showErrorModal('An unexpected error occurred while saving.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingId !== null ? 'Save Changes' : 'Save';
  }
}

// ── Supplier-Product Mapping ───────────────────────────────────
function updateSupplierProductMapping() {
  const mapping = {};
  suppliers.forEach(s => {
    (s.productIds || []).forEach(pid => {
      mapping[pid] = {
        supplierName: s.name || s.owner || '',
        supplierPhone: s.phone || '',
        supplierEmail: s.email || '',
        supplierCompany: s.companyName || s.company || ''
      };
    });
  });
  try {
    localStorage.setItem('haneus_supplier_product_map', JSON.stringify(mapping));
  } catch (e) {
    console.error('Failed to save supplier-product mapping:', e);
  }
}

// ── Delete Modal ───────────────────────────────────────────────
function openDeleteModal(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  deletingId = id;
  document.getElementById('deleteMsg').textContent =
    `Delete supplier "${s.name || s.owner || 'Unknown'}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
  lucide.createIcons();
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deletingId = null;
}

function confirmDelete() {
  suppliers = suppliers.filter(s => s.id !== deletingId);
  saveSuppliers();
  updateSupplierProductMapping();
  closeDeleteModal();
  renderSuppliers(suppliers);
  showSuccessModal('Supplier deleted successfully.');
}

// ── Overlay click to close ─────────────────────────────────────
window.addEventListener('click', e => {
  if (e.target === document.getElementById('supplierModal')) closeSupplierModal();
  if (e.target === document.getElementById('deleteModal'))   closeDeleteModal();
  if (e.target === document.getElementById('viewSupplierModal')) closeViewSupplierModal();
});

// ── Keyboard close ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSupplierModal();
    closeDeleteModal();
    closeViewSupplierModal();
  }
});

// ── Search ─────────────────────────────────────────────────────
document.getElementById('supplierSearch')?.addEventListener('input', applySearch);

// ── Init ───────────────────────────────────────────────────────
(async function init() {
  await fetchProducts();
  renderSuppliers(suppliers);
  updateSupplierProductMapping();
})();

// -- AJAX Auto-Refresh -----------------------------------------
if (typeof startAutoRefresh === 'function') {
  startAutoRefresh(async () => { await fetchProducts(); renderSuppliers(suppliers); }, 30000, 'supplier');
}
