"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { InstructorCard } from "@/components/instructor-card"
import { ALL_VALUE, FilterSelect } from "@/components/filter-select"
import { Button } from "@/components/ui/button"
import { instructors } from "@/lib/mock-data"
import type {
  Availability,
  LearningDifference,
  SupportNeed,
  TeachingStyle,
} from "@/lib/types"

const skillOptions: SupportNeed[] = [
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

const experienceOptions: LearningDifference[] = [
  "Dyslexia",
  "Dyscalculia",
  "ADHD",
  "ASD",
  "Executive Function",
  "Reading Difficulty",
  "Writing Difficulty",
  "Math Difficulty",
]

const styleOptions: TeachingStyle[] = [
  "Structured & explicit",
  "Multisensory",
  "Visual & concrete",
  "Flexible & exploratory",
  "Calm & low-pressure",
  "Goal-oriented",
]

const availabilityOptions: Availability[] = [
  "Mornings",
  "Afternoons",
  "Evenings",
  "Weekends",
  "Flexible",
]

export default function InstructorsPage() {
  const [skill, setSkill] = useState(ALL_VALUE)
  const [experience, setExperience] = useState(ALL_VALUE)
  const [style, setStyle] = useState(ALL_VALUE)
  const [availability, setAvailability] = useState(ALL_VALUE)

  const filtered = useMemo(() => {
    return instructors.filter((i) => {
      if (skill !== ALL_VALUE && !i.skills.includes(skill as SupportNeed)) return false
      if (experience !== ALL_VALUE && !i.experienceAreas.includes(experience as LearningDifference))
        return false
      if (style !== ALL_VALUE && i.teachingStyle !== style) return false
      if (availability !== ALL_VALUE && !i.availability.includes(availability as Availability))
        return false
      return true
    })
  }, [skill, experience, style, availability])

  const hasFilters =
    skill !== ALL_VALUE ||
    experience !== ALL_VALUE ||
    style !== ALL_VALUE ||
    availability !== ALL_VALUE

  function clearFilters() {
    setSkill(ALL_VALUE)
    setExperience(ALL_VALUE)
    setStyle(ALL_VALUE)
    setAvailability(ALL_VALUE)
  }

  return (
    <>
      <PageHeader
        title="Instructors"
        description="Review instructor strengths, availability, and current caseload to understand who has room to support more learners."
      />

      <section
        aria-label="Filters"
        className="mb-6 rounded-xl border border-border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="filter-skill"
            label="Skill"
            value={skill}
            onValueChange={setSkill}
            options={skillOptions}
            allLabel="All skills"
          />
          <FilterSelect
            id="filter-experience"
            label="Experience area"
            value={experience}
            onValueChange={setExperience}
            options={experienceOptions}
            allLabel="All areas"
          />
          <FilterSelect
            id="filter-style"
            label="Teaching style"
            value={style}
            onValueChange={setStyle}
            options={styleOptions}
            allLabel="All styles"
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
            Showing {filtered.length} of {instructors.length} instructors
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
          {filtered.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">
            No instructors match these filters. Try broadening your selection.
          </p>
        </div>
      )}
    </>
  )
}
