import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CoinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2v9.6M14.6 9.3c-.6-.7-1.6-1.1-2.6-1.1-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2.1c1.8.4 2.8.9 2.8 2.1s-1.2 2-2.8 2c-1.1 0-2.1-.4-2.7-1.1" />
    </svg>
  );
}

export function SolarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 15h16l-2-8H6l-2 8Z" />
      <path d="M12 7v8M7.6 7.4 6.4 15M16.4 7.4 17.6 15M9 19h6l.6 2.2H8.4L9 19Z" />
    </svg>
  );
}

export function WindIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 13.5V22M9.6 22h4.8" />
      <path d="M12 11.6c0-3 .6-5.4 2-7.2 1.2-1.5 3-1.6 3.7.2.7 1.8-.5 3.5-2.4 4.6-1.5.9-2.6 1.6-3.3 2.4Z" />
      <path d="M10.7 12.3c-2.6-1.5-4.9-2-7.2-1.5-1.9.4-2.5 2.2-1 3.3 1.5 1.1 3.3.7 4.7-.5 1.2-1 2.2-1.5 3.5-1.3Z" />
      <path d="M13.2 13c1.9 2.3 4 3.7 6.5 4 1.9.2 2.9-1.3 2-3-.9-1.6-2.8-2-4.7-1.7-1.7.3-2.8.4-3.8.7Z" />
    </svg>
  );
}

export function DomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 19h18M4.5 19a7.5 7.5 0 0 1 15 0" />
      <path d="M12 5.5V19M7 7.2c1.6 1 3.2 1.5 5 1.5s3.4-.5 5-1.5" />
      <path d="M9.2 19a9.6 9.6 0 0 1 0-9.4M14.8 19a9.6 9.6 0 0 0 0-9.4M12 2.6v1.6" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.4Z" />
    </svg>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9h16v10.5a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5V9Z" />
      <path d="M3.2 9 5 4h14l1.8 5M4 9a2.6 2.6 0 0 0 5 0 2.6 2.6 0 0 0 5 0 2.6 2.6 0 0 0 5 0M9.6 19.8v-5.4h4.8v5.4" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M10.2 9.1 15.4 12l-5.2 2.9V9.1Z" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.6" r="3.6" />
      <path d="M5.2 20c.9-3.4 3.6-5.2 6.8-5.2s5.9 1.8 6.8 5.2" />
    </svg>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z" />
      <path d="M3.5 8.5 15 5.2M16.6 12.8h2.9v2.6h-2.9a1.3 1.3 0 0 1 0-2.6Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2l7 2.6v6c0 4-2.9 7.3-7 8.9-4.1-1.6-7-4.9-7-8.9v-6l7-2.6Z" />
      <path d="m9 12.1 2.1 2.1L15.3 10" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9.4" cy="9" r="3.3" />
      <path d="M3.6 19.4c.7-3 3-4.6 5.8-4.6s5.1 1.6 5.8 4.6" />
      <path d="M16 6.2a3.2 3.2 0 0 1 0 6.1M17.4 14.9c2.1.5 3.4 2 3.9 4.2" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V4M4 20h16M8 17V11M12.4 17V7.5M16.8 17v-4.2" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.8 4.4 4.4L19 7.4" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 9V5.6a1.6 1.6 0 0 1 1.6-1.6h6.2A1.6 1.6 0 0 1 18.4 5.6V14a1.6 1.6 0 0 1-1.6 1.6H14" />
      <path d="M5.6 9h6.8A1.6 1.6 0 0 1 14 10.6v6.8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.4v-6.8A1.6 1.6 0 0 1 5.6 9Z" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.8 12h14M13.4 6.6 18.8 12l-5.4 5.4" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3.2 2" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.4 3 5.6 13.4h5L9.8 21l8.2-10.6h-5.4L13.4 3Z" />
    </svg>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.4 10.4h15.2v8.4a1.4 1.4 0 0 1-1.4 1.4H5.8a1.4 1.4 0 0 1-1.4-1.4v-8.4Z" />
      <path d="M3.4 7.2h17.2v3.2H3.4zM12 7.2v13M12 7.2C10.6 4 8 3.2 7 4.6s1 3.2 5 2.6ZM12 7.2c1.4-3.2 4-4 5-2.6s-1 3.2-5 2.6Z" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.2 13.8a3.6 3.6 0 0 1 0-5.1l2.6-2.6a3.6 3.6 0 0 1 5.1 5.1l-1.3 1.3" />
      <path d="M13.8 10.2a3.6 3.6 0 0 1 0 5.1l-2.6 2.6a3.6 3.6 0 0 1-5.1-5.1l1.3-1.3" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.6 10.6h10.8v8.2a1.2 1.2 0 0 1-1.2 1.2H7.8a1.2 1.2 0 0 1-1.2-1.2v-8.2Z" />
      <path d="M9.2 10.6V7.8a2.8 2.8 0 0 1 5.6 0v2.8" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 6.6h16.8v10.8H3.6z" />
      <path d="m4.4 7.4 7.6 5.4 7.6-5.4" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.4 4.6H6.8A1.8 1.8 0 0 0 5 6.4v11.2a1.8 1.8 0 0 0 1.8 1.8h7.6" />
      <path d="M11.6 12h8.2M16.8 8.8 20 12l-3.2 3.2" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 6.8v4.4h-4.4" />
      <path d="M19.2 11.2A7.4 7.4 0 1 0 12 19.4a7.4 7.4 0 0 0 6.4-3.7" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4l1.9 5 5 1.9-5 1.9-1.9 5-1.9-5-5-1.9 5-1.9 1.9-5Z" />
      <path d="M18.6 3.2l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.6a8.4 8.4 0 1 1-5.9 2.4" opacity=".95" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.4l8.4 14.6H3.6L12 4.4Z" />
      <path d="M12 10v3.6M12 16.6v.1" />
    </svg>
  );
}

export function TrendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16.4l4.8-4.8 3.2 3.2L20 7.2" />
      <path d="M15.4 7.2H20v4.6" />
    </svg>
  );
}

export const ASSET_ICONS = {
  solar: SolarIcon,
  windmill: WindIcon,
  megafarm: DomeIcon,
} as const;
