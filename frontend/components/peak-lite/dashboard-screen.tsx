import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  type ApiInstructor,
  type ApiLearner,
  type ApiLearningPlan,
  type ApiMatchRecommendationDetail,
} from "@/lib/peak-lite-api"
import { cn } from "@/lib/utils"
import { type Role, type Screen } from "./constants"
import { initials, matchBadge, planBadge } from "./format"
import { StatCard } from "./stat-card"

export function DashboardScreen({
  role,
  learners,
  instructors,
  matches,
  plans,
  matchStatusFor,
  instructorSelectedId,
  setInstructorSelectedId,
  onNavigate,
  onOpenMatch,
  onOpenPlan,
}: {
  role: Role | null
  learners: ApiLearner[]
  instructors: ApiInstructor[]
  matches: ApiMatchRecommendationDetail[]
  plans: ApiLearningPlan[]
  matchStatusFor: (id: number) => { matched: boolean; instructorName: string | null }
  instructorSelectedId: number | null
  setInstructorSelectedId: (id: number) => void
  onNavigate: (screen: Screen) => void
  onOpenMatch: (learnerId: number) => void
  onOpenPlan: (learnerId: number) => void
}) {
  const isAdmin = role === "admin"
  const isCMOperator = role === "case_manager" || role === "admin"
  const isInstructor = role === "instructor"
  const isFamily = role === "family"

  const title =
    role === "admin"
      ? "Admin Dashboard"
      : role === "case_manager"
        ? "Case Manager Dashboard"
        : role === "instructor"
          ? "My Learners"
          : learners[0]
            ? `${learners[0].full_name}'s Dashboard`
            : "Dashboard"
  const subtitle =
    role === "admin"
      ? "A calm overview of your matching program. Every recommendation is a starting point — educators stay in control of final decisions."
      : role === "case_manager"
        ? "A calm overview. Use the sidebar to browse learners, instructors, matches, and plans."
        : role === "instructor"
          ? "Learners currently matched to you — read only."
          : "Your learner's current match and learning plan status."

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-[26px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
      </div>

      {isCMOperator && (
        <>
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Learners" value={learners.length} />
            <StatCard label="Total Instructors" value={instructors.length} />
            <StatCard label="Pending Matches" value={matches.filter((m) => m.status === "pending").length} tone="accent" />
            <StatCard label="Approved Plans" value={plans.filter((p) => p.status === "approved").length} tone="success" />
          </div>

          <div className="mb-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <NeedsAttentionCard
              title="Needs a match"
              emptyText="Every learner has a match in progress or approved."
              items={learners
                .filter((l) => !matches.some((m) => m.learner === l.id && (m.status === "pending" || m.status === "approved")))
                .slice(0, 5)
                .map((l) => ({ id: l.id, name: l.full_name, onClick: () => onOpenMatch(l.id) }))}
              onViewAll={() => onNavigate("matchCenter")}
            />
            <NeedsAttentionCard
              title="Plans awaiting review"
              emptyText="No drafts waiting on a decision."
              items={plans
                .filter((p) => p.status === "draft" || p.status === "rejected")
                .slice(0, 5)
                .map((p) => {
                  const learner = learners.find((l) => l.id === p.learner)
                  return { id: p.id, name: learner?.full_name ?? "Unknown learner", onClick: () => onOpenPlan(p.learner) }
                })}
              onViewAll={() => onNavigate("learningPlans")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ViewAllLink label="Browse Learners" onClick={() => onNavigate("learners")} />
            <ViewAllLink label="Browse Instructors" onClick={() => onNavigate("instructors")} />
            {isAdmin && <ViewAllLink label="View Accounts" onClick={() => onNavigate("accounts")} />}
          </div>
        </>
      )}

      {isInstructor && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Learners</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {learners.length === 0 && (
                <p className="text-sm text-muted-foreground">No learners assigned yet.</p>
              )}
              {learners.map((l) => {
                const { matched } = matchStatusFor(l.id)
                const plan = plans.find((p) => p.learner === l.id) ?? null
                const mb = matchBadge(matched)
                const pb = planBadge(plan)
                const selected = l.id === instructorSelectedId
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setInstructorSelectedId(l.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-left",
                      selected ? "bg-secondary" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(l.full_name)}
                      </span>
                      <span className="text-sm font-medium">{l.full_name}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant={mb.variant}>{mb.label}</Badge>
                      <Badge variant={pb.variant}>{pb.label}</Badge>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {(() => {
            const selected = learners.find((l) => l.id === instructorSelectedId) ?? learners[0] ?? null
            if (!selected) return null
            const plan = plans.find((p) => p.learner === selected.id) ?? null
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{selected.full_name} — Learning Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {plan?.status === "approved" ? (
                    <>
                      <Badge variant="success" className="mb-3">
                        Approved ✓
                      </Badge>
                      <p className="text-sm leading-relaxed">{plan.approved_plan}</p>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-accent-foreground/30 bg-accent p-4">
                      <Badge variant="secondary" className="mb-2">
                        Pending Review
                      </Badge>
                      <p className="text-sm leading-relaxed text-accent-foreground">
                        This learning plan is still being reviewed by the case manager and hasn&apos;t
                        been approved yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      {isFamily &&
        (() => {
          const learner = learners[0] ?? null
          if (!learner) {
            return <p className="text-sm text-muted-foreground">No learner linked to your account yet.</p>
          }
          const { matched, instructorName } = matchStatusFor(learner.id)
          const plan = plans.find((p) => p.learner === learner.id) ?? null
          const mb = matchBadge(matched)
          return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Instructor Match</CardTitle>
                  <p className="text-xs text-muted-foreground">For {learner.full_name}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-2.5 text-lg font-semibold">{instructorName ?? "Not yet matched"}</div>
                  <Badge variant={mb.variant}>{mb.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Learning Plan</CardTitle>
                  <p className="text-xs text-muted-foreground">For {learner.full_name}</p>
                </CardHeader>
                <CardContent>
                  {plan?.status === "approved" ? (
                    <>
                      <Badge variant="success" className="mb-3">
                        Approved ✓
                      </Badge>
                      <p className="text-sm leading-relaxed">{plan.approved_plan}</p>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-accent-foreground/30 bg-accent p-4">
                      <p className="text-sm leading-relaxed text-accent-foreground">
                        Your case manager and instructor are finalizing this plan. You&apos;ll be
                        notified once it&apos;s approved.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        })()}
    </div>
  )
}

function NeedsAttentionCard({
  title,
  emptyText,
  items,
  onViewAll,
}: {
  title: string
  emptyText: string
  items: { id: number; name: string; onClick: () => void }[]
  onViewAll: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <button type="button" onClick={onViewAll} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all
          <ArrowRight className="size-3" aria-hidden="true" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="flex items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{item.name}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function ViewAllLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted"
    >
      {label}
      <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
