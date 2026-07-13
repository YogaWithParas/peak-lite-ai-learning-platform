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

export async function listLearners(): Promise<ApiLearner[]> {
  return request<ApiLearner[]>("/api/learners/")
}
