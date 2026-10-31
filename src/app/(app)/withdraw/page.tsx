import { redirect } from "next/navigation";
import { getSettings, getUserById, getUserWithdrawals } from "@/lib/data";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { WithdrawForm, type WithdrawData } from "@/components/withdraw-form";

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const session = await requireUser();
  const [user, s] = await Promise.all([getUserById(session.id), getSettings()]);
  if (!user) redirect("/signin");

  const history = await getUserWithdrawals(user.id);
  const snapshot = buildSnapshot(user, s);

  const data: WithdrawData = {
    coins: snapshot.coins,
    usd: snapshot.usd,
    withdrawRate: s.withdrawRate,
    minWithdrawUsd: s.minWithdrawUsd,
    history: history.map((row) => ({
      id: row.id,
      reference: row.reference,
      amountUsd: row.amountUsd,
      coinsSpent: row.coinsSpent,
      paymentMethod: row.paymentMethod,
      accountNumber: row.accountNumber,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      processedAt: row.processedAt ? row.processedAt.toISOString() : null,
    })),
  };

  return <WithdrawForm data={data} />;
}
