/**
 * GROWTH MODE ROUTES - HYBRID ARCHITECTURE
 * 
 * Pipeline: INPUT → CONTEXT ENGINE → AI ENGINE → PARSE → ALGORITHMS → FORMAT → OUTPUT
 * 
 * ✅ Uses AI Engine for all Groq calls
 * ✅ Injects user context (projects, activity, currency, stage) into every prompt
 * ✅ Uses Algorithms for processing
 */

const express = require("express");
const router = express.Router();
const { callGroqWithContext, parseAIResponse } = require("../ai-engine");
const { 
  processIdeas, 
  processAnalysis, 
  calculateIdeaFeasibility,
} = require("../algorithms/orchestrator");
const { formatResponse, validateInput } = require("../utils/helpers");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

function successResponse(data) {
  return formatResponse(data);
}

const SUPPORTED_CURRENCIES = new Set(["USD", "LKR", "EUR", "GBP", "INR"]);
const SUPPORTED_LANGUAGES = new Set(["en", "si"]);

function normalizePreferenceContext(preferences = {}, storedContext = {}) {
  const currency = String(preferences.currency || storedContext.currency || "USD").toUpperCase();
  const language = String(preferences.language || storedContext.language || "en").toLowerCase();
  return {
    ...storedContext,
    currency: SUPPORTED_CURRENCIES.has(currency) ? currency : "USD",
    language: SUPPORTED_LANGUAGES.has(language) ? language : "en",
  };
}

function cleanText(value, fallback = "") {
  return String(value ?? "").trim() || fallback;
}

function normalizeStringArray(value, fallback = [], minItems = 0) {
  const input = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const normalized = input
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return cleanText(
          item.text || item.title || item.description || item.summary || item.action || item.point
        );
      }
      return "";
    })
    .filter(Boolean);

  const merged = normalized.length ? normalized : fallback;
  return merged.slice(0, Math.max(minItems, merged.length));
}

function fallbackPlanPoints(idea, language = "en") {
  const business = cleanText(idea, "this business");
  if (language === "si") {
    return {
      quickWins: [
        `${business} සඳහා පාරිභෝගිකයාගේ ප්‍රධාන ගැටලුව, ලබාදෙන ප්‍රතිඵලය, සහ ක්‍රියාත්මක විය යුතු ඊළඟ පියවර පැහැදිලි කරන එක් පිටුවක පිරිනැමීමක් සකසන්න.`,
        "මෙම සතිය තුළ ඉලක්ක පාරිභෝගිකයින් 10 දෙනෙකු සමඟ කතා කර ඔවුන්ගේ වේදනා ලක්ෂ්‍ය, මිලදී ගැනීමේ බාධක, සහ තීරණ ගැනීමේ හේතු සටහන් කරන්න.",
        "ඉල්ලුම මැනීමට landing page එකක්, waitlist එකක්, මිල පරාසයක්, සහ එක් ප්‍රධාන call to action එකක් ඉක්මනින් දියත් කරන්න.",
        "ගැටලුව, විසඳුම, සහ පාරිභෝගිකයාට ලැබෙන ප්‍රතිඵලය පෙන්වන විශ්වාසය ගොඩනගන social/content පළ කිරීම් 3ක් පළ කරන්න.",
        "සම්පූර්ණ automation එකකට පෙර අතින් විකිණිය හැකි සරල demo, sample, හෝ service package එකක් ගොඩනගන්න."
      ],
      firstCustomers: [
        "ගැටලුව දැනටමත් තේරුම් ගන්නා මිතුරු ජාලය, LinkedIn සම්බන්ධතා, ව්‍යාපාරික ප්‍රජා, සහ niche groups වෙතින් ආරම්භ කරන්න.",
        "මුල් පාරිභෝගිකයින්ට founding-customer package එකක් දෙන්න: වේගවත් onboarding, founder support, සහ දින 14ක් තුළ පැහැදිලි success milestone එකක්.",
        "ඉහළ ගැළපුමක් ඇති prospects 50 දෙනෙකුගේ ලැයිස්තුවක් සාදා එක් ප්‍රබල business outcome එකක් මත කෙටි outreach message යවන්න.",
        "Discovery calls paid pilots බවට පත් කිරීමට පාරිභෝගික goal එක, deadline එක, සහ decision maker එක පැහැදිලි කරන්න.",
        "මුල් පාරිභෝගිකයින් 3 දෙනාගෙන් testimonials, usage quotes, සහ case-study metrics එකතු කර ඊළඟ sales cycle එක ශක්තිමත් කරන්න."
      ],
      riskMitigation: [
        "ගැඹුරු development එකට පෙර pilot commitment, deposit, හෝ written purchase intent ලබාගෙන ගෙවීමට ඇති සූදානම තහවුරු කරන්න.",
        "මුල් දින 30 තුළ fixed costs අඩු කර customer acquisition එකට සෘජුව දායක වන tools/channels/assets වලට පමණක් වියදම් කරන්න.",
        "Acquisition cost, conversion rate, churn signals, සහ support issues සතිපතා මැන දුර්වල channels ඉක්මනින් නවත්වන්න.",
        "පාරිභෝගික පොරොන්දු සහ delivery steps ලේඛනගත කර overcommit වීම වළක්වන්න.",
        "ප්‍රධාන outreach channel එක මිල වැඩි හෝ අස්ථාවර වුවහොත් භාවිතා කළ හැකි backup acquisition channel එකක් සූදානම් කරන්න."
      ],
      criticalSuccessFactors: [
        "තීව්‍ර, නිතර ඇති, සහ ව්‍යාපාරික වටිනාකමක් ඇති ගැටලුවක් සහිත ඉතා පැහැදිලි පාරිභෝගික කාණ්ඩයක්.",
        "තත්පර කිහිපයකින් තේරුම් ගත හැකි පැහැදිලි value proposition එකක්.",
        "අභ්‍යන්තර අනුමාන වෙනුවට සැබෑ පාරිභෝගික feedback මත වේගවත් ඉගෙනීම.",
        "සතිපතා outreach, follow-up, delivery, සහ measurement නිරන්තරව ක්‍රියාත්මක කිරීම.",
        "Testimonials, demos, pilot results, හෝ case studies වැනි විශ්වාසය ගොඩනගන proof assets."
      ],
    };
  }
  return {
    quickWins: [
      `Create a one-page offer that clearly explains the core problem ${business} solves, who it serves, and the measurable outcome customers can expect.`,
      "Interview 10 potential buyers this week and capture exact language around pain points, budget, objections, and buying triggers.",
      "Launch a simple landing page with a waitlist, pricing anchor, and one primary call to action so demand can be measured immediately.",
      "Publish three proof-building posts that show the problem, the proposed solution, and a practical before-and-after customer scenario.",
      "Build a lightweight demo, sample, or service package that can be sold manually before investing in full automation."
    ],
    firstCustomers: [
      "Start with warm-network outreach to founders, operators, and niche community members who already understand the problem and can give fast feedback.",
      "Offer a limited founding-customer package with hands-on onboarding, direct founder access, and a clear success milestone in the first 14 days.",
      "Use LinkedIn, local business groups, and industry communities to identify 50 prospects that match the highest-urgency use case.",
      "Convert discovery calls into pilots by asking prospects to commit to one measurable outcome, one deadline, and one decision maker.",
      "Collect testimonials, usage quotes, and case-study metrics from the first three customers to strengthen the next sales cycle."
    ],
    riskMitigation: [
      "Validate willingness to pay before building deeply by asking prospects for pilot commitments, deposits, or written purchase intent.",
      "Keep fixed costs low during the first 30 days and spend only on tools, channels, or assets that directly support customer acquisition.",
      "Track acquisition cost, conversion rate, churn signals, and customer support issues weekly so weak channels are stopped quickly.",
      "Document delivery steps and customer promises carefully to avoid overcommitting before operations are repeatable.",
      "Create a backup acquisition channel in case the primary outreach source becomes expensive, saturated, or unreliable."
    ],
    criticalSuccessFactors: [
      "A sharply defined customer segment with a painful, urgent, and frequent problem.",
      "A clear offer that communicates business value in plain language within seconds.",
      "Fast feedback loops from real buyers rather than assumptions from internal planning.",
      "Consistent weekly execution on outreach, follow-up, delivery, and customer learning.",
      "Proof assets such as testimonials, demos, case studies, or measurable pilot outcomes."
    ],
  };
}

function buildFallbackWeeklyProgressTemplate(language = "en") {
  if (language === "si") {
    return {
      customer_conversations: "සතියේ දී පාරිභෝගිකයින් 5 දෙනෙකු සමඟ කතා කර ඔවුන්ගේ වේදනා ලක්ෂ්‍ය සහ මිලදී ගැනීමේ බාධක සටහන් කරන්න.",
      offer_clarity: "එක් පැහැදිලි value proposition එකක් සහ කෙටි offer එකක් සකස් කර සරලව ඉදිරිපත් කරන්න.",
      first_pilot: "පරීක්ෂණය සඳහා pilot offer එකක්, waitlist එකක්, හෝ demo එකක් සකස් කරන්න.",
      proof_assets: "Testimonials, screenshots, හෝ early feedback වැනි proof asset එකක් එක් කරන්න.",
      next_steps: "ඊළඟ සතිය සඳහා එක් ප්‍රමුඛ පියවරක් තෝරා නිරන්තරව පරීක්ෂා කරන්න."
    };
  }

  return {
    customer_conversations: "Talk to 5 potential buyers this week and capture their pain points, objections, and buying triggers.",
    offer_clarity: "Refine the offer around one clear outcome and a simple value proposition.",
    first_pilot: "Set up a lightweight pilot, waitlist, or demo so demand can be tested this week.",
    proof_assets: "Capture one proof asset such as a testimonial, screenshot, or early result.",
    next_steps: "Choose one priority action for next week and track it consistently."
  };
}

function normalizePlanContent(rawPlan = {}, idea = "", language = "en") {
  const fallback = fallbackPlanPoints(idea, language);
  const isSinhala = language === "si";
  const quickWins = normalizeStringArray(rawPlan.quickWins || rawPlan.quick_wins, fallback.quickWins, 5);
  const firstCustomers = normalizeStringArray(
    rawPlan.firstCustomers || rawPlan.first_customers || rawPlan.first_customers_strategy,
    fallback.firstCustomers,
    5
  );
  const riskMitigation = normalizeStringArray(
    rawPlan.riskMitigation || rawPlan.risk_mitigation,
    fallback.riskMitigation,
    5
  );
  const criticalSuccessFactors = normalizeStringArray(
    rawPlan.criticalSuccessFactors || rawPlan.critical_success_factors,
    fallback.criticalSuccessFactors,
    5
  );
  const weeklyProgressTemplate = rawPlan.weekly_progress_template && typeof rawPlan.weekly_progress_template === "object"
    ? rawPlan.weekly_progress_template
    : buildFallbackWeeklyProgressTemplate(language);

  return {
    executiveSummary: normalizeStringArray(rawPlan.executiveSummary || rawPlan.executive_summary, [
      isSinhala
        ? `${cleanText(idea, "මෙම ව්‍යාපාරය")} පැහැදිලි පාරිභෝගික ගැටලුවක් වටා ගොඩනගා, ඉල්ලුම ඉක්මනින් තහවුරු කර, මුල් පාරිභෝගික proof මත වර්ධනය සැලසුම් කරන්න.`
        : `Build ${cleanText(idea, "the business")} around a focused customer problem, validate demand quickly, and use early customer proof to guide growth.`
    ]),
    businessOpportunity: normalizeStringArray(rawPlan.businessOpportunity || rawPlan.business_opportunity, [
      isSinhala
        ? "මෙහි අවස්ථාව වන්නේ වෙළඳපොළේ නිශ්චිත වේදනාවක්, scale කිරීමට පෙර සැබෑ පාරිභෝගිකයින් සමඟ පරීක්ෂා කළ හැකි සරල සහ විශ්වාසනීය offer එකක් බවට පත් කිරීමයි."
        : "The opportunity is to turn a specific market pain into a simple, credible offer that can be tested with real buyers before scaling."
    ]),
    targetAudience: normalizeStringArray(rawPlan.targetAudience || rawPlan.target_audience, [
      isSinhala
        ? "ඊළඟ දින 30 තුළ ක්‍රියා කිරීමට පැහැදිලි හේතුවක්, වියදම් බලය, සහ ඉක්මන් අවශ්‍යතාවයක් ඇති පාරිභෝගිකයින්ට ප්‍රමුඛත්වය දෙන්න."
        : "Prioritize customers with urgent need, budget authority, and a clear reason to act within the next 30 days."
    ]),
    revenueModel: normalizeStringArray(rawPlan.revenueModel || rawPlan.revenue_model, [
      isSinhala
        ? "සරල paid package එකක් හෝ pilot එකකින් ආරම්භ කර, demand predictable වූ පසු recurring plans, retainers, හෝ premium tiers වෙත ව්‍යාප්ත කරන්න."
        : "Begin with a simple paid package or pilot, then expand into recurring plans, retainers, or premium service tiers as demand becomes predictable."
    ]),
    growthStrategy: normalizeStringArray(rawPlan.growthStrategy || rawPlan.growth_strategy, [
      isSinhala
        ? "Paid acquisition spend වැඩි කිරීමට පෙර founder-led sales, proof-focused content, referrals, සහ community partnerships භාවිතා කරන්න."
        : "Use founder-led sales, content proof, referrals, and community partnerships before increasing paid acquisition spend."
    ]),
    quickWins,
    firstCustomers,
    riskMitigation,
    criticalSuccessFactors,
    setup_steps: Array.isArray(rawPlan.setup_steps) ? rawPlan.setup_steps : [],
    plan_7_day: Array.isArray(rawPlan.plan_7_day) ? rawPlan.plan_7_day : [],
    plan_30_day: Array.isArray(rawPlan.plan_30_day) ? rawPlan.plan_30_day : [],
    success_tips: normalizeStringArray(rawPlan.success_tips, criticalSuccessFactors, 5),
    weekly_progress_template: weeklyProgressTemplate,
    quick_wins: quickWins,
    first_customers_strategy: firstCustomers.join(" "),
    risk_mitigation: riskMitigation.join(" "),
    critical_success_factors: criticalSuccessFactors,
  };
}

function normalizeAnalysisContent(rawAnalysis = {}, idea = "") {
  const business = cleanText(idea, "this idea");
  const risk = rawAnalysis.risk && typeof rawAnalysis.risk === "object" ? rawAnalysis.risk : {};
  return {
    ...rawAnalysis,
    demand: rawAnalysis.demand && typeof rawAnalysis.demand === "object" ? {
      ...rawAnalysis.demand,
      score: Number(rawAnalysis.demand.score) || 6,
      summary: cleanText(rawAnalysis.demand.summary, `${business} needs validation through customer interviews, demand testing, and early purchase intent.`),
    } : {
      score: 6,
      summary: `${business} shows potential, but demand should be validated with direct customer conversations and pilot commitments.`,
    },
    competition: rawAnalysis.competition && typeof rawAnalysis.competition === "object" ? {
      ...rawAnalysis.competition,
      level: cleanText(rawAnalysis.competition.level, "Medium"),
      score: Number(rawAnalysis.competition.score) || 5,
      summary: cleanText(rawAnalysis.competition.summary, "Competition should be assessed by comparing direct alternatives, substitutes, pricing, positioning, and switching barriers."),
    } : {
      level: "Medium",
      score: 5,
      summary: "Competition should be assessed by comparing direct alternatives, substitutes, pricing, positioning, and switching barriers.",
    },
    risk: {
      level: cleanText(risk.level, "Medium"),
      top_risks: normalizeStringArray(risk.top_risks || risk.risks, [
        "Demand may be weaker than expected unless validated with real buyer conversations and pilot commitments.",
        "Customer acquisition costs may rise if the target audience is too broad or messaging is unclear.",
        "Competitors or substitutes may already own trust unless the offer has a sharp and provable differentiation.",
        "Operational delivery may become inconsistent if the first version relies on manual founder effort without documented processes.",
        "Cash flow can tighten if launch spending happens before revenue channels are proven."
      ], 5),
    },
    cost_estimate: rawAnalysis.cost_estimate && typeof rawAnalysis.cost_estimate === "object" ? rawAnalysis.cost_estimate : {
      minimum: `Lean validation budget in ${cleanText(rawAnalysis.currency, "selected currency")}`,
      recommended: `Pilot launch budget in ${cleanText(rawAnalysis.currency, "selected currency")}`,
      breakdown: [
        "Landing page and basic brand assets",
        "Customer discovery and outreach tools",
        "Prototype, demo, or service delivery setup",
        "Initial marketing experiments",
        "Contingency for customer support and operations"
      ],
    },
  };
}

function buildFallbackSocialPosts(idea, language = "en") {
  const business = cleanText(idea, "your business idea");
  if (language === "si") {
    return Array.from({ length: 10 }, (_, index) => {
      const platform = ["LinkedIn", "Instagram", "Twitter"][index % 3];
      return {
        platform,
        hook: `${business}: පාරිභෝගිකයා බලා සිටි ප්‍රායෝගික වෙනස`,
        body: `පාරිභෝගිකයින්ට තවත් සාමාන්‍ය විකල්පයක් අවශ්‍ය නැත. ඔවුන්ට අවශ්‍ය වන්නේ කාලය ඉතිරි කරන, friction අඩු කරන, සහ ප්‍රතිඵල වෙත පැහැදිලි මාර්ගයක් දෙන විසඳුමකි. ${business} එක් වේදනාකාරී use case එකක්, මැනිය හැකි පොරොන්දුවක්, සහ පාරිභෝගිකයාගේ සැබෑ අවශ්‍යතාවය තේරුම් ගන්නා බව පෙන්වන proof එකක් සමඟ ඉදිරිපත් විය යුතුය.`,
        cta: "මුල් launch offer එක ලබාගැනීමට දැන් waitlist එකට එක්වන්න.",
        hashtags: ["#Startup", "#BusinessGrowth", "#MarketingStrategy", "#CustomerAcquisition", "#FounderLedSales", "#SmallBusiness", "#Growth"]
      };
    });
  }
  const platforms = ["LinkedIn", "Instagram", "Twitter"];
  return Array.from({ length: 10 }, (_, index) => {
    const platform = platforms[index % platforms.length];
    return {
      platform,
      hook: `${business}: the practical shift customers have been waiting for`,
      body: `Most customers do not need another generic option. They need a focused solution that removes friction, saves time, and gives them a clearer path to results. ${business} should lead with one painful use case, one measurable promise, and proof that the team understands the customer's day-to-day reality.`,
      cta: "Want the early playbook? Join the launch list and get the first customer offer.",
      hashtags: ["#Startup", "#BusinessGrowth", "#MarketingStrategy", "#CustomerAcquisition", "#FounderLedSales", "#SmallBusiness", "#Growth"]
    };
  });
}

function normalizeMarketingContent(rawContent = {}, idea = "", language = "en") {
  const fallbackPosts = buildFallbackSocialPosts(idea, language);
  const rawPosts = rawContent.social_posts || rawContent.socialPosts || rawContent.posts || rawContent.instagram_posts;
  const posts = (Array.isArray(rawPosts) && rawPosts.length ? rawPosts : fallbackPosts)
    .map((post, index) => {
      const platform = ["LinkedIn", "Instagram", "Twitter"].includes(post?.platform)
        ? post.platform
        : ["LinkedIn", "Instagram", "Twitter"][index % 3];
      const caption = cleanText(post?.caption || post?.content || post?.body);
      const hook = cleanText(post?.hook, caption.split("\n")[0] || fallbackPosts[index % fallbackPosts.length].hook);
      const body = cleanText(post?.body || post?.content, caption || fallbackPosts[index % fallbackPosts.length].body);
      const cta = cleanText(post?.cta, fallbackPosts[index % fallbackPosts.length].cta);
      const hashtags = normalizeStringArray(post?.hashtags, fallbackPosts[index % fallbackPosts.length].hashtags, 5)
        .map((tag) => tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`)
        .slice(0, 10);
      return { platform, hook, body, cta, hashtags };
    });

  while (posts.length < 10) posts.push(fallbackPosts[posts.length]);

  const socialPosts = posts.slice(0, Math.max(10, posts.length));
  const instagramPosts = socialPosts.map((post) => ({
    platform: post.platform,
    hook: post.hook,
    body: post.body,
    cta: post.cta,
    caption: `${post.hook}\n\n${post.body}\n\n${post.cta}`,
    hashtags: post.hashtags,
  }));

  const AD_PLATFORMS = ["Facebook", "Google", "Instagram", "LinkedIn", "TikTok"];
  const AD_ANGLES = ["Pain Point", "Benefit", "Urgency", "Social Proof", "Offer", "Objection-Handling", "Curiosity", "Comparison"];

  const rawAdCopies = Array.isArray(rawContent.ad_copies)
    ? rawContent.ad_copies
        .map((ad, index) => ({
          headline: cleanText(ad?.headline, ""),
          body: cleanText(ad?.body || ad?.content, ""),
          cta: cleanText(ad?.cta, "Learn more"),
          platform: cleanText(ad?.platform, AD_PLATFORMS[index % AD_PLATFORMS.length]),
          angle: cleanText(ad?.angle, AD_ANGLES[index % AD_ANGLES.length]),
        }))
        .filter((ad) => ad.headline || ad.body)
    : [];

  // Match the social post count so the two kit columns read as visually balanced,
  // rather than the Ad Copies column trailing off short.
  const AD_COPIES_TARGET = socialPosts.length;
  const adCopies = rawAdCopies.slice(0, AD_COPIES_TARGET);
  let fallbackIdx = 0;
  while (adCopies.length < AD_COPIES_TARGET && fallbackIdx < socialPosts.length) {
    const post = socialPosts[fallbackIdx];
    adCopies.push({
      headline: post.hook || `${idea} — Special Offer`,
      body: post.body,
      cta: post.cta || "Learn more",
      platform: AD_PLATFORMS[adCopies.length % AD_PLATFORMS.length],
      angle: AD_ANGLES[adCopies.length % AD_ANGLES.length],
    });
    fallbackIdx += 1;
  }

  return {
    social_posts: socialPosts,
    socialPosts,
    instagram_posts: instagramPosts,
    ad_copies: adCopies,
    slogans: normalizeStringArray(rawContent.slogans, [
      ...(language === "si"
        ? ["තීක්ෂණව දියත් කරන්න. බුද්ධිමත්ව වර්ධනය වන්න.", "ක්‍රියා කිරීමට සූදානම් පාරිභෝගිකයින් සඳහා නිර්මාණය කළ විසඳුම.", "අදහස momentum එකක් බවට පත් කරන්න."]
        : ["Launch sharper. Grow smarter.", "Built for customers who are ready to move.", "Turn the idea into momentum."])
    ], 3),
    captions: rawContent.captions && typeof rawContent.captions === "object" ? rawContent.captions : {
      facebook: socialPosts[1]?.caption || socialPosts[1]?.body || "",
      linkedin: `${socialPosts[0]?.hook}\n\n${socialPosts[0]?.body}\n\n${socialPosts[0]?.cta}`,
      whatsapp: `${socialPosts[2]?.hook} ${socialPosts[2]?.cta}`,
    },
  };
}

/**
 * Build context object for a user — fetches their projects, activity, and preferences.
 */
async function buildUserContext(userId) {
  if (!userId) return {};
  try {
    const [user, projects, activity] = await Promise.all([
      User.findById(userId),
      Project.find({ userId }).sort({ updatedAt: -1 }).limit(5).select("title industry stage"),
      ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(5)
    ]);
    return {
      user: user ? { name: user.name } : null,
      projects,
      recentActivity: activity,
      stage: projects[0]?.stage || "startup",
      currency: user?.currency || "USD",
      language: user?.language || "en"
    };
  } catch (_) {
    return {};
  }
}

// ════════════════════════════════════════════════════════
// ENDPOINT 1: GENERATE IDEAS
// ════════════════════════════════════════════════════════
router.post("/generate-ideas", optionalProtect, async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["skills", "interest"]);
    if (!valid) return res.status(400).json({ success: false, error: missing.join(", ") });

    const { skills, budget, interest, preferences } = req.body;
    const userId = req.user?._id;
    const context = normalizePreferenceContext(preferences, await buildUserContext(userId));

    const prompt = `
You are a pragmatic, no-fluff startup advisor. Generate exactly 5 PRACTICAL, REALISTIC business ideas as a JSON ARRAY, grounded strictly in the user's actual skills, budget, and interest below — not generic ideas that ignore them.

User Skills: ${skills}
Budget: ${budget || "not specified"}
Interest: ${interest}

Rules for practicality:
- Only suggest ideas the user could realistically start themselves with the skills and budget given — do not require skills, staff, or capital they don't have.
- Prefer ideas that can get a first paying customer within weeks, not years. Favor lean, service-first, or low-overhead models over ideas that need heavy upfront building.
- "why_it_fits" must explicitly connect to the specific skills/interest listed above — no generic reasoning that could apply to any idea.
- "startup_cost" must be a specific, realistic number or tight range (not "varies" or "depends"), in ${context.currency}, using the ${context.currency} currency code/symbol only, and must fit within or near the stated budget.
- "time_to_profit" must be a specific realistic range (e.g. "2-4 months"), based on how fast this exact idea could realistically earn revenue with this budget.
- "description" must state concretely what the business actually does day-to-day and who pays for it — avoid vague buzzwords like "platform", "solution", or "innovative" without specifics.
- Avoid duplicate or near-identical ideas across the 5 — each should target a distinct angle or customer segment within the interest area.
- "score" must be your honest 1-10 rating of this idea's overall potential for THIS user, weighing skill fit, demand, and how fast/cheaply it can be validated with the stated budget. Do not give every idea the same score — differentiate them based on actual strength.

Return ONLY this format:
[
  {
    "id": 1,
    "name": "Business Name",
    "description": "One line description",
    "why_it_fits": "How it matches skills/interests",
    "startup_cost": "realistic amount in ${context.currency}, using the ${context.currency} currency code/symbol only",
    "time_to_profit": "X-Y months",
    "score": 8
  }
]
`;

    const aiResponse = await callGroqWithContext(prompt, { ...context, maxTokens: 1000 });
    const rawIdeas = parseAIResponse(aiResponse);
    const processedIdeas = processIdeas(rawIdeas);

    res.json(successResponse({ ideas: processedIdeas, count: processedIdeas.length }));
  } catch (err) {
    console.error("generate-ideas error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 2: ANALYZE IDEA
// ════════════════════════════════════════════════════════
router.post("/analyze-idea", optionalProtect, async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) return res.status(400).json({ success: false, error: missing.join(", ") });

    const { idea, preferences } = req.body;
    const userId = req.user?._id;
    const context = normalizePreferenceContext(preferences, await buildUserContext(userId));

    const prompt = `
Analyze this business idea in detail: "${idea}"

Return ONLY this JSON format:
{
  "demand": { "score": 7, "summary": "Market demand assessment" },
  "competition": { "level": "Medium", "score": 5, "summary": "Competitive landscape" },
  "risk": { "level": "Medium", "top_risks": ["Risk 1", "Risk 2"] },
  "cost_estimate": {
    "minimum": "realistic amount in ${context.currency}",
    "recommended": "realistic amount in ${context.currency}",
    "breakdown": ["Item: realistic amount in ${context.currency}"]
  },
  "skill_match": 7
}
`;

    const aiResponse = await callGroqWithContext(prompt, { ...context, maxTokens: 700 });
    const rawAnalysis = normalizeAnalysisContent(parseAIResponse(aiResponse), idea);
    const processedAnalysis = processAnalysis(rawAnalysis);
    res.json(successResponse(processedAnalysis));
  } catch (err) {
    console.error("analyze-idea error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 3: GENERATE PLAN
// ════════════════════════════════════════════════════════
router.post("/generate-plan", optionalProtect, async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) return res.status(400).json({ success: false, error: missing.join(", ") });

    const { idea, preferences } = req.body;
    const userId = req.user?._id;
    const context = normalizePreferenceContext(preferences, await buildUserContext(userId));

    const prompt = `
Create a professional, startup-accelerator-quality business plan for: "${idea}"

The plan must be detailed, structured, marketing-ready, and useful for a founder preparing to launch.
Every section must contain specific bullet points, not generic filler.
The arrays quickWins, firstCustomers, riskMitigation, and criticalSuccessFactors MUST contain at least 5 detailed items each.

Return ONLY this JSON format:
{
  "executiveSummary": ["Detailed bullet point"],
  "businessOpportunity": ["Detailed bullet point"],
  "targetAudience": ["Detailed bullet point"],
  "revenueModel": ["Detailed bullet point"],
  "growthStrategy": ["Detailed bullet point"],
  "quickWins": ["Detailed action item", "Detailed action item", "Detailed action item", "Detailed action item", "Detailed action item"],
  "firstCustomers": ["Detailed customer acquisition action", "Detailed customer acquisition action", "Detailed customer acquisition action", "Detailed customer acquisition action", "Detailed customer acquisition action"],
  "riskMitigation": ["Detailed mitigation action", "Detailed mitigation action", "Detailed mitigation action", "Detailed mitigation action", "Detailed mitigation action"],
  "criticalSuccessFactors": ["Detailed factor", "Detailed factor", "Detailed factor", "Detailed factor", "Detailed factor"],
  "setup_steps": [
    { "step": 1, "title": "Title", "description": "Details", "cost": "realistic amount in ${context.currency}" }
  ],
  "plan_7_day": [
    { "day": "Day 1-2", "focus": "Focus area", "tasks": ["Task 1"] }
  ],
  "plan_30_day": [
    { "week": "Week 1", "goal": "Goal", "milestones": ["Milestone 1"] }
  ],
  "success_tips": ["Tip 1", "Tip 2"]
}
`;

    const aiResponse = await callGroqWithContext(prompt, { ...context, maxTokens: 2500 });
    const plan = normalizePlanContent(parseAIResponse(aiResponse), idea, context.language);
    res.json(successResponse(plan));
  } catch (err) {
    console.error("generate-plan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 4: MARKETING CONTENT
// ════════════════════════════════════════════════════════
router.post("/marketing-content", optionalProtect, async (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["idea"]);
    if (!valid) return res.status(400).json({ success: false, error: missing.join(", ") });

    const { idea, preferences } = req.body;
    const userId = req.user?._id;
    const context = normalizePreferenceContext(preferences, await buildUserContext(userId));

    const prompt = `
Create a real marketing-agency-quality content kit for: "${idea}"

Requirements:
- Exactly 10 social media posts.
- Each post must include hook, body, CTA, platform, and 5-7 hashtags.
- Platform must be one of: LinkedIn, Instagram, Twitter.
- Exactly 10 ad copies, each with a distinct angle (pain point, benefit, urgency, social proof, offer, objection-handling, curiosity, comparison) and a distinct ad platform (Facebook, Google, Instagram, LinkedIn, or TikTok).
- Each social post body must be 1-2 concise sentences.
- Each ad copy's "body" must be 2 concise sentences so it reads as complete ad copy.
- Use an engagement-focused tone with concrete value, buyer pain points, and clear next actions.
- Do not include markdown fences or any text outside the JSON.

Return ONLY this JSON format:
{
  "social_posts": [
    { "platform": "LinkedIn", "hook": "Hook line", "body": "Content body", "cta": "Call to action", "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] }
  ],
  "ad_copies": [
    { "headline": "Headline", "body": "Body text (2 concise sentences)", "cta": "Call to action", "platform": "Facebook", "angle": "Urgency" }
  ],
  "slogans": ["Slogan 1", "Slogan 2"],
  "captions": {
    "facebook": "Facebook caption",
    "linkedin": "LinkedIn caption",
    "whatsapp": "WhatsApp caption"
  }
}
`;

    const aiResponse = await callGroqWithContext(prompt, { ...context, maxTokens: 5000 });
    const content = normalizeMarketingContent(parseAIResponse(aiResponse), idea, context.language);
    res.json(successResponse(content));
  } catch (err) {
    console.error("marketing-content error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════
// ENDPOINT 5: FEASIBILITY SCORE (Pure Algorithms - No AI)
// ════════════════════════════════════════════════════════
/**
 * Flow: INPUT → ALGORITHMS (calculate) → OUTPUT
 * No AI Engine needed - pure calculation
 */
router.post("/feasibility-score", (req, res) => {
  try {
    const { valid, missing } = validateInput(req, ["demand", "competition", "skill_match"]);
    if (!valid) {
      return res.status(400).json({ success: false, error: missing.join(", ") });
    }

    const demand = parseFloat(req.body.demand);
    const competition = parseFloat(req.body.competition);
    const skill_match = parseFloat(req.body.skill_match);

    // Validate input ranges
    if ([demand, competition, skill_match].some(v => isNaN(v) || v < 1 || v > 10)) {
      return res.status(400).json({ 
        success: false, 
        error: "All scores must be between 1 and 10" 
      });
    }

    // STEP 1: Call Algorithms (no AI needed)
    const result = calculateIdeaFeasibility(demand, competition, skill_match);
    
    // STEP 2: Return structured response
    res.json(successResponse(result));

  } catch (err) {
    console.error("feasibility-score error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
