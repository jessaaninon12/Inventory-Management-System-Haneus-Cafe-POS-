// Sales page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let allOrders = [];
let currentViewingOrder = null;
let currentRefundingOrder = null;

function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '\u20b1' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Summary cards ----------
async function loadAnalytics() {
  try {
    const res = await fetch(`${API}/sales/analytics/`);
    if (!res.ok) throw new Error();
    const d = await res.json();
    document.getElementById('salesToday').textContent = formatPeso(d.todays_sales);
    document.getElementById('salesWeek').textContent = formatPeso(d.this_week_sales);
    document.getElementById('pendingOrders').textContent = d.pending_orders;
    document.getElementById('avgOrder').textContent = formatPeso(d.average_order);
  } catch (e) { console.error('Analytics load failed', e); }
}

// ---------- Orders table ----------
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  try {
    const res = await fetch(`${API}/orders/`);
    if (!res.ok) throw new Error();
    allOrders = await res.json();
    renderOrders(allOrders);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Failed to load orders.</td></tr>';
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>';
    return;
  }
  tbody.innerHTML = orders.map(o => {
    const d = o.date ? new Date(o.date) : null;
    const dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' \u2022 ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '\u2014';
    const statusCls = o.status === 'Completed' ? 'status-completed' : o.status === 'Pending' ? 'status-pending' : 'status-cancelled';
    const refundBtn = o.status === 'Pending' ? `<button class="btn btn-small btn-refund" onclick="openRefundModal(${o.id})">Refund</button>` : '';
    return `
      <tr data-order-id="${o.order_id}" data-status="${o.status.toLowerCase()}">
        <td>#${o.order_id}</td>
        <td>${o.customer_name}</td>
        <td>${dateStr}</td>
        <td>${o.items_count} items</td>
        <td class="amount">${formatPeso(o.total)}</td>
        <td><span class="status ${statusCls}">${o.status}</span></td>
        <td class="actions">
          <button class="btn btn-small btn-view" onclick="openOrderModal(${o.id})">View</button>
          ${refundBtn}
        </td>
      </tr>`;
  }).join('');
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
    // Search
    const text = `${o.order_id} ${o.customer_name} ${o.total}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    // Status
    if (statusFilter !== 'All Status' && o.status !== statusFilter) return false;
    // Date
    if (o.date) {
      const d = new Date(o.date);
      if (dateFilter === 'Today' && d < today) return false;
      if (dateFilter === 'This Week' && d < monday) return false;
      if (dateFilter === 'This Month' && d < firstOfMonth) return false;
    }
    return true;
  });
  renderOrders(filtered);
}

// ---------- View Order Modal ----------
async function openOrderModal(pk) {
  try {
    const res = await fetch(`${API}/orders/${pk}/`);
    if (!res.ok) throw new Error();
    const o = await res.json();
    currentViewingOrder = o;
    document.getElementById('orderTitle').textContent = `#${o.order_id}`;

    const statusColor = o.status === 'Completed' ? '#15803d' : o.status === 'Pending' ? '#ea580c' : '#666';
    const d = o.date ? new Date(o.date) : null;
    const dateStr = d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' \u2022 ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '\u2014';

    let itemsHTML = '<ul style="list-style:none;padding:0;">';
    (o.items || []).forEach(i => {
      itemsHTML += `<li style="padding:0.5rem 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;">
        <span>${i.product_name} x${i.quantity}</span>
        <span style="font-weight:500;">${formatPeso(i.subtotal)}</span>
      </li>`;
    });
    itemsHTML += '</ul>';

    document.getElementById('orderDetails').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem;">
        <div><p style="color:#999;font-size:0.875rem;margin-bottom:0.25rem;">Customer</p><p style="font-weight:500;font-size:1.125rem;">${o.customer_name}</p></div>
        <div><p style="color:#999;font-size:0.875rem;margin-bottom:0.25rem;">Status</p><p style="font-weight:500;font-size:1.125rem;color:${statusColor};">${o.status}</p></div>
        <div><p style="color:#999;font-size:0.875rem;margin-bottom:0.25rem;">Total Amount</p><p style="font-weight:600;font-size:1.25rem;">${formatPeso(o.total)}</p></div>
        <div><p style="color:#999;font-size:0.875rem;margin-bottom:0.25rem;">Order Date</p><p style="font-weight:500;">${dateStr}</p></div>
      </div>
      <div style="margin-top:2rem;"><h3 style="margin-bottom:1rem;">Order Items</h3>${itemsHTML}</div>
    `;
    document.getElementById('orderModal').style.display = 'flex';
  } catch (e) { alert('Could not load order details.'); }
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
  document.getElementById('refundDetails').innerHTML = `
    <div style="display:grid;gap:1rem;padding:1rem;background:#f5f5f5;border-radius:4px;">
      <div><p style="color:#999;font-size:0.875rem;">Order ID</p><p style="font-weight:500;">${o.order_id}</p></div>
      <div><p style="color:#999;font-size:0.875rem;">Customer</p><p style="font-weight:500;">${o.customer_name}</p></div>
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
  if (!reason) { alert('Please select a refund reason'); return; }

  try {
    const res = await fetch(`${API}/orders/${currentRefundingOrder.id}/cancel/`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      alert('Refund failed: ' + (err.error || JSON.stringify(err)));
      return;
    }
    alert(`Refund processed for order #${currentRefundingOrder.order_id}!`);
    closeRefundModal();
    loadOrders();
    loadAnalytics();
  } catch (err) { alert('Failed to process refund.'); }
});

// ---------- Close modals on outside click ----------
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('orderModal')) closeOrderModal();
  if (event.target === document.getElementById('refundModal')) closeRefundModal();
});

// ---------- Init ----------
loadAnalytics();
loadOrders();
