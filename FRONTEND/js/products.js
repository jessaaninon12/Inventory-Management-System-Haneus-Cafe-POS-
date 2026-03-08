// Products page initialization
lucide.createIcons();

let currentEditingProductId = null;
let currentDeletingProductId = null;

// Load and display products from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
  loadProductsFromStorage();
});

function loadProductsFromStorage() {
  const storedProducts = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const tableBody = document.getElementById('productTableBody');
  
  // Keep existing default products and add stored products
  if (storedProducts.length > 0) {
    storedProducts.forEach(product => {
      const exists = tableBody.querySelector(`[data-product-id="${product.id}"]`);
      if (!exists) {
        const statusClass = product.stock > product.lowStockThreshold ? 'status-ok' : product.stock > product.lowStockThreshold / 2 ? 'status-low' : 'status-critical';
        const statusText = product.stock > product.lowStockThreshold ? 'In Stock' : product.stock > product.lowStockThreshold / 2 ? 'Low Stock' : 'Critical';
        
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', product.id);
        row.innerHTML = `
          <td>${product.id}</td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>₱${product.price.toFixed(2)}</td>
          <td>${product.stock}</td>
          <td><span class="${statusClass}">${statusText}</span></td>
          <td class="actions">
            <button class="btn btn-edit" onclick="openEditModal('${product.id}', '${product.name}', '${product.category}', ${product.price}, ${product.stock})">Edit</button>
            <button class="btn btn-delete" onclick="openDeleteModal('${product.id}', '${product.name}')">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      }
    });
  }
  
  lucide.createIcons();
}

// Open Edit Modal
function openEditModal(id, name, category, price, stock) {
  currentEditingProductId = id;
  document.getElementById('editName').value = name;
  document.getElementById('editCategory').value = category.toLowerCase();
  document.getElementById('editPrice').value = price;
  document.getElementById('editStock').value = stock;
  document.getElementById('editModal').style.display = 'flex';
}

// Close Edit Modal
function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditingProductId = null;
}

// Save Product Changes
document.getElementById('editForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    id: currentEditingProductId,
    name: document.getElementById('editName').value,
    category: document.getElementById('editCategory').value,
    price: parseFloat(document.getElementById('editPrice').value),
    stock: parseInt(document.getElementById('editStock').value)
  };
  
  // Update table row
  const row = document.querySelector(`[data-product-id="${currentEditingProductId}"]`);
  if (row) {
    row.cells[1].textContent = data.name;
    row.cells[2].textContent = data.category;
    row.cells[3].textContent = '₱' + data.price.toFixed(2);
    row.cells[4].textContent = data.stock;
  }
  
  // Update in localStorage if it's a custom product
  let products = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const productIndex = products.findIndex(p => p.id === currentEditingProductId);
  if (productIndex !== -1) {
    products[productIndex].name = data.name;
    products[productIndex].category = data.category;
    products[productIndex].price = data.price;
    products[productIndex].stock = data.stock;
    localStorage.setItem('cafe_products', JSON.stringify(products));
  }
  
  alert('Product updated successfully!\nProduct ID: ' + data.id);
  
  
  closeEditModal();
});

// Open Delete Modal
function openDeleteModal(id, name) {
  currentDeletingProductId = id;
  document.getElementById('deleteMessage').textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
}

// Close Delete Modal
function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  currentDeletingProductId = null;
}

// Confirm Delete
function confirmDelete() {
  // Remove from localStorage if it's a custom product
  let products = JSON.parse(localStorage.getItem('cafe_products')) || [];
  products = products.filter(p => p.id !== currentDeletingProductId);
  localStorage.setItem('cafe_products', JSON.stringify(products));
  
  alert('Product deleted successfully!\nProduct ID: ' + currentDeletingProductId);
  
  // Remove row from table
  const row = document.querySelector(`[data-product-id="${currentDeletingProductId}"]`);
  if (row) {
    row.remove();
  }
  
  
  closeDeleteModal();
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  const editModal = document.getElementById('editModal');
  const deleteModal = document.getElementById('deleteModal');
  
  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
});
