// ── API Configuration ──────────────────────────────────
// Update API_BASE for production deployment
const API_BASE = 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'bizshieldai-token';
const AUTH_USER_KEY = 'bizshieldai-user';
const LEGACY_TOKEN_KEY = 'token';

/**
 * Call the BizShield-AI backend API
 * @param {string} endpoint  e.g. '/generate-ideas'
 * @param {object} data      request body
 * @returns {Promise<object>} response .data field
 */
async function callAPI(endpoint, data) {
    const token = getAuthToken();
    const user = getAuthUser() || {};
    const requestPrefs = {
        currency: user.currency || localStorage.getItem('bizshieldai-currency') || 'USD',
        language: user.language || localStorage.getItem('bizshieldai-lang') || 'en'
    };

    const response = await fetch(`${API_BASE}/api/growth${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...(data || {}), preferences: requestPrefs })
    });

    const json = await parseJSONResponse(response);
    console.log('🔗 API RESPONSE:', { endpoint, status: response.status, body: json });

    if (!response.ok || json.success === false) {
        console.error('❌ API ERROR:', json.error || `Request failed (${response.status})`);
        throw new Error(json.error || `Request failed (${response.status})`);
    }

    // Handle nested data structure: json.data.data or just json.data
    const payload = json?.data?.data || json?.data || {};
    console.log('✅ API PAYLOAD EXTRACTED:', payload);
    return payload;
}

function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

function getAuthUser() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
    } catch (_) {
        return null;
    }
}

function isLoggedIn() {
    return Boolean(getAuthToken());
}

function setAuthSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

async function callJSON(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });

    const json = await parseJSONResponse(response);
    if (!response.ok || json.success === false) {
        throw new Error(json.error || `Request failed (${response.status})`);
    }

    return json.data || {};
}

async function parseJSONResponse(response) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    const text = await response.text();
    const preview = text.trim().slice(0, 80);
    throw new Error(
        `Backend did not return JSON from ${response.url}. Make sure the Express server is running on ${API_BASE}. Response started with: ${preview}`
    );
}

async function authRequest(endpoint, data) {
    const payload = await callJSON(`/api/auth${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });

    if (payload.token && payload.user) {
        setAuthSession(payload.token, payload.user);
    }

    return payload;
}

async function protectedRequest(path, options = {}) {
    const token = getAuthToken();

    if (!token) {
        throw new Error('Please log in to continue.');
    }

    return callJSON(path, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
}

// ── Project Workspace API ───────────────────────────────
// "My Ideas" has been replaced by "My Projects". An idea saved from
// Growth Mode now creates a Project plus a ProjectDocument of type "idea".

/**
 * Quick-save an idea generated on the Ideas page. Creates a new Project
 * (using the idea's name as the title) and a ProjectDocument of type
 * "idea" in one call. Replaces the old POST /api/ideas/save.
 */
async function saveIdea(idea) {
    return protectedRequest('/api/projects/quick-save-idea', {
        method: 'POST',
        body: JSON.stringify(idea)
    });
}

/** List the current user's projects (Project History / My Projects page). */
async function getUserProjects() {
    return protectedRequest('/api/projects', { method: 'GET' });
}

/** Backwards-compatible alias used by older pages. */
async function getUserIdeas() {
    return getUserProjects();
}

/** Fetch a single project plus all of its documents, grouped by type. */
async function getProject(projectId) {
    return protectedRequest(`/api/projects/${projectId}`, { method: 'GET' });
}

/** Create a new, empty project workspace. */
async function createProject(project) {
    return protectedRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project)
    });
}

/** Update a project's metadata (title, industry, stage, description). */
async function updateProject(projectId, updates) {
    return protectedRequest(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

/** Delete a project and all of its documents. */
async function deleteProject(projectId) {
    return protectedRequest(`/api/projects/${projectId}`, { method: 'DELETE' });
}

/**
 * Save an AI-generated output (market analysis, SWOT, marketing plan,
 * business model, financial forecast, risk assessment, pitch deck) as a
 * ProjectDocument under the given project.
 */
async function saveProjectDocument(projectId, { type, title, content, tags, favorite, meta }) {
    return protectedRequest(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ type, title, content, tags, favorite, meta })
    });
}

/** List documents under a project, optionally filtered by ?type=. */
async function getProjectDocuments(projectId, type = null) {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    return protectedRequest(`/api/projects/${projectId}/documents${query}`, { method: 'GET' });
}

/** Update an existing document's title/content/tags/favorite/meta. */
async function updateProjectDocument(documentId, updates) {
    return protectedRequest(`/api/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

/** Delete a single document. */
async function deleteProjectDocument(documentId) {
    return protectedRequest(`/api/documents/${documentId}`, { method: 'DELETE' });
}

/** Dashboard statistics: total projects, ideas, SWOTs, marketing plans, etc. */
async function getDashboardStats() {
    return protectedRequest('/api/dashboard/stats', { method: 'GET' });
}

/** Recent activity feed for the dashboard. */
async function getDashboardActivity(limit = 10) {
    return protectedRequest(`/api/dashboard/activity?limit=${limit}`, { method: 'GET' });
}

// ── Backwards-compatible aliases (deprecated) ───────────
// Older pages may still call these names; they now route through the
// Project Workspace API. New code should call saveProjectDocument()
// directly with the appropriate document type.
async function saveBusinessPlan(planContent, projectId = null) {
    if (!projectId) {
        throw new Error('A project must be selected before saving a business plan.');
    }
    return saveProjectDocument(projectId, {
        type: 'business-model',
        title: 'Business Plan',
        content: planContent
    });
}

async function saveMarketingContent(content, projectId = null) {
    if (!projectId) {
        throw new Error('A project must be selected before saving marketing content.');
    }
    return saveProjectDocument(projectId, {
        type: 'marketing-plan',
        title: 'Marketing Kit',
        content
    });
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

// ── Settings & Profile API ───────────────────────────────
async function getMe() {
    return protectedRequest('/api/auth/me', { method: 'GET' });
}

async function updateSettings(updates) {
    const data = await protectedRequest('/api/auth/settings', {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
    // Update local user cache
    const existing = getAuthUser() || {};
    const merged = { ...existing, ...data };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    applyUserPreferences(merged);
    return data;
}

// ── User Preferences (language / currency) ──────────────
const API_CURRENCY_SYMBOLS = { USD: '$', LKR: 'Rs', EUR: '€', GBP: '£', INR: '₹' };
const SINHALA_LABELS = {
    'Dashboard': 'උපකරණ පුවරුව',
    'My Projects': 'මගේ ව්‍යාපෘති',
    'Crisis Mode': 'අර්බුද ආකාරය',
    'Settings': 'සැකසුම්',
    'Logout': 'ඉවත් වන්න',
    'Login': 'ඇතුල් වන්න',
    'Register': 'ලියාපදිංචි වන්න',
    'Total Projects': 'මුළු ව්‍යාපෘති',
    'Total Ideas': 'මුළු අදහස්',
    'Recent Activity': 'මෑත ක්‍රියාකාරකම්',
    'Generate Ideas': 'අදහස් ජනනය කරන්න',
    'Analyze Idea': 'අදහස විශ්ලේෂණය කරන්න',
    'Build a Plan': 'සැලැස්මක් සාදන්න',
    'Marketing Kit': 'අලෙවිකරණ කට්ටලය',
    'Welcome to BizShield-AI': 'BizShield-AI වෙත සාදරයෙන් පිළිගනිමු',
    'Active Projects': 'ක්‍රියාකාරී ව්‍යාපෘති',
};

function applyUserPreferences(user) {
    if (!user) return;
    // Store preferences
    if (user.language) localStorage.setItem('bizshieldai-lang', user.language);
    if (user.currency) localStorage.setItem('bizshieldai-currency', user.currency);
    try {
        const existing = JSON.parse(localStorage.getItem('bizshieldai-user') || '{}');
        localStorage.setItem('bizshieldai-user', JSON.stringify({ ...existing, ...user }));
    } catch (_) {
        localStorage.setItem('bizshieldai-user', JSON.stringify(user));
    }
    document.dispatchEvent(new CustomEvent('bizshield:languageChange', { detail: { language: user.language || 'en' } }));
    // Apply Sinhala translation if selected
    if (user.language === 'si') applySinhalaLabels();
    // Broadcast currency change
    document.dispatchEvent(new CustomEvent('bizshield:currencyChange', { detail: { currency: user.currency } }));
}

function applySinhalaLabels() {
    if (typeof window.applySinhala === 'function') {
        window.applySinhala(document.body);
        return;
    }

    document.querySelectorAll('h2, h5, .nav-link, .card-body h5, .btn, label, p').forEach(el => {
        const text = el.childNodes[0]?.nodeValue?.trim();
        if (text && SINHALA_LABELS[text] && typeof window.translateSinhalaValue === 'function') {
            el.childNodes[0].nodeValue = window.translateSinhalaValue(text) + ' ';
        }
    });
}

function getCurrentCurrency() {
    const user = getAuthUser();
    return localStorage.getItem('bizshieldai-currency') || user?.currency || 'USD';
}

function formatCurrency(amount, currencyCode) {
    const code = currencyCode || getCurrentCurrency();
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amount);
    } catch (_) {
        return `${API_CURRENCY_SYMBOLS[code] || code} ${amount}`;
    }
}

// Auto-apply preferences on page load
window.addEventListener('DOMContentLoaded', () => {
    const user = getAuthUser();
    if (user) applyUserPreferences(user);
});
