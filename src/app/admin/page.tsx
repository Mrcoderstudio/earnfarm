import { redirect } from "next/navigation";
import {
  getAdminStats,
  getAllWithdrawals,
  getLeaderboard,
  getPendingWithdrawals,
  getReferredPlayerCount,
  getSettings,
  getUserById,
} from "@/lib/data";
import { ASSET_LIST } from "@/lib/assets";
import { requireAdmin } from "@/lib/session";
import { AdminPanel, type AdminData } from "@/components/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const operator = await requireAdmin();
  const fresh = await getUserById(operator.id);
  if (!fresh) redirect("/signin");

  const [
    s,
    baseStats,
    pendingRows,
    recentRows,
    leaderboardRows,
    referredPlayers,
  ] = await Promise.all([
    getSettings(),
    getAdminStats(),
    getPendingWithdrawals(),
    getAllWithdrawals(12),
    getLeaderboard(10),
    getReferredPlayerCount(),
  ]);

  const data: AdminData = {
    stats: { ...baseStats, referredPlayers },
    pending: pendingRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      userName: row.userName,
      userEmail: row.userEmail,
      amountUsd: row.amountUsd,
      coinsSpent: row.coinsSpent,
      paymentMethod: row.paymentMethod,
      accountNumber: row.accountNumber,
      accountName: row.accountName,
      createdAt: row.createdAt.toISOString(),
    })),
    recent: recentRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      userName: row.userName,
      amountUsd: row.amountUsd,
      paymentMethod: row.paymentMethod,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
    leaderboard: leaderboardRows,
    economy: {
      adRewardCoins: s.adRewardCoins,
      minWithdrawUsd: s.minWithdrawUsd,
      withdrawRate: s.withdrawRate,
      dailyAdCap: s.dailyAdCap,
      yieldCooldownHours: s.yieldCooldownHours,
      referralSharePercent: s.referralSharePercent,
      solarPrice: s.solarPrice,
      windmillPrice: s.windmillPrice,
      megafarmPrice: s.megafarmPrice,
      paidOutUsd: baseStats.paidOutUsd,
    },
    withdrawRate: s.withdrawRate,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-danger/85">
            Control panel
          </p>
          <h1 className="display mt-1.5 text-2xl font-bold text-ice sm:text-3xl">
            Payout approvals &amp; economy tuning
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
            Every number on this page is aggregated live from Postgres — no cache, no sample rows. Yields
            per asset are fixed catalogue metadata (
            {ASSET_LIST.map((asset) => `${asset.name} +${asset.yieldPerDay}`).join(" · ")}) while prices
            and caps are editable below and take effect on the player&apos;s next request.
          </p>
        </div>
      </div>

      <AdminPanel data={data} />
    </div>
  );
}
