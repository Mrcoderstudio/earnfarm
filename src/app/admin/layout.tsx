import { requireAdmin } from "@/lib/session";
import { AdminShell } from "@/components/admin-shell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Operator console",
  description: "EarnFarm admin — payout approvals and live economy controls.",
  robots: { index: false, follow: false },
};

/** Only the operator mailbox configured by ADMIN_EMAIL gets past this guard. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const operator = await requireAdmin();
  return (
    <AdminShell name={operator.name} email={operator.email}>
      {children}
    </AdminShell>
  );
}
