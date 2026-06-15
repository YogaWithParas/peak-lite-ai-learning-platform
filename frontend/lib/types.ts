// Shared domain types for PEAK-Lite.
// These mirror what a future Django REST Framework API would return,
// so swapping mock data for real API calls stays low-friction.

export type LearningDifference =
  | "Dyslexia"
  | "Dyscalculia"
  | "ADHD"
  | "ASD"
  | "Executive Function"
  | "Reading Difficulty"
  | "Writing Difficulty"
  | "Math Difficulty"

export type SupportNeed =
  | "Reading fluency"
  | "Phonological awareness"
  | "Number sense"
  | "Focus & attention"
  | "Task initiation"
  | "Organization"
  | "Written expression"
  | "Social communication"
  | "Sensory regulation"
  | "Working memory"

export type TeachingStyle =
  | "Structured & explicit"
  | "Multisensory"
  | "Visual & concrete"
  | "Flexible & exploratory"
  | "Calm & low-pressure"
  | "Goal-oriented"

export type Availability =
  | "Mornings"
  | "Afternoons"
  | "Evenings"
  | "Weekends"
  | "Flexible"

export type GradeLevel =
  | "K-2"
  | "3-5"
  | "6-8"
  | "9-12"

export interface Learner {
  id: string
  name: string
  age: number
  grade: GradeLevel
  learningDifferences: LearningDifference[]
  supportNeeds: SupportNeed[]
  availability: Availability[]
  preferredTeachingStyle: TeachingStyle
  notes: string
}

export interface Instructor {
  id: string
  name: string
  title: string
  skills: SupportNeed[]
  experienceAreas: LearningDifference[]
  availability: Availability[]
  teachingStyle: TeachingStyle
  capacity: number
  currentLoad: number
  yearsExperience: number
  bio: string
}

export type MatchPriority =
  | "balanced"
  | "support-need"
  | "learning-difference"
  | "availability"

export interface ScoreBreakdown {
  supportNeedSkill: number
  learningDifferenceExperience: number
  availability: number
  capacity: number
  teachingStyle: number
}

export interface MatchResult {
  instructor: Instructor
  totalScore: number
  breakdown: ScoreBreakdown
  explanation: string
}

export interface ActivityItem {
  id: string
  type: "match" | "approval" | "learner" | "instructor"
  message: string
  timestamp: string
}
