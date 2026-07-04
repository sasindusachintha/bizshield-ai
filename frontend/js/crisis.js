const crisisBtn = document.getElementById('btn-submit');
const crisisBoardContent = document.getElementById('board-content');
const t = (text) => (typeof bsT === 'function' ? bsT(text) : text);
const crisisOriginalLabel = () => `<i class="fas fa-gavel me-2"></i>${t('Convene the Boardroom')}`;
let latestCrisisContent = null;

const ROLE_META = {
    CEO:      { icon: 'fa-crown',          label: 'CEO',       cssClass: 'role-ceo' },
    Finance:  { icon: 'fa-coins',          label: 'Finance',   cssClass: 'role-finance' },
    PR:       { icon: 'fa-bullhorn',       label: 'PR',        cssClass: 'role-pr' },
    Engineer: { icon: 'fa-screwdriver-wrench', label: 'Engineer', cssClass: 'role-engineer' },
    Lawyer:   { icon: 'fa-scale-balanced', label: 'Lawyer',    cssClass: 'role-lawyer' },
};

const STANCE_META = {
    agree:    { icon: 'fa-thumbs-up text-success',   label: 'Agrees' },
    disagree: { icon: 'fa-thumbs-down text-danger',  label: 'Disagrees' },
    neutral:  { icon: 'fa-minus text-secondary',     label: 'Neutral' },
};

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function riskBadgeColor(score) {
    if (score >= 7) return 'danger';
    if (score >= 4) return 'warning';
    return 'success';
}

function priorityBadgeColor(priority) {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'success';
}

function renderMiniStepList(items) {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!safeItems.length) return '';
    return `
        <ul class="small text-muted mt-2 mb-0 ps-3">
            ${safeItems.map(item => `<li class="mb-1">${escapeHTML(item)}</li>`).join('')}
        </ul>
    `;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Render the live debate panel shell and the initial "convening" state */
function renderPanelShell() {
    crisisBoardContent.innerHTML = `
        <div class="card bg-secondary border-secondary mb-4 tilt-card">
            <div class="card-body">
                <h6 class="fw-semibold text-danger mb-2"><i class="fas fa-triangle-exclamation me-2"></i>${t('Crisis under review')}</h6>
                <p class="mb-0 text-white">${escapeHTML(document.getElementById('input-crisis').value.trim())}</p>
            </div>
        </div>
        <h5 class="mb-4 fw-semibold"><i class="fas fa-users-rectangle text-danger me-2"></i>${t('Live Debate Panel')}</h5>
        <div id="debate-panel"></div>
    `;
}

/** Append a single agent bubble to the panel, with a transient typing indicator first */
async function appendAgentTurn(turn, { isFinal = false } = {}) {
    const panel = document.getElementById('debate-panel');
    if (!panel) return;

    const meta = ROLE_META[turn.role] || ROLE_META.CEO;

    // typing indicator
    const typingId = `typing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const typingEl = document.createElement('div');
    typingEl.className = `debate-msg ${meta.cssClass} d-flex gap-3`;
    typingEl.id = typingId;
    typingEl.innerHTML = `
        <div class="speaker-avatar${isFinal ? ' final' : ''}"><i class="fas ${meta.icon}"></i></div>
        <div class="debate-bubble bg-dark flex-grow-1">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="small">${escapeHTML(meta.label)}${isFinal ? ' <span class=\"text-warning\">(Final Decision)</span>' : ''}</strong>
            </div>
            <div class="typing-indicator text-muted">
                <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
            </div>
        </div>
    `;
    panel.appendChild(typingEl);
    panel.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // simulate live typing delay (1-2s) before the message resolves
    await sleep(1000 + Math.random() * 1000);

    const stanceMeta = STANCE_META[turn.stance] || STANCE_META.neutral;
    typingEl.innerHTML = `
        <div class="speaker-avatar${isFinal ? ' final' : ''}"><i class="fas ${meta.icon}"></i></div>
        <div class="debate-bubble bg-dark flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                <strong class="small">${escapeHTML(meta.label)}${isFinal ? ' <span class="text-warning">(Final Decision)</span>' : ''}</strong>
                <div class="d-flex align-items-center gap-2">
                    <span class="small text-muted"><i class="fas ${stanceMeta.icon} stance-icon me-1"></i>${t(stanceMeta.label)}</span>
                    <span class="risk-badge bg-${riskBadgeColor(turn.risk_score)} text-${riskBadgeColor(turn.risk_score) === 'warning' ? 'dark' : 'white'}">
                        ${t('Risk')} ${turn.risk_score}/10
                    </span>
                    <span class="badge bg-${priorityBadgeColor(turn.priority)} ${turn.priority === 'medium' ? 'text-dark' : ''}">
                        ${escapeHTML(turn.priority || 'medium')}
                    </span>
                </div>
            </div>
            <p class="mb-2">${escapeHTML(turn.message)}</p>
            ${turn.problem_analysis ? `
                <div class="small mb-2">
                    <span class="text-danger fw-semibold">${t('Problem analysis:')}</span>
                    <span class="text-muted">${escapeHTML(turn.problem_analysis)}</span>
                </div>
            ` : ''}
            ${turn.solution ? `
                <div class="small mb-2">
                    <span class="text-success fw-semibold">${t('Solution:')}</span>
                    <span class="text-muted">${escapeHTML(turn.solution)}</span>
                </div>
            ` : ''}
            ${renderMiniStepList(turn.step_by_step_recovery_plan)}
            ${turn.reasoning ? `<p class="text-muted small mt-2 mb-0"><i class="fas fa-circle-info me-1"></i>${escapeHTML(turn.reasoning)}</p>` : ''}
        </div>
    `;
    panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

/** Render the final summary cards (conflict status, weighted score, recovery plan) */
function renderFinalSummary({ conflict, finalRiskScore, finalPlan, crisisInput }) {
    latestCrisisContent = { crisisInput, finalRiskScore, finalPlan, conflict };
    const canSave = typeof isLoggedIn === 'function' && isLoggedIn();
    const scoreColor = riskBadgeColor(finalRiskScore);
    const steps = Array.isArray(finalPlan.steps) ? finalPlan.steps : [];

    const conflictBlock = conflict.highConflict
        ? `
            <div class="alert alert-danger conflict-alert d-flex align-items-center gap-3 mt-4">
                <i class="fas fa-bolt fs-4"></i>
                <span>
                    <strong>HIGH CONFLICT detected</strong> â€” ${escapeHTML(conflict.disagreementBetween[0])} and
                    ${escapeHTML(conflict.disagreementBetween[1])} disagreed by ${conflict.maxDifference.toFixed(1)} risk points.
                    The CEO's final decision below overrides the disagreement.
                </span>
            </div>`
        : `
            <div class="alert alert-success d-flex align-items-center gap-3 mt-4">
                <i class="fas fa-handshake fs-4"></i>
                <span>The boardroom reached reasonable alignment â€” no high-conflict override was required.</span>
            </div>`;

    const priorityColor = (p) => p === 'Critical' ? 'danger' : p === 'High' ? 'warning' : 'secondary';
    const ownerIcon = (o) => (ROLE_META[o] || ROLE_META.CEO).icon;

    const renderRecoverySteps = (items) => (Array.isArray(items) && items.length
        ? items.map(step => `
            <div class="col-md-6">
                <div class="d-flex gap-3 p-3 border border-secondary rounded h-100">
                    <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                         style="width:36px;height:36px;font-weight:700">${escapeHTML(step.step)}</div>
                    <div>
                        <div class="fw-semibold">${escapeHTML(step.title)}</div>
                        <div class="text-muted small">${escapeHTML(step.description)}</div>
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            <span class="badge bg-secondary"><i class="fas ${ownerIcon(step.owner)} me-1"></i>${escapeHTML(step.owner)}</span>
                            <span class="badge bg-${priorityColor(step.priority)} ${step.priority === 'High' ? 'text-dark' : ''}">${escapeHTML(step.priority)}</span>
                            <span class="badge bg-dark border border-secondary">${escapeHTML(step.timeline)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')
        : '<p class="text-muted mb-0">No recovery steps provided.</p>');

    const immediate = steps.filter(step => /24|immediate/i.test(step.timeline));
    const shortTerm = steps.filter(step => /7|week|short/i.test(step.timeline));
    const longTerm = steps.filter(step => /30|month|long/i.test(step.timeline));
    const stepsHTML = steps.length
        ? `
            <h6 class="fw-bold text-danger mb-2">Immediate actions (24 hours)</h6>
            <div class="row g-3 mb-3">${renderRecoverySteps(immediate.length ? immediate : steps.slice(0, 3))}</div>
            <h6 class="fw-bold text-warning mb-2">Short-term actions (7 days)</h6>
            <div class="row g-3 mb-3">${renderRecoverySteps(shortTerm.length ? shortTerm : steps.slice(3, 6))}</div>
            <h6 class="fw-bold text-info mb-2">Long-term strategy (30 days)</h6>
            <div class="row g-3">${renderRecoverySteps(longTerm.length ? longTerm : steps.slice(6, 9))}</div>
        `
        : '<p class="text-muted mb-0">No recovery steps provided.</p>';

    const summaryHTML = `
        <div class="row g-4 mt-4 result-reveal">
            <div class="col-md-5">
                <div class="card bg-dark border-secondary h-100 tilt-card">
                    <div class="card-body">
                        <h6 class="fw-bold text-danger mb-3"><i class="fas fa-gauge-high me-2"></i>${t('Final Weighted Risk Score')}</h6>
                        <div class="d-flex align-items-end mb-2">
                            <span class="display-5 fw-bold me-1">${finalRiskScore}</span>
                            <span class="text-muted mb-1">/10</span>
                        </div>
                        <div class="progress mb-2" style="height:8px">
                            <div class="progress-bar bg-${scoreColor}" style="width:${finalRiskScore * 10}%"></div>
                        </div>
                        <span class="badge bg-${conflict.highConflict ? 'danger' : 'success'} fs-6 px-3 py-2">
                            ${conflict.highConflict ? 'HIGH CONFLICT' : 'Aligned'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="col-md-7">
                <div class="card bg-dark border-secondary h-100 tilt-card">
                    <div class="card-body">
                        <h6 class="fw-bold text-warning mb-3"><i class="fas fa-crown me-2"></i>${t('CEO\'s Closing Statement')}</h6>
                        <p class="mb-0 small">${escapeHTML(finalPlan.summary)}</p>
                    </div>
                </div>
            </div>
        </div>
        ${conflictBlock}
        <div class="mt-4 result-reveal">
            <h5 class="mb-3 fw-semibold"><i class="fas fa-list-check text-danger me-2"></i>Recovery Plan â€” Step by Step</h5>
            ${stepsHTML}
        </div>
        <div class="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-4">
            ${canSave ? `
                <button type="button" id="btn-save-crisis" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-bookmark me-1"></i>${t('Save Outcome to Project')}
                </button>
            ` : `
                <a href="login.html" class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-right-to-bracket me-1"></i>${t('Log in to save')}
                </a>
            `}
            <div id="crisis-save-status" class="small w-100 text-end"></div>
        </div>
    `;

    crisisBoardContent.insertAdjacentHTML('beforeend', summaryHTML);
}

crisisBtn.addEventListener('click', async () => {
    const crisisInput = document.getElementById('input-crisis').value.trim();

    if (!crisisInput) {
        crisisBoardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${t('Please describe the crisis before convening the boardroom.')}
            </div>`;
        return;
    }

    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        crisisBoardContent.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center gap-2">
                <i class="fas fa-right-to-bracket"></i>
                <span>Please <a href="login.html" class="text-warning fw-semibold">log in</a> to run a boardroom debate.</span>
            </div>`;
        return;
    }

    crisisBtn.disabled = true;
    crisisBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('Convening...')}`;
    renderPanelShell();

    try {
        const data = await protectedRequest('/api/crisis/debate', {
            method: 'POST',
            body: JSON.stringify({
                crisisInput,
                preferences: {
                    language: typeof getBSLanguage === 'function' ? getBSLanguage() : localStorage.getItem('bizshieldai-lang') || 'en',
                    currency: typeof getBSCurrency === 'function' ? getBSCurrency() : localStorage.getItem('bizshieldai-currency') || 'USD'
                }
            }),
        });

        // Reveal each debate message in order, one at a time, like a live meeting
        for (let i = 0; i < data.debateMessages.length; i++) {
            const turn = data.debateMessages[i];
            const isFinal = i === data.debateMessages.length - 1;
            // eslint-disable-next-line no-await-in-loop
            await appendAgentTurn(turn, { isFinal });
        }

        renderFinalSummary({
            conflict: data.conflict,
            finalRiskScore: data.finalRiskScore,
            finalPlan: data.finalPlan,
            crisisInput,
        });
    } catch (err) {
        console.error('Crisis debate error:', err);
        showError(crisisBoardContent, err.message);
    } finally {
        crisisBtn.disabled = false;
        crisisBtn.innerHTML = crisisOriginalLabel();
    }
});

crisisBoardContent.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('#btn-save-crisis');
    if (!saveButton || !latestCrisisContent) return;

    const status = document.getElementById('crisis-save-status');
    const originalSaveLabel = saveButton.innerHTML;

    saveButton.disabled = true;
    saveButton.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t('Saving')}`;
    if (status) status.textContent = '';

    try {
        const result = await promptAndSaveToProject({
            type: 'risk-assessment',
            title: t('Crisis Boardroom Outcome'),
            content: latestCrisisContent,
        });

        const projectId = result?.document?.projectId;

        saveButton.innerHTML = `<i class="fas fa-check me-1"></i>${t('Saved')}`;
        if (status) {
            status.className = 'small w-100 text-end';
            status.innerHTML = projectId
                ? `<span class="text-success">Saved.</span> <a href="project.html?id=${encodeURIComponent(projectId)}" class="text-warning fw-semibold">View in Project <i class="fas fa-arrow-right ms-1"></i></a>`
                : '<span class="text-success">Crisis outcome saved to your project.</span>';
        }
    } catch (error) {
        saveButton.disabled = false;
        saveButton.innerHTML = originalSaveLabel;
        if (status) {
            status.className = 'small text-danger w-100 text-end';
            status.textContent = error.message;
        }
    }
});















