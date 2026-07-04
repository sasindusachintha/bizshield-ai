const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-magic me-2"></i>Generate Ideas';
let renderedIdeas = [];

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildIdeaAnalysisText(idea) {
    const parts = [
        idea?.name,
        idea?.description,
        idea?.why_it_fits ? `Why it fits: ${idea.why_it_fits}` : '',
        idea?.startup_cost ? `Startup cost: ${idea.startup_cost}` : '',
        idea?.time_to_profit ? `Time to profit: ${idea.time_to_profit}` : '',
        idea?.score ? `Idea score: ${idea.score}/10` : ''
    ];

    return parts.filter(Boolean).join('\n\n');
}

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
        const ideas = data?.ideas || [];
        console.log('📋 RENDER IDEAS - Ideas array:', ideas);
        renderIdeas(ideas);
    } catch (err) {
        console.error('💥 ERROR in generate-ideas:', err);
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
    }
});

function renderIdeas(ideas) {
    const safeIdeas = Array.isArray(ideas) ? ideas : [];
    renderedIdeas = safeIdeas;
    const canSaveIdeas = typeof isLoggedIn === 'function' && isLoggedIn();

    if (!safeIdeas || safeIdeas.length === 0) {
        boardContent.innerHTML = '<div class="alert alert-secondary">No ideas returned. Please try again.</div>';
        return;
    }

    const cards = safeIdeas.map((idea, i) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card bg-dark border-secondary h-100">
                <div class="card-header border-secondary d-flex align-items-center justify-content-between">
                    <span class="badge bg-primary">#${escapeHTML(idea.id || i + 1)}</span>
                    <small class="text-muted"><i class="fas fa-clock me-1"></i>${escapeHTML(idea.time_to_profit || 'Timeline TBD')}</small>
                </div>
                <div class="card-body">
                    <h5 class="card-title fw-bold mb-1">${escapeHTML(idea.name || 'Untitled idea')}</h5>
                    <p class="text-muted small mb-3">${escapeHTML(idea.description || 'No description provided.')}</p>
                    <div class="bg-dark border border-secondary rounded p-2 small mb-3">
                        <strong class="text-success"><i class="fas fa-check-circle me-1"></i>Why it fits:</strong>
                        <br>${escapeHTML(idea.why_it_fits || 'No fit explanation provided.')}
                    </div>
                </div>
                <div class="card-footer border-secondary d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <span class="badge bg-secondary"><i class="fas fa-dollar-sign me-1"></i>${escapeHTML(idea.startup_cost || 'Cost TBD')}</span>
                    <span class="badge bg-warning text-dark"><i class="fas fa-lightbulb me-1"></i>Score: ${escapeHTML(idea.score || 'N/A')}/10</span>
                    ${canSaveIdeas ? `
                        <button type="button" class="btn btn-sm btn-outline-success btn-save-idea js-save-idea" data-idea-index="${i}">
                            <i class="fas fa-bookmark me-1"></i>Save Idea
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-sm btn-outline-warning js-analyze-idea" data-idea-index="${i}">
                        <i class="fas fa-search me-1"></i>Analyse <i class="fas fa-arrow-right ms-1"></i>
                    </button>
                    <div class="idea-save-status text-muted" data-save-status="${i}"></div>
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
            ${canSaveIdeas ? 'Use <em>Save Idea</em> to keep the best options in your account.' : 'Log in to save ideas to your account.'}
        </p>
    `;
    // Apply currency conversion to any $ amounts in the rendered output
    if (window.patchCurrencyInElement) window.patchCurrencyInElement(boardContent, window.getBSCurrency());
}

boardContent.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('.js-save-idea');
    if (saveButton) {
        const idea = renderedIdeas[Number(saveButton.dataset.ideaIndex)];
        const status = boardContent.querySelector(`[data-save-status="${saveButton.dataset.ideaIndex}"]`);

        if (!idea) return;

        const payload = {
            title: idea.name || 'Untitled idea',
            description: buildIdeaAnalysisText(idea),
            score: idea.score || null
        };

        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving';
        if (status) status.textContent = '';

        try {
            await saveIdea(payload);
            saveButton.innerHTML = '<i class="fas fa-check me-1"></i>Saved';
            if (status) {
                status.className = 'idea-save-status text-success';
                status.textContent = 'Saved to your account.';
            }
        } catch (error) {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-bookmark me-1"></i>Save Idea';
            if (status) {
                status.className = 'idea-save-status text-danger';
                status.textContent = error.message;
            }
        }
        return;
    }

    const analyzeButton = event.target.closest('.js-analyze-idea');
    if (!analyzeButton) return;

    const idea = renderedIdeas[Number(analyzeButton.dataset.ideaIndex)];
    if (!idea) return;

    const ideaForAnalysis = {
        id: idea.id,
        name: idea.name || 'Untitled idea',
        description: idea.description || '',
        why_it_fits: idea.why_it_fits || '',
        startup_cost: idea.startup_cost || '',
        time_to_profit: idea.time_to_profit || '',
        score: idea.score || ''
    };

    sessionStorage.setItem('idea', buildIdeaAnalysisText(ideaForAnalysis));
    sessionStorage.setItem('ideaCard', JSON.stringify(ideaForAnalysis));
    sessionStorage.setItem('autoAnalyzeIdea', 'true');
    window.location.href = 'analysis.html';
});
