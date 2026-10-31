import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your EarnFarm wallet, fleet and payout queue.",
};

export default async function SignInPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return <AuthForm mode="signin" />;
}
