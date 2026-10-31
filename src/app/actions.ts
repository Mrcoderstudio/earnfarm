"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  settings,
  users,
  withdrawals,
  type AssetId,
  type Settings,
  type User,
  type UserAssets,
} from "@/db/schema";
import { ASSET_CATALOG, computeDailyYield, priceOf } from "@/lib/assets";
import { findReferrerByCode, getSettings, getUserById } from "@/lib/data";
import { dayKey, formatDuration } from "@/lib/format";
import { buildSnapshot, parseAssets, type WalletSnapshot } from "@/lib/snapshot";

/* ────────────────────────────────────────────────────────────────
 *  Shared types
 * ──────────────────────────────────────────────────────────────── */

// Yahan se "export type { WalletSnapshot }" hata diya gaya hai kyunke Next.js allow nahi karta.

type Fail = { ok: false; error: string };
type Ok<T> = { ok: true } & T;

export type YieldResult = Ok<{ gained: number; snapshot: WalletSnapshot }> | Fail;
export type BuyResult = Ok<{ snapshot: WalletSnapshot; spent: number; owned: number }> | Fail;
export type AdResult =
  | Ok<{
      snapshot: WalletSnapshot;
      reward: number;
      referrerBonus: number;
      referrerName: string | null;
      remainingToday: number;
    }>
  | Fail;
export type WithdrawResult = Ok<{ snapshot: WalletSnapshot; reference: string }> | Fail;
export type ProfileResult = Ok<{ name: string }> | Fail;
export type AdminResult = Ok<{ message: string }> | Fail;
export type SettingsResult = Ok<{ message: string }> | Fail;

/* ────────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────────── */

const snapshot = buildSnapshot;

async function requireActor(): Promise<{ user: User; settings: Settings }> {
  const { getSessionUser } = await import("@/lib/session");
  const session = await getSessionUser();
  if (!session) throw new Error("UNAUTHENTICATED");
  const user = await getUserById(session.id);
  if (!user) throw new Error("UNAUTHENTICATED");
  return { user, settings: await getSettings() };
}

function revalidatePlayerRoutes() {
  for (const route of ["/dashboard", "/store", "/ads", "/profile", "/withdraw"]) {
    revalidatePath(route);
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Daily yield
 * ──────────────────────────────────────────────────────────────── */

export async function claimYield(): Promise<YieldResult> {
  try {
    const { user, settings: s } = await requireActor();

    const cooldownMs = s.yieldCooldownHours * 60 * 60 * 1000;
    const lastClaim = user.lastYieldClaim ? new Date(user.lastYieldClaim).getTime() : 0;
    const elapsed = Date.now() - lastClaim;

    if (user.lastYieldClaim && elapsed < cooldownMs) {
      return { ok: false, error: `Harvest cooling down — back in ${formatDuration(cooldownMs - elapsed)}.` };
    }

    const gained = computeDailyYield(parseAssets(user.assets));
    if (gained <= 0) {
      return { ok: false, error: "No assets yet. Buy your first Solar Panel to start generating coins." };
    }

    await db
      .update(users)
      .set({
        coins: sql`${users.coins} + ${gained}`,
        totalEarned: sql`${users.totalEarned} + ${gained}`,
        lastYieldClaim: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const fresh = await getUserById(user.id);
    if (!fresh) throw new Error("Wallet write failed");

    revalidatePlayerRoutes();
    return { ok: true, gained, snapshot: snapshot(fresh, s) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Store — buy an asset
 * ──────────────────────────────────────────────────────────────── */

const assetIdSchema = z.enum(["solar", "windmill", "megafarm"]);

export async function buyAsset(assetId: AssetId): Promise<BuyResult> {
  try {
    const parsed = assetIdSchema.safeParse(assetId);
    if (!parsed.success) return { ok: false, error: "Unknown asset." };

    const { user, settings: s } = await requireActor();
    const id = parsed.data;
    const meta = ASSET_CATALOG[id];
    const price = priceOf(id, s);

    if (user.coins < price) {
      const deficit = price - user.coins;
      return {
        ok: false,
        error: `Not enough coins — you need ${deficit.toLocaleString("en-US")} more (${meta.name} costs ${price.toLocaleString("en-US")}).`,
      };
    }

    const assets = parseAssets(user.assets);
    const nextAssets: UserAssets = { ...assets, [id]: assets[id] + 1 };

    const [updated] = await db
      .update(users)
      .set({
        coins: sql`${users.coins} - ${price}`,
        assets: sql`jsonb_set(
          ${users.assets},
          ${JSON.stringify([id])}::text[],
          to_jsonb(coalesce((${users.assets} ->> ${id})::int, 0) + 1),
          true
        )`,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, user.id), sql`${users.coins} >= ${price}`))
      .returning();

    if (!updated) {
      return { ok: false, error: "Transaction declined — balance changed, please retry." };
    }

    revalidatePlayerRoutes();
    return {
      ok: true,
      spent: price,
      owned: nextAssets[id],
      snapshot: snapshot(updated, s),
    };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Rewarded ads + referral commission
 * ──────────────────────────────────────────────────────────────── */

export async function rewardAd(): Promise<AdResult> {
  let referrerBonus = 0;
  try {
    const { user, settings: s } = await requireActor();

    const today = dayKey();
    const watchedToday = user.lastAdDate === today ? user.adsWatchedToday : 0;

    if (watchedToday >= s.dailyAdCap) {
      return {
        ok: false,
        error: `Daily cap reached — ${s.dailyAdCap} ads per day. Come back tomorrow for more coins.`,
      };
    }

    const reward = s.adRewardCoins;
    let referrerName: string | null = null;

    await db.transaction(async (tx) => {
      const [credited] = await tx
        .update(users)
        .set({
          coins: sql`${users.coins} + ${reward}`,
          totalEarned: sql`${users.totalEarned} + ${reward}`,
          adsWatchedToday: watchedToday + 1,
          adsWatchedTotal: sql`${users.adsWatchedTotal} + 1`,
          lastAdDate: today,
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), sql`${users.adsWatchedToday} < ${s.dailyAdCap}`))
        .returning();

      if (!credited) throw new Error("Ad credit rejected — daily cap reached.");

      if (user.referredBy) {
        const [referrer] = await tx
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id}::text = ${user.referredBy}`)
          .limit(1);

        if (referrer && referrer.id !== user.id) {
          referrerBonus = Math.floor((reward * s.referralSharePercent) / 100);
          if (referrerBonus > 0) {
            referrerName = referrer.name;
            await tx
              .update(users)
              .set({
                coins: sql`${users.coins} + ${referrerBonus}`,
                referralEarned: sql`${users.referralEarned} + ${referrerBonus}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, referrer.id));
          }
        }
      }
    });

    const fresh = await getUserById(user.id);
    if (!fresh) throw new Error("Ad reward could not be confirmed.");

    revalidatePlayerRoutes();
    return {
      ok: true,
      reward,
      referrerBonus,
      referrerName,
      remainingToday: Math.max(0, s.dailyAdCap - (watchedToday + 1)),
      snapshot: snapshot(fresh, s),
    };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Withdrawals
 * ──────────────────────────────────────────────────────────────── */

const withdrawSchema = z.object({
  amountUsd: z.coerce.number().int("Whole dollars only.").min(1),
  paymentMethod: z.enum(["JazzCash", "Easypaisa"]),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{10,18}$/, "Enter a valid 11-digit mobile wallet number."),
  accountName: z.string().trim().min(2, "Enter the registered account holder name.").max(48),
});

export type WithdrawInput = {
  amountUsd: number;
  paymentMethod: "JazzCash" | "Easypaisa";
  accountNumber: string;
  accountName: string;
};

export async function requestWithdraw(input: WithdrawInput): Promise<WithdrawResult> {
  try {
    const parsed = withdrawSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
    }
    const { amountUsd, paymentMethod, accountNumber, accountName } = parsed.data;

    const { user, settings: s } = await requireActor();

    if (amountUsd < s.minWithdrawUsd) {
      return { ok: false, error: `Minimum payout is $${s.minWithdrawUsd}.` };
    }

    const cost = amountUsd * s.withdrawRate;
    if (user.coins < cost) {
      return {
        ok: false,
        error: `You need ${(cost - user.coins).toLocaleString("en-US")} more coins to cash out $${amountUsd}.`,
      };
    }

    const [alreadyPending] = await db
      .select({ id: withdrawals.id })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, user.id), eq(withdrawals.status, "Pending")))
      .limit(1);

    if (alreadyPending) {
      return { ok: false, error: "A payout is already awaiting review. Wait for it to be processed." };
    }

    const reference = `EF-${Date.now().toString(36).toUpperCase().slice(-6)}${user.id.slice(0, 3).toUpperCase()}`;

    const [createdRow, debitedUser] = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(withdrawals)
        .values({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          reference,
          amountUsd,
          coinsSpent: cost,
          accountNumber: accountNumber.replace(/\s/g, ""),
          accountName,
          paymentMethod,
          status: "Pending",
        })
        .returning();

      if (!row) throw new Error("Payout request could not be queued.");

      const [debited] = await tx
        .update(users)
        .set({ coins: sql`${users.coins} - ${cost}`, updatedAt: new Date() })
        .where(and(eq(users.id, user.id), sql`${users.coins} >= ${cost}`))
        .returning();

      if (!debited) throw new Error("Insufficient balance at commit time.");
      return [row, debited] as const;
    });

    revalidatePlayerRoutes();
    return { ok: true, reference: createdRow.reference, snapshot: snapshot(debitedUser, s) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Profile
 * ──────────────────────────────────────────────────────────────── */

const nameSchema = z
  .string()
  .trim()
  .min(3, "Farmer name needs at least 3 characters.")
  .max(24, "Farmer name is limited to 24 characters.")
  .regex(/^[a-zA-Z0-9_.\- ]+$/, "Letters, numbers, dot, dash and underscore only.");

export async function updateFarmerName(input: { name: string }): Promise<ProfileResult> {
  try {
    const parsed = nameSchema.safeParse(input?.name);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
    }
    const { user } = await requireActor();

    await db
      .update(users)
      .set({ name: parsed.data, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    revalidatePlayerRoutes();
    return { ok: true, name: parsed.data };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8, "New password needs at least 8 characters.").max(72),
});

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<Fail | { ok: true; message: string }> {
  try {
    const parsed = passwordSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password." };
    }
    const { user } = await requireActor();

    const bcrypt = (await import("bcryptjs")).default;
    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) return { ok: false, error: "Current password is incorrect." };

    const hash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.update(users).set({ password: hash, updatedAt: new Date() }).where(eq(users.id, user.id));

    return { ok: true, message: "Password updated." };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Admin control panel
 * ──────────────────────────────────────────────────────────────── */

const adminStatusSchema = z.enum(["Approved", "Rejected"]);

export async function setWithdrawalStatus(input: {
  withdrawalId: string;
  status: "Approved" | "Rejected";
}): Promise<AdminResult> {
  try {
    const parsed = adminStatusSchema.safeParse(input?.status);
    const id = z.string().uuid().safeParse(input?.withdrawalId);
    if (!parsed.success || !id.success) return { ok: false, error: "Invalid payout request." };

    const { isAdminEmail } = await import("@/auth");
    const session = await (await import("@/lib/session")).getSessionUser();
    if (!session || !isAdminEmail(session.email)) {
      return { ok: false, error: "Forbidden — operator access only." };
    }

    const [target] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, id.data))
      .limit(1);

    if (!target) return { ok: false, error: "That payout no longer exists." };
    if (target.status !== "Pending") {
      return { ok: false, error: `Already marked as ${target.status}.` };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(withdrawals)
        .set({ status: parsed.data, processedAt: new Date() })
        .where(and(eq(withdrawals.id, target.id), eq(withdrawals.status, "Pending")));

      if (parsed.data === "Rejected") {
        const [refunded] = await tx
          .update(users)
          .set({ coins: sql`${users.coins} + ${target.coinsSpent}`, updatedAt: new Date() })
          .where(eq(users.id, target.userId))
          .returning({ coins: users.coins });
        if (!refunded) throw new Error("Refund failed — account missing.");
      }
    });

    revalidatePath("/admin");
    revalidatePath("/withdraw");
    return {
      ok: true,
      message:
        parsed.data === "Approved"
          ? `$${target.amountUsd} released to ${target.userName}.`
          : `$${target.amountUsd} rejected — ${target.coinsSpent.toLocaleString("en-US")} coins refunded to ${target.userName}.`,
    };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

const settingsSchema = z.object({
  adRewardCoins: z.coerce.number().int().min(1).max(100000),
  minWithdrawUsd: z.coerce.number().int().min(1).max(10000),
  withdrawRate: z.coerce.number().int().min(100).max(10000000),
  dailyAdCap: z.coerce.number().int().min(0).max(100),
  yieldCooldownHours: z.coerce.number().int().min(1).max(168),
  referralSharePercent: z.coerce.number().int().min(0).max(50),
  solarPrice: z.coerce.number().int().min(1).max(10000000),
  windmillPrice: z.coerce.number().int().min(1).max(10000000),
  megafarmPrice: z.coerce.number().int().min(1).max(10000000),
});

export type AdminSettingsInput = {
  adRewardCoins: number | string;
  minWithdrawUsd: number | string;
  withdrawRate: number | string;
  dailyAdCap: number | string;
  yieldCooldownHours: number | string;
  referralSharePercent: number | string;
  solarPrice: number | string;
  windmillPrice: number | string;
  megafarmPrice: number | string;
};

export async function updateSettings(input: AdminSettingsInput): Promise<SettingsResult> {
  try {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid economy values." };
    }

    const { isAdminEmail } = await import("@/auth");
    const session = await (await import("@/lib/session")).getSessionUser();
    if (!session || !isAdminEmail(session.email)) {
      return { ok: false, error: "Forbidden — operator access only." };
    }

    const current = await getSettings();
    const next = parsed.data;
    if (next.solarPrice >= next.windmillPrice || next.windmillPrice >= next.megafarmPrice) {
      return { ok: false, error: "Prices must ascend: Solar < Windmill < Mega Farm." };
    }

    await db
      .update(settings)
      .set({ ...next, updatedAt: new Date() })
      .where(eq(settings.id, current.id));

    revalidatePath("/admin");
    revalidatePlayerRoutes();
    return { ok: true, message: "Economy updated — live for every player." };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function refreshWallet(): Promise<Ok<{ snapshot: WalletSnapshot }> | Fail> {
  try {
    const { user, settings: s } = await requireActor();
    return { ok: true, snapshot: snapshot(user, s) };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export async function lookupReferralCode(
  code: string,
): Promise<Ok<{ name: string }> | Fail> {
  try {
    const clean = z.string().trim().min(4).max(12).safeParse(code);
    if (!clean.success) return { ok: false, error: "Enter a valid referral code." };
    const referrer = await findReferrerByCode(clean.data);
    if (!referrer) return { ok: false, error: "That referral code was not found." };
    return { ok: true, name: referrer.name };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED") return "Your session expired — please sign in again.";
    return error.message;
  }
  return "Something went wrong on our side. Please try again.";
}