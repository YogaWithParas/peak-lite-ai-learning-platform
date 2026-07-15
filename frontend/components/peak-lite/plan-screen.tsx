import { Check, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type ApiLearner, type ApiLearningPlan } from "@/lib/peak-lite-api"

export function PlanScreen({
  learner,
  plan,
  approvedInstructorName,
  draftText,
  setDraftText,
  loading,
  error,
  onCreate,
  onApprove,
  onReject,
  onBack,
}: {
  learner: ApiLearner | null
  plan: ApiLearningPlan | null
  approvedInstructorName: string | null
  draftText: string
  setDraftText: (v: string) => void
  loading: boolean
  error: string | null
  onCreate: () => void
  onApprove: (planId: number) => void
  onReject: (planId: number) => void
  onBack: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Learning plan review</h1>
          <p className="mt-1.5 max-w-lg text-[14.5px] text-muted-foreground">
            Review and finalize the draft plan. Nothing is committed until you give final approval.
          </p>
        </div>
        {plan && (
          <Badge variant={plan.status === "approved" ? "success" : "secondary"}>
            {plan.status === "approved" ? "Approved" : "Draft review"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-5">
                <h2 className="mb-2.5 text-sm font-semibold">Learner summary</h2>
                <div className="mb-1 text-[15px] font-semibold">{learner?.full_name}</div>
                <div className="text-[13px] text-muted-foreground">
                  Needs: {learner?.learning_needs.join(", ") ?? "—"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <h2 className="mb-2.5 text-sm font-semibold">Instructor summary</h2>
                <div className="text-[15px] font-semibold">{approvedInstructorName ?? "Not yet matched"}</div>
              </CardContent>
            </Card>
          </div>

          {!plan ? (
            <Button variant="outline" disabled={loading} onClick={onCreate} className="self-start">
              <Sparkles className="size-4" aria-hidden="true" />
              {loading ? "Drafting…" : "Draft AI learning plan"}
            </Button>
          ) : plan.status === "approved" ? (
            <Card>
              <CardContent className="pt-5">
                <p className="text-[14px] leading-relaxed">{plan.approved_plan}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col gap-3 pt-5">
                <Label htmlFor="plan-draft">AI draft (editable before approval)</Label>
                <Textarea
                  id="plan-draft"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={6}
                  className="bg-card"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardContent className="pt-5">
            {plan?.status === "approved" ? (
              <div className="flex flex-col items-center gap-3.5 rounded-lg bg-secondary p-6 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  ✓
                </span>
                <div>
                  <p className="font-semibold">Plan approved</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {learner?.full_name} is now paired with {approvedInstructorName ?? "an instructor"}.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={onBack}>
                  Back
                </Button>
              </div>
            ) : plan ? (
              <>
                <h2 className="mb-2.5 text-[15.5px] font-semibold">Final approval</h2>
                <p className="mb-4 text-[13.5px] leading-relaxed text-muted-foreground">
                  By approving, you confirm this plan reflects your professional judgment. You can
                  still edit the text above first.
                </p>
                <div className="flex flex-col gap-2.5">
                  <Button disabled={loading} onClick={() => onApprove(plan.id)}>
                    <Check className="size-4" aria-hidden="true" />
                    Approve support plan
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={loading}
                    onClick={() => onReject(plan.id)}
                  >
                    <X className="size-4" aria-hidden="true" />
                    Reject
                  </Button>
                </div>
                {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Draft a plan to review it here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
