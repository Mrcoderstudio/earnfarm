import { redirect } from "next/navigation";
import { isAdminEmail } from "@/auth";
import { getSettings, getUserById } from "@/lib/data";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

/**
 * Route-group layout for every protected player surface:
 * /dashboard · /store · /ads · /profile · /withdraw
 * The session guard runs on the server, so an unauthenticated request never
 * even reaches the client bundle.
 */
export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const user = await getUserById(session.id);
  if (!user) redirect("/signin");

  const s = await getSettings();

  return (
    <AppShell
      user={{ name: user.name, email: user.email, referralCode: user.referralCode }}
      snapshot={buildSnapshot(user, s)}
      isAdmin={isAdminEmail(user.email)}
    >
      {children}
    </AppShell>
  );
}
