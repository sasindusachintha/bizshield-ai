const projectHeaderEl = document.getElementById('project-header');
const projectDocumentsEl = document.getElementById('project-documents');

const DOCUMENT_TYPE_META = {
  'idea':               { label: 'Ideas',               icon: 'fa-lightbulb',       color: 'warning' },
  'market-analysis':    { label: 'Market Analyses',     icon: 'fa-chart-line',      color: 'info' },
  'swot':               { label: 'SWOT Analyses',       icon: 'fa-grip',            color: 'primary' },
  'marketing-plan':     { label: 'Marketing Plans',     icon: 'fa-bullhorn',        color: 'danger' },
  'business-model':     { label: 'Business Plans',      icon: 'fa-route',           color: 'success' },
  'financial-forecast': { label: 'Financial Forecasts', icon: 'fa-coins',           color: 'secondary' },
  'risk-assessment':    { label: 'Risk Assessments',    icon: 'fa-triangle-exclamation', color: 'danger' },
  'pitch-deck':         { label: 'Pitch Decks',         icon: 'fa-display',         color: 'info' }
};

// Order in which document type sections are displayed
const DOCUMENT_TYPE_ORDER = [
  'idea', 'market-analysis', 'swot', 'business-model',
  'marketing-plan', 'financial-forecast', 'risk-assessment', 'pitch-deck'
];

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateTime(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function getProjectIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/** Copy text to clipboard with brief visual feedback (used by marketing kit cards). */
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.classList.replace('btn-outline-secondary', 'btn-success');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.replace('btn-success', 'btn-outline-secondary');
    }, 1500);
  });
}

function renderError(message) {
  if (projectHeaderEl) {
    projectHeaderEl.innerHTML = `
      <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
        <i class="fas fa-exclamation-circle"></i>
        <span><strong>Error:</strong> ${escapeHTML(message)}</span>
      </div>
    `;
  }
  if (projectDocumentsEl) projectDocumentsEl.innerHTML = '';
}

function renderLoading() {
  if (!projectHeaderEl) return;
  projectHeaderEl.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-warning mb-3" style="width:3rem;height:3rem" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted">Loading project…</p>
    </div>
  `;
}

function renderHeader(project) {
  if (!projectHeaderEl) return;

  const industry = project.industry ? escapeHTML(project.industry) : 'Industry not set';
  const stage = project.stage ? escapeHTML(project.stage) : 'ideation';

  projectHeaderEl.innerHTML = `
    <div class="card bg-dark border-secondary">
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <h2 class="fw-bold mb-0"><i class="fas fa-folder-open text-warning me-2"></i>${escapeHTML(project.title || 'Untitled project')}</h2>
          <span class="badge bg-primary text-capitalize fs-6">${stage}</span>
        </div>
        <div class="text-muted small mb-3">
          <i class="fas fa-industry me-1"></i>${industry}
          &nbsp;&middot;&nbsp;
          <i class="fas fa-calendar-plus me-1"></i>Created ${escapeHTML(formatDateTime(project.createdAt))}
          &nbsp;&middot;&nbsp;
          <i class="fas fa-clock me-1"></i>Updated ${escapeHTML(formatDateTime(project.updatedAt))}
        </div>
        ${project.description ? `<p class="mb-0">${escapeHTML(project.description)}</p>` : '<p class="text-muted mb-0">No description yet.</p>'}
      </div>
    </div>
  `;
}

// ── Shared small helpers (mirrors analysis.js / plan.js) ────────────

function renderList(items, icon = 'fa-check-circle', color = 'text-success') {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return '<p class="text-muted small mb-0">No data available.</p>';

  return `
    <ul class="list-unstyled mb-0 small">
      ${safeItems.map((item) => `
        <li class="mb-2">
          <i class="fas ${icon} ${color} me-2"></i>${escapeHTML(formatListItem(item))}
        </li>`).join('')}
    </ul>
  `;
}

function formatListItem(item) {
  if (item && typeof item === 'object') {
    return item.text || item.title || item.description || item.summary || item.action || JSON.stringify(item);
  }
  return item ?? '';
}

function asArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const cleaned = value.filter(item => item !== undefined && item !== null && String(formatListItem(item)).trim());
      if (cleaned.length) return cleaned;
      continue;
    }
    if (typeof value === 'string' && value.trim()) return [value.trim()];
  }
  return [];
}

function fallbackBusinessPlanPoints(content = {}) {
  const idea = content?.source_idea || 'this business';
  return {
    quickWins: [
      `Clarify the core offer for ${idea} in one sentence, including the customer problem, result promised, and first call to action.`,
      'Speak with at least 10 target customers and record their exact pain points, buying objections, and decision triggers.',
      'Create a simple landing page or pitch document with the offer, benefits, pricing anchor, and contact form.',
      'Publish proof-focused content showing the customer problem, the proposed solution, and a practical outcome.',
      'Run a small manual pilot before investing in complex automation or expensive tools.'
    ],
    firstCustomers: [
      'Start with warm contacts, local communities, LinkedIn connections, and niche groups where the problem is already visible.',
      'Offer a founding-customer package with direct support, fast onboarding, and a clear success milestone.',
      'Build a list of 50 high-fit prospects and reach out with a short message focused on one painful business outcome.',
      'Turn discovery calls into paid pilots by defining the customer goal, timeline, and decision maker.',
      'Use the first three customer results as testimonials, case studies, and referral triggers.'
    ],
    riskMitigation: [
      'Validate willingness to pay before building deeply by asking for deposits, pilot commitments, or signed intent.',
      'Keep fixed costs low until customer acquisition and delivery are repeatable.',
      'Track conversion rate, acquisition cost, support issues, churn signals, and delivery time every week.',
      'Document customer promises and delivery steps so expectations stay realistic.',
      'Prepare a backup acquisition channel in case the first outreach channel becomes expensive or unreliable.'
    ],
    criticalSuccessFactors: [
      'A narrow target customer with an urgent and expensive problem.',
      'A clear value proposition that can be understood in seconds.',
      'Fast learning from real buyers instead of internal assumptions.',
      'Consistent weekly outreach, follow-up, delivery, and measurement.',
      'Visible proof through testimonials, demos, pilot results, or case studies.'
    ],
  };
}

function renderDetail(label, value) {
  if (!value) return '';
  return `
    <div class="small mt-2">
      <span class="text-muted">${escapeHTML(label)}:</span>
      <span>${escapeHTML(value)}</span>
    </div>
  `;
}

function normalizeCostEstimate(costEstimate = {}) {
  const ce = costEstimate || {};
  return {
    minimum: ce.minimum || ce.minimum_startup || ce.bootstrap_cost || 'Not provided',
    recommended: ce.recommended || ce.recommended_startup || ce.optimal_cost || 'Not provided',
    breakdown: ce.breakdown || ce.detailed_breakdown || ce.cost_breakdown || [],
    breakEven: ce.break_even_months || ce.break_even || ce.break_even_timeline || '',
    projectedRevenue: ce.projected_monthly_revenue_start || ce.projected_monthly_revenue || '',
    paybackPeriod: ce.payback_period || ''
  };
}

function formatBreakEven(value) {
  if (!value) return '';
  return typeof value === 'number' ? `${value} months` : String(value);
}

/** Small "based on this idea" caption shown above generated documents, if present. */
function renderSourceIdeaCaption(content) {
  const sourceIdea = content?.source_idea;
  if (!sourceIdea) return '';
  return `
    <div class="bg-secondary bg-opacity-25 border border-secondary rounded p-2 small mb-3">
      <span class="text-info fw-semibold"><i class="fas fa-lightbulb me-1"></i>Based on idea:</span>
      <span class="text-muted" style="white-space:pre-wrap">${escapeHTML(sourceIdea)}</span>
    </div>
  `;
}

// ── Type-specific renderers ──────────────────────────────────────────

/** type: "idea" — content: { description, score } */
function renderIdeaContent(content) {
  const description = content?.description || 'No description available.';
  const score = content?.score;

  return `
    <p class="small mb-2" style="white-space:pre-wrap">${escapeHTML(description)}</p>
    ${score != null ? `<span class="badge bg-warning text-dark"><i class="fas fa-star me-1"></i>Score: ${escapeHTML(score)}/10</span>` : ''}
  `;
}

/** type: "market-analysis" — same shape produced by /api/growth/analyze-idea */
function renderMarketAnalysisContent(content) {
  const normalizedCost = normalizeCostEstimate(content?.cost_estimate);
  const fallbackRisks = [
    'Demand may be weaker than expected unless validated with real buyer conversations and pilot commitments.',
    'Customer acquisition costs may rise if the target audience is too broad or messaging is unclear.',
    'Competitors or substitutes may already own trust unless the offer has a sharp and provable differentiation.',
    'Operational delivery may become inconsistent if the first version relies on manual founder effort without documented processes.',
    'Cash flow can tighten if launch spending happens before revenue channels are proven.'
  ];
  const d = {
    demand: content?.demand || { score: 0, summary: 'No data' },
    competition: content?.competition || { level: 'Unknown', score: 0, summary: 'No data' },
    risk: {
      ...(content?.risk || { level: 'Unknown' }),
      top_risks: asArray(content?.risk?.top_risks, content?.risk?.risks, fallbackRisks)
    },
    cost_estimate: normalizedCost
  };

  const levelColor = { Low: 'success', Medium: 'warning', High: 'danger' };
  const riskCol = levelColor[d.risk.level] || 'secondary';
  const compCol = levelColor[d.competition.level] || 'secondary';

  return `
    ${renderSourceIdeaCaption(content)}
    <div class="row g-3">

      <!-- Demand -->
      <div class="col-md-6">
        <div class="border border-secondary rounded h-100 p-3">
          <h6 class="fw-bold text-primary mb-2"><i class="fas fa-chart-line me-2"></i>Market Demand</h6>
          <div class="d-flex align-items-end mb-2">
            <span class="display-6 fw-bold me-1">${escapeHTML(d.demand.score)}</span>
            <span class="text-muted mb-1">/10</span>
          </div>
          <div class="progress mb-2" style="height:6px">
            <div class="progress-bar bg-primary" style="width:${(d.demand.score || 0) * 10}%"></div>
          </div>
          <p class="text-muted small mb-0">${escapeHTML(d.demand.summary)}</p>
        </div>
      </div>

      <!-- Competition -->
      <div class="col-md-6">
        <div class="border border-secondary rounded h-100 p-3">
          <h6 class="fw-bold text-warning mb-2"><i class="fas fa-users me-2"></i>Competition</h6>
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-${compCol}">${escapeHTML(d.competition.level)}</span>
            <span class="text-muted small">Score: ${escapeHTML(d.competition.score)}/10</span>
          </div>
          <div class="progress mb-2" style="height:6px">
            <div class="progress-bar bg-warning" style="width:${(d.competition.score || 0) * 10}%"></div>
          </div>
          <p class="text-muted small mb-0">${escapeHTML(d.competition.summary)}</p>
        </div>
      </div>

      <!-- Risk -->
      <div class="col-md-6">
        <div class="border border-secondary rounded h-100 p-3">
          <h6 class="fw-bold text-danger mb-2"><i class="fas fa-exclamation-triangle me-2"></i>Risk Assessment</h6>
          <span class="badge bg-${riskCol} mb-2">${escapeHTML(d.risk.level)} Risk</span>
          ${renderList(d.risk.top_risks, 'fa-minus-circle', 'text-danger')}
        </div>
      </div>

      <!-- Cost Estimate -->
      <div class="col-md-6">
        <div class="border border-secondary rounded h-100 p-3">
          <h6 class="fw-bold text-success mb-2"><i class="fas fa-dollar-sign me-2"></i>Cost Estimate</h6>
          <div class="d-flex justify-content-between border-bottom border-secondary pb-1 mb-1 small">
            <span class="text-muted">Minimum startup</span>
            <strong class="text-success">${escapeHTML(d.cost_estimate.minimum)}</strong>
          </div>
          <div class="d-flex justify-content-between border-bottom border-secondary pb-1 mb-2 small">
            <span class="text-muted">Recommended</span>
            <strong class="text-info">${escapeHTML(d.cost_estimate.recommended)}</strong>
          </div>
          ${d.cost_estimate.breakEven ? `
            <div class="d-flex justify-content-between small mb-1">
              <span class="text-muted">Break-even</span>
              <strong>${escapeHTML(formatBreakEven(d.cost_estimate.breakEven))}</strong>
            </div>` : ''}
          ${d.cost_estimate.projectedRevenue ? `
            <div class="d-flex justify-content-between small mb-1">
              <span class="text-muted">Early monthly revenue</span>
              <strong>${escapeHTML(d.cost_estimate.projectedRevenue)}</strong>
            </div>` : ''}
          ${d.cost_estimate.paybackPeriod ? `
            <div class="d-flex justify-content-between small mb-2">
              <span class="text-muted">Payback period</span>
              <strong>${escapeHTML(d.cost_estimate.paybackPeriod)}</strong>
            </div>` : ''}
          ${(d.cost_estimate.breakdown || []).length ? `
            <h6 class="text-muted small mt-2 mb-1">Breakdown</h6>
            ${renderList(d.cost_estimate.breakdown, 'fa-circle', 'text-muted')}
          ` : ''}
        </div>
      </div>

    </div>
  `;
}

/** type: "business-model" — same shape produced by /api/growth/generate-plan */
function renderBusinessModelContent(content) {
  const fallback = fallbackBusinessPlanPoints(content);
  const quickWins = asArray(content?.quickWins, content?.quick_wins, fallback.quickWins);
  const firstCustomers = asArray(content?.firstCustomers, content?.first_customers, content?.first_customers_strategy, fallback.firstCustomers);
  const riskMitigation = asArray(content?.riskMitigation, content?.risk_mitigation, fallback.riskMitigation);
  const criticalSuccessFactors = asArray(content?.criticalSuccessFactors, content?.critical_success_factors, fallback.criticalSuccessFactors);
  const plan = {
    setup_steps: content?.setup_steps || [],
    plan_7_day: content?.plan_7_day || [],
    plan_30_day: content?.plan_30_day || [],
    quickWins,
    firstCustomers,
    riskMitigation,
    criticalSuccessFactors,
    quick_wins: quickWins,
    critical_success_factors: criticalSuccessFactors,
    risk_mitigation: riskMitigation.join(' '),
    first_customers_strategy: firstCustomers.join(' '),
    success_tips: content?.success_tips || [],
    weekly_progress_template: content?.weekly_progress_template || null
  };

  const weeklyTemplate = plan.weekly_progress_template && typeof plan.weekly_progress_template === 'object'
    ? Object.entries(plan.weekly_progress_template)
    : [];

  return `
    ${renderSourceIdeaCaption(content)}

    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <div class="border border-success rounded h-100 p-3">
          <h6 class="fw-bold text-success mb-2"><i class="fas fa-bolt me-2"></i>Quick Wins</h6>
          ${renderList(plan.quickWins, 'fa-bolt', 'text-warning')}
        </div>
      </div>
      <div class="col-md-6">
        <div class="border border-info rounded h-100 p-3">
          <h6 class="fw-bold text-info mb-2"><i class="fas fa-users me-2"></i>First Customers Strategy</h6>
          ${renderList(plan.firstCustomers, 'fa-user-plus', 'text-info')}
        </div>
      </div>
    </div>

    ${plan.setup_steps.length ? `
      <div class="mb-3">
        <h6 class="fw-bold mb-2"><i class="fas fa-list-ol text-warning me-2"></i>Setup Steps</h6>
        <div class="row g-2">
          ${plan.setup_steps.map((step) => `
            <div class="col-md-6">
              <div class="d-flex gap-2 p-2 border border-secondary rounded h-100 small">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:28px;height:28px;font-weight:700;font-size:.8rem">${escapeHTML(step.step)}</div>
                <div>
                  <div class="fw-semibold">${escapeHTML(step.title)}</div>
                  <div class="text-muted">${escapeHTML(step.description)}</div>
                  ${step.cost ? `<span class="badge bg-secondary mt-1">${escapeHTML(step.cost)}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${plan.plan_7_day.length ? `
      <div class="mb-3">
        <h6 class="fw-bold mb-2"><i class="fas fa-calendar-week text-info me-2"></i>7-Day Sprint</h6>
        <div class="row g-2">
          ${plan.plan_7_day.map((block) => `
            <div class="col-md-6">
              <div class="p-2 border border-secondary rounded small h-100">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <span class="badge bg-info text-dark">${escapeHTML(block.day)}</span>
                  <span class="fw-semibold">${escapeHTML(block.focus)}</span>
                </div>
                ${renderList(block?.tasks || [])}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${plan.plan_30_day.length ? `
      <div class="mb-3">
        <h6 class="fw-bold mb-2"><i class="fas fa-calendar-alt text-primary me-2"></i>30-Day Milestones</h6>
        <div class="row g-2">
          ${plan.plan_30_day.map((week) => `
            <div class="col-md-6 col-lg-3">
              <div class="p-2 border border-secondary rounded small h-100">
                <div class="badge bg-primary mb-1">${escapeHTML(week.week)}</div>
                <div class="fw-semibold mb-1">${escapeHTML(week.goal)}</div>
                ${renderList(week?.milestones || [], 'fa-flag', 'text-warning')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="row g-3 mb-3">
      <div class="col-lg-6">
        <div class="border border-danger rounded h-100 p-3">
          <h6 class="fw-bold text-danger mb-2"><i class="fas fa-shield-alt me-2"></i>Risk Mitigation</h6>
          ${renderList(plan.riskMitigation, 'fa-shield-alt', 'text-danger')}
        </div>
      </div>
      <div class="col-lg-6">
        <div class="border border-success rounded h-100 p-3">
          <h6 class="fw-bold text-success mb-2"><i class="fas fa-star me-2"></i>Critical Success Factors</h6>
          ${renderList(plan.criticalSuccessFactors, 'fa-star', 'text-success')}
        </div>
      </div>
    </div>

    ${(plan.success_tips.length || weeklyTemplate.length) ? `
      <div class="row g-3">
        ${plan.success_tips.length ? `
          <div class="col-lg-7">
            <div class="border border-success rounded h-100 p-3">
              <h6 class="fw-bold text-success mb-2"><i class="fas fa-lightbulb me-2"></i>Success Tips</h6>
              <div class="row g-2">
                ${plan.success_tips.map((tip) => `
                  <div class="col-md-6">
                    <div class="d-flex gap-2 p-2 border border-secondary rounded small h-100">
                      <i class="fas fa-lightbulb text-warning mt-1 flex-shrink-0"></i>
                      <span>${escapeHTML(tip)}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
        ${weeklyTemplate.length ? `
          <div class="col-lg-5">
            <div class="border border-secondary rounded h-100 p-3">
              <h6 class="fw-bold mb-2"><i class="fas fa-clipboard-check text-info me-2"></i>Weekly Progress Tracker</h6>
              <div class="d-flex flex-column gap-2">
                ${weeklyTemplate.map(([label, value]) => `
                  <div class="p-2 border border-secondary rounded small">
                    <div class="fw-semibold text-capitalize">${escapeHTML(label.replace(/_/g, ' '))}</div>
                    <div class="text-muted">${escapeHTML(value)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;
}

/** type: "marketing-plan" — same shape produced by /api/growth/marketing-content */
function renderMarketingPlanContent(content) {
  const d = {
    instagram_posts: content?.instagram_posts || [],
    ad_copies: content?.ad_copies || [],
    slogans: content?.slogans || [],
    captions: content?.captions || {}
  };

  const igPosts = d.instagram_posts.map((post, i) => `
    <div class="p-2 border border-secondary rounded mb-2 small">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <span class="badge bg-danger">Post ${i + 1}</span>
        <button class="btn btn-sm btn-outline-secondary"
          onclick="copyText(this.closest('.p-2').querySelector('.post-text').textContent, this)">
          <i class="fas fa-copy"></i>
        </button>
      </div>
      <p class="post-text mb-1">${escapeHTML(post?.caption || '')}</p>
      <div class="d-flex flex-wrap gap-1">
        ${(post?.hashtags || []).map((h) => `<span class="badge bg-secondary">${escapeHTML(h)}</span>`).join('')}
      </div>
    </div>
  `).join('') || '<p class="text-muted small mb-0">No Instagram posts provided.</p>';

  const adCopies = d.ad_copies.map((ad, i) => `
    <div class="p-2 border border-secondary rounded mb-2 small">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <span class="badge bg-primary">Ad ${i + 1}</span>
        <button class="btn btn-sm btn-outline-secondary"
          onclick="copyText(\`${escapeHTML(ad?.headline || '')}\\n${escapeHTML(ad?.body || '')}\\n${escapeHTML(ad?.cta || '')}\`, this)">
          <i class="fas fa-copy"></i>
        </button>
      </div>
      <div class="fw-bold mb-1">${escapeHTML(ad?.headline || '')}</div>
      <div class="text-muted mb-1">${escapeHTML(ad?.body || '')}</div>
      ${ad?.cta ? `<span class="badge bg-warning text-dark"><i class="fas fa-hand-pointer me-1"></i>${escapeHTML(ad.cta)}</span>` : ''}
    </div>
  `).join('') || '<p class="text-muted small mb-0">No ad copies provided.</p>';

  const slogans = d.slogans.length ? `
    <div class="row g-2">
      ${d.slogans.map((s) => `
        <div class="col-md-4">
          <div class="d-flex align-items-center justify-content-between p-2 border border-secondary rounded small">
            <span class="fst-italic">"${escapeHTML(s)}"</span>
            <button class="btn btn-sm btn-outline-secondary ms-2 flex-shrink-0"
              onclick="copyText('${escapeHTML(s).replace(/'/g, "\\'")}', this)">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '<p class="text-muted small mb-0">No slogans provided.</p>';

  const socialPlatforms = [
    { key: 'facebook', icon: 'fab fa-facebook', color: 'primary', label: 'Facebook' },
    { key: 'linkedin', icon: 'fab fa-linkedin', color: 'info', label: 'LinkedIn' },
    { key: 'whatsapp', icon: 'fab fa-whatsapp', color: 'success', label: 'WhatsApp' }
  ];

  const socialCards = socialPlatforms.map((p) => `
    <div class="col-md-4">
      <div class="border border-secondary rounded h-100">
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary">
          <span class="fw-semibold small"><i class="${p.icon} text-${p.color} me-1"></i>${p.label}</span>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="copyText(this.closest('.border').querySelector('.cap-text').textContent, this)">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="p-2 small text-muted cap-text">${escapeHTML(d.captions?.[p.key] || '—')}</div>
      </div>
    </div>
  `).join('');

  return `
    ${renderSourceIdeaCaption(content)}
    <div class="row g-3">
      <div class="col-md-6">
        <h6 class="fw-bold mb-2"><i class="fab fa-instagram text-danger me-2"></i>Instagram Posts</h6>
        ${igPosts}
      </div>
      <div class="col-md-6">
        <h6 class="fw-bold mb-2"><i class="fas fa-ad text-primary me-2"></i>Ad Copies</h6>
        ${adCopies}
      </div>
      <div class="col-12">
        <h6 class="fw-bold mb-2"><i class="fas fa-quote-right text-warning me-2"></i>Slogans</h6>
        ${slogans}
      </div>
      <div class="col-12">
        <h6 class="fw-bold mb-2"><i class="fas fa-share-alt text-info me-2"></i>Social Captions</h6>
        <div class="row g-2">${socialCards}</div>
      </div>
    </div>
  `;
}

/** type: "risk-assessment" — content saved from Crisis Mode boardroom debates.
 *  Shape: { crisisInput, finalRiskScore, conflict: { highConflict, maxDifference,
 *  disagreementBetween }, finalPlan: { summary, reasoning, steps, decidedBy } }
 */
function renderRiskAssessmentContent(content) {
  const crisisInput = content?.crisisInput || '';
  const finalRiskScore = content?.finalRiskScore;
  const conflict = content?.conflict || {};
  const finalPlan = content?.finalPlan || {};
  const steps = Array.isArray(finalPlan.steps) ? finalPlan.steps : [];

  const scoreColor = finalRiskScore >= 7 ? 'danger' : finalRiskScore >= 4 ? 'warning' : 'success';
  const priorityColor = (p) => p === 'Critical' ? 'danger' : p === 'High' ? 'warning' : 'secondary';
  const ownerIconMap = {
    CEO: 'fa-crown', Finance: 'fa-coins', PR: 'fa-bullhorn',
    Engineer: 'fa-screwdriver-wrench', Lawyer: 'fa-scale-balanced'
  };

  return `
    ${crisisInput ? `
      <div class="bg-secondary bg-opacity-25 border border-secondary rounded p-2 small mb-3">
        <span class="text-danger fw-semibold"><i class="fas fa-triangle-exclamation me-1"></i>Crisis:</span>
        <span class="text-muted" style="white-space:pre-wrap">${escapeHTML(crisisInput)}</span>
      </div>
    ` : ''}

    <div class="row g-3 mb-3">
      ${finalRiskScore != null ? `
        <div class="col-md-5">
          <div class="border border-secondary rounded h-100 p-3">
            <h6 class="fw-bold text-danger mb-2"><i class="fas fa-gauge-high me-2"></i>Final Weighted Risk Score</h6>
            <div class="d-flex align-items-end mb-2">
              <span class="display-6 fw-bold me-1">${escapeHTML(finalRiskScore)}</span>
              <span class="text-muted mb-1">/10</span>
            </div>
            <div class="progress mb-2" style="height:6px">
              <div class="progress-bar bg-${scoreColor}" style="width:${(finalRiskScore || 0) * 10}%"></div>
            </div>
            <span class="badge bg-${conflict.highConflict ? 'danger' : 'success'}">
              ${conflict.highConflict ? 'HIGH CONFLICT' : 'Aligned'}
            </span>
          </div>
        </div>
      ` : ''}
      <div class="col-md-7">
        <div class="border border-secondary rounded h-100 p-3">
          <h6 class="fw-bold text-warning mb-2"><i class="fas fa-crown me-2"></i>CEO's Closing Statement</h6>
          <p class="text-muted small mb-0" style="white-space:pre-wrap">${escapeHTML(finalPlan.summary || 'No summary provided.')}</p>
        </div>
      </div>
    </div>

    ${conflict.highConflict ? `
      <div class="alert alert-danger d-flex align-items-center gap-2 small mb-3">
        <i class="fas fa-bolt"></i>
        <span>
          <strong>High conflict</strong> — ${escapeHTML(conflict.disagreementBetween?.[0])} and
          ${escapeHTML(conflict.disagreementBetween?.[1])} disagreed by ${escapeHTML(conflict.maxDifference)} risk points.
        </span>
      </div>
    ` : ''}

    ${steps.length ? `
      <div class="mb-2">
        <h6 class="fw-bold mb-2"><i class="fas fa-list-ol text-danger me-2"></i>Recovery Plan — Step by Step</h6>
        <div class="row g-2">
          ${steps.map((step) => `
            <div class="col-md-6">
              <div class="d-flex gap-2 p-2 border border-secondary rounded h-100 small">
                <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:28px;height:28px;font-weight:700;font-size:.8rem">${escapeHTML(step.step)}</div>
                <div>
                  <div class="fw-semibold">${escapeHTML(step.title)}</div>
                  <div class="text-muted">${escapeHTML(step.description)}</div>
                  <div class="d-flex flex-wrap gap-1 mt-1">
                    <span class="badge bg-secondary"><i class="fas ${ownerIconMap[step.owner] || 'fa-user'} me-1"></i>${escapeHTML(step.owner)}</span>
                    <span class="badge bg-${priorityColor(step.priority)} ${step.priority === 'High' ? 'text-dark' : ''}">${escapeHTML(step.priority)}</span>
                    <span class="badge bg-dark border border-secondary">${escapeHTML(step.timeline)}</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${finalPlan.reasoning ? `
      <div class="border-top border-secondary pt-2 mt-2">
        <p class="text-muted small mb-0"><i class="fas fa-circle-info me-1"></i>${escapeHTML(finalPlan.reasoning)}</p>
      </div>
    ` : ''}
  `;
}

/** Fallback for types without a dedicated renderer yet (swot, financial-forecast, pitch-deck, or unknown shapes). */
function renderGenericContent(content) {
  if (content == null) return '<p class="text-muted small mb-0">No content.</p>';

  if (typeof content === 'string') {
    return `<p class="small mb-0" style="white-space:pre-wrap">${escapeHTML(content)}</p>`;
  }

  if (typeof content === 'object') {
    const entries = Object.entries(content).filter(([key]) => key !== 'source_idea');

    return `
      ${renderSourceIdeaCaption(content)}
      <div class="d-flex flex-column gap-2 small">
        ${entries.map(([key, value]) => `
          <div class="border border-secondary rounded p-2">
            <div class="fw-semibold text-capitalize mb-1">${escapeHTML(key.replace(/_/g, ' '))}</div>
            ${typeof value === 'object' && value !== null
              ? `<pre class="mb-0 bg-black bg-opacity-25 p-2 rounded" style="white-space:pre-wrap">${escapeHTML(JSON.stringify(value, null, 2))}</pre>`
              : `<div class="text-muted" style="white-space:pre-wrap">${escapeHTML(value)}</div>`}
          </div>
        `).join('')}
      </div>
    `;
  }

  return `<p class="small mb-0">${escapeHTML(String(content))}</p>`;
}

/** Dispatches to the right renderer based on the document's type. */
function renderContentByType(type, content) {
  switch (type) {
    case 'idea':
      return renderIdeaContent(content);
    case 'market-analysis':
      return renderMarketAnalysisContent(content);
    case 'business-model':
      return renderBusinessModelContent(content);
    case 'marketing-plan':
      return renderMarketingPlanContent(content);
    case 'risk-assessment':
      return renderRiskAssessmentContent(content);
    default:
      return renderGenericContent(content);
  }
}

function renderDocumentCard(doc) {
  return `
    <div class="card bg-dark border-secondary mb-3" data-document-id="${escapeHTML(doc._id)}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="fw-bold mb-1">${escapeHTML(doc.title || 'Untitled document')}</h6>
            <small class="text-muted">Saved ${escapeHTML(formatDateTime(doc.createdAt))}</small>
          </div>
          <div class="d-flex gap-1">
            ${doc.favorite ? '<span class="badge bg-warning text-dark"><i class="fas fa-star"></i></span>' : ''}
            <button type="button" class="btn btn-sm btn-outline-danger js-delete-document">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        ${renderContentByType(doc.type, doc.content)}
      </div>
    </div>
  `;
}

function renderDocumentSections(documentsByType) {
  if (!projectDocumentsEl) return;

  const sections = DOCUMENT_TYPE_ORDER
    .filter((type) => Array.isArray(documentsByType[type]) && documentsByType[type].length > 0)
    .map((type) => {
      const meta = DOCUMENT_TYPE_META[type] || { label: type, icon: 'fa-file', color: 'secondary' };
      const docs = documentsByType[type];

      return `
        <div class="mb-4">
          <h5 class="fw-semibold mb-3">
            <i class="fas ${meta.icon} text-${meta.color} me-2"></i>${escapeHTML(meta.label)}
            <span class="badge bg-secondary ms-2">${docs.length}</span>
          </h5>
          ${docs.map((doc) => renderDocumentCard(doc)).join('')}
        </div>
      `;
    });

  if (!sections.length) {
    projectDocumentsEl.innerHTML = `
      <div class="card bg-dark border-secondary py-5 px-4 text-center">
        <div class="mb-3"><i class="fas fa-file-circle-plus text-warning fa-2x"></i></div>
        <h4 class="fw-bold mb-2">No documents in this project yet</h4>
        <p class="text-muted mb-3">Generate a market analysis, SWOT, marketing plan, or business plan and save it to this project.</p>
        <div class="d-flex justify-content-center gap-2 flex-wrap">
          <a href="analysis.html" class="btn btn-outline-info btn-sm">Run Analysis</a>
          <a href="plan.html" class="btn btn-outline-success btn-sm">Build a Plan</a>
          <a href="marketing.html" class="btn btn-outline-danger btn-sm">Create Marketing Kit</a>
        </div>
      </div>
    `;
    return;
  }

  projectDocumentsEl.innerHTML = sections.join('');
}

if (projectDocumentsEl) {
  projectDocumentsEl.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('.js-delete-document');
    if (!deleteButton) return;

    const card = deleteButton.closest('[data-document-id]');
    const documentId = card?.dataset.documentId;
    if (!documentId) return;

    const confirmed = window.confirm('Delete this document? This cannot be undone.');
    if (!confirmed) return;

    deleteButton.disabled = true;

    try {
      await deleteProjectDocument(documentId);
      card.remove();
    } catch (error) {
      deleteButton.disabled = false;
      window.alert(error.message || 'Failed to delete document.');
    }
  });
}

async function loadProject() {
  const projectId = getProjectIdFromURL();

  if (!projectId) {
    renderError('No project specified.');
    return;
  }

  try {
    renderLoading();
    const response = await getProject(projectId);
    renderHeader(response.project || {});
    renderDocumentSections(response.documentsByType || {});
  } catch (error) {
    renderError(error.message || 'Failed to load project.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('bizshieldai-token') || localStorage.getItem('token');
  if (!token) {
    localStorage.removeItem('bizshieldai-user');
    window.location.href = 'login.html';
    return;
  }
  loadProject();
});
