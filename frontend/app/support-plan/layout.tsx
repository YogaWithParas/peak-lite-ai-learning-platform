import { AppShell } from "@/components/app-shell"

// Kept on the original AppShell sidebar exactly as before -- see app/live/layout.tsx.
export default function SupportPlanLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
