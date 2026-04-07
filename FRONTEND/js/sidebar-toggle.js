/* =================================================================
   sidebar-toggle.js  v3 — Bulletproof sidebar for ALL pages
   ─────────────────────────────────────────────────────────────────
   Design principles:
   ① Document-level event delegation — NO element caching at boot.
     Elements are looked up LIVE at every click. If any JS replaces
     inner HTML (e.g. after an API fetch), the listener still fires.
   ② matchMedia breakpoint — always in sync with CSS @media rules.
   ③ Works on ALL pages: dashboard, profile, products, sales, etc.
   ④ Desktop (≥1025px) : sidebar always visible, close-btn collapses
     to 64px icon rail. Toggle-btn in header is HIDDEN by CSS.
   ⑤ Tablet+Mobile (≤1024px): toggle-btn VISIBLE. Sidebar slides
     in from left as a fixed overlay. Overlay backdrop closes it.
================================================================= */
(function () {
  'use strict';

  var COLLAPSE_KEY = 'haneuscafe_sidebar_collapsed';

  /* ── Breakpoint (must match sidebar.css @media (max-width:1024px)) */
  function isOverlay() {
    return window.matchMedia('(max-width: 1024px)').matches;
  }

  /* ── Live element accessors — never stale ── */
  function sidebar()   { return document.getElementById('main-sidebar'); }
  function overlay()   { return document.getElementById('sidebar-overlay'); }
  function toggleBtn() { return document.getElementById('sidebar-toggle-btn'); }
  function mainWrap()  {
    return document.querySelector('.main-wrapper') ||
           document.querySelector('main') ||
           document.querySelector('.content');
  }

  /* ── Open / Close (overlay mode — tablet + mobile) ── */
  function openSidebar() {
    var s = sidebar(), o = overlay();
    if (!s) return;
    s.classList.add('sidebar-open');
    s.classList.remove('sidebar-collapsed');
    if (o) o.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateToggleIcon(true);
  }

  function closeSidebar() {
    var s = sidebar(), o = overlay();
    if (!s) return;
    s.classList.remove('sidebar-open');
    if (o) o.classList.remove('active');
    document.body.style.overflow = '';
    updateToggleIcon(false);
  }

  /* ── Collapse / Expand (desktop push-layout) ── */
  function collapseSidebar() {
    var s = sidebar(), w = mainWrap();
    if (!s) return;
    s.classList.add('sidebar-collapsed');
    if (w) w.classList.add('main-wrapper--collapsed');
    localStorage.setItem(COLLAPSE_KEY, '1');
    updateCloseIcon(true);
  }

  function expandSidebar() {
    var s = sidebar(), w = mainWrap();
    if (!s) return;
    s.classList.remove('sidebar-collapsed');
    if (w) w.classList.remove('main-wrapper--collapsed');
    localStorage.setItem(COLLAPSE_KEY, '0');
    updateCloseIcon(false);
  }

  function toggleDesktop() {
    var s = sidebar();
    if (!s) return;
    s.classList.contains('sidebar-collapsed') ? expandSidebar() : collapseSidebar();
  }

  /* ── Icon helpers — set SVG icon name via Lucide ── */
  function setIcon(el, iconName) {
    if (!el) return;
    var svg = el.querySelector('svg[data-lucide]');
    var tag = el.querySelector('i[data-lucide]');
    if (svg) svg.setAttribute('data-lucide', iconName);
    else if (tag) tag.setAttribute('data-lucide', iconName);
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function updateToggleIcon(isOpen) {
    setIcon(toggleBtn(), isOpen ? 'panel-left-close' : 'panel-left');
  }

  function updateCloseIcon(isCollapsed) {
    var s = sidebar();
    if (!s) return;
    setIcon(s.querySelector('.sidebar-close-btn'),
            isCollapsed ? 'panel-left-open' : 'panel-left-close');
  }

  /* ── Restore desktop collapse state ── */
  function restoreDesktopState() {
    if (isOverlay()) return;
    var s = sidebar(), w = mainWrap();
    if (!s) return;
    var saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === '1') {
      s.classList.add('sidebar-collapsed');
      if (w) w.classList.add('main-wrapper--collapsed');
      updateCloseIcon(true);
    } else {
      updateCloseIcon(false);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     DOCUMENT-LEVEL EVENT DELEGATION
     All clicks bubble up to document.body → check the target.
     This is immune to DOM replacement and Lucide icon rebuilds.
  ══════════════════════════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var s = sidebar();
    if (!s) return;

    /* ── (A) Header toggle button — #sidebar-toggle-btn ── */
    var toggleEl = e.target.closest('#sidebar-toggle-btn, .sidebar-toggle-btn');
    if (toggleEl) {
      e.stopPropagation();
      if (isOverlay()) {
        s.classList.contains('sidebar-open') ? closeSidebar() : openSidebar();
      } else {
        toggleDesktop();
      }
      return;
    }

    /* ── (B) Sidebar close button — .sidebar-close-btn (inside sidebar) ── */
    var closeEl = e.target.closest('.sidebar-close-btn');
    if (closeEl && s.contains(closeEl)) {
      e.stopPropagation();
      if (isOverlay()) {
        closeSidebar();
      } else {
        toggleDesktop();
      }
      return;
    }

    /* ── (C) Overlay backdrop click — close sidebar ── */
    var overlayEl = e.target.closest('#sidebar-overlay');
    if (overlayEl) {
      closeSidebar();
      return;
    }

    /* ── (D) Click OUTSIDE sidebar on mobile → close if open ── */
    if (isOverlay() && s.classList.contains('sidebar-open')) {
      if (!s.contains(e.target)) {
        closeSidebar();
      }
    }
  }, true); /* useCapture=true so it fires before any stopPropagation */

  /* ── Escape key closes overlay sidebar ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOverlay()) closeSidebar();
  });

  /* ── Resize: re-sync state when crossing 1024px breakpoint ── */
  var _rt;
  window.addEventListener('resize', function () {
    clearTimeout(_rt);
    _rt = setTimeout(function () {
      var s = sidebar(), o = overlay(), w = mainWrap();
      if (!s) return;
      if (!isOverlay()) {
        /* Switched to desktop — remove mobile state */
        s.classList.remove('sidebar-open');
        if (o) { o.classList.remove('active'); }
        document.body.style.overflow = '';
        restoreDesktopState();
      } else {
        /* Switched to mobile/tablet — remove desktop collapse */
        s.classList.remove('sidebar-collapsed');
        if (w) w.classList.remove('main-wrapper--collapsed');
        updateToggleIcon(s.classList.contains('sidebar-open'));
      }
    }, 80);
  });

  /* ── Bootstrap on DOM ready ── */
  function boot() {
    var s = sidebar();
    if (!s) return;
    restoreDesktopState();

    /* Ensure toggle icon matches initial state */
    setTimeout(function () {
      if (isOverlay()) {
        updateToggleIcon(s.classList.contains('sidebar-open'));
      }
      updateCloseIcon(s.classList.contains('sidebar-collapsed'));
    }, 150); /* slight delay so Lucide finishes icon replacement */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}());
