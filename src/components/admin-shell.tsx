"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Logo } from "./logo";
import { Toaster } from "./toast";
import { Badge } from "./ui";
import { ArrowIcon, HomeIcon, LogoutIcon, ShieldIcon } from "./icons";

export function AdminShell({
  name,
  email,
  children,
}: {
  name: string;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-deep/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden items-center gap-1.5 rounded-full border border-danger/40 bg-danger/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-danger sm:inline-flex">
              <ShieldIcon className="size-3.5" />
              operator console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-right sm:block">
              <span className="block text-xs font-semibold text-ice">{name}</span>
              <span className="block text-[10px] text-mist">{email}</span>
            </span>
            <Badge tone="danger" className="!tracking-[0.1em] lg:hidden">
              admin
            </Badge>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-line/70 px-3 text-xs font-semibold text-mist transition hover:border-neon/40 hover:text-neon"
            >
              <HomeIcon className="size-4" />
              <span className="hidden sm:inline">Back to farm</span>
              <ArrowIcon className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/signin" })}
              className="grid size-10 place-items-center rounded-2xl border border-line/70 text-mist transition hover:border-danger/50 hover:text-danger"
              aria-label="Sign out"
            >
              <LogoutIcon className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:pb-12">{children}</main>
      <Toaster />
    </div>
  );
}
