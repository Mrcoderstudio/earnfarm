"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { setWithdrawalStatus, updateSettings, type AdminSettingsInput } from "@/app/actions";
import { formatCoins, formatDate, formatUsd, maskAccountNumber } from "@/lib/format";
import { Badge, Button, Card, CoinAmount, Field, Meter, SectionTitle, Segmented } from "./ui";
import {
  AlertIcon,
  CheckIcon,
  ClockIcon,
  CoinIcon,
  PlayIcon,
  ShieldIcon,
  TrendIcon,
  UsersIcon,
  WalletIcon,
  CloseIcon,
} from "./icons";
import { pushToast } from "./toast";

export type AdminData = {
  stats: {
    totalUsers: number;
    newUsersToday: number;
    coinsInCirculation: number;
    totalEarnedAllTime: number;
    pendingCount: number;
    pendingUsd: number;
    paidOutUsd: number;
    rejectedCount: number;
    adsWatchedToday: number;
    fleetSize: number;
    referredPlayers: number;
  };
  pending: {
    id: string;
    reference: string;
    userName: string;
    userEmail: string;
    amountUsd: number;
    coinsSpent: number;
    paymentMethod: string;
    accountNumber: string;
    accountName: string;
    createdAt: string;
  }[];
  recent: {
    id: string;
    reference: string;
    userName: string;
    amountUsd: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }[];
  leaderboard: {
    id: string;
    name: string;
    email: string;
    coins: number;
    totalEarned: number;
    adsWatchedToday: number;
    buildings: number;
  }[];
  economy: AdminSettingsInput & { paidOutUsd: number };
  withdrawRate: number;
};

export function AdminPanel({ data }: { data: AdminData }) {
  const router = useRouter();
  const [tab, setTab] = useState<"queue" | "economy" | "players">("queue");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminSettingsInput>({
    adRewardCoins: data.economy.adRewardCoins,
    minWithdrawUsd: data.economy.minWithdrawUsd,
    withdrawRate: data.economy.withdrawRate,
    dailyAdCap: data.economy.dailyAdCap,
    yieldCooldownHours: data.economy.yieldCooldownHours,
    referralSharePercent: data.economy.referralSharePercent,
    solarPrice: data.economy.solarPrice,
    windmillPrice: data.economy.windmillPrice,
    megafarmPrice: data.economy.megafarmPrice,
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const pending = useMemo(
    () =>
      data.pending.filter(
        (row) =>
          !search.trim() ||
          `${row.userName} ${row.userEmail} ${row.reference}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [data.pending, search],
  );

  async function decide(id: string, status: "Approved" | "Rejected") {
    setBusyId(id);
    const result = await setWithdrawalStatus({ withdrawalId: id, status });
    setBusyId(null);
    if (result.ok) {
      pushToast({ tone: status === "Approved" ? "success" : "error", title: `${status}`, body: result.message });
      router.refresh();
    } else {
      pushToast({ tone: "error", title: "Action failed", body: result.error });
    }
  }

  async function saveEconomy() {
    setSaving(true);
    const result = await updateSettings(form);
    setSaving(false);
    if (result.ok) {
      pushToast({ tone: "success", title: "Economy updated", body: result.message });
      router.refresh();
    } else {
      pushToast({ tone: "error", title: "Rejected", body: result.error });
    }
  }

  const num = (key: keyof AdminSettingsInput) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value === "" ? "" : Number(value) }));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total farmers"
          value={formatCoins(data.stats.totalUsers)}
          note={`+${data.stats.newUsersToday} today · ${data.stats.referredPlayers} referred`}
          icon={<UsersIcon className="size-5" />}
          tone="neon"
        />
        <Kpi
          label="Coins in circulation"
          value={formatCoins(data.stats.coinsInCirculation)}
          note={`${formatUsd(data.stats.coinsInCirculation / data.withdrawRate, 2)} liability · ${formatCoins(
            data.stats.totalEarnedAllTime,
          )} earned all-time`}
          icon={<CoinIcon className="size-5" />}
          tone="gold"
        />
        <Kpi
          label="Pending payouts"
          value={formatUsd(data.stats.pendingUsd, 2)}
          note={`${data.stats.pendingCount} request${data.stats.pendingCount === 1 ? "" : "s"} in the queue`}
          icon={<WalletIcon className="size-5" />}
          tone={data.stats.pendingCount > 0 ? "danger" : "neon"}
        />
        <Kpi
          label="Paid out"
          value={formatUsd(data.stats.paidOutUsd, 2)}
          note={`${data.stats.rejectedCount} rejected · ${formatCoins(data.stats.fleetSize)} machines built`}
          icon={<TrendIcon className="size-5" />}
          tone="sky"
        />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "queue", label: `Payout queue (${data.pending.length})`, icon: <WalletIcon className="size-4" /> },
          { value: "economy", label: "Economy", icon: <ShieldIcon className="size-4" /> },
          { value: "players", label: "Leaderboard", icon: <UsersIcon className="size-4" /> },
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === "queue" ? (
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4">
                <SectionTitle eyebrow="Manual review" title="Withdrawal requests" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search farmer, email or reference"
                  className="h-10 w-full max-w-xs rounded-2xl border border-line/70 bg-deep-2/70 px-3.5 text-sm text-ice outline-none transition placeholder:text-mist/50 focus:border-neon/50"
                />
              </div>

              {pending.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-neon/30 bg-neon/[0.07] text-neon">
                    <CheckIcon className="size-6" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ice">Queue is clear</p>
                  <p className="mt-1 text-xs text-mist">
                    No player is waiting on a payout{search ? " matching that search" : ""}.
                  </p>
                </div>
              ) : (
                <div className="thin-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-line/60 text-[10px] uppercase tracking-[0.16em] text-mist/80">
                        <Th>Farmer</Th>
                        <Th>Amount</Th>
                        <Th>Coins debited</Th>
                        <Th>Destination</Th>
                        <Th>Requested</Th>
                        <Th className="text-right">Decision</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((row) => (
                        <tr key={row.id} className="border-b border-line/40 transition hover:bg-white/[0.02]">
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-ice">{row.userName}</p>
                            <p className="text-[11px] text-mist">{row.userEmail}</p>
                            <p className="num mt-0.5 text-[10px] tracking-wide text-neon/80">{row.reference}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="num text-base font-bold text-gold">
                              {formatUsd(row.amountUsd, 2)}
                            </span>
                          </td>
                          <td className="num px-4 py-3.5 text-mist">{formatCoins(row.coinsSpent)}</td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-semibold text-ice">{row.paymentMethod}</p>
                            <p className="num text-[11px] text-mist">
                              {maskAccountNumber(row.accountNumber)}
                            </p>
                            <p className="text-[11px] text-mist/80">{row.accountName}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="flex items-center gap-1.5 text-xs text-mist">
                              <ClockIcon className="size-3.5" />
                              {formatDate(row.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                loading={busyId === row.id}
                                onClick={() => decide(row.id, "Approved")}
                                icon={<CheckIcon className="size-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                loading={busyId === row.id}
                                onClick={() => decide(row.id, "Rejected")}
                                icon={<CloseIcon className="size-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-line/60 px-5 py-3 text-[11px] text-mist">
                <AlertIcon className="size-3.5 text-gold" />
                Rejecting a request returns{" "}
                <span className="num font-semibold text-ice">coinsSpent</span> to the farmer&apos;s wallet
                inside the same transaction — no manual refunds.
              </div>
            </Card>
          ) : null}

          {tab === "economy" ? (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="p-5 sm:p-6">
                <SectionTitle
                  eyebrow="Live parameters"
                  title="Economy control"
                  action={
                    <Badge tone="neon">
                      <span className="size-1.5 rounded-full bg-neon" />
                      writes to settings
                    </Badge>
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Ad reward (coins)" inputMode="numeric" value={String(form.adRewardCoins)} onChange={(e) => num("adRewardCoins")(e.target.value)} />
                  <Field label="Daily ad cap" inputMode="numeric" value={String(form.dailyAdCap)} onChange={(e) => num("dailyAdCap")(e.target.value)} />
                  <Field label="Harvest cooldown (hours)" inputMode="numeric" value={String(form.yieldCooldownHours)} onChange={(e) => num("yieldCooldownHours")(e.target.value)} />
                  <Field label="Referral share (%)" inputMode="numeric" value={String(form.referralSharePercent)} onChange={(e) => num("referralSharePercent")(e.target.value)} />
                  <Field label="Minimum payout (USD)" inputMode="numeric" value={String(form.minWithdrawUsd)} onChange={(e) => num("minWithdrawUsd")(e.target.value)} />
                  <Field label="Coins per $1" inputMode="numeric" value={String(form.withdrawRate)} onChange={(e) => num("withdrawRate")(e.target.value)} />
                  <Field label="Solar price" inputMode="numeric" value={String(form.solarPrice)} onChange={(e) => num("solarPrice")(e.target.value)} />
                  <Field label="Windmill price" inputMode="numeric" value={String(form.windmillPrice)} onChange={(e) => num("windmillPrice")(e.target.value)} />
                  <Field label="MegaFarm price" inputMode="numeric" value={String(form.megafarmPrice)} onChange={(e) => num("megafarmPrice")(e.target.value)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={saveEconomy} loading={saving} icon={<CheckIcon className="size-4" />}>
                    Publish changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setForm({
                        adRewardCoins: data.economy.adRewardCoins,
                        minWithdrawUsd: data.economy.minWithdrawUsd,
                        withdrawRate: data.economy.withdrawRate,
                        dailyAdCap: data.economy.dailyAdCap,
                        yieldCooldownHours: data.economy.yieldCooldownHours,
                        referralSharePercent: data.economy.referralSharePercent,
                        solarPrice: data.economy.solarPrice,
                        windmillPrice: data.economy.windmillPrice,
                        megafarmPrice: data.economy.megafarmPrice,
                      })
                    }
                  >
                    Revert
                  </Button>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
                    Projected impact
                  </p>
                  <div className="mt-3 space-y-3">
                    <Preview
                      label="Daily ad inflation per player"
                      value={`${formatCoins(Number(form.dailyAdCap) * Number(form.adRewardCoins))} coins`}
                      note={`${formatUsd((Number(form.dailyAdCap) * Number(form.adRewardCoins)) / (Number(form.withdrawRate) || 1), 4)} liability`}
                    />
                    <Preview
                      label="Solar payback"
                      value={`${Math.max(1, Math.ceil(Number(form.solarPrice) / 10))} harvests`}
                      note="Solar yields 10 coins per harvest"
                    />
                    <Preview
                      label="MegaFarm payback"
                      value={`${Math.max(1, Math.ceil(Number(form.megafarmPrice) / 200))} harvests`}
                      note="Mega Farm yields 200 coins per harvest"
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
                    <PlayIcon className="size-4 text-sky" />
                    Network activity today
                  </p>
                  <p className="num mt-2 text-3xl font-bold text-ice">{formatCoins(data.stats.adsWatchedToday)}</p>
                  <p className="mt-1 text-xs text-mist">ads completed across all accounts</p>
                  <Meter value={Math.min(100, (data.stats.adsWatchedToday / 10) * 100)} tone="sky" className="mt-3" />
                </Card>
              </div>
            </div>
          ) : null}

          {tab === "players" ? (
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="overflow-hidden">
                <div className="border-b border-line/60 px-5 py-4">
                  <SectionTitle eyebrow="Rich list" title="Top wallets" />
                </div>
                <div className="thin-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-line/60 text-[10px] uppercase tracking-[0.16em] text-mist/80">
                        <Th>#</Th>
                        <Th>Farmer</Th>
                        <Th>Wallet</Th>
                        <Th>Lifetime</Th>
                        <Th>Machines</Th>
                        <Th>Ads today</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.map((row, index) => (
                        <tr key={row.id} className="border-b border-line/40 transition hover:bg-white/[0.02]">
                          <td className="num px-4 py-3 text-mist">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-ice">{row.name}</p>
                            <p className="text-[11px] text-mist">{row.email}</p>
                          </td>
                          <td className="num px-4 py-3 font-bold text-gold">{formatCoins(row.coins)}</td>
                          <td className="num px-4 py-3 text-mist">{formatCoins(row.totalEarned)}</td>
                          <td className="num px-4 py-3 text-neon">{row.buildings}</td>
                          <td className="num px-4 py-3 text-mist">{row.adsWatchedToday}</td>
                        </tr>
                      ))}
                      {data.leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-xs text-mist">
                            No registered farmers yet — the table fills the moment someone signs up.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle eyebrow="Audit trail" title="Latest decisions" />
                {data.recent.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line/70 px-4 py-10 text-center text-xs text-mist">
                    No withdrawal requests have been recorded.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data.recent.slice(0, 10).map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line/60 bg-white/[0.02] px-3.5 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-ice">
                            {row.userName} · {formatUsd(row.amountUsd, 2)}
                          </span>
                          <span className="num block text-[10px] text-mist/80">{row.reference}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] text-mist">{row.paymentMethod}</span>
                          <Badge
                            tone={
                              row.status === "Approved" ? "neon" : row.status === "Rejected" ? "danger" : "gold"
                            }
                          >
                            {row.status}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tone: "neon" | "gold" | "sky" | "danger";
}) {
  const tones = {
    neon: "text-neon border-neon/30 bg-neon/[0.07]",
    gold: "text-gold border-gold/30 bg-gold/[0.07]",
    sky: "text-sky border-sky/30 bg-sky/[0.07]",
    danger: "text-danger border-danger/35 bg-danger/[0.08]",
  } as const;
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
      <Card className="h-full p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">{label}</p>
          <span className={`grid size-9 place-items-center rounded-2xl border ${tones[tone]}`}>{icon}</span>
        </div>
        <p className="num mt-2 text-2xl font-bold text-ice">{value}</p>
        <p className="mt-1 text-[11px] leading-snug text-mist/85">{note}</p>
      </Card>
    </motion.div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-semibold ${className}`}>{children}</th>;
}

function Preview({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-white/[0.02] px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">{label}</p>
      <p className="num mt-1 text-lg font-bold text-ice">{value}</p>
      <p className="text-[11px] text-mist/85">{note}</p>
    </div>
  );
}

export function AdminWalletCard({ coins, usd }: { coins: number; usd: number }) {
  /* operator wallet strip, reused by the admin shell header */
  return (
    <span className="flex items-center gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-3 py-2">
      <CoinIcon className="size-4 text-gold" />
      <CoinAmount coins={coins} size="sm" className="font-bold" />
      <span className="num hidden text-[11px] text-mist sm:inline">≈ {formatUsd(usd)}</span>
    </span>
  );
}


