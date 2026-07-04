/**
 * prefs.js â€” BizShield-AI Global Preferences
 * Loaded on EVERY page. Applies language (EN/SI) and currency from
 * stored user settings so all pages stay consistent after Settings change.
 *
 * Load order: api.js â†’ prefs.js â†’ page-specific JS
 */

// â”€â”€ Currency helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BS_CURRENCY_SYMBOLS = { USD: '$', LKR: 'Rs.', EUR: 'â‚¬', GBP: 'Â£', INR: 'â‚¹' };
const BS_EXCHANGE_CACHE_KEY = 'bizshieldai-usd-rates';
const BS_EXCHANGE_CACHE_TTL = 12 * 60 * 60 * 1000;
const BS_FALLBACK_RATES = {
    USD: 1, LKR: 305, EUR: 0.92, GBP: 0.78, INR: 83
};

function getBSCurrency() {
    try {
        const user = JSON.parse(localStorage.getItem('bizshieldai-user') || 'null');
        return localStorage.getItem('bizshieldai-currency') || user?.currency || 'USD';
    } catch (_) { return 'USD'; }
}

function getBSLanguage() {
    try {
        const user = JSON.parse(localStorage.getItem('bizshieldai-user') || 'null');
        return localStorage.getItem('bizshieldai-lang') || user?.language || 'en';
    } catch (_) { return 'en'; }
}

function applyLanguageFontState(lang) {
    const activeLang = lang === 'si' ? 'si' : 'en';
    document.documentElement.lang = activeLang;
    document.documentElement.dataset.lang = activeLang;
    document.body?.classList.toggle('lang-si', activeLang === 'si');
}

function bsT(text) {
    if (getBSLanguage() !== 'si') return text;
    return translateSinhalaValue(text) || text;
}

function readBSExchangeCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(BS_EXCHANGE_CACHE_KEY) || 'null');
        if (!cached?.rates || !cached?.savedAt) return null;
        if (Date.now() - cached.savedAt > BS_EXCHANGE_CACHE_TTL) return null;
        return cached.rates;
    } catch (_) {
        return null;
    }
}

function getBSExchangeRates() {
    return readBSExchangeCache() || BS_FALLBACK_RATES;
}

function getBSExchangeRate(currency) {
    return getBSExchangeRates()[currency || getBSCurrency()] || 1;
}

async function refreshBSExchangeRates() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
        const data = await response.json();
        if (data?.result !== 'success' || !data?.rates) throw new Error('Exchange rate response was invalid.');
        const rates = {};
        Object.keys(BS_FALLBACK_RATES).forEach(code => {
            rates[code] = Number(data.rates[code]) || BS_FALLBACK_RATES[code];
        });
        localStorage.setItem(BS_EXCHANGE_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), rates }));
        document.dispatchEvent(new CustomEvent('bizshield:ratesReady', { detail: { rates } }));
        return rates;
    } catch (error) {
        console.warn('Unable to refresh exchange rates; using cached/fallback rates.', error);
        return getBSExchangeRates();
    }
}

/**
 * Format a number as currency in the user's preferred currency.
 * Falls back gracefully if Intl is unavailable.
 */
function bsFormatCurrency(amount, overrideCurrency) {
    const code = overrideCurrency || getBSCurrency();
    const num = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return amount; // return raw string (e.g. "$500-$1000") unchanged
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: code, maximumFractionDigits: 0
        }).format(num);
    } catch (_) {
        return `${BS_CURRENCY_SYMBOLS[code] || code} ${num.toLocaleString()}`;
    }
}

function bsConvertUSDToCurrency(amount, overrideCurrency) {
    const code = overrideCurrency || getBSCurrency();
    const num = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return amount;
    return bsFormatCurrency(num * getBSExchangeRate(code), code);
}

/**
 * Convert a raw cost string that may contain $, Rs, numbers or ranges like "$500-$1000"
 * into the user's preferred currency using a rough conversion table.
 */
function convertCostString(rawStr, targetCurrency) {
    if (!rawStr) return rawStr;
    const target = targetCurrency || getBSCurrency();
    const raw = String(rawStr);
    if (!/\d/.test(raw)) return raw;
    if (target === 'USD') return raw.replace(/\bUSD\b/g, 'USD');

    const sym = BS_CURRENCY_SYMBOLS[target] || target;
    const rate = getBSExchangeRate(target);

    const converted = raw.replace(/\$?\s*([\d,]+(?:\.\d+)?)(?:\s*USD)?/gi, (match, numStr) => {
        const n = parseFloat(numStr.replace(/,/g, ''));
        if (isNaN(n)) return match;
        const converted = Math.round(n * rate);
        return `${sym} ${converted.toLocaleString()}`;
    });

    return converted
        .replace(/\bUSD\b/g, target)
        .replace(/\$/g, sym);
}

// â”€â”€ Sinhala translations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SI_TRANSLATIONS = {
    // Navbar
    'Dashboard': 'à¶‹à¶´à¶šà¶»à¶« à¶´à·”à·€à¶»à·”à·€',
    'My Projects': 'à¶¸à¶œà·š à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’',
    'Crisis Mode': 'à¶…à¶»à·Šà¶¶à·”à¶¯ à¶†à¶šà·à¶»à¶º',
    'Settings': 'à·ƒà·à¶šà·ƒà·”à¶¸à·Š',
    'Logout': 'à¶‰à·€à¶­à·Š à·€à¶±à·Šà¶±',
    'Login': 'à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±',
    'Register': 'à¶½à·’à¶ºà·à¶´à¶¯à·’à¶‚à¶ à·’ à·€à¶±à·Šà¶±',
    'Tools': 'à¶¸à·™à·€à¶½à¶¸à·Š',
    // Dashboard cards
    'Generate Ideas': 'à¶…à¶¯à·„à·ƒà·Š à¶¢à¶±à¶±à¶º',
    'Analyze Idea': 'à¶…à¶¯à·„à·ƒ à·€à·’à·à·Šà¶½à·šà·‚à¶«à¶º',
    'Build a Plan': 'à·ƒà·à¶½à·à·ƒà·Šà¶¸à¶šà·Š à·ƒà·à¶¯à¶±à·Šà¶±',
    'Marketing Kit': 'à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à¶šà¶§à·Šà¶§à¶½à¶º',
    'Generate Marketing Kit': 'à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à¶šà¶§à·Šà¶§à¶½à¶º à¶¢à¶±à¶±à¶º à¶šà¶»à¶±à·Šà¶±',
    'Generate Plan': 'à·ƒà·à¶½à·à·ƒà·Šà¶¸ à¶¢à¶±à¶±à¶º à¶šà¶»à¶±à·Šà¶±',
    'Creating kit...': 'à¶šà¶§à·Šà¶§à¶½à¶º à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š...',
    'Creating kitâ€¦': 'à¶šà¶§à·Šà¶§à¶½à¶º à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š...',
    'Crafting your marketing content kit...': 'à¶”à¶¶à·š à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à¶…à¶±à·Šà¶­à¶»à·Šà¶œà¶­ à¶šà¶§à·Šà¶§à¶½à¶º à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š...',
    'Crafting your marketing content kitâ€¦': 'à¶”à¶¶à·š à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à¶…à¶±à·Šà¶­à¶»à·Šà¶œà¶­ à¶šà¶§à·Šà¶§à¶½à¶º à·ƒà¶šà·ƒà¶¸à·’à¶±à·Š...',
    'Building plan...': 'à·ƒà·à¶½à·à·ƒà·Šà¶¸ à¶œà·œà¶©à¶±à¶œà¶¸à·’à¶±à·Š...',
    'Building your personalised launch roadmap...': 'à¶”à¶¶à·š à¶´à·”à¶¯à·Šà¶œà¶½à·“à¶šà¶»à¶«à¶º à¶šà·… à¶†à¶»à¶¸à·Šà¶·à¶š à¶¸à·à¶»à·Šà¶œ à·ƒà·’à¶­à·’à¶ºà¶¸ à¶œà·œà¶©à¶±à¶œà¶¸à·’à¶±à·Š...',
    'Your Marketing Kit': 'à¶”à¶¶à·š à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à¶šà¶§à·Šà¶§à¶½à¶º',
    'Save Marketing': 'à¶…à¶½à·™à·€à·’à¶šà¶»à¶«à¶º à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±',
    'Social Media Posts': 'à·ƒà¶¸à·à¶¢ à¶¸à·à¶°à·Šâ€à¶º à¶´à·… à¶šà·’à¶»à·“à¶¸à·Š',
    'Ad Copies': 'à¶¯à·à¶±à·Šà·€à·“à¶¸à·Š à¶´à·’à¶§à¶´à¶­à·Š',
    'Slogans': 'à·ƒà¶§à¶±à·Š à¶´à·à¶¨',
    'Social Captions': 'à·ƒà¶¸à·à¶¢ à¶¸à·à¶°à·Šâ€à¶º à·à·“à¶»à·Šà·‚ à¶´à¶',
    'No data available': 'à¶¯à¶­à·Šà¶­ à¶±à·œà¶¸à·à¶­',
    'Log in to save': 'à·ƒà·”à¶»à·à¶šà·“à¶¸à¶§ à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±',
    'Saved': 'à·ƒà·”à¶»à·à¶šà·’à¶«à·’',
    'Saving': 'à·ƒà·”à¶»à¶šà·’à¶¸à·’à¶±à·Š',
    'Please describe your business idea first.': 'à¶šà¶»à·”à¶«à·à¶šà¶» à¶´à·…à¶¸à·”à·€ à¶”à¶¶à·š à·€à·Šâ€à¶ºà·à¶´à·à¶» à¶…à¶¯à·„à·ƒ à·€à·’à·ƒà·Šà¶­à¶» à¶šà¶»à¶±à·Šà¶±.',
    'Total Projects': 'à¶¸à·”à·…à·” à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’',
    'Total Ideas': 'à¶¸à·”à·…à·” à¶…à¶¯à·„à·ƒà·Š',
    'Total Marketing Plans': 'à¶¸à·”à·…à·” à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à·ƒà·à¶½à·ƒà·”à¶¸à·Š',
    'Total Marketing': 'à¶¸à·”à·…à·” à¶…à¶½à·™à·€à·’à¶šà¶»à¶«',
    'Recent Activity': 'à¶¸à·‘à¶­ à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à¶šà¶¸à·Š',
    'My Projects': 'à¶¸à¶œà·š à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’',
    'Active Projects': 'à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à·“ à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’',
    // Buttons
    'Generate': 'à¶¢à¶±à¶±à¶º à¶šà¶»à¶±à·Šà¶±',
    'Save': 'à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±',
    'Analyze': 'à·€à·’à·à·Šà¶½à·šà·‚à¶«à¶º',
    'Delete': 'à¶¸à¶šà¶±à·Šà¶±',
    'Cancel': 'à¶…à·€à¶½à¶‚à¶œà·” à¶šà¶»à¶±à·Šà¶±',
    'Back': 'à¶†à¶´à·ƒà·”',
    'Start here': 'à¶¸à·™à¶­à·à¶±à·’à¶±à·Š à¶†à¶»à¶¸à·Šà¶· à¶šà¶»à¶±à·Šà¶±',
    // Crisis
    'Crisis Mode': 'à¶…à¶»à·Šà¶¶à·”à¶¯ à¶†à¶šà·à¶»à¶º',
    'Convene the Boardroom': 'à¶¸à¶«à·Šà¶©à¶½ à·ƒà·à¶šà¶ à·Šà¶¡à·à·€ à¶†à¶»à¶¸à·Šà¶· à¶šà¶»à¶±à·Šà¶±',
    'Convening...': 'à¶¸à¶«à·Šà¶©à¶½à¶º à¶šà·à¶³à·€à¶¸à·’à¶±à·Š...',
    'Crisis under review': 'à·ƒà¶¸à·à¶½à·à¶ à¶±à¶º à·€à¶± à¶…à¶»à·Šà¶¶à·”à¶¯à¶º',
    'Live Debate Panel': 'à·ƒà¶¢à·“à·€à·“ à¶¸à¶«à·Šà¶©à¶½ à·ƒà·à¶šà¶ à·Šà¶¡à·à·€',
    'Final Decision': 'à¶…à·€à·ƒà·à¶± à¶­à·“à¶»à¶«à¶º',
    'Agrees': 'à¶‘à¶šà¶Ÿà¶ºà·’',
    'Disagrees': 'à¶‘à¶šà¶Ÿ à¶±à·à¶­',
    'Neutral': 'à¶¸à¶°à·Šâ€à¶ºà·ƒà·Šà¶®à¶ºà·’',
    'Risk': 'à¶…à·€à¶¯à·à¶±à¶¸',
    'Problem analysis:': 'à¶œà·à¶§à¶½à·” à·€à·’à·à·Šà¶½à·šà·‚à¶«à¶º:',
    'Solution:': 'à·€à·’à·ƒà¶³à·”à¶¸:',
    'HIGH CONFLICT detected': 'à¶‰à·„à·… à¶¸à¶­à¶·à·šà¶¯à¶ºà¶šà·Š à·„à¶³à·”à¶±à·à¶œà·™à¶± à¶‡à¶­',
    'Final Weighted Risk Score': 'à¶…à·€à·ƒà·à¶± à¶¶à¶»à·’à¶­ à¶…à·€à¶¯à·à¶±à¶¸à·Š à¶½à¶šà·”à¶«à·”',
    'CEO\'s Closing Statement': 'CEOà¶œà·š à¶…à·€à·ƒà·à¶± à¶´à·Šâ€à¶»à¶šà·à·à¶º',
    'Recovery Plan â€” Step by Step': 'à¶´à·Šâ€à¶»à¶­à·’à·ƒà·à¶°à¶± à·ƒà·à¶½à·à·ƒà·Šà¶¸ â€” à¶´à·’à¶ºà·€à¶»à·™à¶±à·Š à¶´à·’à¶ºà·€à¶»',
    'Immediate actions (24 hours)': 'à¶šà·Šà·‚à¶«à·’à¶š à¶šà·Šâ€à¶»à·’à¶ºà·à¶¸à·à¶»à·Šà¶œ (à¶´à·à¶º 24)',
    'Short-term actions (7 days)': 'à¶šà·™à¶§à·’ à¶šà·à¶½à·“à¶± à¶šà·Šâ€à¶»à·’à¶ºà·à¶¸à·à¶»à·Šà¶œ (à¶¯à·’à¶± 7)',
    'Long-term strategy (30 days)': 'à¶¯à·’à¶œà·” à¶šà·à¶½à·“à¶± à¶‹à¶´à·à¶ºà¶¸à·à¶»à·Šà¶œà¶º (à¶¯à·’à¶± 30)',
    'Save Outcome to Project': 'à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½à¶º à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’à¶ºà¶§ à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±',
    'Please describe the crisis before convening the boardroom.': 'à¶¸à¶«à·Šà¶©à¶½ à·ƒà·à¶šà¶ à·Šà¶¡à·à·€ à¶†à¶»à¶¸à·Šà¶· à¶šà·’à¶»à·“à¶¸à¶§ à¶´à·™à¶» à¶šà¶»à·”à¶«à·à¶šà¶» à¶…à¶»à·Šà¶¶à·”à¶¯à¶º à·€à·’à·ƒà·Šà¶­à¶» à¶šà¶»à¶±à·Šà¶±.',
    'Please log in to run a boardroom debate.': 'à¶¸à¶«à·Šà¶©à¶½ à·ƒà·à¶šà¶ à·Šà¶¡à·à·€ à¶šà·Šâ€à¶»à·’à¶ºà·à¶­à·Šà¶¸à¶š à¶šà·’à¶»à·“à¶¸à¶§ à¶šà¶»à·”à¶«à·à¶šà¶» à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±.',
    'Run Boardroom Debate': 'à¶¸à¶«à·Šà¶©à¶½ à·€à·à¶¯-à·€à·’à·€à·à¶¯à¶º à¶šà·Šâ€à¶»à·’à¶ºà·à¶­à·Šà¶¸à¶š à¶šà¶»à¶±à·Šà¶±',
    'Risk Score': 'à¶…à·€à¶¯à·à¶±à¶¸à·Š à¶½à¶šà·”à¶«à·”',
    'Final Plan': 'à¶…à·€à·ƒà·à¶± à·ƒà·à¶½à·à·ƒà·Šà¶¸',
    'Aligned': 'à¶‘à¶šà¶Ÿà¶­à·à·€ à¶‡à¶­',
    'HIGH CONFLICT': 'à¶‰à·„à·… à¶¸à¶­à¶·à·šà¶¯à¶º',
    'The boardroom reached reasonable alignment â€” no high-conflict override was required.': 'à¶¸à¶«à·Šà¶©à¶½à¶º à·ƒà·à¶°à·à¶»à¶« à¶‘à¶šà¶Ÿà¶­à·à·€à¶šà¶§ à¶´à·à¶¸à·’à¶«à·’à¶ºà·šà¶º â€” à¶‰à·„à·… à¶¸à¶­à¶·à·šà¶¯ override à¶‘à¶šà¶šà·Š à¶…à·€à·à·Šâ€à¶º à¶±à·œà·€à·“à¶º.',
    'No recovery steps provided.': 'à¶´à·Šâ€à¶»à¶­à·’à·ƒà·à¶°à¶± à¶´à·’à¶ºà·€à¶» à¶½à¶¶à·à¶¯à·“ à¶±à·à¶­.',
    'View in Project': 'à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’à¶º à¶­à·”à·… à¶¶à¶½à¶±à·Šà¶±',
    'Crisis outcome saved to your project.': 'à¶…à¶»à·Šà¶¶à·”à¶¯ à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½à¶º à¶”à¶¶à·š à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’à¶ºà¶§ à·ƒà·”à¶»à·à¶šà·’à¶«à·’.',
    'Crisis Boardroom Outcome': 'à¶…à¶»à·Šà¶¶à·”à¶¯ à¶¸à¶«à·Šà¶©à¶½ à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½à¶º',
    // Common labels
    'Loading...': 'à¶´à·–à¶»à¶«à¶º à·€à·™à¶¸à·’à¶±à·Š...',
    'No activity yet.': 'à¶­à·€à¶¸ à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à¶šà¶¸à·Š à¶±à·œà¶¸à·à¶­.',
    'Sign in': 'à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±',
    'Log in': 'à¶‡à¶­à·”à¶½à·Š à·€à¶±à·Šà¶±',
    // Ideas page
    'Skills': 'à¶šà·”à·ƒà¶½à¶­à·',
    'Budget': 'à¶…à¶ºà·€à·à¶º',
    'Interest': 'à¶šà·à¶¸à·à¶­à·Šà¶­',
    'Analysis': 'à·€à·’à·à·Šà¶½à·šà·‚à¶«à¶º',
    'Business Plan': 'à·€à·Šâ€à¶ºà·à¶´à·à¶» à·ƒà·à¶½à·à·ƒà·Šà¶¸',
    'Marketing': 'à¶…à¶½à·™à·€à·’à¶šà¶»à¶«à¶º',
    'Ideas': 'à¶…à¶¯à·„à·ƒà·Š',
    'Plan': 'à·ƒà·à¶½à·à·ƒà·Šà¶¸',
    'Generate Business Ideas': 'à·€à·Šâ€à¶ºà·à¶´à·à¶» à¶…à¶¯à·„à·ƒà·Š à¶¢à¶±à¶±à¶º à¶šà¶»à¶±à·Šà¶±',
    'Build a Launch Plan': 'à¶†à¶»à¶¸à·Šà¶·à¶š à·ƒà·à¶½à·à·ƒà·Šà¶¸à¶šà·Š à·ƒà·à¶¯à¶±à·Šà¶±',
    'Business Analysis': 'à·€à·Šâ€à¶ºà·à¶´à·à¶» à·€à·’à·à·Šà¶½à·šà·‚à¶«à¶º',
    'Crisis Mode â€” Boardroom Debate': 'à¶…à¶»à·Šà¶¶à·”à¶¯ à¶†à¶šà·à¶»à¶º â€” à¶¸à¶«à·Šà¶©à¶½ à·ƒà·à¶šà¶ à·Šà¶¡à·à·€',
    'Your Skills': 'à¶”à¶¶à·š à¶šà·”à·ƒà¶½à¶­à·',
    'Interest / Niche': 'à¶šà·à¶¸à·à¶­à·Šà¶­ / à·€à·’à·à·šà·‚ à¶šà·Šà·‚à·šà¶­à·Šâ€à¶»à¶º',
    'Available Budget': 'à¶½à¶¶à· à¶œà¶­ à·„à·à¶šà·’ à¶…à¶ºà·€à·à¶º',
    'Business Idea': 'à·€à·Šâ€à¶ºà·à¶´à·à¶» à¶…à¶¯à·„à·ƒ',
    'Your Business Idea': 'à¶”à¶¶à·š à·€à·Šâ€à¶ºà·à¶´à·à¶» à¶…à¶¯à·„à·ƒ',
    'Profile': 'à¶´à·à¶­à·’à¶šà¶©',
    'Full Name': 'à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶±à¶¸',
    'Email Address': 'à¶Šà¶¸à·šà¶½à·Š à¶½à·’à¶´à·’à¶±à¶º',
    'New Password': 'à¶±à·€ à¶¸à·”à¶»à¶´à¶¯à¶º',
    'Language / à¶·à·à·‚à·à·€': 'à¶·à·à·‚à·à·€',
    'Currency / à¶¸à·”à¶¯à¶½à·Š à¶’à¶šà¶šà¶º': 'à¶¸à·”à¶¯à¶½à·Š à¶’à¶šà¶šà¶º',
    'System Preferences': 'à¶´à¶¯à·Šà¶°à¶­à·’ à¶¸à¶±à·à¶´',
    'Dark Mode': 'à¶…à¶³à·”à¶»à·” à¶†à¶šà·à¶»à¶º',
    'Context Memory': 'à·ƒà¶±à·Šà¶¯à¶»à·Šà¶· à¶¸à¶­à¶šà¶º',
    'Settings saved!': 'à·ƒà·à¶šà·ƒà·”à¶¸à·Š à·ƒà·”à¶»à·à¶šà·’à¶«à·’!',
    'Save Changes': 'à·€à·™à¶±à·ƒà·Šà¶šà¶¸à·Š à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±',
    'New Project': 'à¶±à·€ à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’à¶º',
    'Project Title': 'à·€à·Šâ€à¶ºà·à¶´à·˜à¶­à·’ à¶¸à·à¶­à·˜à¶šà·à·€',
    'Ideas Generated': 'à¶¢à¶±à¶±à¶º à¶šà·… à¶…à¶¯à·„à·ƒà·Š',
    'Plans Created': 'à·ƒà·à¶¯à¶± à¶½à¶¯ à·ƒà·à¶½à·ƒà·”à¶¸à·Š',
    'Action Planning': 'à¶šà·Šâ€à¶»à·’à¶ºà·à¶šà·à¶»à·“ à·ƒà·à¶½à·ƒà·”à¶¸à·Šà¶šà¶»à¶«à¶º',
    'Marketing Automation': 'à¶…à¶½à·™à·€à·’à¶šà¶»à¶« à·ƒà·Šà·€à¶ºà¶‚à¶šà·Šâ€à¶»à·“à¶ºà¶šà¶»à¶«à¶º',
    'Generate Your First Idea': 'à¶”à¶¶à·š à¶´à·…à¶¸à·” à¶…à¶¯à·„à·ƒ à¶¢à¶±à¶±à¶º à¶šà¶»à¶±à·Šà¶±',
    'Your Launch Roadmap': 'à¶”à¶¶à·š à¶†à¶»à¶¸à·Šà¶·à¶š à¶¸à·à¶»à·Šà¶œ à·ƒà·’à¶­à·’à¶ºà¶¸',
    'Save Plan': 'à·ƒà·à¶½à·à·ƒà·Šà¶¸ à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±',
    'Quick Wins': 'à¶‰à¶šà·Šà¶¸à¶±à·Š à¶¢à¶ºà¶œà·Šâ€à¶»à·„à¶«',
    'First Customers Strategy': 'à¶´à·…à¶¸à·” à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶‹à¶´à·à¶ºà¶¸à·à¶»à·Šà¶œà¶º',
    'Setup Steps': 'à·ƒà·à¶šà·ƒà·”à¶¸à·Š à¶´à·’à¶ºà·€à¶»',
    '7-Day Sprint': 'à¶¯à·’à¶± 7 à¶š à·€à·šà¶œà·€à¶­à·Š à·ƒà·à¶½à·à·ƒà·Šà¶¸',
    '30-Day Milestones': 'à¶¯à·’à¶± 30 à¶‰à¶½à¶šà·Šà¶š',
    'Risk Mitigation': 'à¶…à·€à¶¯à·à¶±à¶¸à·Š à¶…à·€à¶¸ à¶šà·’à¶»à·“à¶¸',
    'Critical Success Factors': 'à·ƒà·à¶»à·Šà¶®à¶šà¶­à·Šà·€à¶ºà¶§ à·€à·à¶¯à¶œà¶­à·Š à·ƒà·à¶°à¶š',
    'Success Tips': 'à·ƒà·à¶»à·Šà¶®à¶šà¶­à·Šà·€ à¶‰à¶Ÿà·’',
    'Weekly Progress Tracker': 'à·ƒà¶­à·’à¶´à¶­à· à¶´à·Šâ€à¶»à¶œà¶­à·’ à¶½à·”à·„à·”à¶¶à·à¶³à·“à¶¸',
    'Analysis Results': 'à·€à·’à·à·Šà¶½à·šà·‚à¶« à¶´à·Šâ€à¶»à¶­à·’à¶µà¶½',
    'Market Demand': 'à·€à·™à·…à¶³à¶´à·œà·… à¶‰à¶½à·Šà¶½à·”à¶¸',
    'Competition': 'à¶­à¶»à¶Ÿà¶šà·à¶»à·“à¶­à·Šà·€à¶º',
    'Risk Assessment': 'à¶…à·€à¶¯à·à¶±à¶¸à·Š à¶‡à¶œà¶ºà·“à¶¸',
    'Cost Estimate': 'à·€à·’à¶ºà¶¯à¶¸à·Š à¶‡à·ƒà·Šà¶­à¶¸à·šà¶±à·Šà¶­à·”à·€',
    'Minimum startup': 'à¶…à·€à¶¸ à¶†à¶»à¶¸à·Šà¶·à¶š à·€à·’à¶ºà¶¯à¶¸',
    'Recommended': 'à¶±à·’à¶»à·Šà¶¯à·šà·à·’à¶­',
    'Breakdown': 'à·€à·’à·ƒà·Šà¶­à¶»',
    // Welcome
    'Your AI-powered startup toolkit. Pick a tool below to get started.': 'à¶”à¶¶à·š AI-à¶¶à¶½à¶œà¶±à·Šà·€à¶± à¶†à¶»à¶¸à·Šà¶·à¶š à¶¸à·™à·€à¶½à¶¸à·Š à¶šà¶§à·Šà¶§à¶½à¶º.',
    'Your AI-powered business intelligence platform. Here\'s your current overview.': 'à¶”à¶¶à·š AI-à·€à·Šâ€à¶ºà·à¶´à·à¶» à¶¶à·”à¶¯à·Šà¶°à·’ à·€à·šà¶¯à·’à¶šà·à·€.',
};


const SI_ATTRIBUTE_TRANSLATIONS = {
    'e.g. Web development, graphic design, copywriting, finance...': 'උදා: වෙබ් සංවර්ධනය, ග්‍රැෆික් නිර්මාණය, copywriting, මූල්‍ය...',
    'e.g. Health & wellness, SaaS tools, e-commerce, education...': 'උදා: සෞඛ්‍ය සහ wellness, SaaS මෙවලම්, e-commerce, අධ්‍යාපනය...',
    'e.g. 500': 'උදා: 500',
    'e.g. A subscription box for local artisan coffee beans targeting remote workers...': 'උදා: දුරස්ථව වැඩ කරන පුද්ගලයින් සඳහා දේශීය artisan coffee beans subscription box එකක්...',
    'e.g. Online tutoring platform for high school maths students...': 'උදා: උසස් පාසල් ගණිත සිසුන් සඳහා online tutoring platform එකක්...',
    'e.g. A mobile app that connects freelance chefs with busy professionals for home-cooked meals...': 'උදා: busy professionals සඳහා home-cooked meals ලබාදීමට freelance chefs සම්බන්ධ කරන mobile app එකක්...',
    "e.g. Our main payment provider went down during a Black Friday sale and customers can't check out...": 'උදා: Black Friday sale එක අතරතුර අපගේ ප්‍රධාන payment provider එක down වී පාරිභෝගිකයින්ට checkout කළ නොහැකි තත්ත්වයක්...',
    'Your name': 'ඔබේ නම',
    'you@example.com': 'you@example.com',
    'Briefly describe this business idea...': 'මෙම ව්‍යාපාර අදහස කෙටියෙන් විස්තර කරන්න...',
    'e.g. EcoPack Subscription Boxes': 'උදා: EcoPack Subscription Boxes'
};

const SI_PHRASE_TRANSLATIONS = {
    'Enter your business idea to get setup steps, a 7-day sprint, and a 30-day milestone roadmap.': 'සැකසුම් පියවර, දින 7 ක වේගවත් ක්‍රියාත්මක සැලැස්මක්, සහ දින 30 ක ප්‍රධාන ඉලක්ක මාර්ග සිතියමක් ලබාගැනීමට ඔබේ ව්‍යාපාර අදහස ඇතුළත් කරන්න.',
    'Generate Instagram posts, ad copies, slogans, and social captions for your business.': 'ඔබේ ව්‍යාපාරය සඳහා Instagram පළ කිරීම්, දැන්වීම් පිටපත්, සටන් පාඨ, සහ සමාජ මාධ්‍ය ශීර්ෂ පාඨ ජනනය කරන්න.',
    'Describe a business crisis. Five AI executives — CEO, Finance, PR, Engineer, Lawyer — will debate it live and reach a final decision.': 'ව්‍යාපාරික අර්බුදයක් විස්තර කරන්න. AI විධායකයින් පහක් — ප්‍රධාන විධායක, මූල්‍ය ප්‍රධානී, මහජන සම්බන්ධතා ප්‍රධානී, ඉංජිනේරු ප්‍රධානී, නීති උපදේශක — එය සජීවීව විවාද කර අවසාන තීරණයකට පැමිණේ.',
    'Enter a business idea to get demand score, competition level, risk profile, and cost estimate.': 'Demand score, competition level, risk profile, සහ cost estimate ලබාගැනීමට ව්‍යාපාර අදහසක් ඇතුළත් කරන්න.',
    'Select the display language for BizShield-AI.': 'BizShield-AI සඳහා පෙන්වන භාෂාව තෝරන්න.',
    'Manage your profile, language, currency, and system preferences.': 'ඔබේ profile, language, currency, සහ system preferences කළමනාකරණය කරන්න.',
    'All financial outputs, dashboards, and reports will reflect this currency.': 'සියලුම මූල්‍ය ප්‍රතිදාන, dashboards, සහ reports මෙම මුදල් ඒකකය අනුව පෙන්වනු ඇත.',
    'Leave blank if unknown': 'නොදන්නේ නම් හිස්ව තබන්න',
    'Describe the crisis': 'අර්බුදය විස්තර කරන්න',
    'Analyse Idea': 'අදහස විශ්ලේෂණය කරන්න',
    'Generate Ideas': 'අදහස් ජනනය කරන්න',
    'Create Project': 'ව්‍යාපෘතිය සාදන්න',
    'Generate new ideas': 'නව අදහස් ජනනය කරන්න',
    'Back to My Projects': 'මගේ ව්‍යාපෘති වෙත ආපසු',
    'Save to Project': 'ව්‍යාපෘතියට සුරකින්න',
    'Create Marketing Kit': 'අලෙවිකරණ කට්ටලය සාදන්න',
    'Run Analysis': 'විශ්ලේෂණය ක්‍රියාත්මක කරන්න',
    'Build a Plan': 'සැලැස්මක් සාදන්න',
    'Processing...': 'සකසමින්...',
    'Loading project…': 'ව්‍යාපෘතිය පූරණය වෙමින්...',
    'Loading your projects…': 'ඔබේ ව්‍යාපෘති පූරණය වෙමින්...'
};

const SI_FRAGMENT_TRANSLATIONS = {
    'Welcome back,': 'ආයුබෝවන්,',
    'Official Site': 'නිල වෙබ් අඩවිය',
    'Generate Ideas': 'අදහස් ජනනය කරන්න',
    'Generate Business Ideas': 'ව්‍යාපාර අදහස් ජනනය කරන්න',
    'Analyze Idea': 'අදහස විශ්ලේෂණය කරන්න',
    'Build a Plan': 'සැලැස්මක් සාදන්න',
    'Marketing Kit': 'අලෙවිකරණ කට්ටලය',
    'Crisis Mode': 'අර්බුද ආකාරය',
    'My Projects': 'මගේ ව්‍යාපෘති',
    'Dashboard': 'උපකරණ පුවරුව',
    'Settings': 'සැකසුම්',
    'Login': 'ඇතුළු වන්න',
    'Register': 'ලියාපදිංචි වන්න',
    'Logout': 'ඉවත් වන්න',
    'Tools': 'මෙවලම්',
    'Ideas': 'අදහස්',
    'Analysis': 'විශ්ලේෂණය',
    'Plan': 'සැලැස්ම',
    'Marketing': 'අලෙවිකරණය',
    'Start here': 'මෙතැනින් ආරම්භ කරන්න',
    'Your Skills': 'ඔබේ කුසලතා',
    'Interest / Niche': 'කැමැත්ත / ක්ෂේත්‍රය',
    'Available Budget': 'ලබා ගත හැකි අයවැය',
    'optional': 'විකල්ප',
    'Leave blank if unknown': 'නොදන්නේ නම් හිස්ව තබන්න',
    'Skills': 'කුසලතා',
    'Interest': 'කැමැත්ත',
    'Budget': 'අයවැය',
    'Industry': 'කර්මාන්තය',
    'Stage': 'අවධිය',
    'Description': 'විස්තරය',
    'Ideation': 'අදහස් අවධිය',
    'Validation': 'තහවුරු කිරීම',
    'Growth': 'වර්ධනය',
    'Scaling': 'පරිමාණය කිරීම',
    'Project Title': 'ව්‍යාපෘති මාතෘකාව',
    'New Project': 'නව ව්‍යාපෘතිය',
    'Create Project': 'ව්‍යාපෘතිය සාදන්න',
    'Cancel': 'අවලංගු කරන්න',
    'Save': 'සුරකින්න',
    'Save Changes': 'වෙනස්කම් සුරකින්න',
    'Save Idea': 'අදහස සුරකින්න',
    'Open Project': 'ව්‍යාපෘතිය විවෘත කරන්න',
    'Delete Project': 'ව්‍යාපෘතිය මකන්න',
    'Delete': 'මකන්න',
    'Loading': 'පූරණය වෙමින්',
    'Loading...': 'පූරණය වෙමින්...',
    'Full Name': 'සම්පූර්ණ නම',
    'Email Address': 'ඊමේල් ලිපිනය',
    'New Password': 'නව මුරපදය',
    'Profile': 'පැතිකඩ',
    'Language': 'භාෂාව',
    'Currency': 'මුදල් ඒකකය',
    'System Preferences': 'පද්ධති මනාප',
    'Dark Mode': 'අඳුරු ආකාරය',
    'Context Memory': 'සන්දර්භ මතකය',
    'Preview': 'පෙරදසුන',
    'English': 'ඉංග්‍රීසි',
    'Sinhala': 'සිංහල',
    'Please': 'කරුණාකර',
    'log in': 'ඇතුළු වන්න',
    'Sign in': 'ඇතුළු වන්න',
    'to access settings.': 'සැකසුම් වෙත පිවිසීමට.',
    'AI generates': 'AI ජනනය කරයි',
    'business ideas': 'ව්‍යාපාර අදහස්',
    'tailored to your skills': 'ඔබේ කුසලතා අනුව සකසන ලද',
    'budget': 'අයවැය',
    'Get demand score': 'ඉල්ලුම් ලකුණු ලබාගන්න',
    'competition level': 'තරඟකාරී මට්ටම',
    'risk': 'අවදානම',
    'cost breakdown': 'වියදම් විස්තරය',
    'Setup steps': 'සැකසුම් පියවර',
    '7-day sprint': 'දින 7 sprint',
    '30-day milestone roadmap': 'දින 30 milestone roadmap',
    'Generate posts': 'පළ කිරීම් ජනනය කරන්න',
    'ad copies': 'දැන්වීම් පිටපත්',
    'slogans': 'සටන් පාඨ',
    'social captions': 'සමාජ මාධ්‍ය captions',
    'Every business idea': 'සෑම ව්‍යාපාර අදහසක්ම',
    "you've saved": 'ඔබ සුරැකූ',
    'AI-generated documents': 'AI-ජනනය කළ ලේඛන',
    'attached to it': 'එයට අමුණා ඇති',
    'Created': 'සාදන ලදී',
    'Available documents': 'ලබාගත හැකි ලේඛන',
    'No documents yet': 'තවම ලේඛන නොමැත',
    'Industry not set': 'කර්මාන්තය සකසා නැත',
    'Untitled project': 'නම් නොකළ ව්‍යාපෘතිය',
    'Untitled idea': 'නම් නොකළ අදහස',
    'No description provided.': 'විස්තරයක් ලබාදී නැත.',
    'Why it fits:': 'ඇයි මෙය ගැළපෙන්නේ:',
    'Cost TBD': 'වියදම තවම තීරණය වී නැත',
    'Timeline TBD': 'කාලසීමාව තවම තීරණය වී නැත',
    'Score:': 'ලකුණු:',
    'Analyse': 'විශ්ලේෂණය කරන්න',
    'Analyze': 'විශ්ලේෂණය කරන්න',
    'Saved': 'සුරැකිණි',
    'Saving': 'සුරකිමින්',
    'Error:': 'දෝෂය:',
    'No activity yet.': 'තවම ක්‍රියාකාරකම් නොමැත.',
    'Recent Activity': 'මෑත ක්‍රියාකාරකම්',
    'Total Projects': 'මුළු ව්‍යාපෘති',
    'Total Ideas': 'මුළු අදහස්',
    'Total Marketing Plans': 'මුළු අලෙවිකරණ සැලසුම්',
    'Total Marketing': 'මුළු අලෙවිකරණය'
};

Object.assign(SI_FRAGMENT_TRANSLATIONS, {
    'Business Analysis': 'ව්‍යාපාර විශ්ලේෂණය',
    'Business Idea': 'ව්‍යාපාර අදහස',
    'Your Business Idea': 'ඔබේ ව්‍යාපාර අදහස',
    'Analyse Idea': 'අදහස විශ්ලේෂණය කරන්න',
    'Run Analysis': 'විශ්ලේෂණය ක්‍රියාත්මක කරන්න',
    'Enter a business idea': 'ව්‍යාපාර අදහසක් ඇතුළත් කරන්න',
    'demand score': 'ඉල්ලුම් ලකුණු',
    'risk profile': 'අවදානම් පැතිකඩ',
    'cost estimate': 'වියදම් ඇස්තමේන්තුව',
    'Market Demand': 'වෙළඳපොළ ඉල්ලුම',
    'Competition': 'තරඟකාරීත්වය',
    'Risk Assessment': 'අවදානම් ඇගයීම',
    'Cost Estimate': 'වියදම් ඇස්තමේන්තුව',
    'Minimum startup': 'අවම ආරම්භක වියදම',
    'Recommended': 'නිර්දේශිත',
    'Breakdown': 'විස්තරය',
    'Save Analysis': 'විශ්ලේෂණය සුරකින්න',
    'Analysis Results': 'විශ්ලේෂණ ප්‍රතිඵල',
    'Build a Launch Plan': 'දියත් කිරීමේ සැලැස්මක් සාදන්න',
    'Launch Plan': 'දියත් කිරීමේ සැලැස්ම',
    'Generate Plan': 'සැලැස්ම ජනනය කරන්න',
    'Your Launch Roadmap': 'ඔබේ දියත් කිරීමේ roadmap',
    'Quick Wins': 'ඉක්මන් ජයග්‍රහණ',
    'First Customers Strategy': 'පළමු පාරිභෝගික උපායමාර්ගය',
    'Risk Mitigation': 'අවදානම් අවම කිරීම',
    'Critical Success Factors': 'සාර්ථකත්වයට වැදගත් සාධක',
    'Success Tips': 'සාර්ථකත්ව ඉඟි',
    'Weekly Progress Tracker': 'සතිපතා ප්‍රගති ලුහුබැඳීම',
    '30-Day Milestones': 'දින 30 milestones',
    '7-Day Sprint': 'දින 7 sprint',
    'Save Plan': 'සැලැස්ම සුරකින්න',
    'Enter your business idea': 'ඔබේ ව්‍යාපාර අදහස ඇතුළත් කරන්න',
    'a 7-day sprint': 'දින 7 sprint එකක්',
    'a 30-day milestone roadmap': 'දින 30 milestone roadmap එකක්',
    'Marketing Kit': 'අලෙවිකරණ කට්ටලය',
    'Generate Marketing Kit': 'අලෙවිකරණ කට්ටලය ජනනය කරන්න',
    'Your Marketing Kit': 'ඔබේ අලෙවිකරණ කට්ටලය',
    'Save Marketing': 'අලෙවිකරණය සුරකින්න',
    'Social Media Posts': 'සමාජ මාධ්‍ය පළ කිරීම්',
    'Ad Copies': 'දැන්වීම් පිටපත්',
    'Slogans': 'සටන් පාඨ',
    'Social Captions': 'සමාජ මාධ්‍ය captions',
    'Instagram posts': 'Instagram පළ කිරීම්',
    'for your business': 'ඔබේ ව්‍යාපාරය සඳහා',
    'Copy': 'පිටපත් කරන්න',
    'Copied': 'පිටපත් විය',
    'No data available': 'දත්ත නොමැත',
    'Log in to save': 'සුරැකීමට ඇතුළු වන්න',
    'Project Workspace': 'ව්‍යාපෘති වැඩබිම',
    'Back to My Projects': 'මගේ ව්‍යාපෘති වෙත ආපසු',
    'Document': 'ලේඛනය',
    'Documents': 'ලේඛන',
    'Favorite': 'ප්‍රියතම',
    'Tags': 'ටැග්',
    'Crisis under review': 'සමාලෝචනය වන අර්බුදය',
    'Live Debate Panel': 'සජීවී විවාද මණ්ඩලය',
    'Final Decision': 'අවසාන තීරණය',
    'Problem analysis:': 'ගැටලු විශ්ලේෂණය:',
    'Solution:': 'විසඳුම:',
    'Final Weighted Risk Score': 'අවසාන බරිත අවදානම් ලකුණු',
    "CEO's Closing Statement": 'CEOගේ අවසාන ප්‍රකාශය',
    'Recovery Plan': 'ප්‍රතිසාධන සැලැස්ම',
    'Immediate actions': 'ක්ෂණික ක්‍රියාමාර්ග',
    'Short-term actions': 'කෙටි කාලීන ක්‍රියාමාර්ග',
    'Long-term strategy': 'දිගු කාලීන උපායමාර්ගය',
    'Save Outcome to Project': 'ප්‍රතිඵලය ව්‍යාපෘතියට සුරකින්න',
    'View in Project': 'ව්‍යාපෘතිය තුළ බලන්න',
    'Agrees': 'එකඟයි',
    'Disagrees': 'එකඟ නැත',
    'Neutral': 'මධ්‍යස්ථ',
    'Risk': 'අවදානම',
    'Aligned': 'එකඟතාව ඇත',
    'HIGH CONFLICT': 'ඉහළ මතභේදය',
    'HIGH CONFLICT detected': 'ඉහළ මතභේදයක් හඳුනාගෙන ඇත',
    'Convene the Boardroom': 'මණ්ඩල සාකච්ඡාව ආරම්භ කරන්න',
    'Run Boardroom Debate': 'මණ්ඩල විවාදය ක්‍රියාත්මක කරන්න',
    'Describe the crisis': 'අර්බුදය විස්තර කරන්න',
    'Log in to BizShield AI': 'BizShield AI වෙත ඇතුළු වන්න',
    'Create your BizShield AI account': 'ඔබේ BizShield AI ගිණුම සාදන්න',
    'New to BizShield AI?': 'BizShield AI වෙත අලුත්ද?',
    'Already have an account?': 'දැනටමත් ගිණුමක් තිබේද?',
    'Password': 'මුරපදය',
    'Create account': 'ගිණුම සාදන්න',
    'Account created': 'ගිණුම සාදන ලදී',
    'Welcome': 'සාදරයෙන් පිළිගනිමු'
});


Object.assign(SI_PHRASE_TRANSLATIONS, {
    "Tell us about your skills and interests — we'll generate 5 tailored startup ideas.": "ඔබේ කුසලතා සහ කැමැත්ත ගැන කියන්න — අපි ඔබට ගැළපෙන startup අදහස් 5ක් ජනනය කරන්නෙමු.",
    "AI generates 5 business ideas tailored to your skills & budget.": "ඔබේ කුසලතා සහ අයවැයට ගැළපෙන ව්‍යාපාර අදහස් 5ක් AI ජනනය කරයි.",
    "Every business idea you've saved, along with the AI-generated documents attached to it.": "ඔබ සුරැකූ සෑම ව්‍යාපාර අදහසක්ම සහ එයට අමුණා ඇති AI-ජනනය කළ ලේඛන මෙහි පෙන්වයි.",
    "Enter your business idea": "ඔබේ ව්‍යාපාර අදහස ඇතුළත් කරන්න",
    "Describe your business idea": "ඔබේ ව්‍යාපාර අදහස විස්තර කරන්න",
    "Tell us about your skills and interests": "ඔබේ කුසලතා සහ කැමැත්ත ගැන කියන්න"
});

Object.assign(SI_TRANSLATIONS, {
    'What We Offer': 'අපි ලබාදෙන දේ',
    'Get Started': 'ආරම්භ කරන්න',
    'Ready to start?': 'ආරම්භ කිරීමට සූදානම්ද?',
    'Idea Generation': 'අදහස් ජනනය',
    'Business Analysis': 'ව්‍යාපාර විශ්ලේෂණය',
    'Analyses Run': 'ක්‍රියාත්මක කළ විශ්ලේෂණ',
    'Avg Rating': 'සාමාන්‍ය ඇගයීම',
    'Project History': 'ව්‍යාපෘති ඉතිහාසය',
    'Open Project': 'ව්‍යාපෘතිය විවෘත කරන්න',
    'Delete Project': 'ව්‍යාපෘතිය මකන්න',
    'Create Project': 'ව්‍යාපෘතිය සාදන්න',
    'Project Workspace': 'ව්‍යාපෘති වැඩබිම',
    'Documents': 'ලේඛන',
    'Idea': 'අදහස',
    'Market Analysis': 'වෙළඳපොළ විශ්ලේෂණය',
    'SWOT': 'SWOT',
    'Marketing Plan': 'අලෙවිකරණ සැලැස්ම',
    'Financial Forecast': 'මූල්‍ය පුරෝකථනය',
    'Pitch Deck': 'Pitch Deck',
    'Unknown date': 'දිනය නොදනී',
    'Industry not set': 'කර්මාන්තය සකසා නැත',
    'Created': 'සාදන ලදී',
    'Available documents': 'ලබාගත හැකි ලේඛන',
    'No documents yet': 'තවම ලේඛන නොමැත',
    'No documents yet.': 'තවම ලේඛන නොමැත.',
    'Choose an existing project': 'පවතින ව්‍යාපෘතියක් තෝරන්න',
    'New project title': 'නව ව්‍යාපෘති මාතෘකාව',
    'Close': 'වසන්න',
    'Copy': 'පිටපත් කරන්න',
    'Copied': 'පිටපත් විය',
    'Save cancelled.': 'සුරැකීම අවලංගු විය.',
    'Failed to create project.': 'ව්‍යාපෘතිය සෑදීමට නොහැකි විය.',
    'Choose an existing project or enter a title for a new one.': 'පවතින ව්‍යාපෘතියක් තෝරන්න හෝ නව එකකට මාතෘකාවක් ඇතුළත් කරන්න.',
    'Saving...': 'සුරකිමින්...',
    'Save failed': 'සුරැකීම අසාර්ථක විය',
    'Settings saved successfully!': 'සැකසුම් සාර්ථකව සුරැකිණි!',
    'Preferences saved locally.': 'මනාප දේශීයව සුරැකිණි.',
    'Please': 'කරුණාකර',
    'to access settings.': 'සැකසුම් වෙත පිවිසීමට.',
    'User': 'පරිශීලක',
    'Toggle between dark and light theme': 'අඳුරු සහ ආලෝක තේමාව අතර මාරු වන්න',
    'AI uses your project history to enrich responses': 'AI පිළිතුරු වැඩිදියුණු කිරීමට ඔබේ ව්‍යාපෘති ඉතිහාසය භාවිත කරයි',
    'Preview': 'පෙරදසුන',
    'English': 'ඉංග්‍රීසි',
    'Sinhala': 'සිංහල',
    'Name, email, and password are required': 'නම, ඊමේල් ලිපිනය, සහ මුරපදය අවශ්‍ය වේ',
    'Email and password are required': 'ඊමේල් ලිපිනය සහ මුරපදය අවශ්‍ය වේ',
    'Invalid email or password': 'ඊමේල් ලිපිනය හෝ මුරපදය වැරදිය',
    'Please log in to continue.': 'ඉදිරියට යාමට කරුණාකර ඇතුළු වන්න.',
    'Not authorized. Please log in.': 'අවසර නොමැත. කරුණාකර ඇතුළු වන්න.',
    'Not authorized. Token is invalid or expired.': 'අවසර නොමැත. ටෝකනය වැරදිය හෝ කල් ඉකුත් වී ඇත.',
    'Project title is required': 'ව්‍යාපෘති මාතෘකාව අවශ්‍ය වේ',
    'Idea title and description are required': 'අදහස් මාතෘකාව සහ විස්තරය අවශ්‍ය වේ',
    'Could not save idea': 'අදහස සුරැකීමට නොහැකි විය',
    'Could not create project': 'ව්‍යාපෘතිය සෑදීමට නොහැකි විය',
    'Could not load projects': 'ව්‍යාපෘති පූරණය කිරීමට නොහැකි විය',
    'Could not load project': 'ව්‍යාපෘතිය පූරණය කිරීමට නොහැකි විය',
    'Could not delete project': 'ව්‍යාපෘතිය මැකීමට නොහැකි විය',
    'Failed to delete project.': 'ව්‍යාපෘතිය මැකීමට අසාර්ථක විය.',
    'Failed to delete document.': 'ලේඛනය මැකීමට අසාර්ථක විය.'
});

Object.assign(SI_PHRASE_TRANSLATIONS, {
    'Transform your business vision into reality.': 'ඔබේ ව්‍යාපාර දැක්ම සැබෑ කරගන්න.',
    'BizShiled-AI is a full-stack platform that helps you discover market opportunities, build an MVP, and scale with data-driven insights.': 'BizShield-AI වෙළඳපොළ අවස්ථා හඳුනාගැනීමට, MVP එකක් ගොඩනැගීමට, සහ දත්ත මත පදනම් වූ අවබෝධයෙන් වර්ධනය වීමට උදව් කරන සම්පූර්ණ ව්‍යාපාර වේදිකාවකි.',
    'BizShield-AI is a full-stack platform that helps you discover market opportunities, build an MVP, and scale with data-driven insights.': 'BizShield-AI වෙළඳපොළ අවස්ථා හඳුනාගැනීමට, MVP එකක් ගොඩනැගීමට, සහ දත්ත මත පදනම් වූ අවබෝධයෙන් වර්ධනය වීමට උදව් කරන සම්පූර්ණ ව්‍යාපාර වේදිකාවකි.',
    'AI-driven tools generate 5 personalized business ideas based on your skills, budget, and interests.': 'ඔබේ කුසලතා, අයවැය, සහ කැමැත්ත මත පදනම්ව AI මෙවලම් පුද්ගලික ව්‍යාපාර අදහස් 5ක් ජනනය කරයි.',
    'Deep-dive into market demand, competition level, risk profile, and startup cost estimates.': 'වෙළඳපොළ ඉල්ලුම, තරඟකාරී මට්ටම, අවදානම් පැතිකඩ, සහ ආරම්භක වියදම් ඇස්තමේන්තු ගැඹුරින් විශ්ලේෂණය කරන්න.',
    'Get a full roadmap — setup steps, 7-day sprints, and 30-day milestone plans to launch fast.': 'වේගයෙන් දියත් කිරීමට setup steps, දින 7 sprint, සහ දින 30 milestone සැලසුම් සහිත සම්පූර්ණ roadmap එකක් ලබාගන්න.',
    'Generate Instagram posts, ad copies, slogans, and social captions with one click.': 'එක් click එකකින් Instagram posts, ad copies, slogans, සහ social captions ජනනය කරන්න.',
    "You don't have any projects yet. Create one to save this content.": 'ඔබට තවම ව්‍යාපෘති නොමැත. මෙම අන්තර්ගතය සුරැකීමට එකක් සාදන්න.',
    'or create a new project': 'හෝ නව ව්‍යාපෘතියක් සාදන්න',
    '— or create a new project —': '— හෝ නව ව්‍යාපෘතියක් සාදන්න —',
    'No projects yet': 'තවම ව්‍යාපෘති නොමැත',
    'Save an idea from Growth Mode, or create a new project to start a workspace.': 'Growth Mode වෙතින් අදහසක් සුරකින්න, නැතහොත් වැඩබිමක් ආරම්භ කිරීමට නව ව්‍යාපෘතියක් සාදන්න.',
    'Still loading your projects. If this continues, check your connection or try again.': 'ඔබේ ව්‍යාපෘති තවම පූරණය වෙමින් පවතී. මෙය දිගටම පවතී නම් සම්බන්ධතාවය පරීක්ෂා කරන්න හෝ නැවත උත්සාහ කරන්න.',
    'Project title is required.': 'ව්‍යාපෘති මාතෘකාව අවශ්‍ය වේ.',
    'Failed to load projects.': 'ව්‍යාපෘති පූරණය කිරීමට අසාර්ථක විය.',
    'Delete': 'මකන්න',
    'Deleting': 'මකමින්...',
    'Creating...': 'සාදමින්...',
    'Your 5 Business Ideas': 'ඔබේ ව්‍යාපාර අදහස් 5',
    'Please fill in both': 'කරුණාකර දෙකම පුරවන්න:',
    'fields.': 'ක්ෂේත්‍ර.',
    'Generating...': 'ජනනය වෙමින්...',
    'AI is crafting your personalised business ideas…': 'AI ඔබට ගැළපෙන ව්‍යාපාර අදහස් සකසමින් පවතී...',
    'No ideas returned. Please try again.': 'අදහස් ලැබුණේ නැත. කරුණාකර නැවත උත්සාහ කරන්න.',
    'Timeline TBD': 'කාලසීමාව තවම තීරණය වී නැත',
    'Untitled idea': 'නම් නොකළ අදහස',
    'No description provided.': 'විස්තරයක් ලබාදී නැත.',
    'Why it fits:': 'ඇයි මෙය ගැළපෙන්නේ:',
    'No fit explanation provided.': 'ගැළපීම පිළිබඳ විස්තරයක් ලබාදී නැත.',
    'Cost TBD': 'වියදම තවම තීරණය වී නැත',
    'Score:': 'ලකුණු:',
    'Save Idea': 'අදහස සුරකින්න',
    'Analyse': 'විශ්ලේෂණය කරන්න',
    'Click': 'ක්ලික් කරන්න',
    'on any card to get a deep-dive on that idea.': 'ඒ අදහස ගැන ගැඹුරු විශ්ලේෂණයක් ලබාගැනීමට ඕනෑම කාඩ්පතක.',
    'Use': 'භාවිත කරන්න',
    'to keep the best options in your account.': 'හොඳම විකල්ප ඔබේ ගිණුමේ තබාගැනීමට.',
    'Log in to save ideas to your account.': 'ඔබේ ගිණුමට අදහස් සුරැකීමට ඇතුළු වන්න.',
    'Saved to your account.': 'ඔබේ ගිණුමට සුරැකිණි.',
    'Sign in to see your project statistics.': 'ඔබේ ව්‍යාපෘති සංඛ්‍යාලේඛන බැලීමට ඇතුළු වන්න.',
    'Log in to see your project statistics and recent activity.': 'ඔබේ ව්‍යාපෘති සංඛ්‍යාලේඛන සහ මෑත ක්‍රියාකාරකම් බැලීමට ඇතුළු වන්න.',
    'No activity yet. Generate and save your first idea to get started.': 'තවම ක්‍රියාකාරකම් නොමැත. ආරම්භ කිරීමට ඔබේ පළමු අදහස ජනනය කර සුරකින්න.',
    'was': 'විය',
    'in project:': 'ව්‍යාපෘතිය තුළ:',
    'created': 'සාදන ලදී',
    'updated': 'යාවත්කාලීන කරන ලදී',
    'deleted': 'මකා දමන ලදී',
    'project': 'ව්‍යාපෘතිය',
    'market analysis': 'වෙළඳපොළ විශ්ලේෂණය',
    'marketing plan': 'අලෙවිකරණ සැලැස්ම',
    'business model': 'ව්‍යාපාර සැලැස්ම',
    'financial forecast': 'මූල්‍ය පුරෝකථනය',
    'risk assessment': 'අවදානම් ඇගයීම',
    'pitch deck': 'Pitch Deck',
    'AI Feasibility Score': 'AI ශක්‍යතා ලකුණු',
    'AI Insights': 'AI අවබෝධ',
    'AI Ranking': 'AI ශ්‍රේණිගත කිරීම',
    'No AI result widgets are available yet.': 'තවම AI ප්‍රතිඵල widgets නොමැත.',
    'The backend response did not include feasibility, insights, or ranking data.': 'Backend ප්‍රතිචාරයේ ශක්‍යතාව, අවබෝධ, හෝ ශ්‍රේණිගත දත්ත ඇතුළත් නොවීය.',
    'No additional insights were available.': 'අමතර අවබෝධ නොලැබුණි.',
    'Rank': 'ශ්‍රේණිය',
    'Showing top 5 of': 'ඉහළ 5 පෙන්වයි, මුළු ගණන:',
    'Unable to load the latest AI analysis result.': 'නවතම AI විශ්ලේෂණ ප්‍රතිඵලය පූරණය කළ නොහැක.',
    'Please log in to access settings.': 'සැකසුම් වෙත පිවිසීමට කරුණාකර ඇතුළු වන්න.',
    'Leave blank to keep current': 'දැනට ඇති එක තබාගැනීමට හිස්ව තබන්න',
    'New Password (leave blank to keep current)': 'නව මුරපදය (දැනට ඇති එක තබාගැනීමට හිස්ව තබන්න)',
    '$1,500 USD will display as': 'USD $1,500 මෙසේ පෙන්වනු ඇත',
    'using the latest cached exchange rate': 'නවතම cache කළ විනිමය අනුපාතය භාවිත කරමින්',
    'Select the display language for BizShield-AI.': 'BizShield-AI සඳහා පෙන්වන භාෂාව තෝරන්න.',
    'Manage your profile, language, currency, and system preferences.': 'ඔබේ පැතිකඩ, භාෂාව, මුදල් ඒකකය, සහ පද්ධති මනාප කළමනාකරණය කරන්න.',
    'All financial outputs, dashboards, and reports will reflect this currency.': 'සියලුම මූල්‍ය ප්‍රතිදාන, උපකරණ පුවරු, සහ වාර්තා මෙම මුදල් ඒකකයෙන් පෙන්වනු ඇත.'
});
function repairSinhalaMojibake(value) {
    const text = String(value ?? '');
    if (!/[\u00c0-\u00ff\u20ac\u201a-\u201e\u2020-\u2022\u2030\u2039\u0152\u017d\u2018-\u201d\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178]/.test(text)) return text;

    const cp1252 = {
        0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
        0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
        0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
        0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
        0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
        0x017e: 0x9e, 0x0178: 0x9f
    };

    const bytes = [];
    for (const ch of text) {
        const code = ch.charCodeAt(0);
        if (code <= 0xff) bytes.push(code);
        else if (cp1252[code]) bytes.push(cp1252[code]);
        else return text;
    }

    try {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
    } catch (_) {
        return text;
    }
}
function normalizeBSText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function translateSinhalaFragments(value) {
    let output = String(value ?? '');
    const entries = Object.entries(SI_FRAGMENT_TRANSLATIONS)
        .sort((a, b) => b[0].length - a[0].length);

    for (const [source, target] of entries) {
        const repairedSource = repairSinhalaMojibake(source);
        output = output.split(source).join(repairSinhalaMojibake(target));
        if (repairedSource !== source) {
            output = output.split(repairedSource).join(repairSinhalaMojibake(target));
        }
    }

    return output !== String(value ?? '') ? output : '';
}

function translateSinhalaValue(value) {
    const raw = String(value ?? '');
    const trimmed = normalizeBSText(raw);
    if (!trimmed) return '';
    const repaired = normalizeBSText(repairSinhalaMojibake(trimmed));
    if (SI_TRANSLATIONS[trimmed]) return repairSinhalaMojibake(SI_TRANSLATIONS[trimmed]);
    if (SI_ATTRIBUTE_TRANSLATIONS[trimmed]) return repairSinhalaMojibake(SI_ATTRIBUTE_TRANSLATIONS[trimmed]);
    if (SI_PHRASE_TRANSLATIONS[trimmed]) return repairSinhalaMojibake(SI_PHRASE_TRANSLATIONS[trimmed]);
    if (repaired !== trimmed) {
        if (SI_TRANSLATIONS[repaired]) return repairSinhalaMojibake(SI_TRANSLATIONS[repaired]);
        if (SI_ATTRIBUTE_TRANSLATIONS[repaired]) return repairSinhalaMojibake(SI_ATTRIBUTE_TRANSLATIONS[repaired]);
        if (SI_PHRASE_TRANSLATIONS[repaired]) return repairSinhalaMojibake(SI_PHRASE_TRANSLATIONS[repaired]);
    }
    return translateSinhalaFragments(trimmed);
}

const bsOriginalTextNodes = new WeakMap();
const bsOriginalAttributes = new WeakMap();
let bsOriginalTitle = null;

function getOriginalAttributeMap(el) {
    let attrs = bsOriginalAttributes.get(el);
    if (!attrs) {
        attrs = {};
        bsOriginalAttributes.set(el, attrs);
    }
    return attrs;
}

function restoreEnglish(root = document.body) {
    if (!root) return;
    const scope = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    if (root.nodeType === Node.TEXT_NODE) {
        if (bsOriginalTextNodes.has(root)) root.nodeValue = bsOriginalTextNodes.get(root);
        return;
    }

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const nodesToRestore = [];
    while (walker.nextNode()) nodesToRestore.push(walker.currentNode);
    nodesToRestore.forEach(node => {
        if (bsOriginalTextNodes.has(node)) node.nodeValue = bsOriginalTextNodes.get(node);
    });

    const candidates = [];
    if (scope.matches?.('[placeholder], [title], [aria-label]')) candidates.push(scope);
    scope.querySelectorAll?.('[placeholder], [title], [aria-label]').forEach(el => candidates.push(el));
    candidates.forEach(el => {
        const attrs = bsOriginalAttributes.get(el);
        if (!attrs) return;
        Object.keys(attrs).forEach(attr => {
            if (attrs[attr] == null) el.removeAttribute(attr);
            else el.setAttribute(attr, attrs[attr]);
        });
    });

    if (bsOriginalTitle) document.title = bsOriginalTitle;
}

function applySinhalaAttributes(root = document.body) {
    if (!root) return;
    const scope = root.nodeType === Node.ELEMENT_NODE ? root : document.body;
    const candidates = [];
    if (scope.matches?.('[placeholder], [title], [aria-label]')) candidates.push(scope);
    scope.querySelectorAll?.('[placeholder], [title], [aria-label]').forEach(el => candidates.push(el));
    candidates.forEach(el => {
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
            if (!el.hasAttribute(attr)) return;
            const attrs = getOriginalAttributeMap(el);
            if (!Object.prototype.hasOwnProperty.call(attrs, attr)) attrs[attr] = el.getAttribute(attr);
            const translated = translateSinhalaValue(attrs[attr]);
            if (translated) el.setAttribute(attr, translated);
        });
    });
    if (!bsOriginalTitle) bsOriginalTitle = document.title;
    const titleTranslated = translateSinhalaValue(bsOriginalTitle.replace(/^BizShi(?:eld|led)-AI\s*[–-]\s*/i, '').trim());
    if (titleTranslated) document.title = `BizShield-AI - ${titleTranslated}`;
}/**
 * Apply Sinhala translations to the current page.
 * Only translates text nodes â€” never touches attributes or scripts.
 */
function applySinhala(root = document.body) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
        translateSinhalaTextNode(root);
        applySinhalaAttributes(document.body);
        return;
    }

    const walker = document.createTreeWalker(
        root || document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName;
                // Skip script, style, input values
                if (['SCRIPT', 'STYLE', 'TEXTAREA'].includes(tag)) return NodeFilter.FILTER_REJECT;
                if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodesToUpdate = [];
    while (walker.nextNode()) nodesToUpdate.push(walker.currentNode);
    nodesToUpdate.forEach(translateSinhalaTextNode);
    applySinhalaAttributes(root || document.body);
}

function translateSinhalaTextNode(node) {
    if (!bsOriginalTextNodes.has(node)) bsOriginalTextNodes.set(node, node.nodeValue);
    const orig = bsOriginalTextNodes.get(node);
    const text = orig.trim();
    const translated = translateSinhalaValue(text);
    if (!translated || translated === text) return;

    const leading = orig.match(/^\s*/)[0];
    const trailing = orig.match(/\s*$/)[0];
    node.nodeValue = leading + translated + trailing;
}

let bsSinhalaObserver = null;
let bsSinhalaObserverBusy = false;

function enableSinhalaObserver() {
    if (bsSinhalaObserver || !document.body) return;
    bsSinhalaObserver = new MutationObserver((mutations) => {
        if (bsSinhalaObserverBusy || getBSLanguage() !== 'si') return;
        bsSinhalaObserverBusy = true;
        requestAnimationFrame(() => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData') {
                    applySinhala(mutation.target);
                    return;
                }
                if (mutation.type === 'attributes') {
                    applySinhalaAttributes(mutation.target);
                    return;
                }
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                        applySinhala(node);
                    }
                });
            });
            bsSinhalaObserverBusy = false;
        });
    });
    bsSinhalaObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'title', 'aria-label']
    });
}

function disableSinhalaObserver() {
    if (!bsSinhalaObserver) return;
    bsSinhalaObserver.disconnect();
    bsSinhalaObserver = null;
}

// â”€â”€ Apply on DOM ready â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener('DOMContentLoaded', () => {
    const lang = getBSLanguage();
    const currency = getBSCurrency();
    applyLanguageFontState(lang);
    refreshBSExchangeRates().then(() => {
        if (currency !== 'USD') patchCurrencyInElement(document.body, currency);
    });

    // â‘  Update dashboard badges if present
    const userObj = (() => { try { return JSON.parse(localStorage.getItem('bizshieldai-user') || 'null'); } catch (_) { return null; } })();

    const nameEl = document.getElementById('dash-username');
    if (nameEl && userObj?.name) {
        nameEl.textContent = userObj.name.split(' ')[0];
    }

    const currBadge = document.getElementById('dash-currency-badge');
    if (currBadge) currBadge.innerHTML = `<i class="fas fa-coins me-1"></i>${currency}`;

    const langBadge = document.getElementById('dash-lang-badge');
    if (langBadge) langBadge.innerHTML = `<i class="fas fa-globe me-1"></i>${lang === 'si' ? repairSinhalaMojibake('à·ƒà·’à¶‚') : 'EN'}`;

    // â‘¡ Apply Sinhala if selected
    if (lang === 'si') {
        applySinhala();
        enableSinhalaObserver();
    } else {
        disableSinhalaObserver();
    }

    // â‘¢ Patch all cost/currency strings rendered in the DOM after AI responses load
    if (currency !== 'USD') {
        patchCurrencyInElement(document.body, currency);
        // Observe DOM for new content with dollar signs and convert them
        const costObs = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        patchCurrencyInElement(node, currency);
                    }
                });
            });
        });
        costObs.observe(document.body, { childList: true, subtree: true });
    }
});

document.addEventListener('bizshield:currencyChange', (event) => {
    const currency = event.detail?.currency || getBSCurrency();
    if (currency !== 'USD') patchCurrencyInElement(document.body, currency);
});

document.addEventListener('bizshield:languageChange', (event) => {
    const lang = event.detail?.language || getBSLanguage();
    applyLanguageFontState(lang);
    if (lang === 'si') {
        applySinhala();
        enableSinhalaObserver();
    } else {
        disableSinhalaObserver();
        restoreEnglish();
    }
});

document.addEventListener('bizshield:ratesReady', () => {
    const currency = getBSCurrency();
    if (currency !== 'USD') patchCurrencyInElement(document.body, currency);
});

/**
 * Walk an element and convert any text nodes that look like dollar amounts.
 * Called when new AI-generated content is added to the DOM.
 */
function patchCurrencyInElement(el, currency) {
    if (!el || currency === 'USD') return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            const tag = parent?.tagName;
            if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (parent?.closest?.('.currency-btn, [data-no-currency-convert]')) return NodeFilter.FILTER_REJECT;
            if (node.nodeValue.includes('$') || /\bUSD\b/i.test(node.nodeValue)) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_REJECT;
        }
    });
    const updates = [];
    while (walker.nextNode()) updates.push(walker.currentNode);
    updates.forEach(node => {
        node.nodeValue = convertCostString(node.nodeValue, currency);
    });
}

// â”€â”€ Expose globally so page JS can call them â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.bsFormatCurrency = bsFormatCurrency;
window.bsConvertUSDToCurrency = bsConvertUSDToCurrency;
window.getBSCurrency = getBSCurrency;
window.getBSLanguage = getBSLanguage;
window.applyLanguageFontState = applyLanguageFontState;
window.bsT = bsT;
window.applySinhala = applySinhala;
window.restoreEnglish = restoreEnglish;
window.translateSinhalaValue = translateSinhalaValue;
window.getBSExchangeRate = getBSExchangeRate;
window.refreshBSExchangeRates = refreshBSExchangeRates;
window.convertCostString = convertCostString;
window.patchCurrencyInElement = patchCurrencyInElement;
