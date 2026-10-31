import { handlers } from "@/auth";

// NextAuth.js (Auth.js v5) — Credentials provider only.
// POST /api/auth/callback/credentials · GET /api/auth/session · POST /api/auth/signout
export const { GET, POST } = handlers;
