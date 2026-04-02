/**
 * Alert Modal System
 * Replaces all alert() calls with card-based UI modals
 * Reuses existing .floating-card styling from dashboard.css
 */

'use strict';

/**
 * Show an alert card modal with optional action buttons
 * @param {string} message - Alert message to display
 * @param {string} type - Type of alert: 'info' | 'success' | 'warning' | 'error' (default: 'info')
 * @param {Object} options - Optional configuration
 */
function showAlertModal(message, type = 'info', options = {}) {
    const defaults = {
        title: getTitleByType(type),
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
        showCancel: type === 'warning' || type === 'error'
    };
    const config = { ...defaults, ...options };

    // Create overlay — z-index 99999 to appear ABOVE notification dropdown (z-index 9998)
    const overlay = document.createElement('div');
    overlay.className = 'alert-modal-overlay';
    overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.3)',
        'backdrop-filter:blur(2px)',
        '-webkit-backdrop-filter:blur(2px)',
        'z-index:99999',
        'display:flex',
        'align-items:center',
        'justify-content:center',
    ].join(';');

    // Create card
    const card = document.createElement('div');
    card.className = 'alert-modal-card';
    card.style.cssText = [
        'background:white',
        'border-radius:0.75rem',
        'box-shadow:0 10px 40px rgba(0,0,0,0.15)',
        'max-width:400px',
        'padding:2rem',
        'animation:slideUp 0.3s ease',
    ].join(';');

    // Title
    const title = document.createElement('h2');
    title.className = 'alert-modal-title alert-modal-title-' + type;
    title.textContent = config.title;
    title.style.cssText = 'margin:0 0 1rem 0;font-size:1.125rem;font-weight:600;color:#1f2937;';
    card.appendChild(title);

    // Message
    const msg = document.createElement('p');
    msg.className = 'alert-modal-message';
    msg.textContent = message;
    msg.style.cssText = 'margin:0 0 1.5rem 0;font-size:0.95rem;color:#4b5563;line-height:1.5;';
    card.appendChild(msg);

    // Buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'alert-modal-buttons';
    buttonsDiv.style.cssText = 'display:flex;gap:0.75rem;justify-content:flex-end;';

    // Cancel button (if needed)
    if (config.showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'alert-modal-btn alert-modal-btn-secondary';
        cancelBtn.textContent = config.cancelText;
        cancelBtn.style.cssText = [
            'padding:0.625rem 1.25rem',
            'border:1px solid #d1d5db',
            'background:white',
            'color:#374151',
            'border-radius:0.5rem',
            'cursor:pointer',
            'font-size:0.875rem',
            'font-weight:500',
            "font-family:'Inter',sans-serif",
            'transition:all 0.15s',
        ].join(';');
        cancelBtn.onmouseover = function() { this.style.background = '#f3f4f6'; };
        cancelBtn.onmouseout  = function() { this.style.background = 'white'; };
        cancelBtn.addEventListener('click', function() {
            overlay.remove();
            if (config.onCancel) config.onCancel();
        });
        buttonsDiv.appendChild(cancelBtn);
    }

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'alert-modal-btn alert-modal-btn-' + type;
    confirmBtn.textContent = config.confirmText;
    const bgColor = type === 'error' ? '#dc2626' : type === 'warning' ? '#f59e0b' : '#10b981';
    const bgColorHover = type === 'error' ? '#b91c1c' : type === 'warning' ? '#d97706' : '#059669';
    confirmBtn.style.cssText = [
        'padding:0.625rem 1.25rem',
        'border:none',
        'background:' + bgColor,
        'color:white',
        'border-radius:0.5rem',
        'cursor:pointer',
        'font-size:0.875rem',
        'font-weight:500',
        "font-family:'Inter',sans-serif",
        'transition:all 0.15s',
    ].join(';');
    confirmBtn.onmouseover = function() { this.style.background = bgColorHover; };
    confirmBtn.onmouseout  = function() { this.style.background = bgColor; };
    confirmBtn.addEventListener('click', function() {
        overlay.remove();
        if (config.onConfirm) config.onConfirm();
    });
    buttonsDiv.appendChild(confirmBtn);

    card.appendChild(buttonsDiv);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (config.onCancel) config.onCancel();
        }
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Focus confirm button
    confirmBtn.focus();
}

/**
 * Show confirmation dialog (with Cancel and Confirm buttons)
 */
function showConfirmModal(message, onConfirm, onCancel) {
    showAlertModal(message, 'warning', {
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        onConfirm: onConfirm,
        onCancel: onCancel
    });
}

/**
 * Show error alert
 */
function showErrorModal(message) {
    showAlertModal(message, 'error', {
        confirmText: 'OK',
        title: 'Error'
    });
}

/**
 * Show success alert
 */
function showSuccessModal(message) {
    showAlertModal(message, 'success', {
        confirmText: 'OK',
        title: 'Success'
    });
}

/**
 * Show info alert
 */
function showInfoModal(message) {
    showAlertModal(message, 'info', {
        confirmText: 'OK',
        title: 'Information'
    });
}

/**
 * Get default title based on alert type
 */
function getTitleByType(type) {
    var titles = {
        'info': 'Information',
        'success': 'Success',
        'warning': 'Confirm',
        'error': 'Error'
    };
    return titles[type] || 'Alert';
}

// Add animation keyframes to document
if (!document.getElementById('alert-modal-styles')) {
    var style = document.createElement('style');
    style.id = 'alert-modal-styles';
    style.textContent = [
        '@keyframes slideUp {',
        '  from { opacity: 0; transform: translateY(20px); }',
        '  to { opacity: 1; transform: translateY(0); }',
        '}',
        '.alert-modal-overlay { font-family: "Inter", system-ui, -apple-system, sans-serif; }',
        '.alert-modal-title-info { color: #3b82f6 !important; }',
        '.alert-modal-title-success { color: #10b981 !important; }',
        '.alert-modal-title-warning { color: #f59e0b !important; }',
        '.alert-modal-title-error { color: #dc2626 !important; }',
    ].join('\n');
    document.head.appendChild(style);
}