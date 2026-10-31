import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createUniqueReferralCode } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { findReferrerByCode } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Very small in-process throttle so bots cannot hammer the registration table. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Farmer name needs at least 3 characters.")
    .max(24, "Farmer name is limited to 24 characters.")
    .regex(/^[a-zA-Z0-9_.\- ]+$/, "Letters, numbers, dot, dash and underscore only."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password needs at least 8 characters.")
    .max(72, "Password is too long.")
    .regex(/[a-zA-Z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
  referralCode: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]{4,12}$/)
    .optional()
    .or(z.literal("")),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 13+ and accept the terms." }),
  }),
});

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts — wait a minute and try again." },
      { status: 429 },
    );
  }

  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid registration data." },
      { status: 422 },
    );
  }

  const { name, email, password, referralCode } = parsed.data;

  try {
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (taken) {
      return NextResponse.json(
        { error: "That email is already harvested on EarnFarm. Try signing in." },
        { status: 409 },
      );
    }

    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await findReferrerByCode(referralCode);
      if (!referrer) {
        return NextResponse.json({ error: "Referral code not found." }, { status: 422 });
      }
      referrerId = referrer.id;
    }

    const hash = await bcrypt.hash(password, 12);
    const code = await createUniqueReferralCode();

    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hash,
        coins: 0,
        referralCode: code,
        referredBy: referrerId,
        avatarSeed: name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) || "farmer",
      })
      .returning({ id: users.id, name: users.name, email: users.email, referralCode: users.referralCode });

    if (!created) {
      return NextResponse.json({ error: "Could not create the account." }, { status: 500 });
    }

    return NextResponse.json(
      { user: { ...created, hasReferrer: Boolean(referrerId) } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[earnfarm] registration failed", error);
    return NextResponse.json(
      { error: "Registration failed — please try again shortly." },
      { status: 500 },
    );
  }
}
