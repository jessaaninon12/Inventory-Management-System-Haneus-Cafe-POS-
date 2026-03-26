// Sales page — API-driven (reads live POS sale data from /api/sales/view/)
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let allOrders = [];          // holds POS sales from SaleModel
let currentViewingOrder = null;
let currentRefundingOrder = null;

// ── Pagination state ───────────────────────────────────────────────
let salesCurrentPage      = 1;
const salesItemsPerPage   = 15;
let salesTotalPages        = 1;
let currentFilteredOrders = [];

function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '\u20b1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _fmtDate(isoStr) {
  if (!isoStr) return '\u2014';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
           + ' \u2022 '
           + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return isoStr; }
}

// ---------- Summary cards ----------
async function loadAnalytics() {
  try {
    const res = await fetch(`${API}/sales/analytics/`);
    if (!res.ok) throw new Error();
    const d = await res.json();
    document.getElementById('salesToday').textContent   = formatPeso(d.todays_sales);
    document.getElementById('salesWeek').textContent    = formatPeso(d.this_week_sales);
    document.getElementById('pendingOrders').textContent = d.pending_orders;
    document.getElementById('avgOrder').textContent     = formatPeso(d.average_order);
  } catch (e) { console.error('Analytics load failed', e); }
}

// ---------- Sales table — reads from POS endpoint ----------
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  try {
    // Load POS transactions from SaleModel
    const res = await fetch(`${API}/sales/view/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allOrders = await res.json();
    renderOrders(allOrders);
  } catch (e) {
    console.error('Sales load failed', e);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Failed to load sales. Make sure the backend is running.</td></tr>';
  }
}

function renderOrders(orders) {
  currentFilteredOrders = orders || [];
  salesCurrentPage = 1;
  salesTotalPages = Math.max(1, Math.ceil(currentFilteredOrders.length / salesItemsPerPage));
  _renderOrderRows();
  renderSalesPagination();
}

function _renderOrderRows() {
  const tbody = document.getElementById('ordersTableBody');
  const start = (salesCurrentPage - 1) * salesItemsPerPage;
  const pageOrders = currentFilteredOrders.slice(start, start + salesItemsPerPage);
  if (!pageOrders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No sales records found.</td></tr>';
    return;
  }
  tbody.innerHTML = pageOrders.map(o => {
    // POS sale fields: id, receipt_number, sale_id, customer_name, created_at, items_count, total, status
    const orderId   = o.receipt_number || o.sale_id || String(o.id);
    const dateStr   = _fmtDate(o.created_at);
    const itemCount = (o.items && o.items.length) || o.items_count || 0;
    const statusCls = o.status === 'Completed' ? 'status-completed'
                    : o.status === 'Pending'   ? 'status-pending'
                    : 'status-cancelled';
    const refundBtn  = o.status === 'Pending'
      ? `<button class="btn btn-small btn-refund" onclick="openRefundModal(${o.id})">Refund</button>` : '';
    const completeBtn = o.status === 'Pending'
      ? `<button class="btn btn-small btn-edit" onclick="completeOrder(${o.id})">Complete</button>` : '';
    return `
      <tr data-order-id="${orderId}" data-status="${o.status.toLowerCase()}">
        <td>#${orderId}</td>
        <td>${o.customer_name || 'Walk-in'}</td>
        <td>${dateStr}</td>
        <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
        <td class="amount">${formatPeso(o.total)}</td>
        <td><span class="status ${statusCls}">${o.status}</span></td>
        <td class="actions">
          <button class="btn btn-small btn-view" onclick="openOrderModal(${o.id})">View</button>
          ${completeBtn}
          ${refundBtn}
        </td>
      </tr>`;
  }).join('');
}

function renderSalesPagination() {
  const container = document.getElementById('paginationControls');
  if (!container) return;
  if (salesTotalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="goToSalesPage(${salesCurrentPage - 1})" ${salesCurrentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
  let startPage = Math.max(1, salesCurrentPage - 2);
  let endPage   = Math.min(salesTotalPages, salesCurrentPage + 2);
  if (endPage - startPage < 4) {
    if (startPage === 1) endPage   = Math.min(salesTotalPages, startPage + 4);
    if (endPage === salesTotalPages) startPage = Math.max(1, endPage - 4);
  }
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === salesCurrentPage ? 'active' : ''}" onclick="goToSalesPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goToSalesPage(${salesCurrentPage + 1})" ${salesCurrentPage === salesTotalPages ? 'disabled' : ''}>Next ›</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToSalesPage(page) {
  if (page < 1 || page > salesTotalPages) return;
  salesCurrentPage = page;
  _renderOrderRows();
  renderSalesPagination();
}

// ---------- Filters ----------
document.querySelector('.search-input')?.addEventListener('input', applyFilters);
document.querySelectorAll('.controls select').forEach(sel => sel.addEventListener('change', applyFilters));

function applyFilters() {
  const q = document.querySelector('.search-input')?.value.toLowerCase() || '';
  const selects = document.querySelectorAll('.controls select');
  const statusFilter = selects[0]?.value || 'All Status';
  const dateFilter = selects[1]?.value || 'This Month';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monday = new Date(today); monday.setDate(today.getDate() - dayOfWeek);
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = allOrders.filter(o => {
    // Search across receipt_number, sale_id, customer_name, total
    const text = `${o.receipt_number || ''} ${o.sale_id || ''} ${o.customer_name || ''} ${o.total || ''}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    // Status filter
    if (statusFilter !== 'All Status' && o.status !== statusFilter) return false;
    // Date filter — POS sales use created_at
    if (o.created_at) {
      const d = new Date(o.created_at);
      if (dateFilter === 'Today' && d < today) return false;
      if (dateFilter === 'This Week' && d < monday) return false;
      if (dateFilter === 'This Month' && d < firstOfMonth) return false;
    }
    return true;
  });
  renderOrders(filtered);
}

// ---------- View Order Modal — reads from POS /api/sales/view/<pk>/ ----------
async function openOrderModal(pk) {
  try {
    const res = await fetch(`${API}/sales/view/${pk}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const o = await res.json();
    currentViewingOrder = o;

    const receiptId = o.receipt_number || o.sale_id || String(o.id);
    document.getElementById('orderTitle').textContent = `Receipt #${receiptId}`;

    const statusColor = o.status === 'Completed' ? '#15803d' : o.status === 'Pending' ? '#ea580c' : '#666';
    const dateStr = _fmtDate(o.created_at);

    // Build items list
    let itemsHTML = '<ul style="list-style:none;padding:0;margin:0;">';
    (o.items || []).forEach(i => {
      const lineTotal = formatPeso(i.subtotal || i.total || (parseFloat(i.unit_price) * i.quantity));
      itemsHTML += `<li style="padding:0.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;">
        <span>${i.product_name} &times;${i.quantity}</span>
        <span style="font-weight:500;">${lineTotal}</span>
      </li>`;
    });
    itemsHTML += '</ul>';

    document.getElementById('orderDetails').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem 1.5rem;margin-bottom:1.5rem;">
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Receipt #</p><p style="font-weight:600;">${receiptId}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Customer #</p><p style="font-weight:600;">${o.customer_number || '\u2014'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Customer</p><p style="font-weight:500;">${o.customer_name || 'Walk-in'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Cashier</p><p style="font-weight:500;">${o.cashier_name || '\u2014'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Order Type</p><p style="font-weight:500;">${o.order_type || '\u2014'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Table</p><p style="font-weight:500;">${o.table_number || '\u2014'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Payment</p><p style="font-weight:500;">${o.payment_method || '\u2014'}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Date / Time</p><p style="font-weight:500;">${dateStr}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Status</p><p style="font-weight:600;color:${statusColor};">${o.status}</p></div>
        <div><p style="color:#999;font-size:0.8rem;margin-bottom:0.2rem;">Total</p><p style="font-weight:700;font-size:1.1rem;">${formatPeso(o.total)}</p></div>
      </div>
      <div style="margin-bottom:0.75rem;padding:0.75rem;background:#f8f4f0;border-radius:6px;display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;font-size:0.85rem;">
        <div><span style="color:#999;">Subtotal:</span> <strong>${formatPeso(o.subtotal)}</strong></div>
        <div><span style="color:#999;">Discount:</span> <strong>${formatPeso(o.discount)}</strong></div>
        <div><span style="color:#999;">VAT (12%):</span> <strong>${formatPeso(o.tax)}</strong></div>
        <div><span style="color:#999;">Tendered:</span> <strong>${formatPeso(o.amount_tendered)}</strong></div>
        <div><span style="color:#999;">Change:</span> <strong>${formatPeso(o.change_amount)}</strong></div>
      </div>
      <div><h3 style="margin:1rem 0 0.5rem;">Order Items</h3>${itemsHTML}</div>
    `;
    document.getElementById('orderModal').style.display = 'flex';
  } catch (e) {
    console.error('openOrderModal failed:', e);
    showErrorModal('Could not load sale details.');
  }
}

function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
  currentViewingOrder = null;
}

// ---------- Refund (Cancel) Modal ----------
function openRefundModal(pk) {
  const o = allOrders.find(x => x.id === pk);
  if (!o) return;
  currentRefundingOrder = o;
  const receiptId = o.receipt_number || o.sale_id || String(o.id);
  document.getElementById('refundDetails').innerHTML = `
    <div style="display:grid;gap:1rem;padding:1rem;background:#f5f5f5;border-radius:4px;">
      <div><p style="color:#999;font-size:0.875rem;">Receipt #</p><p style="font-weight:500;">${receiptId}</p></div>
      <div><p style="color:#999;font-size:0.875rem;">Customer</p><p style="font-weight:500;">${o.customer_name || 'Walk-in'}</p></div>
      <div><p style="color:#999;font-size:0.875rem;">Refund Amount</p><p style="font-weight:600;font-size:1.25rem;color:#15803d;">${formatPeso(o.total)}</p></div>
    </div>
  `;
  document.getElementById('refundModal').style.display = 'flex';
}

function closeRefundModal() {
  document.getElementById('refundModal').style.display = 'none';
  document.getElementById('refundForm').reset();
  currentRefundingOrder = null;
}

document.getElementById('refundForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!currentRefundingOrder) return;
  const reason = document.getElementById('refundReason').value;
  if (!reason) { showErrorModal('Please select a refund reason'); return; }

  try {
    // PATCH the POS sale status to Cancelled
    const res = await fetch(`${API}/sales/partialedit/${currentRefundingOrder.id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    if (!res.ok) {
      const err = await res.json();
      showErrorModal('Refund failed: ' + (err.error || err.errors || JSON.stringify(err)));
      return;
    }
    const receiptId = currentRefundingOrder.receipt_number || currentRefundingOrder.sale_id || String(currentRefundingOrder.id);
    showSuccessModal(`Refund processed for sale #${receiptId}!`);
    closeRefundModal();
    loadOrders();
    loadAnalytics();
  } catch (err) { showErrorModal('Failed to process refund.'); }
});

async function completeOrder(pk) {
  if (!pk) return;
  showConfirmModal('Mark this sale as Completed?', () => {
    _completeOrderConfirmed(pk);
  });
}

async function _completeOrderConfirmed(pk) {
  try {
    // PATCH the POS sale status to Completed
    const res = await fetch(`${API}/sales/partialedit/${pk}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' }),
    });
    if (!res.ok) {
      const err = await res.json();
      showErrorModal('Complete failed: ' + (err.error || err.errors || JSON.stringify(err)));
      return;
    }
    showSuccessModal('Sale marked as Completed.');
    loadOrders();
    loadAnalytics();
  } catch (err) { showErrorModal('Failed to complete sale.'); }
}

// ---------- Close modals on outside click ----------
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('orderModal')) closeOrderModal();
  if (event.target === document.getElementById('refundModal')) closeRefundModal();
});

function exportSalesCsv() {
  // Export from the in-memory allOrders array (POS sales)
  if (!allOrders.length) { showErrorModal('No sales to export.'); return; }
  const header = ['Receipt #', 'Customer', 'Date/Time', 'Items', 'Subtotal', 'Discount', 'Tax (12%)', 'Total', 'Payment', 'Status'];
  const escapeCell = (v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [header.join(',')];
  allOrders.forEach(o => {
    const receiptId = o.receipt_number || o.sale_id || String(o.id);
    const itemCount = (o.items && o.items.length) || o.items_count || 0;
    lines.push([
      '#' + receiptId,
      o.customer_name || 'Walk-in',
      _fmtDate(o.created_at),
      itemCount + ' item(s)',
      parseFloat(o.subtotal || 0).toFixed(2),
      parseFloat(o.discount || 0).toFixed(2),
      parseFloat(o.tax || 0).toFixed(2),
      parseFloat(o.total || 0).toFixed(2),
      o.payment_method || '',
      o.status || '',
    ].map(escapeCell).join(','));
  });
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date();
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  a.href = url;
  a.download = `sales_${y}-${mo}-${d}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
document.getElementById('exportSalesBtn')?.addEventListener('click', exportSalesCsv);
// ---------- Init ----------
loadAnalytics();
loadOrders();
