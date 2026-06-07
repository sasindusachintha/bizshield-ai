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
const normalizeBtn = document.getElementById('btn-normalize');
const normalizeContent = document.getElementById('normalize-content');
const rankList = document.getElementById('rank-list');
const addIdeaBtn = document.getElementById('btn-add-idea');
const rankBtn = document.getElementById('btn-rank');
const rankContent = document.getElementById('rank-content');

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

normalizeBtn.addEventListener('click', async () => {
    const value = document.getElementById('input-normalize').value.trim();
    const original = normalizeBtn.innerHTML;

    if (!value) {
        showError(normalizeContent, 'Enter a raw score to normalize.');
        return;
    }

    normalizeBtn.disabled = true;
    normalizeBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Normalizing...';

    try {
        const data = await callAPI('/normalize-score', { value });
        renderNormalizedScore(data);
    } catch (err) {
        showError(normalizeContent, err.message);
    } finally {
        normalizeBtn.disabled = false;
        normalizeBtn.innerHTML = original;
    }
});

addIdeaBtn.addEventListener('click', () => {
    rankList.insertAdjacentHTML('beforeend', createRankRow());
    rankList.lastElementChild.querySelector('.rank-name').focus();
});

rankBtn.addEventListener('click', async () => {
    const ideas = collectRankIdeas();
    const original = rankBtn.innerHTML;

    if (ideas.length === 0) {
        showError(rankContent, 'Add at least one idea with a name and score.');
        return;
    }

    rankBtn.disabled = true;
    rankBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ranking...';

    try {
        const data = await callAPI('/rank-ideas', { ideas });
        renderRankedIdeas(data.ideas);
    } catch (err) {
        showError(rankContent, err.message);
    } finally {
        rankBtn.disabled = false;
        rankBtn.innerHTML = original;
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

function renderNormalizedScore(data) {
    const color = data.was_adjusted ? 'warning' : 'success';
    const label = data.was_adjusted ? 'Adjusted' : 'Already valid';

    normalizeContent.innerHTML = `
        <div class="alert alert-${color} border-${color} mb-0">
            <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                    <div class="fw-bold">${label}</div>
                    <div class="small">Original: ${data.original}</div>
                </div>
                <div class="display-6 fw-bold mb-0">${data.normalized}</div>
            </div>
        </div>
    `;
}

function createRankRow() {
    return `
        <div class="rank-row row g-2 align-items-center">
            <div class="col-sm-8">
                <input type="text" class="form-control bg-dark text-light border-secondary rank-name"
                    placeholder="Idea name" aria-label="Idea name">
            </div>
            <div class="col-sm-4">
                <input type="number" step="0.1" class="form-control bg-dark text-light border-secondary rank-score"
                    placeholder="Score" aria-label="Idea score">
            </div>
        </div>
    `;
}

function collectRankIdeas() {
    return Array.from(rankList.querySelectorAll('.rank-row'))
        .map((row, index) => ({
            id: index + 1,
            name: row.querySelector('.rank-name').value.trim(),
            score: row.querySelector('.rank-score').value.trim()
        }))
        .filter((idea) => idea.name || idea.score);
}

function renderRankedIdeas(ideas) {
    const rows = ideas.map((idea) => `
        <tr>
            <td class="fw-bold">#${idea.rank}</td>
            <td>${escapeHTML(idea.name)}</td>
            <td>${idea.score}</td>
            <td>
                ${idea.was_adjusted
                    ? `<span class="badge bg-warning text-dark">${idea.original_score} -> ${idea.score}</span>`
                    : `<span class="badge bg-success">Valid</span>`}
            </td>
        </tr>
    `).join('');

    rankContent.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Idea</th>
                        <th>Score</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
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
