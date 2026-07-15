"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Check, Loader2, LogOut, Sparkles, WifiOff, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  type ApiLearner,
  type ApiLearningPlan,
  type ApiMatchRecommendation,
  type ApiMatchRecommendationDetail,
  type Me,
  approveLearningPlan,
  approveMatchRecommendation,
  createLearningPlan,
  createMatchRecommendations,
  getMe,
  getStoredToken,
  listLearners,
  listLearningPlans,
  listMatchRecommendations,
  login,
  logout,
  rejectLearningPlan,
  rejectMatchRecommendation,
} from "@/lib/peak-lite-api"

type Status = "checking" | "signed-out" | "signed-in" | "unreachable"

// Talks to the real Django REST API in ../backend over HTTP, not the mock
// data in lib/mock-data.ts that powers the rest of this prototype.
export default function LiveBackendPage() {
  const [status, setStatus] = useState<Status>("checking")
  const [username, setUsername] = useState("casemanager_demo")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [me, setMe] = useState<Me | null>(null)

  const [learnersList, setLearnersList] = useState<ApiLearner[]>([])

  // Read-only data for instructor/family roles -- see loadForRole().
  const [myMatches, setMyMatches] = useState<ApiMatchRecommendationDetail[]>([])
  const [myPlans, setMyPlans] = useState<ApiLearningPlan[]>([])

  // Case-manager/admin match+plan workflow state.
  const [learnerId, setLearnerId] = useState("")
  const [running, setRunning] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [resultLearnerName, setResultLearnerName] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<ApiMatchRecommendation[]>([])
  const [actingMatchId, setActingMatchId] = useState<number | null>(null)

  const [plan, setPlan] = useState<ApiLearningPlan | null>(null)
  const [planDraftText, setPlanDraftText] = useState("")
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  useEffect(() => {
    if (getStoredToken()) {
      loadForRole()
    } else {
      setStatus("signed-out")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetches whoever is signed in, then loads exactly the data their role
  // needs -- instructor/family get a read-only picture of their own
  // matches + plans, case_manager/admin get the learner picker for the
  // create-a-match workflow below.
  async function loadForRole() {
    try {
      const meResult = await getMe()
      setMe(meResult)
      const data = await listLearners()
      setLearnersList(data)

      if (meResult.role === "instructor" || meResult.role === "family") {
        const [matchData, planData] = await Promise.all([listMatchRecommendations(), listLearningPlans()])
        setMyMatches(matchData)
        setMyPlans(planData)
      }
      setStatus("signed-in")
    } catch (err) {
      // Either the stored token is stale, or the backend isn't running.
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
      await loadForRole()
    } catch (err) {
      if (err instanceof TypeError) {
        setStatus("unreachable")
      } else {
        setAuthError("Login failed — check the username and password.")
      }
    } finally {
      setSigningIn(false)
    }
  }

  function selectLearner(id: string) {
    setLearnerId(id)
    // Switching learners invalidates whatever match/plan was on screen.
    setResultLearnerName(null)
    setRecommendations([])
    setPlan(null)
    setMatchError(null)
    setPlanError(null)
  }

  async function runLiveMatch() {
    if (!learnerId) return
    setRunning(true)
    setMatchError(null)
    setPlan(null)
    setPlanError(null)
    try {
      const data = await createMatchRecommendations(Number(learnerId))
      setResultLearnerName(data.learner)
      setRecommendations(data.recommendations)
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Match request failed.")
    } finally {
      setRunning(false)
    }
  }

  async function handleApproveMatch(id: number) {
    setActingMatchId(id)
    setMatchError(null)
    try {
      const updated = await approveMatchRecommendation(id)
      setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)))
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setActingMatchId(null)
    }
  }

  async function handleRejectMatch(id: number) {
    setActingMatchId(id)
    setMatchError(null)
    try {
      const updated = await rejectMatchRecommendation(id)
      setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: updated.status } : r)))
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Reject failed.")
    } finally {
      setActingMatchId(null)
    }
  }

  async function handleDraftPlan() {
    if (!learnerId) return
    setPlanLoading(true)
    setPlanError(null)
    try {
      const created = await createLearningPlan(Number(learnerId))
      setPlan(created)
      setPlanDraftText(created.ai_draft)
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Drafting the plan failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleApprovePlan() {
    if (!plan) return
    setPlanLoading(true)
    setPlanError(null)
    try {
      setPlan(await approveLearningPlan(plan.id, planDraftText))
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Approve failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  async function handleRejectPlan() {
    if (!plan) return
    setPlanLoading(true)
    setPlanError(null)
    try {
      setPlan(await rejectLearningPlan(plan.id))
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Reject failed.")
    } finally {
      setPlanLoading(false)
    }
  }

  function handleSignOut() {
    logout()
    setLearnersList([])
    setMyMatches([])
    setMyPlans([])
    setResultLearnerName(null)
    setRecommendations([])
    setPlan(null)
    setMe(null)
    setStatus("signed-out")
  }

  const isReadOnlyRole = me?.role === "instructor" || me?.role === "family"

  function matchStatusVariant(s: string) {
    return s === "approved" ? "default" : s === "rejected" ? "destructive" : "outline"
  }

  return (
    <>
      <PageHeader
        title="Live Backend Demo"
        description="Calls the real Django REST API end to end — sign-in, real learners from PostgreSQL, real match/plan approvals. Start it with docker compose up in backend/, then seed it: python manage.py seed_demo_data."
      >
        {status === "signed-in" && (
          <div className="flex items-center gap-3">
            {me && (
              <span className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{me.username}</span>
                {me.role && <Badge variant="outline" className="ml-2">{me.role}</Badge>}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        )}
      </PageHeader>

      {status === "unreachable" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            Can&apos;t reach the backend. Run <code>docker compose up</code> in{" "}
            <code>backend/</code> (or <code>python manage.py runserver</code>), then try again.
          </p>
        </div>
      )}

      {status !== "signed-in" ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign in to the backend</CardTitle>
          </CardHeader>
          <CardContent>
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
              <Button type="submit" disabled={signingIn}>
                {signingIn && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {signingIn ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Seeded demo logins (same password <code>peaklite-demo-2026</code> for all):{" "}
                <code>casemanager_demo</code>, <code>jordan_lee</code> (instructor),{" "}
                <code>family_chen</code> (family)
              </p>
            </form>
          </CardContent>
        </Card>
      ) : isReadOnlyRole ? (
        <Card>
          <CardHeader>
            <CardTitle>{me?.role === "instructor" ? "My Assigned Learners" : "My Learner"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Read-only —{" "}
              {me?.role === "instructor"
                ? "learners you're currently matched with, and their plan status."
                : "your learner's match and learning plan status."}{" "}
              Creating or approving matches and plans is restricted to case managers and admins.
            </p>

            {learnersList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No learners linked to your account yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {learnersList.map((l) => {
                  const learnerMatches = myMatches.filter((m) => m.learner === l.id)
                  const learnerPlan = myPlans.find((p) => p.learner === l.id)
                  return (
                    <li key={l.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{l.full_name}</span>
                        <span className="text-xs text-muted-foreground">{l.grade_level}</span>
                      </div>

                      {learnerMatches.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No match recommendation yet.
                        </p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {learnerMatches.map((m) => (
                            <li key={m.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Matched with{" "}
                                <span className="text-foreground">{m.instructor_name}</span>
                              </span>
                              <Badge variant={matchStatusVariant(m.status)}>{m.status}</Badge>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 border-t border-border pt-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Learning plan
                        </span>
                        {!learnerPlan ? (
                          <p className="mt-1 text-sm text-muted-foreground">No plan drafted yet.</p>
                        ) : learnerPlan.status === "approved" ? (
                          <p className="mt-1 text-sm leading-relaxed text-foreground">
                            {learnerPlan.approved_plan}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm italic text-muted-foreground">
                            Pending review — not yet approved by a case manager.
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Run a live match</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {learnersList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No learners returned by the API yet. Run{" "}
                    <code>python manage.py seed_demo_data</code> in <code>backend/</code>, then
                    reload.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="live-learner-select">Learner (from PostgreSQL)</Label>
                      <Select value={learnerId} onValueChange={selectLearner}>
                        <SelectTrigger id="live-learner-select" className="w-full bg-card">
                          <SelectValue placeholder="Choose a learner">
                            {(value: string | null) => {
                              const selected = learnersList.find((l) => String(l.id) === value)
                              return selected ? `${selected.full_name} — ${selected.grade_level}` : "Choose a learner"
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {learnersList.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.full_name} — {l.grade_level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={runLiveMatch} disabled={!learnerId || running}>
                      <Sparkles className="size-4" aria-hidden="true" />
                      {running ? "Calling POST /api/match-recommendations/…" : "Run live match"}
                    </Button>
                    {matchError && <p className="text-sm text-destructive">{matchError}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Response from the API</CardTitle>
              </CardHeader>
              <CardContent>
                {!resultLearnerName ? (
                  <p className="text-sm text-muted-foreground">
                    Run a match to see the real response here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Recommendations for{" "}
                      <span className="font-medium text-foreground">{resultLearnerName}</span>
                    </p>
                    {recommendations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No suitable instructors found — none matched on skills, or all are at
                        capacity.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-3">
                        {recommendations.map((r) => (
                          <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-foreground">{r.instructor}</span>
                              <Badge variant="secondary">{r.score}</Badge>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {r.reason}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant={matchStatusVariant(r.status)}>{r.status}</Badge>
                              {r.status === "pending" && (
                                <div className="ml-auto flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actingMatchId === r.id}
                                    onClick={() => handleApproveMatch(r.id)}
                                  >
                                    <Check className="size-3.5" aria-hidden="true" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={actingMatchId === r.id}
                                    onClick={() => handleRejectMatch(r.id)}
                                  >
                                    <X className="size-3.5" aria-hidden="true" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {learnerId && (
            <Card>
              <CardHeader>
                <CardTitle>Learning plan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  AI drafts a first version. Nothing here is final until a case manager or admin
                  reviews and approves it — edit the text below before approving if you want.
                </p>

                {!plan ? (
                  <Button variant="outline" onClick={handleDraftPlan} disabled={planLoading}>
                    <Sparkles className="size-4" aria-hidden="true" />
                    {planLoading ? "Drafting…" : "Draft AI learning plan"}
                  </Button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={matchStatusVariant(plan.status)}>{plan.status}</Badge>
                      {plan.status === "approved" && plan.approved_at && (
                        <span className="text-xs text-muted-foreground">
                          Approved {new Date(plan.approved_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {plan.status === "draft" ? (
                      <>
                        <Textarea
                          value={planDraftText}
                          onChange={(e) => setPlanDraftText(e.target.value)}
                          rows={5}
                          className="bg-card"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" disabled={planLoading} onClick={handleApprovePlan}>
                            <Check className="size-3.5" aria-hidden="true" />
                            Approve plan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={planLoading}
                            onClick={handleRejectPlan}
                          >
                            <X className="size-3.5" aria-hidden="true" />
                            Reject
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
                        {plan.approved_plan || plan.ai_draft}
                      </p>
                    )}
                    {planError && <p className="text-sm text-destructive">{planError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
