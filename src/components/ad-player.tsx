"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { rewardAd } from "@/app/actions";
import type { WalletSnapshot } from "@/lib/snapshot";
import { formatCoins } from "@/lib/format";
import { setWalletSnapshot } from "@/lib/wallet-store";
import { AlertIcon, BoltIcon, CheckIcon, ClockIcon, CoinIcon, PlayIcon } from "./icons";
import { Badge, Button, Card, Meter } from "./ui";
import { pushToast } from "./toast";

const AD_SECONDS = 10;
const TICK_MS = 100;
// Aapka Adsterra Smartlink yahan hai
const ADSTERRA_LINK = "https://asiafilm.org/4/0c5d0487671cad28610cb5108e9d7321";

type Phase = "ready" | "playing" | "rewarded";

export function AdPlayer({
  snapshot,
  adRewardCoins,
  dailyAdCap,
  hasReferrer, // Isko rehne dein, error na aaye isliye
}: {
  snapshot: WalletSnapshot;
  adRewardCoins: number;
  dailyAdCap: number;
  referralSharePercent: number;
  hasReferrer: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [remaining, setRemaining] = useState(AD_SECONDS * 1000);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(0);
  const claimInFlight = useRef(false);

  const lock = snapshot.adCapRemaining <= 0;

  // Naya Timer Logic: Tab background mein jane par bhi sahi chalega
  useEffect(() => {
    if (phase !== "playing") return;

    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const left = Math.max(0, (AD_SECONDS * 1000) - elapsed);

      setRemaining(left);

      if (left <= 0) {
        clearInterval(id);
        void finish();
      }
    }, TICK_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = useCallback(() => {
    if (lock || phase !== "ready") return;

    // Pehle timer shuru karein
    setError(null);
    setRemaining(AD_SECONDS * 1000);
    startedAt.current = Date.now();
    setPhase("playing");

    // Phir ad kholen (100ms baad taake UI update ho jaye)
    setTimeout(() => {
      window.open(ADSTERRA_LINK, "_blank");
    }, 100);

  }, [lock, phase]);

  const finish = useCallback(async () => {
    if (claimInFlight.current) return;
    claimInFlight.current = true;
    const elapsed = Date.now() - startedAt.current;

    // Security check: Kam az kam 9.5 second poore hone chahiye
    if (elapsed < AD_SECONDS * 1000 - 500) {
      claimInFlight.current = false;
      setError("Ad was skipped — it must play to completion.");
      setPhase("ready");
      return;
    }

    const result = await rewardAd();
    claimInFlight.current = false;

    if (result.ok) {
      setWalletSnapshot(result.snapshot);
      setPhase("rewarded");
      pushToast({
        tone: "reward",
        title: `+${formatCoins(result.reward)} coins credited`,
        body: `Written to your wallet · ${result.remainingToday} ads left today.`,
      });
      setTimeout(() => setPhase("ready"), 2200);
    } else {
      setError(result.error);
      setPhase("ready");
      pushToast({ tone: "error", title: "Reward rejected", body: result.error });
    }
  }, []);

  const progress = ((AD_SECONDS * 1000 - remaining) / (AD_SECONDS * 1000)) * 100;
  const secondsLeft = Math.ceil(remaining / 1000);

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        {/* ── 16:9 creative slot ─────────────────────── */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#070d1e]">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              {phase === "playing" ? (
                <motion.div
                  key="creative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 26, ease: "linear", repeat: Infinity }}
                    className="absolute -left-1/4 top-0 size-[150%] bg-[conic-gradient(from_0deg,rgba(0,230,118,0.22),rgba(76,194,255,0.18),rgba(255,215,0,0.2),rgba(0,230,118,0.22))]"
                  />
                  <div className="absolute inset-0 bg-[#070d1e]/62 backdrop-blur-2xl" />
                  <div className="hair-grid absolute inset-0 opacity-60" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <motion.p
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      className="display text-2xl font-bold text-ice sm:text-4xl"
                    >
                      Ad is playing in a new tab
                    </motion.p>
                    <p className="max-w-sm text-xs leading-relaxed text-mist">
                      Please keep the ad tab open. Your reward will be credited automatically after the timer ends.
                    </p>
                    <div className="flex w-52 items-end gap-1">
                      {Array.from({ length: 22 }).map((_, index) => (
                        <motion.span
                          key={index}
                          animate={{ height: [6, 6 + ((index * 37) % 30), 8] }}
                          transition={{ duration: 1.1 + (index % 5) * 0.14, repeat: Infinity }}
                          className="flex-1 rounded-full bg-neon/70"
                        />
                      ))}
                    </div>
                  </div>

                  <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-danger/50 bg-danger/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-danger">
                    <span className="size-1.5 animate-pulse rounded-full bg-danger" />
                    ad playing
                  </span>

                  <CountdownRing secondsLeft={secondsLeft} progress={progress} />
                </motion.div>
              ) : phase === "rewarded" ? (
                <motion.div
                  key="reward"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#070d1e]/85 px-6 text-center"
                >
                  <motion.span
                    initial={{ y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="grid size-16 place-items-center rounded-3xl border border-gold/45 bg-gold/12 text-gold"
                  >
                    <CoinIcon className="size-8" />
                  </motion.span>
                  <p className="num text-3xl font-bold text-ice sm:text-4xl">
                    +{formatCoins(adRewardCoins)}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-neon">
                    <CheckIcon className="size-4" />
                    credited to your wallet
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="poster"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_30%,rgba(0,230,118,0.16),transparent_70%)]" />
                  <motion.button
                    type="button"
                    onClick={start}
                    whileHover={{ scale: lock ? 1 : 1.06 }}
                    whileTap={{ scale: lock ? 1 : 0.95 }}
                    disabled={lock || phase !== "ready"}
                    className="relative grid size-20 place-items-center rounded-full border border-neon/40 bg-neon/12 text-neon disabled:opacity-40"
                    aria-label="Play rewarded ad"
                  >
                    {!lock ? (
                      <span className="absolute inset-0 animate-pulse-ring rounded-full" />
                    ) : null}
                    <PlayIcon className="size-9" />
                  </motion.button>
                  <div className="relative text-center">
                    <p className="display text-lg font-bold text-ice">
                      {lock ? "Daily cap reached" : `Watch ${AD_SECONDS}s · earn ${formatCoins(adRewardCoins)} coins`}
                    </p>
                    <p className="mt-1 text-xs text-mist">
                      {lock
                        ? "Your ad bucket refills at the next UTC day roll-over."
                        : `${snapshot.adCapRemaining} of ${dailyAdCap} daily rewards remaining`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── control strip ──────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/60 px-5 py-4">
          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
              <span>Today&apos;s ad budget</span>
              <span className="num text-ice">
                {snapshot.adsWatchedToday}/{dailyAdCap}
              </span>
            </div>
            <Meter value={(snapshot.adsWatchedToday / Math.max(1, dailyAdCap)) * 100} tone={lock ? "danger" : "neon"} />
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-mist">
              <ClockIcon className="size-3.5" />
              {lock
                ? "Reward counter resets automatically on the next request after midnight."
                : `Next reward: ${formatCoins(adRewardCoins)} coins`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {phase === "playing" ? (
              <Badge tone="danger">
                <span className="num">{(remaining / 1000).toFixed(1)}s</span>
                remaining
              </Badge>
            ) : (
              <Button onClick={start} disabled={lock || phase !== "ready"} icon={<BoltIcon className="size-4" />}>
                {lock ? "Come back tomorrow" : "Play rewarded ad"}
              </Button>
            )}
          </div>
        </div>

        {error ? (
          <p className="flex items-center gap-2 border-t border-danger/30 bg-danger/[0.07] px-5 py-3 text-xs font-semibold text-danger">
            <AlertIcon className="size-4" />
            {error}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function CountdownRing({ secondsLeft, progress }: { secondsLeft: number; progress: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="absolute right-4 top-4 grid size-16 place-items-center rounded-full border border-line/60 bg-deep/70 backdrop-blur">
      <svg viewBox="0 0 64 64" className="absolute inset-0 size-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(147,166,207,0.18)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#00E676"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * progress) / 100}
        />
      </svg>
      <span className="num text-lg font-bold text-ice">{secondsLeft}</span>
    </span>
  );
}