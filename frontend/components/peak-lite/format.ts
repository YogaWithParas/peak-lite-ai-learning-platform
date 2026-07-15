import type { ApiLearningPlan } from "@/lib/peak-lite-api"

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// Accounts have no full_name, only a username -- split on separators instead of spaces.
export function usernameInitials(username: string) {
  const parts = username.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return username.slice(0, 2).toUpperCase()
}

export function matchBadge(matched: boolean) {
  return matched
    ? { label: "Matched", variant: "success" as const }
    : { label: "Unmatched", variant: "outline" as const }
}

export function planBadge(plan: ApiLearningPlan | null) {
  if (!plan) return { label: "No Plan", variant: "outline" as const }
  if (plan.status === "approved") return { label: "Approved ✓", variant: "success" as const }
  if (plan.status === "rejected") return { label: "Rejected", variant: "destructive" as const }
  return { label: "AI Draft — Pending Review", variant: "secondary" as const }
}
