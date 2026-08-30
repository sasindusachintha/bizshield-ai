# 🛡️ BizShield AI

BizShield AI is a full-stack, AI-powered business intelligence platform that helps founders and teams take an idea from a rough concept all the way through market analysis, planning, and crisis response — all backed by a Groq-powered AI engine.

Every idea lives inside a **Project**, and every AI-generated output (market analysis, SWOT, marketing plan, business model, financial forecast, risk assessment, pitch deck) is saved as a **ProjectDocument** attached to that project, so a full history of AI outputs is preserved automatically.

## ✨ Features

### Growth Mode
- Save and manage business ideas as Projects
- AI-generated market analysis, SWOT, marketing plans, business models, financial forecasts, and pitch decks
- Project Workspace — every document type grouped under its project, with full history
- Dashboard with stats (Total Projects, Ideas, SWOT, Marketing Plans) and a Recent Activity feed

### Crisis Mode 🔥
A real-time AI **boardroom debate simulation**:
- 5 executive personas — **CEO, Finance, PR, Engineer, Lawyer** — debate a crisis scenario in sequence (CEO → Finance → PR → Engineer → Lawyer → CEO final decision)
- Each agent reacts to what was already said, via a growing chat history
- **Conflict detection** — flags HIGH CONFLICT when agents' risk scores diverge sharply
- **Weighted risk scoring** across all turns (CEO and Lawyer weighted higher)
- CEO delivers a structured **recovery plan** (4–6 steps, each with owner, priority, and timeline)
- Crisis outcomes can be saved directly into a Project as a Risk Assessment document

## 🏗️ Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **AI Engine:** Groq SDK
- **Frontend:** HTML, Bootstrap 5, vanilla JS
- **Auth:** JWT-based, protected routes via middleware

## 📁 Project Structure

bizshield-ai/
├── backend/
│ ├── agents/ # Crisis Mode boardroom personas
│ ├── algorithms/ # Debate engine, orchestrator
│ ├── models/ # Project, ProjectDocument, ActivityLog, CrisisSession
│ ├── routes/ # projects, documents, dashboard, crisis, growth
│ ├── migrations/ # legacy data migration scripts
│ └── server.js
└── frontend/
├── pages/ # dashboard, my-projects, project, crisis, etc.
└── js/ # api.js, nav.js, crisis.js, project-save.js


## 🔌 Key API Endpoints

### Projects
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/quick-save-idea` | Create a Project + its first idea document |
| POST | `/api/projects` | Create an empty project |
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get a project with its documents |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project and its documents |
| POST | `/api/projects/:projectId/documents` | Save a new document to a project |
| GET | `/api/projects/:projectId/documents` | List documents under a project |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/documents` | All of the user's documents across projects |
| GET | `/api/documents/:id` | Get a single document |
| PUT | `/api/documents/:id` | Update a document |
| DELETE | `/api/documents/:id` | Delete a document |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Aggregate stats across all document types |
| GET | `/api/dashboard/activity` | Recent activity feed |

### Crisis Mode
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/crisis/debate` | Run a full boardroom debate and save the session |
| GET | `/api/crisis/sessions` | List past crisis sessions |
| GET | `/api/crisis/sessions/:id` | Full transcript for one session |
| DELETE | `/api/crisis/sessions/:id` | Delete a session |

All routes (except health checks) require `Authorization: Bearer <token>`.

## 🚀 Getting Started

### Prerequisites
- Node.js
- MongoDB instance (local or Atlas)
- Groq API key

### Installation

```bash
git clone https://github.com/sasindusachintha/bizshield-ai.git
cd bizshield-ai/backend
npm install
```

### Environment Variables

Create a `.env` file in `backend/` (see `.env.example`):

MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret


### Run the backend

```bash
npm run dev
# or
npm start
```

### Run the frontend

Open `frontend/pages/dashboard.html` in your browser (or serve the `frontend/` folder with any static server).

### Migrating legacy data (if upgrading from the old Ideas/Plans/Marketing models)

```bash
cd backend
npm run migrate:projects
```

This reads the legacy `ideas`, `businessplans`, and `marketings` collections and converts them into Projects + ProjectDocuments. It's read-only — you can drop the old collections manually after verifying the migration.

## 📄 License

This project currently has no license specified.
