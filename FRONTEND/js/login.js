// Login page functionality
lucide.createIcons();

// Form submit — POST to Django backend
const API_BASE = 'http://localhost:8000';
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';

  const form = e.target;
  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Store user data and redirect to dashboard
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      errorMsg.textContent = data.error || 'Invalid username or password.';
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    errorMsg.textContent = 'Cannot connect to server. Make sure the backend is running.';
    errorMsg.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});
