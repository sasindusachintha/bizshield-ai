# BizShield AI — Project Workspace Refactor

This refactor replaces the old, flat "My Ideas" feature with a full
**Project Workspace** architecture. Every business idea now lives inside a
**Project**, and every AI-generated output (market analysis, SWOT,
marketing plan, business plan, financial forecast, risk assessment, pitch
deck — plus the original idea write-up) is stored as a **ProjectDocument**
attached to that project.

## 1. Data model

### Project (`backend/models/Project.js`)
| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | owner |
| `title` | String | required |
| `industry` | String | optional |
| `stage` | String | enum: ideation / validation / mvp / growth / scaling |
| `description` | String | optional |
| `meta` | Mixed | open-ended bucket for future features |
| `createdAt` / `updatedAt` | Date | via `timestamps: true` |

### ProjectDocument (`backend/models/ProjectDocument.js`)
| Field | Type | Notes |
|---|---|---|
| `projectId` | ObjectId → Project | |
| `userId` | ObjectId → User | |
| `type` | String | enum: `idea`, `market-analysis`, `swot`, `marketing-plan`, `business-model`, `financial-forecast`, `risk-assessment`, `pitch-deck` |
| `title` | String | |
| `content` | Mixed | string or structured JSON, shape depends on `type` |
| `favorite` | Boolean | reserved for the future "favorites" feature |
| `tags` | [String] | reserved for the future "tags" feature |
| `meta` | Mixed | open-ended bucket (e.g. AI model used, chat thread id, export log) |
| `createdAt` / `updatedAt` | Date | |

A project can hold **many documents of the same type** — every save is
additive, so a full history of AI outputs is preserved automatically
(supports requirement #9).

### ActivityLog (`backend/models/ActivityLog.js`)
Denormalized feed entry written whenever a project or document is
created/updated/deleted. Powers the dashboard's "Recent Activity" section
(requirement #8).

### Designing for the future (requirement #10)
- `meta` (Mixed) on both Project and ProjectDocument can hold AI chat
  history references, PDF export logs, etc. without a schema change.
- `favorite` and `tags` on ProjectDocument are ready for the "favorites"
  and "tags" features.
- `ActivityLog.entityType` already enumerates every document type, so new
  types automatically flow into the activity feed and dashboard stats
  (`byType` in `/api/dashboard/stats`).

## 2. Backend API

### Projects — `backend/routes/projects.js`
| Method | Path | Description |
|---|---|---|
| POST | `/api/projects/quick-save-idea` | Creates a Project **and** its first `idea` ProjectDocument in one call. Replaces `POST /api/ideas/save`. Body: `{ title, description, industry?, score? }` |
| POST | `/api/projects` | Create an empty project. Body: `{ title, industry?, stage?, description? }` |
| GET | `/api/projects` | List the user's projects (Project History). Each item includes `documentTypes`, `documentCount`, `lastActivityAt`. |
| GET | `/api/projects/:id` | Single project + `documents` + `documentsByType` |
| PUT | `/api/projects/:id` | Update title/industry/stage/description/meta |
| DELETE | `/api/projects/:id` | Deletes the project **and** all of its documents |
| POST | `/api/projects/:projectId/documents` | Save a new ProjectDocument. Body: `{ type, title, content, tags?, favorite?, meta? }` |
| GET | `/api/projects/:projectId/documents?type=` | List documents under a project, optionally filtered by type |

### Documents — `backend/routes/documents.js`
| Method | Path | Description |
|---|---|---|
| GET | `/api/documents?type=` | All of the user's documents across every project, optionally filtered by type |
| GET | `/api/documents/:id` | Single document |
| PUT | `/api/documents/:id` | Update title/content/tags/favorite/meta |
| DELETE | `/api/documents/:id` | Delete a document |

### Dashboard — `backend/routes/dashboard.js`
| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | `{ totalProjects, totalIdeas, totalSwot, totalMarketingPlans, totalMarketing, byType }` |
| GET | `/api/dashboard/activity?limit=10` | Most recent activity entries |

> **Note on "Total Marketing" vs "Total Marketing Plans":** the spec listed
> both. `totalMarketingPlans` counts `marketing-plan` documents.
> `totalMarketing` currently mirrors that count but is returned as its own
> field so it can later combine additional marketing-related document types
> without changing the API shape.

All routes other than the health check require the existing `protect`
auth middleware (`Authorization: Bearer <token>`).

### Removed
- `models/Idea.js`, `models/BusinessPlan.js`, `models/Marketing.js`
- `controllers/ideaController.js`, `planController.js`, `marketingController.js`
- `routes/ideas.js`, `routes/plans.js`, `routes/marketing.js`

These are superseded by `Project` + `ProjectDocument`. The old models are
kept **read-only** under `backend/migrations/legacy-models/` solely for the
migration script below.

## 3. Database migration

`backend/migrations/001-migrate-ideas-to-projects.js` converts existing
data:

- Every `Idea` → a new `Project` (title/description copied) + a
  `ProjectDocument` of type `idea` (description + score).
- Every `BusinessPlan` → a `ProjectDocument` of type `business-model`,
  attached to the project created from its linked idea (or a new
  "Untitled Project (migrated)" if it had none).
- Every `Marketing` record → a `ProjectDocument` of type `marketing-plan`,
  attached the same way.

Run it once:

```bash
cd backend
npm run migrate:projects
```

The script only **reads** the legacy collections — it never modifies or
drops them. After verifying the migrated data you can manually drop
`ideas`, `businessplans`, and `marketings`.

## 4. Frontend changes

- **`frontend/pages/myideas.html` → `frontend/pages/my-projects.html`**
  Now the **Project History** page: shows each project's title, industry,
  creation date, available document types (badges), an **Open Project**
  button (→ `project.html?id=...`), and a **Delete Project** button. Also
  includes a "New Project" modal.

- **`frontend/pages/project.html`** *(new)* — the Project Workspace detail
  view. Shows project metadata plus every saved document grouped by type,
  with per-document delete.

- **`frontend/js/nav.js`** — "My Ideas" renamed to "My Projects", linking to
  `my-projects.html`.

- **`frontend/js/api.js`** — added `saveIdea` (now calls
  `quick-save-idea`), `getUserProjects`, `getProject`, `createProject`,
  `updateProject`, `deleteProject`, `saveProjectDocument`,
  `getProjectDocuments`, `updateProjectDocument`, `deleteProjectDocument`,
  `getDashboardStats`, `getDashboardActivity`. `saveBusinessPlan` /
  `saveMarketingContent` are kept as thin wrappers around
  `saveProjectDocument` for backward compatibility.

- **`frontend/js/project-save.js`** *(new)* — shared "Save to Project"
  modal used by `analysis.js`, `plan.js`, and `marketing.js` to let the user
  pick (or create) a project before saving a market analysis, business
  plan, or marketing kit as a ProjectDocument.

- **`frontend/pages/dashboard.html` + `frontend/js/dashboard.js`** — added
  a statistics row (Total Projects, Total Ideas, Total SWOT Analyses, Total
  Marketing Plans, Total Marketing) and a "Recent Activity" feed, both
  loaded from `/api/dashboard/*` when the user is logged in.

- **`frontend/js/ideas.js`** — unchanged; "Save Idea" already posts
  `{ title, description, score }`, which now flows into
  `quick-save-idea` and creates a Project + idea document.
