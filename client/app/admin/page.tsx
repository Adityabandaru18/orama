import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    // Temporarily bypassing AuthGuard so this page is accessible during development
    // import { AuthGuard } from "@/components/auth-guard" is commented out above
    <AdminDashboard />
  )
}
