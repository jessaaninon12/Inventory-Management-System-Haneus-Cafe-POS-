// ─────────────────────────────────────────────────────────────
// Reports — Frontend JS
// Haneus Cafe POS
// ─────────────────────────────────────────────────────────────

lucide.createIcons();

const API = "http://127.0.0.1:8000/api";

function fmt(n) { return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }

// ── Tab switching ────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.rpt-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tab); });
  document.querySelectorAll('.rpt-tab-content').forEach(function(c) { c.classList.toggle('active', c.id === 'tab-' + tab); });
  lucide.createIcons();
  if (tab === 'stock') loadStockReport();
  else if (tab === 'sales') loadSalesReport();
  else if (tab === 'suppliers') loadSupplierReport();
}

// ── Stock Report ─────────────────────────────────────────────
async function loadStockReport() {
  try {
    var res = await fetch(API + '/reports/stock/');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    renderStockStats(data.summary);
    renderStockTable(data.products);
  } catch (e) {
    console.error('Stock report failed:', e);
    document.getElementById('stockBody').innerHTML = '<tr><td colspan="9" class="rpt-loading" style="color:#b91c1c;">Failed to load stock report.</td></tr>';
  }
}

function renderStockStats(s) {
  document.getElementById('stockStats').innerHTML =
    statCard('#4a2f21', 'box', s.total_products, 'Total Products') +
    statCard('#15803d', 'package', '₱' + fmt(s.total_stock_value), 'Total Stock Value') +
    statCard('#92400e', 'alert-triangle', s.low_stock_count, 'Low Stock') +
    statCard('#b91c1c', 'x-circle', s.out_of_stock_count, 'Out of Stock');
  lucide.createIcons();
}

function renderStockTable(products) {
  var tbody = document.getElementById('stockBody');
  if (!products || !products.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="rpt-loading">No products found.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map(function(p) {
    var badgeClass = p.stock_status === 'In Stock' ? 'in-stock' : (p.stock_status === 'Low Stock' ? 'low-stock' : 'out-of-stock');
    return '<tr>' +
      '<td style="font-weight:500;">' + p.name + '</td>' +
      '<td>' + p.category + '</td>' +
      '<td>' + p.stock + '</td>' +
      '<td>' + p.unit + '</td>' +
      '<td class="rpt-currency">₱' + fmt(p.cost) + '</td>' +
      '<td class="rpt-currency">₱' + fmt(p.price) + '</td>' +
      '<td class="rpt-currency">₱' + fmt(p.cost_value) + '</td>' +
      '<td><span class="rpt-badge rpt-badge-' + badgeClass + '">' + p.stock_status + '</span></td>' +
      '<td>' + (p.supplier_name || '—') + '</td>' +
    '</tr>';
  }).join('');
}

// ── Sales Report ─────────────────────────────────────────────
async function loadSalesReport() {
  var days = document.getElementById('salesPeriod').value || 30;
  try {
    var res = await fetch(API + '/reports/sales/?period=' + days);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    renderSalesStats(data.summary);
    renderSalesTop(data.top_products);
    renderSalesPayment(data.payment_methods);
  } catch (e) {
    console.error('Sales report failed:', e);
    document.getElementById('salesTopBody').innerHTML = '<tr><td colspan="4" class="rpt-loading" style="color:#b91c1c;">Failed to load.</td></tr>';
  }
}

function renderSalesStats(s) {
  document.getElementById('salesStats').innerHTML =
    statCard('#1d4ed8', 'shopping-bag', s.total_sales, 'Total Sales') +
    statCard('#15803d', 'trending-up', '₱' + fmt(s.total_revenue), 'Revenue') +
    statCard('#92400e', 'package', s.total_items_sold, 'Items Sold') +
    statCard('#6e4f3e', 'calendar', s.period_days + ' Days', 'Period');
  lucide.createIcons();
}

function renderSalesTop(top) {
  var tbody = document.getElementById('salesTopBody');
  if (!top || !top.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="rpt-loading">No sales data.</td></tr>';
    return;
  }
  tbody.innerHTML = top.map(function(t, i) {
    return '<tr>' +
      '<td style="font-weight:600;color:var(--primary);">' + (i + 1) + '</td>' +
      '<td style="font-weight:500;">' + t.product_name + '</td>' +
      '<td>' + t.quantity + '</td>' +
      '<td class="rpt-currency">₱' + fmt(t.revenue) + '</td>' +
    '</tr>';
  }).join('');
}

function renderSalesPayment(methods) {
  var tbody = document.getElementById('salesPaymentBody');
  if (!methods || !methods.length) {
    tbody.innerHTML = '<tr><td colspan="3" class="rpt-loading">No data.</td></tr>';
    return;
  }
  tbody.innerHTML = methods.map(function(m) {
    return '<tr>' +
      '<td style="font-weight:500;">' + m.method + '</td>' +
      '<td>' + m.count + '</td>' +
      '<td class="rpt-currency">₱' + fmt(m.total) + '</td>' +
    '</tr>';
  }).join('');
}

// ── Supplier Report ──────────────────────────────────────────
async function loadSupplierReport() {
  try {
    var res = await fetch(API + '/reports/suppliers/');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    renderSupplierStats(data.summary);
    renderSupplierTable(data.suppliers);
  } catch (e) {
    console.error('Supplier report failed:', e);
    document.getElementById('supplierBody').innerHTML = '<tr><td colspan="9" class="rpt-loading" style="color:#b91c1c;">Failed to load.</td></tr>';
  }
}

function renderSupplierStats(s) {
  document.getElementById('supplierStats').innerHTML =
    statCard('#4a2f21', 'truck', s.total_suppliers, 'Total Suppliers') +
    statCard('#15803d', 'check-circle', s.strong_count, 'Strong Suppliers') +
    statCard('#b91c1c', 'alert-circle', s.underperforming_count, 'Underperforming');
  lucide.createIcons();
}

function renderSupplierTable(suppliers) {
  var tbody = document.getElementById('supplierBody');
  if (!suppliers || !suppliers.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="rpt-loading">No supplier data.</td></tr>';
    return;
  }
  tbody.innerHTML = suppliers.map(function(s) {
    var statusMap = {
      'Strong': 'strong',
      'Good': 'good',
      'Average': 'average',
      'Underperforming': 'underperforming',
      'High Supply, Low Movement': 'problem'
    };
    var badgeClass = statusMap[s.performance_status] || 'average';
    return '<tr>' +
      '<td style="font-weight:500;">' + s.supplier_name + '</td>' +
      '<td>' + s.product_count + '</td>' +
      '<td>' + s.total_stock + '</td>' +
      '<td class="rpt-currency">₱' + fmt(s.avg_price) + '</td>' +
      '<td class="rpt-currency">₱' + fmt(s.total_stock_value) + '</td>' +
      '<td>' + s.total_sold + '</td>' +
      '<td class="rpt-currency">₱' + fmt(s.total_revenue) + '</td>' +
      '<td>' + s.sell_through_rate + '%</td>' +
      '<td><span class="rpt-badge rpt-badge-' + badgeClass + '">' + s.performance_status + '</span></td>' +
    '</tr>';
  }).join('');
}

// ── Stat card builder ────────────────────────────────────────
function statCard(color, icon, value, label) {
  return '<div class="rpt-stat-card">' +
    '<div class="rpt-stat-icon" style="background:' + color + '15;color:' + color + ';">' +
    '<i data-lucide="' + icon + '"></i>' +
    '</div>' +
    '<div>' +
    '<div class="rpt-stat-value">' + value + '</div>' +
    '<div class="rpt-stat-label">' + label + '</div>' +
    '</div>' +
    '</div>';
}

// ── Init ─────────────────────────────────────────────────────
loadStockReport();
