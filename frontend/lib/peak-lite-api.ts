// Client for the PEAK-Lite Backend v2 (Django REST Framework, ../backend).
// Isolated from lib/mock-data.ts and lib/matching.ts, which continue to
// power the existing prototype UI with synthetic data. This client shows
// the same UI could be pointed at the real API by swapping call sites.

const API_URL = process.env.NEXT_PUBLIC_PEAK_LITE_API_URL || "http://localhost:8000"

const TOKEN_STORAGE_KEY = "peak_lite_api_token"

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

function setStoredToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function logout(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `PEAK-Lite API request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

export async function login(username: string, password: string): Promise<string> {
  const { token } = await request<{ token: string }>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
  setStoredToken(token)
  return token
}

export interface ApiMatchRecommendation {
  id: number
  instructor: string
  score: number
  reason: string
  status: "pending" | "approved" | "rejected"
}

export interface CreateMatchRecommendationsResponse {
  learner: string
  recommendations: ApiMatchRecommendation[]
}

// Calls the real backend endpoint: POST /api/match-recommendations/
export async function createMatchRecommendations(
  learnerId: number,
): Promise<CreateMatchRecommendationsResponse> {
  return request<CreateMatchRecommendationsResponse>("/api/match-recommendations/", {
    method: "POST",
    body: JSON.stringify({ learner_id: learnerId }),
  })
}

export interface ApiLearner {
  id: number
  full_name: string
  grade_level: string
  learning_needs: string[]
  availability: string[]
  family_user: number | null
}

// List endpoints are paginated (20/page): {count, next, previous, results}.
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listLearners(): Promise<ApiLearner[]> {
  const page = await request<PaginatedResponse<ApiLearner>>("/api/learners/")
  return page.results
}

export interface Me {
  username: string
  role: "admin" | "case_manager" | "instructor" | "family" | null
}

export async function getMe(): Promise<Me> {
  return request<Me>("/api/auth/me/")
}

// Full detail shape returned by GET/approve/reject on a single match recommendation
// (POST /api/match-recommendations/ itself returns the more compact ApiMatchRecommendation).
export interface ApiMatchRecommendationDetail {
  id: number
  learner: number
  learner_name: string
  instructor: number
  instructor_name: string
  score: number
  reason: string
  status: "pending" | "approved" | "rejected"
  created_by: number | null
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export async function listMatchRecommendations(): Promise<ApiMatchRecommendationDetail[]> {
  const page = await request<PaginatedResponse<ApiMatchRecommendationDetail>>("/api/match-recommendations/")
  return page.results
}

export async function approveMatchRecommendation(id: number): Promise<ApiMatchRecommendationDetail> {
  return request<ApiMatchRecommendationDetail>(`/api/match-recommendations/${id}/approve/`, {
    method: "POST",
  })
}

export async function rejectMatchRecommendation(id: number): Promise<ApiMatchRecommendationDetail> {
  return request<ApiMatchRecommendationDetail>(`/api/match-recommendations/${id}/reject/`, {
    method: "POST",
  })
}

export interface ApiLearningPlan {
  id: number
  learner: number
  learner_name: string
  ai_draft: string
  approved_plan: string | null
  status: "draft" | "approved" | "rejected"
  created_by: number | null
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export async function listLearningPlans(): Promise<ApiLearningPlan[]> {
  const page = await request<PaginatedResponse<ApiLearningPlan>>("/api/learning-plans/")
  return page.results
}

// AI drafts the plan server-side (core/ai.py) -- nothing is ever sent as "final" here.
export async function createLearningPlan(learnerId: number): Promise<ApiLearningPlan> {
  return request<ApiLearningPlan>("/api/learning-plans/", {
    method: "POST",
    body: JSON.stringify({ learner_id: learnerId }),
  })
}

// The human can edit the draft before approving -- approvedPlan defaults to the
// AI draft server-side if omitted, but the UI always sends the (possibly edited) text.
export async function approveLearningPlan(id: number, approvedPlan: string): Promise<ApiLearningPlan> {
  return request<ApiLearningPlan>(`/api/learning-plans/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify({ approved_plan: approvedPlan }),
  })
}

export async function rejectLearningPlan(id: number): Promise<ApiLearningPlan> {
  return request<ApiLearningPlan>(`/api/learning-plans/${id}/reject/`, {
    method: "POST",
  })
}
