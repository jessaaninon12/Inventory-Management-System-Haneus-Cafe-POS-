// Create product page — API-driven with image upload
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
const fileInput = document.getElementById('image');
const preview = document.getElementById('preview');
let selectedFile = null;

fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function(event) {
      preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
      preview.classList.remove('empty');
    };
    reader.readAsDataURL(file);
  } else {
    selectedFile = null;
    preview.innerHTML = 'No image selected';
    preview.classList.add('empty');
  }
});

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  // Return absolute URL so it works from the frontend
  return `http://127.0.0.1:8000${data.url}`;
}

document.getElementById('createProductForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  let valid = true;

  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('category').value;
  const price = parseFloat(document.getElementById('price').value);
  const cost = parseFloat(document.getElementById('cost').value) || 0;
  const stock = parseInt(document.getElementById('stock').value);
  const unit = document.getElementById('unit').value;
  const description = document.getElementById('description').value.trim();
  const lowStockThreshold = parseInt(document.getElementById('lowStockThreshold').value);

  const nameError = document.getElementById('nameError');
  if (!name) { nameError.style.display = 'block'; valid = false; } else { nameError.style.display = 'none'; }
  if (!category) { alert('Please select a category'); valid = false; }
  if (isNaN(price) || price <= 0) { alert('Please enter a valid price'); valid = false; }
  if (isNaN(stock) || stock < 0) { alert('Please enter a valid stock quantity'); valid = false; }

  if (!valid) return;

  try {
    // Upload image first (if selected)
    let image_url = null;
    if (selectedFile) {
      image_url = await uploadImage(selectedFile);
    }

    const body = { name, category, price, cost, stock, unit, description, low_stock_threshold: lowStockThreshold };
    if (image_url) body.image_url = image_url;

    const res = await fetch(`${API}/products/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      alert('Error: ' + JSON.stringify(err.errors || err));
      return;
    }

    const product = await res.json();
    alert(`Product "${product.name}" created successfully!\nID: ${product.id}`);
    window.location.href = 'products.html';
  } catch (err) {
    console.error(err);
    alert('Failed to create product. Is the backend running?');
  }
});

document.querySelector('button[type="button"].btn-secondary').addEventListener('click', function(e) {
  e.preventDefault();
  if (confirm('Are you sure you want to cancel? Any unsaved data will be lost.')) {
    window.location.href = 'products.html';
  }
});
