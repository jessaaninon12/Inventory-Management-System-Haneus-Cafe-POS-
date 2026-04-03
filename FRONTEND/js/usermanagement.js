/* =================================================================
   UserManagement.js — Admin-only User Management page
   Fetches Admin + Staff users, renders table with pagination.
================================================================= */

lucide.createIcons();

/* ── Access Guard ─────────────────────────────────────────────────── */
const _stored = localStorage.getItem('user');
const _currentUser = _stored ? JSON.parse(_stored) : null;

if (!_currentUser || !_currentUser.id) {
  window.location.href = 'login.html';
}
if (_currentUser.user_type !== 'Admin') {
  showErrorModal('Access denied. This page is for Admins only.');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
}

/* Show / hide admin-only sidebar items */
document.querySelectorAll('.admin-only').forEach(el => {
  el.style.display = '';
});

/* ── Constants ───────────────────────────────────────────────────── */
const API = 'http://127.0.0.1:8000/api';

/* ── State ───────────────────────────────────────────────────────── */
let allUsers          = [];
let filteredUsers     = [];
let activeFilter      = 'all';
let _pendingEditImage = null;  // Task 8: pending image file for edit
let _pendingCreateImage = null;  // Task 8: pending image file for create

let editingUserId     = null;
let editingUserType   = null;
let deletingUserId    = null;
let deletingUserType  = null;
let patchingUserId    = null;
let patchingUserType  = null;

// Pagination
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

// Request control
let _usersAbort = null;   // AbortController for request cancellation
let _userDebounce = null; // Debounce timer for search

/* ── Helpers ─────────────────────────────────────────────────────── */
function typeBadge(type) {
  const cls = type === 'Admin' ? 'badge-admin' : 'badge-staff';
  return `<span class="badge ${cls}">${type}</span>`;
}

function fullName(u) {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return n || '—';
}

function showAlert(msg, ok = true) {
  const colour = ok ? '#16a34a' : '#dc2626';
  const bg     = ok ? '#f0fdf4' : '#fef2f2';
  const border = ok ? '#bbf7d0' : '#fecaca';

  const el = document.createElement('div');
  el.style.cssText = `position:fixed;top:1.25rem;right:1.25rem;z-index:99999;
    background:${bg};border:1px solid ${border};color:${colour};
    padding:0.75rem 1.25rem;border-radius:0.5rem;font-size:0.875rem;
    font-family:'Inter',sans-serif;font-weight:500;
    box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:340px;`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function escAttr(str) {
  return String(str || '').replace(/'/g, "\\'");
}

/* ── Pagination ───────────────────────────────────────────────────── */
function updatePaginationControls() {
  const container = document.getElementById('paginationControls');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '<div class="pagination">';
  // Previous button
  html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  // Page numbers (show at most 5 pages)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  if (endPage - startPage < 4) {
    if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
    if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
  }
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  // Next button
  html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
}

/* ── Render Table (with pagination) ───────────────────────────────── */
function renderTable() {
  const tbody = document.getElementById('userTableBody');

  if (!filteredUsers.length) {
    tbody.innerHTML = '叭叭<td colspan="6" class="empty-cell">No users found.叭叭';
    updatePaginationControls();
    return;
  }

  totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageUsers = filteredUsers.slice(start, end);

  tbody.innerHTML = pageUsers.map(u => `
    <tr>
      <td>${escHtml(u.username || '—')}</td>
      <td>${escHtml(fullName(u))}</td>
      <td>${escHtml(u.email || '—')}</td>
      <td>${escHtml(u.bio || '—')}</td>
      <td>${typeBadge(u.user_type)}</td>
      <td class="actions">
        <button class="btn btn-view"  onclick="openViewModal(${u.id},'${u.user_type}')">View</button>
        <button class="btn btn-edit"  onclick="openEditModal(${u.id},'${u.user_type}')">Edit</button>
        <button class="btn btn-danger" onclick="openDeleteModal(${u.id},'${u.user_type}','${escAttr(u.username)}')">Delete</button>
      </td>
    </tr>
`).join('');

  lucide.createIcons();
  updatePaginationControls();
}

/* ── Filtering ───────────────────────────────────────────────────── */
function setFilter(type, btn) {
  activeFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilter();
}

function applyFilter() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();

  filteredUsers = allUsers.filter(u => {
    const matchType = activeFilter === 'all' || u.user_type === activeFilter;
    const matchSearch = !q
      || (u.username  || '').toLowerCase().includes(q)
      || (u.email     || '').toLowerCase().includes(q)
      || (u.user_type || '').toLowerCase().includes(q)
      || fullName(u).toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  currentPage = 1;
  renderTable();
}

/* ── Fetch Users ─────────────────────────────────────────────────── */
async function loadUsers() {
  // Cancel any in-flight request before starting a new one
  if (_usersAbort) _usersAbort.abort();
  _usersAbort = new AbortController();

  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '叭叭<td colspan="6" class="empty-cell">Loading users…叭叭';
  try {
    const [adminRes, staffRes] = await Promise.all([
      fetch(`${API}/users/admin/view/`, { signal: _usersAbort.signal }),
      fetch(`${API}/users/staff/view/`, { signal: _usersAbort.signal }),
    ]);

    const adminData = adminRes.ok ? await adminRes.json() : [];
    const staffData = staffRes.ok ? await staffRes.json() : [];

    const admins = (Array.isArray(adminData) ? adminData : adminData.results || [])
      .map(u => ({ ...u, user_type: u.user_type || 'Admin' }));
    const staff  = (Array.isArray(staffData) ? staffData : staffData.results || [])
      .map(u => ({ ...u, user_type: u.user_type || 'Staff' }));

    allUsers = [...admins, ...staff];
    applyFilter();
  } catch (err) {
    if (err.name === 'AbortError') return; // Cancelled — ignore
    console.error('Failed to load users:', err);
    tbody.innerHTML = '叭叭<td colspan="6" class="empty-cell" style="color:#dc2626;">Failed to load users. Is the backend running?叭叭';
  }
}

/* ── Modal helpers ────────────────────────────────────────────────── */
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

/* Close modal on backdrop click */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay').forEach(o => {
      o.style.display = 'none';
    });
  }
});

/* ── VIEW modal ─────────────────────────────────────────────────── */
async function openViewModal(id, type) {
  const endpoint = type === 'Admin'
    ? `${API}/users/admin/view/${id}/`
    : `${API}/users/staff/view/${id}/`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error('Not found');
    const u = await res.json();

    // Profile picture (use profile_picture_url, fallback to avatar_url)
    const pictureUrl = u.profile_picture_url || u.avatar_url || '';
    const pictureSrc = pictureUrl
      ? (pictureUrl.startsWith('http') ? pictureUrl : `http://127.0.0.1:8000${pictureUrl}`)
      : 'https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg';

    const fields = [
      ['ID',          `#${u.id}`],
      ['Username',    u.username   || '—'],
      ['First Name',  u.first_name || '—'],
      ['Last Name',   u.last_name  || '—'],
      ['Email',       u.email      || '—'],
      ['Phone',       u.phone      || '—'],
      ['Type',        typeBadge(u.user_type || type)],
      ['Joined',      u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'],
      ['Bio',         u.bio        || '—'],
    ];

    document.getElementById('viewDetails').innerHTML =
      `<div style="text-align:center;margin-bottom:1.25rem;">
         <img src="${pictureSrc}" alt="Profile Picture"
              onerror="this.src='https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg'"
              style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #ddd;" />
         <div style="margin-top:0.5rem;font-weight:600;font-size:0.95rem;">${escHtml((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.username}</div>
       </div>` +
      fields.map(([label, val]) => `
        <div class="detail-item">
          <div class="detail-label">${label}</div>
          <div class="detail-value">${val}</div>
        </div>`).join('');

    document.getElementById('viewModal').style.display = 'flex';
    lucide.createIcons();
  } catch (err) {
    showAlert('Could not load user details.', false);
  }
}

/* ── CREATE modal ───────────────────────────────────────────────── */
function openCreateModal() {
  document.getElementById('createForm').reset();
  _pendingCreateImage = null;  // Task 8: reset pending image

  // Task 8: Inject image upload into create modal
  let createImgArea = document.getElementById('createImageArea');
  if (!createImgArea) {
    const createForm = document.getElementById('createForm');
    if (createForm) {
      createImgArea = document.createElement('div');
      createImgArea.id = 'createImageArea';
      createImgArea.style.cssText = 'text-align:center;margin-bottom:1rem;';
      createForm.insertBefore(createImgArea, createForm.firstChild);
    }
  }
  if (createImgArea) {
    createImgArea.innerHTML = `
      <img id="createUserImgPreview" src="https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg" alt="Profile"
           style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #ddd;margin-bottom:0.5rem;" />
      <div>
        <label style="cursor:pointer;font-size:0.8rem;color:#c47b42;font-weight:500;">
          Add Photo <input type="file" id="createUserImgInput" accept="image/*" style="display:none;" />
        </label>
      </div>
    `;
    document.getElementById('createUserImgInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        _pendingCreateImage = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = document.getElementById('createUserImgPreview');
          if (preview) preview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.getElementById('createModal').style.display = 'flex';
}

async function submitCreate(e) {
  e.preventDefault();
  const type = document.getElementById('cUserType').value;
  const endpoint = type === 'Admin'
    ? `${API}/users/admin/create/`
    : `${API}/users/staff/create/`;

  const body = {
    first_name:       document.getElementById('cFirstName').value.trim(),
    last_name:        document.getElementById('cLastName').value.trim(),
    username:         document.getElementById('cUsername').value.trim(),
    email:            document.getElementById('cEmail').value.trim(),
    password:         document.getElementById('cPassword').value,
    confirm_password: document.getElementById('cConfirmPassword').value,
    user_type:        type,
  };

  // Task 8: Upload image if selected
  if (_pendingCreateImage) {
    try {
      const fd = new FormData();
      fd.append('file', _pendingCreateImage);
      const uploadRes = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const imgUrl = `http://127.0.0.1:8000${uploadData.url}`;
        body.avatar_url = imgUrl;
        body.profile_picture_url = imgUrl;
      }
      _pendingCreateImage = null;
    } catch (e) { console.warn('Image upload failed:', e); }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = data.errors
        ? data.errors.join(' ')
        : (data.error || 'Failed to create user.');
      showAlert(msg, false);
      return;
    }
    showAlert(`User "${body.username}" created successfully!`);
    closeModal('createModal');
    loadUsers();
  } catch (err) {
    showAlert('Network error. Could not create user.', false);
  }
}

/* ── EDIT modal (PUT) ───────────────────────────────────────────── */
async function openEditModal(id, type) {
  const endpoint = type === 'Admin'
    ? `${API}/users/admin/view/${id}/`
    : `${API}/users/staff/view/${id}/`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error();
    const u = await res.json();

    editingUserId   = id;
    editingUserType = type;
    _pendingEditImage = null;  // Task 8: reset pending image

    document.getElementById('eFirstName').value = u.first_name || '';
    document.getElementById('eLastName').value  = u.last_name  || '';
    document.getElementById('eEmail').value     = u.email      || '';
    document.getElementById('ePhone').value     = u.phone      || '';
    document.getElementById('eBio').value       = u.bio        || '';

    // Task 8: Show current profile picture in edit modal
    const picUrl = u.profile_picture_url || u.avatar_url || '';
    const picSrc = picUrl
      ? (picUrl.startsWith('http') ? picUrl : `http://127.0.0.1:8000${picUrl}`)
      : 'https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg';

    // Inject image preview into edit modal if not already there
    let editImgArea = document.getElementById('editImageArea');
    if (!editImgArea) {
      const editForm = document.getElementById('editForm');
      if (editForm) {
        editImgArea = document.createElement('div');
        editImgArea.id = 'editImageArea';
        editImgArea.style.cssText = 'text-align:center;margin-bottom:1rem;';
        editForm.insertBefore(editImgArea, editForm.firstChild);
      }
    }
    if (editImgArea) {
      editImgArea.innerHTML = `
        <img id="editUserImgPreview" src="${picSrc}" alt="Profile"
             onerror="this.src='https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg'"
             style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #ddd;margin-bottom:0.5rem;" />
        <div>
          <label style="cursor:pointer;font-size:0.8rem;color:#c47b42;font-weight:500;">
            Change Photo <input type="file" id="editUserImgInput" accept="image/*" style="display:none;" />
          </label>
        </div>
      `;
      document.getElementById('editUserImgInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          _pendingEditImage = file;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const preview = document.getElementById('editUserImgPreview');
            if (preview) preview.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Wire the reset password button for this user
    const resetBtn = document.getElementById('editResetPasswordBtn');
    if (resetBtn) {
      resetBtn.onclick = () => { closeModal('editModal'); openResetPasswordModal(id); };
    }

    document.getElementById('editModal').style.display = 'flex';
  } catch {
    showAlert('Could not load user for editing.', false);
  }
}

async function submitEdit(e) {
  e.preventDefault();
  const endpoint = editingUserType === 'Admin'
    ? `${API}/users/admin/edit/${editingUserId}/`
    : `${API}/users/staff/edit/${editingUserId}/`;

  const body = {
    first_name: document.getElementById('eFirstName').value.trim(),
    last_name:  document.getElementById('eLastName').value.trim(),
    email:      document.getElementById('eEmail').value.trim(),
    phone:      document.getElementById('ePhone').value.trim(),
    bio:        document.getElementById('eBio').value.trim(),
  };

  // Task 8: Upload image if selected
  if (_pendingEditImage) {
    try {
      const fd = new FormData();
      fd.append('file', _pendingEditImage);
      const uploadRes = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const imgUrl = `http://127.0.0.1:8000${uploadData.url}`;
        body.avatar_url = imgUrl;
        body.profile_picture_url = imgUrl;
      }
      _pendingEditImage = null;
    } catch (e) { console.warn('Image upload failed:', e); }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      showAlert(err.error || 'Failed to update user.', false);
      return;
    }
    showAlert('User updated successfully!');
    closeModal('editModal');
    loadUsers();
  } catch {
    showAlert('Network error. Could not update user.', false);
  }
}

/* ── PATCH modal ────────────────────────────────────────────────── */
function openPatchModal(id, type) {
  patchingUserId   = id;
  patchingUserType = type;

  ['pFirstName','pLastName','pEmail','pPhone','pBio'].forEach(f => {
    document.getElementById(f).value = '';
  });

  const badge = document.getElementById('patchTypeBadge');
  badge.textContent  = type;
  badge.className    = 'badge-type ' + (type === 'Admin' ? 'badge-admin' : 'badge-staff');

  document.getElementById('patchModal').style.display = 'flex';
}

async function submitPatch(e) {
  e.preventDefault();
  const endpoint = patchingUserType === 'Admin'
    ? `${API}/users/admin/partialedit/${patchingUserId}/`
    : `${API}/users/staff/partialedit/${patchingUserId}/`;

  const body = {};
  const map = {
    first_name: 'pFirstName',
    last_name:  'pLastName',
    email:      'pEmail',
    phone:      'pPhone',
    bio:        'pBio',
  };
  Object.entries(map).forEach(([key, elId]) => {
    const val = document.getElementById(elId).value.trim();
    if (val) body[key] = val;
  });

  if (!Object.keys(body).length) {
    showAlert('No fields to update — fill in at least one field.', false);
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      showAlert(err.error || 'Failed to apply partial update.', false);
      return;
    }
    showAlert('User partially updated!');
    closeModal('patchModal');
    loadUsers();
  } catch {
    showAlert('Network error. Could not apply update.', false);
  }
}

/* ── DELETE modal ───────────────────────────────────────────────── */
function openDeleteModal(id, type, username) {
  deletingUserId   = id;
  deletingUserType = type;
  document.getElementById('deleteMessage').textContent =
    `Are you sure you want to delete "${username}"? This action cannot be undone.`;
  document.getElementById('deleteModal').style.display = 'flex';
}

async function confirmDelete() {
  const endpoint = deletingUserType === 'Admin'
    ? `${API}/users/admin/delete/${deletingUserId}/`
    : `${API}/users/staff/delete/${deletingUserId}/`;

  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    if (res.status === 204 || res.ok) {
      showAlert('User deleted successfully!');
      closeModal('deleteModal');
      loadUsers();
    } else {
      const err = await res.json();
      showAlert(err.error || 'Failed to delete user.', false);
    }
  } catch {
    showAlert('Network error. Could not delete user.', false);
  }
}

/* ── RESET PASSWORD ───────────────────────────────── */
async function openResetPasswordModal(userId) {
  try {
    const res = await fetch(`${API}/users/${userId}/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });

    if (!res.ok) {
      const err = await res.json();
      showAlert(err.error || 'Failed to reset password.', false);
      return;
    }

    const data = await res.json();
    const resetCode = data.reset_code;

    // Show modal with reset CODE
    document.getElementById('resetPwMessage').textContent =
      'A 6-digit reset CODE has been generated. Share it with the user.';
    document.getElementById('tempPasswordDisplay').value = resetCode;
    document.getElementById('resetPasswordModal').style.display = 'flex';

    showAlert('Reset CODE generated! Share it with the user.', true);
  } catch (err) {
    console.error(err);
    showAlert('Network error. Could not reset password.', false);
  }
}

function copyTempPassword() {
  const field = document.getElementById('tempPasswordDisplay');
  field.select();
  document.execCommand('copy');
  showAlert('CODE copied to clipboard!', true);
}

/* ── Bootstrap ───────────────────────────────────── */
loadUsers();
