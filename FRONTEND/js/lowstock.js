// Low stock page functionality
lucide.createIcons();

let currentRestockingProductId = null;
let currentViewingProductId = null;

// Load and display low stock products from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
  loadLowStockFromStorage();
});

function loadLowStockFromStorage() {
  const storedProducts = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const tableBody = document.getElementById('lowStockTableBody');
  
  // Add custom products that are low stock
  storedProducts.forEach(product => {
    if (product.stock <= product.lowStockThreshold) {
      const exists = tableBody.querySelector(`[data-product-id="${product.id}"]`);
      if (!exists) {
        const percentage = ((product.stock / product.lowStockThreshold) * 100).toFixed(0);
        const isCritical = product.stock <= product.lowStockThreshold / 2;
        const statusClass = isCritical ? 'status-critical' : 'status-low';
        const fillClass = isCritical ? 'progress-fill-critical' : 'progress-fill-low';
        const statusText = isCritical ? 'Critical' : 'Low';
        
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', product.id);
        row.setAttribute('data-stock', product.stock);
        row.setAttribute('data-reorder', product.lowStockThreshold);
        row.innerHTML = `
          <td>${product.name}</td>
          <td>${product.id}</td>
          <td>${product.category}</td>
          <td>${product.stock}</td>
          <td>${product.lowStockThreshold}</td>
          <td>
            <span class="${statusClass}">${statusText}</span>
            <div class="progress-bar"><div class="${fillClass}" style="width: ${percentage}%;"></div></div>
          </td>
          <td class="actions">
            <button class="btn btn-restock" onclick="openRestockModal('${product.id}', '${product.name}', ${product.stock})">Restock</button>
            <button class="btn btn-view" onclick="openViewModal('${product.id}', '${product.name}', '${product.category}', ${product.stock}, ${product.lowStockThreshold})">View</button>
          </td>
        `;
        tableBody.appendChild(row);
      }
    }
  });
  
  lucide.createIcons();
}

// Open Restock Modal
function openRestockModal(id, name, currentStock) {
  currentRestockingProductId = id;
  document.getElementById('restockProductName').textContent = `${name} (Current Stock: ${currentStock})`;
  document.getElementById('restockModal').style.display = 'flex';
  document.getElementById('restockQuantity').value = 10;
}

// Close Restock Modal
function closeRestockModal() {
  document.getElementById('restockModal').style.display = 'none';
  currentRestockingProductId = null;
}

// Handle Restock Form Submission
document.getElementById('restockForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const quantity = parseInt(document.getElementById('restockQuantity').value);
  
  const restockData = {
    productId: currentRestockingProductId,
    quantity: quantity,
    supplier: document.getElementById('restockSupplier').value || 'Not specified',
    notes: document.getElementById('restockNotes').value || 'None',
    timestamp: new Date().toISOString()
  };
  
  // Update stock in localStorage
  let products = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const productIndex = products.findIndex(p => p.id === currentRestockingProductId);
  if (productIndex !== -1) {
    products[productIndex].stock += quantity;
    localStorage.setItem('cafe_products', JSON.stringify(products));
  }
  
  console.log('Restock request:', restockData);
  
  alert(`Restock confirmed!\n\nQuantity: ${restockData.quantity}\nSupplier: ${restockData.supplier}\n\nReady to send to backend.`);
  
  
  closeRestockModal();
});

// Open View Modal
function openViewModal(id, name, category, currentStock, reorderLevel) {
  currentViewingProductId = id;
  document.getElementById('viewProductName').textContent = name;
  
  const percentage = ((currentStock / reorderLevel) * 100).toFixed(0);
  const status = currentStock <= reorderLevel / 2 ? 'Critical' : 'Low';
  
  document.getElementById('viewProductDetails').innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Product ID</p>
        <p style="font-weight:500; font-size:1.125rem;">#${id}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Category</p>
        <p style="font-weight:500; font-size:1.125rem;">${category}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Current Stock</p>
        <p style="font-weight:500; font-size:1.125rem;">${currentStock} units</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Reorder Level</p>
        <p style="font-weight:500; font-size:1.125rem;">${reorderLevel} units</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Status</p>
        <p style="font-weight:500; font-size:1.125rem; color:${status === 'Critical' ? '#b91c1c' : '#ea580c'};">${status}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Stock Level</p>
        <p style="font-weight:500; font-size:1.125rem;">${percentage}% of reorder point</p>
      </div>
    </div>
    <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid #eee;">
      <p style="color:#999; font-size:0.875rem; margin-bottom:0.5rem;">Recommendation</p>
      <p style="font-size:0.95rem; color:#333;">
        Reorder at least <strong>${reorderLevel - currentStock}</strong> units to reach the reorder level.
      </p>
    </div>
  `;
  
  document.getElementById('viewModal').style.display = 'flex';
}

// Close View Modal
function closeViewModal() {
  document.getElementById('viewModal').style.display = 'none';
  currentViewingProductId = null;
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  const restockModal = document.getElementById('restockModal');
  const viewModal = document.getElementById('viewModal');
  
  if (event.target === restockModal) {
    closeRestockModal();
  }
  if (event.target === viewModal) {
    closeViewModal();
  }
});
