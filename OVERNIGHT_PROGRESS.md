# Overnight session log — PEAK-Lite role workflows

Plan agreed: 4 sessions (core workflow completion → role-aware views → polish → rehearsal).
Guardrails: local commits only, no push, no destructive ops, tests gate every session.

## Status

- [x] Session 1: Complete the core case_manager/admin workflow (approve match, draft plan, approve/reject plan) + `/api/auth/me/` endpoint
- [ ] Session 2: Role-aware `/live` views (instructor, family)
- [ ] Session 3: Polish (friendlier 403s, Select-bug check, Docker stability re-check)
- [ ] Session 4: Rehearsal (not building — timed run-through + narration notes)

## Log

### Session 1 — backend, in progress
- Added `GET /api/auth/me/` (`MeView` in `core/views.py`, wired in `peak_lite/urls.py`) returning `{username, role}`.
- Added 2 tests for it (authenticated + 401 unauthenticated).
- Added `test_case_manager_can_approve_match_recommendation` and `test_case_manager_can_create_learning_plan` — these two backend actions already existed and were permission-tested, but not exercised directly until now (they're exactly what the new UI calls).
- Ran full suite against real Postgres in the running `backend-web-1` container: **12/12 passing**.
- Backend side of Session 1 is done. Next: frontend API client + `/live` page UI for approve/reject match and draft/approve/reject learning plan.

### Session 1 — frontend
- Added API client functions in `frontend/lib/peak-lite-api.ts`: `getMe`, `listMatchRecommendations`, `approveMatchRecommendation`, `rejectMatchRecommendation`, `listLearningPlans`, `createLearningPlan`, `approveLearningPlan`, `rejectLearningPlan`, plus `Me`/`ApiMatchRecommendationDetail`/`ApiLearningPlan` types.
- Rewrote `frontend/app/live/page.tsx`: shows "Signed in as X (role)" via `/api/auth/me/`; match recommendation cards now have Approve/Reject buttons (only shown while `status === "pending"`); a new "Learning plan" card lets you draft an AI plan, edit the text in a textarea, and approve/reject it, with status-appropriate display once approved/rejected.
- `npm run build`: compiles clean.
- **Note**: the Browser-pane's `screenshot`/`zoom` capture actions hung (30s timeout) every time they were tried tonight (6 attempts total, across 2 tabs, at both the start and end of Session 1's browser testing) — confirmed this is a tool/renderer issue, not an app bug: dev server log stayed completely clean throughout, every API call returned 200, and `get_page_text`/`read_page`/JS execution all worked normally the whole time. Also found that clicking options inside the portaled Select dropdown returned `(0,0)` coordinates via the normal click tool (a separate symptom of the same stalled paint pipeline) — worked around by dispatching real DOM click/input events via `javascript_tool` instead, which is genuine user-equivalent interaction (real click/input events on the real rendered page), just not coordinate-based.

### Session 1 — live end-to-end verification (text + database, no pixel screenshots available)
Full flow driven for real against the Docker/Postgres backend as `casemanager_demo`:
1. Signed in — page correctly showed "Signed in as casemanager_demo [case_manager]" via the new `/api/auth/me/` call.
2. Selected "Alex Chen — 6-8", clicked **Run live match** → got back Jordan Lee, score 90, real reason text, status `pending`, with Approve/Reject buttons showing.
3. Clicked **Approve** → status flipped to `approved` in the UI, buttons correctly disappeared.
4. Clicked **Draft AI learning plan** → textarea populated with the real `core/ai.py` stub text, status `draft`, Approve/Reject buttons appeared.
5. Edited the textarea (appended "Case manager note: start with 15-minute sessions, twice weekly.") via a real `input` event.
6. Clicked **Approve plan** → UI showed status `approved`, a real approval timestamp, and the *edited* text (not the original AI draft).
7. **Verified directly against the database** (`docker compose exec web python manage.py shell`): `LearningPlan.approved_plan` contains the edited text exactly, `approved_by` is `casemanager_demo`; `MatchRecommendation.status` is `approved`, `reviewed_by` is `casemanager_demo`. Confirms the UI isn't just updating local state — it's the real, persisted record.

This is the core "AI drafts, human decides" workflow, fully working and proven end to end for the first time.
