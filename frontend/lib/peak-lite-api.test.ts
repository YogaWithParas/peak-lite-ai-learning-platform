import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getStoredToken, listLearners, login, logout, type ApiLearner } from "./peak-lite-api"

const API_URL = "http://localhost:8000"

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
  } as Response
}

describe("login / logout", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("stores the token from a successful login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ token: "abc123" })),
    )

    const token = await login("admin_demo", "peaklite-demo-2026")

    expect(token).toBe("abc123")
    expect(getStoredToken()).toBe("abc123")
  })

  it("clears the stored token on logout", () => {
    window.localStorage.setItem("peak_lite_api_token", "abc123")
    logout()
    expect(getStoredToken()).toBeNull()
  })
})

describe("listLearners pagination", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  // Regression test: the API client used to return only the first paginated
  // page, so "30 learners" silently showed up as 20 in the UI. It must follow
  // `next` until every page is collected.
  it("follows `next` across multiple pages and merges every result", async () => {
    const page1: ApiLearner[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      full_name: `Learner ${i + 1}`,
      grade_level: "3-5",
      learning_needs: ["adhd"],
      availability: ["mornings"],
      family_user: null,
    }))
    const page2: ApiLearner[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 21,
      full_name: `Learner ${i + 21}`,
      grade_level: "6-8",
      learning_needs: ["dyslexia"],
      availability: ["afternoons"],
      family_user: null,
    }))

    const fetchMock = vi.fn(async (url: string) => {
      if (url === `${API_URL}/api/learners/`) {
        return jsonResponse({
          count: 30,
          next: `${API_URL}/api/learners/?page=2`,
          previous: null,
          results: page1,
        })
      }
      if (url === `${API_URL}/api/learners/?page=2`) {
        return jsonResponse({ count: 30, next: null, previous: null, results: page2 })
      }
      throw new Error(`Unexpected fetch to ${url}`)
    })
    vi.stubGlobal("fetch", fetchMock)

    const learners = await listLearners()

    expect(learners).toHaveLength(30)
    expect(learners[0].full_name).toBe("Learner 1")
    expect(learners[29].full_name).toBe("Learner 30")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("makes a single request when there is only one page", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        count: 3,
        next: null,
        previous: null,
        results: [
          { id: 1, full_name: "Alex Chen", grade_level: "6-8", learning_needs: [], availability: [], family_user: null },
        ],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const learners = await listLearners()

    expect(learners).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
