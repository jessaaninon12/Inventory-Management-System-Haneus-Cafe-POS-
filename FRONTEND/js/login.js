/* ================================================================
   login.js — Login + Unified Reset Password Wizard
   ================================================================ */
const API_BASE = 'http://localhost:8000';

// ── Password visibility toggle ────────────────────────────────
document.getElementById('togglePw').addEventListener('click', function () {
  var pwInput = document.getElementById('password');
  var icon    = document.getElementById('togglePwIcon');
  var show    = pwInput.type === 'password';
  pwInput.type  = show ? 'text' : 'password';
  icon.className = show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
});

// ── Form submit ───────────────────────────────────────────
var loginForm = document.getElementById('loginForm');
var loginBtn  = document.getElementById('loginBtn');
var errorMsg  = document.getElementById('errorMsg');
var isLoggingIn = false;

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (isLoggingIn) return;

  errorMsg.style.display = 'none';

  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value;

  if (!username || !password) {
    errorMsg.textContent = 'Please enter both username and password.';
    errorMsg.style.display = 'block';
    return;
  }

  isLoggingIn = true;
  loginBtn.disabled    = true;
  loginBtn.textContent = 'Logging in...';

  try {
    var res  = await fetch(API_BASE + '/api/auth/login/', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ username: username, password: password }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_type', data.user.user_type);

      // Check if user needs forced CODE reset
      if (data.user.require_password_change) {
        showForcedCodeReset(data.user);
      } else {
        // Normal login → success overlay + redirect
        document.getElementById('welcomeMsg').textContent =
          'Welcome, ' + data.user.user_type + ' ' + data.user.username + '!';
        document.getElementById('loginSuccessOverlay').style.display = 'flex';
        loginForm.closest('.right').style.visibility = 'hidden';

        setTimeout(function () {
          var role = data.user.user_type;
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
  } catch (err) {
    errorMsg.textContent = 'Cannot connect to server. Make sure the backend is running.';
    errorMsg.style.display = 'block';
    loginBtn.disabled    = false;
    loginBtn.textContent = 'Login';
    isLoggingIn = false;
  }
});


/* ================================================================
   UNIFIED RESET PASSWORD WIZARD
   ================================================================
   Steps layout (inside resetTrack):
     Index 0 → Step 0: Option Selector
     Index 1 → e1: Email Phase 1 (enter email)
     Index 2 → e2: Email Phase 2 (enter CODE)
     Index 3 → e3: Email Phase 3 (new password)
     Index 4 → c1: CODE Phase 1  (username + CODE)
     Index 5 → c2: CODE Phase 2  (new password)
   ================================================================ */

var _wizState = {
  currentIndex: 0,    // track position index (0-5)
  option: 'email',    // 'email' or 'code'
  email: '',          // for email flow
  emailToken: '',     // token from email reset API
  userId: null,       // for code flow
  code: '',           // verified code
  forced: false,      // true if triggered by login forced reset
};

// Step name → index mapping
var _stepIndex = { '0': 0, 'e1': 1, 'e2': 2, 'e3': 3, 'c1': 4, 'c2': 5 };

// Dot configs per flow phase
var _dotConfigs = {
  '0':  [],
  'e1': [true, false, false],
  'e2': [true, true, false],
  'e3': [true, true, true],
  'c1': [true, false],
  'c2': [true, true],
};

function _slideToIndex(idx) {
  _wizState.currentIndex = idx;
  var track = document.getElementById('resetTrack');
  track.style.transform = 'translateX(-' + (idx * 100) + '%)';
}

function goResetStep(stepName) {
  var idx = _stepIndex[stepName];
  if (idx === undefined) return;
  _slideToIndex(idx);
  _renderDots(stepName);
  _clearAllErrors();
}

function _renderDots(stepName) {
  var dotsEl = document.getElementById('resetDots');
  var config = _dotConfigs[stepName] || [];
  if (config.length === 0) {
    dotsEl.innerHTML = '';
    return;
  }
  dotsEl.innerHTML = config.map(function (active) {
    return '<span style="width:10px;height:10px;border-radius:50%;background:' +
      (active ? '#b07d3b' : '#ccc') + ';transition:background 0.3s;"></span>';
  }).join('');
}

function _clearAllErrors() {
  var ids = ['emailResetError', 'emailCodeError', 'emailPwError', 'codeVerifyError', 'codePwError'];
  ids.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  });
}

function _showErr(id, msg) {
  var el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ── Open wizard ───────────────────────────────────────────
function openResetWizard() {
  // Reset state
  _wizState = { currentIndex: 0, option: 'email', email: '', emailToken: '', userId: null, code: '', forced: false };

  // Reset all inputs
  var inputIds = ['emailResetInput', 'emailCodeInput', 'emailNewPw', 'emailConfirmPw',
                  'codeUsername', 'codeResetInput', 'codeNewPw', 'codeConfirmPw'];
  inputIds.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Reset radio selection
  var emailRadio = document.querySelector('input[name="resetOption"][value="email"]');
  if (emailRadio) emailRadio.checked = true;
  _highlightOption('email');

  _slideToIndex(0);
  _renderDots('0');
  _clearAllErrors();

  document.getElementById('resetWizardModal').style.display = 'flex';
}

function closeResetWizard() {
  document.getElementById('resetWizardModal').style.display = 'none';

  // If forced reset was active and user cancels, restore login form
  if (_wizState.forced) {
    loginForm.closest('.right').style.visibility = 'visible';
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
    isLoggingIn = false;
  }
}

// ── Forced CODE reset (triggered from login when require_password_change) ──
function showForcedCodeReset(user) {
  openResetWizard();
  _wizState.forced = true;
  _wizState.option = 'code';
  _wizState.userId = user.id;

  // Pre-fill username and lock it
  var usernameInput = document.getElementById('codeUsername');
  usernameInput.value = user.username;
  usernameInput.readOnly = true;
  usernameInput.style.opacity = '0.7';

  // Update message
  var msgEl = document.getElementById('codePhase1Msg');
  msgEl.textContent = 'Welcome ' + user.first_name + '! You must verify your reset code before proceeding.';

  // Hide the back button (user can't go back to option selector)
  document.getElementById('btnBackFromCode').style.display = 'none';

  // Jump directly to CODE Phase 1
  goResetStep('c1');
  loginForm.closest('.right').style.visibility = 'hidden';
}

// ── Option selector highlight ─────────────────────────────
function _highlightOption(value) {
  var emailOpt = document.getElementById('optEmail');
  var codeOpt  = document.getElementById('optCode');
  if (emailOpt) emailOpt.style.borderColor = value === 'email' ? '#b07d3b' : '#ddd';
  if (codeOpt)  codeOpt.style.borderColor  = value === 'code'  ? '#b07d3b' : '#ddd';
}

// Radio change listeners
document.querySelectorAll('input[name="resetOption"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    _wizState.option = this.value;
    _highlightOption(this.value);
  });
});

// ── Forgot Password button ───────────────────────────────
document.getElementById('forgotPwBtn').addEventListener('click', function () {
  openResetWizard();
});

// Close wizard on backdrop click
document.getElementById('resetWizardModal').addEventListener('click', function (e) {
  if (e.target === this) closeResetWizard();
});

// Close on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && document.getElementById('resetWizardModal').style.display === 'flex') {
    closeResetWizard();
  }
});


/* ── STEP 0 → Next (go to appropriate flow) ─────────────── */
document.getElementById('btnNextOption').addEventListener('click', function () {
  if (_wizState.option === 'email') {
    goResetStep('e1');
  } else {
    // Reset the code flow fields for manual entry
    var usernameInput = document.getElementById('codeUsername');
    usernameInput.readOnly = false;
    usernameInput.style.opacity = '1';
    document.getElementById('btnBackFromCode').style.display = '';
    document.getElementById('codePhase1Msg').textContent =
      'Enter your username and the 6-digit reset CODE from your Admin.';
    goResetStep('c1');
  }
});


/* ================================================================
   OPTION 1: EMAIL RESET FLOW (3 Phases)
   ================================================================ */

// ── E1: Back ──
document.getElementById('btnBackFromEmail1').addEventListener('click', function () {
  goResetStep('0');
});

// ── E1: Send Reset Code ──
document.getElementById('btnSendEmailCode').addEventListener('click', async function () {
  var email = document.getElementById('emailResetInput').value.trim();
  if (!email) { _showErr('emailResetError', 'Please enter your email address.'); return; }

  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    var res = await fetch(API_BASE + '/api/auth/send-reset-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      _wizState.email = email;
      document.getElementById('emailCodeSentTo').textContent =
        'A 6-digit code was sent to ' + email + '. Check your inbox and enter it below.';
      goResetStep('e2');
    } else {
      _showErr('emailResetError', data.error || 'Failed to send reset code.');
    }
  } catch (err) {
    _showErr('emailResetError', 'Network error. Could not send request.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Reset Code';
  }
});

// ── E2: Back ──
document.getElementById('btnBackToEmail1').addEventListener('click', function () {
  goResetStep('e1');
});

// ── E2: Verify Email Code ──
document.getElementById('btnVerifyEmailCode').addEventListener('click', async function () {
  var code = document.getElementById('emailCodeInput').value.trim();
  if (!code || code.length < 6) { _showErr('emailCodeError', 'Please enter the 6-digit code.'); return; }

  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    var res = await fetch(API_BASE + '/api/auth/verify-reset-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: _wizState.email, code: code }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      _wizState.emailToken = code;  // store verified code
      goResetStep('e3');
    } else {
      _showErr('emailCodeError', data.error || 'Invalid code. Please try again.');
    }
  } catch (err) {
    _showErr('emailCodeError', 'Network error. Could not verify code.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify Code';
  }
});

// ── E3: Change Password (email flow) ──
document.getElementById('btnEmailChangePw').addEventListener('click', async function () {
  var newPw     = document.getElementById('emailNewPw').value;
  var confirmPw = document.getElementById('emailConfirmPw').value;

  if (!newPw || !confirmPw) { _showErr('emailPwError', 'Both password fields are required.'); return; }
  if (newPw.length < 8) { _showErr('emailPwError', 'Password must be at least 8 characters.'); return; }
  if (newPw !== confirmPw) { _showErr('emailPwError', 'Passwords do not match.'); return; }

  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    var res = await fetch(API_BASE + '/api/auth/reset-password-with-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: _wizState.email,
        code: _wizState.emailToken,
        new_password: newPw,
      }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      closeResetWizard();
      errorMsg.textContent = 'Password changed successfully! Please log in with your new password.';
      errorMsg.style.display = 'block';
      errorMsg.style.background = 'rgba(40,167,69,0.18)';
      errorMsg.style.borderColor = 'rgba(40,167,69,0.4)';
      errorMsg.style.color = '#28a745';
    } else {
      _showErr('emailPwError', data.error || 'Failed to change password.');
    }
  } catch (err) {
    _showErr('emailPwError', 'Network error. Could not change password.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Change Password';
  }
});


/* ================================================================
   OPTION 2: CODE RESET FLOW (2 Phases)
   ================================================================ */

// ── C1: Back ──
document.getElementById('btnBackFromCode').addEventListener('click', function () {
  goResetStep('0');
});

// ── C1: Verify CODE ──
document.getElementById('btnVerifyCode').addEventListener('click', async function () {
  var username = document.getElementById('codeUsername').value.trim();
  var code     = document.getElementById('codeResetInput').value.trim();

  if (!username) { _showErr('codeVerifyError', 'Please enter your username.'); return; }
  if (!code || code.length < 6) { _showErr('codeVerifyError', 'Please enter the 6-digit reset CODE.'); return; }

  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    // First look up the user by username to get user_id
    var lookupRes = await fetch(API_BASE + '/api/auth/check-username/?username=' + encodeURIComponent(username));
    var lookupData = await lookupRes.json();

    if (!lookupRes.ok) {
      _showErr('codeVerifyError', 'Username not found.');
      return;
    }

    var userId = lookupData.user_id || _wizState.userId;
    if (!userId) {
      _showErr('codeVerifyError', 'Could not identify user. Please check username.');
      return;
    }

    // Verify the CODE
    var res = await fetch(API_BASE + '/api/auth/verify-reset-code/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code: code }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      _wizState.userId = userId;
      _wizState.code = code;
      goResetStep('c2');
    } else {
      _showErr('codeVerifyError', data.error || 'Invalid reset CODE.');
    }
  } catch (err) {
    _showErr('codeVerifyError', 'Network error. Could not verify CODE.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify CODE';
  }
});

// ── C2: Change Password (code flow) ──
document.getElementById('btnCodeChangePw').addEventListener('click', async function () {
  var newPw     = document.getElementById('codeNewPw').value;
  var confirmPw = document.getElementById('codeConfirmPw').value;

  if (!newPw || !confirmPw) { _showErr('codePwError', 'Both password fields are required.'); return; }
  if (newPw.length < 6) { _showErr('codePwError', 'Password must be at least 6 characters.'); return; }
  if (newPw !== confirmPw) { _showErr('codePwError', 'Passwords do not match.'); return; }

  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Updating...';

  try {
    var res = await fetch(API_BASE + '/api/auth/change-temporary-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: _wizState.userId,
        code: _wizState.code,
        new_password: newPw,
      }),
    });
    var data = await res.json();

    if (res.ok && data.success) {
      closeResetWizard();

      if (_wizState.forced) {
        // After forced reset, show success and redirect
        var user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          user.require_password_change = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
        loginForm.closest('.right').style.visibility = 'visible';
        document.getElementById('welcomeMsg').textContent =
          'Welcome, ' + (user ? user.user_type + ' ' + user.username : 'User') + '!';
        document.getElementById('loginSuccessOverlay').style.display = 'flex';
        loginForm.closest('.right').style.visibility = 'hidden';

        setTimeout(function () {
          var role = user ? user.user_type : 'Staff';
          if (role === 'Admin') {
            window.location.href = 'dashboard.html';
          } else if (role === 'Staff') {
            window.location.href = 'staffdashboard.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 2000);
      } else {
        // Manual CODE reset from forgot password → show success msg on login
        errorMsg.textContent = 'Password changed successfully! Please log in with your new password.';
        errorMsg.style.display = 'block';
        errorMsg.style.background = 'rgba(40,167,69,0.18)';
        errorMsg.style.borderColor = 'rgba(40,167,69,0.4)';
        errorMsg.style.color = '#28a745';
      }
    } else {
      _showErr('codePwError', data.error || 'Failed to change password.');
    }
  } catch (err) {
    _showErr('codePwError', 'Network error. Could not change password.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Change Password';
  }
});
