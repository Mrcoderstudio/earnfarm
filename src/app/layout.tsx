import type { Metadata, Viewport } from "next";
import Script from "next/script"; // <--- Naya import
import "./globals.css";

const TITLE = "EarnFarm — Play, Grow & Earn";
const DESCRIPTION =
  "EarnFarm is a play-to-earn farming simulation: build solar arrays, wind turbines and mega farm domes, watch rewarded ads, harvest daily coins and cash out to JazzCash or Easypaisa.";

export const metadata: Metadata = {
  title: { default: TITLE, template: "%s · EarnFarm" },
  description: DESCRIPTION,
  applicationName: "EarnFarm",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "EarnFarm",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  icons: [{ rel: "icon", url: "/icon.svg", type: "image/svg+xml" }],
};

export const viewport: Viewport = {
  themeColor: "#0b132b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body>
        {children}

        {/* MONETAG MULTITAG SCRIPT YAHAN LAGA HAI */}
        <Script
          src="https://quge5.com/88/tag.min.js"
          data-zone="303999"
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}