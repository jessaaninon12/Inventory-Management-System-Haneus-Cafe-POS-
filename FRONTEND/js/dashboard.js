// Dashboard initialization
lucide.createIcons();

const API_BASE = "http://127.0.0.1:8000/api";

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
    Pending:   "background:#fef3c7;color:#92400e;",
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

function renderTopSelling(items) {
  const container = document.getElementById("top-selling-list");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p style="opacity:0.7;font-size:0.875rem;">No sales data yet.</p>';
    return;
  }

  const maxRevenue = Math.max(...items.map((i) => parseFloat(i.total_revenue) || 0), 1);

  container.innerHTML = items
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
}

function renderLowStock(items) {
  const container = document.getElementById("low-stock-list");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;">All products are well stocked.</p>';
    return;
  }

  container.innerHTML = items
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
}

function renderRecentSales(sales) {
  const container = document.getElementById("recent-sales-list");
  if (!container) return;

  if (!sales.length) {
    container.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;">No recent sales.</p>';
    return;
  }

  container.innerHTML = sales
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
}

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

function _loadStore()   { try { return JSON.parse(localStorage.getItem(NOTIF_STORE_KEY) || '[]'); } catch { return []; } }
function _saveStore(ns) { localStorage.setItem(NOTIF_STORE_KEY, JSON.stringify(ns)); }

function _updateBadge(notifs) {
  const badge  = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = notifs.filter(n => !n.read).length;
  badge.textContent = unread > 9 ? '9+' : String(unread);
  badge.classList.toggle('visible', unread > 0);
}

async function _buildNotifications() {
  try {
    const res      = await fetch(`${API_BASE}/products/low-stock/`);
    const products = await res.json();
    const store    = _loadStore();
    const storeMap = {};
    store.forEach(n => { storeMap[n.id] = n; });

    const fresh = products.map(p => {
      const type = p.stock <= 0                        ? 'out_of_stock'
                 : p.stock <= p.low_stock_threshold / 2 ? 'critical' : 'low_stock';
      const title = p.stock <= 0 ? 'Out of Stock' : type === 'critical' ? 'Critical Stock' : 'Low Stock Alert';
      const msg   = p.stock <= 0
        ? `${p.name} is out of stock and needs immediate restocking.`
        : `${p.name} has only ${p.stock} unit(s) left. Reorder point: ${p.low_stock_threshold}.`;
      return {
        id          : `ls_${p.id}`,
        type,
        title,
        message     : msg,
        productId   : p.id,
        productName : p.name,
        stock       : p.stock,
        threshold   : p.low_stock_threshold,
        category    : p.category,
        timestamp   : new Date().toISOString(),
        read        : storeMap[`ls_${p.id}`]?.read ?? false,
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
            id          : `approval_${req.id}`,
            type        : 'approval_pending',
            title       : 'Admin Approval Needed',
            message     : `${req.user_name} (${req.email}) is awaiting approval.`,
            userId      : req.user_id,
            userName    : req.user_name,
            userEmail   : req.email,
            requestId   : req.id,
            status      : req.status,
            createdAt   : req.created_at,
            timestamp   : req.created_at,
            read        : storeMap[`approval_${req.id}`]?.read ?? false,
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

  const detail   = document.getElementById('notifDetailPanel');
  if (!detail) return;
  
  // Handle approval notifications
  if (n.type === 'approval_pending') {
    const typeBg    = '#dbeafe';
    const typeColor = '#0284c7';
    detail.innerHTML = `
      <div class="notif-detail-content">
        <span style="background:${typeBg};color:${typeColor};padding:0.2rem 0.65rem;border-radius:999px;font-size:0.75rem;font-weight:600;">${n.title}</span>
        <h3 style="font-size:0.975rem;font-weight:600;color:var(--espresso);margin:0.625rem 0 0.25rem;">${n.userName}</h3>
        <p style="font-size:0.83rem;color:var(--mocha);line-height:1.6;margin-bottom:0.75rem;">${n.message}</p>
        <div style="background:var(--cream);border-radius:0.5rem;padding:0.625rem;margin-bottom:0.75rem;">
          <div style="font-size:0.68rem;color:var(--mocha);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.2rem;">Email</div>
          <div style="font-size:0.9rem;color:var(--espresso);">${n.userEmail}</div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-top:1rem;">
          <button onclick="_approveUser(${n.userId}, '${n.id}')" style="flex:1;padding:0.5rem;background:#10b981;color:white;border:none;border-radius:0.375rem;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.3s;">
            ✓ Approve
          </button>
          <button onclick="_rejectUser(${n.userId}, '${n.id}')" style="flex:1;padding:0.5rem;background:#ef4444;color:white;border:none;border-radius:0.375rem;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all 0.3s;">
            ✕ Reject
          </button>
        </div>
      </div>`;
  } else {
    // Handle stock notifications
    const typeColor = n.type === 'out_of_stock' ? '#b91c1c' : n.type === 'critical' ? '#92400e' : '#b45309';
    const typeBg    = n.type === 'out_of_stock' ? '#fee2e2' : n.type === 'critical' ? '#fef3c7' : '#fef9c3';
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
        const response = await fetch(`${API_BASE}/admin/approve-user/${userId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (response.ok && data.success) {
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
        const response = await fetch(`${API_BASE}/admin/reject-user/${userId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delete_user: true }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
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
document.getElementById('notifBellBtn')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const willOpen = !dd.classList.contains('open');
  dd.classList.toggle('open');
  if (willOpen) _buildNotifications();
});

// Close on outside click
document.addEventListener('click', e => {
  const w  = document.getElementById('notifWrapper');
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

// Init badge on load (silent, non-blocking)
_buildNotifications();
