"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { claimYield, type WalletSnapshot } from "@/app/actions";
import { ASSET_LIST } from "@/lib/assets";
import { formatCoins, formatUsd } from "@/lib/format";
import { setWalletSnapshot, useWallet } from "@/lib/wallet-store";
import {
  ASSET_ICONS,
  ArrowIcon,
  BoltIcon,
  CheckIcon,
  ClockIcon,
  CoinIcon,
  GiftIcon,
  LinkIcon,
  PlayIcon,
  TrendIcon,
  WalletIcon,
} from "./icons";
import { Badge, Button, Card, CoinAmount, Meter, SectionTitle } from "./ui";
import { pushToast } from "./toast";

export type DashboardData = {
  snapshot: WalletSnapshot;
  profile: {
    name: string;
    email: string;
    referralCode: string;
    totalEarned: number;
    referralEarned: number;
    adsWatchedTotal: number;
    hasFleet: boolean;
  };
  economy: {
    adRewardCoins: number;
    minWithdrawUsd: number;
    withdrawRate: number;
    dailyAdCap: number;
    yieldCooldownHours: number;
    referralSharePercent: number;
    solarPrice: number;
  };
  referrerName: string | null;
  payouts: {
    id: string;
    amountUsd: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function DashboardView({ data }: { data: DashboardData }) {
  const wallet = useWallet(data.snapshot) ?? data.snapshot;
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cooldownMs = useMemo(() => {
    if (!wallet.nextClaimAt) return 0;
    return Math.max(0, wallet.nextClaimAt - now);
  }, [wallet.nextClaimAt, now]);

  const harvestReady = data.profile.hasFleet && (wallet.nextClaimAt === null || cooldownMs === 0);
  const cooldownLabel = useMemo(() => {
    if (cooldownMs <= 0) return null;
    const total = Math.floor(cooldownMs / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [cooldownMs]);

  const payoutTargetCoins = data.economy.minWithdrawUsd * data.economy.withdrawRate;
  const payoutProgress = Math.min(100, (wallet.coins / Math.max(1, payoutTargetCoins)) * 100);

  const onClaim = useCallback(async () => {
    setClaiming(true);
    const result = await claimYield();
    setClaiming(false);
    if (result.ok) {
      setWalletSnapshot(result.snapshot);
      pushToast({
        tone: "reward",
        title: `+${formatCoins(result.gained)} coins harvested`,
        body: `Balance synced with the database — ${formatUsd(result.snapshot.usd)} available.`,
      });
    } else {
      pushToast({ tone: "error", title: "Harvest blocked", body: result.error });
    }
  }, []);

  const copyInvite = useCallback(async () => {
    const link = `${location.origin}/signup?ref=${data.profile.referralCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join me on EarnFarm", text: `Use my code ${data.profile.referralCode}`, url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      pushToast({ tone: "success", title: "Invite link copied", body: link });
    } catch {
      pushToast({ tone: "error", title: "Copy failed", body: "Your browser blocked clipboard access." });
    }
  }, [data.profile.referralCode]);

  return (
    <div className="space-y-5">
      {/* ── Balance hero ─────────────────────────────── */}
      <Card className="relative overflow-hidden p-5 sm:p-7" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <div className="hair-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-neon/20 blur-[90px]" />

        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neon">
                <span className="size-1.5 rounded-full bg-neon" />
                live wallet
              </Badge>
              {data.referrerName ? (
                <Badge tone="gold">Invited by {data.referrerName}</Badge>
              ) : (
                <Badge tone="sky">Organic farmer</Badge>
              )}
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist">
              Total coins
            </p>
            <CoinAmount coins={wallet.coins} size="lg" className="mt-1.5 font-bold" />

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 text-mist">
                <WalletIcon className="size-4 text-gold" />
                Cash value
                <span className="num font-bold text-ice">{formatUsd(wallet.usd)}</span>
              </span>
              <span className="flex items-center gap-1.5 text-mist">
                <TrendIcon className="size-4 text-neon" />
                Fleet yield
                <span className="num font-bold text-neon">
                  +{formatCoins(wallet.dailyYield)}/day
                </span>
              </span>
            </div>

            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-mist">
                <span>Next payout unlock</span>
                <span className="num text-ice">
                  {formatUsd(data.economy.minWithdrawUsd)} · {formatCoins(payoutTargetCoins)} coins
                </span>
              </div>
              <Meter value={payoutProgress} tone={payoutProgress >= 100 ? "neon" : "gold"} />
              <p className="mt-2 text-xs text-mist">
                {payoutProgress >= 100 ? (
                  <span className="font-semibold text-neon">
                    Unlocked — you can request a payout right now.
                  </span>
                ) : (
                  <>
                    {formatCoins(Math.max(0, payoutTargetCoins - wallet.coins))} coins to go ·{" "}
                    {formatUsd(Math.max(0, payoutTargetCoins - wallet.coins) / data.economy.withdrawRate)} more
                  </>
                )}
              </p>
            </div>
          </div>

          {/* harvest module */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-neon/25 bg-gradient-to-br from-neon/[0.12] via-transparent to-transparent p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neon/85">
                Daily harvest
              </p>
              <p className="num mt-2 flex items-baseline gap-1.5 text-3xl font-bold text-ice">
                +{formatCoins(wallet.dailyYield)}
                <span className="text-xs font-semibold text-mist">coins</span>
              </p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-mist">
                <ClockIcon className="size-3.5" />
                {data.profile.hasFleet
                  ? cooldownLabel
                    ? `Ready in ${cooldownLabel}`
                    : "Ready now — one tap"
                  : "Buy an asset to start producing"}
              </p>
            </div>

            <Button
              onClick={onClaim}
              loading={claiming}
              disabled={!harvestReady || claiming}
              size="lg"
              full
              className="mt-4"
              icon={<BoltIcon className="size-4" />}
            >
              {data.profile.hasFleet ? (harvestReady ? "Harvest now" : "Cooling down") : "Open the store"}
            </Button>

            {!data.profile.hasFleet ? (
              <Link
                href="/store"
                className="mt-2 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-mist transition hover:text-neon"
              >
                Solar array from {formatCoins(data.economy.solarPrice)} coins
                <ArrowIcon className="size-3.5" />
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {/* ── Stat grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Ads left today"
          value={`${wallet.adCapRemaining}/${data.economy.dailyAdCap}`}
          note={`+${formatCoins(data.economy.adRewardCoins)} each`}
          icon={<PlayIcon className="size-4.5" />}
          tone="sky"
          href="/ads"
        />
        <StatTile
          label="Lifetime earned"
          value={formatCoins(data.profile.totalEarned)}
          note="coins from ads + harvests"
          icon={<CoinIcon className="size-4.5" />}
          tone="gold"
        />
        <StatTile
          label="Referral commission"
          value={formatCoins(data.profile.referralEarned)}
          note={`${data.economy.referralSharePercent}% of squad ad rewards`}
          icon={<GiftIcon className="size-4.5" />}
          tone="neon"
          href="/profile"
        />
        <StatTile
          label="Ads watched"
          value={formatCoins(data.profile.adsWatchedTotal)}
          note="lifetime on this account"
          icon={<CheckIcon className="size-4.5" />}
          tone="neutral"
        />
      </div>

      {/* ── Fleet + actions ──────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-5">
          <SectionTitle
            eyebrow="Production"
            title="Your fleet"
            action={
              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 rounded-xl border border-line/70 px-3 py-2 text-xs font-semibold text-mist transition hover:border-neon/40 hover:text-neon"
              >
                Expand fleet
                <ArrowIcon className="size-3.5" />
              </Link>
            }
          />
          <div className="space-y-2.5">
            {ASSET_LIST.map((asset) => {
              const owned = wallet.assets[asset.id] ?? 0;
              const Icon = ASSET_ICONS[asset.id];
              return (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35 }}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${
                    owned > 0 ? "border-line/70 bg-white/[0.035]" : "border-dashed border-line/50 bg-transparent opacity-70"
                  }`}
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl border"
                    style={{ borderColor: `${asset.accent}45`, background: `${asset.accent}12`, color: asset.accent }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ice">{asset.name}</span>
                    <span className="num block text-[11px] text-mist">
                      {owned} owned · {formatCoins(asset.yieldPerDay)} coins each
                    </span>
                  </span>
                  <span className="num text-sm font-bold" style={{ color: owned ? asset.accent : undefined }}>
                    {owned ? `+${formatCoins(owned * asset.yieldPerDay)}` : "—"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/80">
              Fast actions
            </p>
            <div className="mt-3 space-y-2">
              <Link href="/ads" className="block">
                <Button full variant="ghost" size="md" icon={<PlayIcon className="size-4 text-sky" />}>
                  Watch ad · +{formatCoins(data.economy.adRewardCoins)}
                </Button>
              </Link>
              <Link href="/withdraw" className="block">
                <Button full variant="ghost" size="md" icon={<WalletIcon className="size-4 text-gold" />}>
                  Request payout
                </Button>
              </Link>
              <Button full variant="outline" size="md" onClick={copyInvite} icon={<LinkIcon className="size-4" />}>
                Copy invite link
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-mist/80">
              Your code <span className="num font-bold text-neon">{data.profile.referralCode}</span> earns you{" "}
              {data.economy.referralSharePercent}% of every ad reward your friends collect.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/80">
              Recent payouts
            </p>
            {data.payouts.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-mist">
                No withdrawal requests yet. Hit {formatUsd(data.economy.minWithdrawUsd)} in your wallet and
                the payout desk opens.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.payouts.map((payout) => (
                  <li key={payout.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ice">
                        {payout.paymentMethod} · {formatUsd(payout.amountUsd, 2)}
                      </span>
                      <span className="block text-mist/80">
                        {new Date(payout.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                    <StatusPill status={payout.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  note,
  icon,
  tone,
  href,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone: "neon" | "gold" | "sky" | "neutral";
  href?: string;
}) {
  const tones = {
    neon: "text-neon border-neon/25",
    gold: "text-gold border-gold/25",
    sky: "text-sky border-sky/25",
    neutral: "text-mist border-line/70",
  } as const;

  const body = (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
      <Card className="h-full p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">{label}</p>
          <span className={`grid size-8 place-items-center rounded-xl border bg-white/[0.03] ${tones[tone]}`}>
            {icon}
          </span>
        </div>
        <p className="num mt-2.5 text-2xl font-bold text-ice">{value}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-mist/85">{note}</p>
      </Card>
    </motion.div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

function StatusPill({ status }: { status: string }) {
  const tone = status === "Approved" ? "neon" : status === "Rejected" ? "danger" : "gold";
  return <Badge tone={tone as "neon" | "danger" | "gold"}>{status}</Badge>;
}


