// Manage stock page functionality
lucide.createIcons();

// Demo: Apply button alert
document.querySelectorAll('.btn-primary[style*="Apply"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    const qty = parseInt(input.value);
    if (qty !== 0) {
      alert(`Stock adjustment of ${qty > 0 ? '+' : ''}${qty} applied (demo)`);
      input.value = 0;
    }
  });
});

// Demo: History click
document.querySelectorAll('.history-badge').forEach(el => {
  el.addEventListener('click', () => {
    alert('Stock movement history (demo): Received 50 → Sold 12 → Adjusted -5 → etc.');
  });
});
