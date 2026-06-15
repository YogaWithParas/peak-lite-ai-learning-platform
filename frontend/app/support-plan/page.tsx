"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import {
  ArrowLeft,
  Sparkles,
  Check,
  Target,
  ListChecks,
  CheckCircle2,
  Pencil,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getInstructorById, getLearnerById, learners } from "@/lib/mock-data"

function focusAreasFor(needs: string[]): string[] {
  // Derive weekly focus areas from the learner's support needs.
  const base = needs.slice(0, 3).map((n) => `Targeted practice for ${n.toLowerCase()}`)
  return base.length > 0 ? base : ["Build rapport and assess current strengths"]
}

const accommodationLibrary: Record<string, string> = {
  "Reading fluency": "Extended time for reading tasks and access to audio texts",
  "Phonological awareness": "Multisensory phonics drills with visual cue cards",
  "Number sense": "Manipulatives and number lines for concrete reasoning",
  "Focus & attention": "Scheduled movement breaks and a distraction-reduced space",
  "Task initiation": "Step-by-step checklists and a clear first action",
  Organization: "Color-coded materials and a shared weekly planner",
  "Written expression": "Graphic organizers and optional speech-to-text tools",
  "Social communication": "Predictable routines with explicit social scripts",
  "Sensory regulation": "Access to a calm corner and noise-reducing headphones",
  "Working memory": "Chunked instructions and reference sheets at hand",
}

function SupportPlanContent() {
  const params = useSearchParams()
  const learnerId = params.get("learner")
  const instructorId = params.get("instructor")
  const priority = params.get("priority") ?? "balanced"
  const mode = params.get("mode") ?? "review"
  const learner = getLearnerById(learnerId) ?? learners[0]
  const instructor = getInstructorById(instructorId)

  const defaultFocusAreas = focusAreasFor(learner.supportNeeds).join("\n")
  const defaultAccommodations = learner.supportNeeds
    .map((n) => accommodationLibrary[n])
    .filter(Boolean)
    .join("\n")

  const [notes, setNotes] = useState("")
  const [focusAreasDraft, setFocusAreasDraft] = useState(defaultFocusAreas)
  const [accommodationsDraft, setAccommodationsDraft] = useState(defaultAccommodations)
  const [approved, setApproved] = useState(false)

  const workflowStatus = approved
    ? "Approved"
    : mode === "edit"
      ? "Editing draft"
      : "Draft review"

  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <Link href="/match">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Match Center
        </Link>
      </Button>

      <PageHeader
        title="Support plan review"
        description={
          mode === "edit"
            ? "Review the draft plan, make adjustments, and approve when ready. Nothing is committed until an educator gives final approval."
            : "Review and finalize the draft plan. Nothing is committed until an educator gives final approval."
        }
      >
        <Badge
          className="border-transparent bg-accent text-accent-foreground"
          role="status"
          aria-live="polite"
        >
          <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
          Status: {workflowStatus}
        </Badge>
      </PageHeader>

      <div className="mb-6 rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">
          Current state: {workflowStatus}
        </p>
        <p className="mt-1 text-muted-foreground">
          Prototype only — edits are stored in the browser session and are not saved to a backend.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Matching priority: {priority}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Summaries */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learner summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-base font-semibold text-foreground">{learner.name}</p>
                <p className="text-muted-foreground">
                  Grade {learner.grade} · Age {learner.age}
                </p>
                <Separator className="my-1" />
                <p>
                  <span className="text-muted-foreground">Differences: </span>
                  {learner.learningDifferences.join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Needs: </span>
                  {learner.supportNeeds.join(", ")}
                </p>
                <p>
                  <span className="text-muted-foreground">Preferred style: </span>
                  {learner.preferredTeachingStyle}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructor summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                {instructor ? (
                  <>
                    <p className="text-base font-semibold text-foreground">
                      {instructor.name}
                    </p>
                    <p className="text-muted-foreground">{instructor.title}</p>
                    <Separator className="my-1" />
                    <p>
                      <span className="text-muted-foreground">Skills: </span>
                      {instructor.skills.join(", ")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Style: </span>
                      {instructor.teachingStyle}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Availability: </span>
                      {instructor.availability.join(", ")}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
                    <p className="font-medium text-foreground">
                      No instructor selected yet. Run a match to assign an instructor.
                    </p>
                    <p className="text-muted-foreground">
                      The support plan preview will populate once a match result is passed into this page.
                    </p>
                    <Button asChild variant="outline" className="w-fit">
                      <Link href="/match">Run a match</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Weekly focus areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" aria-hidden="true" />
                Weekly focus areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="weekly-focus-areas" className="text-sm font-medium">
                Weekly focus areas (one per line)
              </Label>
              <Textarea
                id="weekly-focus-areas"
                value={focusAreasDraft}
                onChange={(e) => setFocusAreasDraft(e.target.value)}
                placeholder="Add or revise focus areas..."
                rows={5}
                className="mt-2 bg-card"
              />
            </CardContent>
          </Card>

          {/* Recommended accommodations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-5 text-primary" aria-hidden="true" />
                Recommended accommodations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="recommended-accommodations" className="text-sm font-medium">
                Recommended accommodations (one per line)
              </Label>
              <Textarea
                id="recommended-accommodations"
                value={accommodationsDraft}
                onChange={(e) => setAccommodationsDraft(e.target.value)}
                placeholder="Add or revise accommodations..."
                rows={5}
                className="mt-2 bg-card"
              />
            </CardContent>
          </Card>

          {/* Educator notes */}
          <Card>
            <CardHeader>
              <CardTitle>Educator notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="educator-notes" className="text-sm font-medium">
                Educator notes
              </Label>
              <Textarea
                id="educator-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context, adjustments, or goals for this learner…"
                rows={5}
                className="mt-2 bg-card"
              />
            </CardContent>
          </Card>
        </div>

        {/* Final approval */}
        <Card className="h-fit lg:sticky lg:top-10">
          <CardHeader>
            <CardTitle>Final approval</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {approved ? (
              <div
                className="flex flex-col items-center gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-950"
                role="status"
                aria-live="polite"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="size-6" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-950">
                    Support plan approved for demo review
                  </p>
                  <p className="text-sm text-emerald-900/80">
                    {learner.name}
                    {instructor ? ` is now paired with ${instructor.name}.` : "."}
                  </p>
                  <p className="text-sm text-emerald-900/80">
                    Prototype only — no data has been saved to a backend yet.
                  </p>
                </div>
                <Button disabled className="w-full" aria-label="Support plan approved">
                  Approved
                </Button>
                <div className="flex w-full flex-col gap-3 pt-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">Return to dashboard</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/match">Run another match</Link>
                  </Button>
                  <Button
                    onClick={() => setApproved(false)}
                    variant="secondary"
                    className="w-full"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Re-open draft for editing
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  By approving, you confirm this plan reflects your professional
                  judgment. You can edit notes above before approving.
                </p>
                <Button
                  onClick={() => setApproved(true)}
                  className="w-full bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500"
                >
                  <Check className="size-4" aria-hidden="true" />
                  Approve support plan
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="w-full"
                >
                  <Link href="/match">Cancel</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function SupportPlanPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading plan…</p>}>
      <SupportPlanContent />
    </Suspense>
  )
}
