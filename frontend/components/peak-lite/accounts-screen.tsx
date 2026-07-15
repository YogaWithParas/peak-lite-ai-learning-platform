import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { type ApiAccount } from "@/lib/peak-lite-api"
import { usernameInitials } from "./format"

const GROUPS: { role: ApiAccount["role"]; label: string }[] = [
  { role: "admin", label: "Admin" },
  { role: "case_manager", label: "Case Managers" },
  { role: "instructor", label: "Instructors" },
  { role: "family", label: "Family" },
  { role: null, label: "Unassigned" },
]

export function AccountsScreen({ accounts }: { accounts: ApiAccount[] }) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter((a) => a.username.toLowerCase().includes(q))
  }, [accounts, search])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1.5 text-[14.5px] text-muted-foreground">
            Every user with a PEAK-Lite login, grouped by role.
          </p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accounts…"
          className="max-w-xs"
        />
      </div>

      <div className="flex flex-col gap-7">
        {GROUPS.map((group) => {
          const rows = filtered.filter((a) => a.role === group.role)
          if (rows.length === 0) return null
          return (
            <section key={group.label}>
              <h2 className="mb-3 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label} <span className="font-normal">({rows.length})</span>
              </h2>
              <Card>
                <CardContent className="flex flex-col gap-0.5 py-2">
                  {rows.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {usernameInitials(a.username)}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{a.username}</span>
                      <Badge variant="success">Active</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No accounts match &quot;{search}&quot;.</p>
        )}
      </div>
    </div>
  )
}
