/* =================================================================
   sidebar-toggle.js — Unified sidebar toggler for all pages.

   Required HTML elements per page:
     <div id="sidebar-overlay" class="sidebar-overlay"></div>
     <aside id="main-sidebar">
       <button class="sidebar-close-btn">…</button>   (inside sidebar)
     </aside>
     <button id="sidebar-toggle-btn" class="sidebar-toggle-btn"> (in header)

   DESKTOP (≥ 768px):
     - Sidebar is always visible.
     - sidebar-toggle-btn is hidden via CSS (sidebar.css display:none).
     - sidebar-close-btn (inside sidebar) collapses to 64px icon-only rail.
     - State is persisted across pages via localStorage key
       'haneuscafe_sidebar_collapsed'.

   MOBILE (< 768px):
     - Sidebar is hidden by default (translateX -100%).
     - sidebar-toggle-btn in header slides it in as a fixed overlay.
     - sidebar-close-btn inside sidebar closes it.
     - Clicking the backdrop overlay also closes it.
     - Escape key closes it.
     - Desktop collapse state is NOT applied on mobile.
================================================================= */
(function initSidebarToggle() {
  'use strict';

  var COLLAPSE_KEY = 'haneuscafe_sidebar_collapsed';

  var sidebar   = document.getElementById('main-sidebar');
  var overlay   = document.getElementById('sidebar-overlay');
  var toggleBtn = document.getElementById('sidebar-toggle-btn');
  var closeBtn  = document.querySelector('.sidebar-close-btn');
  var wrapper   = document.querySelector('.main-wrapper') || document.querySelector('main');

  if (!sidebar) return;

  /* ── Helpers ─────────────────────────────────────────────── */

  function isMobile() { return window.innerWidth < 768; }

  /* Update icon on the sidebar close/expand button */
  function updateCloseBtnIcon() {
    if (!closeBtn) return;
    var icon = closeBtn.querySelector('i[data-lucide]');
    if (!icon) return;
    var collapsed = sidebar.classList.contains('sidebar-collapsed');
    icon.setAttribute('data-lucide', collapsed ? 'panel-left-open' : 'panel-left-close');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  /* Update icon on the header toggle button (mobile) */
  function updateToggleBtnIcon(isOpen) {
    if (!toggleBtn) return;
    var el = toggleBtn.querySelector('i[data-lucide]') || toggleBtn.querySelector('svg');
    if (el && el.setAttribute) {
      el.setAttribute('data-lucide', isOpen ? 'panel-left-close' : 'panel-left');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  /* ── Desktop collapse ────────────────────────────────────── */

  function applyDesktopCollapse(collapsed) {
    if (collapsed) {
      sidebar.classList.add('sidebar-collapsed');
      if (wrapper) wrapper.classList.add('main-wrapper--collapsed');
    } else {
      sidebar.classList.remove('sidebar-collapsed');
      if (wrapper) wrapper.classList.remove('main-wrapper--collapsed');
    }
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    updateCloseBtnIcon();
  }

  /* Restore desktop collapse state on page load */
  if (!isMobile()) {
    var saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === '1') {
      /* Apply immediately (no animation on first load) */
      sidebar.classList.add('sidebar-collapsed');
      if (wrapper) wrapper.classList.add('main-wrapper--collapsed');
    }
    updateCloseBtnIcon();
  }

  /* ── Mobile overlay ──────────────────────────────────────── */

  function openMobile() {
    sidebar.classList.add('sidebar-open');
    if (overlay) overlay.classList.add('active');
    updateToggleBtnIcon(true);
  }

  function closeMobile() {
    sidebar.classList.remove('sidebar-open');
    if (overlay) overlay.classList.remove('active');
    updateToggleBtnIcon(false);
  }

  /* ── Event wiring ─────────────────────────────────────────── */

  /* sidebar-close-btn — desktop: toggle collapse; mobile: close overlay */
  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!isMobile()) {
        applyDesktopCollapse(!sidebar.classList.contains('sidebar-collapsed'));
      } else {
        closeMobile();
      }
    });
  }

  /* sidebar-toggle-btn in header — mobile: open/close overlay */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (isMobile()) {
        sidebar.classList.contains('sidebar-open') ? closeMobile() : openMobile();
      } else {
        /* On desktop the button is hidden via CSS, but as a fallback
           also toggle collapse if somehow visible (e.g. during resize). */
        applyDesktopCollapse(!sidebar.classList.contains('sidebar-collapsed'));
      }
    });
  }

  /* Overlay backdrop click — close mobile sidebar */
  if (overlay) {
    overlay.addEventListener('click', closeMobile);
  }

  /* Escape key — close mobile sidebar */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isMobile()) closeMobile();
  });

  /* Resize — maintain correct state when crossing breakpoint */
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      /* Returning to desktop — close mobile overlay if open */
      sidebar.classList.remove('sidebar-open');
      if (overlay) overlay.classList.remove('active');
      /* Restore saved collapse state */
      var s = localStorage.getItem(COLLAPSE_KEY);
      applyDesktopCollapse(s === '1');
    } else {
      /* Going to mobile — remove desktop-only classes */
      sidebar.classList.remove('sidebar-collapsed');
      if (wrapper) wrapper.classList.remove('main-wrapper--collapsed');
      updateToggleBtnIcon(sidebar.classList.contains('sidebar-open'));
    }
    updateCloseBtnIcon();
  });

  /* Initialise icons */
  updateCloseBtnIcon();
  updateToggleBtnIcon(false);

}());
