/* ═══════════════════════════════════════════════════════════════════
   staffdashboard.js — Staff Dashboard Controller
   Tasks 1-6, 10 from TASK3_IMPLEMENTATION.md
   ═══════════════════════════════════════════════════════════════════ */

const API = 'http://localhost:8000/api';

// ── AbortController for request dedup (Task 3) ──
let _dashAbort = null;

// ── 75 Greeting Sentences (Task 4) — 15 per category ──
const GREETINGS = [
  // Greetings (15)
  "Hi <name>, here's what's happening with your store today.",
  "Hello <name>, welcome back! Let's see how the cafe is doing.",
  "Good to see you, <name>! Here's your daily snapshot.",
  "Hey <name>! Ready for another productive day?",
  "Welcome, <name>! Your store update is ready.",
  "Hi there, <name>! Let's check on today's progress.",
  "Hello <name>! Here's everything you need to know today.",
  "Hey <name>, glad you're here! Let's dive in.",
  "Hi <name>, your dashboard is all set for today.",
  "Welcome back, <name>! The cafe stats are updated.",
  "Greetings, <name>! Here's your morning briefing.",
  "Hi <name>! Hope you're having a great start.",
  "Hello <name>, all systems are go!",
  "Hey <name>, here's your store pulse today.",
  "Good day, <name>! Let's make it count.",
  // Asking (15)
  "How's it going, <name>? Here's your latest update.",
  "Ready to crush it today, <name>?",
  "What's the plan today, <name>? Here are your numbers.",
  "Curious about today's sales, <name>? Check this out.",
  "Wondering how the cafe's doing, <name>? Look no further.",
  "Got a minute, <name>? Here's what the numbers say.",
  "Need a quick overview, <name>? Here you go.",
  "What will today bring, <name>? Let's find out together.",
  "Looking for insights, <name>? Your dashboard has them.",
  "Want the latest scoop, <name>? It's all right here.",
  "How are we tracking, <name>? Check the stats below.",
  "Ready for some good news, <name>?",
  "Shall we review today's numbers, <name>?",
  "Want to see how far we've come, <name>?",
  "Interested in today's performance, <name>?",
  // Motivational (15)
  "Every sale counts, <name>! Keep pushing forward.",
  "You're doing amazing, <name>! The results speak for themselves.",
  "Stay focused, <name> — great things are happening!",
  "One step at a time, <name>. Progress is progress.",
  "Keep up the momentum, <name>! You're on fire.",
  "Your hard work is paying off, <name>!",
  "Today's a new opportunity, <name>. Let's make it great!",
  "Champions are made daily, <name>. Keep it up!",
  "Believe in the process, <name>. Success is near.",
  "Great day ahead, <name>! Let's exceed expectations.",
  "Stay consistent, <name>. Consistency wins every time.",
  "Push through, <name>! Every effort matters.",
  "You're making a difference, <name>. Keep going!",
  "Dream big, work hard, <name>. You've got this!",
  "The cafe is thriving because of you, <name>!",
  // Complimenting (15)
  "You're a rockstar, <name>! The numbers prove it.",
  "Impressive work, <name>! Keep setting the bar high.",
  "Look at those numbers, <name>! Outstanding performance.",
  "Exceptional effort, <name>! The team is lucky to have you.",
  "Fantastic job, <name>! Your dedication shines through.",
  "Top-notch work, <name>! You're truly making an impact.",
  "Well done, <name>! The cafe runs smoothly because of you.",
  "Kudos to you, <name>! Your work ethic is inspiring.",
  "Bravo, <name>! Another great day at Haneus Cafe.",
  "You're crushing it, <name>! Simply brilliant.",
  "Amazing results, <name>! You should be proud.",
  "Great leadership, <name>! The team looks up to you.",
  "Stellar performance, <name>! Keep leading by example.",
  "Outstanding, <name>! Your effort is noticed and appreciated.",
  "You make it look easy, <name>! What a talent.",
  // Excitement (15)
  "Let's gooo, <name>! Today's going to be awesome!",
  "Exciting times, <name>! The cafe is buzzing!",
  "What a day to be at Haneus Cafe, <name>!",
  "Can you feel the energy, <name>? Let's make it epic!",
  "The vibe is amazing today, <name>! Let's keep it up!",
  "It's showtime, <name>! Let's deliver our best!",
  "Buckle up, <name>! Today's loaded with potential!",
  "Energy is high, <name>! Let's channel it right!",
  "This is going to be a great day, <name>!",
  "Let's make today legendary, <name>!",
  "Feel the momentum, <name>! We're unstoppable!",
  "Fired up and ready, <name>! Let's do this!",
  "Today's the day, <name>! Something great awaits!",
  "Can't wait to see today's results, <name>!",
  "The stage is set, <name>! Time to shine!"
];

// ── Helpers ──────────────────────────────────────────────────────────

function getFirstName() {
  try {
    const u = JSON.parse(localStorage.getItem('user'));
    return u?.first_name || u?.username || 'Staff';
  } catch { return 'Staff'; }
}

function getRandomGreeting() {
  const name = getFirstName();
  const idx = Math.floor(Math.random() * GREETINGS.length);
  return GREETINGS[idx].replace('<name>', name);
}

// ── Typing Animation Engine ─────────────────────────────────────────
let _typingActive = false;
let _typingIndex = -1;

function startTypingAnimation(el) {
  if (_typingActive) return;
  _typingActive = true;
  _typingIndex = Math.floor(Math.random() * GREETINGS.length);
  _typeNext(el);
}

function _typeNext(el) {
  if (!_typingActive) return;
  // Pick next greeting (avoid repeating same)
  let idx;
  do { idx = Math.floor(Math.random() * GREETINGS.length); } while (idx === _typingIndex && GREETINGS.length > 1);
  _typingIndex = idx;
  const name = getFirstName();
  const fullText = GREETINGS[idx].replace('<name>', name);
  _typeForward(el, fullText, 0);
}

function _typeForward(el, text, pos) {
  if (!_typingActive) return;
  if (pos <= text.length) {
    el.textContent = text.substring(0, pos);
    setTimeout(() => _typeForward(el, text, pos + 1), 40);
  } else {
    // Hold complete text for 2 seconds, then start erasing
    setTimeout(() => _typeBackward(el, text, text.length), 2000);
  }
}

function _typeBackward(el, text, pos) {
  if (!_typingActive) return;
  if (pos >= 0) {
    el.textContent = text.substring(0, pos);
    setTimeout(() => _typeBackward(el, text, pos - 1), 25);
  } else {
    // Short pause then type next greeting
    setTimeout(() => _typeNext(el), 400);
  }
}

function fmt(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Date helpers (Monday-Sunday alignment) ──
function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}
function getSunday(d) {
  const mon = getMonday(d);
  mon.setDate(mon.getDate() + 6);
  return mon;
}
function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════
//  INIT ON PAGE LOAD
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Task 4 — Dynamic greeting with typing animation
  const greetEl = document.getElementById('dashGreetingH2') || document.querySelector('.dash-greeting-text h2');
  if (greetEl) {
    greetEl.classList.add('typing-cursor');
    greetEl.textContent = '';
    // Small delay to ensure page is visually ready
    setTimeout(() => startTypingAnimation(greetEl), 200);
  }

  // Task 1 — Date range (Monday–Sunday)
  const dateBtn = document.querySelector('.dash-date-btn span');
  if (dateBtn) {
    const mon = getMonday(new Date());
    const sun = getSunday(new Date());
    dateBtn.textContent = `${fmtDate(mon)} - ${fmtDate(sun)}`;
  }

  // Task 2 — Remove up-arrow indicator
  const growth = document.querySelector('.dash-stat-growth');
  if (growth) growth.style.display = 'none';

  // Task 1 — Date button click → analytics modal
  const dateBtnEl = document.querySelector('.dash-date-btn');
  if (dateBtnEl) {
    dateBtnEl.addEventListener('click', () => openAnalyticsModal());
  }

  // Task 3 — Refresh button
  const refreshBtn = document.querySelector('.dash-icon-btn[aria-label="Refresh"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadStaffDashboard());
  }

  // Collapse button (chevron-up) — hide for now
  const collapseBtn = document.querySelector('.dash-icon-btn[aria-label="Collapse"]');
  if (collapseBtn) collapseBtn.style.display = 'none';

  // Task 6 — View All buttons
  const viewAllBtns = document.querySelectorAll('.dash-view-all-btn');
  viewAllBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.dash-panel');
      if (panel?.classList.contains('dash-best-seller')) {
        openBestSellerModal();
      } else if (panel?.classList.contains('dash-transactions')) {
        openTransactionsModal();
      }
    });
  });

  // Initial load
  loadStaffDashboard();

  // Lucide icons init (safe)
  if (typeof lucide !== 'undefined') {
    try { lucide.createIcons(); } catch {}
  }
});

// ═══════════════════════════════════════════════════════════════════
//  MAIN DATA LOAD (Tasks 5, 6)
// ═══════════════════════════════════════════════════════════════════

async function loadStaffDashboard() {
  // AbortController — cancel previous (Task 3)
  if (_dashAbort) _dashAbort.abort();
  _dashAbort = new AbortController();

  try {
    const res = await fetch(`${API}/staff/dashboard/`, { signal: _dashAbort.signal });
    const data = await res.json();

    // ── Task 1 — Update date range ──
    const dateBtn = document.querySelector('.dash-date-btn span');
    if (dateBtn && data.week_start && data.week_end) {
      dateBtn.textContent = `${data.week_start} - ${data.week_end}`;
    }

    // ── Task 5 — Weekly Earning ──
    const earningEl = document.querySelector('.dash-stat-earnings .dash-stat-value');
    if (earningEl) earningEl.textContent = fmt(data.weekly_earning);

    // ── Task 5 — Growth % ──
    const growthEl = document.querySelector('.dash-stat-earnings .dash-stat-growth');
    if (growthEl) {
      const g = data.growth_pct || 0;
      const sign = g >= 0 ? '+' : '';
      growthEl.innerHTML = `${sign}${g}% <span>vs Last Week</span>`;
      growthEl.style.display = '';
      growthEl.style.color = g >= 0 ? '#22c55e' : '#ef4444';
    }

    // ── Task 6 — Total Sales count ──
    const totalEl = document.querySelectorAll('.dash-stat-card')[1];
    if (totalEl) {
      totalEl.querySelector('.dash-mini-number').textContent = data.total_sales_count;
    }

    // ── Task 6 — Today's Sales count ──
    const todayEl = document.querySelectorAll('.dash-stat-card')[2];
    if (todayEl) {
      todayEl.querySelector('.dash-mini-number').textContent = data.todays_sales_count;
    }

    // ── Task 6 — Best Seller list ──
    renderBestSellers(data.best_sellers || []);

    // ── Task 6 — Recent Transactions ──
    renderRecentTransactions(data.recent_transactions || []);

    // Re-init Lucide icons for any dynamic content
    if (typeof lucide !== 'undefined') {
      try { lucide.createIcons(); } catch {}
    }

  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('Staff dashboard load error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  BEST SELLER RENDER (Task 6)
// ═══════════════════════════════════════════════════════════════════

function renderBestSellers(items) {
  const container = document.querySelector('.dash-best-list');
  if (!container) return;

  // Show max 6, hide View All if <= 6
  const show = items.slice(0, 6);
  const viewAllBtn = container.closest('.dash-panel')?.querySelector('.dash-view-all-btn');
  if (viewAllBtn) viewAllBtn.style.display = items.length > 6 ? '' : 'none';

  if (show.length === 0) {
    container.innerHTML = '<p style="color:var(--mocha);padding:1rem;font-size:0.875rem;">No sales data yet.</p>';
    return;
  }

  container.innerHTML = show.map(item => {
    const imgSrc = item.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80';
    return `
    <div class="dash-best-item">
      <img src="${imgSrc}" alt="${item.product_name}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80'">
      <div class="dash-best-info">
        <div class="dash-best-name">${item.product_name}</div>
        <div class="dash-best-price">${fmt(item.total_revenue)}</div>
      </div>
      <div class="dash-best-sales">
        <span>Sales</span>
        <strong>${item.total_quantity}</strong>
      </div>
    </div>
  `}).join('');

  // Store full list for modal
  window._allBestSellers = items;
}

// ═══════════════════════════════════════════════════════════════════
//  RECENT TRANSACTIONS RENDER (Task 6)
// ═══════════════════════════════════════════════════════════════════

function renderRecentTransactions(items) {
  const tbody = document.querySelector('.dash-table tbody');
  if (!tbody) return;

  const show = items.slice(0, 5);
  const viewAllBtn = document.querySelector('.dash-transactions .dash-view-all-btn');
  if (viewAllBtn) viewAllBtn.style.display = items.length > 5 ? '' : 'none';

  if (show.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:1rem;color:var(--mocha);">No transactions yet.</td></tr>';
    return;
  }

  tbody.innerHTML = show.map((tx, idx) => {
    const badge = tx.status === 'Completed' ? 'success' : tx.status === 'Cancelled' ? 'cancelled' : 'pending';
    const d = tx.date ? new Date(tx.date) : new Date();
    const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
    const timeStr = mins < 60 ? `${mins} Mins` : `${Math.floor(mins/60)}h ago`;
        const imgSrc = tx.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80';
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <div class="dash-order-cell">
            <img src="${imgSrc}" alt="${tx.product_name}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80'">
            <div>
              <div class="dash-order-name">${tx.product_name || tx.order_id}</div>
              <div class="dash-order-time"><i data-lucide="clock-3"></i> ${timeStr}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="dash-payment-method">Sale</div>
          <a href="#" class="dash-payment-ref">#${tx.order_id}</a>
        </td>
        <td><span class="dash-badge ${badge}">● ${tx.status}</span></td>
        <td class="dash-amount">${fmt(tx.total)}</td>
      </tr>
    `;
  }).join('');

  // Store full list for modal
  window._allTransactions = items;
}

// ═══════════════════════════════════════════════════════════════════
//  MODALS — Best Seller View All (Task 6)
// ═══════════════════════════════════════════════════════════════════

function openBestSellerModal() {
  const items = window._allBestSellers || [];
  const show = items.slice(0, 25);
  let modal = document.getElementById('bestSellerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'bestSellerModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="floating-card" style="max-width:600px;max-height:80vh;">
      <div class="floating-card-header">
        <h2>Top ${show.length} Best Sellers</h2>
        <button class="floating-card-close" onclick="document.getElementById('bestSellerModal').style.display='none'" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="floating-card-body" style="max-height:65vh;overflow-y:auto;">
        <table class="dash-table" style="width:100%;">
          <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            ${show.map((item, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${item.product_name}</td>
                <td>${item.total_quantity}</td>
                <td>${fmt(item.total_revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  if (typeof lucide !== 'undefined') try { lucide.createIcons(); } catch {}
}

// ═══════════════════════════════════════════════════════════════════
//  MODALS — Transactions View All (Task 6)
// ═══════════════════════════════════════════════════════════════════

function openTransactionsModal() {
  const items = window._allTransactions || [];
  const show = items.slice(0, 30);
  let modal = document.getElementById('txnModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'txnModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="floating-card" style="max-width:700px;max-height:80vh;">
      <div class="floating-card-header">
        <h2>Recent Transactions (${show.length})</h2>
        <button class="floating-card-close" onclick="document.getElementById('txnModal').style.display='none'" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="floating-card-body" style="max-height:65vh;overflow-y:auto;">
        <table class="dash-table" style="width:100%;">
          <thead><tr><th>#</th><th>Order ID</th><th>Product</th><th>Status</th><th>Amount</th></tr></thead>
          <tbody>
            ${show.map((tx, i) => {
              const badge = tx.status === 'Completed' ? 'success' : tx.status === 'Cancelled' ? 'cancelled' : 'pending';
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>#${tx.order_id}</td>
                  <td>${tx.product_name || '-'}</td>
                  <td><span class="dash-badge ${badge}">● ${tx.status}</span></td>
                  <td>${fmt(tx.total)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
  if (typeof lucide !== 'undefined') try { lucide.createIcons(); } catch {}
}

// ═══════════════════════════════════════════════════════════════════
//  ANALYTICS MODAL (Task 1, 10) — Date Click
// ═══════════════════════════════════════════════════════════════════

async function openAnalyticsModal(selectedDate) {
  const d = selectedDate || new Date().toISOString().split('T')[0];
  let modal = document.getElementById('analyticsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'analyticsModal';
    modal.className = 'modal-overlay';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="floating-card" style="max-width:500px;">
      <div class="floating-card-header">
        <h2>Weekly Analytics</h2>
        <button class="floating-card-close" onclick="document.getElementById('analyticsModal').style.display='none'" aria-label="Close">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="floating-card-body" style="padding:1.5rem;">
        <div style="margin-bottom:1rem;">
          <label style="font-size:0.875rem;font-weight:500;color:#666;">Select Date:</label>
          <input type="date" id="analyticsDatePicker" value="${d}" style="padding:0.5rem;border:1px solid #ddd;border-radius:6px;width:100%;margin-top:0.25rem;" />
        </div>
        <div id="analyticsContent" style="color:var(--mocha);padding:1rem 0;">Loading...</div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  // Load data
  await loadAnalyticsForDate(d);

  // Listen for date change
  document.getElementById('analyticsDatePicker')?.addEventListener('change', async (e) => {
    await loadAnalyticsForDate(e.target.value);
  });

  if (typeof lucide !== 'undefined') try { lucide.createIcons(); } catch {}
}

async function loadAnalyticsForDate(dateStr) {
  const content = document.getElementById('analyticsContent');
  if (!content) return;
  content.innerHTML = '<p style="color:var(--mocha);">Loading...</p>';

  try {
    const res = await fetch(`${API}/staff/dashboard/analytics/?date=${dateStr}`);
    const data = await res.json();
    const g = data.growth_pct || 0;
    const sign = g >= 0 ? '+' : '';
    const gColor = g >= 0 ? '#22c55e' : '#ef4444';

    content.innerHTML = `
      <div style="display:grid;gap:1rem;">
        <div style="background:#f8f4ef;border-radius:10px;padding:1rem;">
          <div style="font-size:0.8rem;color:#888;margin-bottom:0.25rem;">Week</div>
          <div style="font-weight:600;">${data.week_start} — ${data.week_end}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div style="background:#f8f4ef;border-radius:10px;padding:1rem;">
            <div style="font-size:0.8rem;color:#888;">Weekly Earning</div>
            <div style="font-size:1.25rem;font-weight:700;">${fmt(data.weekly_earning)}</div>
          </div>
          <div style="background:#f8f4ef;border-radius:10px;padding:1rem;">
            <div style="font-size:0.8rem;color:#888;">Growth</div>
            <div style="font-size:1.25rem;font-weight:700;color:${gColor};">${sign}${g}%</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div style="background:#f8f4ef;border-radius:10px;padding:1rem;">
            <div style="font-size:0.8rem;color:#888;">Total Sales (All-Time)</div>
            <div style="font-size:1.25rem;font-weight:700;">${data.total_sales_count}</div>
          </div>
          <div style="background:#f8f4ef;border-radius:10px;padding:1rem;">
            <div style="font-size:0.8rem;color:#888;">Sales on This Day</div>
            <div style="font-size:1.25rem;font-weight:700;">${data.todays_sales_count}</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<p style="color:#dc2626;">Failed to load analytics.</p>';
    console.error('Analytics error:', err);
  }
}

// -- AJAX Auto-Refresh -----------------------------------------
if (typeof startAutoRefresh === 'function') {
  startAutoRefresh(() => loadStaffDashboard(), 15000, 'staff-dashboard');
}
