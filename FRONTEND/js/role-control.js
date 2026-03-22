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

document.addEventListener('DOMContentLoaded', () => {
  applyRoleBasedAccess();
});

function applyRoleBasedAccess() {
  try {
    // Get user data from localStorage (set during login)
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.warn('No user in localStorage — role access not applied');
      return;
    }

    const user = JSON.parse(userStr);

    // user.user_type is "Admin" or "Staff" (from backend UserDTO.to_dict())
    // Normalise to lowercase 'admin' or 'staff' for data-role comparisons
    const actualRole = (user.user_type === 'Admin') ? 'admin' : 'staff';

    // Apply visibility to every element that carries a data-role attribute
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.dataset.role.split(',').map(r => r.trim().toLowerCase());
      el.style.display = (allowed.includes('all') || allowed.includes(actualRole)) ? '' : 'none';
    });

  } catch (err) {
    console.error('Error applying role-based access:', err);
  }
}

// Export for use in other scripts
window.applyRoleBasedAccess = applyRoleBasedAccess;
