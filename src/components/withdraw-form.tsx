"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { requestWithdraw } from "@/app/actions";
import { formatCoins, formatDate, formatUsd, maskAccountNumber } from "@/lib/format";
import { setWalletSnapshot } from "@/lib/wallet-store";
import { Badge, Button, Card, Field, Meter, SectionTitle, Segmented } from "./ui";
import { AlertIcon, CheckIcon, ClockIcon, CoinIcon, ShieldIcon, WalletIcon } from "./icons";
import { pushToast } from "./toast";

export type WithdrawData = {
  coins: number;
  usd: number;
  withdrawRate: number;
  minWithdrawUsd: number;
  history: {
    id: string;
    reference: string;
    amountUsd: number;
    coinsSpent: number;
    paymentMethod: string;
    accountNumber: string;
    status: string;
    createdAt: string;
    processedAt: string | null;
  }[];
};

type Method = "JazzCash" | "Easypaisa";

export function WithdrawForm({ data }: { data: WithdrawData }) {
  const router = useRouter();
  const maxUsd = Math.floor(data.coins / data.withdrawRate);
  const canSubmit = maxUsd >= data.minWithdrawUsd;

  const [amount, setAmount] = useState(String(Math.max(data.minWithdrawUsd, Math.min(maxUsd, data.minWithdrawUsd))));
  const [method, setMethod] = useState<Method>("JazzCash");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ reference: string; usd: number } | null>(null);

  const parsedAmount = useMemo(() => {
    const value = Number.parseInt(amount, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [amount]);

  const coinsToDebit = parsedAmount * data.withdrawRate;
  const leftoverUsd = maxUsd - parsedAmount;

  async function submit() {
    setError(null);
    if (!canSubmit) {
      setError(`You need at least ${formatCoins(data.minWithdrawUsd * data.withdrawRate)} coins for the $${data.minWithdrawUsd} minimum.`);
      return;
    }
    setSubmitting(true);
    const result = await requestWithdraw({
      amountUsd: parsedAmount,
      paymentMethod: method,
      accountNumber: account,
      accountName: holder,
    });
    setSubmitting(false);

    if (result.ok) {
      setWalletSnapshot(result.snapshot);
      setReceipt({ reference: result.reference, usd: parsedAmount });
      pushToast({
        tone: "success",
        title: `Payout queued · ${formatUsd(parsedAmount, 2)}`,
        body: `${formatCoins(coinsToDebit)} coins debited. Reference ${result.reference}.`,
      });
      router.refresh();
    } else {
      setError(result.error);
      pushToast({ tone: "error", title: "Request rejected", body: result.error });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <div className="space-y-4">
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-gold/20 blur-[86px]" />
          <div className="relative">
            <SectionTitle eyebrow="Payout desk" title="Cash out to your mobile wallet" />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3">
              <span className="flex items-center gap-2">
                <CoinIcon className="size-5 text-gold" />
                <span className="num text-lg font-bold text-ice">{formatCoins(data.coins)}</span>
                <span className="text-xs text-mist">spendable</span>
              </span>
              <span className="num text-sm font-bold text-neon">{formatUsd(data.usd)}</span>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <Field
                  label="Amount (USD)"
                  inputMode="numeric"
                  hint={`max ${formatUsd(maxUsd, 2)}`}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  leading={<span className="num text-sm font-bold text-mist">$</span>}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <AmountChip label={`Min $${data.minWithdrawUsd}`} onClick={() => setAmount(String(data.minWithdrawUsd))} />
                  <AmountChip label="Quarter" onClick={() => setAmount(String(Math.max(1, Math.floor(maxUsd / 4))))} />
                  <AmountChip label="Half" onClick={() => setAmount(String(Math.max(1, Math.floor(maxUsd / 2))))} />
                  <AmountChip label="Max" onClick={() => setAmount(String(Math.max(1, maxUsd)))} />
                </div>
              </div>

              <Segmented<Method>
                value={method}
                onChange={setMethod}
                options={[
                  { value: "JazzCash", label: "JazzCash", icon: <WalletIcon className="size-4" /> },
                  { value: "Easypaisa", label: "Easypaisa", icon: <WalletIcon className="size-4" /> },
                ]}
              />

              <Field
                label={`${method} account number`}
                inputMode="numeric"
                placeholder="03XX XXXXXXX"
                hint="11 digits"
                value={account}
                onChange={(event) => setAccount(event.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                leading={<span className="num text-xs font-bold text-mist">PK</span>}
              />

              <Field
                label="Account holder name"
                placeholder="As printed on the wallet"
                value={holder}
                onChange={(event) => setHolder(event.target.value)}
                maxLength={48}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-line/70 bg-deep-2/50 p-4">
              <Row label="Conversion rate" value={`${formatCoins(data.withdrawRate)} coins = $1`} />
              <Row label="Coins debited now" value={formatCoins(coinsToDebit)} accent="gold" />
              <Row label="Remaining after payout" value={formatUsd(Math.max(0, leftoverUsd), 2)} />
              <div className="mt-3">
                <Meter
                  value={Math.min(100, (parsedAmount / Math.max(1, maxUsd)) * 100)}
                  tone={parsedAmount > maxUsd ? "danger" : "neon"}
                />
                <p className="mt-1.5 text-[11px] text-mist">
                  {parsedAmount > maxUsd
                    ? "Amount exceeds your available balance."
                    : `${formatUsd(Math.max(0, maxUsd - parsedAmount), 2)} left in the wallet afterwards.`}
                </p>
              </div>
            </div>

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-start gap-2 rounded-2xl border border-danger/45 bg-danger/10 px-3.5 py-2.5 text-xs font-semibold text-danger"
              >
                <AlertIcon className="mt-0.5 size-4 shrink-0" />
                {error}
              </motion.p>
            ) : null}

            {receipt ? (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-neon/40 bg-neon/[0.08] px-3.5 py-3">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-neon" />
                <p className="text-xs leading-relaxed text-ice">
                  <span className="font-bold text-neon">Request queued.</span> {formatUsd(receipt.usd, 2)} is
                  pending operator review under reference{" "}
                  <span className="num font-bold">{receipt.reference}</span>. Coins are already debited — if
                  the request is rejected, they are refunded automatically.
                </p>
              </div>
            ) : null}

            <Button
              full
              size="lg"
              className="mt-4"
              loading={submitting}
              disabled={!canSubmit || !account || !holder || parsedAmount < data.minWithdrawUsd}
              onClick={submit}
              icon={<WalletIcon className="size-4" />}
            >
              {canSubmit ? `Request ${formatUsd(parsedAmount || data.minWithdrawUsd, 2)}` : "Not enough coins yet"}
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist/80">
            <ShieldIcon className="size-4 text-neon" />
            How processing works
          </p>
          <ol className="mt-3 grid gap-2.5 text-xs leading-relaxed text-mist sm:grid-cols-3">
            {[
              "Coins are debited from your Postgres row in the same transaction that creates the request.",
              "An operator reviews the queue in the control panel and marks it Approved or Rejected.",
              "Rejections write the exact coin amount back to your wallet automatically.",
            ].map((line, index) => (
              <li key={line} className="rounded-2xl border border-line/60 bg-white/[0.02] p-3">
                <span className="num text-neon">0{index + 1}</span>
                <p className="mt-1.5">{line}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="h-fit p-5">
        <SectionTitle eyebrow="Ledger" title="Your payout history" />
        {data.history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/70 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-ice">No requests yet</p>
            <p className="mt-1 text-xs text-mist">
              Farm coins, hit the {formatUsd(data.minWithdrawUsd, 2)} floor and your first payout will show
              here with its live status.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {data.history.map((row) => (
              <li key={row.id} className="rounded-2xl border border-line/60 bg-white/[0.02] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="num text-sm font-bold text-ice">
                      {formatUsd(row.amountUsd, 2)}
                      <span className="ml-2 text-[11px] font-semibold text-gold">
                        −{formatCoins(row.coinsSpent)}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-mist">
                      {row.paymentMethod} · {maskAccountNumber(row.accountNumber)}
                    </p>
                    <p className="num mt-0.5 text-[10px] tracking-wide text-mist/70">{row.reference}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={row.status === "Approved" ? "neon" : row.status === "Rejected" ? "danger" : "gold"}>
                      {row.status}
                    </Badge>
                    <p className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-mist/80">
                      <ClockIcon className="size-3" />
                      {formatDate(row.processedAt ?? row.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-2xl border border-line/60 bg-deep-2/50 px-3.5 py-3">
          <p className="text-[11px] leading-relaxed text-mist">
            Want a bigger cash-out? Every extra coin is worth{" "}
            <span className="font-semibold text-neon">
              ${(1 / data.withdrawRate).toFixed(4)}
            </span>
            . Keep harvesting and watching ads while the queue is reviewed.
          </p>
          <Link
            href="/ads"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-neon transition hover:text-neon-2"
          >
            Go watch an ad →
          </Link>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: "gold" }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="text-mist">{label}</span>
      <span className={`num font-bold ${accent === "gold" ? "text-gold" : "text-ice"}`}>{value}</span>
    </div>
  );
}

function AmountChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-line/70 bg-white/[0.02] px-3 py-1.5 text-[11px] font-semibold text-mist transition hover:border-neon/40 hover:text-neon"
    >
      {label}
    </button>
  );
}
