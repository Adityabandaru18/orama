import { UserDashboard } from "@/components/user-dashboard"

export default function DashboardPage() {
  return (
    // Temporarily bypassing AuthGuard so this page is accessible during development
    // import { AuthGuard } from "@/components/auth-guard" is commented out above
    <UserDashboard />
  )
}
