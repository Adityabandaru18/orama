export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
import AuthPageClient from "./AuthPageClient";

export default function AuthPage() {
  return <AuthPageClient />;
}
