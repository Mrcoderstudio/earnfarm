import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { withdrawals } from "@/db/schema";
import { getReferrer, getSettings, getUserById } from "@/lib/data";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { DashboardView, type DashboardData } from "@/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUser();
  const user = await getUserById(session.id);
  if (!user) redirect("/signin");

  const s = await getSettings();
  const [referrer, payoutRows] = await Promise.all([
    getReferrer(user.referredBy),
    db
      .select({
        id: withdrawals.id,
        amountUsd: withdrawals.amountUsd,
        status: withdrawals.status,
        paymentMethod: withdrawals.paymentMethod,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals)
      .where(eq(withdrawals.userId, user.id))
      .orderBy(desc(withdrawals.createdAt))
      .limit(3),
  ]);

  const data: DashboardData = {
    snapshot: buildSnapshot(user, s),
    profile: {
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      totalEarned: user.totalEarned,
      referralEarned: user.referralEarned,
      adsWatchedTotal: user.adsWatchedTotal,
      hasFleet:
        user.assets.solar + user.assets.windmill + user.assets.megafarm > 0,
    },
    economy: {
      adRewardCoins: s.adRewardCoins,
      minWithdrawUsd: s.minWithdrawUsd,
      withdrawRate: s.withdrawRate,
      dailyAdCap: s.dailyAdCap,
      yieldCooldownHours: s.yieldCooldownHours,
      referralSharePercent: s.referralSharePercent,
      solarPrice: s.solarPrice,
    },
    referrerName: referrer?.name ?? null,
    payouts: payoutRows.map((row) => ({
      id: row.id,
      amountUsd: row.amountUsd,
      status: row.status,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt.toISOString(),
    })),
  };

  return <DashboardView data={data} />;
}
