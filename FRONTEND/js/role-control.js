/**
 * Role-Based Sidebar Access Control
 * Filters sidebar sections based on user role (Admin / Supervisor / Cashier)
 *
 * The user object stored in localStorage after login has a `user_type` field
 * set by the backend (UserDTO.to_dict()) with value "Admin", "Supervisor", or "Cashier".
 *
 * Roles:
 * - admin: Full access to all menus
 * - supervisor: Dashboard, POS, Manage Stock, Profile, Sales (limited)
 * - cashier: POS only, NO sidebar
 */

function applyRoleBasedAccess() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.location.href = 'login.html';
      return;
    }

    const user = JSON.parse(userStr);
    // Map user_type to role key (backward compat: old "Staff" maps to "supervisor")
    let actualRole;
    if (user.user_type === 'Admin') actualRole = 'admin';
    else if (user.user_type === 'Cashier') actualRole = 'cashier';
    else actualRole = 'supervisor'; // Supervisor + legacy Staff

    // Cashier: hide entire sidebar
    if (actualRole === 'cashier') {
      const sidebar = document.getElementById('main-sidebar');
      if (sidebar) sidebar.style.display = 'none';
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) overlay.style.display = 'none';
      // Remove sidebar margin from main content
      const mainWrapper = document.querySelector('.main-wrapper') || document.querySelector('main');
      if (mainWrapper) {
        mainWrapper.style.marginLeft = '0';
        mainWrapper.style.width = '100%';
      }
      // Hide sidebar toggle button
      const toggleBtn = document.getElementById('sidebar-toggle-btn');
      if (toggleBtn) toggleBtn.style.display = 'none';
    }

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
        // Non-admin trying to access admin page
        if (role === 'Cashier') window.location.href = 'pos.html';
        else window.location.href = 'staffdashboard.html';
        return;
      }
      if (requiredRole === 'Supervisor' && role !== 'Supervisor') {
        if (role === 'Cashier') window.location.href = 'pos.html';
        else window.location.href = 'dashboard.html';
        return;
      }
      if (requiredRole === 'Cashier' && role !== 'Cashier') {
        if (role === 'Admin') window.location.href = 'dashboard.html';
        else window.location.href = 'staffdashboard.html';
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
