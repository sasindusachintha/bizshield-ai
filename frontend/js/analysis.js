const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-search me-2"></i>Analyse Idea';

// Pre-fill if coming from Ideas page
window.addEventListener('DOMContentLoaded', () => {
    const saved = sessionStorage.getItem('idea');
    if (saved) {
        document.getElementById('input-idea').value = saved;
        sessionStorage.removeItem('idea');
    }
});

btn.addEventListener('click', async () => {
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
        renderAnalysis(data);
    } catch (err) {
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderAnalysis(d) {
    const levelColor = { Low: 'success', Medium: 'warning', High: 'danger' };
    const riskCol  = levelColor[d.risk.level]        || 'secondary';
    const compCol  = levelColor[d.competition.level] || 'secondary';

    boardContent.innerHTML = `
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
                            ${d.risk.top_risks.map(r => `
                                <li class="mb-2">
                                    <i class="fas fa-minus-circle text-danger me-2"></i>${r}
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
                                <strong class="text-success">${d.cost_estimate.minimum}</strong>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span class="text-muted">Recommended</span>
                                <strong class="text-info">${d.cost_estimate.recommended}</strong>
                            </div>
                        </div>
                        <h6 class="text-muted small mb-2">Breakdown</h6>
                        <ul class="list-unstyled small mb-0">
                            ${d.cost_estimate.breakdown.map(b => `
                                <li class="mb-1">
                                    <i class="fas fa-circle text-muted me-2" style="font-size:.5rem;vertical-align:middle"></i>${b}
                                </li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>

        </div>

        <!-- Next step suggestion -->
        <div class="alert alert-dark border-secondary mt-4 d-flex align-items-center gap-3">
            <i class="fas fa-arrow-right text-info fs-4"></i>
            <span>
                Like what you see? Head to <a href="plan.html" class="text-info fw-semibold">Plan</a> to build a
                launch roadmap, or <a href="marketing.html" class="text-info fw-semibold">Marketing</a> to create
                your content kit.
            </span>
        </div>
    `;
}
