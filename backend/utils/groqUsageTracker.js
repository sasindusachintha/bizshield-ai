const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const USAGE_FILE = path.join(DATA_DIR, "groq-usage.json");
const DEFAULT_DAILY_TOKEN_LIMIT = 100000;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDailyTokenLimit() {
  const configured = Number(process.env.GROQ_DAILY_TOKEN_LIMIT);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_DAILY_TOKEN_LIMIT;
}

function emptyUsage() {
  return {
    days: {},
    lastRequest: null,
    lastRateLimit: null,
  };
}

function readUsage() {
  try {
    if (!fs.existsSync(USAGE_FILE)) return emptyUsage();
    const parsed = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
    return {
      ...emptyUsage(),
      ...parsed,
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
    };
  } catch (_) {
    return emptyUsage();
  }
}

function writeUsage(usage) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

function normalizeUsage(usage = {}) {
  return {
    promptTokens: Number(usage.prompt_tokens || usage.promptTokens || 0),
    completionTokens: Number(usage.completion_tokens || usage.completionTokens || 0),
    totalTokens: Number(usage.total_tokens || usage.totalTokens || 0),
  };
}

function recordGroqUsage({ model, usage, requestType = "chat.completions" }) {
  const tokens = normalizeUsage(usage);
  if (!tokens.totalTokens) return getGroqUsageSummary();

  const stored = readUsage();
  const key = todayKey();
  const day = stored.days[key] || {
    date: key,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requests: 0,
    byModel: {},
  };

  day.promptTokens += tokens.promptTokens;
  day.completionTokens += tokens.completionTokens;
  day.totalTokens += tokens.totalTokens;
  day.requests += 1;

  const modelKey = model || "unknown";
  const modelUsage = day.byModel[modelKey] || {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requests: 0,
  };
  modelUsage.promptTokens += tokens.promptTokens;
  modelUsage.completionTokens += tokens.completionTokens;
  modelUsage.totalTokens += tokens.totalTokens;
  modelUsage.requests += 1;
  day.byModel[modelKey] = modelUsage;

  stored.days[key] = day;
  stored.lastRequest = {
    at: new Date().toISOString(),
    model: modelKey,
    requestType,
    ...tokens,
  };

  writeUsage(stored);
  return getGroqUsageSummary(stored);
}

function recordGroqRateLimit(errorMessage) {
  const stored = readUsage();
  stored.lastRateLimit = {
    at: new Date().toISOString(),
    message: String(errorMessage || ""),
  };
  writeUsage(stored);
  return getGroqUsageSummary(stored);
}

function getGroqUsageSummary(existingUsage = null) {
  const stored = existingUsage || readUsage();
  const key = todayKey();
  const today = stored.days[key] || {
    date: key,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requests: 0,
    byModel: {},
  };
  const dailyLimit = getDailyTokenLimit();
  const remainingTokens = Math.max(dailyLimit - today.totalTokens, 0);
  const percentUsed = dailyLimit
    ? Math.round((today.totalTokens / dailyLimit) * 1000) / 10
    : 0;

  return {
    date: key,
    dailyLimit,
    usedTokens: today.totalTokens,
    remainingTokens,
    percentUsed,
    warning: percentUsed >= 90,
    critical: percentUsed >= 98,
    promptTokens: today.promptTokens,
    completionTokens: today.completionTokens,
    requests: today.requests,
    byModel: today.byModel,
    lastRequest: stored.lastRequest,
    lastRateLimit: stored.lastRateLimit,
  };
}

module.exports = {
  getGroqUsageSummary,
  recordGroqRateLimit,
  recordGroqUsage,
};
