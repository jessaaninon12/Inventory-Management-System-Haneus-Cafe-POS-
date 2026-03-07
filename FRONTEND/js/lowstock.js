// Low stock page functionality
lucide.createIcons();

// Optional: simple alert click simulation
document.querySelectorAll('.btn-restock').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Restock request initiated for this product (demo)');
  });
});
