import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type ApiLearner, type ApiMatchRecommendationDetail } from "@/lib/peak-lite-api"
import { initials } from "./format"

export function MatchCenterScreen({
  learners,
  matches,
  onOpenMatch,
}: {
  learners: ApiLearner[]
  matches: ApiMatchRecommendationDetail[]
  onOpenMatch: (learnerId: number) => void
}) {
  // A learner needs a fresh match if they have no pending or approved
  // candidate -- rejected-only or never-matched learners both count.
  const needsMatch = learners.filter(
    (l) => !matches.some((m) => m.learner === l.id && (m.status === "pending" || m.status === "approved")),
  )

  // A single "Run Match" creates up to 3 candidate rows for the same learner --
  // dedupe to one row per learner (matches is already score-sorted, so the
  // first one seen per learner is the top-ranked candidate).
  const seen = new Set<number>()
  const pendingReview: { learner: ApiLearner; match: ApiMatchRecommendationDetail }[] = []
  for (const m of matches) {
    if (m.status !== "pending" || seen.has(m.learner)) continue
    const learner = learners.find((l) => l.id === m.learner)
    if (!learner) continue
    seen.add(m.learner)
    pendingReview.push({ learner, match: m })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Match Center</h1>
        <p className="mt-1.5 text-[14.5px] text-muted-foreground">
          Learners who need a match, and matches already run that are waiting on your decision.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <h2 className="mb-3 text-[17px] font-semibold">
            Needs a match <span className="text-sm font-normal text-muted-foreground">({needsMatch.length})</span>
          </h2>
          {needsMatch.length === 0 ? (
            <p className="text-sm text-muted-foreground">Every learner has a match in progress or approved.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {needsMatch.map((l) => (
                <Card key={l.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(l.full_name)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{l.full_name}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {l.learning_needs.map((n) => (
                            <Badge key={n} variant="secondary">
                              {n}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onOpenMatch(l.id)}>
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      Run Match
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-[17px] font-semibold">
            Pending review{" "}
            <span className="text-sm font-normal text-muted-foreground">({pendingReview.length})</span>
          </h2>
          {pendingReview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches awaiting a decision.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingReview.map(({ learner, match }) => (
                <Card key={learner.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(learner.full_name)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{learner.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Suggested: {match.instructor_name} · score {match.score}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onOpenMatch(learner.id)}>
                      Review
                    </Button>
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
