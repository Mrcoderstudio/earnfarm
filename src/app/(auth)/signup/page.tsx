import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create your farm",
  description: "Register a free EarnFarm account — wallet, referral code and asset fleet included.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  if (await getSessionUser()) redirect("/dashboard");
  const params = await searchParams;
  const raw = Array.isArray(params?.ref) ? params.ref[0] : params?.ref;
  const initialReferral = (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

  return <AuthForm mode="signup" initialReferral={initialReferral} />;
}
