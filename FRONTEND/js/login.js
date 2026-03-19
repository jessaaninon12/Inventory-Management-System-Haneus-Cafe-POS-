const API_BASE = 'http://localhost:8000';

// ── Details/summary dropdown ──────────────────────────────
const dropdown     = document.getElementById('userTypeDropdown');
const display      = document.getElementById('userTypeDisplay');
const hiddenInput  = document.getElementById('userType');

// Position dropdown menu fixed so it escapes any overflow:hidden/auto ancestor
function positionDropdownMenu() {
  const menu = dropdown.querySelector('.dropdown-menu');
  if (!menu) return;
  const rect = dropdown.getBoundingClientRect();
  menu.style.top   = (rect.bottom + 4) + 'px';
  menu.style.left  = rect.left + 'px';
  menu.style.width = rect.width + 'px';
}

dropdown.addEventListener('toggle', () => {
  if (dropdown.open) positionDropdownMenu();
});
window.addEventListener('resize', () => { if (dropdown.open) positionDropdownMenu(); });

document.querySelectorAll('#userTypeDropdown .dropdown-menu li').forEach(item => {
  item.addEventListener('click', () => {
    hiddenInput.value  = item.dataset.value;
    display.textContent = item.textContent.trim();
    dropdown.removeAttribute('open');
    dropdown.classList.add('selected');
  });
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) dropdown.removeAttribute('open');
});

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
  const user_type = hiddenInput.value;

  if (!user_type) {
    errorMsg.textContent = 'Please select an account type.';
    errorMsg.style.display = 'block';
    return;
  }

  loginBtn.disabled    = true;
  loginBtn.textContent = 'Logging in...';

  try {
    const res  = await fetch(`${API_BASE}/api/auth/login/`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ username, password, user_type }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));

      // Show full-page success overlay with spinner
      document.getElementById('welcomeMsg').textContent =
        `${data.user.user_type} Welcome, ${data.user.username}!`;
      document.getElementById('loginSuccessOverlay').style.display = 'flex';
      loginForm.closest('.right').style.visibility = 'hidden';

      // Redirect after 2 s (spinner plays for 2 s)
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
    } else {
      errorMsg.textContent = data.error || 'Invalid username, password, or account type.';
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
