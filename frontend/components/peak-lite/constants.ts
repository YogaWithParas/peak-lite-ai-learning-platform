export type Screen =
  | "dashboard"
  | "learners"
  | "instructors"
  | "matchCenter"
  | "learningPlans"
  | "accounts"
  | "match"
  | "plan"

export type Role = "admin" | "case_manager" | "instructor" | "family"

export const DEMO_PASSWORD = "peaklite-demo-2026"

export const DEMO_ACCOUNTS: { role: Role; label: string; username: string }[] = [
  { role: "admin", label: "Admin", username: "admin_demo" },
  { role: "case_manager", label: "Case Manager", username: "casemanager_demo" },
  { role: "instructor", label: "Instructor", username: "jordan_lee" },
  { role: "family", label: "Family", username: "family_chen" },
]

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  case_manager: "Case Manager",
  instructor: "Instructor",
  family: "Family Member",
}

// Every entry has a real target screen -- clicking any sidebar item actually navigates.
export const NAV_ITEMS: Record<Role, { label: string; screen: Screen }[]> = {
  admin: [
    { label: "Dashboard", screen: "dashboard" },
    { label: "Learners", screen: "learners" },
    { label: "Instructors", screen: "instructors" },
    { label: "Match Center", screen: "matchCenter" },
    { label: "Learning Plans", screen: "learningPlans" },
    { label: "Accounts", screen: "accounts" },
  ],
  case_manager: [
    { label: "Dashboard", screen: "dashboard" },
    { label: "Learners", screen: "learners" },
    { label: "Instructors", screen: "instructors" },
    { label: "Match Center", screen: "matchCenter" },
    { label: "Learning Plans", screen: "learningPlans" },
  ],
  instructor: [{ label: "My Learners", screen: "dashboard" }],
  family: [{ label: "My Learner", screen: "dashboard" }],
}

// Mirrors backend/core/matching.py's MAX_SKILL_SCORE / MAX_AVAILABILITY_SCORE / MAX_CAPACITY_SCORE.
export const SCORE_ROWS: { key: "skill_score" | "availability_score" | "capacity_score"; label: string; max: number }[] = [
  { key: "skill_score", label: "Skill match", max: 60 },
  { key: "availability_score", label: "Availability match", max: 20 },
  { key: "capacity_score", label: "Capacity headroom", max: 20 },
]
