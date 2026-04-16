// Profile page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
const toast = document.getElementById('profileToast');
let toastTimer = null;

// Get logged-in user from localStorage (set during login)
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id || null;
  } catch { return null; }
}

function showAlert(msg, type) {
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'profile-toast ' + (type === 'success' ? 'success' : 'error');
  toast.style.display = 'block';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 4500);
}

// ---------- Load profile ----------
async function loadProfile() {
  const userId = getUserId();
  if (!userId) {
    document.getElementById('profileDisplayName').textContent = 'Guest';
    showAlert('No user session found. Please log in.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/profile/${userId}/`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    const p = await res.json();

    document.getElementById('firstName').value = p.first_name || '';
    document.getElementById('lastName').value = p.last_name || '';
    document.getElementById('email').value = p.email || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('bio').value = p.bio || '';

    document.getElementById('profileDisplayName').textContent =
      `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username;

    // Display account type label dynamically
    const roleBadgeText = document.getElementById('profileRoleBadgeText');
    if (roleBadgeText) {
      roleBadgeText.textContent = p.account_type_label ||
        (p.user_type === 'Admin' ? 'Admin \u2022 Haneus Cafe Owner' : 'Staff \u2022 Haneus Cafe Employee');
    }

    // Display profile picture (new field) or avatar_url (legacy fallback)
    const pictureUrl = p.profile_picture_url || p.avatar_url;
    if (pictureUrl) {
      const src = pictureUrl.startsWith('http') ? pictureUrl : `http://127.0.0.1:8000${pictureUrl}`;
      document.getElementById('avatarPreview').src = src;
    }

    if (p.date_joined) {
      document.getElementById('profileJoined').textContent =
        `Joined ${new Date(p.date_joined).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}`;
    }
  } catch (e) {
    console.error(e);
    showAlert('Could not load profile. Is the backend running?', 'error');
  }
}

// ---------- Avatar upload ----------
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
let pendingAvatarFile = null;

avatarInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    pendingAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => { avatarPreview.src = ev.target.result; };
    reader.readAsDataURL(file);
  }
});

async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Avatar upload failed');
  const data = await res.json();
  return `http://127.0.0.1:8000${data.url}`;
}

// ---------- Edit / Cancel / Save Transform ----------
const editProfileBtn = document.getElementById('editProfileBtn');
const cancelEditBtn  = document.getElementById('cancelEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileFormFields = ['firstName', 'lastName', 'email', 'phone', 'bio'];

function setEditMode(editing) {
  profileFormFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.readOnly = !editing;
      el.style.opacity = editing ? '1' : '0.85';
      el.style.cursor = editing ? 'text' : 'default';
      el.style.background = editing ? '#fff' : 'var(--cream)';
    }
  });
  if (editProfileBtn) editProfileBtn.style.display = editing ? 'none' : 'flex';
  if (cancelEditBtn)  cancelEditBtn.style.display  = editing ? 'inline-flex' : 'none';
  if (saveProfileBtn) saveProfileBtn.style.display  = editing ? 'inline-flex' : 'none';
}

// Start in view mode
setEditMode(false);

// Edit button click → enter edit mode
if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => setEditMode(true));
}

// Cancel button → reload data and return to view mode
if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
    pendingAvatarFile = null;
    loadProfile();
    setEditMode(false);
  });
}

// ---------- Save profile ----------
document.getElementById('profileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const userId = getUserId();
  if (!userId) { showAlert('No user session.', 'error'); return; }

  try {
    let avatar_url = undefined;
    if (pendingAvatarFile) {
      avatar_url = await uploadAvatar(pendingAvatarFile);
      pendingAvatarFile = null;
    }

    const body = {
      first_name: document.getElementById('firstName').value,
      last_name:  document.getElementById('lastName').value,
      email:      document.getElementById('email').value,
      phone:      document.getElementById('phone').value,
      bio:        document.getElementById('bio').value,
    };
    if (avatar_url) {
      body.avatar_url = avatar_url;
      body.profile_picture_url = avatar_url;
    }

    const res = await fetch(`${API}/profile/${userId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      showAlert('Update failed: ' + JSON.stringify(err), 'error');
      return;
    }

    const updated = await res.json();
    const stored = JSON.parse(localStorage.getItem('user')) || {};
    Object.assign(stored, { first_name: updated.first_name, last_name: updated.last_name, email: updated.email });
    localStorage.setItem('user', JSON.stringify(stored));

    showAlert('Profile updated successfully!', 'success');
    document.getElementById('profileDisplayName').textContent =
      `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || updated.username;

    // Return to view mode after successful save
    setEditMode(false);
  } catch (err) {
    console.error(err);
    showAlert('Failed to update profile.', 'error');
  }
});

// ---------- Change Password Modal ----------
const pwModal      = document.getElementById('changePasswordModal');
const openPwBtn    = document.getElementById('openChangePasswordBtn');
const closePwBtn   = document.getElementById('closePasswordModalBtn');
const cancelPwBtn  = document.getElementById('cancelPasswordBtn');
const submitPwBtn  = document.getElementById('submitPasswordBtn');

function openPasswordModal() {
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value     = '';
  document.getElementById('confirmPassword').value = '';
  resetEyeIcons();
  pwModal.style.display = 'flex';
  lucide.createIcons();
}
function closePasswordModal() {
  pwModal.style.display = 'none';
}
if (openPwBtn)   openPwBtn.addEventListener('click', openPasswordModal);
if (closePwBtn)  closePwBtn.addEventListener('click', closePasswordModal);
if (cancelPwBtn) cancelPwBtn.addEventListener('click', closePasswordModal);
if (pwModal) {
  pwModal.addEventListener('click', (e) => { if (e.target === pwModal) closePasswordModal(); });
}

// ---------- Eye toggle buttons (consolidated - no duplicates) ----------
function resetEyeIcons() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.type = 'password';
    btn.dataset.visible = 'false';
    const showSvg = btn.querySelector('.eye-icon-show');
    const hideSvg = btn.querySelector('.eye-icon-hide');
    if (showSvg) showSvg.style.display = '';
    if (hideSvg) hideSvg.style.display = 'none';
  });
}

document.addEventListener('click', function(e) {
  const btn = e.target.closest('.eye-btn');
  if (!btn) return;
  const target = document.getElementById(btn.dataset.target);
  if (!target) return;
  const isVisible = btn.dataset.visible === 'true';
  target.type = isVisible ? 'password' : 'text';
  btn.dataset.visible = isVisible ? 'false' : 'true';
  const showSvg = btn.querySelector('.eye-icon-show');
  const hideSvg = btn.querySelector('.eye-icon-hide');
  if (showSvg) showSvg.style.display = isVisible ? '' : 'none';
  if (hideSvg) hideSvg.style.display = isVisible ? 'none' : '';
  // ARIA for accessibility
  btn.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
});

// ---------- Submit password change ----------
if (submitPwBtn) {
  submitPwBtn.addEventListener('click', async function() {
    const userId = getUserId();
    if (!userId) { showAlert('No user session.', 'error'); closePasswordModal(); return; }

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword     = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword) { showAlert('Please enter your current password.', 'error'); return; }
    if (newPassword !== confirmPassword) { showAlert('New password and confirmation do not match.', 'error'); return; }
    if (newPassword.length < 8) { showAlert('New password must be at least 8 characters.', 'error'); return; }

    submitPwBtn.disabled = true;
    try {
      const res = await fetch(`${API}/profile/${userId}/password/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        showAlert(err.error || 'Password change failed.', 'error');
        return;
      }
      showAlert('Password updated successfully!', 'success');
      closePasswordModal();
    } catch (err) {
      console.error(err);
      showAlert('Failed to change password. Is the backend running?', 'error');
    } finally {
      submitPwBtn.disabled = false;
    }
  });
}

// ---------- Delete Account modal — 2-step flow ----------
const deleteBtn          = document.getElementById('deleteAccountBtn');
const deleteModal        = document.getElementById('deleteAccountModal');
const closeDeleteModalBtn= document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn    = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn   = document.getElementById('confirmDeleteAccountBtn');
const deleteFinalModal   = document.getElementById('deleteFinalModal');
const cancelFinalBtn     = document.getElementById('cancelFinalDeleteBtn');
const proceedDeleteBtn   = document.getElementById('proceedDeleteBtn');
const accountDeletedModal= document.getElementById('accountDeletedModal');

function _closeDeleteModal() { if (deleteModal) deleteModal.style.display = 'none'; }
function _closeFinalModal()  { if (deleteFinalModal) deleteFinalModal.style.display = 'none'; }

// Open step-1 delete modal
if (deleteBtn) deleteBtn.addEventListener('click', () => {
  if (deleteModal) deleteModal.style.display = 'flex';
});
// Close/Cancel step-1
if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', _closeDeleteModal);
if (cancelDeleteBtn)     cancelDeleteBtn.addEventListener('click', _closeDeleteModal);
if (deleteModal) deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) _closeDeleteModal(); });

// "Delete Account" in step-1 → open step-2 final confirm
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => {
  _closeDeleteModal();
  if (deleteFinalModal) deleteFinalModal.style.display = 'flex';
});
// Cancel step-2
if (cancelFinalBtn) cancelFinalBtn.addEventListener('click', _closeFinalModal);
if (deleteFinalModal) deleteFinalModal.addEventListener('click', (e) => { if (e.target === deleteFinalModal) _closeFinalModal(); });

// "Delete" in step-2 → call API, show success, redirect
if (proceedDeleteBtn) proceedDeleteBtn.addEventListener('click', async () => {
  _closeFinalModal();
  const userId = getUserId();
  try {
    if (userId) {
      await fetch(`${API}/users/staff/delete/${userId}/`, { method: 'DELETE' }).catch(() => {});
    }
  } catch (_) {}
  // Always show success and clear session
  if (accountDeletedModal) accountDeletedModal.style.display = 'flex';
  localStorage.clear();
  setTimeout(() => { window.location.href = 'login.html'; }, 2500);
});

// ---------- Log Out from All Devices ----------
const logoutAllBtn      = document.getElementById('logoutAllBtn');
const logoutAllModal    = document.getElementById('logoutAllModal');
const cancelLogoutBtn   = document.getElementById('cancelLogoutAllBtn');
const cancelLogoutBtn2  = document.getElementById('cancelLogoutAllBtn2');
const proceedLogoutBtn  = document.getElementById('proceedLogoutAllBtn');
const loggingOutModal   = document.getElementById('loggingOutModal');

function _closeLogoutAllModal() { if (logoutAllModal) logoutAllModal.style.display = 'none'; }

if (logoutAllBtn) logoutAllBtn.addEventListener('click', () => {
  if (logoutAllModal) logoutAllModal.style.display = 'flex';
});
if (cancelLogoutBtn)  cancelLogoutBtn.addEventListener('click',  _closeLogoutAllModal);
if (cancelLogoutBtn2) cancelLogoutBtn2.addEventListener('click', _closeLogoutAllModal);
if (logoutAllModal) logoutAllModal.addEventListener('click', (e) => { if (e.target === logoutAllModal) _closeLogoutAllModal(); });

if (proceedLogoutBtn) proceedLogoutBtn.addEventListener('click', () => {
  _closeLogoutAllModal();
  if (loggingOutModal) loggingOutModal.style.display = 'flex';
  localStorage.clear();
  setTimeout(() => { window.location.href = 'login.html'; }, 2000);
});


// ---------- Sidebar Toggle (mobile) ----------
const sidebar = document.getElementById('main-sidebar');
const overlay = document.getElementById('sidebar-overlay');
const toggleBtn = document.getElementById('sidebar-toggle-btn');

function closeSidebar() {
  if (sidebar) sidebar.classList.remove('sidebar-open');
  if (overlay) overlay.classList.remove('active');
}
function openSidebar() {
  if (sidebar) sidebar.classList.add('sidebar-open');
  if (overlay) overlay.classList.add('active');
}
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    if (sidebar && sidebar.classList.contains('sidebar-open')) closeSidebar();
    else openSidebar();
  });
}
if (overlay) overlay.addEventListener('click', closeSidebar);

// ---------- Global logout (from sidebar link) ----------
window.confirmLogout = function(event) {
  event.preventDefault();
  if (confirm('Are you sure you want to logout?')) {
    localStorage.clear();
    window.location.href = 'login.html';
  }
};

// ---------- Keyboard close ----------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePasswordModal();
    _closeDeleteModal();
    _closeFinalModal();
    _closeLogoutAllModal();
  }
});

// ---------- Init ----------
loadProfile();
// -- AJAX Auto-Refresh -----------------------------------------
if (typeof startAutoRefresh === 'function') {
  startAutoRefresh(() => loadProfile(), 60000, 'profile');
}
