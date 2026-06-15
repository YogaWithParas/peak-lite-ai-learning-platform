import type {
  Instructor,
  Learner,
  MatchPriority,
  MatchResult,
  ScoreBreakdown,
} from "./types"

// Pure matching logic, isolated from UI and data.
// A future backend can reimplement scoreInstructor server-side without UI changes.

// Maximum points per category (sum = 100).
export const SCORE_WEIGHTS = {
  supportNeedSkill: 35,
  learningDifferenceExperience: 25,
  availability: 20,
  capacity: 10,
  teachingStyle: 10,
} as const

// Priority adjusts emphasis by scaling category contributions before normalizing.
const PRIORITY_MULTIPLIERS: Record<MatchPriority, Partial<Record<keyof ScoreBreakdown, number>>> = {
  balanced: {},
  "support-need": { supportNeedSkill: 1.25 },
  "learning-difference": { learningDifferenceExperience: 1.25 },
  availability: { availability: 1.25 },
}

function overlapRatio<T>(a: T[], b: T[]): number {
  if (a.length === 0) return 0
  const set = new Set(b)
  const matches = a.filter((item) => set.has(item)).length
  return matches / a.length
}

export function scoreInstructor(
  learner: Learner,
  instructor: Instructor,
  priority: MatchPriority = "balanced",
): MatchResult {
  const multipliers = PRIORITY_MULTIPLIERS[priority]

  const supportNeedRatio = overlapRatio(learner.supportNeeds, instructor.skills)
  const experienceRatio = overlapRatio(
    learner.learningDifferences,
    instructor.experienceAreas,
  )
  const availabilityRatio = overlapRatio(learner.availability, instructor.availability)

  const freeCapacity = Math.max(instructor.capacity - instructor.currentLoad, 0)
  const capacityRatio = instructor.capacity > 0 ? freeCapacity / instructor.capacity : 0

  const styleRatio = learner.preferredTeachingStyle === instructor.teachingStyle ? 1 : 0

  const raw: ScoreBreakdown = {
    supportNeedSkill: supportNeedRatio * SCORE_WEIGHTS.supportNeedSkill,
    learningDifferenceExperience: experienceRatio * SCORE_WEIGHTS.learningDifferenceExperience,
    availability: availabilityRatio * SCORE_WEIGHTS.availability,
    capacity: capacityRatio * SCORE_WEIGHTS.capacity,
    teachingStyle: styleRatio * SCORE_WEIGHTS.teachingStyle,
  }

  const breakdown: ScoreBreakdown = {
    supportNeedSkill: applyMultiplier(raw.supportNeedSkill, multipliers.supportNeedSkill, SCORE_WEIGHTS.supportNeedSkill),
    learningDifferenceExperience: applyMultiplier(
      raw.learningDifferenceExperience,
      multipliers.learningDifferenceExperience,
      SCORE_WEIGHTS.learningDifferenceExperience,
    ),
    availability: applyMultiplier(raw.availability, multipliers.availability, SCORE_WEIGHTS.availability),
    capacity: applyMultiplier(raw.capacity, multipliers.capacity, SCORE_WEIGHTS.capacity),
    teachingStyle: applyMultiplier(raw.teachingStyle, multipliers.teachingStyle, SCORE_WEIGHTS.teachingStyle),
  }

  const totalScore = Math.round(
    breakdown.supportNeedSkill +
      breakdown.learningDifferenceExperience +
      breakdown.availability +
      breakdown.capacity +
      breakdown.teachingStyle,
  )

  return {
    instructor,
    totalScore,
    breakdown: roundBreakdown(breakdown),
    explanation: buildExplanation(learner, instructor, breakdown, freeCapacity),
  }
}

function applyMultiplier(value: number, multiplier: number | undefined, cap: number): number {
  if (!multiplier) return value
  return Math.min(value * multiplier, cap)
}

function roundBreakdown(b: ScoreBreakdown): ScoreBreakdown {
  return {
    supportNeedSkill: Math.round(b.supportNeedSkill),
    learningDifferenceExperience: Math.round(b.learningDifferenceExperience),
    availability: Math.round(b.availability),
    capacity: Math.round(b.capacity),
    teachingStyle: Math.round(b.teachingStyle),
  }
}

export function rankInstructors(
  learner: Learner,
  instructors: Instructor[],
  priority: MatchPriority = "balanced",
): MatchResult[] {
  return instructors
    .map((instructor) => scoreInstructor(learner, instructor, priority))
    .sort((a, b) => b.totalScore - a.totalScore)
}

function buildExplanation(
  learner: Learner,
  instructor: Instructor,
  breakdown: ScoreBreakdown,
  freeCapacity: number,
): string {
  const sharedNeeds = learner.supportNeeds.filter((n) => instructor.skills.includes(n))
  const sharedAreas = learner.learningDifferences.filter((d) =>
    instructor.experienceAreas.includes(d),
  )
  const sharedTimes = learner.availability.filter((a) => instructor.availability.includes(a))

  const instructorFirst = firstName(instructor.name)
  const learnerFirst = firstName(learner.name)
  const parts: string[] = []

  if (sharedNeeds.length > 0) {
    parts.push(
      `${instructorFirst}'s skills directly address ${learnerFirst}'s needs in ${formatList(sharedNeeds)}`,
    )
  } else {
    parts.push(
      `${instructorFirst} has partial overlap with ${learnerFirst}'s current support needs`,
    )
  }

  if (sharedAreas.length > 0) {
    parts.push(`brings direct experience supporting ${formatList(sharedAreas)}`)
  }

  if (sharedTimes.length > 0) {
    parts.push(`is available during ${formatList(sharedTimes)}`)
  }

  if (freeCapacity > 0) {
    parts.push(`and currently has room for ${freeCapacity} more learner${freeCapacity === 1 ? "" : "s"}`)
  } else {
    parts.push(`though their caseload is currently full`)
  }

  const styleNote =
    learner.preferredTeachingStyle === instructor.teachingStyle
      ? ` Their ${instructor.teachingStyle.toLowerCase()} approach matches ${learnerFirst}'s preferred style.`
      : ` Note that their teaching style (${instructor.teachingStyle.toLowerCase()}) differs from the learner's stated preference.`

  return `${capitalize(parts.join(", "))}.${styleNote}`
}

function firstName(name: string | undefined | null): string {
  if (!name) return "They"

  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts[0] ?? "They"
}

function formatList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
