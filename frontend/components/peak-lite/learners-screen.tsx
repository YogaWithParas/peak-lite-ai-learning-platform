import { useMemo, useState } from "react"
import { ALL_VALUE, FilterSelect } from "@/components/filter-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type ApiLearner, type ApiLearningPlan } from "@/lib/peak-lite-api"
import { initials, matchBadge, planBadge } from "./format"

export function LearnersScreen({
  learners,
  plans,
  matchStatusFor,
  actionFor,
}: {
  learners: ApiLearner[]
  plans: ApiLearningPlan[]
  matchStatusFor: (id: number) => { matched: boolean; instructorName: string | null }
  actionFor: (id: number) => { label: string; onClick: () => void }
}) {
  const [search, setSearch] = useState("")
  const [need, setNeed] = useState(ALL_VALUE)
  const [grade, setGrade] = useState(ALL_VALUE)
  const [availability, setAvailability] = useState(ALL_VALUE)

  // Options come from the real seeded data, not a hardcoded list -- the
  // backend's vocabulary isn't guaranteed to match any fixed enum.
  const needOptions = useMemo(
    () => Array.from(new Set(learners.flatMap((l) => l.learning_needs))).sort(),
    [learners],
  )
  const gradeOptions = useMemo(() => Array.from(new Set(learners.map((l) => l.grade_level))).sort(), [learners])
  const availabilityOptions = useMemo(
    () => Array.from(new Set(learners.flatMap((l) => l.availability))).sort(),
    [learners],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return learners.filter((l) => {
      if (q && !l.full_name.toLowerCase().includes(q)) return false
      if (need !== ALL_VALUE && !l.learning_needs.includes(need)) return false
      if (grade !== ALL_VALUE && l.grade_level !== grade) return false
      if (availability !== ALL_VALUE && !l.availability.includes(availability)) return false
      return true
    })
  }, [learners, search, need, grade, availability])

  const hasFilters = search !== "" || need !== ALL_VALUE || grade !== ALL_VALUE || availability !== ALL_VALUE

  function clearFilters() {
    setSearch("")
    setNeed(ALL_VALUE)
    setGrade(ALL_VALUE)
    setAvailability(ALL_VALUE)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Learners</h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Browse every learner and filter by the qualities that matter most for a strong match.
        </p>
      </div>

      <section aria-label="Filters" className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="learner-search" className="text-xs font-medium text-muted-foreground">
              Search by name
            </label>
            <Input id="learner-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learners…" />
          </div>
          <FilterSelect id="filter-need" label="Learning need" value={need} onValueChange={setNeed} options={needOptions} allLabel="All needs" />
          <FilterSelect id="filter-grade" label="Grade level" value={grade} onValueChange={setGrade} options={gradeOptions} allLabel="All grades" />
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No learners match these filters. Try broadening your selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((l) => {
            const { matched, instructorName } = matchStatusFor(l.id)
            const plan = plans.find((p) => p.learner === l.id) ?? null
            const mb = matchBadge(matched)
            const pb = planBadge(plan)
            const action = actionFor(l.id)
            return (
              <Card key={l.id}>
                <CardContent className="flex flex-col gap-3.5 pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials(l.full_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{l.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.grade_level} · Instructor: {instructorName ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {l.learning_needs.map((n) => (
                      <Badge key={n} variant="secondary">
                        {n}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={mb.variant}>{mb.label}</Badge>
                    <Badge variant={pb.variant}>{pb.label}</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-auto" onClick={action.onClick}>
                    {action.label}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
