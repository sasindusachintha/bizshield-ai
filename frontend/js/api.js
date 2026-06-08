// ── API Configuration ──────────────────────────────────
// Update API_BASE for production deployment
const API_BASE = 'http://localhost:3000';

/**
 * Call the BizShield Growth Mode API
 * @param {string} endpoint  e.g. '/generate-ideas'
 * @param {object} data      request body
 * @returns {Promise<object>} response .data field
 */
async function callAPI(endpoint, data) {
    const response = await fetch(`${API_BASE}/api/growth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const json = await response.json();

    if (!response.ok || json.success === false) {
        throw new Error(json.error || `Request failed (${response.status})`);
    }

    return json.data;
}

/** Render a loading spinner inside a container */
function showLoading(container, message = 'Processing...') {
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" style="width:3rem;height:3rem" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">${message}</p>
        </div>
    `;
}

/** Render an error alert inside a container */
function showError(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <i class="fas fa-exclamation-circle"></i>
            <span><strong>Error:</strong> ${message}</span>
        </div>
    `;
}

/** Disable a button and show spinner */
function setLoading(btn, label, loading = true) {
    btn.disabled = loading;
    btn.innerHTML = loading
        ? `<span class="spinner-border spinner-border-sm me-2"></span>${label}`
        : btn.dataset.original;
    if (!loading && btn.dataset.original) btn.innerHTML = btn.dataset.original;
}
