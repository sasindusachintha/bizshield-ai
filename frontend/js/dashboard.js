const boardContent = document.getElementById('board-content');
const resultCard = document.getElementById('calc-card');
const statsRoot = document.getElementById('dashboard-stats-root');
const activityRoot = document.getElementById('dashboard-activity-root');

// ── Dashboard statistics ────────────────────────────────
const STAT_CARDS = [
    { key: 'totalProjects',       label: 'Total Projects',        icon: 'fa-folder-open',          color: 'warning' },
    { key: 'totalIdeas',          label: 'Total Ideas',            icon: 'fa-lightbulb',             color: 'info' },
    { key: 'totalMarketingPlans', label: 'Total Marketing Plans',  icon: 'fa-bullhorn',              color: 'danger' },
    { key: 'totalMarketing',      label: 'Total Marketing',        icon: 'fa-rectangle-ad',          color: 'success' }
];

function renderStatsLoading() {
    if (!statsRoot) return;
    statsRoot.innerHTML = `
      <div class="row g-3">
        ${STAT_CARDS.map(() => `
          <div class="col-6 col-lg-3">
            <div class="card bg-dark border-secondary h-100">
              <div class="card-body text-center py-3">
                <div class="spinner-border spinner-border-sm text-muted" role="status"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
}

function renderStats(stats) {
    if (!statsRoot) return;

    statsRoot.innerHTML = `
      <div class="row g-3">
        ${STAT_CARDS.map(card => `
          <div class="col-6 col-lg-3">
            <div class="card bg-dark border-secondary h-100 hover-card">
              <div class="card-body text-center py-3">
                <div class="mb-2 fs-3 text-${card.color}"><i class="fas ${card.icon}"></i></div>
                <div class="fs-4 fw-bold">${escapeHTML(stats?.[card.key] ?? 0)}</div>
                <div class="text-muted small">${escapeHTML(card.label)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
}

async function loadDashboardStats() {
    if (!statsRoot) return;
    try {
        renderStatsLoading();
        const stats = await getDashboardStats();
        renderStats(stats);
    } catch (error) {
        statsRoot.innerHTML = `
          <div class="alert alert-secondary small mb-0">
            <i class="fas fa-circle-info me-1"></i>Sign in to see your project statistics.
          </div>
        `;
    }
}

// ── Recent activity feed ────────────────────────────────
const ACTIVITY_ICONS = {
    project: 'fa-folder-open',
    idea: 'fa-lightbulb',
    'market-analysis': 'fa-chart-line',
    swot: 'fa-grip',
    'marketing-plan': 'fa-bullhorn',
    'business-model': 'fa-route',
    'financial-forecast': 'fa-coins',
    'risk-assessment': 'fa-triangle-exclamation',
    'pitch-deck': 'fa-display'
};

const ACTIVITY_ACTION_LABELS = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted'
};

function formatActivityTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
}

function renderActivityItem(item) {
    const icon = ACTIVITY_ICONS[item.entityType] || 'fa-file';
    const actionLabel = ACTIVITY_ACTION_LABELS[item.action] || item.action;
    const subject = item.documentTitle || item.projectTitle || 'Untitled';
    const typeLabel = item.entityType === 'project' ? 'project' : item.entityType.replace(/-/g, ' ');

    return `
      <div class="d-flex align-items-start gap-3 py-2 border-bottom border-secondary">
        <div class="text-info pt-1"><i class="fas ${icon}"></i></div>
        <div class="flex-grow-1">
          <div class="small">
            <strong>${escapeHTML(subject)}</strong>
            <span class="text-muted">(${escapeHTML(typeLabel)})</span>
            was ${escapeHTML(actionLabel)}
          </div>
          ${item.projectTitle && item.documentTitle ? `<div class="text-muted small">in project: ${escapeHTML(item.projectTitle)}</div>` : ''}
        </div>
        <div class="text-muted small text-nowrap">${escapeHTML(formatActivityTime(item.createdAt))}</div>
      </div>
    `;
}

function renderActivity(activity) {
    if (!activityRoot) return;

    if (!Array.isArray(activity) || activity.length === 0) {
        activityRoot.innerHTML = `
          <div class="card bg-dark border-secondary">
            <div class="card-body">
              <h5 class="fw-bold mb-3"><i class="fas fa-clock-rotate-left text-info me-2"></i>Recent Activity</h5>
              <p class="text-muted small mb-0">No activity yet. Generate and save your first idea to get started.</p>
            </div>
          </div>
        `;
        return;
    }

    activityRoot.innerHTML = `
      <div class="card bg-dark border-secondary">
        <div class="card-body">
          <h5 class="fw-bold mb-3"><i class="fas fa-clock-rotate-left text-info me-2"></i>Recent Activity</h5>
          ${activity.map(renderActivityItem).join('')}
        </div>
      </div>
    `;
}

async function loadDashboardActivity() {
    if (!activityRoot) return;
    try {
        const response = await getDashboardActivity(10);
        renderActivity(response.activity);
    } catch (error) {
        activityRoot.innerHTML = '';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('bizshieldai-token') || localStorage.getItem('token');
    if (token) {
        loadDashboardStats();
        loadDashboardActivity();
    } else if (statsRoot) {
        statsRoot.innerHTML = `
          <div class="alert alert-secondary small mb-0">
            <i class="fas fa-circle-info me-1"></i>
            <a href="login.html" class="text-info">Log in</a> to see your project statistics and recent activity.
          </div>
        `;
    }
});


window.addEventListener('DOMContentLoaded', () => {
    if (!boardContent || !resultCard) return;
    const raw = sessionStorage.getItem('ai-analysis-result');

    if (!raw) {
        resultCard.classList.add('d-none');
        return;
    }

    try {
        resultCard.classList.remove('d-none');
        renderAIResult(JSON.parse(raw));
    } catch (err) {
        resultCard.classList.add('d-none');
        showError(boardContent, 'Unable to load the latest AI analysis result.');
    }
});

function renderAIResult(data) {
    const scoreValue = getFeasibilityScore(data);
    const cardRows = [];

    if (scoreValue !== null) {
        cardRows.push(`
          <div class="col-12 col-xl-4">
            <div class="card bg-dark border-secondary h-100 shadow-sm">
              <div class="card-body p-4">
                <h6 class="text-uppercase text-muted mb-3">AI Feasibility Score</h6>
                <div class="d-flex align-items-end gap-3">
                  <span class="display-4 fw-bold">${escapeHTML(scoreValue)}</span>
                  <span class="text-muted pb-1">/ 10</span>
                </div>
                ${data.feasibility_note ? `<p class="text-muted mt-3 mb-0">${escapeHTML(data.feasibility_note)}</p>` : ''}
              </div>
            </div>
          </div>
        `);
    }

    if (data.insights) {
        cardRows.push(`
          <div class="col-12 col-xl-4">
            <div class="card bg-dark border-secondary h-100 shadow-sm">
              <div class="card-body p-4">
                <h6 class="text-uppercase text-muted mb-3">AI Insights</h6>
                ${renderInsights(data.insights)}
              </div>
            </div>
          </div>
        `);
    }

    if (Array.isArray(data.ranking) && data.ranking.length) {
        cardRows.push(`
          <div class="col-12 col-xl-4">
            <div class="card bg-dark border-secondary h-100 shadow-sm">
              <div class="card-body p-4">
                <h6 class="text-uppercase text-muted mb-3">AI Ranking</h6>
                ${renderRanking(data.ranking)}
              </div>
            </div>
          </div>
        `);
    }

    if (!cardRows.length) {
        boardContent.innerHTML = `
          <div class="alert alert-info border-info mb-0">
            <div class="fw-semibold">No AI result widgets are available yet.</div>
            <div class="small">The backend response did not include feasibility, insights, or ranking data.</div>
          </div>
        `;
        return;
    }

    boardContent.innerHTML = `
      <div class="row g-4">
        ${cardRows.join('')}
      </div>
    `;
}

function getFeasibilityScore(data) {
    if (data.feasibility_score != null) return data.feasibility_score;
    if (data.feasibility && data.feasibility.score != null) return data.feasibility.score;
    if (data.score != null) return data.score;
    return null;
}

function renderInsights(insights) {
    if (typeof insights === 'string') {
        return `<p class="text-muted mb-0">${escapeHTML(insights)}</p>`;
    }

    if (Array.isArray(insights)) {
        return `
          <div class="d-flex flex-column gap-2">
            ${(insights || []).map(item => `<div class="text-muted small">• ${escapeHTML(item)}</div>`).join('')}
          </div>
        `;
    }

    if (typeof insights === 'object') {
        return `
          <div class="d-flex flex-column gap-2">
            ${Object.entries(insights || {}).map(([label, value]) => `<div class="text-muted small"><strong>${escapeHTML(label)}:</strong> ${escapeHTML(value)}</div>`).join('')}
          </div>
        `;
    }

    return `<p class="text-muted mb-0">No additional insights were available.</p>`;
}

function renderRanking(ranking) {
    const safeRanking = Array.isArray(ranking) ? ranking : [];
    const rows = (safeRanking || []).slice(0, 5).map(item => `
      <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-secondary">
        <div>
          <div class="fw-semibold">${escapeHTML(item.name || item.title || 'Untitled')}</div>
          <div class="text-muted small">Rank ${escapeHTML(item.rank ?? ranking.indexOf(item) + 1)}</div>
        </div>
        <div class="text-end text-info fw-semibold">${escapeHTML(item.score ?? item.rating ?? '—')}</div>
      </div>
    `).join('');

    return `
      <div class="d-flex flex-column gap-2">
        ${rows}
        ${ranking.length > 5 ? `<div class="text-muted small pt-2">Showing top 5 of ${ranking.length}</div>` : ''}
      </div>
    `;
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ── Personalized dashboard boot ─────────────────────────
(function initDashboardPersonalization() {
    window.addEventListener('DOMContentLoaded', () => {
        // Populate username in welcome banner
        const user = getAuthUser ? getAuthUser() : null;
        const nameEl = document.getElementById('dash-username');
        const currBadge = document.getElementById('dash-currency-badge');
        const langBadge = document.getElementById('dash-lang-badge');

        if (nameEl) {
            const firstName = user?.name ? user.name.split(' ')[0] : 'there';
            nameEl.textContent = firstName;
        }
        if (currBadge && user?.currency) {
            currBadge.innerHTML = `<i class="fas fa-coins me-1"></i>${user.currency}`;
        }
        if (langBadge && user?.language) {
            const langLabel = user.language === 'si' ? 'සිං' : 'EN';
            langBadge.innerHTML = `<i class="fas fa-globe me-1"></i>${langLabel}`;
        }

        // Listen for currency changes
        document.addEventListener('bizshield:currencyChange', (e) => {
            if (currBadge) currBadge.innerHTML = `<i class="fas fa-coins me-1"></i>${e.detail.currency}`;
        });
    });
})();
