import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ──────────────────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────────────────── */

export type AssetId = "solar" | "windmill" | "megafarm";

export type UserAssets = Record<AssetId, number>;

export type WithdrawalStatus = "Pending" | "Approved" | "Rejected";

export const EMPTY_ASSETS: UserAssets = { solar: 0, windmill: 0, megafarm: 0 };

/* ──────────────────────────────────────────────────────────────
 *  users
 * ────────────────────────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    name: varchar("name", { length: 48 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    /** bcrypt hash — never returned to the client. */
    password: text("password").notNull(),

    coins: integer("coins").notNull().default(0),
    /** Lifetime coins credited (ads + yield), used for stats. */
    totalEarned: integer("total_earned").notNull().default(0),
    /** Lifetime commission earned from invited players (coins). */
    referralEarned: integer("referral_earned").notNull().default(0),

    referralCode: varchar("referral_code", { length: 12 }).notNull(),
    /** user id of the player who invited this account (null = organic). */
    referredBy: text("referred_by"),

    assets: jsonb("assets").$type<UserAssets>().notNull().default(EMPTY_ASSETS),

    lastYieldClaim: timestamp("last_yield_claim", { withTimezone: true }),

    adsWatchedToday: integer("ads_watched_today").notNull().default(0),
    /** ISO day bucket (YYYY-MM-DD) used to reset the daily ad counter. */
    lastAdDate: varchar("last_ad_date", { length: 10 }),
    adsWatchedTotal: integer("ads_watched_total").notNull().default(0),

    avatarSeed: varchar("avatar_seed", { length: 24 }).notNull().default("farmer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_uidx").on(table.email),
    uniqueIndex("users_referral_code_uidx").on(table.referralCode),
    index("users_referred_by_idx").on(table.referredBy),
  ],
);

/* ──────────────────────────────────────────────────────────────
 *  withdrawals
 * ────────────────────────────────────────────────────────────── */

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** denormalised so the admin ledger stays readable after profile edits */
    userName: varchar("user_name", { length: 48 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),

    /** human readable payout reference shown to the player (EF-XXXX) */
    reference: varchar("reference", { length: 24 }).notNull(),
    amountUsd: integer("amount_usd").notNull(),
    coinsSpent: integer("coins_spent").notNull(),
    accountNumber: varchar("account_number", { length: 32 }).notNull(),
    accountName: varchar("account_name", { length: 48 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 24 }).notNull(),

    status: varchar("status", { length: 16 }).notNull().default("Pending"),
    adminNote: text("admin_note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("withdrawals_reference_uidx").on(table.reference),
    index("withdrawals_user_idx").on(table.userId),
    index("withdrawals_status_idx").on(table.status),
  ],
);

/* ──────────────────────────────────────────────────────────────
 *  settings — single global economy row (id = 1)
 * ────────────────────────────────────────────────────────────── */

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),

  adRewardCoins: integer("ad_reward_coins").notNull().default(50),
  minWithdrawUsd: integer("min_withdraw_usd").notNull().default(1),
  /** coins required to cash out 1 USD */
  withdrawRate: integer("withdraw_rate").notNull().default(10000),

  dailyAdCap: integer("daily_ad_cap").notNull().default(10),
  yieldCooldownHours: integer("yield_cooldown_hours").notNull().default(24),

  // asset prices (yields live in src/lib/assets.ts as static catalogue meta)
  solarPrice: integer("solar_price").notNull().default(600),
  windmillPrice: integer("windmill_price").notNull().default(2400),
  megafarmPrice: integer("megafarm_price").notNull().default(12000),

  referralSharePercent: integer("referral_share_percent").notNull().default(10),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ──────────────────────────────────────────────────────────────
 *  Inferred row types
 * ────────────────────────────────────────────────────────────── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Settings = typeof settings.$inferSelect;
