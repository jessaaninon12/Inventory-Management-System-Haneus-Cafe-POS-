/* =================================================================
   logout-modal.js  —  Shared logout confirmation modal
   Include this script in any page that has a Logout link.
   It overrides the global confirmLogout() with a styled modal.
================================================================= */
(function () {

  /* ── Inject CSS ──────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    .logout-overlay {
      position: fixed;
      inset: 0;
      background: rgba(74, 47, 33, 0.55);
      backdrop-filter: blur(7px);
      -webkit-backdrop-filter: blur(7px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: lo-fade 0.22s ease;
    }

    @keyframes lo-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .logout-card {
      background: #fff;
      border-radius: 18px;
      padding: 40px 48px 36px;
      text-align: center;
      max-width: 360px;
      width: 90%;
      box-shadow: 0 24px 60px rgba(74,47,33,0.28), 0 4px 12px rgba(0,0,0,0.12);
      border: 1px solid #e1c8b2;
      animation: lo-scale 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes lo-scale {
      from { transform: scale(0.82); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    .logout-icon-wrap {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #f5ede3;
      border: 2px solid #e1c8b2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
      color: #c47b42;
    }

    .logout-icon-wrap svg {
      width: 30px;
      height: 30px;
      stroke: #c47b42;
    }

    .logout-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #4a2f21;
      margin-bottom: 8px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .logout-msg {
      font-size: 0.9rem;
      color: #6e4f3e;
      margin-bottom: 28px;
      line-height: 1.5;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .logout-btns {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-lo-cancel,
    .btn-lo-confirm {
      padding: 0.7rem 1.6rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
      font-family: 'Inter', system-ui, sans-serif;
      border: none;
    }

    .btn-lo-cancel {
      background: #f5ede3;
      color: #4a2f21;
      border: 1.5px solid #e1c8b2;
    }

    .btn-lo-cancel:hover {
      background: #e1c8b2;
      transform: translateY(-1px);
    }

    .btn-lo-confirm {
      background: #c47b42;
      color: #fff;
      box-shadow: 0 4px 12px rgba(196,123,66,0.3);
    }

    .btn-lo-confirm:hover {
      background: #a35f2e;
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(163,95,46,0.35);
    }
  `;

  /* ── Inject Modal HTML ───────────────────────────────────────── */
  function init() {
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id    = 'logoutModal';
    overlay.className = 'logout-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="logout-card" id="logoutCard">
        <div class="logout-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h3 class="logout-title">Logout</h3>
        <p class="logout-msg">Are you sure you want to logout?</p>
        <div class="logout-btns">
          <button class="btn-lo-cancel" id="logoutCancelBtn">Cancel</button>
          <button class="btn-lo-confirm" id="logoutConfirmBtn">Logout</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    /* Close on cancel */
    document.getElementById('logoutCancelBtn').addEventListener('click', closeModal);

    /* Confirm logout */
    document.getElementById('logoutConfirmBtn').addEventListener('click', () => {
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });

    /* Close on backdrop click */
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    /* Close on Escape */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') closeModal();
    });
  }

  function closeModal() {
    const overlay = document.getElementById('logoutModal');
    if (overlay) overlay.style.display = 'none';
  }

  /* ── Override global confirmLogout ───────────────────────────── */
  window.confirmLogout = function (event) {
    if (event) event.preventDefault();
    const overlay = document.getElementById('logoutModal');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.animation = 'none';
      void overlay.offsetWidth; /* reflow */
      overlay.style.animation = '';
    }
  };

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
