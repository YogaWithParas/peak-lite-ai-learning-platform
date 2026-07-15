import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ApiLearner, type ApiMatchRecommendationDetail } from "@/lib/peak-lite-api"
import { SCORE_ROWS } from "./constants"
import { initials } from "./format"

export function MatchScreen({
  learner,
  candidates,
  candidateIndex,
  setCandidateIndex,
  running,
  actionLoading,
  error,
  onApprove,
  onReject,
  onBack,
}: {
  learner: ApiLearner | null
  candidates: ApiMatchRecommendationDetail[]
  candidateIndex: number
  setCandidateIndex: (i: number) => void
  running: boolean
  actionLoading: boolean
  error: string | null
  onApprove: (id: number) => void
  onReject: (id: number) => void
  onBack: () => void
}) {
  const candidate = candidates[candidateIndex] ?? null
  const next = candidates[candidateIndex + 1] ?? null

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Match result</h1>
        <p className="mt-1.5 max-w-xl text-[14.5px] text-muted-foreground">
          Recommended instructor for {learner?.full_name ?? "this learner"} (needs:{" "}
          {learner?.learning_needs.join(", ") ?? "—"}). Review the reasoning below, then approve or
          reject.
        </p>
      </div>

      {running ? (
        <p className="text-sm text-muted-foreground">Calling POST /api/match-recommendations/…</p>
      ) : !candidate ? (
        <p className="text-sm text-muted-foreground">
          No suitable instructors found — none matched on skills, or all are at capacity.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-5">
            <Card className="border-primary">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-5">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                    {initials(candidate.instructor_name)}
                  </span>
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      Recommended
                    </Badge>
                    <div className="text-lg font-semibold">{candidate.instructor_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold tracking-tight">{candidate.score}</div>
                  <div className="text-xs text-muted-foreground">Match score / 100</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15.5px]">Score breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                {SCORE_ROWS.map((row) => {
                  const value = candidate.score_breakdown[row.key]
                  const pct = row.max > 0 ? (value / row.max) * 100 : 0
                  return (
                    <div key={row.key}>
                      <div className="mb-1.5 flex justify-between text-[13.5px]">
                        <span>{row.label}</span>
                        <span className="font-medium text-muted-foreground">
                          {value} / {row.max}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="bg-secondary">
              <CardContent className="pt-5">
                <h2 className="mb-2.5 text-[15.5px] font-semibold">Why this match</h2>
                <p className="text-[14.5px] leading-relaxed">{candidate.reason}</p>
                <p className="mt-3.5 text-xs text-muted-foreground">
                  AI-generated explanation. Please verify against your own knowledge of the learner.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-[15.5px]">Decision</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {candidate.status === "pending" ? (
                  <>
                    <Button disabled={actionLoading} onClick={() => onApprove(candidate.id)}>
                      <Check className="size-4" aria-hidden="true" />
                      Approve match
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={actionLoading}
                      onClick={() => onReject(candidate.id)}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Reject &amp; start over
                    </Button>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Nothing is finalized automatically — this only takes effect once you approve
                      it.
                    </p>
                  </>
                ) : (
                  <Badge variant={candidate.status === "approved" ? "success" : "destructive"}>
                    {candidate.status}
                  </Badge>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15.5px]">Alternative instructor</CardTitle>
              </CardHeader>
              <CardContent>
                {next ? (
                  <button
                    type="button"
                    onClick={() => setCandidateIndex(candidateIndex + 1)}
                    className="flex w-full items-center justify-between gap-3 py-2 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(next.instructor_name)}
                      </span>
                      <span className="text-[13.5px] font-medium">{next.instructor_name}</span>
                    </div>
                    <span className="text-sm font-semibold">{next.score}</span>
                  </button>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    No further alternatives — this is the only remaining candidate.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
