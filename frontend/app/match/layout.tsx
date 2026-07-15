import { AppShell } from "@/components/app-shell"

// Covers both /match and /match/result. Kept on the original AppShell
// sidebar exactly as before -- see app/live/layout.tsx.
export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
