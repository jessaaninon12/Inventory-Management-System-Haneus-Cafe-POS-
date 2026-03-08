// Create product page functionality
lucide.createIcons();

// Simple image preview
const fileInput = document.getElementById('image');
const preview = document.getElementById('preview');

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      preview.classList.remove('empty');
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = 'No image selected';
    preview.classList.add('empty');
  }
});

// Form validation and submission
document.getElementById('createProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  // Get all form values
  const productData = {
    id: 'PROD-' + Date.now(),
    name: document.getElementById('productName').value.trim(),
    category: document.getElementById('category').value,
    price: parseFloat(document.getElementById('price').value),
    cost: parseFloat(document.getElementById('cost').value) || 0,
    stock: parseInt(document.getElementById('stock').value),
    unit: document.getElementById('unit').value,
    description: document.getElementById('description').value.trim(),
    lowStockThreshold: parseInt(document.getElementById('lowStockThreshold').value),
    image: preview.innerHTML !== 'No image selected' ? preview.querySelector('img')?.src : null,
    createdAt: new Date().toISOString()
  };

  // Validation
  const nameError = document.getElementById('nameError');
  if (!productData.name) {
    nameError.style.display = 'block';
    valid = false;
  } else {
    nameError.style.display = 'none';
  }

  if (!productData.category) {
    alert('Please select a category');
    valid = false;
  }

  if (isNaN(productData.price) || productData.price <= 0) {
    alert('Please enter a valid price');
    valid = false;
  }

  if (isNaN(productData.stock) || productData.stock < 0) {
    alert('Please enter a valid stock quantity');
    valid = false;
  }

  if (valid) {
    // Save to localStorage
    let products = JSON.parse(localStorage.getItem('cafe_products')) || [];
    products.push(productData);
    localStorage.setItem('cafe_products', JSON.stringify(products));
    
    console.log('Product created:', productData);
    alert(`Product "${productData.name}" created successfully!\n\nProduct ID: ${productData.id}`);
    

    // Navigate to products page
    window.location.href = 'products.html';
  }
});

// Cancel button
document.querySelector('button[type="button"].btn-secondary').addEventListener('click', function(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to cancel? Any unsaved data will be lost.')) {
    window.location.href = 'products.html';
  }
});
