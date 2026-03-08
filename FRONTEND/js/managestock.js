// Manage stock page functionality
lucide.createIcons();

let pendingStockChange = {
  productId: null,
  productName: null,
  quantity: null
};

// Load and display products from localStorage on page load
document.addEventListener('DOMContentLoaded', function() {
  loadProductsToManage();
});

function loadProductsToManage() {
  const storedProducts = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const tableBody = document.getElementById('stockTableBody');
  
  // Add custom products to manage stock table
  storedProducts.forEach(product => {
    const exists = tableBody.querySelector(`[data-product-id="${product.id}"]`);
    if (!exists) {
      const row = document.createElement('tr');
      row.setAttribute('data-product-id', product.id);
      row.setAttribute('data-product-name', product.name);
      row.setAttribute('data-current-stock', product.stock);
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.id}</td>
        <td>${product.stock} ${product.unit}</td>
        <td>
          <div class="stock-input-group">
            <button onclick="decrementStock(this)">-</button>
            <input type="number" value="0" min="0" />
            <button onclick="incrementStock(this)">+</button>
            <button class="btn btn-primary" style="margin-left:0.75rem; padding:0.5rem 1rem;" onclick="applyStockChange('${product.id}', '${product.name}', '${product.stock} ${product.unit}')">Apply</button>
          </div>
        </td>
        <td>Just now</td>
        <td><span class="history-badge" onclick="openHistoryModal('${product.id}', '${product.name}')">View log</span></td>
      `;
      tableBody.appendChild(row);
    }
  });
  
  lucide.createIcons();
}

// Helper functions for stock adjustment buttons
function incrementStock(btn) {
  const input = btn.previousElementSibling;
  input.value = parseInt(input.value || 0) + 1;
}

function decrementStock(btn) {
  const input = btn.nextElementSibling;
  const currentValue = parseInt(input.value || 0);
  if (currentValue > 0) {
    input.value = currentValue - 1;
  }
}

// Apply Stock Change
function applyStockChange(productId, productName, currentStock) {
  const row = document.querySelector(`[data-product-id="${productId}"]`);
  const input = row.querySelector('.stock-input-group input');
  const quantityChange = parseInt(input.value || 0);
  
  if (quantityChange === 0) {
    alert('Please enter a quantity to adjust');
    return;
  }
  
  pendingStockChange = {
    productId: productId,
    productName: productName,
    quantity: quantityChange,
    currentStock: currentStock
  };
  
  const operation = quantityChange > 0 ? 'Add' : 'Remove';
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
        <p style="font-size:1.5rem; font-weight:600;">${quantityChange > 0 ? '+' : ''}${quantityChange} units</p>
        <p style="color:#999; font-size:0.875rem; margin-top:0.5rem;">${operation}</p>
      </div>
    </div>
  `;
  
  document.getElementById('stockConfirmModal').style.display = 'flex';
}

// Close Stock Confirm Modal
function closeStockConfirmModal() {
  document.getElementById('stockConfirmModal').style.display = 'none';
  pendingStockChange = {
    productId: null,
    productName: null,
    quantity: null
  };
}

// Confirm Stock Change
function confirmStockChange() {
  const adjustmentData = {
    productId: pendingStockChange.productId,
    quantity: pendingStockChange.quantity,
    timestamp: new Date().toISOString(),
    type: pendingStockChange.quantity > 0 ? 'in' : 'out'
  };
  
  // Update stock in localStorage
  let products = JSON.parse(localStorage.getItem('cafe_products')) || [];
  const productIndex = products.findIndex(p => p.id === pendingStockChange.productId);
  if (productIndex !== -1) {
    products[productIndex].stock += pendingStockChange.quantity;
    localStorage.setItem('cafe_products', JSON.stringify(products));
  }
  
  console.log('Stock adjustment:', adjustmentData);
  
  alert(`Stock adjustment confirmed!\n\nProduct ID: ${adjustmentData.productId}\nQuantity: ${adjustmentData.quantity > 0 ? '+' : ''}${adjustmentData.quantity}\n\nReady to send to backend.`);
  

  
  // Reset the input field
  const row = document.querySelector(`[data-product-id="${pendingStockChange.productId}"]`);
  const input = row.querySelector('.stock-input-group input');
  input.value = 0;
  
  closeStockConfirmModal();
}

// Open History Modal
function openHistoryModal(productId, productName) {
  document.getElementById('historyProductName').textContent = productName;
  
  // Sample history data
  const sampleHistory = [
    {
      date: 'March 5, 2026',
      time: '14:30',
      action: 'Stock Received',
      quantity: '+50',
      reference: 'PO-2026-0145',
      notes: 'Delivery from ABC Supplies'
    },
    {
      date: 'March 3, 2026',
      time: '10:15',
      action: 'Manual Adjustment',
      quantity: '-5',
      reference: 'ADJ-0089',
      notes: 'Damaged units removed'
    },
    {
      date: 'March 1, 2026',
      time: '09:00',
      action: 'Stock Received',
      quantity: '+30',
      reference: 'PO-2026-0128',
      notes: 'Delivery from ABC Supplies'
    },
    {
      date: 'Feb 28, 2026',
      time: '16:45',
      action: 'Stock Received',
      quantity: '+25',
      reference: 'PO-2026-0115',
      notes: 'Delivery from ABC Supplies'
    }
  ];
  
  let historyHTML = '<table style="width:100%; border-collapse:collapse;">';
  historyHTML += '<tr style="border-bottom:2px solid #eee;"><th style="text-align:left; padding:1rem 0; font-weight:600;">Date</th><th style="text-align:left; padding:1rem 0; font-weight:600;">Action</th><th style="text-align:left; padding:1rem 0; font-weight:600;">Quantity</th><th style="text-align:left; padding:1rem 0; font-weight:600;">Reference</th></tr>';
  
  sampleHistory.forEach(item => {
    historyHTML += `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:1rem 0; color:#666;">
          <div>${item.date}</div>
          <div style="font-size:0.875rem; color:#999;">${item.time}</div>
        </td>
        <td style="padding:1rem 0;">
          <div style="font-weight:500;">${item.action}</div>
          <div style="font-size:0.875rem; color:#999;">${item.notes}</div>
        </td>
        <td style="padding:1rem 0;">
          <span style="font-weight:600; color:${item.quantity.startsWith('+') ? '#15803d' : '#b91c1c'};">${item.quantity}</span>
        </td>
        <td style="padding:1rem 0; color:#999;">${item.reference}</td>
      </tr>
    `;
  });
  
  historyHTML += '</table>';
  
  document.getElementById('historyContent').innerHTML = historyHTML;
  document.getElementById('historyModal').style.display = 'flex';
}

// Close History Modal
function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  const confirmModal = document.getElementById('stockConfirmModal');
  const historyModal = document.getElementById('historyModal');
  
  if (event.target === confirmModal) {
    closeStockConfirmModal();
  }
  if (event.target === historyModal) {
    closeHistoryModal();
  }
});

