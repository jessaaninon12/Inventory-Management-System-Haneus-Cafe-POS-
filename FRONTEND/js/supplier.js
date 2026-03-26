/* =================================================================
   supplier.js — Supplier card grid with add / edit / delete.
   Data is stored in-memory (extend to use an API when available).
================================================================= */
'use strict';

lucide.createIcons();

// ── Seed data ──────────────────────────────────────────────────
let suppliers = [
  {
    id: 1,
    company:  'Zaldy Co and Friend',
    owner:    'John Adrian James Tabamo Pabuto',
    email:    'jamesadrianpabuto@gmail.com',
    phone:    '(63+) 9010123921',
    address:  'BRGY Balbautog Sitio Uwagan Purok Insan',
    products: ['Paracetamol', 'Grass'],
    image:    '',
  }
];
let nextId = 2;
let editingId   = null;
let deletingId  = null;

// ── Helpers ────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const FALLBACK_IMG = 'https://ui-avatars.com/api/?name=Supplier&background=c47b42&color=fff&size=80';

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
    const tags = (s.products || [])
      .map(p => `<span class="product-tag">${escHtml(p)}</span>`)
      .join('');

    return `
      <div class="supplier-card">
        <div class="supplier-card-actions">
          <button class="btn-icon btn-icon-edit" title="Edit" onclick="openEditModal(${s.id})">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-icon btn-icon-del" title="Delete" onclick="openDeleteModal(${s.id})">
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        <div class="supplier-body">
          <div class="supplier-info">
            <div class="supplier-company">${escHtml(s.company)}</div>
            <div class="supplier-owner">
              <i data-lucide="user"></i>
              ${escHtml(s.owner)}
            </div>
            <div class="supplier-detail">
              <i data-lucide="mail"></i>
              <a href="mailto:${escHtml(s.email)}">${escHtml(s.email)}</a>
            </div>
            <div class="supplier-detail">
              <i data-lucide="phone"></i>
              ${escHtml(s.phone)}
            </div>
            <div class="supplier-detail">
              <i data-lucide="map-pin"></i>
              ${escHtml(s.address)}
            </div>
          </div>
          <div class="supplier-img-wrap">
            <img class="supplier-img" src="${escHtml(img)}" alt="${escHtml(s.company)}"
                 onerror="this.src='${FALLBACK_IMG}'" loading="lazy" />
          </div>
        </div>

        ${tags ? `
        <div>
          <div class="supplier-products-label">Supplied Products</div>
          <div class="supplier-tags">${tags}</div>
        </div>` : ''}
      </div>`;
  }).join('');

  lucide.createIcons();
}

function applySearch() {
  const q = (document.getElementById('supplierSearch')?.value || '').toLowerCase();
  const filtered = suppliers.filter(s =>
    s.company.toLowerCase().includes(q) ||
    s.owner.toLowerCase().includes(q)   ||
    s.email.toLowerCase().includes(q)
  );
  renderSuppliers(filtered);
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
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Add Supplier';
  document.getElementById('sCompany').value  = '';
  document.getElementById('sOwner').value    = '';
  document.getElementById('sEmail').value    = '';
  document.getElementById('sPhone').value    = '';
  document.getElementById('sAddress').value  = '';
  document.getElementById('sProducts').value = '';
  clearFileInput();
  document.getElementById('supplierModal').style.display = 'flex';
  lucide.createIcons();
}

// ── Edit Supplier Modal ────────────────────────────────────────
function openEditModal(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('modalTitle').textContent  = 'Edit Supplier';
  document.getElementById('sCompany').value   = s.company;
  document.getElementById('sOwner').value     = s.owner;
  document.getElementById('sEmail').value     = s.email;
  document.getElementById('sPhone').value     = s.phone;
  document.getElementById('sAddress').value   = s.address;
  document.getElementById('sProducts').value  = (s.products || []).join(', ');
  clearFileInput();
  if (s.image) setImagePreview(s.image);
  document.getElementById('supplierModal').style.display = 'flex';
  lucide.createIcons();
}

function closeSupplierModal() {
  document.getElementById('supplierModal').style.display = 'none';
  editingId = null;
}

function submitSupplierForm() {
  const company  = document.getElementById('sCompany').value.trim();
  const owner    = document.getElementById('sOwner').value.trim();
  const email    = document.getElementById('sEmail').value.trim();
  const phone    = document.getElementById('sPhone').value.trim();
  const address  = document.getElementById('sAddress').value.trim();
  const products = document.getElementById('sProducts').value
    .split(',').map(p => p.trim()).filter(Boolean);

  // Resolve image: prefer newly selected file, else keep existing
  const fileInput = document.getElementById('sImageFile');
  const previewImg = document.getElementById('sImagePreviewImg');
  const newDataUrl = (fileInput && fileInput.files[0]) ? previewImg.src : null;

  if (!company) { showErrorModal('Company name is required.'); return; }
  if (!owner)   { showErrorModal('Owner name is required.');   return; }

  if (editingId !== null) {
    const idx = suppliers.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      const image = newDataUrl !== null ? newDataUrl : suppliers[idx].image;
      suppliers[idx] = { ...suppliers[idx], company, owner, email, phone, address, products, image };
    }
  } else {
    const image = newDataUrl || '';
    suppliers.push({ id: nextId++, company, owner, email, phone, address, products, image });
  }

  closeSupplierModal();
  renderSuppliers(suppliers);
}

// ── Delete Modal ───────────────────────────────────────────────
function openDeleteModal(id) {
  const s = suppliers.find(x => x.id === id);
  if (!s) return;
  deletingId = id;
  document.getElementById('deleteMsg').textContent =
    `Delete supplier "${s.company}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
  lucide.createIcons();
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deletingId = null;
}

function confirmDelete() {
  suppliers = suppliers.filter(s => s.id !== deletingId);
  closeDeleteModal();
  renderSuppliers(suppliers);
}

// ── Overlay click to close ─────────────────────────────────────
window.addEventListener('click', e => {
  if (e.target === document.getElementById('supplierModal')) closeSupplierModal();
  if (e.target === document.getElementById('deleteModal'))   closeDeleteModal();
});

// ── Keyboard close ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSupplierModal();
    closeDeleteModal();
  }
});

// ── Search ─────────────────────────────────────────────────────
document.getElementById('supplierSearch')?.addEventListener('input', applySearch);

// ── Init ───────────────────────────────────────────────────────
renderSuppliers(suppliers);
