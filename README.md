# PEAK-Lite AI Learning Platform

PEAK-Lite is a frontend prototype for an AI-ready learner-instructor matching platform. It supports educators working with learners who have diverse learning needs such as dyslexia, dyscalculia, ADHD, ASD, executive function challenges, reading difficulty, writing difficulty, and math difficulty.

## Current Status

This version is a frontend-only prototype using synthetic mock data.

It includes:
- Learner and instructor profile screens
- Rule-based matching logic
- Match score breakdown
- AI-ready explanation layer
- Support plan draft, edit, and approval flow
- Accessible navigation and clear workflow states

This version does not include:
- Backend API
- Database persistence
- Authentication
- Real OpenAI/Claude API integration

## Demo Flow

Dashboard → Match Center → Match Result → Support Plan Review → Edit Draft → Approve Plan

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Mock data
- Git/GitHub

## Future Architecture

The frontend is designed to connect later with:
- Django REST Framework
- PostgreSQL
- AI-assisted recommendation workflows
- Instructor/learner management APIs
- Persistent support plan drafts and approvals

## Run Locally

```bash
cd frontend
npm install
npm run dev