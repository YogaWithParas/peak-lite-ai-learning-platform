"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { LearnerCard } from "@/components/learner-card"
import { ALL_VALUE, FilterSelect } from "@/components/filter-select"
import { Button } from "@/components/ui/button"
import { learners } from "@/lib/mock-data"
import type {
  Availability,
  GradeLevel,
  LearningDifference,
  SupportNeed,
} from "@/lib/types"

const differenceOptions: LearningDifference[] = [
  "Dyslexia",
  "Dyscalculia",
  "ADHD",
  "ASD",
  "Executive Function",
  "Reading Difficulty",
  "Writing Difficulty",
  "Math Difficulty",
]

const needOptions: SupportNeed[] = [
  "Reading fluency",
  "Phonological awareness",
  "Number sense",
  "Focus & attention",
  "Task initiation",
  "Organization",
  "Written expression",
  "Social communication",
  "Sensory regulation",
  "Working memory",
]

const gradeOptions: GradeLevel[] = ["K-2", "3-5", "6-8", "9-12"]
const availabilityOptions: Availability[] = [
  "Mornings",
  "Afternoons",
  "Evenings",
  "Weekends",
  "Flexible",
]

export default function LearnersPage() {
  const [difference, setDifference] = useState(ALL_VALUE)
  const [need, setNeed] = useState(ALL_VALUE)
  const [grade, setGrade] = useState(ALL_VALUE)
  const [availability, setAvailability] = useState(ALL_VALUE)

  const filtered = useMemo(() => {
    return learners.filter((l) => {
      if (difference !== ALL_VALUE && !l.learningDifferences.includes(difference as LearningDifference))
        return false
      if (need !== ALL_VALUE && !l.supportNeeds.includes(need as SupportNeed)) return false
      if (grade !== ALL_VALUE && l.grade !== grade) return false
      if (availability !== ALL_VALUE && !l.availability.includes(availability as Availability))
        return false
      return true
    })
  }, [difference, need, grade, availability])

  const hasFilters =
    difference !== ALL_VALUE ||
    need !== ALL_VALUE ||
    grade !== ALL_VALUE ||
    availability !== ALL_VALUE

  function clearFilters() {
    setDifference(ALL_VALUE)
    setNeed(ALL_VALUE)
    setGrade(ALL_VALUE)
    setAvailability(ALL_VALUE)
  }

  return (
    <>
      <PageHeader
        title="Learners"
        description="Browse learner profiles and filter by the qualities that matter most for a strong instructor match."
      />

      <section
        aria-label="Filters"
        className="mb-6 rounded-xl border border-border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="filter-difference"
            label="Learning difference"
            value={difference}
            onValueChange={setDifference}
            options={differenceOptions}
            allLabel="All differences"
          />
          <FilterSelect
            id="filter-need"
            label="Support need"
            value={need}
            onValueChange={setNeed}
            options={needOptions}
            allLabel="All needs"
          />
          <FilterSelect
            id="filter-grade"
            label="Grade level"
            value={grade}
            onValueChange={setGrade}
            options={gradeOptions}
            allLabel="All grades"
          />
          <FilterSelect
            id="filter-availability"
            label="Availability"
            value={availability}
            onValueChange={setAvailability}
            options={availabilityOptions}
            allLabel="Any time"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {learners.length} learners
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </section>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((learner) => (
            <LearnerCard key={learner.id} learner={learner} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">
            No learners match these filters. Try broadening your selection.
          </p>
        </div>
      )}
    </>
  )
}
