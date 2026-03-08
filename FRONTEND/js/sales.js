// Sales page function
lucide.createIcons();

let currentViewingOrderId = null;
let currentRefundingOrderId = null;
let currentRefundingAmount = null;

// open order
function openOrderModal(orderId, customer, amount, status, items) {
  currentViewingOrderId = orderId;
  document.getElementById('orderTitle').textContent = orderId;
  
  let itemsHTML = '<ul style="list-style:none; padding:0;">';
  items.forEach(item => {
    itemsHTML += `<li style="padding:0.5rem 0; border-bottom:1px solid #eee;"><span style="color:#333;">${item}</span></li>`;
  });
  itemsHTML += '</ul>';
  
  const statusColor = status === 'completed' ? '#15803d' : status === 'pending' ? '#ea580c' : '#666';
  
  document.getElementById('orderDetails').innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:2rem;">
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Customer</p>
        <p style="font-weight:500; font-size:1.125rem;">${customer}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Status</p>
        <p style="font-weight:500; font-size:1.125rem; color:${statusColor}; text-transform:capitalize;">${status}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Total Amount</p>
        <p style="font-weight:600; font-size:1.25rem;">₱${amount}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem; margin-bottom:0.25rem;">Order Date</p>
        <p style="font-weight:500;">Mar 01, 2026 • 19:45</p>
      </div>
    </div>
    
    <div style="margin-top:2rem;">
      <h3 style="margin-bottom:1rem;">Order Items</h3>
      ${itemsHTML}
    </div>
  `;
  
  document.getElementById('orderModal').style.display = 'flex';
}

// Close Order Modal
function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
  currentViewingOrderId = null;
}

// Open Refund Modal
function openRefundModal(orderId, customer, amount) {
  currentRefundingOrderId = orderId;
  currentRefundingAmount = amount;
  
  document.getElementById('refundDetails').innerHTML = `
    <div style="display:grid; gap:1rem; padding:1rem; background:#f5f5f5; border-radius:4px;">
      <div>
        <p style="color:#999; font-size:0.875rem;">Order ID</p>
        <p style="font-weight:500;">${orderId}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem;">Customer</p>
        <p style="font-weight:500;">${customer}</p>
      </div>
      <div>
        <p style="color:#999; font-size:0.875rem;">Refund Amount</p>
        <p style="font-weight:600; font-size:1.25rem; color:#15803d;">₱${amount}</p>
      </div>
    </div>
  `;
  
  document.getElementById('refundModal').style.display = 'flex';
}

// Close Refund Modal
function closeRefundModal() {
  document.getElementById('refundModal').style.display = 'none';
  document.getElementById('refundForm').reset();
  currentRefundingOrderId = null;
  currentRefundingAmount = null;
}

// Handle Refund Form Submission
document.getElementById('refundForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const refundData = {
    orderId: currentRefundingOrderId,
    amount: currentRefundingAmount,
    reason: document.getElementById('refundReason').value,
    notes: document.getElementById('refundNotes').value || 'None',
    timestamp: new Date().toISOString()
  };
  
  console.log('Refund request:', refundData);
  
  
  if (!refundData.reason) {
    alert('Please select a refund reason');
    return;
  }
  
  alert(`Refund processed!\n\nOrder: ${refundData.orderId}\nAmount: ₱${refundData.amount}\nReason: ${refundData.reason}\n\nReady to send to backend.`);
  
  
  closeRefundModal();
});

// Close modals when click outside
window.addEventListener('click', function(event) {
  const orderModal = document.getElementById('orderModal');
  const refundModal = document.getElementById('refundModal');
  
  if (event.target === orderModal) {
    closeOrderModal();
  }
  if (event.target === refundModal) {
    closeRefundModal();
  }
});
