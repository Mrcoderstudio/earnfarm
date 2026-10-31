import Link from "next/link";
import { Logo } from "@/components/logo";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="glass w-full max-w-md rounded-[30px] p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="num mt-6 text-6xl font-bold text-neon/25">404</p>
        <h1 className="display mt-1 text-2xl font-bold text-ice">This field is empty</h1>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          The page you were looking for was never planted. Head back to the farm and check your harvest
          queue.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-neon px-6 text-sm font-bold text-[#04240f] shadow-[0_18px_40px_-18px_rgba(0,230,118,0.9)] transition hover:bg-neon-2"
        >
          Return to the dashboard
          <ArrowIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}
