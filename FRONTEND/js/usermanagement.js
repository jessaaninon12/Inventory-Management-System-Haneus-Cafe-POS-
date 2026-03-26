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
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '叭叭<td colspan="6" class="empty-cell">Loading users…叭叭';
  try {
    const [adminRes, staffRes] = await Promise.all([
      fetch(`${API}/users/admin/view/`),
      fetch(`${API}/users/staff/view/`),
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

    document.getElementById('viewDetails').innerHTML = fields.map(([label, val]) => `
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

    document.getElementById('eFirstName').value = u.first_name || '';
    document.getElementById('eLastName').value  = u.last_name  || '';
    document.getElementById('eEmail').value     = u.email      || '';
    document.getElementById('ePhone').value     = u.phone      || '';
    document.getElementById('eBio').value       = u.bio        || '';

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
    const tempPassword = data.temporary_password;

    // Show modal with temp password
    document.getElementById('resetPwMessage').textContent =
      `Password reset initiated. A temporary 12-character password has been generated.`;
    document.getElementById('tempPasswordDisplay').value = tempPassword;
    document.getElementById('resetPasswordModal').style.display = 'flex';

    showAlert('Password reset successful! Share the temporary password with the user.', true);
  } catch (err) {
    console.error(err);
    showAlert('Network error. Could not reset password.', false);
  }
}

function copyTempPassword() {
  const field = document.getElementById('tempPasswordDisplay');
  field.select();
  document.execCommand('copy');
  showAlert('Password copied to clipboard!', true);
}

/* ── Bootstrap ───────────────────────────────────── */
loadUsers();
