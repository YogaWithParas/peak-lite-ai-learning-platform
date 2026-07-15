import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "accent" | "success"
}) {
  const bg = tone === "accent" ? "bg-accent" : tone === "success" ? "bg-secondary" : "bg-card border border-border"
  const fg = tone === "accent" ? "text-accent-foreground" : "text-foreground"
  return (
    <div className={cn("rounded-xl p-4.5", bg)}>
      <p className={cn("text-[13.5px] font-medium", tone ? fg : "text-muted-foreground")}>{label}</p>
      <p className={cn("mt-2.5 text-3xl font-semibold tracking-tight", fg)}>{value}</p>
    </div>
  )
}
