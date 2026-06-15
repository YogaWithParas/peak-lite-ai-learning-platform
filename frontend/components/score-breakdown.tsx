import { SCORE_WEIGHTS } from "@/lib/matching"
import type { ScoreBreakdown } from "@/lib/types"

const rows: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "supportNeedSkill", label: "Support need / skill match" },
  { key: "learningDifferenceExperience", label: "Learning difference experience" },
  { key: "availability", label: "Availability match" },
  { key: "capacity", label: "Capacity" },
  { key: "teachingStyle", label: "Teaching style" },
]

export function ScoreBreakdownList({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const value = breakdown[row.key]
        const max = SCORE_WEIGHTS[row.key]
        const pct = max > 0 ? (value / max) * 100 : 0
        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">{row.label}</span>
              <span className="font-medium tabular-nums text-muted-foreground">
                {value} / {max}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={max}
              aria-label={`${row.label}: ${value} of ${max} points`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
