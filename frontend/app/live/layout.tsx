import { AppShell } from "@/components/app-shell"

// The unified app at "/" manages its own full-page chrome now, so the root
// layout no longer wraps every route in AppShell. This nested layout keeps
// /live (and, via the same shell, the other legacy prototype pages) on the
// original sidebar exactly as before -- untouched, still reachable directly.
export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
