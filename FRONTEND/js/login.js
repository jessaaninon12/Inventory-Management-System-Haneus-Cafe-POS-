const API_BASE = 'http://localhost:8000';

// ── Password visibility toggle ────────────────────────────────
document.getElementById('togglePw').addEventListener('click', () => {
  const pwInput = document.getElementById('password');
  const icon    = document.getElementById('togglePwIcon');
  const show    = pwInput.type === 'password';
  pwInput.type  = show ? 'text' : 'password';
  icon.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
});

// ── Form submit ───────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
const loginBtn  = document.getElementById('loginBtn');
const errorMsg  = document.getElementById('errorMsg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';

  const username  = document.getElementById('username').value.trim();
  const password  = document.getElementById('password').value;

  if (!username || !password) {
    errorMsg.textContent = 'Please enter both username and password.';
    errorMsg.style.display = 'block';
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Logging in...';

  try {
    const res  = await fetch(`${API_BASE}/api/auth/login/`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show full-page success overlay with spinner
      document.getElementById('welcomeMsg').textContent =
        `Welcome, ${data.user.user_type} ${data.user.username}!`;
      document.getElementById('loginSuccessOverlay').style.display = 'flex';
      loginForm.closest('.right').style.visibility = 'hidden';

      // Redirect after 2 s based on role
      setTimeout(() => {
        const role = data.user.user_type;
        if (role === 'Admin') {
          window.location.href = 'dashboard.html';
        } else if (role === 'Staff') {
          window.location.href = 'staffdashboard.html';
        } else {
          // Fallback to dashboard (should not happen)
          window.location.href = 'dashboard.html';
        }
      }, 2000);
    } else {
      errorMsg.textContent = data.error || 'Invalid username or password.';
      errorMsg.style.display = 'block';
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Login';
    }
  } catch {
    errorMsg.textContent = 'Cannot connect to server. Make sure the backend is running.';
    errorMsg.style.display = 'block';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Login';
  }
});

// ── Forgot Password Modal ─────────────────────────────────────
const forgotModal = document.getElementById('forgotPasswordModal');
const forgotBtn   = document.getElementById('forgotPwBtn');
const closeForgot = document.getElementById('closeForgotModal');
const sendBtn     = document.getElementById('sendResetLink');
const resetInput  = document.getElementById('resetIdentifier');
const resetFeedback = document.getElementById('resetFeedback');

function closeForgotModal() {
  forgotModal.style.display = 'none';
  resetInput.value = '';
  resetFeedback.style.display = 'none';
}

function showResetFeedback(msg, isError = true) {
  resetFeedback.textContent = msg;
  resetFeedback.style.display = 'block';
  resetFeedback.style.background = isError ? 'rgba(220,53,69,0.18)' : 'rgba(40,167,69,0.18)';
  resetFeedback.style.borderColor = isError ? 'rgba(220,53,69,0.4)' : 'rgba(40,167,69,0.4)';
  resetFeedback.style.color = isError ? '#ffe0e3' : '#e0ffe3';
  setTimeout(() => { resetFeedback.style.display = 'none'; }, 4000);
}

forgotBtn.addEventListener('click', () => {
  forgotModal.style.display = 'flex';
  resetInput.focus();
});

closeForgot.addEventListener('click', closeForgotModal);
forgotModal.addEventListener('click', (e) => {
  if (e.target === forgotModal) closeForgotModal();
});

sendBtn.addEventListener('click', async () => {
  const identifier = resetInput.value.trim();
  if (!identifier) {
    showResetFeedback('Please enter your email or username.', true);
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();

    if (res.ok) {
      showResetFeedback(data.message || 'Reset link sent! Check your email.', false);
      closeForgotModal();
    } else {
      showResetFeedback(data.error || 'Failed to send reset link.', true);
    }
  } catch {
    showResetFeedback('Network error. Could not send request.', true);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Reset Link';s
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && forgotModal.style.display === 'flex') {
    closeForgotModal();
  }
});