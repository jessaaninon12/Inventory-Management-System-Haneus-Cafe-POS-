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
