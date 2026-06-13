#!/usr/bin/env bash
set -euo pipefail

echo "==> IntakeForge setup"

# Backend
echo "==> Setting up backend"
cd "$(dirname "$0")/../backend"
python3 -m venv .venv
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created backend/.env from .env.example — fill in your credentials."
fi

echo "==> Backend ready. Run: cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"

# Frontend
echo "==> Setting up frontend"
cd ../frontend
npm install --silent

if [ ! -f .env.local ]; then
  echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
  echo "    Created frontend/.env.local"
fi

echo "==> Frontend ready. Run: cd frontend && npm run dev"
echo ""
echo "Done! Open http://localhost:3000 once both servers are running."
