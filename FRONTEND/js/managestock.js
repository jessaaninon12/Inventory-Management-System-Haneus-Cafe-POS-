// Manage stock page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let pendingStockChange = null;

// ---------- Load all products ----------
async function loadProducts() {
  const tbody = document.getElementById('stockTableBody');
  try {
    const res = await fetch(`${API}/products/`);
    const data = await res.json();
    const products = data.results || data;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => `
      <tr data-product-id="${p.id}">
        <td>${p.name}</td>
        <td>#${p.id}</td>
        <td>${p.stock} ${p.unit}</td>
        <td>
          <div class="stock-input-group">
            <button onclick="decrementStock(this)">\u2212</button>
            <input type="number" value="0" />
            <button onclick="incrementStock(this)">+</button>
            <button class="btn btn-primary" style="margin-left:0.75rem; padding:0.5rem 1rem;"
              onclick="applyStockChange(${p.id}, '${p.name.replace(/'/g,"\\'")}'  , '${p.stock} ${p.unit}')">Apply</button>
          </div>
        </td>
        <td>${p.updated_at ? new Date(p.updated_at).toLocaleString() : '\u2014'}</td>
        <td><span class="history-badge" onclick="openHistoryModal(${p.id}, '${p.name.replace(/'/g,"\\'")}')">View log</span></td>
      </tr>`).join('');
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Failed to load products.</td></tr>';
  }
}

// ---------- +/- helpers ----------
function incrementStock(btn) {
  const input = btn.previousElementSibling;
  input.value = parseInt(input.value || 0) + 1;
}

function decrementStock(btn) {
  const input = btn.nextElementSibling;
  const v = parseInt(input.value || 0);
  if (v > 0) input.value = v - 1;
}

// ---------- Apply / Confirm ----------
function applyStockChange(productId, productName, currentStock) {
  const row = document.querySelector(`[data-product-id="${productId}"]`);
  const input = row.querySelector('.stock-input-group input');
  const qty = parseInt(input.value || 0);

  if (qty === 0) { alert('Please enter a quantity to adjust.'); return; }

  pendingStockChange = { productId, productName, quantity: qty, currentStock };

  const op = qty > 0 ? 'Add' : 'Remove';
  document.getElementById('stockConfirmDetails').innerHTML = `
    <div style="display:grid; gap:1rem;">
      <div>
        <p style="color:#999; font-size:0.875rem;">Product</p>
        <p style="font-weight:500;">${productName}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem;">Current Stock</p>
        <p style="font-weight:500;">${currentStock}</p>
      </div>
      <div style="padding:1rem; background:#f5f5f5; border-radius:4px;">
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.5rem;">Adjustment</p>
        <p style="font-size:1.5rem; font-weight:600;">${qty > 0 ? '+' : ''}${qty} units</p>
        <p style="color:#999; font-size:0.875rem; margin-top:0.5rem;">${op}</p>
      </div>
    </div>
  `;
  document.getElementById('stockConfirmModal').style.display = 'flex';
}

function closeStockConfirmModal() {
  document.getElementById('stockConfirmModal').style.display = 'none';
  pendingStockChange = null;
}

async function confirmStockChange() {
  if (!pendingStockChange) return;

  try {
    const res = await fetch(`${API}/inventory/adjust/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: pendingStockChange.productId,
        quantity_change: pendingStockChange.quantity,
        transaction_type: 'adjustment',
        reference: '',
        notes: `Manual adjustment from Manage Stock page`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert('Adjustment failed: ' + JSON.stringify(err.errors || err));
      return;
    }

    alert(`Stock adjusted by ${pendingStockChange.quantity > 0 ? '+' : ''}${pendingStockChange.quantity} for ${pendingStockChange.productName}!`);
    closeStockConfirmModal();
    loadProducts();
  } catch (err) {
    console.error(err);
    alert('Failed to adjust stock. Is the backend running?');
  }
}

// ---------- History Modal (real API) ----------
async function openHistoryModal(productId, productName) {
  document.getElementById('historyProductName').textContent = `${productName} — Stock History`;
  document.getElementById('historyContent').innerHTML = '<p style="text-align:center;color:#999;">Loading history...</p>';
  document.getElementById('historyModal').style.display = 'flex';

  try {
    const res = await fetch(`${API}/inventory/${productId}/history/`);
    const history = await res.json();

    if (!history.length) {
      document.getElementById('historyContent').innerHTML = '<p style="text-align:center;color:#999;">No stock history recorded yet.</p>';
      return;
    }

    let html = '<table style="width:100%; border-collapse:collapse;">';
    html += '<tr style="border-bottom:2px solid #eee;"><th style="text-align:left;padding:1rem 0;font-weight:600;">Date</th><th style="text-align:left;padding:1rem 0;font-weight:600;">Action</th><th style="text-align:left;padding:1rem 0;font-weight:600;">Quantity</th><th style="text-align:left;padding:1rem 0;font-weight:600;">Reference</th></tr>';

    history.forEach(t => {
      const d = t.timestamp ? new Date(t.timestamp) : null;
      const dateStr = d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '\u2014';
      const timeStr = d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      const qtyStr = t.quantity_change > 0 ? `+${t.quantity_change}` : `${t.quantity_change}`;
      const qtyColor = t.quantity_change > 0 ? '#15803d' : '#b91c1c';

      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:1rem 0;color:#666;">
            <div>${dateStr}</div>
            <div style="font-size:0.875rem;color:#999;">${timeStr}</div>
          </td>
          <td style="padding:1rem 0;">
            <div style="font-weight:500;">${t.transaction_type}</div>
            <div style="font-size:0.875rem;color:#999;">${t.notes || ''}</div>
          </td>
          <td style="padding:1rem 0;">
            <span style="font-weight:600;color:${qtyColor};">${qtyStr}</span>
          </td>
          <td style="padding:1rem 0;color:#999;">${t.reference || '\u2014'}</td>
        </tr>`;
    });

    html += '</table>';
    document.getElementById('historyContent').innerHTML = html;
  } catch (e) {
    console.error(e);
    document.getElementById('historyContent').innerHTML = '<p style="text-align:center;color:red;">Failed to load history.</p>';
  }
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

// ---------- Search filter ----------
document.querySelector('.search-input')?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#stockTableBody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

// ---------- Close modals on outside click ----------
window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('stockConfirmModal')) closeStockConfirmModal();
  if (event.target === document.getElementById('historyModal'))     closeHistoryModal();
});

// ---------- Init ----------
loadProducts();

