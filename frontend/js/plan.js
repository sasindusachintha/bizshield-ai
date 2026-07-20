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
                `${business} සඳහා ප්‍රධාන offer එක එක් වාක්‍යයකින් පැහැදිලි කරන්න: පාරිභෝගික ගැටලුව, ලබාදෙන ප්‍රතිඵලය, සහ ඊළඟ ක්‍රියාව.`,
                'ඉලක්ක පාරිභෝගිකයින් 10 දෙනෙකු සමඟ කතා කර ඔවුන්ගේ වේදනා ලක්ෂ්‍ය, මිලදී ගැනීමේ බාධක, සහ තීරණ හේතු සටහන් කරන්න.',
                'Offer එක, ප්‍රතිලාභ, මිල පරාසය, සහ contact form එකක් සහිත සරල landing page එකක් සකසන්න.',
                'ගැටලුව, විසඳුම, සහ ප්‍රායෝගික ප්‍රතිඵලය පෙන්වන proof-focused content පළ කරන්න.',
                'වැඩි automation හෝ වියදම් කිරීමට පෙර අතින් ක්‍රියාත්මක කළ හැකි කුඩා pilot එකක් ක්‍රියාත්මක කරන්න.'
            ],
            firstCustomers: [
                'ගැටලුව දැනටමත් පෙනෙන warm contacts, local communities, LinkedIn connections, සහ niche groups වෙතින් ආරම්භ කරන්න.',
                'මුල් පාරිභෝගිකයින්ට direct support, වේගවත් onboarding, සහ පැහැදිලි success milestone එකක් සහිත package එකක් ලබාදෙන්න.',
                'ඉහළ ගැළපුමක් ඇති prospects 50 දෙනෙකුගේ ලැයිස්තුවක් සාදා එක් business outcome එකක් මත outreach කරන්න.',
                'Discovery calls paid pilots බවට පත් කිරීමට customer goal, timeline, සහ decision maker පැහැදිලි කරන්න.',
                'මුල් පාරිභෝගික ප්‍රතිඵල testimonials, case studies, සහ referrals සඳහා භාවිතා කරන්න.'
            ],
            riskMitigation: [
                'ගැඹුරු build කිරීමකට පෙර deposit, pilot commitment, හෝ written intent මගින් ගෙවීමට ඇති සූදානම තහවුරු කරන්න.',
                'Customer acquisition සහ delivery repeatable වන තුරු fixed costs අඩු තබන්න.',
                'Conversion rate, acquisition cost, support issues, churn signals, සහ delivery time සතිපතා මැන බලන්න.',
                'පාරිභෝගික පොරොන්දු සහ delivery steps ලේඛනගත කර අධික පොරොන්දු වීම වළක්වන්න.',
                'ප්‍රධාන outreach channel එක අස්ථාවර වුවහොත් backup acquisition channel එකක් සූදානම් කරන්න.'
            ],
            criticalSuccessFactors: [
                'ඉක්මන් සහ වැදගත් ගැටලුවක් ඇති narrow target customer segment එකක්.',
                'තත්පර කිහිපයකින් තේරුම් ගත හැකි පැහැදිලි value proposition එකක්.',
                'අනුමාන වෙනුවට සැබෑ පාරිභෝගික feedback මත වේගවත් ඉගෙනීම.',
                'සතිපතා outreach, follow-up, delivery, සහ measurement නිරන්තරව කිරීම.',
                'Testimonials, demos, pilot results, හෝ case studies වැනි proof assets.'
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

// Pre-fill and auto-generate if coming from Analysis page
window.addEventListener('DOMContentLoaded', () => {
    const savedIdea = sessionStorage.getItem('idea');
    const shouldAutoGenerate = sessionStorage.getItem('autoGeneratePlan') === 'true';

    if (savedIdea) {
        document.getElementById('input-idea').value = savedIdea;
        sessionStorage.removeItem('idea');
    }

    if (shouldAutoGenerate) {
        sessionStorage.removeItem('autoGeneratePlan');
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

        ${(plan.success_tips.length || weeklyTemplate.length) ? `
            <div class="row g-3 mt-1">
                ${plan.success_tips.length ? `
                    <div class="${weeklyTemplate.length ? 'col-lg-7' : 'col-12'}">
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
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${weeklyTemplate.length ? `
                    <div class="col-lg-5">
                        <div class="card bg-dark border-secondary h-100">
                            <div class="card-header border-secondary">
                                <h6 class="mb-0 fw-bold"><i class="fas fa-clipboard-check text-info me-2"></i>Weekly Progress Tracker</h6>
                            </div>
                            <div class="card-body">
                                <div class="d-flex flex-column gap-2">
                                    ${weeklyTemplate.map(([label, value]) => `
                                        <div class="p-2 border border-secondary rounded small">
                                            <div class="fw-semibold text-capitalize">${escapeHTML(label.replace(/_/g, ' '))}</div>
                                            <div class="text-muted">${escapeHTML(value)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : ''}

        <!-- Next step suggestion -->
        <div class="alert alert-dark border-secondary mt-4 d-flex flex-wrap align-items-center gap-3">
            <i class="fas fa-arrow-right text-warning fs-4"></i>
            <span class="flex-grow-1">${t('Plan looking solid? Turn it into a marketing content kit next.')}</span>
            <button type="button" id="btn-continue-marketing" class="btn btn-sm btn-outline-warning">
                <i class="fas fa-bullhorn me-1"></i>${t('Create Marketing Kit')}
            </button>
        </div>
    `;
    if (window.patchCurrencyInElement) window.patchCurrencyInElement(boardContent, window.getBSCurrency());
}

boardContent.addEventListener('click', async (event) => {
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