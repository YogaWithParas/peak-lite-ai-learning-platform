import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TagList } from "@/components/tag-list"
import { CapacityBar } from "@/components/capacity-bar"
import type { Instructor } from "@/lib/types"

function initials(name: string) {
  return name
    .replace(/^Dr\.\s/, "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
}

export function InstructorCard({
  instructor,
  footer,
}: {
  instructor: Instructor
  footer?: React.ReactNode
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
              {initials(instructor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{instructor.name}</h3>
            <p className="text-sm text-muted-foreground">
              {instructor.title} · {instructor.yearsExperience} yrs
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <TagList label="Skills" items={instructor.skills} variant="need" />
          <TagList
            label="Experience areas"
            items={instructor.experienceAreas}
            variant="difference"
          />
        </div>

        <dl className="grid grid-cols-1 gap-2 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Availability
            </dt>
            <dd className="text-foreground">{instructor.availability.join(", ")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Teaching style
            </dt>
            <dd className="text-foreground">{instructor.teachingStyle}</dd>
          </div>
        </dl>

        <div className="mt-auto pt-1">
          <CapacityBar current={instructor.currentLoad} capacity={instructor.capacity} />
        </div>

        {footer}
      </CardContent>
    </Card>
  )
}
