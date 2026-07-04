# Crisis Mode — Boardroom Debate System

This patch adds Crisis Mode as a real-time AI boardroom debate simulation,
without touching Growth Mode, the UI design system, the MongoDB connection,
or the existing folder structure.

## What's new

### Backend
- `backend/agents/crisisAgents.js` — defines the 5 boardroom personas
  (CEO, Finance, PR, Engineer, Lawyer) and `runDebateAgent(role, focus,
  input, chatHistory, isFinalTurn)`. Every AI call routes through the
  existing `ai-engine.js` (`callGroq` / `parseAIResponse`) — no new Groq
  client, no direct API calls outside the AI Engine.
- `backend/algorithms/crisisDebateEngine.js` — sequences the debate
  (CEO → Finance → PR → Engineer → Lawyer → CEO final decision), passing
  the growing `chatHistory` into each call so agents react to what was
  already said. Also implements:
  - `detectConflict()` — flags **HIGH CONFLICT** if any two agents'
    risk scores differ by more than 4.
  - `calculateWeightedRiskScore()` — a weighted average across all
    turns (CEO and Lawyer weighted slightly higher, since they carry
    final-decision and liability weight respectively).
- `backend/models/CrisisSession.js` — new standalone Mongoose model:
  `userId`, `crisisInput`, `debateMessages[]`, `finalRiskScore`,
  `highConflict`, `finalPlan`, `createdAt`. Uses the **existing**
  mongoose connection from `config/db.js` — no new DB setup.
- `backend/routes/crisis.js` — new protected routes:
  | Method | Path | Description |
  |---|---|---|
  | POST | `/api/crisis/debate` | Runs a full boardroom debate and saves the session |
  | GET | `/api/crisis/sessions` | Lists the user's past crisis sessions |
  | GET | `/api/crisis/sessions/:id` | Full transcript for one session |
  | DELETE | `/api/crisis/sessions/:id` | Deletes a session |

  All routes use the existing `protect` auth middleware and the existing
  `formatResponse` / `validateInput` helpers, exactly like `routes/growth.js`.

- `backend/server.js` — **two-line addition**: import + mount
  `app.use("/api/crisis", crisisRoutes)`, alongside the existing routes.
  Nothing else in this file changed.

### Frontend
- `frontend/pages/crisis.html` — new page, same dark theme, navbar,
  container, and card system as every other page (Bootstrap 5 + the
  shared `style.css`). Adds a "Live Debate Panel" that doesn't exist
  anywhere else — no existing UI was redesigned.
- `frontend/js/crisis.js` — calls `POST /api/crisis/debate`, then
  reveals each agent's message one at a time (1–2s simulated typing
  delay) with a role-colored avatar, risk badge, and agree/disagree/
  neutral stance icon. After the full debate, renders a final summary:
  weighted risk score, HIGH CONFLICT banner (if triggered), and the
  CEO's final recovery plan. Includes a "Save Outcome to Project"
  button that reuses the existing `promptAndSaveToProject()` helper
  from `project-save.js` (saved as a `risk-assessment` ProjectDocument
  — no schema change needed there).
- `frontend/js/nav.js` — **one new nav entry** ("Crisis Mode", shown
  only to logged-in users, same pattern as "My Projects"). No other
  logic in this file changed.

## What was NOT touched
- Growth Mode (`routes/growth.js`, `ai-engine.js`, `algorithms/orchestrator.js`,
  and all Growth Mode frontend pages/JS) — unchanged.
- `frontend/css/style.css` — unchanged. Crisis Mode reuses every existing
  class (`card`, `badge`, `btn-*`, `progress`, etc.) and only adds
  page-scoped `<style>` blocks inside `crisis.html`, matching how
  `analysis.html` and `dashboard.html` already do their per-page
  animation layers.
- `Project` / `ProjectDocument` / `ActivityLog` models — unchanged.
  Crisis Mode has its own model, by design, matching the original spec's
  schema. Saving a crisis outcome into a Project is additive (reuses the
  existing `risk-assessment` document type already defined in
  `ProjectDocument.js`).
- `config/db.js` — unchanged. Reused as-is.

## To run it

```bash
cd backend
npm install        # groq-sdk is already in package.json
npm run dev         # or: npm start
```

Make sure `backend/.env` has `GROQ_API_KEY` and `MONGO_URI` set (see
`.env.example` — both already existed before this patch).

Then open `frontend/pages/crisis.html` (or click "Crisis Mode" in the
navbar once logged in) and describe a crisis to convene the boardroom.

## Verified before delivery
- All new/modified backend files pass `node --check` (syntax) and the
  full route module loads with no missing requires.
- The debate engine was tested end-to-end with a mocked AI Engine:
  correct 6-message sequence (CEO→Finance→PR→Engineer→Lawyer→CEO),
  correct conflict detection on both low-spread and high-spread cases,
  correct weighted score calculation.
- `server.js` boots cleanly with the new route mounted; `POST
  /api/crisis/debate` correctly returns 401 without an auth token,
  confirming the existing `protect` middleware is wired in.
- All HTML element IDs referenced in `crisis.js` exist in `crisis.html`
  (or are created dynamically, as expected for the debate panel).
- All relative script/CSS paths in `crisis.html` resolve to real files.

This was not tested against a live Groq API key or live MongoDB instance
(none were provided) — please run it once on your end with real
credentials before the demo to confirm the live AI responses look right
in practice; the structural/sequencing logic has been verified in
isolation.

---

## Update — fixes after first live test

After running this against the real Groq API, three issues came up and
were fixed:

### 1. Recovery plan is now a real step-by-step structure
Previously the CEO's "final plan" was a single paragraph. The CEO's
final-turn prompt (`backend/agents/crisisAgents.js`) now requires a
`recovery_plan` array of 4-6 steps, each with `step`, `title`,
`description`, `owner` (which boardroom role executes it), `priority`
(Critical/High/Medium), and `timeline`. This is validated/normalized in
`runDebateAgent()`, carried through `crisisDebateEngine.js` as
`finalPlan.steps`, and rendered as numbered step cards (matching the
existing Plan page's `setup_steps` visual pattern) in both the live
debate view (`crisis.js`) and the saved-document view (`project.js`).
If the AI ever fails to return valid steps, a 3-step fallback plan is
generated automatically so the UI never shows an empty plan.

### 2. Saved Crisis outcomes no longer show raw JSON
Saved "Crisis Boardroom Outcome" documents were falling through to
`project.js`'s generic JSON-dump fallback renderer. Added a dedicated
`renderRiskAssessmentContent()` function that renders the crisis input,
final risk score with progress bar, conflict banner, and the structured
recovery plan as clean cards — consistent with every other document
type's renderer on that page. Also fixed a pre-existing bug where the
"Risk Assessments" section header used `text-dark`, which was invisible
against the dark theme.

The save flow now also surfaces a direct "View in Project" link after
saving, so there's a visible path back to the linked project — the link
itself (saving into a chosen/created Project) already existed via
`promptAndSaveToProject()`, it just wasn't surfaced clearly afterward.

### 3. Navbar consolidated into a "Tools" dropdown
Every page had its own hand-written `<navbar-nav>` markup, which is why
the link count kept growing as features were added. All 10 pages now
share one consistent structure: **Dashboard · My Projects · Tools ▾
(Ideas, Analysis, Plan, Marketing) · Crisis Mode · Login/Register ·
Logout**. `frontend/js/nav.js` was simplified to match — active-state
highlighting is now mostly static (baked into each page's own HTML),
with `nav.js` only handling the parts that still need to be dynamic
(showing/hiding My Projects, Crisis Mode, Login/Register, and Logout
based on auth state). Verified with a jsdom test against the real page
HTML across logged-in/logged-out states on multiple pages — correct
show/hide, correct active highlighting (including the Tools toggle
itself lighting up when a child page is active), no duplicate links.

