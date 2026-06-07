# Growth Mode — Backend

## Setup

```bash
cd backend
npm install
cp .env.example .env        # add your GOOGLE_API_KEY in .env
npm run dev                  # starts on http://localhost:3000
```

---

## API Routes

### POST /api/growth/generate-ideas
```json
{ "skills": "coding", "budget": 500, "interest": "online business" }
```

### POST /api/growth/analyze-idea
```json
{ "idea": "dropshipping store" }
```

### POST /api/growth/generate-plan
```json
{ "idea": "coffee shop" }
```

### POST /api/growth/marketing-content
```json
{ "idea": "fitness coaching" }
```

### POST /api/growth/feasibility-score
```json
{ "demand": 8, "competition": 4, "skill_match": 7 }
```
Returns score using: `(demand * 0.4) + (skill_match * 0.4) - (competition * 0.2)`

---

## Test with curl

```bash
curl -X POST http://localhost:3000/api/growth/feasibility-score \
  -H "Content-Type: application/json" \
  -d '{"demand":8,"competition":4,"skill_match":7}'
```

---

## File Structure

```
backend/
├── server.js            # Entry point
├── package.json
├── .env.example
├── routes/
│   └── growth.js        # All 5 API routes
└── utils/
    └── helpers.js       # callAI, formatResponse, validateInput
```
