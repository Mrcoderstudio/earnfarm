import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { withdrawals } from "@/db/schema";
import { ASSET_LIST, totalBuildings } from "@/lib/assets";
import { getSettings, getUserById } from "@/lib/data";
import { formatCoins, formatUsd } from "@/lib/format";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { AssetCard } from "@/components/asset-card";
import { Card, SectionTitle } from "@/components/ui";
import { CoinIcon, ShieldIcon, TrendIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const session = await requireUser();
  const [user, s] = await Promise.all([getUserById(session.id), getSettings()]);
  if (!user) redirect("/signin");

  const snapshot = buildSnapshot(user, s);
  const buildings = totalBuildings(snapshot.assets);

  const lastPayout = await db
    .select({ amountUsd: withdrawals.amountUsd, status: withdrawals.status })
    .from(withdrawals)
    .where(eq(withdrawals.userId, user.id))
    .orderBy(desc(withdrawals.createdAt))
    .limit(1);

  return (
    <div className="space-y-5">
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-10 -top-20 size-56 rounded-full bg-neon/20 blur-[80px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neon/85">
              Asset store
            </p>
            <h1 className="display mt-1.5 text-2xl font-bold text-ice sm:text-3xl">
              Turn coins into machines that print coins
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
              Prices below are read live from the <span className="font-semibold text-ice">settings</span>{" "}
              table — the operator can re-price the economy at any moment and this page reflects it on the
              next request.
            </p>
          </div>

          <div className="flex gap-2.5">
            <div className="glass-soft rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                Balance
              </p>
              <p className="num mt-1 flex items-center gap-1.5 text-xl font-bold text-ice">
                <CoinIcon className="size-4 text-gold" />
                {formatCoins(snapshot.coins)}
              </p>
              <p className="num mt-0.5 text-[11px] text-mist">≈ {formatUsd(snapshot.usd)}</p>
            </div>
            <div className="glass-soft rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                Fleet output
              </p>
              <p className="num mt-1 flex items-center gap-1.5 text-xl font-bold text-neon">
                <TrendIcon className="size-4" />
                +{formatCoins(snapshot.dailyYield)}
              </p>
              <p className="mt-0.5 text-[11px] text-mist">{buildings} machines running</p>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <SectionTitle
          eyebrow="Catalogue"
          title="Three tiers, one loop"
          action={
            <span className="hidden items-center gap-1.5 rounded-full border border-line/70 px-3 py-1.5 text-[11px] font-semibold text-mist sm:inline-flex">
              <ShieldIcon className="size-3.5 text-neon" />
              Purchases are debited server-side in one transaction
            </span>
          }
        />
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {ASSET_LIST.map((asset, index) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              index={index}
              price={s[asset.priceColumn]}
              coins={snapshot.coins}
              owned={snapshot.assets[asset.id]}
              snapshot={snapshot}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
            Cost of one full set
          </p>
          <p className="num mt-2 text-2xl font-bold text-ice">
            {formatCoins(s.solarPrice + s.windmillPrice + s.megafarmPrice)} coins
          </p>
          <p className="mt-1 text-xs text-mist">
            = {formatUsd((s.solarPrice + s.windmillPrice + s.megafarmPrice) / s.withdrawRate)} at the
            current cash-out rate
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
            Harvests from a full set
          </p>
          <p className="num mt-2 text-2xl font-bold text-neon">
            +{formatCoins(ASSET_LIST.reduce((sum, a) => sum + a.yieldPerDay, 0))} / day
          </p>
          <p className="mt-1 text-xs text-mist">One Solar + one Turbine + one Dome, claimed daily</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
            Withdrawal activity
          </p>
          <p className="num mt-2 text-2xl font-bold text-ice">
            {lastPayout[0] ? `${lastPayout[0].status} $${lastPayout[0].amountUsd}` : "None yet"}
          </p>
          <p className="mt-1 text-xs text-mist">
            Your latest payout request, straight from the withdrawals table
          </p>
        </Card>
      </div>
    </div>
  );
}
