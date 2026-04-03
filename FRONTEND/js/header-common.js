/* =================================================================
   header-common.js — Shared header components for all pages.
   Provides: Profile Flyout, Notification System, Product Search.
   Include AFTER lucide.js and page-specific JS.
   Guards: Skips flyout/notification init if dashboard.js already loaded.
================================================================= */
'use strict';

const HC_API = window.location.origin + '/api';

// ══════════════════════════════════════════════════════════════════
// 1. PROFILE FLYOUT — toggle + populate from API
//    Skip if dashboard.js already defined toggleProfileFlyout
// ══════════════════════════════════════════════════════════════════
if (typeof window._dashboardProfileInit === 'undefined') {
  // Only define if not already defined by dashboard.js
  window.toggleProfileFlyout = function() {
    const flyout = document.getElementById('profileFlyout');
    if (flyout) flyout.style.display = flyout.style.display === 'none' ? 'block' : 'none';
  };

  // Close flyout on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('profileFlyoutWrapper');
    const flyout = document.getElementById('profileFlyout');
    if (flyout && wrapper && !wrapper.contains(e.target)) {
      flyout.style.display = 'none';
    }
  });

  // Populate profile flyout from localStorage + API
  (async function _hcInitProfileFlyout() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user?.id;
      const nameEl = document.getElementById('flyoutUsername');
      const idEl   = document.getElementById('flyoutUserId');
      const typeEl = document.getElementById('flyoutAccountType');
      if (nameEl) nameEl.textContent = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User';
      if (idEl)   idEl.textContent = `ID: #${userId || '—'}`;
      if (typeEl) typeEl.textContent = user.user_type === 'Admin' ? 'Admin • Haneus Cafe Owner' : 'Staff • Haneus Cafe Employee';

      if (userId) {
        const res = await fetch(`${HC_API}/profile/${userId}/`);
        if (res.ok) {
          const p = await res.json();
          const picUrl = p.profile_picture_url || p.avatar_url || '';
          if (picUrl) {
            const src = picUrl.startsWith('http') ? picUrl : `${window.location.origin}${picUrl}`;
            const headerImg = document.getElementById('headerProfileImg');
            const flyoutImg = document.getElementById('flyoutProfileImg');
            if (headerImg) headerImg.src = src;
            if (flyoutImg) flyoutImg.src = src;
          }
          if (nameEl) nameEl.textContent = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || 'User';
          if (typeEl) typeEl.textContent = p.account_type_label || (p.user_type === 'Admin' ? 'Admin • Haneus Cafe Owner' : 'Staff • Haneus Cafe Employee');
        }
      }
    } catch (e) { console.warn('Profile flyout init error:', e); }
  }());
}

// ══════════════════════════════════════════════════════════════════
// 2. NOTIFICATION SYSTEM — stock alerts, approvals
//    Skip if dashboard.js already initialized notifications
// ══════════════════════════════════════════════════════════════════
if (typeof window._dashboardNotifInit === 'undefined') {
  const HC_NOTIF_KEY = 'haneus_notif_store';
  let _hcSelectedNotifId = null;

  function _hcLoadStore() {
    try { return JSON.parse(localStorage.getItem(HC_NOTIF_KEY) || '[]'); }
    catch { return []; }
  }
  function _hcSaveStore(notifs) {
    localStorage.setItem(HC_NOTIF_KEY, JSON.stringify(notifs));
  }

  function _hcUpdateBadge(notifs) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const unread = notifs.filter(n => !n.read).length;
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'inline-flex' : 'none';
  }

  function _hcRenderNotifList(notifs) {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (!notifs.length) {
      list.innerHTML = '<p style="padding:1.25rem;color:var(--mocha);font-size:0.875rem;text-align:center;">No notifications</p>';
      return;
    }

    list.innerHTML = notifs.map(n => {
      const dotColor = n.type === 'critical' ? 'red' : n.type === 'warning' ? 'orange' : n.type === 'success' ? 'green' : 'blue';
      const preview = (n.body || '').substring(0, 60) + ((n.body || '').length > 60 ? '…' : '');
      return `
        <div class="notif-item ${n.read ? 'read' : ''} ${_hcSelectedNotifId === n.id ? 'selected' : ''}"
             onclick="hcSelectNotif('${n.id}')" style="display:flex;align-items:flex-start;gap:0.625rem;padding:0.75rem 1rem;cursor:pointer;border-bottom:1px solid rgba(225,200,178,0.2);transition:background 0.15s;${!n.read ? 'background:rgba(196,123,66,0.06);' : ''}">
          <div style="width:8px;height:8px;border-radius:50%;background:${dotColor === 'red' ? '#dc2626' : dotColor === 'orange' ? '#f59e0b' : dotColor === 'green' ? '#16a34a' : '#3b82f6'};margin-top:6px;flex-shrink:0;"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:0.8rem;color:var(--espresso);">${n.title}</div>
            <div style="font-size:0.75rem;color:var(--mocha);margin-top:2px;">${preview}</div>
          </div>
          ${!n.read ? '<span style="width:6px;height:6px;border-radius:50%;background:#c47b42;flex-shrink:0;margin-top:6px;"></span>' : ''}
        </div>`;
    }).join('');
  }

  window.hcSelectNotif = function(id) {
    const notifs = _hcLoadStore();
    const n = notifs.find(x => x.id === id);
    if (!n) return;
    n.read = true;
    _hcSelectedNotifId = id;
    _hcSaveStore(notifs);
    _hcUpdateBadge(notifs);
    _hcRenderNotifList(notifs);

    const detail = document.getElementById('notifDetailPanel');
    if (!detail) return;

    if (n.type === 'approval' && n.userId) {
      detail.innerHTML = `
        <div style="padding:1rem;">
          <h4 style="margin-bottom:0.5rem;color:var(--espresso);">${n.title}</h4>
          <p style="font-size:0.85rem;color:var(--mocha);margin-bottom:1rem;">${n.body}</p>
          <div style="display:flex;gap:0.5rem;">
            <button onclick="hcApproveUser(${n.userId},'${id}')" style="flex:1;padding:0.5rem;border:none;border-radius:6px;background:#16a34a;color:white;font-weight:600;cursor:pointer;">Approve</button>
            <button onclick="hcRejectUser(${n.userId},'${id}')" style="flex:1;padding:0.5rem;border:none;border-radius:6px;background:#dc2626;color:white;font-weight:600;cursor:pointer;">Reject</button>
          </div>
        </div>`;
    } else {
      detail.innerHTML = `
        <div style="padding:1rem;">
          <h4 style="margin-bottom:0.5rem;color:var(--espresso);">${n.title}</h4>
          <p style="font-size:0.85rem;color:var(--mocha);margin-bottom:0.75rem;">${n.body}</p>
          ${n.type === 'critical' || n.type === 'warning' ? '<a href="lowstock.html" style="font-size:0.8rem;color:#c47b42;font-weight:500;">Go to Low Stock Page →</a>' : ''}
        </div>`;
    }
  };

  window.hcApproveUser = async function(userId, notifId) {
    try {
      const res = await fetch(`${HC_API}/admin/approve/${userId}/`, { method: 'POST', headers: {'Content-Type':'application/json'} });
      if (res.ok) {
        const detail = document.getElementById('notifDetailPanel');
        if (detail) detail.innerHTML = '<div style="padding:2rem;text-align:center;color:#16a34a;font-weight:600;">✅ User Approved</div>';
        const notifs = _hcLoadStore();
        const idx = notifs.findIndex(n => n.id === notifId);
        if (idx >= 0) notifs.splice(idx, 1);
        _hcSaveStore(notifs);
        _hcRenderNotifList(notifs);
        _hcUpdateBadge(notifs);
      }
    } catch (e) { console.error('Approve error:', e); }
  };

  window.hcRejectUser = async function(userId, notifId) {
    try {
      const res = await fetch(`${HC_API}/admin/reject/${userId}/`, { method: 'POST', headers: {'Content-Type':'application/json'} });
      if (res.ok) {
        const detail = document.getElementById('notifDetailPanel');
        if (detail) detail.innerHTML = '<div style="padding:2rem;text-align:center;color:#dc2626;font-weight:600;">❌ User Rejected</div>';
        const notifs = _hcLoadStore();
        const idx = notifs.findIndex(n => n.id === notifId);
        if (idx >= 0) notifs.splice(idx, 1);
        _hcSaveStore(notifs);
        _hcRenderNotifList(notifs);
        _hcUpdateBadge(notifs);
      }
    } catch (e) { console.error('Reject error:', e); }
  };

  // Generate notifications from live stock data
  async function hcRefreshNotifications() {
    try {
      const res = await fetch(`${HC_API}/products/view/?page=1&limit=100`);
      if (!res.ok) return;
      const data = await res.json();
      const products = data.products || data.results || data;
      const notifs = _hcLoadStore();
      const existingIds = new Set(notifs.map(n => n.id));

      products.forEach(p => {
        if (p.stock <= 0) {
          const id = `stock_critical_${p.id}`;
          if (!existingIds.has(id)) {
            notifs.unshift({ id, type: 'critical', title: '🚨 Out of Stock', body: `${p.name} has 0 stock remaining. Restock immediately.`, read: false, ts: Date.now() });
          }
        } else if (p.stock <= (p.low_stock_threshold || 10)) {
          const id = `stock_low_${p.id}`;
          if (!existingIds.has(id)) {
            notifs.unshift({ id, type: 'warning', title: '⚠️ Low Stock Alert', body: `${p.name} has only ${p.stock} units left (threshold: ${p.low_stock_threshold || 10}).`, read: false, ts: Date.now() });
          }
        }
      });

      try {
        const approvalRes = await fetch(`${HC_API}/admin/pending/`);
        if (approvalRes.ok) {
          const pending = await approvalRes.json();
          (pending.results || pending || []).forEach(req => {
            const id = `approval_${req.id}`;
            if (!existingIds.has(id)) {
              notifs.unshift({ id, type: 'approval', title: '👤 Registration Request', body: `${req.username || 'A user'} has requested Admin access.`, read: false, ts: Date.now(), userId: req.user_id || req.id });
            }
          });
        }
      } catch {} // Silently fail for staff users

      _hcSaveStore(notifs);
      _hcUpdateBadge(notifs);
      _hcRenderNotifList(notifs);
    } catch (e) { console.warn('Notification refresh error:', e); }
  }

  // Bell toggle
  document.getElementById('notifBellBtn')?.addEventListener('click', () => {
    const dd = document.getElementById('notifDropdown');
    if (dd) dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('notifWrapper');
    const dd = document.getElementById('notifDropdown');
    if (dd && wrapper && !wrapper.contains(e.target)) dd.style.display = 'none';
  });
  // Mark all read
  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    const notifs = _hcLoadStore();
    notifs.forEach(n => n.read = true);
    _hcSaveStore(notifs);
    _hcUpdateBadge(notifs);
    _hcRenderNotifList(notifs);
  });
  // Clear all
  document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    _hcSaveStore([]);
    _hcUpdateBadge([]);
    _hcRenderNotifList([]);
    const detail = document.getElementById('notifDetailPanel');
    if (detail) detail.innerHTML = '<p style="color:var(--mocha);font-size:0.875rem;padding:1.25rem;">Select a notification to view details.</p>';
  });

  // Init notifications
  hcRefreshNotifications();
}

// ══════════════════════════════════════════════════════════════════
// 3. PRODUCT SEARCH with flyout dropdown + detail panel
//    Always init — no conflict with dashboard.js
// ══════════════════════════════════════════════════════════════════
let _hcSearchTimer = null;
let _hcSearchProducts = [];

function hcInitSearch() {
  const input = document.getElementById('headerSearchInput');
  const dropdown = document.getElementById('headerSearchDropdown');
  const detailPanel = document.getElementById('headerSearchDetail');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    clearTimeout(_hcSearchTimer);
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) {
      dropdown.style.display = 'none';
      if (detailPanel) detailPanel.style.display = 'none';
      return;
    }
    _hcSearchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${HC_API}/products/view/?page=1&limit=50`);
        if (!res.ok) return;
        const data = await res.json();
        _hcSearchProducts = (data.products || data.results || data).filter(p =>
          p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
        );
        _hcRenderSearchDropdown(_hcSearchProducts);
      } catch (e) { console.warn('Search error:', e); }
    }, 300);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const searchWrap = document.getElementById('headerSearchWrap');
    if (searchWrap && !searchWrap.contains(e.target)) {
      dropdown.style.display = 'none';
      if (detailPanel) detailPanel.style.display = 'none';
    }
  });

  // Sort control
  document.getElementById('headerSearchSort')?.addEventListener('change', function() {
    const sort = this.value;
    let list = [..._hcSearchProducts];
    if (sort === 'name-asc')   list.sort((a,b) => a.name.localeCompare(b.name));
    if (sort === 'name-desc')  list.sort((a,b) => b.name.localeCompare(a.name));
    if (sort === 'price-asc')  list.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
    if (sort === 'price-desc') list.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
    if (sort === 'stock-asc')  list.sort((a,b) => a.stock - b.stock);
    if (sort === 'stock-desc') list.sort((a,b) => b.stock - a.stock);
    _hcRenderSearchDropdown(list);
  });
}

function _hcRenderSearchDropdown(products) {
  const dropdown = document.getElementById('headerSearchDropdown');
  if (!dropdown) return;

  if (!products.length) {
    dropdown.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--mocha);font-size:0.85rem;">No products found</div>';
    dropdown.style.display = 'block';
    return;
  }

  const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=80';
  dropdown.innerHTML = products.map(p => {
    const statusCls = p.stock <= 0 ? 'color:#dc2626' : p.stock <= (p.low_stock_threshold||10) ? 'color:#f59e0b' : 'color:#16a34a';
    const statusTxt = p.stock <= 0 ? 'Out of Stock' : p.stock <= (p.low_stock_threshold||10) ? 'Low Stock' : 'In Stock';
    const img = p.image_url || fallback;
    return `
      <div onclick="hcShowSearchDetail(${p.id})" style="display:flex;align-items:center;gap:0.75rem;padding:0.625rem 0.875rem;cursor:pointer;border-bottom:1px solid rgba(225,200,178,0.15);transition:background 0.12s;" onmouseover="this.style.background='rgba(196,123,66,0.08)'" onmouseout="this.style.background='transparent'">
        <img src="${img}" alt="${p.name}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;border:1px solid rgba(225,200,178,0.3);" onerror="this.src='${fallback}'" />
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:0.8rem;color:var(--espresso);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:0.7rem;color:var(--mocha);">${p.category || ''} · <span style="${statusCls};font-weight:500;">${statusTxt}</span></div>
        </div>
        <div style="font-weight:700;font-size:0.8rem;color:#c47b42;white-space:nowrap;">₱${parseFloat(p.price).toFixed(2)}</div>
      </div>`;
  }).join('');
  dropdown.style.display = 'block';
}

window.hcShowSearchDetail = async function(productId) {
  const detailPanel = document.getElementById('headerSearchDetail');
  if (!detailPanel) return;

  try {
    const res = await fetch(`${HC_API}/products/${productId}/`);
    if (!res.ok) return;
    const p = await res.json();
    const fallback = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400';
    const img = p.image_url || fallback;
    const statusCls = p.stock <= 0 ? '#dc2626' : p.stock <= (p.low_stock_threshold||10) ? '#f59e0b' : '#16a34a';
    const statusTxt = p.stock <= 0 ? 'Out of Stock' : p.stock <= (p.low_stock_threshold||10) ? 'Low Stock' : 'In Stock';

    detailPanel.innerHTML = `
      <div style="display:flex;gap:1.25rem;padding:1rem;align-items:flex-start;">
        <img src="${img}" alt="${p.name}" style="width:100px;height:100px;border-radius:10px;object-fit:cover;border:2px solid var(--latte);flex-shrink:0;" onerror="this.src='${fallback}'" />
        <div style="flex:1;min-width:0;">
          <h3 style="font-size:1rem;font-weight:700;color:var(--espresso);margin-bottom:4px;">${p.name}</h3>
          <div style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.7rem;font-weight:600;background:${statusCls}22;color:${statusCls};margin-bottom:8px;">${statusTxt}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem;">
            <div><span style="color:var(--mocha);">Category:</span> <strong>${p.category || '—'}</strong></div>
            <div><span style="color:var(--mocha);">Price:</span> <strong style="color:#c47b42;">₱${parseFloat(p.price).toFixed(2)}</strong></div>
            <div><span style="color:var(--mocha);">Cost:</span> <strong>₱${parseFloat(p.cost || 0).toFixed(2)}</strong></div>
            <div><span style="color:var(--mocha);">Stock:</span> <strong>${p.stock} ${p.unit || 'pcs'}</strong></div>
            <div><span style="color:var(--mocha);">Threshold:</span> <strong>${p.low_stock_threshold || 10}</strong></div>
            <div><span style="color:var(--mocha);">Margin:</span> <strong>${p.price > 0 ? (((p.price - (p.cost||0)) / p.price) * 100).toFixed(1) : 0}%</strong></div>
          </div>
          ${p.description ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--mocha);line-height:1.4;">${p.description}</div>` : ''}
        </div>
        <button onclick="document.getElementById('headerSearchDetail').style.display='none'" style="border:none;background:none;cursor:pointer;color:var(--mocha);font-size:1.2rem;padding:0;line-height:1;">✕</button>
      </div>`;
    detailPanel.style.display = 'block';
  } catch (e) { console.warn('Detail fetch error:', e); }
};

// Init search on load
document.addEventListener('DOMContentLoaded', () => hcInitSearch());

// Re-init Lucide icons
if (typeof lucide !== 'undefined') lucide.createIcons();
