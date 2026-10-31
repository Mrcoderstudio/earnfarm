"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { CoinIcon, SpinnerIcon } from "./icons";
import { formatCoins } from "@/lib/format";

/* ── Card ─────────────────────────────────────────────────────── */

export function Card({
  children,
  className = "",
  glow = false,
  ...rest
}: { children: ReactNode; className?: string; glow?: boolean } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={`glass rounded-3xl ${glow ? "glow-neon" : ""} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ── Button ───────────────────────────────────────────────────── */

type Variant = "neon" | "gold" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  neon:
    "bg-neon text-[#04240f] shadow-[0_18px_40px_-18px_rgba(0,230,118,0.85)] hover:bg-neon-2 disabled:bg-neon/40",
  gold:
    "bg-gold text-[#2a2100] shadow-[0_18px_40px_-18px_rgba(255,215,0,0.85)] hover:bg-gold-2 disabled:bg-gold/40",
  ghost: "bg-white/[0.04] text-ice hover:bg-white/[0.09] border border-line/70",
  outline: "border border-neon/45 text-neon hover:bg-neon/10",
  danger: "bg-danger/90 text-white hover:bg-danger",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-2xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
};

/** Native button props minus the handlers Framer Motion re-types. */
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragOver"
  | "onDragLeave"
  | "onDragExit"
  | "onDrop"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onTransitionEnd"
  | "style"
>;

export const Button = forwardRef<
  HTMLButtonElement,
  {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: ReactNode;
    full?: boolean;
  } & NativeButtonProps
>(function Button(
  { variant = "neon", size = "md", loading = false, icon, full, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: loading || disabled ? 1 : 0.965 }}
      whileHover={{ y: loading || disabled ? 0 : -1 }}
      transition={{ type: "spring", stiffness: 520, damping: 30 }}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center overflow-hidden font-semibold tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <SpinnerIcon className="size-4 animate-spin" />
      ) : (
        icon ?? null
      )}
      <span className="truncate">{children}</span>
    </motion.button>
  );
});

/* ── Badges & meters ──────────────────────────────────────────── */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "neon" | "gold" | "danger" | "sky";
  className?: string;
}) {
  const tones = {
    neutral: "border-line/80 bg-white/[0.04] text-mist",
    neon: "border-neon/40 bg-neon/10 text-neon",
    gold: "border-gold/40 bg-gold/10 text-gold",
    danger: "border-danger/45 bg-danger/10 text-danger",
    sky: "border-sky/40 bg-sky/10 text-sky",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "neon",
  className = "",
}: {
  value: number;
  tone?: "neon" | "gold" | "sky" | "danger";
  className?: string;
}) {
  const colors = {
    neon: "from-neon/70 to-neon",
    gold: "from-gold/60 to-gold",
    sky: "from-sky/60 to-sky",
    danger: "from-danger/60 to-danger",
  } as const;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <motion.div
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 26 }}
        className={`h-full rounded-full bg-gradient-to-r ${colors[tone]}`}
      />
    </div>
  );
}

/* ── Animated coin readout ────────────────────────────────────── */

export function useCountUp(value: number, duration = 650) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    if (Math.round(from) === Math.round(value)) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (value - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

export function CoinAmount({
  coins,
  className = "",
  size = "md",
}: {
  coins: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const animated = useCountUp(coins);
  const scales = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-4xl sm:text-5xl",
    xl: "text-5xl sm:text-7xl",
  } as const;
  return (
    <span className={`num inline-flex items-center gap-2 ${scales[size]} ${className}`}>
      <CoinIcon className="size-[1.1em] shrink-0 text-gold" />
      {formatCoins(Math.round(animated))}
    </span>
  );
}

/* ── Form field ───────────────────────────────────────────────── */

export const Field = forwardRef<
  HTMLInputElement,
  {
    label: string;
    hint?: string;
    error?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
  } & InputHTMLAttributes<HTMLInputElement>
>(function Field({ label, hint, error, leading, trailing, className = "", ...rest }, ref) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">
          {label}
        </span>
        {hint ? <span className="text-[11px] text-mist/80">{hint}</span> : null}
      </span>
      <span
        className={`flex items-center gap-2.5 rounded-2xl border bg-deep-2/70 px-3.5 transition focus-within:border-neon/55 focus-within:shadow-[0_0_0_4px_rgba(0,230,118,0.10)] ${
          error ? "border-danger/60" : "border-line/70"
        }`}
      >
        {leading ? <span className="shrink-0 text-mist">{leading}</span> : null}
        <input
          ref={ref}
          className={`h-12 w-full min-w-0 bg-transparent text-[15px] text-ice outline-none placeholder:text-mist/45 ${className}`}
          {...rest}
        />
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
      </span>
      {error ? <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
});

/* ── Segmented control ────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  const handle = useCallback(
    (next: T) => onChange(next),
    [onChange],
  );
  return (
    <div className={`flex gap-1 rounded-2xl border border-line/70 bg-deep-2/60 p-1 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handle(option.value)}
            className="relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition"
          >
            {active ? (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join("-")}`}
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-neon/12 ring-1 ring-neon/40"
              />
            ) : null}
            <span className={`relative z-10 flex items-center gap-2 ${active ? "text-neon" : "text-mist"}`}>
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Section heading ──────────────────────────────────────────── */

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-bold text-ice sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line/80 bg-deep-2/40 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-line/70 bg-white/[0.03] text-mist">
        {icon}
      </span>
      <p className="text-sm font-semibold text-ice">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-mist">{body}</p>
      {action}
    </div>
  );
}
