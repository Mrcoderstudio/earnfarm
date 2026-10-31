"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { lookupReferralCode } from "@/app/actions";
import { Logo } from "./logo";
import { ArrowIcon, BoltIcon, CheckIcon, CoinIcon, GiftIcon, LockIcon, MailIcon, ShieldIcon, UserIcon } from "./icons";
import { Button, Field } from "./ui";

type Mode = "signin" | "signup";

export function AuthForm({ mode, initialReferral = "" }: { mode: Mode; initialReferral?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState(initialReferral.toUpperCase());
  const [accept, setAccept] = useState(false);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const fail = (message: string) => {
    setError(message);
    setShake((value) => value + 1);
    setLoading(false);
  };

  function checkReferral(value: string) {
    if (timer.current) clearTimeout(timer.current);
    const clean = value.trim();
    if (clean.length < 4) {
      setReferrer(null);
      return;
    }
    timer.current = setTimeout(async () => {
      const result = await lookupReferralCode(clean);
      setReferrer(result.ok ? result.name : null);
      if (!result.ok && clean.length >= 6) setError(result.error);
    }, 450);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signup") {
      if (!accept) {
        fail("Please confirm you accept the EarnFarm terms.");
        return;
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          referralCode: referral.trim().toUpperCase(),
          acceptTerms: true,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        fail(payload.error ?? "Registration failed.");
        return;
      }

      const login = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });
      if (login?.error) {
        fail("Account created — please sign in with your new details.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const login = await signIn("credentials", { email: cleanEmail, password, redirect: false });
    if (login?.error) {
      fail("Email or password is incorrect.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  const isSignup = mode === "signup";

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.02fr_0.98fr]">
      <BrandPanel mode={mode} />

      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div
          key={shake}
          initial={shake ? { x: -10 } : false}
          animate={{ x: 0 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
          className="glass w-full max-w-[440px] rounded-[30px] p-6 sm:p-8"
        >
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-neon/80 lg:mt-0">
            {isSignup ? "New farmer" : "Welcome back"}
          </p>
          <h1 className="display mt-2 text-3xl font-bold text-ice">
            {isSignup ? "Start your farm" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mist">
            {isSignup
              ? "Zero cost to begin. Your wallet, referral code and asset fleet are created instantly."
              : "Enter your credentials to unlock your wallet, fleet and pending payouts."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3.5" noValidate>
            {isSignup ? (
              <Field
                label="Farmer name"
                placeholder="e.g. HarvestKing"
                autoComplete="nickname"
                value={name}
                onChange={(event) => setName(event.target.value)}
                leading={<UserIcon className="size-4.5" />}
                maxLength={24}
                required
              />
            ) : null}

            <Field
              label="Email"
              type="email"
              inputMode="email"
              placeholder="you@earnfarm.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              leading={<MailIcon className="size-4.5" />}
              required
            />

            <Field
              label="Password"
              type="password"
              placeholder={isSignup ? "Min. 8 chars, 1 number" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              leading={<LockIcon className="size-4.5" />}
              required
            />

            {isSignup ? (
              <Field
                label="Referral code"
                hint="optional"
                placeholder="6 characters"
                autoComplete="off"
                spellCheck={false}
                value={referral}
                onChange={(event) => {
                  const next = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setReferral(next.slice(0, 12));
                  checkReferral(next);
                }}
                leading={<GiftIcon className="size-4.5" />}
                trailing={
                  referrer ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-neon">
                      <CheckIcon className="size-3.5" />
                      {referrer}
                    </span>
                  ) : null
                }
              />
            ) : null}

            {isSignup ? (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-line/70 bg-deep-2/50 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={accept}
                  onChange={(event) => setAccept(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 appearance-none rounded-[6px] border border-line bg-transparent checked:border-neon checked:bg-neon"
                />
                <span className="text-xs leading-relaxed text-mist">
                  I am 13 or older and I understand EarnFarm is a simulation game — coins only
                  convert to payouts approved by an operator.
                </span>
              </label>
            ) : null}

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-2xl border border-danger/45 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger"
              >
                <BoltIcon className="mt-0.5 size-4 shrink-0" />
                {error}
              </motion.p>
            ) : null}

            <Button type="submit" size="lg" full loading={loading} icon={<ArrowIcon className="size-4" />}>
              {isSignup ? "Create farm & sign in" : "Enter the farm"}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/60 pt-4 text-xs text-mist">
            <Link
              href={isSignup ? "/signin" : "/signup"}
              className="font-semibold text-neon transition hover:text-neon-2"
            >
              {isSignup ? "Already farming? Sign in" : "No farm yet? Create one"}
            </Link>
            <span className="flex items-center gap-1.5">
              <ShieldIcon className="size-4 text-mist" />
              bcrypt · httpOnly session
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BrandPanel({ mode }: { mode: Mode }) {
  const bullets =
    mode === "signup"
      ? [
          "10 rewarded ads a day — coins land the moment the timer finishes",
          "Three asset tiers that compound every 24-hour harvest",
          "10% lifetime commission on every ad your referrals watch",
        ]
      : [
          "Your balance, fleet and payout queue are stored in serverless Postgres",
          "Every claim is validated twice — server-side, in a transaction",
          "Withdrawals are debited immediately and reviewed by an operator",
        ];

  return (
    <div className="relative hidden overflow-hidden border-r border-line/50 bg-deep-2/60 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -left-24 top-10 size-[420px] rounded-full bg-neon/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 size-[380px] rounded-full bg-gold/15 blur-[120px]" />

      <Link href="/">
        <Logo />
      </Link>

      <div className="relative">
        <h2 className="display text-[42px] font-bold leading-[1.05] text-ice">
          {mode === "signup" ? (
            <>
              Your farm starts
              <br />
              with one tap.
            </>
          ) : (
            <>
              The fields are
              <br />
              still growing.
            </>
          )}
        </h2>
        <ul className="mt-7 space-y-3">
          {bullets.map((bullet, index) => (
            <motion.li
              key={bullet}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.5 }}
              className="flex items-start gap-3 text-sm text-mist"
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-lg border border-neon/40 bg-neon/10 text-neon">
                <CheckIcon className="size-3" />
              </span>
              {bullet}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-3">
        <span className="animate-float grid size-12 place-items-center rounded-2xl border border-gold/35 bg-gold/10">
          <CoinIcon className="size-6 text-gold" />
        </span>
        <p className="text-xs leading-relaxed text-mist">
          Wallet, yields, ad caps and payouts are all persisted in Neon Postgres —
          <span className="text-ice"> nothing is simulated on the client.</span>
        </p>
      </div>
    </div>
  );
}
