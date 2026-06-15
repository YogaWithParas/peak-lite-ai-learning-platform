import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TagList } from "@/components/tag-list"
import type { Learner } from "@/lib/types"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

export function LearnerCard({
  learner,
  footer,
}: {
  learner: Learner
  footer?: React.ReactNode
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
              {initials(learner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{learner.name}</h3>
            <p className="text-sm text-muted-foreground">
              Age {learner.age} · Grade {learner.grade}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <TagList
            label="Learning differences"
            items={learner.learningDifferences}
            variant="difference"
          />
          <TagList label="Support needs" items={learner.supportNeeds} variant="need" />
        </div>

        <dl className="mt-auto grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Availability
              </dt>
              <dd className="text-foreground">{learner.availability.join(", ")}</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preferred teaching style
            </dt>
            <dd className="text-foreground">{learner.preferredTeachingStyle}</dd>
          </div>
        </dl>

        {footer}
      </CardContent>
    </Card>
  )
}
