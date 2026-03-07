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

// Very basic form validation (client-side only)
document.getElementById('createProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  let valid = true;

  const name = document.getElementById('productName');
  if (!name.value.trim()) {
    document.getElementById('nameError').style.display = 'block';
    valid = false;
  } else {
    document.getElementById('nameError').style.display = 'none';
  }

  if (valid) {
    alert('Product created successfully! (This is a demo — no data is actually saved)');
    // In real app → send to backend via fetch/axios
    // window.location.href = 'products.html';
  }
});
