"use client";

import { ArrowRightIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Testimonials } from "@/components/Hero/Testimonials";
import GitHubStarBadge from "@/components/Hero/GitHubStarBadge";

// Defer heavy, below-the-fold components to client after first paint
const MagicBean = dynamic(() => import("@/components/Hero/MagicBean").then(m => ({ default: m.MagicBean })), {
  ssr: false,
  loading: () => null,
});
const FeaturesLazy = dynamic(() => import("@/components/Hero/Features"), {
  ssr: false,
  loading: () => null,
});
const CompareCardLazy = dynamic(() => import("@/components/Hero/ComapringThEDevCard").then(m => ({ default: m.CompareCard })), {
  ssr: false,
  loading: () => null,
});
const ReadmeLazy = dynamic(() => import("@/components/Hero/Readme"), {
  ssr: false,
  loading: () => null,
});
const Section2Lazy = dynamic(() => import("@/components/Hero/Section2"), {
  ssr: false,
  loading: () => null,
});
const FooterLazy = dynamic(() => import("@/components/Hero/Footer"), {
  ssr: false,
  loading: () => null,
});

import { cn } from "@/lib/utils";

import { Badge } from "../../ui/badge";
import Glow from "../../ui/glow";
import { Mockup, MockupFrame } from "../../ui/mockup";
import { PointerHighlight } from "../../ui/pointer-highlight";
import Screenshot from "../../ui/screenshot";
import Section from "@/components/ui/Section";

interface HeroProps {
  title?: string;
  description?: string;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  className?: string;
}

export default function Hero({
  title = "NEXUS",
  description = "Enter a concept to discover and analyze relevant open-source projects.",
  mockup = (
  <div className="w-full flex px-4 sm:px-0">
    <Screenshot
      srcLight="/GithubImages/search.png"
      srcDark="/GithubImages/search.png"
      alt="Search UI app screenshot"
      width={1920}
      height={1080}
      className="w-full rounded-xl sm:rounded-xl md:rounded-2xl shadow-2xl border border-border/30 object-contain"
    />
  </div>
),

  badge = (
    <Badge variant="outline" className="animate-appear">
      <span className="text-muted-foreground">
        New version of Launch UI is out!
      </span>
      <a href="https://www.launchuicomponents.com/" className="flex items-center gap-1">
        Get started
        <ArrowRightIcon className="size-3" />
      </a>
    </Badge>
  ),
  className,
}: HeroProps) {
  // Mount gate to defer heavy components until after first paint/idle
  const [deferHeavy, setDeferHeavy] = useState(false);

  useEffect(() => {
    // Prefer idle; fallback to timeout for broader support
    type RIC = (cb: () => void) => number;
    type CIC = (id: number) => void;
    const w = window as unknown as {
      requestIdleCallback?: RIC;
      cancelIdleCallback?: CIC;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setDeferHeavy(true));
      return () => {
        if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(() => setDeferHeavy(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  // Smooth scroll performance optimization
  useEffect(() => {
    const root = document.documentElement;
    let scrollTimeout: number | null = null;
    const onScroll = () => {
      if (!root.classList.contains('scrolling')) root.classList.add('scrolling');
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        root.classList.remove('scrolling');
        scrollTimeout = null;
      }, 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      {/* Add shimmer animation to global styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
      
      <Section
        className={cn(
          "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0 pt-8 sm:pt-12 md:pt-20 lg:pt-28 relative",
          className,
        )}
      >
        {/* Golden particle overlay for hero section - responsive sizing */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-[radial-gradient(circle,rgba(255,215,0,0.1),transparent_70%)] rounded-full blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-3/4 right-1/4 w-12 h-12 sm:w-18 sm:h-18 md:w-24 md:h-24 bg-[radial-gradient(circle,rgba(218,165,32,0.08),transparent_70%)] rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-30 sm:h-30 md:w-40 md:h-40 bg-[radial-gradient(circle,rgba(205,127,50,0.06),transparent_70%)] rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Top-right GitHub star badge for desktop */}
        <div className="pointer-events-auto fixed right-4 top-4 z-40 hidden sm:block">
          <GitHubStarBadge repoFullName="itzdineshx/NEXUS" />
        </div>
        
        {/* Mobile placement: floating bottom-right to avoid header overlap */}
        <div className="sm:hidden fixed right-3 bottom-3 z-40">
          <GitHubStarBadge repoFullName="itzdineshx/NEXUS" compact />
        </div>
        
        <div className="w-full flex flex-col gap-8 sm:gap-8 md:gap-10 lg:gap-12 pt-8 sm:pt-10 md:pt-12 lg:pt-16">
          <div className="flex flex-col items-center gap-6 sm:gap-4 md:gap-6 lg:gap-8 text-center px-6 sm:px-6 md:px-8 lg:px-8">
            {badge !== false && (
              <div className="scale-90 sm:scale-90 md:scale-100">
                {badge}
              </div>
            )}
            
            <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-gradient-to-r bg-clip-text text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl leading-tight font-bold text-balance text-white drop-shadow-2xl">
              {/* Golden sparkle effect behind title - responsive sizing */}
              <div className="absolute -inset-3 sm:-inset-3 md:-inset-4 lg:-inset-4 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15),transparent_70%)] blur-xl sm:blur-xl md:blur-2xl -z-10 rounded-full" />
              <span className="inline-block align-middle">
                <PointerHighlight 
                  rectangleClassName="border-2 border-golden-400" 
                  pointerClassName="text-golden-400" 
                  containerClassName="inline-block align-middle"
                >
                  <span 
                    className="font-bold text-white drop-shadow-[0_0_10px_rgba(255,215,0,0.6)] sm:drop-shadow-[0_0_10px_rgba(255,215,0,0.6)] md:drop-shadow-[0_0_12px_rgba(255,215,0,0.6)] transform hover:scale-110 transition-all duration-300" 
                    style={{
                      textShadow: '0 0 15px rgba(255, 215, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.5)',
                      transform: 'perspective(1000px) rotateX(-8deg) rotateY(3deg)',
                      filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.2)) sm:drop-shadow(0 8px 16px rgba(255, 215, 0, 0.3))'
                    }}
                  >
                    {title}
                  </span>
                </PointerHighlight>
              </span>
            </h1>
            
            <div className="text-base sm:text-base md:text-lg lg:text-xl xl:text-2xl animate-appear text-muted-foreground relative z-10 max-w-[90%] sm:max-w-[400px] md:max-w-[550px] lg:max-w-[650px] xl:max-w-[740px] font-medium text-balance opacity-0 delay-100 leading-relaxed">
              {/* Golden sparkle dots around description - responsive positioning */}
              <div className="absolute -left-3 sm:-left-4 md:-left-5 lg:-left-6 -top-1 sm:-top-1 md:-top-2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-[radial-gradient(circle,rgba(255,215,0,0.6),transparent_70%)] rounded-full animate-pulse" />
              <div className="absolute -right-3 sm:-right-4 md:-right-5 lg:-right-6 -bottom-1 sm:-bottom-1 md:-bottom-2 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-[radial-gradient(circle,rgba(218,165,32,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -left-4 sm:-left-5 md:-left-6 lg:-left-8 top-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-[radial-gradient(circle,rgba(205,127,50,0.4),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              {description}
            </div>
            
            {mockup !== false && (
              <div className="relative w-full pt-2 sm:pt-2 md:pt-4 lg:pt-2 pb-4 sm:pb-4 md:pb-6 lg:pb-2 px-0">
                {/* Golden sparkle effects around mockup - responsive sizing and positioning */}
                <div className="absolute -left-3 sm:-left-4 md:-left-6 lg:-left-8 top-1/2 w-2 sm:w-2.5 md:w-3 lg:w-4 h-2 sm:h-2.5 md:h-3 lg:h-4 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
                <div className="absolute -right-3 sm:-right-4 md:-right-6 lg:-right-8 top-1/2 w-2 sm:w-2.5 md:w-3 lg:w-3.5 h-2 sm:h-2.5 md:h-3 lg:h-3.5 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.7s' }} />
                <div className="absolute left-1/2 -top-2 sm:-top-3 md:-top-4 lg:-top-6 w-1.5 sm:w-2 md:w-2.5 h-1.5 sm:h-2 md:h-2.5 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1.2s' }} />
                
                <Link href="/search" className="block w-full" prefetch={true}>
                  <MockupFrame
                    className="animate-appear opacity-0 delay-700 w-full"
                    size="small"
                  >
                    <Mockup
                      type="responsive"
                      className="bg-background/95 w-full rounded-xl sm:rounded-xl md:rounded-2xl border-0 shadow-2xl"
                    >
                      {mockup}
                    </Mockup>
                  </MockupFrame>
                </Link>
                <Glow
                  variant="top"
                  className="animate-appear-zoom opacity-0 delay-1000 scale-75 sm:scale-80 md:scale-90 lg:scale-100"
                />
              </div>
            )}
          </div>
        </div>

        {deferHeavy && <MagicBean />}

        <div>
          {deferHeavy && <FeaturesLazy forceDarkMode={true} />}
        </div>

        {deferHeavy && <CompareCardLazy />}

        {deferHeavy && <ReadmeLazy />}

        {deferHeavy && <Testimonials />}
        
        {deferHeavy && <Section2Lazy />}

        {deferHeavy && <FooterLazy />}
      </Section>
    </>
  );
}