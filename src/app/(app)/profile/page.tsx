import { redirect } from "next/navigation";
import { isAdminEmail } from "@/auth";
import { getReferralRows, getReferralSummary, getSettings, getUserById } from "@/lib/data";
import { buildSnapshot } from "@/lib/snapshot";
import { requireUser } from "@/lib/session";
import { ProfileView, type ProfileData } from "@/components/profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireUser();
  const [user, s] = await Promise.all([getUserById(session.id), getSettings()]);
  if (!user) redirect("/signin");

  const [summary, recruits] = await Promise.all([
    getReferralSummary(user.id),
    getReferralRows(user.id),
  ]);
  const snapshot = buildSnapshot(user, s);

  const data: ProfileData = {
    name: user.name,
    email: user.email,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
    coins: snapshot.coins,
    usd: snapshot.usd,
    totalEarned: user.totalEarned,
    referralEarned: user.referralEarned,
    adsWatchedTotal: user.adsWatchedTotal,
    isAdmin: isAdminEmail(user.email),
    withdrawRate: s.withdrawRate,
    referralSharePercent: s.referralSharePercent,
    fleet: snapshot.assets,
    invitedCount: summary.invited,
    withdrawnCoins: summary.withdrawnCoins,
    referred: recruits.map((row) => ({
      id: row.id,
      name: row.name,
      joinedAt: row.createdAt.toISOString(),
      coins: row.coins,
      adsWatchedTotal: row.adsWatchedTotal,
    })),
  };

  return <ProfileView data={data} />;
}
