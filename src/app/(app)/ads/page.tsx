import { redirect } from "next/navigation";
import { getSettings, getUserById } from "@/lib/data";
import { formatCoins } from "@/lib/format";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { AdPlayer } from "@/components/ad-player";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { AlertIcon, CoinIcon, GiftIcon, PlayIcon, ShieldIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const session = await requireUser();
  const [user, s] = await Promise.all([getUserById(session.id), getSettings()]);
  if (!user) redirect("/signin");

  const snapshot = buildSnapshot(user, s);
  const earnedToday = snapshot.adsWatchedToday * s.adRewardCoins;
  const commission = Math.floor((s.adRewardCoins * s.referralSharePercent) / 100);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon/85">
                Rewarded inventory
              </p>
              <h1 className="display mt-1.5 text-2xl font-bold text-ice sm:text-3xl">
                Ad network · {s.dailyAdCap} rewards per day
              </h1>
            </div>
            <Badge tone="gold">
              <CoinIcon className="size-3.5" />
              {formatCoins(s.adRewardCoins)} per completed view
            </Badge>
          </div>
          <AdPlayer
            snapshot={snapshot}
            adRewardCoins={s.adRewardCoins}
            dailyAdCap={s.dailyAdCap}
            referralSharePercent={s.referralSharePercent}
            hasReferrer={Boolean(user.referredBy)}
          />
        </div>

        <div className="space-y-3">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              Today from ads
            </p>
            <p className="num mt-2 flex items-center gap-2 text-3xl font-bold text-gold">
              <CoinIcon className="size-6" />
              {formatCoins(earnedToday)}
            </p>
            <p className="mt-1 text-xs text-mist">
              {snapshot.adsWatchedToday} completed view{snapshot.adsWatchedToday === 1 ? "" : "s"} ·{" "}
              {snapshot.adCapRemaining} remaining
            </p>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              <GiftIcon className="size-4 text-neon" />
              Referral stream
            </p>
            {user.referredBy ? (
              <p className="mt-2 text-sm leading-relaxed text-mist">
                Each ad you finish automatically credits your inviter{" "}
                <span className="num font-bold text-neon">{formatCoins(commission)}</span> coins
                ({s.referralSharePercent}%) inside the same database transaction.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-mist">
                No inviter linked to this account. Share your code from the profile screen and start
                collecting {s.referralSharePercent}% of your squad&apos;s ad income.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              <ShieldIcon className="size-4 text-neon" />
              Verification rules
            </p>
            <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-mist">
              <li className="flex gap-2">
                <PlayIcon className="mt-0.5 size-3.5 shrink-0 text-sky" />
                The full {`10`}-second timer must elapse before the claim is accepted.
              </li>
              <li className="flex gap-2">
                <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-danger" />
                Daily cap ({s.dailyAdCap}) is enforced in Postgres, not the browser — refreshing does not
                reset it.
              </li>
              <li className="flex gap-2">
                <CoinIcon className="mt-0.5 size-3.5 shrink-0 text-gold" />
                The counter buckets by UTC day, so everyone shares the same reset moment.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <div>
        <SectionTitle eyebrow="Placement" title="SDK integration zone" />
        <Card className="relative overflow-hidden border-dashed p-6">
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
            <div className="hair-grid absolute inset-0" />
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ice">
                Adsterra / Monetag rewarded-video container
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-mist">
                The player above is the reward orchestration layer: it owns the timer, the server-side
                verification and the wallet write. Drop your network&apos;s rewarded-video script into the
                creative slot in{" "}
                <code className="rounded-md border border-line/70 bg-deep-2 px-1.5 py-0.5 text-[11px] text-neon">
                  src/components/ad-player.tsx
                </code>{" "}
                and fire the network&apos;s completion callback instead of the local timer. Nothing else
                has to change — <span className="text-ice">rewardAd()</span> already handles cap, credit
                and referral commission.
              </p>
            </div>
            <Badge tone="neon">
              <span className="size-1.5 rounded-full bg-neon" />
              server-verified rewards
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
