const API_BASE = 'http://localhost:8000';

// Get token from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

const mainMessage = document.getElementById('mainMessage');
const resetStatus = document.getElementById('resetStatus');
const tokenValidatingSpinner = document.getElementById('tokenValidatingSpinner');
const resetForm = document.getElementById('resetForm');
const submitBtn = document.getElementById('submitBtn');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

/**
 * Display status message with animation
 */
function showStatus(message, type = 'info') {
  resetStatus.textContent = message;
  resetStatus.className = `reset-status ${type}`;
  resetStatus.style.display = 'block';
  
  if (type === 'error') {
    console.error('Reset error:', message);
  }
}

/**
 * Clear all forms and show error state
 */
function showError(message) {
  mainMessage.textContent = message;
  tokenValidatingSpinner.style.display = 'none';
  resetForm.style.display = 'none';
  showStatus(message, 'error');
}

/**
 * Show the password reset form
 */
function showResetForm() {
  mainMessage.textContent = 'Enter your new password below.';
  tokenValidatingSpinner.style.display = 'none';
  resetForm.style.display = 'block';
  newPasswordInput.focus();
}

/**
 * Initialize: check if token exists and is valid
 */
async function initializeResetForm() {
  if (!resetToken) {
    showError('No password reset link provided. Please request a new one from the login page.');
    return;
  }
  
  // Note: We don't validate the token here — we'll validate it when the user submits
  // This prevents timing issues and is more user-friendly
  showResetForm();
}

/**
 * Handle password reset form submission
 */
submitBtn.addEventListener('click', async () => {
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  
  // Client-side validation
  if (!newPassword || !confirmPassword) {
    showStatus('Both password fields are required.', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showStatus('Password must be at least 8 characters long.', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showStatus('Passwords do not match.', 'error');
    return;
  }
  
  // Disable button and show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Resetting...';
  resetStatus.style.display = 'none';
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/reset-password-with-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        new_password: newPassword,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Success!
      showStatus(data.message || 'Password reset successfully!', 'success');
      resetForm.style.display = 'none';
      mainMessage.textContent = 'Your password has been reset successfully.';
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      // Error from API
      showStatus(data.error || 'Failed to reset password.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showStatus('Network error. Could not reset password. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reset Password';
  }
});

// Initialize form on page load
document.addEventListener('DOMContentLoaded', initializeResetForm);
