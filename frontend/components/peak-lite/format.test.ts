import { describe, expect, it } from "vitest"
import { initials, matchBadge, planBadge, usernameInitials } from "./format"
import type { ApiLearningPlan } from "@/lib/peak-lite-api"

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Alex Chen")).toBe("AC")
  })

  it("uppercases lowercase names", () => {
    expect(initials("jordan lee")).toBe("JL")
  })

  it("handles a single-word name", () => {
    expect(initials("Cher")).toBe("C")
  })

  it("ignores a third+ word", () => {
    expect(initials("Mary Jane Watson")).toBe("MJ")
  })
})

describe("usernameInitials", () => {
  it("splits on underscores", () => {
    expect(usernameInitials("casemanager_demo")).toBe("CD")
  })

  it("splits on dots and dashes too", () => {
    expect(usernameInitials("jordan.lee")).toBe("JL")
    expect(usernameInitials("sam-rivera")).toBe("SR")
  })

  it("falls back to the first two characters for a single-word username", () => {
    expect(usernameInitials("admin")).toBe("AD")
  })
})

describe("matchBadge", () => {
  it("labels a matched learner as Matched with the success variant", () => {
    expect(matchBadge(true)).toEqual({ label: "Matched", variant: "success" })
  })

  it("labels an unmatched learner as Unmatched with the outline variant", () => {
    expect(matchBadge(false)).toEqual({ label: "Unmatched", variant: "outline" })
  })
})

describe("planBadge", () => {
  const basePlan: ApiLearningPlan = {
    id: 1,
    learner: 1,
    learner_name: "Alex Chen",
    ai_draft: "draft text",
    approved_plan: null,
    status: "draft",
    created_by: null,
    approved_by: null,
    approved_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }

  it("shows No Plan when there is no plan record", () => {
    expect(planBadge(null)).toEqual({ label: "No Plan", variant: "outline" })
  })

  it("shows the AI-draft label for a draft plan", () => {
    expect(planBadge(basePlan)).toEqual({
      label: "AI Draft — Pending Review",
      variant: "secondary",
    })
  })

  it("shows Approved for an approved plan", () => {
    expect(planBadge({ ...basePlan, status: "approved" })).toEqual({
      label: "Approved ✓",
      variant: "success",
    })
  })

  it("shows Rejected for a rejected plan", () => {
    expect(planBadge({ ...basePlan, status: "rejected" })).toEqual({
      label: "Rejected",
      variant: "destructive",
    })
  })
})
