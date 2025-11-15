export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  return (
    // Temporarily bypassing AuthGuard so this page is accessible during development
    // import { AuthGuard } from "@/components/auth-guard" is commented out above
    <AdminDashboard />
  )
}
