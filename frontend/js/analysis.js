const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-search me-2"></i>Analyse Idea';
let latestAnalysisContent = null;

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderSelectedIdeaCard(idea) {
    if (!idea) return;

    boardContent.innerHTML = `
        <div class="card bg-secondary border-secondary mb-4">
            <div class="card-body">
                <h6 class="fw-semibold text-info mb-2"><i class="fas fa-lightbulb me-2"></i>Selected idea</h6>
                <p class="mb-1 text-white"><strong>${escapeHTML(idea.name || 'Untitled idea')}</strong></p>
                ${idea.description ? `<p class="text-muted small mb-3">${escapeHTML(idea.description)}</p>` : ''}
                <div class="d-flex flex-wrap gap-2 mb-3">
                    ${idea.time_to_profit ? `<span class="badge bg-dark"><i class="fas fa-clock me-1"></i>${escapeHTML(idea.time_to_profit)}</span>` : ''}
                    ${idea.startup_cost ? `<span class="badge bg-dark"><i class="fas fa-dollar-sign me-1"></i>${escapeHTML(idea.startup_cost)}</span>` : ''}
                    ${idea.score ? `<span class="badge bg-warning text-dark"><i class="fas fa-lightbulb me-1"></i>Score: ${escapeHTML(idea.score)}/10</span>` : ''}
                </div>
                ${idea.why_it_fits ? `
                    <div class="bg-dark border border-secondary rounded p-2 small">
                        <strong class="text-success"><i class="fas fa-check-circle me-1"></i>Why it fits:</strong>
                        <br>${escapeHTML(idea.why_it_fits)}
                    </div>` : ''}
            </div>
        </div>
    `;
}

function normalizeCostEstimate(costEstimate = {}) {
    return {
        minimum: costEstimate.minimum || costEstimate.minimum_startup || costEstimate.bootstrap_cost || 'Not provided',
        recommended: costEstimate.recommended || costEstimate.recommended_startup || costEstimate.optimal_cost || 'Not provided',
        breakdown: costEstimate.breakdown || costEstimate.detailed_breakdown || costEstimate.cost_breakdown || [],
        breakEven: costEstimate.break_even_months || costEstimate.break_even || costEstimate.break_even_timeline || '',
        projectedRevenue: costEstimate.projected_monthly_revenue_start || costEstimate.projected_monthly_revenue || '',
        paybackPeriod: costEstimate.payback_period || ''
    };
}

function formatBreakEven(value) {
    if (!value) return '';
    return typeof value === 'number' ? `${value} months` : String(value);
}

function asArray(...values) {
    for (const value of values) {
        if (Array.isArray(value)) {
            const cleaned = value.filter(item => item !== undefined && item !== null && String(item).trim());
            if (cleaned.length) return cleaned;
            continue;
        }
        if (typeof value === 'string' && value.trim()) return [value.trim()];
    }
    return [];
}

// Pre-fill if coming from Ideas page
window.addEventListener('DOMContentLoaded', () => {
    const saved = sessionStorage.getItem('idea');
    const savedCard = sessionStorage.getItem('ideaCard');
    const shouldAutoAnalyze = sessionStorage.getItem('autoAnalyzeIdea') === 'true';

    if (saved) {
        document.getElementById('input-idea').value = saved;
        sessionStorage.removeItem('idea');
    }

    if (savedCard) {
        try {
            window.ideaCardFromIdeas = JSON.parse(savedCard);
        } catch (error) {
            console.warn('Unable to parse saved idea card details', error);
        }
        sessionStorage.removeItem('ideaCard');
    }

    if (window.ideaCardFromIdeas) {
        renderSelectedIdeaCard(window.ideaCardFromIdeas);
    }

    if (shouldAutoAnalyze) {
        sessionStorage.removeItem('autoAnalyzeIdea');
        setTimeout(() => btn.click(), 150);
    }
});

btn.addEventListener('click', async (event) => {
    event?.preventDefault();
    const idea = document.getElementById('input-idea').value.trim();

    if (!idea) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Please enter a business idea to analyse.
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analysing...';
    showLoading(boardContent, 'Analysing market demand, competition and risk…');

    try {
        const data = await callAPI('/analyze-idea', { idea });
        console.log('📊 ANALYZE-IDEA RESPONSE:', data);
        try {
            sessionStorage.setItem('ai-analysis-result', JSON.stringify(data));
        } catch (_) {
            // Ignore storage failures in private mode or quota-limited contexts.
        }
        renderAnalysis(data);
    } catch (err) {
        console.error('💥 ERROR in analyze-idea:', err);
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderAnalysis(d) {
    const normalizedCost = normalizeCostEstimate(d?.cost_estimate);
    const fallbackRisks = [
        'Demand may be weaker than expected unless validated with real buyer conversations and pilot commitments.',
        'Customer acquisition costs may rise if the target audience is too broad or messaging is unclear.',
        'Competitors or substitutes may already own trust unless the offer has a sharp and provable differentiation.',
        'Operational delivery may become inconsistent if the first version relies on manual founder effort without documented processes.',
        'Cash flow can tighten if launch spending happens before revenue channels are proven.'
    ];
    // Safe fallback for all nested properties
    const safeData = {
        demand: d?.demand || { score: 0, summary: 'No data', market_size: '—', growth_trajectory: '—', target_segments: '—' },
        competition: d?.competition || { level: 'Unknown', score: 0, summary: 'No data' },
        risk: {
            ...(d?.risk || { level: 'Unknown' }),
            top_risks: asArray(d?.risk?.top_risks, d?.risk?.risks, fallbackRisks)
        },
        cost_estimate: normalizedCost
    };
    console.log('🛡️ SAFE DATA STRUCTURE:', safeData);
    d = safeData;
    latestAnalysisContent = { ...d, source_idea: document.getElementById('input-idea')?.value.trim() || '' };
    const canSaveAnalysis = typeof isLoggedIn === 'function' && isLoggedIn();
    
    const levelColor = { Low: 'success', Medium: 'warning', High: 'danger' };
    const riskCol  = levelColor[d.risk.level]        || 'secondary';
    const compCol  = levelColor[d.competition.level] || 'secondary';

    const ideaCard = window.ideaCardFromIdeas;
    const analysisTitle = ideaCard?.name || document.getElementById('input-idea').value || 'This business idea';
    const analysisDescription = window.ideaCardFromIdeas?.description || '';

    boardContent.innerHTML = `
        <div class="card bg-secondary border-secondary mb-4">
            <div class="card-body">
                <h6 class="fw-semibold text-info mb-2"><i class="fas fa-lightbulb me-2"></i>Analyzing</h6>
                <p class="mb-1 text-white"><strong>${escapeHTML(analysisTitle)}</strong></p>
                ${analysisDescription ? `<p class="text-muted small mb-3">${escapeHTML(analysisDescription)}</p>` : ''}
                ${ideaCard ? `
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        ${ideaCard.time_to_profit ? `<span class="badge bg-dark"><i class="fas fa-clock me-1"></i>${escapeHTML(ideaCard.time_to_profit)}</span>` : ''}
                        ${ideaCard.startup_cost ? `<span class="badge bg-dark"><i class="fas fa-dollar-sign me-1"></i>${escapeHTML(ideaCard.startup_cost)}</span>` : ''}
                        ${ideaCard.score ? `<span class="badge bg-warning text-dark"><i class="fas fa-lightbulb me-1"></i>Score: ${escapeHTML(ideaCard.score)}/10</span>` : ''}
                    </div>
                    ${ideaCard.why_it_fits ? `
                        <div class="bg-dark border border-secondary rounded p-2 small">
                            <strong class="text-success"><i class="fas fa-check-circle me-1"></i>Why it fits:</strong>
                            <br>${escapeHTML(ideaCard.why_it_fits)}
                        </div>` : ''}
                ` : ''}
            </div>
        </div>
        <h5 class="mb-4 fw-semibold"><i class="fas fa-poll text-info me-2"></i>Analysis Results</h5>
        <div class="row g-4">

            <!-- Demand -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body">
                        <h6 class="fw-bold text-primary mb-3">
                            <i class="fas fa-chart-line me-2"></i>Market Demand
                        </h6>
                        <div class="d-flex align-items-end mb-2">
                            <span class="display-5 fw-bold me-1">${d.demand.score}</span>
                            <span class="text-muted mb-1">/10</span>
                        </div>
                        <div class="progress mb-3" style="height:8px">
                            <div class="progress-bar bg-primary" style="width:${d.demand.score * 10}%"></div>
                        </div>
                        <p class="text-muted small mb-0">${d.demand.summary}</p>
                    </div>
                </div>
            </div>

            <!-- Competition -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body">
                        <h6 class="fw-bold text-warning mb-3">
                            <i class="fas fa-users me-2"></i>Competition
                        </h6>
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-${compCol} fs-6 px-3 py-2">${d.competition.level}</span>
                            <span class="text-muted">Score: ${d.competition.score}/10</span>
                        </div>
                        <div class="progress mb-3" style="height:8px">
                            <div class="progress-bar bg-warning" style="width:${d.competition.score * 10}%"></div>
                        </div>
                        <p class="text-muted small mb-0">${d.competition.summary}</p>
                    </div>
                </div>
            </div>

            <!-- Risk -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body">
                        <h6 class="fw-bold text-danger mb-3">
                            <i class="fas fa-exclamation-triangle me-2"></i>Risk Assessment
                        </h6>
                        <span class="badge bg-${riskCol} fs-6 px-3 py-2 mb-3">${d.risk.level} Risk</span>
                        <ul class="list-unstyled mb-0">
                            ${(d?.risk?.top_risks || []).map(r => `
                                <li class="mb-2">
                                    <i class="fas fa-minus-circle text-danger me-2"></i>${escapeHTML(r)}
                                </li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Cost Estimate -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-body">
                        <h6 class="fw-bold text-success mb-3">
                            <i class="fas fa-dollar-sign me-2"></i>Cost Estimate
                        </h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
                                <span class="text-muted">Minimum startup</span>
                                <strong class="text-success">${escapeHTML(d.cost_estimate.minimum)}</strong>
                            </div>
                            <div class="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
                                <span class="text-muted">Recommended</span>
                                <strong class="text-info">${escapeHTML(d.cost_estimate.recommended)}</strong>
                            </div>
                            ${d.cost_estimate.breakEven ? `
                                <div class="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
                                    <span class="text-muted">Break-even</span>
                                    <strong>${escapeHTML(formatBreakEven(d.cost_estimate.breakEven))}</strong>
                                </div>` : ''}
                            ${d.cost_estimate.projectedRevenue ? `
                                <div class="d-flex justify-content-between border-bottom border-secondary pb-2 mb-2">
                                    <span class="text-muted">Early monthly revenue</span>
                                    <strong>${escapeHTML(d.cost_estimate.projectedRevenue)}</strong>
                                </div>` : ''}
                            ${d.cost_estimate.paybackPeriod ? `
                                <div class="d-flex justify-content-between">
                                    <span class="text-muted">Payback period</span>
                                    <strong>${escapeHTML(d.cost_estimate.paybackPeriod)}</strong>
                                </div>` : ''}
                        </div>
                        <h6 class="text-muted small mb-2">Breakdown</h6>
                        <ul class="list-unstyled small mb-0">
                            ${(d?.cost_estimate?.breakdown || []).map(b => `
                                <li class="mb-1">
                                    <i class="fas fa-circle text-muted me-2" style="font-size:.5rem;vertical-align:middle"></i>${escapeHTML(b)}
                                </li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

        </div>

        <!-- Save analysis to project -->
        <div class="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-4">
            ${canSaveAnalysis ? `
                <button type="button" id="btn-save-analysis" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-bookmark me-1"></i>Save Analysis to Project
                </button>
            ` : `
                <a href="login.html" class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-right-to-bracket me-1"></i>Log in to save
                </a>
            `}
            <div id="analysis-save-status" class="small w-100 text-end"></div>
        </div>

        <!-- Next step suggestion -->
        <div class="alert alert-dark border-secondary mt-4 d-flex flex-wrap align-items-center gap-3">
            <i class="fas fa-arrow-right text-info fs-4"></i>
            <span class="flex-grow-1">Like what you see? Continue building this idea:</span>
            <button type="button" id="btn-continue-plan" class="btn btn-sm btn-outline-info">
                <i class="fas fa-road me-1"></i>Build Plan
            </button>
            <button type="button" id="btn-continue-marketing" class="btn btn-sm btn-outline-warning">
                <i class="fas fa-bullhorn me-1"></i>Create Marketing Kit
            </button>
        </div>
    `;
    // Apply currency conversion to any $ amounts
    if (window.patchCurrencyInElement) window.patchCurrencyInElement(boardContent, window.getBSCurrency());
}

boardContent.addEventListener('click', async (event) => {
    const continuePlanBtn = event.target.closest('#btn-continue-plan');
    if (continuePlanBtn) {
        const ideaText = document.getElementById('input-idea')?.value.trim() || '';
        if (ideaText) {
            sessionStorage.setItem('idea', ideaText);
            sessionStorage.setItem('autoGeneratePlan', 'true');
        }
        window.location.href = 'plan.html';
        return;
    }

    const continueMarketingBtn = event.target.closest('#btn-continue-marketing');
    if (continueMarketingBtn) {
        const ideaText = document.getElementById('input-idea')?.value.trim() || '';
        if (ideaText) {
            sessionStorage.setItem('idea', ideaText);
            sessionStorage.setItem('autoGenerateMarketing', 'true');
        }
        window.location.href = 'marketing.html';
        return;
    }

    const saveButton = event.target.closest('#btn-save-analysis');
    if (!saveButton || !latestAnalysisContent) return;

    const status = document.getElementById('analysis-save-status');
    const originalSaveLabel = saveButton.innerHTML;

    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving';
    if (status) status.textContent = '';

    try {
        await promptAndSaveToProject({
            type: 'market-analysis',
            title: 'Market Analysis',
            content: latestAnalysisContent
        });
        saveButton.innerHTML = '<i class="fas fa-check me-1"></i>Saved';
        if (status) {
            status.className = 'small text-success w-100 text-end';
            status.textContent = 'Analysis saved to your project.';
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
