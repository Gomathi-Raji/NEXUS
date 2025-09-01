
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

import { cn } from "@/lib/utils";
import LiquidGlassHeader from "@/components/LiquidGlassHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NEXUS",
  description: "Get AI-powered project ideas, find similar repositories, and get a visual plan to build it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://peerlist.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://peerlist.io" />
        <link rel="preconnect" href="https://api.producthunt.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.producthunt.com" />
      </head>
      <body className={cn(inter.className, "bg-black text-white")}> 
        <div className="min-h-screen w-full relative">
          <LiquidGlassHeader />
          <main className="relative z-10">
            {children}
          </main>
        </div>
        <Analytics />
        <SpeedInsights />
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      </body>
    </html>
  );
}

