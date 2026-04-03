# FeedPulse - AI-Powered Product Feedback Platform

FeedPulse is a full-stack app for collecting product feedback and helping teams triage it faster with AI enrichment.

Users can submit feedback publicly (no sign-in), while admins can log in to review, filter, reanalyze, and resolve feedback from a dashboard.

![FeedPulse feedback form](https://raw.githubusercontent.com/Ksahan16/FeedPulse/a54e90834e4fca14fd0906f8d764ed11a39be282/public-feedback-form.png)

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: MongoDB, Mongoose
- AI: Google Gemini via `@google/generative-ai`

## Core Features

- Public feedback form with validation
- Optional submitter name and email fields
- AI enrichment per submission:
  - Category normalization
  - Sentiment (Positive, Neutral, Negative)
  - Priority score (1-10)
  - AI summary
  - AI tags
- Admin login with JWT
- Protected admin dashboard with:
  - Filters by category and status
  - Search by title, summary, and description
  - Sorting by date, AI priority, or AI sentiment
  - Pagination
  - Status workflow: New -> In Review -> Resolved
  - Reanalyze action to rerun AI for a feedback item
  - Delete action
  - Snapshot stats (total, open items, avg priority, most common tag)
- AI trend summary endpoint for last N days
- In-memory submission rate limit: 5 submissions/hour per IP
- CORS allowlist support via environment variable

## Project Structure

```text
FeedPluse/
|-- frontend/
|   |-- app/
|   |   |-- page.tsx
|   |   |-- login/page.tsx
|   |   |-- dashboard/page.tsx
|   |-- lib/api.ts
|
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- app.ts
|   |   |-- server.ts
|   |-- tests/
|
|-- docker-compose.yml
|-- README.md
```

## API Overview

Base URL (local): `http://localhost:4000`

Public routes:

- `GET /health`
- `POST /api/auth/login`
- `POST /api/feedback`

Admin routes (Bearer token required):

- `GET /api/feedback`
- `GET /api/feedback/summary?days=7`
- `GET /api/feedback/:id`
- `PATCH /api/feedback/:id`
- `DELETE /api/feedback/:id`
- `POST /api/feedback/:id/reanalyze`

### `GET /api/feedback` query params

- `page` (default: 1)
- `pageSize` (default: 10, max: 50)
- `category` (`Bug | Feature Request | Improvement | Other`)
- `status` (`New | In Review | Resolved`)
- `q` (text search)
- `sortBy` (`createdAt | ai_priority | ai_sentiment`, default: `createdAt`)
- `sortOrder` (`asc | desc`, default: `desc`)

### Response Shape

All endpoints return a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "..."
}
```

## Environment Variables

Backend (`backend/.env`):

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/feedpulse
JWT_SECRET=feedpulse-super-secret-jwt-key-2026
GEMINI_API_KEY=your-gemini-api-key
ADMIN_EMAIL=admin@feedpulse.dev
ADMIN_PASSWORD=Admin@123
CLIENT_ORIGIN=http://localhost:3000
```

Notes:

- `CLIENT_ORIGIN` can be a comma-separated allowlist (for example: `http://localhost:3000,http://localhost:3001`).
- Localhost origins are also accepted by regex in the backend CORS config.

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Run Locally

1. Start MongoDB

```bash
docker compose up -d
```

2. Start backend

```bash
cd backend
npm install
npm run dev
```

3. Start frontend

```bash
cd frontend
npm install
npm run dev
```

4. Open the app

- Public form: `http://localhost:3000`
- Admin login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`

## Admin Credentials (Local)

- Email: `admin@feedpulse.dev`
- Password: `Admin@123`

Use the values from your backend `.env` file.

## Screenshots

### Public Feedback Form

![Public Feedback Form](docs/screenshots/public-feedback-form.png)

### Admin Dashboard

![Admin Dashboard](docs/screenshots/admin-dashboard.png)

## Scripts

Backend (`backend/package.json`):

- `npm run dev` - start API in watch mode
- `npm run build` - compile TypeScript
- `npm start` - run compiled server
- `npm run lint` - type-check (`tsc --noEmit`)
- `npm test` - run tests once
- `npm run test:watch` - run tests in watch mode

Frontend (`frontend/package.json`):

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm start` - run production app
- `npm run lint` - Next.js lint

## Testing

Backend tests cover:

- Feedback route validation and auth protection
- AI enrichment trigger behavior
- Gemini response normalization behavior

Run:

```bash
cd backend
npm test
```

## AI Processing Notes

- AI enrichment for new feedback runs in the background after submission.
- Submission succeeds even if AI processing fails.
- Gemini model fallback order is implemented in service logic.

## Security and Ops Notes

- Never commit `.env` files.
- Use a strong `JWT_SECRET` in non-local environments.
- Rotate your Gemini API key if it is exposed.
- Current rate limit storage is in-memory; use Redis or another shared store for multi-instance deployments.# FeedPulse - AI-Powered Product Feedback Platform

FeedPulse is a full-stack web application that lets users submit product feedback and uses Gemini AI to automatically categorize and prioritize each submission.

## Tech Stack

- Frontend: Next.js 14 + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- AI: Google Gemini (`gemini-1.5-flash`)

## Project Structure

```text
feedpulse/
|-- frontend/
|   |-- app/
|   |   |-- page.tsx
|   |   |-- login/page.tsx
|   |   |-- dashboard/page.tsx
|   |-- lib/api.ts
|
|-- backend/
|   |-- src/
|   |   |-- routes/
|   |   |-- controllers/
|   |   |-- models/
|   |   |-- services/
|   |   |-- middleware/
|   |   |-- config/
|   |   |-- app.ts
|   |   |-- server.ts
|
|-- docker-compose.yml
|-- README.md
```

## Must-Have Features Covered

- Public feedback form (no auth)
- Validation (title, category, min description length)
- Store feedback in MongoDB
- Auto-trigger Gemini AI analysis on submit
- Save AI fields: `ai_category`, `ai_sentiment`, `ai_priority`, `ai_summary`, `ai_tags`
- Admin login with JWT session token
- Protected admin dashboard
- Filters: category and status
- Search: title and summary
- Status workflow: New -> In Review -> Resolved
- Pagination (10 items per page)
- REST API with consistent JSON responses
- Proper HTTP status codes
- Input sanitization and route/middleware separation

## Nice-To-Have Implemented

- In-memory rate limiting on feedback submission (5 per hour per IP)
- AI summary endpoint for last N days (`/api/feedback/summary?days=7`)
- Sort by newest first
- Dashboard snapshot metric (average AI priority)

## API Endpoints

- `POST /api/auth/login`
- `POST /api/feedback`
- `GET /api/feedback`
- `GET /api/feedback/:id`
- `PATCH /api/feedback/:id`
- `DELETE /api/feedback/:id`
- `GET /api/feedback/summary`

## Environment Variables

Backend (`backend/.env`):

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/feedpulse
JWT_SECRET=feedpulse-super-secret-jwt-key-2026
GEMINI_API_KEY=your-gemini-api-key
ADMIN_EMAIL=admin@feedpulse.dev
ADMIN_PASSWORD=Admin@123
CLIENT_ORIGIN=http://localhost:3000
```

Frontend (`frontend/.env`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## Run Locally

1. Start MongoDB

```bash
docker compose up -d
```

2. Install backend dependencies and run backend

```bash
cd backend
npm install
npm run dev
```

3. Install frontend dependencies and run frontend

```bash
cd frontend
npm install
npm run dev
```

4. Open app

- Public form: `http://localhost:3000`
- Admin login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/dashboard`

## Admin Credentials

- Email: `admin@feedpulse.dev`
- Password: `Admin@123`

## Suggested Screenshot List

- Public feedback form
- Successful submission message
- Admin login
- Dashboard with filters and sentiment badges
- Dashboard summary result

## Step-by-Step GitHub Commit Plan

Use these commits in order (no `feat:` / `chore:` prefixes):

1. `Initialize project structure for FeedPulse`
2. `Add backend API with MongoDB models and auth`
3. `Integrate Gemini AI analysis on feedback submission`
4. `Build public feedback form and admin login pages`
5. `Build admin dashboard with filters status updates and pagination`
6. `Polish UI styling and responsive layout`
7. `Add environment templates docker compose and README documentation`

## Notes

- `.env` files are gitignored and should never be committed.
- If your Gemini key was shared publicly, rotate it in Google AI Studio and replace it in `backend/.env`.
