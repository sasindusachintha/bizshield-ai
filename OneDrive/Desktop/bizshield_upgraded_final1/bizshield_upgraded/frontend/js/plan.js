const btn = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const t = (text) => (typeof bsT === 'function' ? bsT(text) : text);
const originalLabel = () => `<i class="fas fa-road me-2"></i>${t('Generate Plan')}`;
let latestPlanContent = null;

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderList(items, icon = 'fa-check-circle', color = 'text-success') {
    const safeItems = Array.isArray(items) ? items : [];
    if (!safeItems.length) return `<p class="text-muted small mb-0">${t('No data available')}</p>`;

    return `
        <ul class="list-unstyled mb-0 small">
            ${safeItems.map(item => `
                <li class="mb-2">
                    <i class="fas ${icon} ${color} me-2"></i>${escapeHTML(formatListItem(item))}
                </li>`).join('')}
        </ul>
    `;
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

function formatListItem(item) {
    if (item && typeof item === 'object') {
        return item.text || item.title || item.description || item.summary || item.action || JSON.stringify(item);
    }
    return item ?? '';
}

function fallbackBusinessPlanPoints(idea) {
    const business = idea || 'this business';
    if (typeof getBSLanguage === 'function' && getBSLanguage() === 'si') {
        return {
            quickWins: [
                `${business} à·ƒà¶³à·„à· à¶´à·Šâ€à¶»à¶°à·à¶± offer à¶‘à¶š à¶‘à¶šà·Š à·€à·à¶šà·Šâ€à¶ºà¶ºà¶šà·’à¶±à·Š à¶´à·à·„à·à¶¯à·’à¶½à·’ à¶šà¶»à¶±à·Šà¶±: à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶œà·à¶§à¶½à·”à·€, à¶½à¶¶à·à¶¯à·™à¶± à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½à¶º, à·ƒà·„ à¶Šà·…à¶Ÿ à¶šà·Šâ€à¶»à·’à¶ºà·à·€.`,
                'à¶‰à¶½à¶šà·Šà¶š à¶´à·à¶»à·’à¶·à·à¶œà·’à¶šà¶ºà·’à¶±à·Š 10 à¶¯à·™à¶±à·™à¶šà·” à·ƒà¶¸à¶Ÿ à¶šà¶­à· à¶šà¶» à¶”à·€à·”à¶±à·Šà¶œà·š à·€à·šà¶¯à¶±à· à¶½à¶šà·Šà·‚à·Šâ€à¶º, à¶¸à·’à¶½à¶¯à·“ à¶œà·à¶±à·“à¶¸à·š à¶¶à·à¶°à¶š, à·ƒà·„ à¶­à·“à¶»à¶« à·„à·šà¶­à·” à·ƒà¶§à·„à¶±à·Š à¶šà¶»à¶±à·Šà¶±.',
                'Offer à¶‘à¶š, à¶´à·Šâ€à¶»à¶­à·’à¶½à·à¶·, à¶¸à·’à¶½ à¶´à¶»à·à·ƒà¶º, à·ƒà·„ contact form à¶‘à¶šà¶šà·Š à·ƒà·„à·’à¶­ à·ƒà¶»à¶½ landing page à¶‘à¶šà¶šà·Š à·ƒà¶šà·ƒà¶±à·Šà¶±.',
                'à¶œà·à¶§à¶½à·”à·€, à·€à·’à·ƒà¶³à·”à¶¸, à·ƒà·„ à¶´à·Šâ€à¶»à·à¶ºà·à¶œà·’à¶š à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½à¶º à¶´à·™à¶±à·Šà·€à¶± proof-focused content à¶´à·… à¶šà¶»à¶±à·Šà¶±.',
                'à·€à·à¶©à·’ automation à·„à· à·€à·’à¶ºà¶¯à¶¸à·Š à¶šà·’à¶»à·“à¶¸à¶§ à¶´à·™à¶» à¶…à¶­à·’à¶±à·Š à¶šà·Šâ€à¶»à·’à¶ºà·à¶­à·Šà¶¸à¶š à¶šà·… à·„à·à¶šà·’ à¶šà·”à¶©à· pilot à¶‘à¶šà¶šà·Š à¶šà·Šâ€à¶»à·’à¶ºà·à¶­à·Šà¶¸à¶š à¶šà¶»à¶±à·Šà¶±.'
            ],
            firstCustomers: [
                'à¶œà·à¶§à¶½à·”à·€ à¶¯à·à¶±à¶§à¶¸à¶­à·Š à¶´à·™à¶±à·™à¶± warm contacts, local communities, LinkedIn connections, à·ƒà·„ niche groups à·€à·™à¶­à·’à¶±à·Š à¶†à¶»à¶¸à·Šà¶· à¶šà¶»à¶±à·Šà¶±.',
                'à¶¸à·”à¶½à·Š à¶´à·à¶»à·’à¶·à·à¶œà·’à¶šà¶ºà·’à¶±à·Šà¶§ direct support, à·€à·šà¶œà·€à¶­à·Š onboarding, à·ƒà·„ à¶´à·à·„à·à¶¯à·’à¶½à·’ success milestone à¶‘à¶šà¶šà·Š à·ƒà·„à·’à¶­ package à¶‘à¶šà¶šà·Š à¶½à¶¶à·à¶¯à·™à¶±à·Šà¶±.',
                'à¶‰à·„à·… à¶œà·à·…à¶´à·”à¶¸à¶šà·Š à¶‡à¶­à·’ prospects 50 à¶¯à·™à¶±à·™à¶šà·”à¶œà·š à¶½à·à¶ºà·’à·ƒà·Šà¶­à·”à·€à¶šà·Š à·ƒà·à¶¯à· à¶‘à¶šà·Š business outcome à¶‘à¶šà¶šà·Š à¶¸à¶­ outreach à¶šà¶»à¶±à·Šà¶±.',
                'Discovery calls paid pilots à¶¶à·€à¶§ à¶´à¶­à·Š à¶šà·’à¶»à·“à¶¸à¶§ customer goal, timeline, à·ƒà·„ decision maker à¶´à·à·„à·à¶¯à·’à¶½à·’ à¶šà¶»à¶±à·Šà¶±.',
                'à¶¸à·”à¶½à·Š à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½ testimonials, case studies, à·ƒà·„ referrals à·ƒà¶³à·„à· à¶·à·à·€à·’à¶­à· à¶šà¶»à¶±à·Šà¶±.'
            ],
            riskMitigation: [
                'à¶œà·à¶¹à·”à¶»à·” build à¶šà·’à¶»à·“à¶¸à¶šà¶§ à¶´à·™à¶» deposit, pilot commitment, à·„à· written intent à¶¸à¶œà·’à¶±à·Š à¶œà·™à·€à·“à¶¸à¶§ à¶‡à¶­à·’ à·ƒà·–à¶¯à·à¶±à¶¸ à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶±à·Šà¶±.',
                'Customer acquisition à·ƒà·„ delivery repeatable à·€à¶± à¶­à·”à¶»à·” fixed costs à¶…à¶©à·” à¶­à¶¶à¶±à·Šà¶±.',
                'Conversion rate, acquisition cost, support issues, churn signals, à·ƒà·„ delivery time à·ƒà¶­à·’à¶´à¶­à· à¶¸à·à¶± à¶¶à¶½à¶±à·Šà¶±.',
                'à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶´à·œà¶»à·œà¶±à·Šà¶¯à·” à·ƒà·„ delivery steps à¶½à·šà¶›à¶±à¶œà¶­ à¶šà¶» à¶…à¶°à·’à¶š à¶´à·œà¶»à·œà¶±à·Šà¶¯à·” à·€à·“à¶¸ à·€à·…à¶šà·Šà·€à¶±à·Šà¶±.',
                'à¶´à·Šâ€à¶»à¶°à·à¶± outreach channel à¶‘à¶š à¶…à·ƒà·Šà¶®à·à·€à¶» à·€à·”à·€à·„à·œà¶­à·Š backup acquisition channel à¶‘à¶šà¶šà·Š à·ƒà·–à¶¯à·à¶±à¶¸à·Š à¶šà¶»à¶±à·Šà¶±.'
            ],
            criticalSuccessFactors: [
                'à¶‰à¶šà·Šà¶¸à¶±à·Š à·ƒà·„ à·€à·à¶¯à¶œà¶­à·Š à¶œà·à¶§à¶½à·”à·€à¶šà·Š à¶‡à¶­à·’ narrow target customer segment à¶‘à¶šà¶šà·Š.',
                'à¶­à¶­à·Šà¶´à¶» à¶šà·’à·„à·’à¶´à¶ºà¶šà·’à¶±à·Š à¶­à·šà¶»à·”à¶¸à·Š à¶œà¶­ à·„à·à¶šà·’ à¶´à·à·„à·à¶¯à·’à¶½à·’ value proposition à¶‘à¶šà¶šà·Š.',
                'à¶…à¶±à·”à¶¸à·à¶± à·€à·™à¶±à·”à·€à¶§ à·ƒà·à¶¶à·‘ à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š feedback à¶¸à¶­ à·€à·šà¶œà·€à¶­à·Š à¶‰à¶œà·™à¶±à·“à¶¸.',
                'à·ƒà¶­à·’à¶´à¶­à· outreach, follow-up, delivery, à·ƒà·„ measurement à¶±à·’à¶»à¶±à·Šà¶­à¶»à·€ à¶šà·’à¶»à·“à¶¸.',
                'Testimonials, demos, pilot results, à·„à· case studies à·€à·à¶±à·’ proof assets.'
            ],
        };
    }
    return {
        quickWins: [
            `Clarify the core offer for ${business} in one sentence, including the customer problem, result promised, and first call to action.`,
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

btn.addEventListener('click', async () => {
    const idea = document.getElementById('input-idea').value.trim();

    if (!idea) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${t('Please enter a business idea first.')}
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('Building plan...')}`;
    showLoading(boardContent, t('Building your personalised launch roadmap...'));

    try {
        const data = await callAPI('/generate-plan', { idea });
        console.log('GENERATE-PLAN RESPONSE:', data);
        renderPlan(data);
    } catch (err) {
        console.error('ERROR in generate-plan:', err);
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel();
    }
});

function renderPlan(data) {
    const idea = document.getElementById('input-idea')?.value.trim() || '';
    const fallback = fallbackBusinessPlanPoints(idea);
    const quickWins = asArray(data?.quickWins, data?.quick_wins, fallback.quickWins);
    const firstCustomers = asArray(data?.firstCustomers, data?.first_customers, data?.first_customers_strategy, fallback.firstCustomers);
    const riskMitigation = asArray(data?.riskMitigation, data?.risk_mitigation, fallback.riskMitigation);
    const criticalSuccessFactors = asArray(data?.criticalSuccessFactors, data?.critical_success_factors, fallback.criticalSuccessFactors);
    const plan = {
        source_idea: idea,
        setup_steps: data?.setup_steps || [],
        plan_7_day: data?.plan_7_day || [],
        plan_30_day: data?.plan_30_day || [],
        executiveSummary: asArray(data?.executiveSummary, data?.executive_summary),
        businessOpportunity: asArray(data?.businessOpportunity, data?.business_opportunity),
        targetAudience: asArray(data?.targetAudience, data?.target_audience),
        revenueModel: asArray(data?.revenueModel, data?.revenue_model),
        growthStrategy: asArray(data?.growthStrategy, data?.growth_strategy),
        quickWins,
        firstCustomers,
        riskMitigation,
        criticalSuccessFactors,
        quick_wins: quickWins,
        critical_success_factors: criticalSuccessFactors,
        risk_mitigation: riskMitigation.join(' '),
        first_customers_strategy: firstCustomers.join(' '),
        success_tips: data?.success_tips || [],
        weekly_progress_template: data?.weekly_progress_template || null
    };
    latestPlanContent = plan;
    const canSavePlan = typeof isLoggedIn === 'function' && isLoggedIn();

    console.log('SAFE PLAN DATA:', plan);

    const weeklyTemplate = plan.weekly_progress_template && typeof plan.weekly_progress_template === 'object'
        ? Object.entries(plan.weekly_progress_template)
        : [];

    boardContent.innerHTML = `
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
            <h5 class="mb-0 fw-semibold"><i class="fas fa-route text-success me-2"></i>${t('Your Launch Roadmap')}</h5>
            ${canSavePlan ? `
                <button type="button" id="btn-save-plan" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-bookmark me-1"></i>${t('Save Plan')}
                </button>
            ` : `
                <a href="login.html" class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-right-to-bracket me-1"></i>${t('Log in to save')}
                </a>
            `}
            <div id="plan-save-status" class="small text-muted w-100"></div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-6">
                <div class="card bg-dark border-success h-100">
                    <div class="card-header border-success">
                        <h6 class="mb-0 fw-bold text-success"><i class="fas fa-bolt me-2"></i>Quick Wins</h6>
                    </div>
                    <div class="card-body">
                        ${renderList(plan.quickWins, 'fa-bolt', 'text-warning')}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-dark border-info h-100">
                    <div class="card-header border-info">
                        <h6 class="mb-0 fw-bold text-info"><i class="fas fa-users me-2"></i>First Customers Strategy</h6>
                    </div>
                    <div class="card-body">
                        ${renderList(plan.firstCustomers, 'fa-user-plus', 'text-info')}
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-list-ol text-warning me-2"></i>Setup Steps</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${plan.setup_steps.map(step => `
                        <div class="col-md-6">
                            <div class="d-flex gap-3 p-3 border border-secondary rounded h-100">
                                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                     style="width:36px;height:36px;font-weight:700">${escapeHTML(step.step)}</div>
                                <div>
                                    <div class="fw-semibold">${escapeHTML(step.title)}</div>
                                    <div class="text-muted small">${escapeHTML(step.description)}</div>
                                    <div class="d-flex flex-wrap gap-2 mt-2">
                                        ${step.cost ? `<span class="badge bg-secondary">${escapeHTML(step.cost)}</span>` : ''}
                                        ${step.timeline ? `<span class="badge bg-dark border border-secondary">${escapeHTML(step.timeline)}</span>` : ''}
                                    </div>
                                    ${renderDetail('Dependencies', step.dependencies)}
                                    ${renderDetail('Owner', step.responsible)}
                                </div>
                            </div>
                        </div>
                    `).join('') || '<p class="text-muted mb-0">No setup steps provided.</p>'}
                </div>
            </div>
        </div>

        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-calendar-week text-info me-2"></i>7-Day Sprint</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${plan.plan_7_day.map(block => `
                        <div class="col-md-6">
                            <div class="p-3 border border-secondary rounded h-100">
                                <div class="d-flex align-items-center gap-2 mb-2">
                                    <span class="badge bg-info text-dark">${escapeHTML(block.day)}</span>
                                    <span class="fw-semibold small">${escapeHTML(block.focus)}</span>
                                </div>
                                ${renderList(block?.tasks || [])}
                                ${renderDetail('Deliverable', block.deliverable)}
                                ${renderDetail('Success metric', block.success_metric)}
                                ${renderDetail('Contingency', block.contingency)}
                            </div>
                        </div>
                    `).join('') || '<p class="text-muted mb-0">No 7-day sprint provided.</p>'}
                </div>
            </div>
        </div>

        <div class="card bg-dark border-secondary mb-4">
            <div class="card-header border-secondary">
                <h6 class="mb-0 fw-bold"><i class="fas fa-calendar-alt text-primary me-2"></i>30-Day Milestones</h6>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    ${plan.plan_30_day.map(week => `
                        <div class="col-md-6 col-lg-3">
                            <div class="p-3 border border-secondary rounded h-100">
                                <div class="badge bg-primary mb-2">${escapeHTML(week.week)}</div>
                                <div class="fw-semibold mb-2 small">${escapeHTML(week.goal)}</div>
                                ${renderList(week?.milestones || [], 'fa-flag', 'text-warning')}
                                ${renderDetail('Resources', week.resources_needed)}
                                ${renderDetail('Expected outcome', week.expected_outcome)}
                                ${renderDetail('Progress check', week.progress_check)}
                            </div>
                        </div>
                    `).join('') || '<p class="text-muted mb-0">No 30-day milestones provided.</p>'}
                </div>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-lg-6">
                <div class="card bg-dark border-danger h-100">
                    <div class="card-header border-danger">
                        <h6 class="mb-0 fw-bold text-danger"><i class="fas fa-shield-alt me-2"></i>Risk Mitigation</h6>
                    </div>
                    <div class="card-body">
                        ${renderList(plan.riskMitigation, 'fa-shield-alt', 'text-danger')}
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card bg-dark border-success h-100">
                    <div class="card-header border-success">
                        <h6 class="mb-0 fw-bold text-success"><i class="fas fa-star me-2"></i>Critical Success Factors</h6>
                    </div>
                    <div class="card-body">
                        ${renderList(plan.criticalSuccessFactors, 'fa-star', 'text-success')}
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-3 mt-1">
            <div class="col-lg-7">
                <div class="card bg-dark border-success h-100">
                    <div class="card-header border-success">
                        <h6 class="mb-0 fw-bold text-success"><i class="fas fa-lightbulb me-2"></i>Success Tips</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-2">
                            ${plan.success_tips.map(tip => `
                                <div class="col-md-6">
                                    <div class="d-flex gap-2 p-2 border border-secondary rounded small h-100">
                                        <i class="fas fa-lightbulb text-warning mt-1 flex-shrink-0"></i>
                                        <span>${escapeHTML(tip)}</span>
                                    </div>
                                </div>
                            `).join('') || '<p class="text-muted mb-0">No success tips provided.</p>'}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-clipboard-check text-info me-2"></i>Weekly Progress Tracker</h6>
                    </div>
                    <div class="card-body">
                        ${weeklyTemplate.length ? `
                            <div class="d-flex flex-column gap-2">
                                ${weeklyTemplate.map(([label, value]) => `
                                    <div class="p-2 border border-secondary rounded small">
                                        <div class="fw-semibold text-capitalize">${escapeHTML(label.replace(/_/g, ' '))}</div>
                                        <div class="text-muted">${escapeHTML(value)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted small mb-0">No progress template provided.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    if (window.patchCurrencyInElement) window.patchCurrencyInElement(boardContent, window.getBSCurrency());
}

boardContent.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('#btn-save-plan');
    if (!saveButton || !latestPlanContent) return;

    const status = document.getElementById('plan-save-status');
    const originalSaveLabel = saveButton.innerHTML;

    saveButton.disabled = true;
    saveButton.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t('Saving')}`;
    if (status) status.textContent = '';

    try {
        await promptAndSaveToProject({
            type: 'business-model',
            title: 'Business Plan',
            content: latestPlanContent
        });
        saveButton.innerHTML = `<i class="fas fa-check me-1"></i>${t('Saved')}`;
        if (status) {
            status.className = 'small text-success w-100';
            status.textContent = 'Business plan saved to your project.';
        }
    } catch (error) {
        saveButton.disabled = false;
        saveButton.innerHTML = originalSaveLabel;
        if (status) {
            status.className = 'small text-danger w-100';
            status.textContent = error.message;
        }
    }
});





