"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Info, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getLearnerById, learners } from "@/lib/mock-data"
import type { MatchPriority } from "@/lib/types"

const priorities: { value: MatchPriority; label: string; description: string }[] = [
  {
    value: "balanced",
    label: "Balanced",
    description: "Weigh all factors evenly across the scoring model.",
  },
  {
    value: "support-need",
    label: "Support need fit",
    description: "Emphasize matching the learner's needs to instructor skills.",
  },
  {
    value: "learning-difference",
    label: "Learning difference experience",
    description: "Emphasize instructor experience with the learner's profile.",
  },
  {
    value: "availability",
    label: "Availability",
    description: "Emphasize overlapping schedules and timely start.",
  },
]

function MatchCenterContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [learnerId, setLearnerId] = useState(params.get("learner") ?? "")
  const [priority, setPriority] = useState<MatchPriority>("balanced")
  const [running, setRunning] = useState(false)

  const selectedLearner = getLearnerById(learnerId)

  function runMatch() {
    if (!learnerId) return
    setRunning(true)
    // Simulated async match. Replace with an API call to the matching service.
    setTimeout(() => {
      router.push(`/match/result?learner=${learnerId}&priority=${priority}`)
    }, 700)
  }

  return (
    <>
      <PageHeader
        title="Match Center"
        description="Choose a learner and a matching priority, then run an AI-assisted match. Recommendations always require human approval."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New match</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="learner-select">Select a learner</Label>
                <Select value={learnerId} onValueChange={setLearnerId}>
                  <SelectTrigger id="learner-select" className="w-full bg-card">
                    <SelectValue placeholder="Choose a learner to match" />
                  </SelectTrigger>
                  <SelectContent>
                    {learners.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} — Grade {l.grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-sm font-medium text-foreground">
                  Matching priority
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {priorities.map((p) => {
                    const active = priority === p.value
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        aria-pressed={active}
                        className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          active
                            ? "border-primary bg-secondary"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className="block font-medium text-foreground">{p.label}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {p.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="flex items-start gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
                <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="text-sm leading-relaxed">
                  <strong className="font-semibold">Human approval is required.</strong>{" "}
                  PEAK-Lite suggests a recommendation, but an educator must review
                  the result and approve, edit, or reject the support plan.
                </p>
              </div>

              <Button
                onClick={runMatch}
                disabled={!learnerId || running}
                className="w-full sm:w-auto"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                {running ? "Running match…" : "Run match"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Selected learner</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLearner ? (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </dt>
                  <dd className="font-medium text-foreground">{selectedLearner.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Grade & age
                  </dt>
                  <dd className="text-foreground">
                    Grade {selectedLearner.grade} · Age {selectedLearner.age}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Learning differences
                  </dt>
                  <dd className="text-foreground">
                    {selectedLearner.learningDifferences.join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Support needs
                  </dt>
                  <dd className="text-foreground">{selectedLearner.supportNeeds.join(", ")}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Preferred style
                  </dt>
                  <dd className="text-foreground">{selectedLearner.preferredTeachingStyle}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a learner to see their profile summary here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function MatchCenterPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <MatchCenterContent />
    </Suspense>
  )
}
