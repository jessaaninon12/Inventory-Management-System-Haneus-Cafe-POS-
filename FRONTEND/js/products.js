// Products page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
let currentEditingProductId = null;
let currentDeletingProductId = null;

function statusBadge(stockStatus) {
  const cls = stockStatus === 'In Stock' ? 'status-ok' : stockStatus === 'Low Stock' ? 'status-low' : 'status-critical';
  const label = stockStatus === 'Out of Stock' ? 'Critical' : stockStatus;
  return `<span class="${cls}">${label}</span>`;
}

async function loadProducts() {
  const tbody = document.getElementById('productTableBody');
  try {
    const res = await fetch(`${API}/products/view/`);
    const data = await res.json();
    const products = data.results || data;
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found.</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `
      <tr data-product-id="${p.id}">
        <td>#${p.id}</td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>\u20b1${parseFloat(p.price).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>${statusBadge(p.stock_status)}</td>
        <td class="actions">
          <button class="btn btn-edit" onclick="openEditModal(${p.id}, '${p.name.replace(/'/g,"\\'")}',' ${p.category}', ${p.price}, ${p.stock})">Edit</button>
          <button class="btn btn-delete" onclick="openDeleteModal(${p.id}, '${p.name.replace(/'/g,"\\'")}')">Delete</button>
        </td>
      </tr>`).join('');
  } catch (e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Failed to load products.</td></tr>'; }
}

function openEditModal(id, name, category, price, stock) {
  currentEditingProductId = id;
  document.getElementById('editName').value = name;
  document.getElementById('editCategory').value = category.trim();
  document.getElementById('editPrice').value = price;
  document.getElementById('editStock').value = stock;
  document.getElementById('editModal').style.display = 'flex';
}
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; currentEditingProductId = null; }

document.getElementById('editForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('editName').value,
    category: document.getElementById('editCategory').value,
    price: parseFloat(document.getElementById('editPrice').value),
    stock: parseInt(document.getElementById('editStock').value),
  };
  try {
    const res = await fetch(`${API}/products/edit/${currentEditingProductId}/`, {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    if (!res.ok) { const err = await res.json(); alert(JSON.stringify(err)); return; }
    alert('Product updated successfully!');
    closeEditModal();
    loadProducts();
  } catch (e) { alert('Failed to update product.'); }
});

function openDeleteModal(id, name) {
  currentDeletingProductId = id;
  document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
}
function closeDeleteModal() { document.getElementById('deleteModal').style.display = 'none'; currentDeletingProductId = null; }

async function confirmDelete() {
  try {
    const res = await fetch(`${API}/products/delete/${currentDeletingProductId}/`, { method: 'DELETE' });
    if (res.status === 204 || res.ok) {
      alert('Product deleted successfully!');
      closeDeleteModal();
      loadProducts();
    } else { alert('Failed to delete product.'); }
  } catch (e) { alert('Failed to delete product.'); }
}

window.addEventListener('click', function(event) {
  if (event.target === document.getElementById('editModal')) closeEditModal();
  if (event.target === document.getElementById('deleteModal')) closeDeleteModal();
});

loadProducts();
