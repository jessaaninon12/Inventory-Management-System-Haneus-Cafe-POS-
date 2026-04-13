// Dashboard initialization
lucide.createIcons();

const API_BASE = "http://127.0.0.1:8000/api";

// Guard flags — tell header-common.js to skip profile flyout + notification init
window._dashboardProfileInit = true;
window._dashboardNotifInit = true;

// ── Task 10: Profile flyout toggle + populate ────────────────────────
function toggleProfileFlyout() {
  const flyout = document.getElementById('profileFlyout');
  if (flyout) flyout.style.display = flyout.style.display === 'none' ? 'block' : 'none';
}
// Close flyout on outside click
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('profileFlyoutWrapper');
  const flyout = document.getElementById('profileFlyout');
  if (flyout && wrapper && !wrapper.contains(e.target)) {
    flyout.style.display = 'none';
  }
});

// Populate profile flyout from localStorage + API
(async function initProfileFlyout() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id;
    // Set from localStorage immediately
    const nameEl = document.getElementById('flyoutUsername');
    const idEl = document.getElementById('flyoutUserId');
    const typeEl = document.getElementById('flyoutAccountType');
    if (nameEl) nameEl.textContent = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User';
    if (idEl) idEl.textContent = `ID: #${userId || '—'}`;
    if (typeEl) typeEl.textContent = user.user_type === 'Admin' ? 'Admin • Haneus Cafe Owner' : 'Staff • Haneus Cafe Employee';

    // Fetch full profile for image
    if (userId) {
      const res = await fetch(`${API_BASE}/profile/${userId}/`);
      if (res.ok) {
        const p = await res.json();
        const picUrl = p.profile_picture_url || p.avatar_url || '';
        if (picUrl) {
          const src = picUrl.startsWith('http') ? picUrl : `http://127.0.0.1:8000${picUrl}`;
          const headerImg = document.getElementById('headerProfileImg');
          const flyoutImg = document.getElementById('flyoutProfileImg');
          if (headerImg) headerImg.src = src;
          if (flyoutImg) flyoutImg.src = src;
        }
        // Update name from API data
        if (nameEl) nameEl.textContent = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || 'User';
        if (typeEl) typeEl.textContent = p.account_type_label || (p.user_type === 'Admin' ? 'Admin • Haneus Cafe Owner' : 'Staff • Haneus Cafe Employee');
      }
    }
  } catch (e) { console.warn('Profile flyout init error:', e); }
}());

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function statusBadge(status) {
  const map = {
    Completed: "background:#dcfce7;color:#15803d;",
    Pending: "background:#fef3c7;color:#92400e;",
    Cancelled: "background:#fee2e2;color:#b91c1c;",
  };
  const style = map[status] || map.Pending;
  return `<span style="font-size:0.75rem;${style}padding:0.125rem 0.5rem;border-radius:999px;">${status}</span>`;
}

// Set the date range display to the current week
function setDateRange() {
  const now = new Date();
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = monday.toLocaleDateString("en-US", opts);
  const to = sunday.toLocaleDateString("en-US", opts);
  setText("date-range", `${from} \u2013 ${to}`);
}

// ---------------------------------------------------------------------------
// Render functions
// ---------------------------------------------------------------------------

function renderPctChange(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  const sign = pct >= 0 ? "+" : "";
  el.textContent = `${sign}${pct}%`;
  el.style.color = pct >= 0 ? "#15803d" : "#b91c1c";
}

function renderSummaryCards(data) {
  setText("total-sales", formatCurrency(data.total_sales));
  setText("total-sales-returns", formatCurrency(data.total_sales_returns));
  setText("total-products", data.total_products);
  setText("profit", formatCurrency(data.profit));
  setText("total-expenses", formatCurrency(data.total_expenses));
  setText("total-payment-returns", formatCurrency(data.total_payment_returns));
  setText("orders-today", `You have ${data.orders_today} Orders, Today`);

  // Weekly % changes
  renderPctChange("profit-change", data.profit_change_pct);
  renderPctChange("expenses-change", data.expenses_change_pct);
  renderPctChange("returns-change", data.returns_change_pct);
}

function renderBarChart(monthlySales) {
  const bars = document.querySelectorAll("#bar-chart .bar");
  if (!bars.length) return;

  const values = monthlySales.map((v) => parseFloat(v) || 0);
  const max = Math.max(...values, 1);

  bars.forEach((bar, i) => {
    const pct = Math.max((values[i] / max) * 100, 2);
    bar.style.height = pct + "%";
    bar.title = formatCurrency(values[i]);
  });
}

// Dynamically rebuild bars + labels for any dataset
function renderChartData(data) {
  const chartEl = document.getElementById("bar-chart");
  const labelsEl = document.querySelector(".month-labels");
  if (!chartEl || !labelsEl) return;

  const values = data.values.map((v) => parseFloat(v) || 0);
  const max = Math.max(...values, 1);

  chartEl.innerHTML = values
    .map((v) => {
      const pct = Math.max((v / max) * 100, 2);
      return `<div class="bar" style="height:${pct}%;" title="${formatCurrency(v)}"></div>`;
    })
    .join("");

  labelsEl.innerHTML = data.labels.map((l) => `<span>${l}</span>`).join("");
}

async function loadChart(period) {
  try {
    const res = await fetch(`${API_BASE}/dashboard/chart/?period=${period}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderChartData(data);
  } catch (err) {
    console.error("Failed to load chart:", err);
  }
}

// Wire period buttons
document.querySelectorAll(".period-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    loadChart(this.textContent.trim());
  });
});

// Store full datasets for View All modals (Task 7)
window._dashTopSelling = [];
window._dashLowStock = [];
window._dashRecentSales = [];

function renderTopSelling(items) {
  const container = document.getElementById("top-selling-list");
  if (!container) return;
  window._dashTopSelling = items;

  if (!items.length) {
    container.innerHTML = '<p style="opacity:0.7;font-size:0.875rem;">No sales data yet.</p>';
    return;
  }

  // Task 7: Show only first 6 items, View All if > 6
  const show = items.slice(0, 6);
  const maxRevenue = Math.max(...items.map((i) => parseFloat(i.total_revenue) || 0), 1);

  container.innerHTML = show
    .map((item) => {
      const revenue = parseFloat(item.total_revenue) || 0;
      const pct = Math.round((revenue / maxRevenue) * 100);
      return `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.875rem; margin-bottom:0.375rem;">
            <span>${item.product_name}</span>
            <span style="font-weight:500;">${formatCurrency(item.total_revenue)}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div>
        </div>`;
    })
    .join("");

  // View All button
  const viewAllBtn = container.closest("div")?.querySelector("button");
  if (viewAllBtn) viewAllBtn.style.display = items.length > 6 ? "" : "none";
}

function renderLowStock(items) {
  const container = document.getElementById("low-stock-list");
  if (!container) return;
  window._dashLowStock = items;

  if (!items.length) {
    container.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;">All products are well stocked.</p>';
    return;
  }

  // Task 7: Show only first 6 items
  const show = items.slice(0, 6);
  let html = show
    .map(
      (p) => `
      <div class="product-item">
        <img src="${p.image_url || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100"}"
             alt="${p.name}" style="width:56px;height:56px;object-fit:cover;border-radius:0.5rem;" />
        <div style="flex:1;">
          <p style="font-weight:500;">${p.name}</p>
          <p style="font-size:0.875rem;color:var(--mocha);">ID: #${p.id}</p>
        </div>
        <span style="color:#b91c1c;font-weight:500;">${p.stock} left</span>
      </div>`
    )
    .join("");

  // Task 7: View All if > 6
  if (items.length > 6) {
    html += `<button onclick="openDashLowStockModal()" style="margin-top:0.75rem;width:100%;padding:0.5rem;background:var(--cream);border:1px solid var(--latte);border-radius:0.375rem;cursor:pointer;font-size:0.85rem;font-weight:500;">View All (${items.length})</button>`;
  }
  container.innerHTML = html;
}

function renderRecentSales(sales) {
  const container = document.getElementById("recent-sales-list");
  if (!container) return;
  window._dashRecentSales = sales;

  if (!sales.length) {
    container.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;">No recent sales.</p>';
    return;
  }

  // Task 7: Show only first 6 items
  const show = sales.slice(0, 6);
  let html = show
    .map(
      (s) => `
      <div class="product-item" style="margin-bottom:0.75rem;">
        <div style="flex:1;">
          <p style="font-weight:500;">${s.product_name || s.order_id}</p>
          <p style="font-size:0.875rem;color:var(--mocha);">${s.customer_name}</p>
        </div>
        <div style="text-align:right;">
          <p style="font-weight:500;">${formatCurrency(s.total)}</p>
          ${statusBadge(s.status)}
        </div>
      </div>`
    )
    .join("");

  // Task 7: View All if > 6
  if (sales.length > 6) {
    html += `<button onclick="openDashRecentSalesModal()" style="margin-top:0.75rem;width:100%;padding:0.5rem;background:var(--cream);border:1px solid var(--latte);border-radius:0.375rem;cursor:pointer;font-size:0.85rem;font-weight:500;">View All (${sales.length})</button>`;
  }
  container.innerHTML = html;
}

// ── Task 7: View All Modals ─────────────────────────────────────

function _createDashModal(id) {
  let modal = document.getElementById(id);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:10000;justify-content:center;align-items:center;';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  return modal;
}

// Top Selling View All — shows top 25
function openDashTopSellingModal() {
  const items = (window._dashTopSelling || []).slice(0, 25);
  const modal = _createDashModal('dashTopSellingModal');
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:90%;max-width:600px;max-height:80vh;animation:fadeInUp .2s ease;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
        <h2 style="font-size:1rem;font-weight:600;margin:0;">🏆 Top ${items.length} Best Sellers</h2>
        <button onclick="document.getElementById('dashTopSellingModal').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:1.25rem;">✕</button>
      </div>
      <div style="max-height:65vh;overflow-y:auto;padding:0.75rem 1.25rem 1.25rem;">
        <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
          <thead><tr style="border-bottom:2px solid #eee;"><th style="text-align:left;padding:0.5rem;">#</th><th style="text-align:left;padding:0.5rem;">Product</th><th style="text-align:right;padding:0.5rem;">Qty</th><th style="text-align:right;padding:0.5rem;">Revenue</th></tr></thead>
          <tbody>
            ${items.map((item, i) => `
              <tr style="border-bottom:1px solid #f5f5f5;">
                <td style="padding:0.5rem;">${i + 1}</td>
                <td style="padding:0.5rem;">${item.product_name}</td>
                <td style="text-align:right;padding:0.5rem;">${item.total_quantity}</td>
                <td style="text-align:right;padding:0.5rem;">${formatCurrency(item.total_revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

// Low Stock View All — shows 30 latest
function openDashLowStockModal() {
  const items = (window._dashLowStock || []).slice(0, 30);
  const modal = _createDashModal('dashLowStockModal');
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:90%;max-width:600px;max-height:80vh;animation:fadeInUp .2s ease;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
        <h2 style="font-size:1rem;font-weight:600;margin:0;">⚠️ Low Stock Products (${items.length})</h2>
        <button onclick="document.getElementById('dashLowStockModal').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:1.25rem;">✕</button>
      </div>
      <div style="max-height:65vh;overflow-y:auto;padding:0.75rem 1.25rem 1.25rem;">
        ${items.map(p => `
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid #f5f5f5;">
            <div style="flex:1;"><p style="font-weight:500;">${p.name}</p><p style="font-size:0.8rem;color:#999;">ID: #${p.id}</p></div>
            <span style="color:#b91c1c;font-weight:600;">${p.stock} left</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

// Recent Sales View All — shows 30 latest
function openDashRecentSalesModal() {
  const items = (window._dashRecentSales || []).slice(0, 30);
  const modal = _createDashModal('dashRecentSalesModal');
  modal.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:90%;max-width:700px;max-height:80vh;animation:fadeInUp .2s ease;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid #eee;">
        <h2 style="font-size:1rem;font-weight:600;margin:0;">📋 Recent Sales (${items.length})</h2>
        <button onclick="document.getElementById('dashRecentSalesModal').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:1.25rem;">✕</button>
      </div>
      <div style="max-height:65vh;overflow-y:auto;padding:0.75rem 1.25rem 1.25rem;">
        <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
          <thead><tr style="border-bottom:2px solid #eee;"><th style="text-align:left;padding:0.5rem;">#</th><th style="text-align:left;padding:0.5rem;">Order</th><th style="text-align:left;padding:0.5rem;">Customer</th><th style="text-align:center;padding:0.5rem;">Status</th><th style="text-align:right;padding:0.5rem;">Total</th></tr></thead>
          <tbody>
            ${items.map((s, i) => `
              <tr style="border-bottom:1px solid #f5f5f5;">
                <td style="padding:0.5rem;">${i + 1}</td>
                <td style="padding:0.5rem;">${s.product_name || s.order_id}</td>
                <td style="padding:0.5rem;">${s.customer_name}</td>
                <td style="text-align:center;padding:0.5rem;">${statusBadge(s.status)}</td>
                <td style="text-align:right;padding:0.5rem;">${formatCurrency(s.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

// Wire the existing "View All Products" button to top selling modal
document.addEventListener('DOMContentLoaded', () => {
  const topSellingSection = document.getElementById('top-selling-list');
  if (topSellingSection) {
    const viewAllBtn = topSellingSection.closest('div')?.querySelector('button');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', openDashTopSellingModal);
    }
  }
});

// ---------------------------------------------------------------------------
// Fetch and render
// ---------------------------------------------------------------------------

async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderSummaryCards(data);
    renderBarChart(data.monthly_sales);
    renderTopSelling(data.top_selling);
    renderLowStock(data.low_stock_products);
    renderRecentSales(data.recent_sales);
  } catch (err) {
    console.error("Failed to load dashboard:", err);
    setText("orders-today", "Could not load dashboard data.");
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

setDateRange();
loadDashboard();

// ---------------------------------------------------------------------------
// Notification System (Parts 3+4)
// ---------------------------------------------------------------------------

const NOTIF_STORE_KEY = 'haneus_notif_store';
let _selectedNotifId = null;

function _loadStore() { try { return JSON.parse(localStorage.getItem(NOTIF_STORE_KEY) || '[]'); } catch { return []; } }
function _saveStore(ns) { localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(ns)); }

function _updateBadge(notifs) {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = notifs.filter(n => !n.read).length;
  badge.textContent = unread > 9 ? '9+' : String(unread);
  badge.classList.toggle('visible', unread > 0);
}

async function _buildNotifications() {
  try {
    const res = await fetch(`${API_BASE}/products/low-stock/`);
    const products = await res.json();
    const store = _loadStore();
    const storeMap = {};
    store.forEach(n => { storeMap[n.id] = n; });

    const fresh = products.map(p => {
      const type = p.stock <= 0 ? 'out_of_stock'
        : p.stock <= p.low_stock_threshold / 2 ? 'critical' : 'low_stock';
      const title = p.stock <= 0 ? 'Out of Stock' : type === 'critical' ? 'Critical Stock' : 'Low Stock Alert';
      const msg = p.stock <= 0
        ? `${p.name} is out of stock and needs immediate restocking.`
        : `${p.name} has only ${p.stock} unit(s) left. Reorder point: ${p.low_stock_threshold}.`;
      return {
        id: `ls_${p.id}`,
        type,
        title,
        message: msg,
        productId: p.id,
        productName: p.name,
        stock: p.stock,
        threshold: p.low_stock_threshold,
        category: p.category,
        timestamp: new Date().toISOString(),
        read: storeMap[`ls_${p.id}`]?.read ?? false,
      };
    });

    // Fetch admin approval requests if user is an Admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.user_type === 'Admin') {
      try {
        const approvalRes = await fetch(`${API_BASE}/admin/approval-requests/`);
        if (approvalRes.ok) {
          const approvalData = await approvalRes.json();
          const approvals = (approvalData.requests || []).map(req => ({
            id: `approval_${req.id}`,
            type: 'approval_pending',
            title: 'Admin Approval Needed',
            message: `${req.user_name} (${req.email}) is awaiting approval.`,
            userId: req.user_id,
            userName: req.user_name,
            userEmail: req.email,
            requestId: req.id,
            status: req.status,
            createdAt: req.created_at,
            timestamp: req.created_at,
            read: storeMap[`approval_${req.id}`]?.read ?? false,
          }));
          fresh.push(...approvals);
        }
      } catch (approvalErr) {
        console.warn('Could not load approval requests:', approvalErr);
      }
    }

    _saveStore(fresh);
    _renderNotifList(fresh);
    _updateBadge(fresh);
  } catch (e) {
    console.error('Notification fetch failed:', e);
    const panel = document.getElementById('notifList');
    if (panel) panel.innerHTML = '<p style="padding:1.25rem;color:var(--mocha);font-size:0.875rem;">Could not load notifications.</p>';
  }
}

function _renderNotifList(notifs) {
  const list = document.getElementById('notifList');
  if (!list) return;

  if (!notifs.length) {
    list.innerHTML = '<p style="padding:1.25rem;color:var(--mocha);font-size:0.875rem;text-align:center;">No notifications</p>';
    return;
  }

  list.innerHTML = notifs.map(n => {
    const isApproval = n.type === 'approval_pending';
    const dotColor = isApproval ? 'info' : (n.type === 'out_of_stock' ? 'danger' : n.type === 'critical' ? 'warning' : 'caution');
    const preview = isApproval ? n.userName : n.productName;

    return `
      <div class="notif-item ${n.read ? 'read' : ''} ${_selectedNotifId === n.id ? 'selected' : ''}"
           onclick="_selectNotif('${n.id}')">
        <div class="notif-item-dot dot-${dotColor}"></div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-preview">${preview}</div>
        </div>
        ${!n.read ? '<span class="notif-unread-dot"></span>' : ''}
      </div>`;
  }).join('');
}

function _selectNotif(id) {
  _selectedNotifId = id;
  const notifs = _loadStore();
  const n = notifs.find(x => x.id === id);
  if (!n) return;

  n.read = true;
  _saveStore(notifs);
  _updateBadge(notifs);
  _renderNotifList(notifs);

  const detail = document.getElementById('notifDetailPanel');
  if (!detail) return;

  // Handle approval notifications
  if (n.type === 'approval_pending') {
    const typeBg = '#dbeafe';
    const typeColor = '#0284c7';
    const safeUserId = n.userId || 0;
    const safeNotifId = String(n.id || '').replace(/'/g, '');
    detail.innerHTML = `
      <div class="notif-detail-content">
        <span style="background:${typeBg};color:${typeColor};padding:0.2rem 0.65rem;border-radius:999px;font-size:0.75rem;font-weight:600;">${n.title}</span>
        <h3 style="font-size:0.975rem;font-weight:600;color:var(--espresso);margin:0.625rem 0 0.25rem;">${n.userName || 'Unknown'}</h3>
        <p style="font-size:0.83rem;color:var(--mocha);line-height:1.6;margin-bottom:0.75rem;">${n.message}</p>
        <div style="background:var(--cream);border-radius:0.5rem;padding:0.625rem;margin-bottom:0.75rem;">
          <div style="font-size:0.68rem;color:var(--mocha);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.2rem;">Email</div>
          <div style="font-size:0.9rem;color:var(--espresso);">${n.userEmail || '—'}</div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem;">
          <button id="approveBtn_${safeUserId}" data-userid="${safeUserId}" data-notifid="${safeNotifId}"
                  style="flex:1;padding:0.5rem;background:#10b981;color:white;border:none;border-radius:0.375rem;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.3s;position:relative;z-index:10001;">
            ✓ Approve
          </button>
          <button id="rejectBtn_${safeUserId}" data-userid="${safeUserId}" data-notifid="${safeNotifId}"
                  style="flex:1;padding:0.5rem;background:#ef4444;color:white;border:none;border-radius:0.375rem;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.3s;position:relative;z-index:10001;">
            ✕ Reject
          </button>
        </div>
      </div>`;
    // Use event listeners (not onclick) so buttons work reliably regardless of DOM state
    const approveBtn = document.getElementById(`approveBtn_${safeUserId}`);
    const rejectBtn = document.getElementById(`rejectBtn_${safeUserId}`);
    if (approveBtn) {
      approveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _approveUser(parseInt(approveBtn.dataset.userid), approveBtn.dataset.notifid);
      });
    }
    if (rejectBtn) {
      rejectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _rejectUser(parseInt(rejectBtn.dataset.userid), rejectBtn.dataset.notifid);
      });
    }
  } else {
    // Handle stock notifications
    const typeColor = n.type === 'out_of_stock' ? '#b91c1c' : n.type === 'critical' ? '#92400e' : '#b45309';
    const typeBg = n.type === 'out_of_stock' ? '#fee2e2' : n.type === 'critical' ? '#fef3c7' : '#fef9c3';
    detail.innerHTML = `
      <div class="notif-detail-content">
        <span style="background:${typeBg};color:${typeColor};padding:0.2rem 0.65rem;border-radius:999px;font-size:0.75rem;font-weight:600;">${n.title}</span>
        <h3 style="font-size:0.975rem;font-weight:600;color:var(--espresso);margin:0.625rem 0 0.25rem;">${n.productName}</h3>
        <p style="font-size:0.83rem;color:var(--mocha);line-height:1.6;margin-bottom:0.75rem;">${n.message}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.625rem;margin-bottom:0.75rem;">
          <div style="background:var(--cream);border-radius:0.5rem;padding:0.625rem;">
            <div style="font-size:0.68rem;color:var(--mocha);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.2rem;">Stock</div>
            <div style="font-size:1.05rem;font-weight:700;color:${typeColor};">${n.stock}</div>
          </div>
          <div style="background:var(--cream);border-radius:0.5rem;padding:0.625rem;">
            <div style="font-size:0.68rem;color:var(--mocha);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.2rem;">ROP</div>
            <div style="font-size:1.05rem;font-weight:700;color:var(--espresso);">${n.threshold}</div>
          </div>
        </div>
        <p style="font-size:0.78rem;color:var(--mocha);">Category: ${n.category}</p>
        <a href="lowstock.html" class="notif-detail-action">Go to Low Stock Page &#8594;</a>
      </div>`;
  }
}

// Approval/Rejection handlers
function _approveUser(userId, notifId) {
  showConfirmModal(
    'Approve this admin user?',
    async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/approval-requests/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', user_id: userId }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          // Instant UI transform — show REQUEST GRANTED
          const detail = document.getElementById('notifDetailPanel');
          if (detail) {
            detail.innerHTML = `
              <div class="notif-detail-content" style="text-align:center;padding:2rem;">
                <span style="background:#dcfce7;color:#15803d;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.85rem;font-weight:700;">REQUEST GRANTED</span>
                <p style="margin-top:1rem;color:var(--mocha);font-size:0.875rem;">User has been approved and can now login.</p>
              </div>`;
          }
          const notifs = _loadStore();
          const idx = notifs.findIndex(n => n.id === notifId);
          if (idx >= 0) notifs.splice(idx, 1);
          _saveStore(notifs);
          _renderNotifList(notifs);
          _updateBadge(notifs);
          showAlertModal('User approved successfully!', 'success');
        } else {
          showErrorModal(data.error || 'Failed to approve user.');
        }
      } catch (err) {
        console.error('Approval error:', err);
        showErrorModal('Network error. Could not approve user.');
      }
    }
  );
}

function _rejectUser(userId, notifId) {
  showConfirmModal(
    'Reject this admin user and remove their account?',
    async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/approval-requests/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', user_id: userId, delete_user: true }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          // Instant UI transform — show REQUEST REJECTED
          const detail = document.getElementById('notifDetailPanel');
          if (detail) {
            detail.innerHTML = `
              <div class="notif-detail-content" style="text-align:center;padding:2rem;">
                <span style="background:#fee2e2;color:#b91c1c;padding:0.3rem 0.75rem;border-radius:999px;font-size:0.85rem;font-weight:700;">REQUEST REJECTED</span>
                <p style="margin-top:1rem;color:var(--mocha);font-size:0.875rem;">User has been rejected and removed from the system.</p>
              </div>`;
          }
          const notifs = _loadStore();
          const idx = notifs.findIndex(n => n.id === notifId);
          if (idx >= 0) notifs.splice(idx, 1);
          _saveStore(notifs);
          _renderNotifList(notifs);
          _updateBadge(notifs);
          showAlertModal('User rejected and removed.', 'success');
        } else {
          showErrorModal(data.error || 'Failed to reject user.');
        }
      } catch (err) {
        console.error('Rejection error:', err);
        showErrorModal('Network error. Could not reject user.');
      }
    }
  );
}

// Bell toggle
document.getElementById('notifBellBtn')?.addEventListener('click', function (e) {
  e.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const willOpen = !dd.classList.contains('open');
  dd.classList.toggle('open');
  if (willOpen) _buildNotifications();
});

// Close on outside click
document.addEventListener('click', e => {
  const w = document.getElementById('notifWrapper');
  const dd = document.getElementById('notifDropdown');
  if (w && dd && !w.contains(e.target)) dd.classList.remove('open');
});

// Mark all read
document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
  const notifs = _loadStore();
  notifs.forEach(n => n.read = true);
  _saveStore(notifs);
  _updateBadge(notifs);
  _renderNotifList(notifs);
});

// Clear all
document.getElementById('clearAllBtn')?.addEventListener('click', () => {
  _saveStore([]);
  _updateBadge([]);
  _renderNotifList([]);
  const detail = document.getElementById('notifDetailPanel');
  if (detail) detail.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;padding:1.25rem;">Select a notification to view details.</p>';
  _selectedNotifId = null;
});

// Init badge on load: fetch low-stock + approval data so the badge is accurate
// without building the full notification list (that happens on bell click).
// Polls every 30 seconds so the badge stays current WITHOUT page refresh.
async function _refreshNotifBadge() {
  try {
    const store = _loadStore();
    const storeMap = {};
    store.forEach(n => { storeMap[n.id] = n; });

    const freshNotifs = [];

    // 1. Low-stock products
    try {
      const res = await fetch(`${API_BASE}/products/low-stock/`);
      if (res.ok) {
        const products = await res.json();
        products.forEach(p => {
          const type = p.stock <= 0 ? 'out_of_stock'
            : p.stock <= p.low_stock_threshold / 2 ? 'critical' : 'low_stock';
          freshNotifs.push({
            id: `ls_${p.id}`,
            type,
            title: p.stock <= 0 ? 'Out of Stock' : type === 'critical' ? 'Critical Stock' : 'Low Stock Alert',
            message: p.stock <= 0
              ? `${p.name} is out of stock and needs immediate restocking.`
              : `${p.name} has only ${p.stock} unit(s) left.`,
            productId: p.id,
            productName: p.name,
            stock: p.stock,
            threshold: p.low_stock_threshold,
            category: p.category,
            timestamp: new Date().toISOString(),
            read: storeMap[`ls_${p.id}`]?.read ?? false,
          });
        });
      }
    } catch { /* silent */ }

    // 2. Admin approval requests (Admin users only)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.user_type === 'Admin') {
      try {
        const approvalRes = await fetch(`${API_BASE}/admin/approval-requests/`);
        if (approvalRes.ok) {
          const approvalData = await approvalRes.json();
          (approvalData.requests || []).forEach(req => {
            freshNotifs.push({
              id: `approval_${req.id}`,
              type: 'approval_pending',
              title: 'Admin Approval Needed',
              message: `${req.user_name} (${req.email}) is awaiting approval.`,
              userId: req.user_id,
              userName: req.user_name,
              userEmail: req.email,
              requestId: req.id,
              status: req.status,
              createdAt: req.created_at,
              timestamp: req.created_at,
              read: storeMap[`approval_${req.id}`]?.read ?? false,
            });
          });
        }
      } catch { /* silent — staff users won't have access */ }
    }

    // Save fresh data so badge and bell-click are in sync
    if (freshNotifs.length > 0) {
      _saveStore(freshNotifs);
      _updateBadge(freshNotifs);
    } else {
      // Even if no fresh data, update badge from whatever is in the store
      _updateBadge(store);
    }
  } catch { /* silent */ }
}

// Run once immediately, then poll every 30 seconds
_refreshNotifBadge();
setInterval(_refreshNotifBadge, 30000);
