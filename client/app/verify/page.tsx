export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import { VerifierDashboard } from "@/components/verifier-dashboard"

export default function VerifyPage() {
  return (
    // Temporarily bypassing AuthGuard so this page is accessible during development
    // import { AuthGuard } from "@/components/auth-guard" is commented out above
    <VerifierDashboard />
  )
}
