// Register page function
lucide.createIcons();

// Form submit — POST to Django backend
const API_BASE = 'http://localhost:8000';
const signupBtn = document.querySelector('.btn-signup');

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  if (password.length < 6) {
    alert("Password should be at least 6 characters long.");
    return;
  }

  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating account...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert('Account created successfully! Please log in.');
      window.location.href = 'login.html';
    } else {
      const errorMsg = data.email?.[0] || data.detail || data.error || 'Registration failed. Please try again.';
      alert(errorMsg);
    }
  } catch (err) {
    alert('Cannot connect to server. Make sure the backend is running.');
  } finally {
    signupBtn.disabled = false;
    signupBtn.textContent = 'Sign Up';
  }
});
