"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2, LogOut, Sparkles, WifiOff } from "lucide-react"
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
import {
  type ApiLearner,
  type CreateMatchRecommendationsResponse,
  createMatchRecommendations,
  getStoredToken,
  listLearners,
  login,
  logout,
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

  const [learnersList, setLearnersList] = useState<ApiLearner[]>([])
  const [learnerId, setLearnerId] = useState("")
  const [running, setRunning] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateMatchRecommendationsResponse | null>(null)

  useEffect(() => {
    if (getStoredToken()) {
      loadLearners()
    } else {
      setStatus("signed-out")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadLearners() {
    try {
      const data = await listLearners()
      setLearnersList(data)
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
      await loadLearners()
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

  async function runLiveMatch() {
    if (!learnerId) return
    setRunning(true)
    setMatchError(null)
    setResult(null)
    try {
      setResult(await createMatchRecommendations(Number(learnerId)))
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Match request failed.")
    } finally {
      setRunning(false)
    }
  }

  function handleSignOut() {
    logout()
    setLearnersList([])
    setResult(null)
    setStatus("signed-out")
  }

  return (
    <>
      <PageHeader
        title="Live Backend Demo"
        description="Calls the real Django REST API end to end — sign-in, real learners from PostgreSQL, a real POST /api/match-recommendations/ call. Start it with docker compose up in backend/, then seed it: python manage.py seed_demo_data."
      >
        {status === "signed-in" && (
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
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
                Seeded demo login: <code>casemanager_demo</code> /{" "}
                <code>peaklite-demo-2026</code>
              </p>
            </form>
          </CardContent>
        </Card>
      ) : (
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
                    <Select value={learnerId} onValueChange={setLearnerId}>
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
              {!result ? (
                <p className="text-sm text-muted-foreground">
                  Run a match to see the real response here.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Recommendations for{" "}
                    <span className="font-medium text-foreground">{result.learner}</span>
                  </p>
                  {result.recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No suitable instructors found — none matched on skills, or all are at
                      capacity.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {result.recommendations.map((r) => (
                        <li key={r.id} className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{r.instructor}</span>
                            <Badge variant="secondary">{r.score}</Badge>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {r.reason}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {r.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
