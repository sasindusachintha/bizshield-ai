const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-magic me-2"></i>Generate Ideas';
let renderedIdeas = [];

/* ─────────────────────────────────────────────
   SKILL SELECTION — predefined list + custom add
───────────────────────────────────────────── */
const SKILL_OPTIONS = [
    'Web Development', 'Mobile App Development', 'Graphic Design', 'UI/UX Design',
    'Copywriting', 'Content Writing', 'Video Editing', 'Photography',
    'Digital Marketing', 'SEO', 'Social Media Management', 'Sales',
    'Finance & Accounting', 'Data Analysis', 'Programming', 'Teaching / Tutoring',
    'Cooking / Baking', 'Fitness Training', 'Consulting', 'Translation',
    'Customer Service', 'Project Management', 'Illustration', 'Music Production',
    'Event Planning', 'Handmade Crafts', 'Fashion Design', 'Public Speaking',
    'Carpentry / Handyman Skills', 'Agriculture / Farming'
];

const selectedSkills   = new Set();
const skillChipList    = document.getElementById('skills-chip-list');
const hiddenSkillsInput = document.getElementById('input-skills');
const customSkillInput = document.getElementById('input-custom-skill');
const addSkillBtn      = document.getElementById('btn-add-skill');

function syncSkillsInput() {
    if (hiddenSkillsInput) hiddenSkillsInput.value = Array.from(selectedSkills).join(', ');
}

function renderSkillChips() {
    if (!skillChipList) return;

    const listedChips = SKILL_OPTIONS.map(skill => `
        <span class="skill-chip${selectedSkills.has(skill) ? ' active' : ''}" data-skill="${escapeHTML(skill)}">
            ${escapeHTML(skill)}
        </span>
    `).join('');

    const customChips = Array.from(selectedSkills)
        .filter(skill => !SKILL_OPTIONS.includes(skill))
        .map(skill => `
            <span class="skill-chip active custom-skill" data-skill="${escapeHTML(skill)}">
                ${escapeHTML(skill)} <i class="fas fa-xmark"></i>
            </span>
        `).join('');

    skillChipList.innerHTML = listedChips + customChips;
    syncSkillsInput();
}

if (skillChipList) {
    skillChipList.addEventListener('click', (event) => {
        const chip = event.target.closest('.skill-chip');
        if (!chip) return;
        const skill = chip.dataset.skill;
        if (selectedSkills.has(skill)) {
            selectedSkills.delete(skill);
        } else {
            selectedSkills.add(skill);
        }
        renderSkillChips();
    });
}

function addCustomSkill() {
    if (!customSkillInput) return;
    const value = customSkillInput.value.trim();
    if (!value) return;
    selectedSkills.add(value);
    customSkillInput.value = '';
    renderSkillChips();
    customSkillInput.focus();
}

addSkillBtn?.addEventListener('click', addCustomSkill);
customSkillInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addCustomSkill();
    }
});

renderSkillChips();

/* ─────────────────────────────────────────────
   NICHE / INTEREST SELECTION — predefined list + custom add
───────────────────────────────────────────── */
const NICHE_OPTIONS = [
    'Health & Wellness', 'SaaS / Software Tools', 'E-commerce', 'Education / EdTech',
    'Food & Beverage', 'Fashion & Apparel', 'Beauty & Personal Care', 'Fitness',
    'Finance / FinTech', 'Travel & Tourism', 'Real Estate', 'Home & Interior',
    'Pet Care', 'Sustainability / Eco-friendly', 'Agriculture', 'Logistics & Delivery',
    'Entertainment & Media', 'Gaming', 'Parenting & Childcare', 'Senior Care',
    'B2B Services', 'Handmade / Crafts', 'Automotive', 'Event Planning',
    'Photography / Videography', 'Consulting', 'Non-profit / Social Impact',
    'Local Services', 'Subscription Boxes', 'AI & Emerging Tech'
];

const selectedNiches   = new Set();
const nicheChipList    = document.getElementById('niches-chip-list');
const hiddenNicheInput = document.getElementById('input-interest');
const customNicheInput = document.getElementById('input-custom-niche');
const addNicheBtn      = document.getElementById('btn-add-niche');

function syncNichesInput() {
    if (hiddenNicheInput) hiddenNicheInput.value = Array.from(selectedNiches).join(', ');
}

function renderNicheChips() {
    if (!nicheChipList) return;

    const listedChips = NICHE_OPTIONS.map(niche => `
        <span class="skill-chip${selectedNiches.has(niche) ? ' active' : ''}" data-niche="${escapeHTML(niche)}">
            ${escapeHTML(niche)}
        </span>
    `).join('');

    const customChips = Array.from(selectedNiches)
        .filter(niche => !NICHE_OPTIONS.includes(niche))
        .map(niche => `
            <span class="skill-chip active custom-skill" data-niche="${escapeHTML(niche)}">
                ${escapeHTML(niche)} <i class="fas fa-xmark"></i>
            </span>
        `).join('');

    nicheChipList.innerHTML = listedChips + customChips;
    syncNichesInput();
}

if (nicheChipList) {
    nicheChipList.addEventListener('click', (event) => {
        const chip = event.target.closest('.skill-chip');
        if (!chip) return;
        const niche = chip.dataset.niche;
        if (selectedNiches.has(niche)) {
            selectedNiches.delete(niche);
        } else {
            selectedNiches.add(niche);
        }
        renderNicheChips();
    });
}

function addCustomNiche() {
    if (!customNicheInput) return;
    const value = customNicheInput.value.trim();
    if (!value) return;
    selectedNiches.add(value);
    customNicheInput.value = '';
    renderNicheChips();
    customNicheInput.focus();
}

addNicheBtn?.addEventListener('click', addCustomNiche);
customNicheInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        addCustomNiche();
    }
});

renderNicheChips();

function getIdeasCurrency() {
    return typeof window.getBSCurrency === 'function' ? window.getBSCurrency() : 'USD';
}

function getIdeasCurrencySymbol(currency = getIdeasCurrency()) {
    if (typeof window.getBSCurrencySymbol === 'function') return window.getBSCurrencySymbol(currency);
    return ({ USD: '$', LKR: 'Rs.', EUR: '\u20ac', GBP: '\u00a3', INR: '\u20b9' })[currency] || currency;
}

function updateIdeasCurrencyUI() {
    const currency = getIdeasCurrency();
    const budgetSymbol = document.getElementById('budget-currency-symbol');
    if (budgetSymbol) budgetSymbol.textContent = getIdeasCurrencySymbol(currency);

    if (window.patchCurrencyInElement) window.patchCurrencyInElement(boardContent, currency);
}

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

btn.addEventListener('click', async (event) => {
    event?.preventDefault();
    const skills   = document.getElementById('input-skills').value.trim();
    const interest = document.getElementById('input-interest').value.trim();
    const budget   = document.getElementById('input-budget').value.trim();

    if (!skills || !interest) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Please select at least one <strong>Skill</strong> and one <strong>Niche / Interest</strong> (or add your own).
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
                    <span class="badge bg-secondary"><i class="fas fa-coins me-1"></i>${escapeHTML(idea.startup_cost || 'Cost TBD')}</span>
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
    updateIdeasCurrencyUI();
}

document.addEventListener('DOMContentLoaded', updateIdeasCurrencyUI);
document.addEventListener('bizshield:currencyChange', updateIdeasCurrencyUI);
document.addEventListener('bizshield:ratesReady', updateIdeasCurrencyUI);

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
