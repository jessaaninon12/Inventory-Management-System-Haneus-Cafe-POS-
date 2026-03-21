/* =================================================================
   sidebar-toggle.js — Shared sidebar toggle for all inner pages.

   Requires in every page:
     <div id="sidebar-overlay" class="sidebar-overlay"></div>  (before .layout)
     <aside id="main-sidebar">                                  (sidebar element)
       <button class="sidebar-close-btn">…</button>            (inside sidebar)
     <button id="sidebar-toggle-btn" class="sidebar-toggle-btn"> (in header)

   Behaviour:
     Mobile  (<768px):  #sidebar-toggle-btn shows/hides the sidebar as an
                        overlay.  Icon switches panel-left ↔ panel-left-close.
                        .sidebar-close-btn also closes the overlay.
                        Clicking nav links does NOT close the sidebar.
     Desktop (≥768px):  #sidebar-toggle-btn is hidden (CSS: display:none).
                        .sidebar-close-btn collapses sidebar to icon-rail and
                        back. Nav link clicks do NOT change sidebar state.
================================================================= */
(function initInnerSidebarToggle() {
  'use strict';

  const sidebar   = document.getElementById('main-sidebar');
  const overlay   = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');  // header (mobile)
  const closeBtn  = document.querySelector('.sidebar-close-btn');   // inside sidebar

  if (!sidebar) return;

  function isMobile() { return window.innerWidth < 768; }

  /* ── icon helpers ─────────────────────────────────────────────── */
  function setToggleIcon(iconName) {
    if (!toggleBtn) return;
    const el = toggleBtn.querySelector('i[data-lucide]') ||
               toggleBtn.querySelector('svg');
    if (el && el.setAttribute) {
      el.setAttribute('data-lucide', iconName);
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function refreshToggleIcon() {
    if (!toggleBtn) return;
    setToggleIcon(sidebar.classList.contains('sidebar-open')
      ? 'panel-left-close'
      : 'panel-left');
  }

  /* ── mobile helpers ───────────────────────────────────────────── */
  function openMobile() {
    sidebar.classList.add('sidebar-open');
    if (overlay) overlay.classList.add('active');
    refreshToggleIcon();
  }

  function closeMobile() {
    sidebar.classList.remove('sidebar-open');
    if (overlay) overlay.classList.remove('active');
    refreshToggleIcon();
  }

  /* ── event wiring ─────────────────────────────────────────────── */

  // Header toggle button — mobile only (CSS hides it on desktop)
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isMobile()) return;   // safety guard (CSS already hides it)
      sidebar.classList.contains('sidebar-open') ? closeMobile() : openMobile();
    });
  }

  // Close-button inside sidebar
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isMobile()) {
        closeMobile();
      } else {
        // Desktop: toggle icon-rail (collapsed 60 px strip)
        sidebar.classList.toggle('sidebar-icon-rail');
      }
    });
  }

  // Overlay click — close mobile sidebar
  if (overlay) {
    overlay.addEventListener('click', function () {
      closeMobile();
    });
  }

  // Escape key — close mobile sidebar
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMobile()) closeMobile();
  });

  // Resize — reset mobile state when going to desktop
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      sidebar.classList.remove('sidebar-open');
      if (overlay) overlay.classList.remove('active');
    }
    refreshToggleIcon();
  });

  // Initialise icon state
  refreshToggleIcon();
}());
