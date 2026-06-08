// Slider label sync
const sliders = [
    { slider: document.getElementById('sl-demand'), label: document.getElementById('lbl-demand') },
    { slider: document.getElementById('sl-competition'), label: document.getElementById('lbl-competition') },
    { slider: document.getElementById('sl-skill'), label: document.getElementById('lbl-skill') }
];

sliders.forEach(({ slider, label }) => {
    slider.addEventListener('input', () => { label.textContent = slider.value; });
});

// Feasibility score calculator
const btn = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = btn.innerHTML;

btn.addEventListener('click', async () => {
    const demand = parseInt(document.getElementById('sl-demand').value);
    const competition = parseInt(document.getElementById('sl-competition').value);
    const skill_match = parseInt(document.getElementById('sl-skill').value);

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Calculating...';

    try {
        const data = await callAPI('/feasibility-score', { demand, competition, skill_match });
        renderScore(data);
    } catch (err) {
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderScore(data) {
    const gradeColor = { A: 'success', B: 'info', C: 'warning', D: 'danger' };
    const color = gradeColor[data.grade] || 'secondary';
    const pct = (data.score / 10 * 100).toFixed(0);
    const breakdown = data.breakdown || {
        demand_contribution: '-',
        skill_contribution: '-',
        competition_penalty: '-'
    };

    boardContent.innerHTML = `
        <hr class="border-secondary">
        <div class="row align-items-center g-4">
            <div class="col-md-3 text-center">
                <div class="display-3 fw-bold text-${color}">${data.score}</div>
                <div class="text-muted">out of 10</div>
                <span class="badge bg-${color} fs-5 mt-2 px-3 py-2">Grade ${data.grade}</span>
            </div>

            <div class="col-md-5">
                <p class="fw-semibold fs-5 mb-2">${data.verdict}</p>
                <div class="progress mb-3" style="height:12px">
                    <div class="progress-bar bg-${color}" style="width:${pct}%" role="progressbar"></div>
                </div>
                <div class="row text-center g-2 small">
                    <div class="col-4">
                        <div class="text-success fw-bold">+${breakdown.demand_contribution}</div>
                        <div class="text-muted">Demand</div>
                    </div>
                    <div class="col-4">
                        <div class="text-success fw-bold">+${breakdown.skill_contribution}</div>
                        <div class="text-muted">Skill</div>
                    </div>
                    <div class="col-4">
                        <div class="text-danger fw-bold">-${breakdown.competition_penalty}</div>
                        <div class="text-muted">Competition</div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card bg-dark border-${color}">
                    <div class="card-body small">
                        <h6 class="fw-bold text-${color}">Next Step</h6>
                        ${data.grade === 'A'
                            ? `<p class="mb-2">Strong signal! Head to <a href="plan.html" class="text-info">Plan</a> to build your roadmap.</p>`
                            : data.grade === 'B'
                            ? `<p class="mb-2">Good potential. Run a deeper <a href="analysis.html" class="text-info">Analysis</a> first.</p>`
                            : data.grade === 'C'
                            ? `<p class="mb-2">Worth refining. Try <a href="ideas.html" class="text-info">Ideas</a> to find a stronger angle.</p>`
                            : `<p class="mb-2">High risk. Use <a href="ideas.html" class="text-info">Ideas</a> to explore alternatives.</p>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}
