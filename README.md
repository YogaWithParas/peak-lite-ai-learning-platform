# PEAK-Lite AI Learning Platform

PEAK-Lite is a frontend prototype for an AI-ready learner-instructor matching platform. It supports educators working with learners who have diverse learning needs such as dyslexia, dyscalculia, ADHD, ASD, executive function challenges, reading difficulty, writing difficulty, and math difficulty.

## Current Status

The `frontend/` app is a UI prototype using synthetic mock data. `backend/` is a real Django REST Framework + PostgreSQL API ("PEAK-Lite Backend v2") that implements learner-instructor matching and human-approved AI learning plans — see [backend/README.md](backend/README.md) for full details, setup, and interview talking points.

Frontend includes:
- Learner and instructor profile screens
- Rule-based matching logic
- Match score breakdown
- AI-ready explanation layer
- Support plan draft, edit, and approval flow
- Accessible navigation and clear workflow states

Backend includes:
- Django REST Framework API backed by PostgreSQL
- Role-based permissions (admin, case manager, instructor, family)
- `POST /api/match-recommendations/` rule-based matching endpoint
- `LearningPlan` model separating AI draft from human-approved plan
- Token auth + CORS so the frontend can call it directly (`frontend/lib/peak-lite-api.ts`)

Not yet wired up: the frontend's polished UI still runs on mock data (`frontend/lib/mock-data.ts`); it isn't yet re-pointed at the live backend for every screen.

## Demo Flow

Dashboard → Match Center → Match Result → Support Plan Review → Edit Draft → Approve Plan

## Tech Stack

- Next.js, React, TypeScript, Tailwind CSS (frontend)
- Django, Django REST Framework, PostgreSQL (backend)
- Git/GitHub

## Run Locally

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend (see [backend/README.md](backend/README.md) for full setup):

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```