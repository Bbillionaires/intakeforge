# IntakeForge MVP

IntakeForge is a single-user MVP that turns natural-language form requests into editable forms, then publishes them to Google Forms with a linked Google Sheet.

## Stack
- Frontend: Next.js 14 (App Router, TypeScript)
- Backend: FastAPI (Python 3.11+)
- Database: SQLite (SQLModel)
- OAuth/APIs: Google OAuth, Google Forms API, Google Sheets API

---

## Features
- Describe the form in plain English.
- AI-style deterministic generator creates:
  - title
  - description
  - sections
  - questions
  - question types
  - required flags
- Edit generated output in UI.
- Persist forms and question schema in SQLite.
- Approve and publish to Google:
  - Google Form created
  - linked response Google Sheet created and connected
- Returns:
  - form edit link
  - form public link
  - spreadsheet link

---

## Project layout

- `frontend/` Next.js app
- `backend/` FastAPI app

---

## Prerequisites
- Node.js 20+
- Python 3.11+
- Google Cloud project with:
  - OAuth consent screen configured
  - OAuth Client ID / Secret (Web app)
  - Google Forms API enabled
  - Google Sheets API enabled
  - Google Drive API enabled

---

## Quick start (Linux/macOS)

```bash
bash scripts/setup.sh
# then in two terminals:
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

Or with Docker Compose:

```bash
cp backend/.env.example backend/.env  # fill in credentials
docker compose up
```

---

## PowerShell setup (Windows)

### 1) Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_BASE_URL=http://localhost:3000
DATABASE_URL=sqlite:///./intakeforge.db
SECRET_KEY=replace-this
```

Run backend:

```powershell
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend setup

```powershell
cd ..\frontend
npm install
Copy-Item .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Run frontend:

```powershell
npm run dev
```

Open http://localhost:3000

---

## OAuth flow
1. Click **Connect Google** in the app.
2. Complete consent in Google.
3. Backend stores OAuth tokens in SQLite.
4. Create + approve a form.
5. Click **Publish to Google**.

---

## API endpoints
- `GET /health`
- `GET /auth/google/login`
- `GET /auth/google/callback`
- `GET /auth/google/status`
- `POST /forms/generate`
- `GET /forms`
- `GET /forms/{id}`
- `PUT /forms/{id}`
- `POST /forms/{id}/publish`

---

## AI Form Generation

Set `ANTHROPIC_API_KEY` in `backend/.env` to enable Claude-powered form generation. When the key is present, the backend calls Claude (claude-haiku-4-5) via tool_use to produce context-aware sections and questions. Without a key the generator falls back to rule-based defaults.

```env
ANTHROPIC_API_KEY=sk-ant-...
```

## Notes
- This MVP is scoped for one user and stores one OAuth token set.
- No payment processing.
- No subscriptions.
- Form generation uses Claude when `ANTHROPIC_API_KEY` is set, otherwise falls back to rule-based generation.

---

## Deploy so it is not running locally

Recommended low-cost deployment for this MVP:

- **Backend:** Google Cloud Run
- **Frontend:** Vercel
- **Database:** Supabase Postgres or another hosted Postgres database

> Do not rely on SQLite for production Cloud Run persistence. Cloud Run instances have ephemeral local filesystems, so the local `sqlite:///./intakeforge.db` setting is only for local development. Use a hosted Postgres URL for deployed environments.

### 1) Create hosted Postgres database

Use Supabase, Neon, Railway Postgres, or Cloud SQL. Copy the connection string and convert it to SQLAlchemy format if needed:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres
```

### 2) Deploy backend to Google Cloud Run with PowerShell

Install and sign in to Google Cloud SDK first, then run this from the repo root:

```powershell
.\scripts\deploy-cloudrun.ps1 `
  -ProjectId "your-gcp-project-id" `
  -Region "us-central1" `
  -GoogleClientId "your-client-id.apps.googleusercontent.com" `
  -GoogleClientSecret "your-client-secret" `
  -FrontendBaseUrl "https://your-vercel-domain.vercel.app" `
  -DatabaseUrl "postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres" `
  -SecretKey "your-long-random-secret"
```

The script prints:

- Cloud Run backend URL
- Google OAuth redirect URI
- `NEXT_PUBLIC_API_BASE_URL` value for Vercel

### 3) Update Google OAuth credentials

In Google Cloud Console → APIs & Services → Credentials → OAuth Client ID:

- Authorized JavaScript origin:

```text
https://your-vercel-domain.vercel.app
```

- Authorized redirect URI:

```text
https://your-cloud-run-url/auth/google/callback
```

### 4) Deploy frontend to Vercel

Create/import the project in Vercel and use:

- Root directory: `frontend`
- Environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-cloud-run-url
```

Then deploy. Open the Vercel URL, click **Connect Google**, generate a draft, approve it, and publish to Google.

### 5) Production smoke checks

Use PowerShell:

```powershell
Invoke-RestMethod "https://your-cloud-run-url/health"
Invoke-RestMethod "https://your-cloud-run-url/auth/google/status"
```
