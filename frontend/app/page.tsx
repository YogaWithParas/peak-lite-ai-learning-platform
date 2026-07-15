"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { Check, LogOut, Loader2, Sparkles, WifiOff, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  type ApiAccount,
  type ApiInstructor,
  type ApiLearner,
  type ApiLearningPlan,
  type ApiMatchRecommendationDetail,
  type Me,
  approveLearningPlan,
  approveMatchRecommendation,
  createLearningPlan,
  createMatchRecommendations,
  getMe,
  getStoredToken,
  listAccounts,
  listInstructors,
  listLearners,
  listLearningPlans,
  listMatchRecommendations,
  login,
  logout,
  rejectLearningPlan,
  rejectMatchRecommendation,
} from "@/lib/peak-lite-api"

type Status = "checking" | "signed-out" | "signed-in" | "unreachable"
type Screen = "dashboard" | "match" | "plan"
type Role = "admin" | "case_manager" | "instructor" | "family"

const DEMO_PASSWORD = "peaklite-demo-2026"
const DEMO_ACCOUNTS: { role: Role; label: string; username: string }[] = [
  { role: "admin", label: "Admin", username: "admin_demo" },
  { role: "case_manager", label: "Case Manager", username: "casemanager_demo" },
  { role: "instructor", label: "Instructor", username: "jordan_lee" },
  { role: "family", label: "Family", username: "family_chen" },
]
const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  case_manager: "Case Manager",
  instructor: "Instructor",
  family: "Family Member",
}
const NAV_ITEMS: Record<Role, string[]> = {
  admin: ["Dashboard", "Learners", "Instructors", "Match Center", "Learning Plans", "Accounts"],
  case_manager: ["Dashboard", "Learners", "Instructors", "Match Center", "Learning Plans"],
  instructor: ["My Learners"],
  family: ["My Learner"],
}
// Mirrors backend/core/matching.py's MAX_SKILL_SCORE / MAX_AVAILABILITY_SCORE / MAX_CAPACITY_SCORE.
const SCORE_ROWS: { key: "skill_score" | "availability_score" | "capacity_score"; label: string; max: number }[] = [
  { key: "skill_score", label: "Skill match", max: 60 },
  { key: "availability_score", label: "Availability match", max: 20 },
  { key: "capacity_score", label: "Capacity headroom", max: 20 },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function matchBadge(matched: boolean) {
  return matched
    ? { label: "Matched", variant: "success" as const }
    : { label: "Unmatched", variant: "outline" as const }
}

function planBadge(plan: ApiLearningPlan | null) {
  if (!plan) return { label: "No Plan", variant: "outline" as const }
  if (plan.status === "approved") return { label: "Approved ✓", variant: "success" as const }
  if (plan.status === "rejected") return { label: "Rejected", variant: "destructive" as const }
  return { label: "AI Draft — Pending Review", variant: "secondary" as const }
}

export default function HomePage() {
  const [status, setStatus] = useState<Status>("checking")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [me, setMe] = useState<Me | null>(null)

  const [screen, setScreen] = useState<Screen>("dashboard")
  const [activeLearnerId, setActiveLearnerId] = useState<number | null>(null)

  const [learners, setLearners] = useState<ApiLearner[]>([])
  const [instructors, setInstructors] = useState<ApiInstructor[]>([])
  const [matches, setMatches] = useState<ApiMatchRecommendationDetail[]>([])
  const [plans, setPlans] = useState<ApiLearningPlan[]>([])
  const [accounts, setAccounts] = useState<ApiAccount[]>([])

  const [matchCandidateIndex, setMatchCandidateIndex] = useState(0)
  const [matchActionLoading, setMatchActionLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [runningMatch, setRunningMatch] = useState(false)

  const [planDraftText, setPlanDraftText] = useState("")
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  const [instructorSelectedId, setInstructorSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (getStoredToken()) {
      void loadEverything()
    } else {
      setStatus("signed-out")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadEverything() {
    try {
      const meResult = await getMe()
      setMe(meResult)

      const [learnersData, matchesData, plansData] = await Promise.all([
        listLearners(),
        listMatchRecommendations(),
        listLearningPlans(),
      ])
      setLearners(learnersData)
      setMatches(matchesData)
      setPlans(plansData)
      setInstructorSelectedId((prev) => prev ?? learnersData[0]?.id ?? null)

      if (meResult.role === "admin" || meResult.role === "case_manager") {
        setInstructors(await listInstructors())
      }
      if (meResult.role === "admin") {
        setAccounts(await listAccounts())
      }
      setStatus("signed-in")
    } catch (err) {
      logout()
      setStatus(err instanceof TypeError ? "unreachable" : "signed-out")
    }
  }

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSigningIn(true)
    setAuthError(null)
    try {
      await login(username, password)
      await loadEverything()
    } catch (err) {
      if (err instanceof TypeError) {
        setStatus("unreachable")
      } else {
        setAuthError("Sign in failed — check the username and password.")
      }
    } finally {
      setSigningIn(false)
    }
  }

  function fillDemoCredentials(demoUsername: string) {
    setUsername(demoUsername)
    setPassword(DEMO_PASSWORD)
    setAuthError(null)
  }

  function handleSignOut() {
    logout()
    setMe(null)
    setLearners([])
    setInstructors([])
    setMatches([])
    setPlans([])
    setAccounts([])
    setScreen("dashboard")
    setActiveLearnerId(null)
    setStatus("signed-out")
  }

  async function refreshMatchesAndPlans() {
    const [matchesData, plansData] = await Promise.all([listMatchRecommendations(), listLearningPlans()])
    setMatches(matchesData)
    setPlans(plansData)
  }

  function goDashboard() {
    setScreen("dashboard")
  }

  function openMatch(learnerId: number) {
    setActiveLearnerId(learnerId)
    setMatchCandidateIndex(0)
    setMatchError(null)
    setScreen("match")
    if (!matches.some((m) => m.learner === learnerId)) {
      void runMatch(learnerId)
    }
  }

  async function runMatch(learnerId: number) {
    setRunningMatch(true)
    setMatchError(null)
    try {
      await createMatchRecommendations(learnerId)
      await refreshMatchesAndPlans()
      setMatchCandidateIndex(0)
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Match request failed.")
    } finally {
      setRunningMatch(false)
    }
  }

  async function handleApproveMatch(id: number) {
    setMatchActionLoading(true)
    setMatchError(null)
    try {
      await approveMatchRecommendation(id)
      await refreshMatchesAndPlans()
      setScreen("dashboard")
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setMatchActionLoading(false)
    }
  }

  async function handleRejectMatch(id: number) {
    setMatchActionLoading(true)
    setMatchError(null)
    try {
      await rejectMatchRecommendation(id)
      await refreshMatchesAndPlans()
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Reject failed.")
    } finally {
      setMatchActionLoading(false)
    }
  }

  function openPlan(learnerId: number) {
    setActiveLearnerId(learnerId)
    setPlanError(null)
    setScreen("plan")
    const existing = plans.find((p) => p.learner === learnerId)
    setPlanDraftText(existing ? existing.approved_plan || existing.ai_draft : "")
  }

  async function handleCreatePlan(learnerId: number) {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const created = await createLearningPlan(learnerId)
      setPlans((prev) => [...prev, created])
      setPlanDraftText(created.ai_draft)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Drafting the plan failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleApprovePlan(planId: number) {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const updated = await approveLearningPlan(planId, planDraftText)
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
      setScreen("dashboard")
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleRejectPlan(planId: number) {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const updated = await rejectLearningPlan(planId)
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
      setScreen("dashboard")
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Reject failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  const role = (me?.role ?? null) as Role | null
  const isAdmin = role === "admin"
  const isCMOperator = role === "case_manager" || role === "admin"
  const isInstructor = role === "instructor"
  const isFamily = role === "family"

  function matchStatusFor(learnerId: number) {
    const learnerMatches = matches.filter((m) => m.learner === learnerId)
    const approved = learnerMatches.find((m) => m.status === "approved")
    return { matched: !!approved, instructorName: approved?.instructor_name ?? null }
  }

  function actionForLearner(learnerId: number) {
    const { matched } = matchStatusFor(learnerId)
    const plan = plans.find((p) => p.learner === learnerId) ?? null
    if (!matched) return { label: "Run Match", onClick: () => openMatch(learnerId) }
    if (!plan) return { label: "Create Plan", onClick: () => openPlan(learnerId) }
    if (plan.status === "draft") return { label: "Review Plan", onClick: () => openPlan(learnerId) }
    return { label: "View Plan", onClick: () => openPlan(learnerId) }
  }

  // ---------------------------------------------------------------- render

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (status !== "signed-in") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <CardTitle className="text-xl">PEAK-Lite</CardTitle>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Matching learners with volunteer instructors. Every AI-suggested match or plan is
              reviewed by a human before it&apos;s final.
            </p>
          </CardHeader>
          <CardContent>
            {status === "unreachable" && (
              <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  Can&apos;t reach the backend right now. On the free tier it can take ~30-50s to
                  wake from idle — try again in a moment.
                </p>
              </div>
            )}
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {authError && <p className="text-sm text-destructive">{authError}</p>}

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview mode — fill in a real seeded login
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <Button
                      key={acc.role}
                      type="button"
                      size="sm"
                      variant={username === acc.username ? "default" : "outline"}
                      onClick={() => fillDemoCredentials(acc.username)}
                    >
                      {acc.label}
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Fills the fields with a real seeded account — you still sign in for real.
                </p>
              </div>

              <Button type="submit" disabled={signingIn || !username || !password}>
                {signingIn && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {signingIn ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-sidebar-foreground">PEAK-Lite</span>
              <span className="text-xs text-muted-foreground">Learner matching</span>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {role &&
            NAV_ITEMS[role].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={i === 0 ? goDashboard : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  i === 0 && screen === "dashboard"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : i === 0
                      ? "text-sidebar-foreground hover:bg-sidebar-accent"
                      : "cursor-default text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
        </nav>

        <div className="flex flex-col gap-2 rounded-lg bg-sidebar-accent p-3 text-xs leading-relaxed text-muted-foreground">
          <span>Real data from PostgreSQL. Every AI suggestion needs human approval.</span>
          <Link href="/learners" className="text-primary hover:underline">
            View original prototype ↗
          </Link>
        </div>
      </aside>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-6 flex items-center justify-end gap-3">
            {role && (
              <span className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>

          {screen === "dashboard" && (
            <DashboardScreen
              role={role}
              learners={learners}
              instructors={instructors}
              matches={matches}
              plans={plans}
              accounts={accounts}
              actionForLearner={actionForLearner}
              matchStatusFor={matchStatusFor}
              instructorSelectedId={instructorSelectedId}
              setInstructorSelectedId={setInstructorSelectedId}
            />
          )}

          {screen === "match" && activeLearnerId !== null && (
            <MatchScreen
              learner={learners.find((l) => l.id === activeLearnerId) ?? null}
              candidates={matches.filter((m) => m.learner === activeLearnerId)}
              candidateIndex={matchCandidateIndex}
              setCandidateIndex={setMatchCandidateIndex}
              running={runningMatch}
              actionLoading={matchActionLoading}
              error={matchError}
              onApprove={handleApproveMatch}
              onReject={handleRejectMatch}
              onBack={goDashboard}
            />
          )}

          {screen === "plan" && activeLearnerId !== null && (
            <PlanScreen
              learner={learners.find((l) => l.id === activeLearnerId) ?? null}
              plan={plans.find((p) => p.learner === activeLearnerId) ?? null}
              approvedInstructorName={matchStatusFor(activeLearnerId).instructorName}
              draftText={planDraftText}
              setDraftText={setPlanDraftText}
              loading={planLoading}
              error={planError}
              onCreate={() => handleCreatePlan(activeLearnerId)}
              onApprove={(planId) => handleApprovePlan(planId)}
              onReject={(planId) => handleRejectPlan(planId)}
              onBack={goDashboard}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ------------------------------------------------------------- Dashboard

function DashboardScreen({
  role,
  learners,
  instructors,
  matches,
  plans,
  accounts,
  actionForLearner,
  matchStatusFor,
  instructorSelectedId,
  setInstructorSelectedId,
}: {
  role: Role | null
  learners: ApiLearner[]
  instructors: ApiInstructor[]
  matches: ApiMatchRecommendationDetail[]
  plans: ApiLearningPlan[]
  accounts: ApiAccount[]
  actionForLearner: (id: number) => { label: string; onClick: () => void }
  matchStatusFor: (id: number) => { matched: boolean; instructorName: string | null }
  instructorSelectedId: number | null
  setInstructorSelectedId: (id: number) => void
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
        ? "Manage learners, instructors, matches, and learning plans."
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

      {isAdmin && (
        <>
          <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Learners" value={learners.length} />
            <StatCard label="Total Instructors" value={instructors.length} />
            <StatCard label="Pending Matches" value={matches.filter((m) => m.status === "pending").length} tone="accent" />
            <StatCard label="Approved Plans" value={plans.filter((p) => p.status === "approved").length} tone="success" />
          </div>

          <Card className="mb-7">
            <CardHeader>
              <CardTitle className="text-base">Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 border-b border-border pb-2 text-[12.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                <div>Username</div>
                <div>Role</div>
              </div>
              {accounts.map((a) => (
                <div key={a.id} className="grid grid-cols-2 gap-2 border-b border-border py-3 text-sm last:border-0">
                  <div className="font-medium text-foreground">{a.username}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{a.role ?? "—"}</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {isCMOperator && (
        <>
          <h2 className="mb-3 text-[17px] font-semibold">Learners</h2>
          <div className="mb-8 grid grid-cols-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {learners.map((l) => {
              const { matched, instructorName } = matchStatusFor(l.id)
              const plan = plans.find((p) => p.learner === l.id) ?? null
              const mb = matchBadge(matched)
              const pb = planBadge(plan)
              const action = actionForLearner(l.id)
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
                          Instructor: {instructorName ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {l.learning_needs.map((need) => (
                        <Badge key={need} variant="secondary">
                          {need}
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

          <h2 className="mb-3 text-[17px] font-semibold">Instructors</h2>
          <div className="grid grid-cols-1 gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {instructors.map((ins) => {
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

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "accent" | "success" }) {
  const bg = tone === "accent" ? "bg-accent" : tone === "success" ? "bg-secondary" : "bg-card border border-border"
  const fg = tone === "accent" ? "text-accent-foreground" : "text-foreground"
  return (
    <div className={cn("rounded-xl p-4.5", bg)}>
      <p className={cn("text-[13.5px] font-medium", tone ? fg : "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-2.5 text-3xl font-semibold tracking-tight", fg)}>{value}</p>
    </div>
  )
}

// ----------------------------------------------------------------- Match

function MatchScreen({
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
        ← Back to Dashboard
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

// ------------------------------------------------------------------ Plan

function PlanScreen({
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
        ← Back to Dashboard
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
                  Back to dashboard
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
