"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertIcon, CheckIcon, CloseIcon, CoinIcon } from "./icons";

export type ToastTone = "success" | "error" | "reward";
export type Toast = { id: number; tone: ToastTone; title: string; body?: string };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let counter = 0;

function emit() {
  listeners.forEach((notify) => notify());
}

function dismiss(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export function pushToast(toast: Omit<Toast, "id">) {
  const id = ++counter;
  toasts = [...toasts, { ...toast, id }].slice(-3);
  emit();
  setTimeout(() => dismiss(id), toast.tone === "error" ? 5200 : 3600);
  return id;
}

export function useToasts() {
  const store = useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => toasts,
    () => EMPTY_TOASTS,
  );
  return { toasts: store, dismiss };
}

const EMPTY_TOASTS: Toast[] = [];

const TONES: Record<ToastTone, { ring: string; icon: typeof CheckIcon; tint: string }> = {
  success: { ring: "border-neon/40", icon: CheckIcon, tint: "text-neon" },
  reward: { ring: "border-gold/45", icon: CoinIcon, tint: "text-gold" },
  error: { ring: "border-danger/45", icon: AlertIcon, tint: "text-danger" },
};

export function Toaster() {
  const { toasts: live, dismiss: hide } = useToasts();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") toasts.forEach((toast) => hide(toast.id));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toasts, hide]);

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end">
      <AnimatePresence initial={false}>
        {live.map((toast) => {
          const tone = TONES[toast.tone];
          const Icon = tone.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className={`glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 ${tone.ring}`}
            >
              <span className={`mt-0.5 shrink-0 ${tone.tint}`}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ice">{toast.title}</span>
                {toast.body ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-mist">
                    {toast.body}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => hide(toast.id)}
                className="rounded-lg p-1 text-mist transition hover:bg-white/5 hover:text-ice"
                aria-label="Dismiss notification"
              >
                <CloseIcon className="size-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
