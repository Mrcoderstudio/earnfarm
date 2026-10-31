import { redirect } from "next/navigation";
import { isAdminEmail, auth } from "@/auth";

export type SessionUser = { id: string; email: string; name: string };

/** Reads the Auth.js JWT session (Node runtime, server components & actions). */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
    };
  } catch {
    return null;
  }
}

/** Guard for every player route: /dashboard /store /ads /profile /withdraw */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

/** Guard for /admin — unlocked only for the configured operator account. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}

export { isAdminEmail };
