// Low stock page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let currentRestockingProduct = null;
let currentViewingProduct = null;

// ---------- Load low-stock products from backend ----------
async function loadLowStock() {
  const tbody = document.getElementById('lowStockTableBody');
  try {
    const res = await fetch(`${API}/products/low-stock/`);
    const products = await res.json();

    document.getElementById('lowStockCount').textContent = products.length;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No low-stock products found.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const pct = p.low_stock_threshold > 0
        ? Math.round((p.stock / p.low_stock_threshold) * 100)
        : 0;
      const isCritical = p.stock <= p.low_stock_threshold / 2;
      const statusClass = isCritical ? 'status-critical' : 'status-low';
      const fillClass   = isCritical ? 'progress-fill-critical' : 'progress-fill-low';
      const statusText  = isCritical ? 'Critical' : 'Low';

      return `
        <tr data-product-id="${p.id}">
          <td>${p.name}</td>
          <td>${p.category}</td>
          <td>${p.stock}</td>
          <td>${p.low_stock_threshold}</td>
          <td>
            <span class="${statusClass}">${statusText}</span>
            <div class="progress-bar"><div class="${fillClass}" style="width:${pct}%;"></div></div>
          </td>
          <td class="actions">
            <button class="btn btn-restock" onclick="openRestockModal(${p.id})">Restock</button>
            <button class="btn btn-view" onclick="openViewModal(${p.id})">View</button>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Failed to load low-stock products.</td></tr>'
  }
}

// ---------- Restock Modal ----------
function openRestockModal(productId) {
  // Fetch product detail so we have current data
  fetch(`${API}/products/view/${productId}/`)
    .then(r => r.json())
    .then(p => {
      currentRestockingProduct = p;
      document.getElementById('restockProductName').textContent =
        `${p.name} (Current Stock: ${p.stock} ${p.unit})`;
      document.getElementById('restockQuantity').value = p.low_stock_threshold - p.stock > 0
        ? p.low_stock_threshold - p.stock : 10;
      document.getElementById('restockModal').style.display = 'flex';
    })
    .catch(() => showErrorModal('Could not load product details.'));
}

function closeRestockModal() {
  document.getElementById('restockModal').style.display = 'none';
  currentRestockingProduct = null;
}

// Handle Restock Form Submission → POST /api/inventory/adjust/
document.getElementById('restockForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!currentRestockingProduct) return;

  const quantity = parseInt(document.getElementById('restockQuantity').value);
  const supplier = document.getElementById('restockSupplier').value || '';
  const notes    = document.getElementById('restockNotes').value || '';

  try {
    const res = await fetch(`${API}/inventory/adjust/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: currentRestockingProduct.id,
        quantity_change: quantity,
        transaction_type: 'stock_in',
        reference: supplier ? `Supplier: ${supplier}` : '',
        notes: notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      showErrorModal('Restock failed: ' + JSON.stringify(err.errors || err));
      return;
    }

    showSuccessModal(`Restocked ${quantity} units of ${currentRestockingProduct.name} successfully!`);
    closeRestockModal();
    loadLowStock();
  } catch (err) {
    console.error(err);
    showErrorModal('Failed to restock. Is the backend running?');
  }
});

// ---------- View Modal ----------
function openViewModal(productId) {
  fetch(`${API}/products/view/${productId}/`)
    .then(r => r.json())
    .then(p => {
      currentViewingProduct = p;
      document.getElementById('viewProductName').textContent = p.name;

      const pct = p.low_stock_threshold > 0
        ? Math.round((p.stock / p.low_stock_threshold) * 100) : 0;
      const status = p.stock <= p.low_stock_threshold / 2 ? 'Critical' : 'Low';
      const deficit = p.low_stock_threshold - p.stock;

      document.getElementById('viewProductDetails').innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Product ID</p>
            <p style="font-weight:500; font-size:1.125rem;">#${p.id}</p>
          </div>
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Category</p>
            <p style="font-weight:500; font-size:1.125rem;">${p.category}</p>
          </div>
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Current Stock</p>
            <p style="font-weight:500; font-size:1.125rem;">${p.stock} ${p.unit}</p>
          </div>
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Reorder Level</p>
            <p style="font-weight:500; font-size:1.125rem;">${p.low_stock_threshold} ${p.unit}</p>
          </div>
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Status</p>
            <p style="font-weight:500; font-size:1.125rem; color:${status === 'Critical' ? '#b91c1c' : '#ea580c'};">${status}</p>
          </div>
          <div>
            <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Stock Level</p>
            <p style="font-weight:500; font-size:1.125rem;">${pct}% of reorder point</p>
          </div>
        </div>
        <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid #eee;">
          <p style="color:#999; font-size:0.875rem; margin-bottom:0.5rem;">Recommendation</p>
          <p style="font-size:0.95rem; color:#333;">
            Reorder at least <strong>${deficit > 0 ? deficit : 0}</strong> units to reach the reorder level.
          </p>
        </div>
      `;

      document.getElementById('viewModal').style.display = 'flex';
    })
    .catch(() => showErrorModal('Could not load product details.'));
}

function closeViewModal() {
  document.getElementById('viewModal').style.display = 'none';
  currentViewingProduct = null;
}

// ---------- Close modals on outside click ----------
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('restockModal')) closeRestockModal();
  if (event.target === document.getElementById('viewModal'))    closeViewModal();
});

// ---------- Init ----------
loadLowStock();

// -- AJAX Auto-Refresh -----------------------------------------
if (typeof startAutoRefresh === 'function') {
  startAutoRefresh(() => loadLowStock(), 20000, 'low-stock');
}
