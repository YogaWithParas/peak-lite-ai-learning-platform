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
  const learner =
    getLearnerById(params.get("learner")) ?? learners[0]
  const instructor = getInstructorById(params.get("instructor"))
  const [notes, setNotes] = useState("")
  const [approved, setApproved] = useState(false)

  const focusAreas = focusAreasFor(learner.supportNeeds)
  const accommodations = learner.supportNeeds
    .map((n) => accommodationLibrary[n])
    .filter(Boolean)

  return (
    <>
      <Button
        render={<Link href="/match" />}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Match Center
      </Button>

      <PageHeader title="Support plan review" description="Review and finalize the draft plan. Nothing is committed until an educator gives final approval.">
        <Badge className="border-transparent bg-accent text-accent-foreground">
          <Sparkles className="mr-1 size-3.5" aria-hidden="true" />
          AI draft
        </Badge>
      </PageHeader>

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
                  <p className="text-muted-foreground">
                    No instructor assigned. Run a match to populate this plan.
                  </p>
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
              <ul className="flex flex-col gap-2">
                {focusAreas.map((area) => (
                  <li key={area} className="flex items-start gap-2 text-sm leading-relaxed">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-foreground">{area}</span>
                  </li>
                ))}
              </ul>
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
              <ul className="flex flex-col gap-2">
                {accommodations.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm leading-relaxed">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Educator notes */}
          <Card>
            <CardHeader>
              <CardTitle>Educator notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="educator-notes" className="sr-only">
                Educator notes
              </Label>
              <Textarea
                id="educator-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context, adjustments, or goals for this learner…"
                rows={5}
                className="bg-card"
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
                className="flex flex-col items-center gap-3 rounded-lg bg-secondary p-6 text-center"
                role="status"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-6" aria-hidden="true" />
                </span>
                <p className="font-medium text-foreground">Support plan approved</p>
                <p className="text-sm text-muted-foreground">
                  {learner.name}
                  {instructor ? ` is now paired with ${instructor.name}.` : "."}
                </p>
                <Button
                  render={<Link href="/" />}
                  variant="outline"
                  size="sm"
                  className="mt-1"
                >
                  Return to dashboard
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  By approving, you confirm this plan reflects your professional
                  judgment. You can edit notes above before approving.
                </p>
                <Button onClick={() => setApproved(true)} className="w-full">
                  <Check className="size-4" aria-hidden="true" />
                  Approve support plan
                </Button>
                <Button
                  render={<Link href="/match" />}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
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
