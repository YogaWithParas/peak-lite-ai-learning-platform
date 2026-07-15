import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type ApiLearner, type ApiLearningPlan } from "@/lib/peak-lite-api"
import { initials } from "./format"

export function LearningPlansScreen({
  learners,
  plans,
  matchStatusFor,
  onOpenPlan,
}: {
  learners: ApiLearner[]
  plans: ApiLearningPlan[]
  matchStatusFor: (id: number) => { matched: boolean; instructorName: string | null }
  onOpenPlan: (learnerId: number) => void
}) {
  // A plan only makes sense once a learner is matched -- mirrors the
  // Run Match -> Create Plan -> Review Plan -> View Plan sequencing used
  // everywhere else in the app.
  const needsPlan = learners.filter(
    (l) => matchStatusFor(l.id).matched && !plans.some((p) => p.learner === l.id),
  )

  // Rejected plans have nowhere else to land -- fold them into "draft
  // pending" too, since PlanScreen itself treats anything non-approved as
  // an editable draft.
  const draftPending = plans.filter((p) => p.status === "draft" || p.status === "rejected")
  const approved = plans.filter((p) => p.status === "approved")

  function learnerName(learnerId: number) {
    return learners.find((l) => l.id === learnerId)?.full_name ?? "Unknown learner"
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Learning Plans</h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Matched learners waiting on a plan, drafts awaiting review, and already-approved plans.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-[17px] font-semibold">
            Needs a plan <span className="text-sm font-normal text-muted-foreground">({needsPlan.length})</span>
          </h2>
          {needsPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every matched learner has a plan started.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {needsPlan.map((l) => (
                <Card key={l.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(l.full_name)}
                      </span>
                      <div className="text-sm font-semibold">{l.full_name}</div>
                    </div>
                    <Button size="sm" onClick={() => onOpenPlan(l.id)}>
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Draft Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[17px] font-semibold">
            Draft pending review{" "}
            <span className="text-sm font-normal text-muted-foreground">({draftPending.length})</span>
          </h2>
          {draftPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drafts waiting on a decision.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {draftPending.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(learnerName(p.learner))}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{learnerName(p.learner)}</div>
                        {p.status === "rejected" && (
                          <Badge variant="destructive" className="mt-0.5">
                            Previously rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onOpenPlan(p.learner)}>
                      Review
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[17px] font-semibold">
            Approved <span className="text-sm font-normal text-muted-foreground">({approved.length})</span>
          </h2>
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved plans yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {approved.map((p) => (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(learnerName(p.learner))}
                      </span>
                      <div className="text-sm font-semibold">{learnerName(p.learner)}</div>
                    </div>
                    <Badge variant="success">Approved ✓</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
