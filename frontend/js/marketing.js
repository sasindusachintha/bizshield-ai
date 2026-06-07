const btn          = document.getElementById('btn-submit');
const boardContent = document.getElementById('board-content');
const originalLabel = '<i class="fas fa-paper-plane me-2"></i>Generate Marketing Kit';

btn.addEventListener('click', async () => {
    const idea = document.getElementById('input-idea').value.trim();

    if (!idea) {
        boardContent.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Please describe your business idea first.
            </div>`;
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating kit…';
    showLoading(boardContent, 'Crafting your marketing content kit…');

    try {
        const data = await callAPI('/marketing-content', { idea });
        renderMarketing(data);
    } catch (err) {
        showError(boardContent, err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalLabel;
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
    // Instagram posts
    const igPosts = d.instagram_posts.map((post, i) => `
        <div class="p-3 border border-secondary rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-danger">Post ${i + 1}</span>
                <button class="btn btn-sm btn-outline-secondary"
                    onclick="copyText(this.closest('.p-3').querySelector('.post-text').textContent, this)">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <p class="small post-text mb-2">${post.caption}</p>
            <div class="d-flex flex-wrap gap-1">
                ${post.hashtags.map(h => `<span class="badge bg-secondary">${h}</span>`).join('')}
            </div>
        </div>
    `).join('');

    // Ad copies
    const adCopies = d.ad_copies.map((ad, i) => `
        <div class="p-3 border border-secondary rounded mb-3">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="badge bg-primary">Ad ${i + 1}</span>
                <button class="btn btn-sm btn-outline-secondary"
                    onclick="copyText(\`${ad.headline}\\n${ad.body}\\n${ad.cta}\`, this)">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="fw-bold mb-1">${ad.headline}</div>
            <div class="text-muted small mb-2">${ad.body}</div>
            <span class="badge bg-warning text-dark"><i class="fas fa-hand-pointer me-1"></i>${ad.cta}</span>
        </div>
    `).join('');

    // Social captions
    const socialPlatforms = [
        { key: 'facebook',  icon: 'fab fa-facebook', color: 'primary',   label: 'Facebook' },
        { key: 'linkedin',  icon: 'fab fa-linkedin',  color: 'info',      label: 'LinkedIn' },
        { key: 'whatsapp',  icon: 'fab fa-whatsapp',  color: 'success',   label: 'WhatsApp' }
    ];

    const socialCards = socialPlatforms.map(p => `
        <div class="col-md-4">
            <div class="card bg-dark border-secondary h-100">
                <div class="card-header border-secondary d-flex justify-content-between align-items-center">
                    <span class="fw-semibold small"><i class="${p.icon} text-${p.color} me-1"></i>${p.label}</span>
                    <button class="btn btn-sm btn-outline-secondary"
                        onclick="copyText(document.getElementById('cap-${p.key}').textContent, this)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="card-body small text-muted" id="cap-${p.key}">${d.captions[p.key] || '—'}</div>
            </div>
        </div>
    `).join('');

    boardContent.innerHTML = `
        <h5 class="mb-4 fw-semibold"><i class="fas fa-toolbox text-danger me-2"></i>Your Marketing Kit</h5>

        <div class="row g-4">

            <!-- Instagram Posts -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fab fa-instagram text-danger me-2"></i>Instagram Posts</h6>
                    </div>
                    <div class="card-body">${igPosts}</div>
                </div>
            </div>

            <!-- Ad Copies -->
            <div class="col-md-6">
                <div class="card bg-dark border-secondary h-100">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-ad text-primary me-2"></i>Ad Copies</h6>
                    </div>
                    <div class="card-body">${adCopies}</div>
                </div>
            </div>

            <!-- Slogans -->
            <div class="col-12">
                <div class="card bg-dark border-secondary">
                    <div class="card-header border-secondary">
                        <h6 class="mb-0 fw-bold"><i class="fas fa-quote-right text-warning me-2"></i>Slogans</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-2">
                            ${d.slogans.map((s, i) => `
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center justify-content-between p-3 border border-secondary rounded">
                                        <span class="fst-italic">"${s}"</span>
                                        <button class="btn btn-sm btn-outline-secondary ms-2 flex-shrink-0"
                                            onclick="copyText('${s.replace(/'/g, "\\'")}', this)">
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
                        <h6 class="mb-0 fw-bold"><i class="fas fa-share-alt text-info me-2"></i>Social Captions</h6>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">${socialCards}</div>
                    </div>
                </div>
            </div>

        </div>
    `;
}
