/**
 * Alert Modal System  v2 — Smooth Transitions Edition
 * Replaces all alert() calls with card-based UI modals
 * Features smooth open/close with CSS transitions
 */

'use strict';

/**
 * Show an alert card modal with optional action buttons
 * @param {string} message - Alert message to display
 * @param {string} type - Type of alert: 'info' | 'success' | 'warning' | 'error' (default: 'info')
 * @param {Object} options - Optional configuration
 */
function showAlertModal(message, type, options) {
    if (type === undefined) type = 'info';
    if (options === undefined) options = {};

    var defaults = {
        title: getTitleByType(type),
        confirmText: 'OK',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
        showCancel: type === 'warning' || type === 'error'
    };
    var config = Object.assign({}, defaults, options);

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'am-overlay';

    // Create card
    var card = document.createElement('div');
    card.className = 'am-card';

    // Icon
    var iconColors = {
        info: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#dc2626'
    };
    var iconBgs = {
        info: '#eff6ff', success: '#ecfdf5', warning: '#fffbeb', error: '#fef2f2'
    };
    var iconSvgs = {
        info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    };

    var iconWrap = document.createElement('div');
    iconWrap.className = 'am-icon';
    iconWrap.style.background = iconBgs[type] || iconBgs.info;
    iconWrap.style.color = iconColors[type] || iconColors.info;
    iconWrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (iconSvgs[type] || iconSvgs.info) + '</svg>';
    card.appendChild(iconWrap);

    // Title
    var title = document.createElement('h2');
    title.className = 'am-title';
    title.textContent = config.title;
    title.style.color = iconColors[type] || iconColors.info;
    card.appendChild(title);

    // Message
    var msg = document.createElement('p');
    msg.className = 'am-message';
    msg.textContent = message;
    card.appendChild(msg);

    // Buttons container
    var buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'am-buttons';

    // Smooth close helper
    function smoothClose(callback) {
        overlay.classList.remove('am-visible');
        setTimeout(function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (callback) callback();
        }, 300);
    }

    // Cancel button (if needed)
    if (config.showCancel) {
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'am-btn am-btn-secondary';
        cancelBtn.textContent = config.cancelText;
        cancelBtn.addEventListener('click', function () {
            smoothClose(config.onCancel);
        });
        buttonsDiv.appendChild(cancelBtn);
    }

    // Confirm button
    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'am-btn am-btn-primary am-btn-' + type;
    confirmBtn.textContent = config.confirmText;
    confirmBtn.addEventListener('click', function () {
        smoothClose(config.onConfirm);
    });
    buttonsDiv.appendChild(confirmBtn);

    card.appendChild(buttonsDiv);

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            smoothClose(config.onCancel);
        }
    });

    // Close on Escape
    function onEsc(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', onEsc);
            smoothClose(config.onCancel);
        }
    }
    document.addEventListener('keydown', onEsc);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Trigger transition (next frame)
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            overlay.classList.add('am-visible');
            confirmBtn.focus();
        });
    });
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

// Add animation styles
if (!document.getElementById('alert-modal-styles-v2')) {
    var amStyle = document.createElement('style');
    amStyle.id = 'alert-modal-styles-v2';
    amStyle.textContent = [
        '.am-overlay {',
        '  position: fixed; inset: 0;',
        '  background: rgba(0,0,0,0.35);',
        '  backdrop-filter: blur(4px);',
        '  -webkit-backdrop-filter: blur(4px);',
        '  z-index: 99999;',
        '  display: flex; align-items: center; justify-content: center;',
        '  font-family: "Inter", system-ui, -apple-system, sans-serif;',
        '  opacity: 0; visibility: hidden;',
        '  transition: opacity 0.3s cubic-bezier(0.4,0,0.2,1), visibility 0.3s cubic-bezier(0.4,0,0.2,1);',
        '}',
        '.am-overlay.am-visible { opacity: 1; visibility: visible; }',
        '',
        '.am-card {',
        '  background: white; border-radius: 16px;',
        '  box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08);',
        '  max-width: 400px; width: 90%; padding: 2rem; text-align: center;',
        '  transform: scale(0.88) translateY(16px); opacity: 0;',
        '  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;',
        '}',
        '.am-overlay.am-visible .am-card { transform: scale(1) translateY(0); opacity: 1; }',
        '',
        '.am-icon {',
        '  width: 56px; height: 56px; border-radius: 50%;',
        '  display: flex; align-items: center; justify-content: center;',
        '  margin: 0 auto 1rem;',
        '  transition: transform 0.3s ease;',
        '}',
        '.am-overlay.am-visible .am-icon { animation: am-bounce 0.5s ease 0.2s; }',
        '@keyframes am-bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }',
        '',
        '.am-title { margin: 0 0 0.5rem 0; font-size: 1.15rem; font-weight: 700; }',
        '.am-message { margin: 0 0 1.5rem 0; font-size: 0.925rem; color: #4b5563; line-height: 1.6; }',
        '',
        '.am-buttons { display: flex; gap: 0.75rem; justify-content: center; }',
        '',
        '.am-btn {',
        '  padding: 0.65rem 1.4rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600;',
        '  cursor: pointer; border: none; font-family: inherit;',
        '  transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;',
        '}',
        '.am-btn:active { transform: translateY(0) scale(0.96); }',
        '',
        '.am-btn-secondary {',
        '  background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;',
        '}',
        '.am-btn-secondary:hover { background: #e5e7eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }',
        '',
        '.am-btn-info    { background: #3b82f6; color: white; }',
        '.am-btn-info:hover    { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59,130,246,0.3); }',
        '.am-btn-success { background: #10b981; color: white; }',
        '.am-btn-success:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16,185,129,0.3); }',
        '.am-btn-warning { background: #f59e0b; color: white; }',
        '.am-btn-warning:hover { background: #d97706; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(245,158,11,0.3); }',
        '.am-btn-error   { background: #dc2626; color: white; }',
        '.am-btn-error:hover   { background: #b91c1c; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(220,38,38,0.3); }',
    ].join('\n');
    document.head.appendChild(amStyle);
}