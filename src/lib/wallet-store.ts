import { useSyncExternalStore } from "react";
import type { WalletSnapshot } from "@/lib/snapshot";

let current: WalletSnapshot | null = null;
const listeners = new Set<() => void>();

export function setWalletSnapshot(next: WalletSnapshot) {
  current = next;
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/**
 * Every server action returns a fresh, authoritative snapshot straight from
 * Postgres — we push it here so the sticky wallet HUD and the bottom nav stay
 * in sync with the database without a full route refetch.
 */
export function useWallet(fallback: WalletSnapshot | null = null): WalletSnapshot | null {
  const stored = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  return stored ?? fallback;
}
