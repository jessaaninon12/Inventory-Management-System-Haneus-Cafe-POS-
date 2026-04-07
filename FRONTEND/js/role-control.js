/**
 * Role-Based Sidebar Access Control
 * Filters sidebar sections based on user role (Admin vs Staff)
 *
 * The user object stored in localStorage after login has a `user_type` field
 * set by the backend (UserDTO.to_dict()) with value "Admin" or "Staff".
 *
 * Roles:
 * - admin: Full access to all menus
 * - staff: Limited access (Dashboard, Manage Stock, Profile only)
 */

function applyRoleBasedAccess() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.location.href = 'login.html';
      return;
    }

    const user = JSON.parse(userStr);
    const actualRole = (user.user_type === 'Admin') ? 'admin' : 'staff';

    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.dataset.role.split(',').map(r => r.trim().toLowerCase());
      el.style.display = (allowed.includes('all') || allowed.includes(actualRole)) ? '' : 'none';
    });

  } catch (err) {
    try { localStorage.clear(); } catch {}
    window.location.href = 'login.html';
  }
}

function enforceAuth(requiredRole) {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.location.href = 'login.html';
      return;
    }
    const user = JSON.parse(userStr);
    const role = user.user_type;
    if (requiredRole) {
      if (requiredRole === 'Admin' && role !== 'Admin') {
        window.location.href = 'staffdashboard.html';
        return;
      }
      if (requiredRole === 'Staff' && role !== 'Staff') {
        window.location.href = 'dashboard.html';
        return;
      }
    }
  } catch {
    try { localStorage.clear(); } catch {}
    window.location.href = 'login.html';
  }
}

function initRoleBasedSidebar() {
  applyRoleBasedAccess();
}

document.addEventListener('DOMContentLoaded', () => {
  initRoleBasedSidebar();
});

// Export for use in other scripts
window.applyRoleBasedAccess = applyRoleBasedAccess;
window.initRoleBasedSidebar = initRoleBasedSidebar;
window.enforceAuth = enforceAuth;
