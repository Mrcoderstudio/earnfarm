import { EMPTY_ASSETS, type Settings, type User, type UserAssets } from "@/db/schema";
import { computeDailyYield } from "@/lib/assets";
import { dayKey, formatDuration } from "@/lib/format";

/** Shape shared by every mutating server action so the client can update instantly. */
export type WalletSnapshot = {
  coins: number;
  assets: UserAssets;
  dailyYield: number;
  adsWatchedToday: number;
  adCapRemaining: number;
  nextClaimAt: number | null;
  cooldownLabel: string | null;
  usd: number;
};

export function parseAssets(raw: UserAssets | null | undefined): UserAssets {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ASSETS };
  return {
    solar: Number.isFinite(raw.solar) ? Math.max(0, Math.trunc(raw.solar)) : 0,
    windmill: Number.isFinite(raw.windmill) ? Math.max(0, Math.trunc(raw.windmill)) : 0,
    megafarm: Number.isFinite(raw.megafarm) ? Math.max(0, Math.trunc(raw.megafarm)) : 0,
  };
}

export function buildSnapshot(user: User, s: Settings): WalletSnapshot {
  const assets = parseAssets(user.assets);
  const cooldownMs = s.yieldCooldownHours * 60 * 60 * 1000;
  const nextClaimAt = user.lastYieldClaim
    ? new Date(user.lastYieldClaim).getTime() + cooldownMs
    : null;
  const remaining = nextClaimAt ? nextClaimAt - Date.now() : 0;
  const watchedToday = user.lastAdDate === dayKey() ? user.adsWatchedToday : 0;

  return {
    coins: user.coins,
    assets,
    dailyYield: computeDailyYield(assets),
    adsWatchedToday: watchedToday,
    adCapRemaining: Math.max(0, s.dailyAdCap - watchedToday),
    nextClaimAt,
    cooldownLabel: nextClaimAt && remaining > 0 ? formatDuration(remaining) : null,
    usd: s.withdrawRate > 0 ? user.coins / s.withdrawRate : 0,
  };
}
