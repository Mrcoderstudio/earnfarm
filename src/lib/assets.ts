import type { AssetId, Settings } from "@/db/schema";

export type AssetMeta = {
  id: AssetId;
  name: string;
  handle: string;
  tagline: string;
  description: string;
  /** coins generated per completed daily harvest */
  yieldPerDay: number;
  /** column on the settings table that stores this asset's live price */
  priceColumn: "solarPrice" | "windmillPrice" | "megafarmPrice";
  accent: string;
  glow: string;
  tier: "Starter" | "Pro" | "Elite";
};

/**
 * Static catalogue metadata. Prices are *never* hardcoded here —
 * they are always read from the `settings` table so the admin panel
 * can re-price the economy at any time without a deploy.
 */
export const ASSET_CATALOG: Record<AssetId, AssetMeta> = {
  solar: {
    id: "solar",
    name: "Solar Panel",
    handle: "solar-array",
    tagline: "Silent, steady, sunlight",
    description:
      "A rooftop photovoltaic array. Lowest entry cost, dependable daily harvest, perfect first asset.",
    yieldPerDay: 10,
    priceColumn: "solarPrice",
    accent: "#4CC2FF",
    glow: "rgba(76,194,255,0.35)",
    tier: "Starter",
  },
  windmill: {
    id: "windmill",
    name: "Wind Turbine",
    handle: "wind-turbine",
    tagline: "Harvest the breeze",
    description:
      "A 2 MW horizontal-axis turbine. Mid-tier capital, strong daily yield and the best coins-per-tap ratio.",
    yieldPerDay: 40,
    priceColumn: "windmillPrice",
    accent: "#00E676",
    glow: "rgba(0,230,118,0.35)",
    tier: "Pro",
  },
  megafarm: {
    id: "megafarm",
    name: "Mega Farm Dome",
    handle: "megafarm-dome",
    tagline: "Industrial-grade yield",
    description:
      "A fully automated vertical farm dome. Premium price, enormous daily payout — the endgame asset.",
    yieldPerDay: 200,
    priceColumn: "megafarmPrice",
    accent: "#FFD700",
    glow: "rgba(255,215,0,0.35)",
    tier: "Elite",
  },
};

export const ASSET_LIST: AssetMeta[] = Object.values(ASSET_CATALOG);

export function priceOf(assetId: AssetId, s: Settings): number {
  return s[ASSET_CATALOG[assetId].priceColumn];
}

/** Total coins a player's fleet produces per harvest. */
export function computeDailyYield(
  assets: Partial<Record<AssetId, number>> | null | undefined,
): number {
  return ASSET_LIST.reduce(
    (total, meta) => total + (assets?.[meta.id] ?? 0) * meta.yieldPerDay,
    0,
  );
}

export function totalBuildings(assets: Partial<Record<AssetId, number>> | null | undefined) {
  return ASSET_LIST.reduce((n, meta) => n + (assets?.[meta.id] ?? 0), 0);
}
