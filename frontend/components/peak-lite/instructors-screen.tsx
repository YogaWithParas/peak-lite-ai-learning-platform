import { useMemo, useState } from "react"
import { ALL_VALUE, FilterSelect } from "@/components/filter-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type ApiInstructor, type ApiMatchRecommendationDetail } from "@/lib/peak-lite-api"
import { cn } from "@/lib/utils"
import { initials } from "./format"

export function InstructorsScreen({
  instructors,
  matches,
}: {
  instructors: ApiInstructor[]
  matches: ApiMatchRecommendationDetail[]
}) {
  const [search, setSearch] = useState("")
  const [skill, setSkill] = useState(ALL_VALUE)
  const [availability, setAvailability] = useState(ALL_VALUE)

  const skillOptions = useMemo(() => Array.from(new Set(instructors.flatMap((i) => i.skills))).sort(), [instructors])
  const availabilityOptions = useMemo(
    () => Array.from(new Set(instructors.flatMap((i) => i.availability))).sort(),
    [instructors],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return instructors.filter((i) => {
      if (q && !i.full_name.toLowerCase().includes(q)) return false
      if (skill !== ALL_VALUE && !i.skills.includes(skill)) return false
      if (availability !== ALL_VALUE && !i.availability.includes(availability)) return false
      return true
    })
  }, [instructors, search, skill, availability])

  const hasFilters = search !== "" || skill !== ALL_VALUE || availability !== ALL_VALUE

  function clearFilters() {
    setSearch("")
    setSkill(ALL_VALUE)
    setAvailability(ALL_VALUE)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Instructors</h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Browse every instructor and their current caseload.
        </p>
      </div>

      <section aria-label="Filters" className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="instructor-search" className="text-xs font-medium text-muted-foreground">
              Search by name
            </label>
            <Input id="instructor-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search instructors…" />
          </div>
          <FilterSelect id="filter-skill" label="Skill" value={skill} onValueChange={setSkill} options={skillOptions} allLabel="All skills" />
          <FilterSelect
            id="filter-instructor-availability"
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No instructors match these filters. Try broadening your selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {filtered.map((ins) => {
            const caseload = matches.filter((m) => m.instructor === ins.id && m.status === "approved").length
            const pct = ins.capacity > 0 ? Math.min((caseload / ins.capacity) * 100, 100) : 100
            const full = caseload >= ins.capacity
            return (
              <Card key={ins.id}>
                <CardContent className="flex flex-col gap-3.5 pt-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials(ins.full_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold">{ins.full_name}</div>
                      <div className="text-xs text-muted-foreground">{ins.availability.join(", ")}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ins.skills.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11.5px] font-medium tracking-wide text-muted-foreground uppercase">
                      <span>Caseload</span>
                      <span>
                        {caseload}/{ins.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full", full ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
