"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCoins } from "@/lib/format";
import { ASSET_ICONS, BoltIcon, CoinIcon, GiftIcon, LinkIcon } from "./icons";
import { Logo } from "./logo";

export type Economy = {
  adRewardCoins: number;
  minWithdrawUsd: number;
  withdrawRate: number;
  dailyAdCap: number;
  referralSharePercent: number;
  yieldCooldownHours: number;
  prices: Record<"solar" | "windmill" | "megafarm", number>;
  yields: Record<"solar" | "windmill" | "megafarm", number>;
};

export type LiveStats = {
  players: number;
  buildings: number;
  coinsInCirculation: number;
  adsToday: number;
  paidOutUsd: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function LandingView({ economy, stats }: { economy: Economy; stats: LiveStats }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <LandingNav />
      <Hero economy={economy} stats={stats} />
      <LiveBoard economy={economy} stats={stats} />
      <HowItWorks economy={economy} />
      <AssetShowcase economy={economy} />
      <ReferralBlock economy={economy} />
      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/40 bg-deep/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-mist md:flex">
          <a href="#economy" className="transition hover:text-ice">
            Economy
          </a>
          <a href="#how" className="transition hover:text-ice">
            How it works
          </a>
          <a href="#store" className="transition hover:text-ice">
            Assets
          </a>
          <a href="#referral" className="transition hover:text-ice">
            Referrals
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className="h-10 rounded-2xl border border-line/70 px-4 text-sm font-semibold text-ice transition hover:border-neon/40 hover:text-neon"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center rounded-2xl bg-neon px-4 text-sm font-bold text-[#04240f] shadow-[0_16px_36px_-18px_rgba(0,230,118,0.9)] transition hover:bg-neon-2 sm:inline-flex"
          >
            Start farming
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ economy, stats }: { economy: Economy; stats: LiveStats }) {
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
      <div>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neon"
        >
          <BoltIcon className="size-3.5" />
          Play-to-earn simulation · live economy
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.06 }}
          className="display mt-5 text-4xl font-bold leading-[1.03] text-ice sm:text-6xl lg:text-[68px]"
        >
          Build the farm.
          <br />
          Harvest coins.
          <br />
          <span className="bg-gradient-to-r from-neon via-neon-2 to-gold bg-clip-text text-transparent text-shadow-neon">
            Cash out real money.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
          className="mt-5 max-w-xl text-[15px] leading-relaxed text-mist sm:text-base"
        >
          Buy solar arrays, wind turbines and mega farm domes. Every asset yields coins on a 24-hour
          harvest cycle. Watch rewarded ads for instant income, invite neighbours for a{" "}
          {economy.referralSharePercent}% lifetime commission, then withdraw straight to JazzCash or
          Easypaisa from <span className="font-semibold text-ice">${economy.minWithdrawUsd}</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link
            href="/signup"
            className="inline-flex h-13 items-center gap-2 rounded-2xl bg-neon px-6 py-3.5 text-[15px] font-bold text-[#04240f] shadow-[0_22px_50px_-20px_rgba(0,230,118,0.95)] transition hover:bg-neon-2"
          >
            Create free farm
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
            </svg>
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 rounded-2xl border border-line/80 px-5 py-3.5 text-[15px] font-semibold text-ice transition hover:border-neon/40 hover:text-neon"
          >
            I already farm here
          </Link>
        </motion.div>

        <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3">
          {[
            { label: "Farmers", value: formatCoins(stats.players) },
            { label: "Coins in play", value: formatCoins(stats.coinsInCirculation) },
            { label: "Paid out", value: `$${formatCoins(stats.paidOutUsd)}` },
          ].map((item) => (
            <div key={item.label} className="glass-soft rounded-2xl px-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist/80">
                {item.label}
              </dt>
              <dd className="num mt-1 text-lg font-bold text-ice">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ConsolePreview economy={economy} />
    </section>
  );
}

/** Decorative product preview — every number comes from the live settings row. */
function ConsolePreview({ economy }: { economy: Economy }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulse((value) => (value + 1) % 4), 2200);
    return () => clearInterval(id);
  }, []);

  const rows = [
    { key: "solar", label: "Solar array", owned: 3 },
    { key: "windmill", label: "Wind turbine", owned: 2 },
    { key: "megafarm", label: "Mega farm dome", owned: 1 },
  ] as const;

  const daily = rows.reduce((sum, row) => sum + row.owned * economy.yields[row.key], 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
      className="relative mx-auto w-full max-w-[420px]"
    >
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-neon/20 via-transparent to-gold/20 blur-2xl" />
      <div className="glass overflow-hidden rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-mist">
            <span className="size-2 animate-pulse-ring rounded-full bg-neon" />
            farm console
          </span>
          <span className="num rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold">
            {formatCoins(daily)} / day
          </span>
        </div>

        <p className="num mt-4 flex items-center gap-2 text-4xl font-bold text-ice">
          <CoinIcon className="size-8 text-gold" />
          {formatCoins(128450 + pulse * 640)}
        </p>
        <p className="mt-1 text-xs text-mist">
          ≈ ${(128450 / economy.withdrawRate).toFixed(2)} balance ·{" "}
          {economy.withdrawRate.toLocaleString("en-US")} coins = $1
        </p>

        <div className="mt-5 space-y-2.5">
          {rows.map((row) => {
            const Icon = ASSET_ICONS[row.key];
            return (
              <div
                key={row.key}
                className="flex items-center gap-3 rounded-2xl border border-line/60 bg-white/[0.03] px-3 py-2.5"
              >
                <span className="grid size-9 place-items-center rounded-xl border border-neon/25 bg-neon/[0.08] text-neon">
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ice">{row.label}</span>
                  <span className="num block text-[11px] text-mist">
                    {row.owned} × {economy.yields[row.key]} coins/day
                  </span>
                </span>
                <span className="num text-xs font-bold text-gold">
                  +{formatCoins(row.owned * economy.yields[row.key])}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-neon/25 bg-neon/[0.06] px-3 py-2.5">
          <span className="flex items-center gap-2 text-[13px] font-semibold text-neon">
            <GiftIcon className="size-4" />
            Rewarded ad · {economy.dailyAdCap}/day
          </span>
          <span className="num text-[13px] font-bold text-ice">
            +{formatCoins(economy.adRewardCoins)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LiveBoard({ economy, stats }: { economy: Economy; stats: LiveStats }) {
  const items = [
    { label: "Ad reward", value: `${formatCoins(economy.adRewardCoins)} coins`, note: "per 10s ad" },
    { label: "Daily ad cap", value: `${economy.dailyAdCap}`, note: "resets every day" },
    { label: "Harvest cycle", value: `${economy.yieldCooldownHours}h`, note: "per player" },
    { label: "Cash-out rate", value: `${formatCoins(economy.withdrawRate)} = $1`, note: "admin controlled" },
    { label: "Minimum payout", value: `$${economy.minWithdrawUsd}`, note: "JazzCash / Easypaisa" },
    { label: "Referral cut", value: `${economy.referralSharePercent}%`, note: "lifetime on ad rewards" },
    { label: "Buildings owned", value: formatCoins(stats.buildings), note: "across all farms" },
    { label: "Ads watched today", value: formatCoins(stats.adsToday), note: "network-wide" },
  ];

  return (
    <section id="economy" className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: EASE, delay: index * 0.04 }}
            className="glass-soft rounded-2xl px-4 py-3.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist/80">
              {item.label}
            </p>
            <p className="num mt-1.5 text-lg font-bold text-ice">{item.value}</p>
            <p className="text-[11px] text-mist/80">{item.note}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ economy }: { economy: Economy }) {
  const steps = [
    {
      title: "Claim your starter coins",
      body: `Watch a rewarded ad — ${economy.adRewardCoins} coins land in your wallet instantly. Ten ads a day, every day.`,
    },
    {
      title: "Reinvest into assets",
      body: "Solar panels are cheap and steady. Mega farm domes are expensive but print coins. Compounding is the whole game.",
    },
    {
      title: "Harvest every 24 hours",
      body: "Tap harvest once a day and the full fleet yield is credited to your balance in the same transaction.",
    },
    {
      title: "Withdraw to your wallet",
      body: "Request JazzCash or Easypaisa payouts. An operator approves and the money moves — rejected requests refund your coins automatically.",
    },
  ];

  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon/80">
          The loop
        </p>
        <h2 className="display mt-2 text-3xl font-bold text-ice sm:text-4xl">
          Four moves, repeated until the payout clears
        </h2>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE, delay: index * 0.06 }}
            className="glass relative overflow-hidden rounded-3xl p-5"
          >
            <span className="shine pointer-events-none absolute inset-0 opacity-30" />
            <span className="num text-4xl font-bold text-neon/25">0{index + 1}</span>
            <h3 className="mt-2 text-lg font-bold text-ice">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{step.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function AssetShowcase({ economy }: { economy: Economy }) {
  const items = [
    { key: "solar", name: "Solar Panel", tone: "text-sky", border: "border-sky/30" },
    { key: "windmill", name: "Wind Turbine", tone: "text-neon", border: "border-neon/35" },
    { key: "megafarm", name: "Mega Farm Dome", tone: "text-gold", border: "border-gold/35" },
  ] as const;

  return (
    <section id="store" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="glass relative overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="hair-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon/80">
                Store catalogue
              </p>
              <h2 className="display mt-2 text-2xl font-bold text-ice sm:text-3xl">
                Prices are live — pulled straight from the database
              </h2>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-neon/40 px-4 text-sm font-bold text-neon transition hover:bg-neon/10"
            >
              Open the store
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {items.map((item, index) => {
              const Icon = ASSET_ICONS[item.key];
              const price = economy.prices[item.key];
              const perDay = economy.yields[item.key];
              const days = Math.max(1, Math.ceil(price / perDay));
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE, delay: index * 0.08 }}
                  className={`glass-soft rounded-3xl border p-5 ${item.border}`}
                >
                  <span className={`grid size-11 place-items-center rounded-2xl bg-white/[0.04] ${item.tone}`}>
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ice">{item.name}</h3>
                  <p className="num mt-2 flex items-center gap-1.5 text-2xl font-bold text-gold">
                    <CoinIcon className="size-5" />
                    {formatCoins(price)}
                  </p>
                  <p className={`num mt-1 text-sm font-semibold ${item.tone}`}>
                    +{formatCoins(perDay)} coins / harvest
                  </p>
                  <p className="mt-3 text-xs text-mist">Breaks even in ~{days} harvests</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReferralBlock({ economy }: { economy: Economy }) {
  return (
    <section id="referral" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="grid items-center gap-6 rounded-[32px] border border-gold/25 bg-gradient-to-br from-gold/[0.08] via-transparent to-neon/[0.06] p-6 sm:p-9 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Referral engine
          </p>
          <h2 className="display mt-2 text-2xl font-bold text-ice sm:text-3xl">
            Earn {economy.referralSharePercent}% of everything your squad watches — forever
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist">
            Share your six-character code. When a friend watches an ad, {economy.referralSharePercent}%
            of the reward is written to your balance in the same database transaction. No caps, no
            expiry, no waiting for a sponsor to pay you.
          </p>
        </div>
        <Link
          href="/signup"
          className="inline-flex h-14 items-center gap-2 justify-self-start rounded-2xl bg-gold px-7 text-[15px] font-bold text-[#2a2100] shadow-[0_22px_50px_-22px_rgba(255,215,0,0.95)] transition hover:bg-gold-2 lg:justify-self-end"
        >
          <LinkIcon className="size-5" />
          Grab my referral code
        </Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-line/50 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-mist sm:flex-row sm:px-6">
        <span className="flex items-center gap-2">
          <Logo compact />© {new Date().getFullYear()} EarnFarm — simulation game, coins have value
          only as advertised payouts.
        </span>
        <span className="flex items-center gap-4">
          <Link href="/signin" className="transition hover:text-ice">
            Sign in
          </Link>
          <Link href="/signup" className="transition hover:text-ice">
            Register
          </Link>
        </span>
      </div>
    </footer>
  );
}
