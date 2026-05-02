/**
 * Role-Based Sidebar Access Control
 * Filters sidebar sections based on user role (Admin / Supervisor / Cashier)
 *
 * Roles:
 * - Admin:      Full sidebar except POS
 * - Supervisor:  Dashboard, Manage Stock, Profile, Logout (NO POS)
 * - Cashier:    POS, Profile, Logout only
 *
 * Anti-flash strategy:
 *   CSS hides sidebar <nav> via visibility:hidden.
 *   This script filters [data-role] items with display:none,
 *   then adds .role-filtered to <nav> to reveal it.
 *   Result: sidebar contents only appear AFTER filtering — zero flash.
 */

function applyRoleBasedAccess() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.location.href = 'login.html';
      return;
    }

    const user = JSON.parse(userStr);
    let actualRole;
    if (user.user_type === 'Admin') actualRole = 'admin';
    else if (user.user_type === 'Cashier') actualRole = 'cashier';
    else actualRole = 'supervisor'; // Supervisor + legacy Staff

    // Filter every [data-role] element on the page
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.dataset.role.split(',').map(r => r.trim().toLowerCase());
      if (allowed.includes('all') || allowed.includes(actualRole)) {
        el.style.display = '';   // show
      } else {
        el.style.display = 'none'; // hide
      }
    });

    // Reveal sidebar nav (anti-flash unlock)
    const sidebarNav = document.querySelector('#main-sidebar nav');
    if (sidebarNav) {
      sidebarNav.classList.add('role-filtered');
    }

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
