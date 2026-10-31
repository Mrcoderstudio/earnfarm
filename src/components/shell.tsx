"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import type { WalletSnapshot } from "@/app/actions";
import { refreshWallet } from "@/app/actions";
import { formatCoins, formatUsd } from "@/lib/format";
import { useWallet, setWalletSnapshot } from "@/lib/wallet-store";
import { Toaster } from "./toast";
import { Logo } from "./logo";
import { Badge } from "./ui";
import {
  CoinIcon,
  GiftIcon,
  HomeIcon,
  LogoutIcon,
  PlayIcon,
  ShieldIcon,
  StoreIcon,
  UserIcon,
  WalletIcon,
} from "./icons";

const NAV = [
  { href: "/dashboard", label: "Home", short: "Home", icon: HomeIcon },
  { href: "/store", label: "Store", short: "Store", icon: StoreIcon },
  { href: "/ads", label: "Watch Ads", short: "Ads", icon: PlayIcon },
  { href: "/profile", label: "Profile", short: "Profile", icon: UserIcon },
] as const;

const EXTRA = [{ href: "/withdraw", label: "Payouts", icon: WalletIcon }] as const;



export function AppShell({
  user,
  snapshot,
  isAdmin,
  children,
}: {
  user: { name: string; email: string; referralCode: string };
  snapshot: WalletSnapshot;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const wallet = useWallet(snapshot);
  const [busy, setBusy] = useState(false);

  // Keep the HUD honest: on every route change we re-read the wallet from Postgres.
  useEffect(() => {
    let cancelled = false;
    void refreshWallet().then((result) => {
      if (!cancelled && result.ok) setWalletSnapshot(result.snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh lg:pl-[268px]">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] flex-col border-r border-line/60 bg-deep-2/70 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>

        <div className="mt-6 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.09] to-transparent p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">
            Balance
          </p>
          <p className="num mt-1.5 flex items-center gap-1.5 text-3xl font-bold text-ice">
            <CoinIcon className="size-6 text-gold" />
            {formatCoins(wallet?.coins ?? snapshot.coins)}
          </p>
          <p className="mt-1 text-xs text-mist">
            ≈ {formatUsd(wallet?.usd ?? snapshot.usd)} ·{" "}
            <span className="text-neon">
              +{formatCoins(wallet?.dailyYield ?? snapshot.dailyYield)}/day
            </span>
          </p>
          <Link
            href="/withdraw"
            className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gold/40 text-[13px] font-semibold text-gold transition hover:bg-gold/10"
          >
            <WalletIcon className="size-4" />
            Cash out
          </Link>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70">
            Farm
          </p>
          {NAV.map((item) => (
            <SideLink key={item.href} item={item} activeFlag={active(item.href)} />
          ))}
          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70">
            Account
          </p>
          {EXTRA.map((item) => (
            <SideLink key={item.href} item={item} activeFlag={active(item.href)} />
          ))}
          {isAdmin ? (
            <SideLink
              item={{ href: "/admin", label: "Control panel", icon: ShieldIcon }}
              activeFlag={active("/admin")}
            />
          ) : null}
        </nav>

        <div className="rounded-2xl border border-line/70 bg-white/[0.03] p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ice">{user.name}</p>
              <p className="truncate text-[11px] text-mist">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setBusy(true);
                void signOut({ callbackUrl: "/signin" }).finally(() => {
                  setBusy(false);
                  router.replace("/signin");
                });
              }}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-line/70 text-mist transition hover:border-danger/50 hover:text-danger"
              aria-label="Sign out"
            >
              <LogoutIcon className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile / shared top bar ─────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-deep/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/dashboard" className="lg:hidden">
            <Logo />
          </Link>
          <div className="hidden lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mist/70">
              {labelFor(pathname)}
            </p>
            <p className="display text-lg font-bold text-ice">
              Welcome back, {user.name.split(" ")[0]}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/withdraw" className="lg:hidden">
              <span className="flex h-10 items-center gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-3">
                <CoinIcon className="size-4 text-gold" />
                <span className="num text-sm font-bold text-ice">
                  {formatCoins(wallet?.coins ?? snapshot.coins)}
                </span>
              </span>
            </Link>
            <span className="hidden h-10 items-center gap-2 rounded-2xl border border-neon/25 bg-neon/[0.07] px-3 sm:flex">
              <GiftIcon className="size-4 text-neon" />
              <span className="text-xs font-semibold text-neon">
                +{formatCoins(wallet?.dailyYield ?? snapshot.dailyYield)} / day
              </span>
            </span>
            <span className="lg:hidden">
              <Avatar name={user.name} small />
            </span>
          </div>
        </div>
      </header>

      {/* ── Page ────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:pt-7 lg:px-8 lg:pb-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <WalletBridge snapshot={snapshot} />
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-line/60 bg-deep/85 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
          {NAV.map((item) => {
            const isActive = active(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2"
              >
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-2xl border border-neon/30 bg-neon/10"
                  />
                ) : null}
                <span
                  className={`relative z-10 ${isActive ? "text-neon" : "text-mist"} ${
                    isActive ? "animate-pulse-ring rounded-xl" : ""
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={`relative z-10 text-[10px] font-semibold tracking-wide ${
                    isActive ? "text-neon" : "text-mist/80"
                  }`}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

/**
 * Server-rendered pages own the data; this bridge simply publishes the freshly
 * fetched snapshot into the client wallet store after every server revalidation.
 */
function WalletBridge({ snapshot }: { snapshot: WalletSnapshot }) {
  useEffect(() => {
    setWalletSnapshot(snapshot);
  }, [snapshot]);
  return null;
}

function SideLink({
  item,
  activeFlag,
}: {
  item: { href: string; label: string; icon: ComponentType<{ className?: string }> };
  activeFlag: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
        activeFlag ? "text-neon" : "text-mist hover:text-ice"
      }`}
    >
      {activeFlag ? (
        <motion.span
          layoutId="side-nav-active"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="absolute inset-0 rounded-2xl border border-neon/30 bg-neon/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        />
      ) : (
        <span className="absolute inset-0 rounded-2xl opacity-0 transition group-hover:bg-white/[0.04] group-hover:opacity-100" />
      )}
      <Icon className="relative z-10 size-5" />
      <span className="relative z-10">{item.label}</span>
      {activeFlag ? (
        <span className="relative z-10 ml-auto">
          <Badge tone="neon" className="!px-2 !py-0.5 !text-[9px]">
            live
          </Badge>
        </span>
      ) : null}
    </Link>
  );
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border border-neon/30 bg-gradient-to-br from-neon/25 to-sky/15 font-bold text-ice ${
        small ? "size-9 text-xs" : "size-10 text-sm"
      }`}
    >
      {initials || "EF"}
    </span>
  );
}

function labelFor(pathname: string): string {
  if (pathname.startsWith("/store")) return "Asset store";
  if (pathname.startsWith("/ads")) return "Ad network";
  if (pathname.startsWith("/withdraw")) return "Payout desk";
  if (pathname.startsWith("/profile")) return "Farmer profile";
  if (pathname.startsWith("/admin")) return "Operator console";
  return "Farm overview";
}
