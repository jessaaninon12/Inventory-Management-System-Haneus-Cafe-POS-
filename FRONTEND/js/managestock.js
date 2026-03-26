/* =================================================================
   managestock.js — Inventory table: status badges, relative time,
   view / edit-stock / delete modals.
================================================================= */
'use strict';
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let loadedProducts = [];
let editingProductId = null;
let deletingProductId = null;
let currentPage = 1;
let totalPages = 1;
let totalProductCount = 0;

// ── Helpers ─────────────────────────────────────────────────────
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getStockStatus(p) {
  const threshold = p.low_stock_threshold || 10;
  if (!p.stock || p.stock <= 0)                    return { label: 'Out of Stock', cls: 'status-out' };
  if (p.stock <= Math.floor(threshold / 2))         return { label: 'Critical',     cls: 'status-critical' };
  if (p.stock <= threshold)                         return { label: 'Low Stock',    cls: 'status-low' };
  return                                                   { label: 'In Stock',     cls: 'status-ok' };
}

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const d    = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs  / 24);
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (secs < 60)  return 'Just now';
  if (mins < 60)  return `${mins} min${mins > 1 ? 's' : ''} ago`;
  if (hrs  < 24)  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  if (days === 1) return `Yesterday, ${timeStr}`;
  if (days < 7)   return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Load / Render with Pagination ──────────────────────────
async function loadProducts(pageNum = 1) {
  const tbody = document.getElementById('stockTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mocha);padding:2rem;">Loading…</td></tr>';
  try {
    // Fetch paginated products (30 per page)
    const res = await fetch(`${API}/products/view/?page=${pageNum}&limit=30`);
    const data = await res.json();
    
    // Handle both paginated and non-paginated responses for backward compatibility
    if (data.products) {
      loadedProducts = data.products;
      currentPage = data.page || pageNum;
      totalPages = data.total_pages || 1;
      totalProductCount = data.total_count || 0;
    } else {
      // Fallback for non-paginated response
      loadedProducts = Array.isArray(data) ? data : data.results || [];
      currentPage = 1;
      totalPages = 1;
      totalProductCount = loadedProducts.length;
    }
    
    renderTable(loadedProducts);
    renderPaginationControls();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#dc2626;padding:2rem;">Failed to load products. Is the backend running?</td></tr>';
  }
}

function renderPaginationControls() {
  const container = document.getElementById('paginationControls');
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination-controls" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-radius: 0.5rem;">';
  html += `<span style="color: #666; font-size: 0.875rem;">Page ${currentPage} of ${totalPages} (${totalProductCount} total)</span>`;
  html += '<div style="display: flex; gap: 0.5rem;">';
  
  // Previous button
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 0.375rem; background: white; cursor: pointer; font-size: 0.875rem;">← Prev</button>`;
  
  // Page numbers
  const pageStart = Math.max(1, currentPage - 2);
  const pageEnd = Math.min(totalPages, currentPage + 2);
  
  for (let i = pageStart; i <= pageEnd; i++) {
    const isActive = i === currentPage;
    html += `<button class="page-btn" onclick="goToPage(${i})" style="padding: 0.5rem 0.75rem; border: 1px solid ${isActive ? '#c47b42' : '#ddd'}; border-radius: 0.375rem; background: ${isActive ? '#c47b42' : 'white'}; color: ${isActive ? 'white' : '#333'}; cursor: pointer; font-size: 0.875rem; font-weight: ${isActive ? 'bold' : 'normal'};">${i}</button>`;
  }
  
  // Next button
  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="padding: 0.5rem 0.75rem; border: 1px solid #ddd; border-radius: 0.375rem; background: white; cursor: pointer; font-size: 0.875rem;">Next →</button>`;
  
  html += '</div></div>';
  container.innerHTML = html;
}

function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages) return;
  loadProducts(pageNum);
}

function renderTable(products) {
  const tbody = document.getElementById('stockTableBody');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--mocha);padding:2.5rem;">No products found.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(p => {
    const status   = getStockStatus(p);
    const updated  = relativeTime(p.updated_at);
    const category = escHtml(p.category || 'Uncategorized');
    return `
      <tr data-product-id="${p.id}">
        <td><span class="product-name">${escHtml(p.name)}</span></td>
        <td><span class="category-tag">${category}</span></td>
        <td><span class="updated-time">${updated}</span></td>
        <td><span class="status-badge ${status.cls}">${status.label}</span></td>
        <td>
          <div class="action-icons">
            <button class="action-btn action-view" title="View" onclick="openViewModal(${p.id})">
              <i data-lucide="eye"></i>
            </button>
            <button class="action-btn action-edit" title="Edit Stock" onclick="openEditStockModal(${p.id})">
              <i data-lucide="pencil"></i>
            </button>
            <button class="action-btn action-delete" title="Delete" onclick="openDeleteStockModal(${p.id})">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
  lucide.createIcons();
}

// ── Search ────────────────────────────────────────────────────
document.querySelector('.search-input')?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#stockTableBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

// ── View Modal ───────────────────────────────────────────────
function openViewModal(productId) {
  const p = loadedProducts.find(x => x.id === productId);
  if (!p) return;
  const status = getStockStatus(p);
  document.getElementById('viewModalContent').innerHTML = `
    <div class="ms-detail-row"><span class="ms-detail-label">Product Name</span><span class="ms-detail-val">${escHtml(p.name)}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Category</span><span class="ms-detail-val">${escHtml(p.category || 'Uncategorized')}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Current Stock</span><span class="ms-detail-val">${p.stock} ${escHtml(p.unit || '')}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Reorder Threshold</span><span class="ms-detail-val">${p.low_stock_threshold || 10}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Status</span><span class="status-badge ${status.cls}">${status.label}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Last Updated</span><span class="ms-detail-val">${p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Supplier Name</span><span class="ms-detail-val">${p.supplier_name ? escHtml(p.supplier_name) : 'No supplier info'}</span></div>
    <div class="ms-detail-row"><span class="ms-detail-label">Supplier Contact</span><span class="ms-detail-val">${p.supplier_contact ? escHtml(p.supplier_contact) : '—'}</span></div>
    ${p.description ? `<div class="ms-detail-row"><span class="ms-detail-label">Description</span><span class="ms-detail-val">${escHtml(p.description)}</span></div>` : ''}
  `;
  document.getElementById('viewModal').style.display = 'flex';
  lucide.createIcons();
}
function closeViewModal() {
  document.getElementById('viewModal').style.display = 'none';
}

// ── Edit Stock Modal ───────────────────────────────────────────
function openEditStockModal(productId) {
  const p = loadedProducts.find(x => x.id === productId);
  if (!p) return;
  editingProductId = productId;
  document.getElementById('editStockProductName').textContent = p.name;
  document.getElementById('editStockCurrentVal').textContent  = `${p.stock} ${p.unit || ''}`;
  document.getElementById('editStockQty').value               = 0;
  document.getElementById('editStockNotes').value             = '';
  document.getElementById('editStockModal').style.display = 'flex';
  lucide.createIcons();
}
function closeEditStockModal() {
  document.getElementById('editStockModal').style.display = 'none';
  editingProductId = null;
}
function msAdjust(delta) {
  const inp = document.getElementById('editStockQty');
  inp.value = parseInt(inp.value || 0) + delta;
}
async function submitEditStock() {
  const qty   = parseInt(document.getElementById('editStockQty').value || 0);
  const notes = document.getElementById('editStockNotes').value.trim();
  if (qty === 0) { showErrorModal('Please enter a non-zero adjustment.'); return; }
  try {
    const res = await fetch(`${API}/inventory/adjust/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: editingProductId,
        quantity_change: qty,
        transaction_type: 'adjustment',
        reference: '',
        notes: notes || 'Manual adjustment from Manage Stock',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      showErrorModal('Adjustment failed: ' + JSON.stringify(err.errors || err));
      return;
    }
    closeEditStockModal();
    loadProducts();
  } catch (e) {
    showErrorModal('Failed to adjust stock. Is the backend running?');
  }
}

// ── Delete Modal ───────────────────────────────────────────────
function openDeleteStockModal(productId) {
  const p = loadedProducts.find(x => x.id === productId);
  if (!p) return;
  deletingProductId = productId;
  document.getElementById('deleteStockMsg').textContent =
    `Delete "${p.name}"? This will permanently remove this product from inventory and cannot be undone.`;
  document.getElementById('deleteStockModal').style.display = 'flex';
  lucide.createIcons();
}
function closeDeleteStockModal() {
  document.getElementById('deleteStockModal').style.display = 'none';
  deletingProductId = null;
}
async function confirmDeleteStock() {
  if (!deletingProductId) return;
  try {
    const res = await fetch(`${API}/products/${deletingProductId}/delete/`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      showErrorModal('Delete failed: ' + JSON.stringify(err));
      return;
    }
    closeDeleteStockModal();
    loadProducts();
  } catch (e) {
    showErrorModal('Failed to delete product. Is the backend running?');
  }
}

// ── Receive New Stock Modal ──────────────────────────────────
function openReceiveStockModal() {
  const select = document.getElementById('receiveProduct');
  select.innerHTML = loadedProducts.map(p =>
    `<option value="${p.id}">${escHtml(p.name)} — ${p.stock} ${p.unit || ''}</option>`
  ).join('');
  document.getElementById('receiveQuantity').value = 1;
  document.getElementById('receiveSupplier').value = '';
  document.getElementById('receiveNotes').value    = '';
  document.getElementById('receiveStockModal').style.display = 'flex';
  lucide.createIcons();
}
function closeReceiveStockModal() {
  document.getElementById('receiveStockModal').style.display = 'none';
}
async function submitReceiveStock() {
  const product_id = parseInt(document.getElementById('receiveProduct').value);
  const quantity   = parseInt(document.getElementById('receiveQuantity').value);
  const supplier   = document.getElementById('receiveSupplier').value.trim();
  const notes      = document.getElementById('receiveNotes').value.trim();
  if (!product_id || !quantity || quantity <= 0) { showErrorModal('Please select a product and enter a valid quantity.'); return; }
  try {
    const res = await fetch(`${API}/inventory/adjust/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id, quantity_change: quantity,
        transaction_type: 'stock_in',
        reference: supplier || '',
        notes: notes || 'Received new stock',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      showErrorModal('Receive failed: ' + JSON.stringify(err.errors || err));
      return;
    }
    closeReceiveStockModal();
    loadProducts();
  } catch (e) { showErrorModal('Failed to receive stock.'); }
}

// ── Export CSV ────────────────────────────────────────────────
function exportStockCsv() {
  if (!loadedProducts.length) { showInfoModal('No data to export.'); return; }
  const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const hdr = ['Product Name', 'Category', 'Stock', 'Unit', 'Status', 'Last Updated'];
  const rows = loadedProducts.map(p => {
    const status = getStockStatus(p);
    return [p.name, p.category || '', p.stock, p.unit || '', status.label, p.updated_at || ''].map(esc).join(',');
  });
  const blob = new Blob([[hdr.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `inventory_${new Date().toISOString().slice(0,10)}.csv`,
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
document.getElementById('exportCsvBtn')?.addEventListener('click', exportStockCsv);

// ── Low Stock Floating Modal ──────────────────────────────────
async function openLowStockModal() {
  document.getElementById('lowStockModal').style.display = 'flex';
  lucide.createIcons();
  await loadLowStockForModal();
}
function closeLowStockModal() { document.getElementById('lowStockModal').style.display = 'none'; }
function handleLsOverlayClick(e) { if (e.target === document.getElementById('lowStockModal')) closeLowStockModal(); }

async function loadLowStockForModal() {
  const content  = document.getElementById('lowStockContent');
  const badge    = document.getElementById('lsCountBadge');
  const btnBadge = document.getElementById('lowStockBadge');
  try {
    const res      = await fetch(`${API}/products/low-stock/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    const count    = products.length;
    if (badge) badge.textContent = count;
    if (btnBadge) { btnBadge.textContent = count; btnBadge.style.display = count > 0 ? 'inline' : 'none'; }
    if (!count) {
      content.innerHTML = `<div style="text-align:center;padding:2.5rem 1rem;"><i data-lucide="check-circle" style="width:40px;height:40px;color:#16a34a;display:block;margin:0 auto 0.75rem;"></i><p style="color:var(--mocha);font-size:0.9rem;">All products are well-stocked!</p></div>`;
      lucide.createIcons(); return;
    }
    content.innerHTML = products.map(p => {
      const isCritical = p.stock <= p.low_stock_threshold / 2;
      const tagCls  = isCritical ? 'ls-critical' : 'ls-low';
      const tagText = isCritical ? `Critical — ${p.stock} left` : `Low — ${p.stock} left`;
      return `<div class="ls-item"><div><div class="ls-item-name">${escHtml(p.name)}</div><div class="ls-item-meta">${escHtml(p.category)} &bull; Reorder at ${p.low_stock_threshold}</div></div><span class="ls-stock-tag ${tagCls}">${tagText}</span></div>`;
    }).join('');
    lucide.createIcons();
  } catch (e) {
    console.error(e);
    content.innerHTML = '<p style="text-align:center;color:#dc2626;padding:1.5rem;">Failed to load low-stock data.</p>';
  }
}

// ── Overlay click close ───────────────────────────────────────────
['viewModal','editStockModal','deleteStockModal','receiveStockModal'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', e => {
    if (e.target === el) {
      if (id === 'viewModal')         closeViewModal();
      if (id === 'editStockModal')    closeEditStockModal();
      if (id === 'deleteStockModal')  closeDeleteStockModal();
      if (id === 'receiveStockModal') closeReceiveStockModal();
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeViewModal();
    closeEditStockModal();
    closeDeleteStockModal();
    closeReceiveStockModal();
    closeLowStockModal();
  }
});

// ── Receive Stock button ─────────────────────────────────────────
document.getElementById('receiveStockBtn')?.addEventListener('click', openReceiveStockModal);

// ── Low stock badge on page load ───────────────────────────────
(async function initLowStockBadge() {
  try {
    const res = await fetch(`${API}/products/low-stock/`);
    if (!res.ok) return;
    const products = await res.json();
    const btnBadge = document.getElementById('lowStockBadge');
    if (btnBadge && products.length > 0) {
      btnBadge.textContent = products.length;
      btnBadge.style.display = 'inline';
    }
  } catch { /* silent */ }
}());

// ── Init ──────────────────────────────────────────────────────
loadProducts();

