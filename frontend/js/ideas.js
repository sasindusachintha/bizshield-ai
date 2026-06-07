const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-magic me-2"></i>Generate Ideas';

btn.addEventListener('click', async () => {
    const skills   = document.getElementById('input-skills').value.trim();
    const interest = document.getElementById('input-interest').value.trim();
    const budget   = document.getElementById('input-budget').value.trim();

    if (!skills || !interest) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Please fill in both <strong>Skills</strong> and <strong>Interest</strong> fields.
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
    showLoading(boardContent, 'AI is crafting your personalised business ideas…');

    try {
        const data = await callAPI('/generate-ideas', { skills, interest, budget });
        renderIdeas(data.ideas);
    } catch (err) {
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderIdeas(ideas) {
    if (!ideas || ideas.length === 0) {
        boardContent.innerHTML = '<div class="alert alert-secondary">No ideas returned. Please try again.</div>';
        return;
    }

    const cards = ideas.map((idea, i) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card bg-dark border-secondary h-100">
                <div class="card-header border-secondary d-flex align-items-center justify-content-between">
                    <span class="badge bg-primary">#${idea.id || i + 1}</span>
                    <small class="text-muted"><i class="fas fa-clock me-1"></i>${idea.time_to_profit}</small>
                </div>
                <div class="card-body">
                    <h5 class="card-title fw-bold mb-1">${idea.name}</h5>
                    <p class="text-muted small mb-3">${idea.description}</p>
                    <div class="bg-dark border border-secondary rounded p-2 small mb-3">
                        <strong class="text-success"><i class="fas fa-check-circle me-1"></i>Why it fits:</strong>
                        <br>${idea.why_it_fits}
                    </div>
                </div>
                <div class="card-footer border-secondary d-flex justify-content-between align-items-center">
                    <span class="badge bg-secondary"><i class="fas fa-dollar-sign me-1"></i>${idea.startup_cost}</span>
                    <a href="analysis.html" class="btn btn-sm btn-outline-primary"
                       onclick="sessionStorage.setItem('idea','${idea.name.replace(/'/g,"\\'")}')">
                        Analyse <i class="fas fa-arrow-right ms-1"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    boardContent.innerHTML = `
        <h5 class="mb-3 fw-semibold text-light">
            <i class="fas fa-star text-warning me-2"></i>Your 5 Business Ideas
        </h5>
        <div class="row">${cards}</div>
        <p class="text-muted small text-center mt-2">
            Click <em>Analyse</em> on any card to get a deep-dive on that idea.
        </p>
    `;
}
