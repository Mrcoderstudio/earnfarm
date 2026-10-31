"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { changePassword, updateFarmerName } from "@/app/actions";
import type { AssetId } from "@/db/schema";
import { ASSET_LIST } from "@/lib/assets";
import { formatCoins, formatDate, formatUsd } from "@/lib/format";
import { Badge, Button, Card, CoinAmount, Field, Meter, SectionTitle } from "./ui";
import { Avatar } from "./shell";
import {
  ASSET_ICONS,
  CheckIcon,
  CoinIcon,
  CopyIcon,
  GiftIcon,
  LinkIcon,
  LockIcon,
  LogoutIcon,
  ShieldIcon,
  UserIcon,
} from "./icons";
import { pushToast } from "./toast";

export type ProfileData = {
  name: string;
  email: string;
  referralCode: string;
  createdAt: string;
  coins: number;
  usd: number;
  totalEarned: number;
  referralEarned: number;
  adsWatchedTotal: number;
  isAdmin: boolean;
  withdrawRate: number;
  referralSharePercent: number;
  fleet: Record<AssetId, number>;
  invitedCount: number;
  withdrawnCoins: number;
  referred: { id: string; name: string; joinedAt: string; coins: number; adsWatchedTotal: number }[];
};

export function ProfileView({ data }: { data: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(data.name);
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function saveName() {
    setSavingName(true);
    const result = await updateFarmerName({ name: nameDraft });
    setSavingName(false);
    if (result.ok) {
      setEditing(false);
      pushToast({ tone: "success", title: "Farmer name updated", body: result.name });
      router.refresh();
    } else {
      pushToast({ tone: "error", title: "Name rejected", body: result.error });
    }
  }

  async function savePassword() {
    setPwError(null);
    if (pw.next !== pw.confirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    setSavingPw(true);
    const result = await changePassword({ currentPassword: pw.current, newPassword: pw.next });
    setSavingPw(false);
    if (result.ok) {
      setPw({ current: "", next: "", confirm: "" });
      pushToast({ tone: "success", title: "Password rotated", body: result.message });
    } else {
      setPwError(result.error);
    }
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast({ tone: "success", title: `${label} copied`, body: value });
    } catch {
      pushToast({ tone: "error", title: "Clipboard blocked", body: "Copy manually instead." });
    }
  }

  const fleetTotal = ASSET_LIST.reduce((sum, asset) => sum + data.fleet[asset.id], 0);
  const commissionUsd = data.referralEarned / data.withdrawRate;

  return (
    <div className="space-y-5">
      {/* identity */}
      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-sky/15 blur-[90px]" />
        <div className="relative flex flex-wrap items-start gap-5">
          <Avatar name={data.name} />
          <div className="min-w-[220px] flex-1">
            {editing ? (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <Field
                    label="Farmer name"
                    value={nameDraft}
                    maxLength={24}
                    onChange={(event) => setNameDraft(event.target.value)}
                  />
                </div>
                <Button onClick={saveName} loading={savingName}>
                  Save
                </Button>
                <Button variant="ghost" onClick={() => { setEditing(false); setNameDraft(data.name); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="display text-2xl font-bold text-ice">{data.name}</h1>
                  {data.isAdmin ? (
                    <Badge tone="neon">
                      <ShieldIcon className="size-3" />
                      operator
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-mist">{data.email}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist/85">
                  <span>Farmer since {formatDate(data.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="size-3.5" />
                    {fleetTotal} machines
                  </span>
                  <span className="flex items-center gap-1">
                    <GiftIcon className="size-3.5" />
                    {data.invitedCount} invited
                  </span>
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="glass-soft rounded-2xl px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                Wallet
              </p>
              <CoinAmount coins={data.coins} size="md" className="mt-1 justify-end font-bold" />
              <p className="num mt-0.5 text-[11px] text-neon">{formatUsd(data.usd)}</p>
            </div>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                Edit name
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Lifetime coins" value={formatCoins(data.totalEarned)} tone="gold" />
          <Metric label="Cashed out" value={formatCoins(data.withdrawnCoins)} tone="neon" />
          <Metric label="Ads completed" value={formatCoins(data.adsWatchedTotal)} tone="sky" />
        </div>
      </Card>

      {/* referral */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle
            eyebrow="Referral engine"
            title={`Your code earns ${data.referralSharePercent}% forever`}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.09] to-transparent p-4">
            <div className="min-w-[180px] flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/85">
                Referral code
              </p>
              <p className="num mt-1 text-3xl font-bold tracking-[0.14em] text-ice">
                {data.referralCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copy(data.referralCode, "Code")} icon={<CopyIcon className="size-4" />}>
                Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<LinkIcon className="size-4" />}
                onClick={() =>
                  copy(`${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${data.referralCode}`, "Invite link")
                }
              >
                Invite link
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line/70 bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                Commission earned
              </p>
              <p className="num mt-1.5 text-2xl font-bold text-neon">
                {formatCoins(data.referralEarned)}
              </p>
              <p className="num mt-0.5 text-[11px] text-mist">≈ {formatUsd(commissionUsd)}</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                Squad size
              </p>
              <p className="num mt-1.5 text-2xl font-bold text-ice">{data.invitedCount}</p>
              <p className="mt-0.5 text-[11px] text-mist">players using your code</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/80">
              Recent recruits
            </p>
            {data.referred.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line/70 px-4 py-6 text-center text-xs text-mist">
                Nobody yet — share your link and every ad they watch pays you commission.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.referred.map((recruit, index) => (
                  <motion.li
                    key={recruit.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 rounded-2xl border border-line/60 bg-white/[0.02] px-3.5 py-2.5"
                  >
                    <Avatar name={recruit.name} small />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ice">{recruit.name}</span>
                      <span className="block text-[11px] text-mist">
                        joined {formatDate(recruit.joinedAt)} · {formatCoins(recruit.adsWatchedTotal)} ads
                      </span>
                    </span>
                    <span className="num text-xs font-bold text-gold">
                      {formatCoins(recruit.coins)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              Fleet breakdown
            </p>
            <div className="mt-3 space-y-3">
              {ASSET_LIST.map((asset) => {
                const owned = data.fleet[asset.id];
                const Icon = ASSET_ICONS[asset.id];
                const share = fleetTotal ? (owned / fleetTotal) * 100 : 0;
                return (
                  <div key={asset.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 font-semibold text-ice">
                        <Icon className="size-4" style={{ color: asset.accent }} />
                        {asset.name}
                      </span>
                      <span className="num text-mist">
                        {owned} · +{formatCoins(owned * asset.yieldPerDay)}/day
                      </span>
                    </div>
                    <Meter value={share} tone={asset.id === "megafarm" ? "gold" : asset.id === "windmill" ? "neon" : "sky"} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              <LockIcon className="size-4 text-neon" />
              Security
            </p>
            <div className="mt-3 space-y-2.5">
              <Field
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={pw.current}
                onChange={(event) => setPw({ ...pw, current: event.target.value })}
              />
              <Field
                label="New password"
                type="password"
                hint="min 8 chars"
                autoComplete="new-password"
                value={pw.next}
                onChange={(event) => setPw({ ...pw, next: event.target.value })}
              />
              <Field
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={pw.confirm}
                error={pwError ?? undefined}
                onChange={(event) => setPw({ ...pw, confirm: event.target.value })}
              />
              <Button
                full
                variant="ghost"
                onClick={savePassword}
                loading={savingPw}
                disabled={!pw.current || !pw.next || !pw.confirm}
                icon={<CheckIcon className="size-4" />}
              >
                Rotate password
              </Button>
              <Button
                full
                variant="danger"
                icon={<LogoutIcon className="size-4" />}
                onClick={() => void signOut({ callbackUrl: "/signin" })}
              >
                Sign out
              </Button>
              <p className="text-[11px] leading-relaxed text-mist/85">
                Passwords are hashed with bcrypt (cost 12) at registration and on every rotation. The
                session lives in an httpOnly, SameSite=Lax cookie signed with your Auth.js secret.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "gold" | "neon" | "sky";
}) {
  const colors = { gold: "text-gold", neon: "text-neon", sky: "text-sky" } as const;
  return (
    <div className="glass-soft rounded-2xl px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
        <CoinIcon className="size-3.5" />
        {label}
      </p>
      <p className={`num mt-1.5 text-xl font-bold ${colors[tone]}`}>{value}</p>
    </div>
  );
}
