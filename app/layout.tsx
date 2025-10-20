
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

// Lazy load header for better initial page load
const LiquidGlassHeader = dynamic(() => import("@/components/LiquidGlassHeader"), {
  ssr: true,
  loading: () => <div className="h-16 bg-transparent" />,
});

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
});

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
        {process.env.NEXT_PUBLIC_VERCEL === '1' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
        {process.env.NEXT_PUBLIC_SIMPLE_ANALYTICS === '1' && (
          <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
        )}
      </body>
    </html>
  );
}

