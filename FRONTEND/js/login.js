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
let isLoggingIn = false;   // prevent multiple submissions

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isLoggingIn) return;  // already in progress

  errorMsg.style.display = 'none';

  const username  = document.getElementById('username').value.trim();
  const password  = document.getElementById('password').value;

  if (!username || !password) {
    errorMsg.textContent = 'Please enter both username and password.';
    errorMsg.style.display = 'block';
    return;
  }

  isLoggingIn = true;
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
      // Store user data and role separately
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_type', data.user.user_type);

      // Check if user needs to change temporary password
      if (data.user.require_password_change) {
        // Show forced password change modal instead of success overlay
        showForcedPasswordChangeModal(data.user);
      } else {
        // Normal login flow: show success overlay and redirect
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
            window.location.href = 'dashboard.html';
          }
        }, 2000);
      }
    } else {
      errorMsg.textContent = data.error || 'Invalid username or password.';
      errorMsg.style.display = 'block';
      loginBtn.disabled    = false;
      loginBtn.textContent = 'Login';
      isLoggingIn = false;
    }
  } catch {
    errorMsg.textContent = 'Cannot connect to server. Make sure the backend is running.';
    errorMsg.style.display = 'block';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Login';
    isLoggingIn = false;
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
  const email = resetInput.value.trim();
  if (!email) {
    showResetFeedback('Please enter your email address.', true);
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (res.ok) {
      showResetFeedback(data.message || 'If an account exists, a reset link will be sent to your email.', false);
      closeForgotModal();
    } else {
      showResetFeedback(data.error || 'Failed to send reset link.', true);
    }
  } catch {
    showResetFeedback('Network error. Could not send request.', true);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Reset Link';
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && forgotModal.style.display === 'flex') {
    closeForgotModal();
  }
});

// ── Forced Password Change Modal ──────────────────────────────────
function showForcedPasswordChangeModal(user) {
  const modal = document.getElementById('forcedPasswordChangeModal');
  if (!modal) {
    console.error('Forced password change modal not found in HTML.');
    return;
  }
  
  document.getElementById('forcedPwMsg').textContent = 
    `Welcome ${user.first_name}! You must change your password before proceeding.`;
  modal.style.display = 'flex';
  loginForm.closest('.right').style.visibility = 'hidden';
  document.getElementById('newForcedPassword').focus();
}

function closeForcedPasswordChangeModal() {
  const modal = document.getElementById('forcedPasswordChangeModal');
  if (modal) modal.style.display = 'none';
  document.getElementById('newForcedPassword').value = '';
  document.getElementById('confirmForcedPassword').value = '';
  document.getElementById('forcedPwError').style.display = 'none';
}

if (document.getElementById('submitForcedPassword')) {
  document.getElementById('submitForcedPassword').addEventListener('click', async () => {
    const newPw = document.getElementById('newForcedPassword').value;
    const confirmPw = document.getElementById('confirmForcedPassword').value;
    const errorDiv = document.getElementById('forcedPwError');
    const submitBtn = document.getElementById('submitForcedPassword');
    const user = JSON.parse(localStorage.getItem('user'));
    
    errorDiv.style.display = 'none';
    
    if (!newPw || !confirmPw) {
      errorDiv.textContent = 'Both password fields are required.';
      errorDiv.style.display = 'block';
      return;
    }
    if (newPw.length < 6) {
      errorDiv.textContent = 'Password must be at least 6 characters.';
      errorDiv.style.display = 'block';
      return;
    }
    if (newPw !== confirmPw) {
      errorDiv.textContent = 'Passwords do not match.';
      errorDiv.style.display = 'block';
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-temporary-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, new_password: newPw }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Update user object to clear forced password change flag
        user.require_password_change = false;
        localStorage.setItem('user', JSON.stringify(user));
        
        // Show success and redirect
        closeForcedPasswordChangeModal();
        document.getElementById('welcomeMsg').textContent = `Welcome, ${user.user_type} ${user.username}!`;
        document.getElementById('loginSuccessOverlay').style.display = 'flex';
        
        setTimeout(() => {
          const role = user.user_type;
          if (role === 'Admin') {
            window.location.href = 'dashboard.html';
          } else if (role === 'Staff') {
            window.location.href = 'staffdashboard.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 2000);
      } else {
        errorDiv.textContent = data.error || 'Failed to update password.';
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.textContent = 'Network error. Could not update password.';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Change Password';
    }
  });
}
