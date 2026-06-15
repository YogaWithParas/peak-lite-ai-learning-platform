"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo } from "react"
import {
  ArrowLeft,
  Check,
  X,
  Pencil,
  Sparkles,
  Quote,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ScoreBreakdownList } from "@/components/score-breakdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getLearnerById, instructors } from "@/lib/mock-data"
import { rankInstructors } from "@/lib/matching"
import type { MatchPriority } from "@/lib/types"

function initials(name: string) {
  return name
    .replace(/^Dr\.\s/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

function MatchResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const learnerId = params.get("learner")
  const priority = (params.get("priority") ?? "balanced") as MatchPriority

  const learner = getLearnerById(learnerId)

  const ranked = useMemo(() => {
    if (!learner) return []
    return rankInstructors(learner, instructors, priority)
  }, [learner, priority])

  if (!learner) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="mb-4 text-muted-foreground">
          No learner selected for this match.
        </p>
        <Button render={<Link href="/match" />}>Go to Match Center</Button>
      </div>
    )
  }

  const top = ranked[0]
  const alternatives = ranked.slice(1, 4)
  const planHref = `/support-plan?learner=${learner.id}&instructor=${top.instructor.id}&priority=${priority}`

  return (
    <>
      <Button
        render={<Link href="/match" />}
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Match Center
      </Button>

      <PageHeader
        title="Match result"
        description={`Recommended instructor for ${learner.name}. Review the reasoning below, then approve, edit, or reject.`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Recommended instructor */}
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {initials(top.instructor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Badge className="mb-1.5 border-transparent bg-accent text-accent-foreground">
                      Recommended
                    </Badge>
                    <h2 className="text-xl font-semibold text-foreground">
                      {top.instructor.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{top.instructor.title}</p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-4xl font-semibold tabular-nums text-foreground">
                    {top.totalScore}
                  </span>
                  <span className="text-sm text-muted-foreground">Match score / 100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdownList breakdown={top.breakdown} />
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card className="bg-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" aria-hidden="true" />
                Why this match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Quote
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-pretty leading-relaxed text-foreground">
                  {top.explanation}
                </p>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                AI-generated explanation based on the scoring model. Please verify
                against your own knowledge of the learner.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: actions + alternatives */}
        <div className="flex flex-col gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                asChild
                className="w-full justify-start"
              >
                <Link href={`${planHref}&mode=review`}>
                  <Check className="size-4" aria-hidden="true" />
                  Approve & review plan
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href={`${planHref}&mode=edit`}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit support plan
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => router.push("/match")}
              >
                <X className="size-4" aria-hidden="true" />
                Reject & start over
              </Button>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Alternative instructors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {alternatives.map((alt) => (
                  <li
                    key={alt.instructor.id}
                    className="flex items-center justify-between gap-3 py-3 not-last:border-b not-last:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                          {initials(alt.instructor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {alt.instructor.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {alt.instructor.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {alt.totalScore}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function MatchResultPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading match…</p>}>
      <MatchResultContent />
    </Suspense>
  )
}
