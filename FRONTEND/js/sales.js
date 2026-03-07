// Sales page functionality
lucide.createIcons();

// Demo interactions
document.querySelectorAll('.btn-view').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Opening order details... (demo)');
  });
});

document.querySelectorAll('.btn-refund').forEach(btn => {
  btn.addEventListener('click', () => {
    if (confirm('Process refund for this order?')) {
      alert('Refund processed (demo)');
    }
  });
});
