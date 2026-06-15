import Link from "next/link"
import {
  Users,
  GraduationCap,
  Clock,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  CalendarClock,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { instructors, learners, recentActivity } from "@/lib/mock-data"
import type { ActivityItem } from "@/lib/types"

const activityIcons: Record<ActivityItem["type"], typeof CheckCircle2> = {
  approval: CheckCircle2,
  match: Sparkles,
  learner: UserPlus,
  instructor: CalendarClock,
}

export default function DashboardPage() {
  const activeInstructors = instructors.filter((i) => i.currentLoad < i.capacity).length
  const pendingMatches = 7
  const approvedPlans = 23

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A calm overview of your matching program. Every recommendation is a starting point — educators stay in control of final decisions."
      >
        <Button render={<Link href="/match" />}>
          <Sparkles className="size-4" aria-hidden="true" />
          Run new match
        </Button>
      </PageHeader>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total learners"
          value={learners.length}
          hint="Across all grade levels"
          icon={Users}
        />
        <StatCard
          label="Active instructors"
          value={activeInstructors}
          hint="With open capacity"
          icon={GraduationCap}
        />
        <StatCard
          label="Pending matches"
          value={pendingMatches}
          hint="Awaiting review"
          icon={Clock}
        />
        <StatCard
          label="Approved support plans"
          value={approvedPlans}
          hint="This term"
          icon={ClipboardCheck}
        />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {recentActivity.map((item) => {
                const Icon = activityIcons[item.type]
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                  >
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Start a new match</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-6">
            <p className="text-sm leading-relaxed text-primary-foreground/90">
              Select a learner, choose a matching priority, and review an
              AI-assisted recommendation. You decide whether to approve, edit, or
              reject.
            </p>
            <Button
              render={<Link href="/match" />}
              variant="secondary"
              className="w-full justify-between"
            >
              Go to Match Center
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
