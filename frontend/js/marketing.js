const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const t = (text) => (typeof bsT === 'function' ? bsT(text) : text);
const originalLabel = () => `<i class="fas fa-paper-plane me-2"></i>${t('Generate Marketing Kit')}`;
let latestMarketingContent = null;

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Pre-fill and auto-generate if coming from Analysis or Plan page
window.addEventListener('DOMContentLoaded', () => {
    const savedIdea = sessionStorage.getItem('idea');
    const shouldAutoGenerate = sessionStorage.getItem('autoGenerateMarketing') === 'true';

    if (savedIdea) {
        document.getElementById('input-idea').value = savedIdea;
        sessionStorage.removeItem('idea');
    }

    if (shouldAutoGenerate) {
        sessionStorage.removeItem('autoGenerateMarketing');
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
                ${t('Please describe your business idea first.')}
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${t('Creating kit...')}`;
    showLoading(boardContent, t('Crafting your marketing content kit...'));

    try {
        const data = await callAPI('/marketing-content', { idea });
        console.log('MARKETING-CONTENT RESPONSE:', data);
        renderMarketing(data);
    } catch (err) {
        console.error('ERROR in marketing-content:', err);
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel();
    }
});

/** Copy text to clipboard with visual feedback */
function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.classList.replace('btn-outline-secondary', 'btn-success');
        setTimeout(() => {
            btn.innerHTML = orig;
            btn.classList.replace('btn-success', 'btn-outline-secondary');
        }, 1500);
    });
}

function renderMarketing(d) {
    // Safe fallback for all nested properties
    const safeData = {
        source_idea: document.getElementById('input-idea')?.value.trim() || '',
        social_posts: Array.isArray(d?.social_posts) ? d.social_posts : (Array.isArray(d?.socialPosts) ? d.socialPosts : []),
        instagram_posts: d?.instagram_posts || [],
        ad_copies: d?.ad_copies || [],
        slogans: d?.slogans || [],
        captions: d?.captions || {}
    };
    latestMarketingContent = safeData;
    const canSaveMarketing = typeof isLoggedIn === 'function' && isLoggedIn();
    console.log('SAFE MARKETING DATA:', safeData);
    d = safeData;
    
    const posts = (d.social_posts.length ? d.social_posts : d.instagram_posts).map(post => {
        const caption = post?.caption || [post?.hook, post?.body, post?.cta].filter(Boolean).join('\n\n');
        return {
            platform: post?.platform || 'Instagram',
            hook: post?.hook || '',
            body: post?.body || caption,
            cta: post?.cta || '',
            caption,
            hashtags: Array.isArray(post?.hashtags) ? post.hashtags : []
        };
    });

    // Social posts
    const igPosts = posts.map((post, i) => `
        <div class="p-3 border border-secondary rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex flex-wrap gap-1">
                    <span class="badge bg-danger">Post ${i + 1}</span>
                    <span class="badge bg-secondary">${escapeHTML(post.platform)}</span>
                </div>
                <button class="btn btn-sm btn-outline-secondary"
                    onclick="copyText(this.closest('.p-3').querySelector('.post-text').textContent, this)">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="small post-text mb-2">
                ${post.hook ? `<div class="fw-semibold mb-1">${escapeHTML(post.hook)}</div>` : ''}
                <p class="text-muted mb-2">${escapeHTML(post.body)}</p>
                ${post.cta ? `<span class="badge bg-warning text-dark"><i class="fas fa-hand-pointer me-1"></i>${escapeHTML(post.cta)}</span>` : ''}
            </div>
            <div class="d-flex flex-wrap gap-1">
                ${post.hashtags.map(h => `<span class="badge bg-secondary">${escapeHTML(h)}</span>`).join('')}
            </div>
        </div>
    `).join('') || `<p class="text-muted small mb-0">${t('No data available')}</p>`;

    // Ad copies
    const adCopies = (d?.ad_copies || []).map((ad, i) => {
        const copyValue = [ad?.headline || '', ad?.body || '', ad?.cta || ''].join('\n');
        return `
        <div class="p-3 border border-secondary rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="badge bg-primary">Ad ${i + 1}</span>
                <button class="btn btn-sm btn-outline-secondary" data-copy="${escapeHTML(copyValue)}"
                    onclick="copyText(this.dataset.copy, this)">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="fw-bold mb-1">${escapeHTML(ad?.headline || '')}</div>
            <div class="text-muted small mb-2">${escapeHTML(ad?.body || '')}</div>
            <span class="badge bg-warning text-dark"><i class="fas fa-hand-pointer me-1"></i>${escapeHTML(ad?.cta || '')}</span>
        </div>
    `;
    }).join('') || `<p class="text-muted small mb-0">${t('No data available')}</p>`;

    // Social captions
    const socialPlatforms = [
        { key: 'facebook',  icon: 'fab fa-facebook', color: 'primary',   label: 'Facebook' },
        { key: 'linkedin',  icon: 'fab fa-linkedin',  color: 'info',      label: 'LinkedIn' },
        { key: 'whatsapp',  icon: 'fab fa-whatsapp',  color: 'success',   label: 'WhatsApp' }
    ];

    const socialCards = (socialPlatforms || []).map(p => `
        <div class="col-md-4">
            <div class="card bg-dark border-secondary h-100">
                <div class="card-header border-secondary d-flex justify-content-between align-items-center">
                    <span class="fw-semibold small"><i class="${p.icon} text-${p.color} me-1"></i>${p.label}</span>
                    <button class="btn btn-sm btn-outline-secondary"
                        onclick="copyText(document.getElementById('cap-${p.key}').textContent, this)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="card-body small text-muted" id="cap-${p.key}">${escapeHTML(d?.captions?.[p.key] || t('No data available'))}</div>
            </div>
        </div>
    `).join('');

    boardContent.innerHTML = `
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
            <h5 class="mb-0 fw-semibold"><i class="fas fa-toolbox text-danger me-2"></i>${t('Your Marketing Kit')}</h5>
            ${canSaveMarketing ? `
                <button type="button" id="btn-save-marketing" class="btn btn-sm btn-outline-success">
                    <i class="fas fa-bookmark me-1"></i>${t('Save Marketing')}
                </button>
            ` : `
                <a href="login.html" class="btn btn-sm btn-outline-secondary">
                    <i class="fas fa-right-to-bracket me-1"></i>${t('Log in to save')}
                </a>
            `}
            <div id="marketing-save-status" class="small text-muted w-100"></div>
        </div>

        <div class="row g-4 align-items-start">

            <!-- Social Posts -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fab fa-instagram text-danger me-2"></i>${t('Social Media Posts')}</h6>
                    </div>
                    <div class="card-body">${igPosts}</div>
                </div>
            </div>

            <!-- Ad Copies -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-ad text-primary me-2"></i>${t('Ad Copies')}</h6>
                    </div>
                    <div class="card-body">${adCopies}</div>
                </div>
            </div>

            <!-- Slogans -->
            <div class="col-12">
                <div class="card bg-dark border-secondary">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-quote-right text-warning me-2"></i>${t('Slogans')}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-2">
                            ${(d?.slogans || []).map((s, i) => `
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center justify-content-between p-3 border border-secondary rounded">
                                        <span class="fst-italic">"${escapeHTML(s)}"</span>
                                        <button class="btn btn-sm btn-outline-secondary ms-2 flex-shrink-0" data-copy="${escapeHTML(s)}"
                                            onclick="copyText(this.dataset.copy, this)">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Social Captions -->
            <div class="col-12">
                <div class="card bg-dark border-secondary">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-share-alt text-info me-2"></i>${t('Social Captions')}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">${socialCards}</div>
                    </div>
                </div>
            </div>

        </div>
    `;
}

boardContent.addEventListener('click', async (event) => {
    const saveButton = event.target.closest('#btn-save-marketing');
    if (!saveButton || !latestMarketingContent) return;

    const status = document.getElementById('marketing-save-status');
    const originalSaveLabel = saveButton.innerHTML;

    saveButton.disabled = true;
    saveButton.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t('Saving')}`;
    if (status) status.textContent = '';

    try {
        await promptAndSaveToProject({
            type: 'marketing-plan',
            title: 'Marketing Kit',
            content: latestMarketingContent
        });
        saveButton.innerHTML = `<i class="fas fa-check me-1"></i>${t('Saved')}`;
        if (status) {
            status.className = 'small text-success w-100';
            status.textContent = 'Marketing content saved to your project.';
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
