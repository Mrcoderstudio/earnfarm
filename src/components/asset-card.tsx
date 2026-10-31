"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { buyAsset, type WalletSnapshot } from "@/app/actions";
import type { AssetId } from "@/db/schema";
import type { AssetMeta } from "@/lib/assets";
import { formatCoins } from "@/lib/format";
import { setWalletSnapshot } from "@/lib/wallet-store";
import { ASSET_ICONS, BoltIcon, CheckIcon, CoinIcon } from "./icons";
import { Badge, Button, Card, Meter } from "./ui";
import { pushToast } from "./toast";

export function AssetCard({
  asset,
  price,
  coins,
  owned,
  index,
  snapshot,
}: {
  asset: AssetMeta;
  price: number;
  coins: number;
  owned: number;
  index: number;
  snapshot: WalletSnapshot;
}) {
  const [buying, setBuying] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const affordable = coins >= price;
  const breakEven = Math.max(1, Math.ceil(price / asset.yieldPerDay));
  const Icon = ASSET_ICONS[asset.id as AssetId];

  async function onBuy() {
    if (buying) return;
    setBuying(true);
    const result = await buyAsset(asset.id);
    setBuying(false);

    if (result.ok) {
      setWalletSnapshot(result.snapshot);
      setJustBought(true);
      setTimeout(() => setJustBought(false), 1400);
      pushToast({
        tone: "reward",
        title: `${asset.name} #${result.owned} installed`,
        body: `−${formatCoins(result.spent)} coins · fleet now +${formatCoins(
          result.snapshot.dailyYield,
        )} per harvest.`,
      });
    } else {
      pushToast({ tone: "error", title: "Purchase declined", body: result.error });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className="relative flex h-full flex-col overflow-hidden p-5"
        style={{
          boxShadow: justBought
            ? `0 0 0 1px ${asset.accent}, 0 30px 70px -30px ${asset.glow}`
            : undefined,
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full blur-[80px] transition-opacity duration-500"
          style={{ background: asset.glow, opacity: justBought ? 0.9 : 0.42 }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <span
            className="grid size-12 place-items-center rounded-2xl border"
            style={{
              borderColor: `${asset.accent}55`,
              background: `linear-gradient(150deg, ${asset.accent}22, transparent)`,
              color: asset.accent,
            }}
          >
            <Icon className="size-6" />
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              tone={asset.tier === "Elite" ? "gold" : asset.tier === "Pro" ? "neon" : "sky"}
            >
              {asset.tier}
            </Badge>
            {owned > 0 ? (
              <span className="num flex items-center gap-1 text-[11px] font-bold text-neon">
                <CheckIcon className="size-3" />
                owned ×{owned}
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="relative mt-4 text-lg font-bold text-ice">{asset.name}</h3>
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: asset.accent }}>
          {asset.tagline}
        </p>
        <p className="relative mt-2 text-xs leading-relaxed text-mist">{asset.description}</p>

        <div className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold/85">Price</p>
            <p className="num mt-1 flex items-center gap-1 text-base font-bold text-ice">
              <CoinIcon className="size-4 text-gold" />
              {formatCoins(price)}
            </p>
          </div>
          <div className="rounded-2xl border px-3 py-2.5" style={{ borderColor: `${asset.accent}40`, background: `${asset.accent}12` }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: asset.accent }}>
              Per harvest
            </p>
            <p className="num mt-1 text-base font-bold text-ice">+{formatCoins(asset.yieldPerDay)}</p>
          </div>
        </div>

        <div className="relative mt-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-mist/85">
            <span>Funding progress</span>
            <span className="num text-ice">{Math.min(100, Math.floor((coins / price) * 100))}%</span>
          </div>
          <Meter value={(coins / price) * 100} tone={affordable ? "neon" : "gold"} />
          <p className="mt-2 text-[11px] text-mist">
            Breaks even in ~<span className="font-semibold text-ice">{breakEven}</span> harvest
            {breakEven > 1 ? "s" : ""} · your balance {formatCoins(coins)}
          </p>
        </div>

        <div className="relative mt-4 flex-1" />

        <Button
          full
          size="md"
          variant={affordable ? "neon" : "ghost"}
          loading={buying}
          onClick={onBuy}
          icon={<BoltIcon className="size-4" />}
        >
          {affordable
            ? `Buy · ${formatCoins(price)}`
            : `Need ${formatCoins(price - coins)} more`}
        </Button>
      </Card>
    </motion.div>
  );
}
