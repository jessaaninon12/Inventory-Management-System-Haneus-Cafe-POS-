// Profile page — API-driven
lucide.createIcons();

const API = 'http://127.0.0.1:8000/api';
const alertBox = document.getElementById('profileAlert');

// Get logged-in user from localStorage (set during login)
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id || null;
  } catch { return null; }
}

function showAlert(msg, type) {
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
  alertBox.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
  alertBox.style.color = type === 'success' ? '#166534' : '#991b1b';
  setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
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

    // Populate form fields
    document.getElementById('firstName').value = p.first_name || '';
    document.getElementById('lastName').value = p.last_name || '';
    document.getElementById('email').value = p.email || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('bio').value = p.bio || '';

    // Display name
    document.getElementById('profileDisplayName').textContent =
      `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username;

    // Avatar
    if (p.avatar_url) {
      const src = p.avatar_url.startsWith('http') ? p.avatar_url : `http://127.0.0.1:8000${p.avatar_url}`;
      document.getElementById('avatarPreview').src = src;
    }

    // Joined date
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
    // Upload avatar first if changed
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
    if (avatar_url) body.avatar_url = avatar_url;

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

    // Update localStorage user info
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

// ---------- Change password ----------
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const userId = getUserId();
  if (!userId) { showAlert('No user session.', 'error'); return; }

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword     = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showAlert('New password and confirmation do not match.', 'error');
    return;
  }
  if (newPassword.length < 6) {
    showAlert('New password must be at least 6 characters.', 'error');
    return;
  }

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
    document.getElementById('passwordForm').reset();
  } catch (err) {
    console.error(err);
    showAlert('Failed to change password.', 'error');
  }
});

// ---------- Init ----------
loadProfile();
