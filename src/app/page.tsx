import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, withdrawals } from "@/db/schema";
import { ASSET_LIST } from "@/lib/assets";
import { getSettings } from "@/lib/data";
import { LandingView, type Economy, type LiveStats } from "@/components/marketing";

export const dynamic = "force-dynamic";

/** Every figure on the landing page is read from Postgres at request time. */
export default async function LandingPage() {
  const s = await getSettings();

  const [aggregate] = await db
    .select({
      players: count(),
      coins: sql<number>`coalesce(sum(${users.coins}), 0)::int`,
      adsToday: sql<number>`coalesce(sum(${users.adsWatchedToday}), 0)::int`,
      buildings: sql<number>`coalesce(sum(
        (${users.assets}->>'solar')::int + (${users.assets}->>'windmill')::int + (${users.assets}->>'megafarm')::int
      ), 0)::int`,
    })
    .from(users);

  const [payout] = await db
    .select({
      paidOut: sql<number>`coalesce(sum(${withdrawals.amountUsd}), 0)::int`,
    })
    .from(withdrawals)
    .where(and(eq(withdrawals.status, "Approved"), gte(withdrawals.createdAt, sql`now() - interval '365 days'`)));

  const economy: Economy = {
    adRewardCoins: s.adRewardCoins,
    minWithdrawUsd: s.minWithdrawUsd,
    withdrawRate: s.withdrawRate,
    dailyAdCap: s.dailyAdCap,
    referralSharePercent: s.referralSharePercent,
    yieldCooldownHours: s.yieldCooldownHours,
    prices: {
      solar: s.solarPrice,
      windmill: s.windmillPrice,
      megafarm: s.megafarmPrice,
    },
    yields: ASSET_LIST.reduce(
      (acc, asset) => ({ ...acc, [asset.id]: asset.yieldPerDay }),
      {} as Economy["yields"],
    ),
  };

  const stats: LiveStats = {
    players: aggregate?.players ?? 0,
    coinsInCirculation: aggregate?.coins ?? 0,
    adsToday: aggregate?.adsToday ?? 0,
    buildings: aggregate?.buildings ?? 0,
    paidOutUsd: payout?.paidOut ?? 0,
  };

  return <LandingView economy={economy} stats={stats} />;
}
