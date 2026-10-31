CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"ad_reward_coins" integer DEFAULT 50 NOT NULL,
	"min_withdraw_usd" integer DEFAULT 1 NOT NULL,
	"withdraw_rate" integer DEFAULT 10000 NOT NULL,
	"daily_ad_cap" integer DEFAULT 10 NOT NULL,
	"yield_cooldown_hours" integer DEFAULT 24 NOT NULL,
	"solar_price" integer DEFAULT 600 NOT NULL,
	"windmill_price" integer DEFAULT 2400 NOT NULL,
	"megafarm_price" integer DEFAULT 12000 NOT NULL,
	"referral_share_percent" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(48) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"referral_earned" integer DEFAULT 0 NOT NULL,
	"referral_code" varchar(12) NOT NULL,
	"referred_by" text,
	"assets" jsonb DEFAULT '{"solar":0,"windmill":0,"megafarm":0}'::jsonb NOT NULL,
	"last_yield_claim" timestamp with time zone,
	"ads_watched_today" integer DEFAULT 0 NOT NULL,
	"last_ad_date" varchar(10),
	"ads_watched_total" integer DEFAULT 0 NOT NULL,
	"avatar_seed" varchar(24) DEFAULT 'farmer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(48) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"reference" varchar(24) NOT NULL,
	"amount_usd" integer NOT NULL,
	"coins_spent" integer NOT NULL,
	"account_number" varchar(32) NOT NULL,
	"account_name" varchar(48) NOT NULL,
	"payment_method" varchar(24) NOT NULL,
	"status" varchar(16) DEFAULT 'Pending' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_uidx" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "users_referred_by_idx" ON "users" USING btree ("referred_by");--> statement-breakpoint
CREATE UNIQUE INDEX "withdrawals_reference_uidx" ON "withdrawals" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "withdrawals_user_idx" ON "withdrawals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "withdrawals_status_idx" ON "withdrawals" USING btree ("status");