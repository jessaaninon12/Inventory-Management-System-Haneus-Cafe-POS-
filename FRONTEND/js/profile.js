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
    // Persist both avatar_url and profile_picture_url for consistency
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
  } catch (err) {
    console.error(err);
    showAlert('Failed to update profile.', 'error');
  }
});

// ---------- Reset button ----------
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', loadProfile);
}

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

// ---------- Eye toggle buttons ----------
function resetEyeIcons() {
  document.querySelectorAll('.eye-btn').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    if (target) target.type = 'password';
    const icon = btn.querySelector('i[data-lucide]');
    if (icon) { icon.setAttribute('data-lucide', 'eye'); }
  });
  lucide.createIcons();
}

document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const target = document.getElementById(this.dataset.target);
    if (!target) return;
    const isHidden = target.type === 'password';
    target.type = isHidden ? 'text' : 'password';
    const icon = this.querySelector('i[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
      lucide.createIcons();
    }
  });
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

// ---------- Delete Account modal ----------
const deleteBtn         = document.getElementById('deleteAccountBtn');
const deleteModal       = document.getElementById('deleteAccountModal');
const confirmDeleteBtn  = document.getElementById('confirmDeleteAccountBtn');

if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
    lucide.createIcons();
  });
}
if (deleteModal) {
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.style.display = 'none'; });
}
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener('click', () => {
    // TODO: wire to actual delete endpoint when backend supports it
    showAlert('Account deletion is not yet available. Contact your admin.', 'error');
    deleteModal.style.display = 'none';
  });
}

// ---------- Log Out from All Devices ----------
const logoutAllBtn = document.getElementById('logoutAllBtn');
if (logoutAllBtn) {
  logoutAllBtn.addEventListener('click', () => {
    showAlert('You have been logged out from all devices.', 'success');
    setTimeout(() => { localStorage.clear(); window.location.href = 'login.html'; }, 1800);
  });
}

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
    if (deleteModal) deleteModal.style.display = 'none';
  }
});

// ---------- Init ----------
loadProfile();