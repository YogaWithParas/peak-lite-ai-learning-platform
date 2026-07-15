"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { LogOut, Loader2, Sparkles, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { AccountsScreen } from "@/components/peak-lite/accounts-screen"
import { DEMO_ACCOUNTS, DEMO_PASSWORD, NAV_ITEMS, ROLE_LABELS, type Role, type Screen } from "@/components/peak-lite/constants"
import { DashboardScreen } from "@/components/peak-lite/dashboard-screen"
import { InstructorsScreen } from "@/components/peak-lite/instructors-screen"
import { LearnersScreen } from "@/components/peak-lite/learners-screen"
import { LearningPlansScreen } from "@/components/peak-lite/learning-plans-screen"
import { MatchCenterScreen } from "@/components/peak-lite/match-center-screen"
import { MatchScreen } from "@/components/peak-lite/match-screen"
import { PlanScreen } from "@/components/peak-lite/plan-screen"

type Status = "checking" | "signed-out" | "signed-in" | "unreachable"

export default function HomePage() {
  const [status, setStatus] = useState<Status>("checking")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [me, setMe] = useState<Me | null>(null)

  const [screen, setScreen] = useState<Screen>("dashboard")
  // Where to return to after finishing a match/plan opened from any screen.
  const [returnScreen, setReturnScreen] = useState<Screen>("dashboard")
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
      // Initial state must stay "checking" on both server and client (SSR-safe,
      // avoids a hydration mismatch) -- this mount-only effect is the one place
      // that's allowed to branch on localStorage and settle it to "signed-out".
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("signed-out")
    }
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
    setReturnScreen("dashboard")
    setActiveLearnerId(null)
    setStatus("signed-out")
  }

  async function refreshMatchesAndPlans() {
    const [matchesData, plansData] = await Promise.all([listMatchRecommendations(), listLearningPlans()])
    setMatches(matchesData)
    setPlans(plansData)
  }

  function openMatch(learnerId: number, from: Screen) {
    setActiveLearnerId(learnerId)
    setMatchCandidateIndex(0)
    setMatchError(null)
    setReturnScreen(from)
    setScreen("match")
    // Auto-run a fresh match only if there's no live candidate already --
    // a learner whose only record was rejected still needs a fresh run.
    if (!matches.some((m) => m.learner === learnerId && m.status !== "rejected")) {
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
      setScreen(returnScreen)
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setMatchActionLoading(false)
    }
  }

  async function handleRejectMatch(id: number) {
    // Deliberately does not navigate away -- lets the user pick an
    // alternative candidate for the same learner right after rejecting.
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

  function openPlan(learnerId: number, from: Screen) {
    setActiveLearnerId(learnerId)
    setPlanError(null)
    setReturnScreen(from)
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
      setScreen(returnScreen)
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
      setScreen(returnScreen)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Reject failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  const role = (me?.role ?? null) as Role | null

  function matchStatusFor(learnerId: number) {
    const learnerMatches = matches.filter((m) => m.learner === learnerId)
    const approved = learnerMatches.find((m) => m.status === "approved")
    return { matched: !!approved, instructorName: approved?.instructor_name ?? null }
  }

  function actionForLearner(learnerId: number, from: Screen) {
    const { matched } = matchStatusFor(learnerId)
    const plan = plans.find((p) => p.learner === learnerId) ?? null
    if (!matched) return { label: "Run Match", onClick: () => openMatch(learnerId, from) }
    if (!plan) return { label: "Create Plan", onClick: () => openPlan(learnerId, from) }
    if (plan.status === "draft") return { label: "Review Plan", onClick: () => openPlan(learnerId, from) }
    return { label: "View Plan", onClick: () => openPlan(learnerId, from) }
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
            NAV_ITEMS[role].map((item) => (
              <button
                key={item.screen}
                type="button"
                onClick={() => setScreen(item.screen)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  screen === item.screen
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                {item.label}
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
              matchStatusFor={matchStatusFor}
              instructorSelectedId={instructorSelectedId}
              setInstructorSelectedId={setInstructorSelectedId}
              onNavigate={setScreen}
              onOpenMatch={(id) => openMatch(id, "dashboard")}
              onOpenPlan={(id) => openPlan(id, "dashboard")}
            />
          )}

          {screen === "learners" && (
            <LearnersScreen
              learners={learners}
              plans={plans}
              matchStatusFor={matchStatusFor}
              actionFor={(id) => actionForLearner(id, "learners")}
            />
          )}

          {screen === "instructors" && <InstructorsScreen instructors={instructors} matches={matches} />}

          {screen === "matchCenter" && (
            <MatchCenterScreen learners={learners} matches={matches} onOpenMatch={(id) => openMatch(id, "matchCenter")} />
          )}

          {screen === "learningPlans" && (
            <LearningPlansScreen
              learners={learners}
              plans={plans}
              matchStatusFor={matchStatusFor}
              onOpenPlan={(id) => openPlan(id, "learningPlans")}
            />
          )}

          {screen === "accounts" && <AccountsScreen accounts={accounts} />}

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
              onBack={() => setScreen(returnScreen)}
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
              onBack={() => setScreen(returnScreen)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
