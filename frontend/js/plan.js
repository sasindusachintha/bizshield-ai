const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-road me-2"></i>Generate Plan';

btn.addEventListener('click', async () => {
    const idea = document.getElementById('input-idea').value.trim();

    if (!idea) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Please enter a business idea first.
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Building plan…';
    showLoading(boardContent, 'Building your personalised launch roadmap…');

    try {
        const data = await callAPI('/generate-plan', { idea });
        renderPlan(data);
    } catch (err) {
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderPlan(d) {
    boardContent.innerHTML = `
        <h5 class="mb-4 fw-semibold"><i class="fas fa-route text-success me-2"></i>Your Launch Roadmap</h5>

        <!-- Setup Steps -->
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-list-ol text-warning me-2"></i>Setup Steps</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${d.setup_steps.map(s => `
                        <div class="col-md-6">
                            <div class="d-flex gap-3 p-3 border border-secondary rounded">
                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                     style="width:36px;height:36px;font-weight:700">${s.step}</div>
                                <div>
                                    <div class="fw-semibold">${s.title}</div>
                                    <div class="text-muted small">${s.description}</div>
                                    ${s.cost !== '$0' && s.cost ? `<span class="badge bg-secondary mt-1">${s.cost}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- 7-Day Plan -->
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-calendar-week text-info me-2"></i>7-Day Sprint</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${d.plan_7_day.map(block => `
                        <div class="col-md-6">
                            <div class="p-3 border border-secondary rounded h-100">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-info text-dark">${block.day}</span>
                                    <span class="fw-semibold small">${block.focus}</span>
                                </div>
                                <ul class="list-unstyled mb-0 small">
                                    ${block.tasks.map(t => `
                                        <li class="mb-1">
                                            <i class="fas fa-check-circle text-success me-2"></i>${t}
                                        </li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- 30-Day Plan -->
        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-calendar-alt text-primary me-2"></i>30-Day Milestones</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${d.plan_30_day.map((wk, i) => `
                        <div class="col-md-6 col-lg-3">
                            <div class="p-3 border border-secondary rounded h-100 text-center">
                                <div class="badge bg-primary mb-2">${wk.week}</div>
                                <div class="fw-semibold mb-2 small">${wk.goal}</div>
                                <ul class="list-unstyled text-start mb-0 small">
                                    ${wk.milestones.map(m => `
                                        <li class="mb-1">
                                            <i class="fas fa-flag text-warning me-1" style="font-size:.7rem"></i>${m}
                                        </li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Success Tips -->
        <div class="card bg-dark border-success">
            <div class="card-header border-success">
                <h6 class="mb-0 fw-bold text-success"><i class="fas fa-star me-2"></i>Success Tips</h6>
            </div>
            <div class="card-body">
                <div class="row g-2">
                    ${d.success_tips.map((tip, i) => `
                        <div class="col-md-4">
                            <div class="d-flex gap-2 p-2 border border-secondary rounded small">
                                <i class="fas fa-lightbulb text-warning mt-1 flex-shrink-0"></i>
                                <span>${tip}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}
