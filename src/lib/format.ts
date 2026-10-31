export function formatCoins(value: number): string {
  return Math.trunc(value).toLocaleString("en-US");
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(Math.trunc(value));
}

export function usdFromCoins(coins: number, rate: number): number {
  if (!rate || rate <= 0) return 0;
  return coins / rate;
}

export function formatUsd(value: number, fractionDigits = 4): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 1 ? 2 : fractionDigits,
    maximumFractionDigits: value >= 1 ? 2 : fractionDigits,
  }).format(value);
}

/** 26h 12m — used for cooldown chips. */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatClock(ms: number): string {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Server-side day bucket used to reset the daily ad counter. */
export function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function maskAccountNumber(account: string): string {
  if (account.length <= 4) return account;
  return `${"•".repeat(Math.max(0, account.length - 4))}${account.slice(-4)}`;
}
