import { SparkIcon } from "./icons";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-9 place-items-center rounded-2xl bg-gradient-to-br from-neon to-[#00b25c] text-[#04240f] shadow-[0_10px_28px_-10px_rgba(0,230,118,0.9)]">
        <LeafMark />
      </span>
      {!compact ? (
        <span className="display text-[19px] font-bold tracking-tight text-ice">
          Earn<span className="text-neon">Farm</span>
        </span>
      ) : null}
    </span>
  );
}

export function LeafMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21V11" />
      <path d="M12 11c0-4.4 3.1-7.5 8-8-.5 4.9-3.6 8-8 8Z" />
      <path d="M12 15c-4 0-6.8-2.4-7.4-6.2C8.2 8.4 11.2 10.4 12 15Z" />
    </svg>
  );
}

export function LogoBadge() {
  return (
    <span className="grid size-14 place-items-center rounded-3xl border border-neon/30 bg-neon/[0.07] text-neon">
      <SparkIcon className="size-7" />
    </span>
  );
}
