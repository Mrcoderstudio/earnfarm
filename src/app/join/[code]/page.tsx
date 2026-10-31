import { redirect } from "next/navigation";
import { findReferrerByCode } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Shareable invite URL: earnfarm.app/join/AB12CD
 * The code is resolved against Postgres; an unknown code still lands the
 * visitor on signup, just without the referral pre-fill.
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const clean = (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const referrer = clean ? await findReferrerByCode(clean) : null;

  redirect(referrer ? `/signup?ref=${referrer.referralCode}` : "/signup");
}
