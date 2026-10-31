import { and, asc, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  settings,
  users,
  withdrawals,
  type Settings,
  type User,
  type Withdrawal,
} from "@/db/schema";

/* ── settings ─────────────────────────────────────────────────── */

/** Reads the single economy row, creating it on first ever boot. */
export async function getSettings(): Promise<Settings> {
  const [existing] = await db.select().from(settings).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [winner] = await db.select().from(settings).limit(1);
  if (!winner) throw new Error("Unable to initialise the economy settings row");
  return winner;
}

/* ── users ────────────────────────────────────────────────────── */

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export type Referrer = Pick<User, "id" | "name" | "referralCode">;

export async function getReferrer(referredBy: string | null): Promise<Referrer | null> {
  if (!referredBy) return null;
  const [referrer] = await db
    .select({ id: users.id, name: users.name, referralCode: users.referralCode })
    .from(users)
    .where(orByIdOrCode(referredBy))
    .limit(1);
  return referrer ?? null;
}

function orByIdOrCode(value: string) {
  return sql`${users.id}::text = ${value} OR ${users.referralCode} = ${value}`;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return user ?? null;
}

export async function findReferrerByCode(code: string): Promise<Referrer | null> {
  const [referrer] = await db
    .select({ id: users.id, name: users.name, referralCode: users.referralCode })
    .from(users)
    .where(sql`upper(${users.referralCode}) = upper(${code.trim()})`)
    .limit(1);
  return referrer ?? null;
}

/* ── dashboard aggregates ─────────────────────────────────────── */

/** Referral roster + cashed-out totals for the profile screen. */
export async function getReferralSummary(userId: string) {
  const [inviteRow] = await db
    .select({ invited: count() })
    .from(users)
    .where(eq(users.referredBy, userId));

  const [withdrawnRow] = await db
    .select({
      value: sql<number>`coalesce(sum(${withdrawals.coinsSpent}), 0)::int`,
    })
    .from(withdrawals)
    .where(and(eq(withdrawals.userId, userId), inArray(withdrawals.status, ["Approved"])));

  return {
    invited: inviteRow?.invited ?? 0,
    withdrawnCoins: withdrawnRow?.value ?? 0,
  };
}

export type ReferralRow = {
  id: string;
  name: string;
  createdAt: Date;
  coins: number;
  adsWatchedTotal: number;
};

export async function getReferralRows(userId: string, limit = 12): Promise<ReferralRow[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
      coins: users.coins,
      adsWatchedTotal: users.adsWatchedTotal,
    })
    .from(users)
    .where(eq(users.referredBy, userId))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

/* ── withdrawals ──────────────────────────────────────────────── */

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  return db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, userId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(25);
}

export async function getPendingWithdrawals(): Promise<Withdrawal[]> {
  return db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.status, "Pending"))
    .orderBy(asc(withdrawals.createdAt));
}

export async function getAllWithdrawals(limit = 40): Promise<Withdrawal[]> {
  return db
    .select()
    .from(withdrawals)
    .orderBy(desc(withdrawals.createdAt))
    .limit(limit);
}

/* ── admin stats ──────────────────────────────────────────────── */

export type AdminStats = {
  totalUsers: number;
  newUsersToday: number;
  coinsInCirculation: number;
  totalEarnedAllTime: number;
  pendingCount: number;
  pendingUsd: number;
  paidOutUsd: number;
  rejectedCount: number;
  adsWatchedToday: number;
  fleetSize: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [userRow] = await db
    .select({
      totalUsers: count(),
      newUsersToday: sql<number>`count(*) filter (where ${users.createdAt} >= date_trunc('day', now()))::int`,
      coins: sql<number>`coalesce(sum(${users.coins}), 0)::int`,
      earned: sql<number>`coalesce(sum(${users.totalEarned}), 0)::int`,
      adsToday: sql<number>`coalesce(sum(${users.adsWatchedToday}), 0)::int`,
      buildings: sql<number>`coalesce(sum(
        (${users.assets}->>'solar')::int + (${users.assets}->>'windmill')::int + (${users.assets}->>'megafarm')::int
      ), 0)::int`,
    })
    .from(users);

  const [payoutRow] = await db
    .select({
      pendingCount: sql<number>`count(*) filter (where ${withdrawals.status} = 'Pending')::int`,
      pendingUsd: sql<number>`coalesce(sum(${withdrawals.amountUsd}) filter (where ${withdrawals.status} = 'Pending'), 0)::int`,
      paidOutUsd: sql<number>`coalesce(sum(${withdrawals.amountUsd}) filter (where ${withdrawals.status} = 'Approved'), 0)::int`,
      rejectedCount: sql<number>`count(*) filter (where ${withdrawals.status} = 'Rejected')::int`,
    })
    .from(withdrawals);

  return {
    totalUsers: userRow?.totalUsers ?? 0,
    newUsersToday: userRow?.newUsersToday ?? 0,
    coinsInCirculation: userRow?.coins ?? 0,
    totalEarnedAllTime: userRow?.earned ?? 0,
    pendingCount: payoutRow?.pendingCount ?? 0,
    pendingUsd: payoutRow?.pendingUsd ?? 0,
    paidOutUsd: payoutRow?.paidOutUsd ?? 0,
    rejectedCount: payoutRow?.rejectedCount ?? 0,
    adsWatchedToday: userRow?.adsToday ?? 0,
    fleetSize: userRow?.buildings ?? 0,
  };
}

export type LeaderboardRow = {
  id: string;
  name: string;
  email: string;
  coins: number;
  totalEarned: number;
  adsWatchedToday: number;
  buildings: number;
};

export async function getLeaderboard(limit = 8): Promise<LeaderboardRow[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      coins: users.coins,
      totalEarned: users.totalEarned,
      adsWatchedToday: users.adsWatchedToday,
      buildings: sql<number>`(
        (${users.assets}->>'solar')::int + (${users.assets}->>'windmill')::int + (${users.assets}->>'megafarm')::int
      )`,
    })
    .from(users)
    .orderBy(desc(sql`${users.coins}`), desc(users.totalEarned))
    .limit(limit);
}

/** How many players joined through somebody's link (used by the admin panel). */
export async function getReferredPlayerCount(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(isNotNull(users.referredBy));
  return row?.value ?? 0;
}
