/* =================================================================
   register.js  —  Wizard + dropdown + overlay success
================================================================= */
const API_BASE = 'http://localhost:8000';

// ── DOM refs ────────────────────────────────────────────────────
const wizardTrack    = document.getElementById('wizardTrack');
const wizardWrapper  = wizardTrack ? wizardTrack.closest('.wizard-wrapper') : null;
const dot1           = document.getElementById('dot1');
const dot2           = document.getElementById('dot2');
const nextBtn        = document.getElementById('nextBtn');
const prevBtn        = document.getElementById('prevBtn');
const submitBtn      = document.getElementById('submitBtn');
const signupForm     = document.getElementById('signupForm');
const regSuccessMsg  = document.getElementById('regSuccessMsg');
const regErrorMsg    = document.getElementById('regErrorMsg');
const hiddenUserType = document.getElementById('userType');
const userTypeDropdown = document.getElementById('userTypeDropdown');
const userTypeDisplay  = document.getElementById('userTypeDisplay');

// ── Details/summary dropdown ──────────────────────────────────
function positionRegDropdown() {
  if (!userTypeDropdown) return;
  const menu = userTypeDropdown.querySelector('.dropdown-menu');
  if (!menu) return;
  const rect = userTypeDropdown.getBoundingClientRect();
  menu.style.top   = (rect.bottom + 4) + 'px';
  menu.style.left  = rect.left + 'px';
  menu.style.width = rect.width + 'px';
}

if (userTypeDropdown) {
  userTypeDropdown.addEventListener('toggle', () => {
    if (userTypeDropdown.open) positionRegDropdown();
  });
  window.addEventListener('resize', () => { if (userTypeDropdown.open) positionRegDropdown(); });

  document.querySelectorAll('#userTypeDropdown .dropdown-menu li').forEach(item => {
    item.addEventListener('click', () => {
      hiddenUserType.value      = item.dataset.value;
      userTypeDisplay.textContent = item.textContent.trim();
      userTypeDropdown.removeAttribute('open');
      userTypeDropdown.classList.add('selected');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!userTypeDropdown.contains(e.target)) {
      userTypeDropdown.removeAttribute('open');
    }
  });
}

// ── Wizard height helper ─────────────────────────────────────────
function syncWrapperHeight() {
  if (!wizardWrapper) return;
  const activeStep = wizardTrack.children[currentStep];
  if (activeStep) {
    wizardWrapper.style.height = activeStep.scrollHeight + 'px';
  }
}

// ── Wizard state ────────────────────────────────────────────────
let currentStep = 0;

function goToStep(n) {
  currentStep = n;
  // Step 0: use 'none' so no CSS containing block traps position:fixed dropdown.
  // Step 1+: translateX(-50%) per step (track is 200% wide).
  wizardTrack.style.transform = n === 0 ? 'none' : `translateX(-${n * 50}%)`;
  dot1.classList.toggle('active', n === 0);
  dot2.classList.toggle('active', n === 1);
  hideError();
  // Sync immediately so step-nav buttons are never clipped,
  // then re-sync after transition for final settled height.
  syncWrapperHeight();
  setTimeout(syncWrapperHeight, 450);
}

// Set initial height — use requestAnimationFrame so layout is fully computed
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(syncWrapperHeight);
});
window.addEventListener('resize', syncWrapperHeight);

// ── Error helpers ───────────────────────────────────────────────
function showError(msg) {
  regErrorMsg.textContent    = msg;
  regErrorMsg.style.display  = 'block';
}

function hideError() {
  regErrorMsg.style.display  = 'none';
  regErrorMsg.textContent    = '';
}

// ── Step 1 validation ───────────────────────────────────────────
function validateStep1() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const userType  = hiddenUserType ? hiddenUserType.value : '';

  if (!firstName) { showError('First name is required.');           return false; }
  if (!lastName)  { showError('Last name is required.');            return false; }
  if (!userType)  { showError('Please select an account type.');    return false; }
  return true;
}

// ── Step 2 validation ───────────────────────────────────────────
function validateStep2() {
  const username        = document.getElementById('username').value.trim();
  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!username)                       { showError('Username is required.');                      return false; }
  if (!email)                          { showError('Email is required.');                         return false; }
  if (!/\S+@\S+\.\S+/.test(email))    { showError('Enter a valid email address.');               return false; }
  if (!password)                       { showError('Password is required.');                      return false; }
  if (password.length < 6)             { showError('Password must be at least 6 characters.');   return false; }
  if (password !== confirmPassword)    { showError('Passwords do not match.');                    return false; }
  return true;
}

// ── Navigation ──────────────────────────────────────────────────
nextBtn.addEventListener('click', () => {
  if (validateStep1()) goToStep(1);
});

prevBtn.addEventListener('click', () => goToStep(0));

// ── Password toggles ────────────────────────────────────────────
function setupToggle(btnId, iconId, inputId) {
  const btn   = document.getElementById(btnId);
  const icon  = document.getElementById(iconId);
  const input = document.getElementById(inputId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const show     = input.type === 'password';
    input.type     = show ? 'text' : 'password';
    icon.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
  });
}

setupToggle('togglePw1', 'togglePw1Icon', 'password');
setupToggle('togglePw2', 'togglePw2Icon', 'confirmPassword');

// ── Real-time username uniqueness check ──────────────────────────
(function setupUsernameCheck() {
  const input = document.getElementById('username');
  if (!input) return;

  // Insert hint element right after the username input-group
  const group = input.closest('.input-group');
  const hint  = document.createElement('p');
  hint.className = 'field-hint';
  hint.setAttribute('aria-live', 'polite');
  group.insertAdjacentElement('afterend', hint);

  // Clear hint on every keystroke
  input.addEventListener('input', () => {
    hint.className  = 'field-hint';
    hint.textContent = '';
    input.classList.remove('username-error', 'username-ok');
    syncWrapperHeight();
  });

  // Check on blur
  input.addEventListener('blur', async () => {
    const val = input.value.trim();
    if (!val) return;
    try {
      const res  = await fetch(`${API_BASE}/api/auth/check-username/?username=${encodeURIComponent(val)}`);
      const data = await res.json();
      if (!data.available) {
        hint.className   = 'field-hint hint-error';
        hint.textContent = '\u26A0 Username already used';
        input.classList.add('username-error');
      } else {
        hint.className   = 'field-hint hint-ok';
        hint.textContent = '\u2713 Username available';
        input.classList.add('username-ok');
      }
    } catch {
      /* silent \u2014 server will validate on submit */
    }
    syncWrapperHeight(); // recalculate height after hint appears
  });
}());

// ── Admin Approval Waiting + Polling ────────────────────────
/**
 * Show the "Waiting for admin permission..." overlay and poll the backend
 * every 5 seconds for the approval decision.
 * - On 'approved': show "Welcome!" then redirect to login.html
 * - On 'rejected': show rejection message and a back-to-login link
 */
function showAdminApprovalWaiting(userId) {
  const overlay   = document.getElementById('adminApprovalOverlay');
  const statusMsg = document.getElementById('approvalStatusMsg');
  if (!overlay || !statusMsg) return;

  statusMsg.textContent = 'Waiting for admin approval. The system will send an email once approved.';
  overlay.style.display = 'flex';

  // Poll every 5 seconds
  const pollInterval = setInterval(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/admin/check-approval-status/?user_id=${userId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === 'approved') {
        clearInterval(pollInterval);
        // Hide spinner
        const spinner = overlay.querySelector('.pl');
        if (spinner) spinner.style.display = 'none';
        statusMsg.textContent = 'Welcome!';
        // Redirect to login after 2 seconds
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);

      } else if (data.status === 'rejected') {
        clearInterval(pollInterval);
        // Hide spinner
        const card    = overlay.querySelector('.reg-overlay-card');
        const spinner = overlay.querySelector('.pl');
        if (spinner) spinner.style.display = 'none';
        statusMsg.textContent = "Sorry your request didn't get granted!";
        // Show back-to-login link
        setTimeout(() => {
          if (card) {
            const link = document.createElement('a');
            link.href        = 'login.html';
            link.textContent = 'Back to Login';
            link.style.cssText = [
              'display:inline-block',
              'margin-top:1.25rem',
              'padding:0.5rem 1.5rem',
              'background:#c47b42',
              'color:#fff',
              'border-radius:0.5rem',
              'text-decoration:none',
              'font-weight:500',
              'font-size:0.9rem',
            ].join(';');
            card.appendChild(link);
          }
        }, 800);
      }
      // If 'pending', keep polling
    } catch (e) {
      // Network error — silently keep polling
    }
  }, 5000);
}

// ── Input Normalization Helpers ──────────────────────────────
function normalizeSentenceCase(value) {
  // Capitalize first letter, rest lowercase
  return value.trim() ? value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase() : '';
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function normalizeUsername(value) {
  // Sentence case: first word capitalized, rest lowercase
  const trimmed = value.trim();
  const words = trimmed.split(/\s+/);
  if (words.length > 0) {
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    for (let i = 1; i < words.length; i++) {
      words[i] = words[i].toLowerCase();
    }
  }
  return words.join(' ');
}

// ── Form submission ──────────────────────────────────
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep2()) return;

  // Apply input normalization before submission
  let first_name       = document.getElementById('firstName').value.trim();
  let last_name        = document.getElementById('lastName').value.trim();
  const user_type        = hiddenUserType ? hiddenUserType.value : '';
  let username         = document.getElementById('username').value.trim();
  let email            = document.getElementById('email').value.trim();
  const password         = document.getElementById('password').value;
  const confirm_password = document.getElementById('confirmPassword').value;

  // Normalize inputs
  first_name = normalizeSentenceCase(first_name);
  last_name = normalizeSentenceCase(last_name);
  email = normalizeEmail(email);
  username = normalizeUsername(username);

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Creating...';
  hideError();

  try {
    const res = await fetch(`${API_BASE}/api/auth/register/`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        first_name, last_name, username, email,
        password, confirm_password, user_type
      }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // For Admin accounts, show the waiting-for-approval overlay with real-time polling
      if (user_type === 'Admin') {
        const userId = data.user && data.user.id;
        hideError();
        showAdminApprovalWaiting(userId);
      } else {
        // For Staff accounts, show normal success message
        document.getElementById('regSuccessMsg').textContent =
          `${user_type} Account Successfully Created!`;
        document.getElementById('regSuccessOverlay').style.display = 'flex';
        hideError();
        setTimeout(() => { window.location.href = 'login.html'; }, 2000);
      }
    } else {
      const msg =
        (Array.isArray(data.errors) ? data.errors[0] : data.errors) ||
        data.username?.[0]         ||
        data.email?.[0]            ||
        data.password?.[0]         ||
        data.confirm_password?.[0] ||
        data.first_name?.[0]       ||
        data.last_name?.[0]        ||
        data.user_type?.[0]        ||
        data.detail                ||
        data.error                 ||
        'Registration failed. Please try again.';
      showError(msg);
    }
  } catch {
    showError('Cannot connect to server. Make sure the backend is running.');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Create Account';
  }
});
