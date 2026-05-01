// ─────────────────────────────────────────────────────────────
// Activity Logs — Frontend JS
// Haneus Cafe POS
// ─────────────────────────────────────────────────────────────

lucide.createIcons();

const API_BASE = "http://127.0.0.1:8000/api";

// State
let alCurrentPage = 1;
let alDebounceTimer = null;

// ── Load stats ───────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/activity-logs/stats/`);
    if (!res.ok) return;
    const data = await res.json();
    const el = (id) => document.getElementById(id);
    if (el("statTotal")) el("statTotal").textContent = data.total_logs.toLocaleString();
    if (el("statToday")) el("statToday").textContent = data.today_count.toLocaleString();
    if (el("statWeek")) el("statWeek").textContent = data.this_week_count.toLocaleString();
  } catch (e) {
    console.error("Stats load failed:", e);
  }
}

// ── Load logs ────────────────────────────────────────────────
async function loadLogs(page) {
  page = page || 1;
  alCurrentPage = page;

  const action = document.getElementById("alFilterAction")?.value || "";
  const target = document.getElementById("alFilterTarget")?.value || "";
  const search = document.getElementById("alSearch")?.value || "";

  const params = new URLSearchParams({ page, per_page: 25 });
  if (action) params.set("action", action);
  if (target) params.set("target_type", target);
  if (search) params.set("search", search);

  const tbody = document.getElementById("alTableBody");
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--mocha);">Loading...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/activity-logs/?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderLogs(data.logs);
    renderPagination(data);
  } catch (e) {
    console.error("Logs load failed:", e);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#b91c1c;">Failed to load logs.</td></tr>';
    }
  }
}

// ── Render table rows ────────────────────────────────────────
function renderLogs(logs) {
  const tbody = document.getElementById("alTableBody");
  if (!tbody) return;

  if (!logs || !logs.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="al-empty">
          <div class="al-empty-icon">📋</div>
          <p class="al-empty-text">No activity logs found.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(function(log) {
    var ts = new Date(log.timestamp);
    var dateStr = ts.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    var timeStr = ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    var actionClass = "al-badge al-badge-" + log.action.toLowerCase();

    return '<tr>' +
      '<td class="al-timestamp">' + dateStr + '<br><span style="font-size:0.7rem;opacity:0.7;">' + timeStr + '</span></td>' +
      '<td style="font-weight:500;">' + log.user_name + '</td>' +
      '<td><span class="' + actionClass + '">' + log.action + '</span></td>' +
      '<td><span class="al-type-pill">' + log.target_type + '</span></td>' +
      '<td class="al-desc" title="' + (log.description || '').replace(/"/g, '&quot;') + '">' + log.description + '</td>' +
      '<td class="al-ip">' + (log.ip_address || '—') + '</td>' +
    '</tr>';
  }).join('');
}

// ── Render pagination ────────────────────────────────────────
function renderPagination(data) {
  var container = document.getElementById("alPagination");
  if (!container) return;

  var totalPages = data.total_pages || 1;
  var page = data.page || 1;

  if (totalPages <= 1) {
    container.innerHTML = '<span class="al-page-info">Showing ' + data.logs.length + ' of ' + data.total + ' logs</span>';
    return;
  }

  var html = '';
  html += '<button class="al-page-btn" onclick="loadLogs(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>&laquo; Prev</button>';

  // Show max 5 page buttons around current
  var start = Math.max(1, page - 2);
  var end = Math.min(totalPages, page + 2);
  if (start > 1) html += '<button class="al-page-btn" onclick="loadLogs(1)">1</button>';
  if (start > 2) html += '<span class="al-page-info">…</span>';

  for (var i = start; i <= end; i++) {
    html += '<button class="al-page-btn' + (i === page ? ' active' : '') + '" onclick="loadLogs(' + i + ')">' + i + '</button>';
  }

  if (end < totalPages - 1) html += '<span class="al-page-info">…</span>';
  if (end < totalPages) html += '<button class="al-page-btn" onclick="loadLogs(' + totalPages + ')">' + totalPages + '</button>';

  html += '<button class="al-page-btn" onclick="loadLogs(' + (page + 1) + ')" ' + (page >= totalPages ? 'disabled' : '') + '>Next &raquo;</button>';
  html += '<span class="al-page-info">Page ' + page + ' of ' + totalPages + ' (' + data.total + ' total)</span>';

  container.innerHTML = html;
}

// ── Filters ──────────────────────────────────────────────────
document.getElementById("alFilterAction")?.addEventListener("change", function() { loadLogs(1); });
document.getElementById("alFilterTarget")?.addEventListener("change", function() { loadLogs(1); });
document.getElementById("alSearch")?.addEventListener("input", function() {
  clearTimeout(alDebounceTimer);
  alDebounceTimer = setTimeout(function() { loadLogs(1); }, 400);
});

// ── Init ─────────────────────────────────────────────────────
loadStats();
loadLogs(1);
