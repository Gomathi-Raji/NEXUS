/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArrowRightIcon } from "lucide-react";
import { ReactNode } from "react";
import Footer from "../Hero/Footer";
import Section2 from "../Hero/Section2";
import { CanvasCard } from "@/components/Hero/CanvasCard";
import CompareCard from "../CompareCard";
import { MagicBean } from "../Hero/MagicBean";

import { cn } from "@/lib/utils";

import Github from "../logos/github";
import { Badge } from "../ui/badge";
import { Button, type ButtonProps } from "../ui/button";
import Glow from "../ui/glow";
import { Mockup, MockupFrame } from "../ui/mockup";
import { PointerHighlight } from "../ui/pointer-highlight";
import Screenshot from "../ui/screenshot";
import Section from "@/components/ui/Section";
import { BentoCrad } from "@/components/Hero/BentoCrad";
import Features from "@/components/Hero/Features";
import { RollingText } from "@/components/Hero/RollingText";
interface HeroButtonProps {
  href: string;
  text: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

export default function Hero({
  title = "NEXUS",
  description = "Enter a concept to discover and analyze relevant open-source projects.",
  mockup = (
    <Screenshot
      srcLight="/images/search.png"
      srcDark="/images/search.png"
      alt="Search UI app screenshot"
      width={1248}
      height={765}
      className="w-full"
    />
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
  buttons = [
   
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0 pt-20 md:pt-28",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {badge !== false && badge}
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-gradient-to-r bg-clip-text text-3xl leading-tight font-semibold text-balance text-white drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight">
            What to <span className="inline-block align-middle"><PointerHighlight rectangleClassName="border-2 border-blue-400" pointerClassName="text-blue-400" containerClassName="inline-block align-middle"><span className="font-bold text-white-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transform hover:scale-110 transition-all duration-300" style={{
              textShadow: '0 0 20px rgba(128, 59, 246, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5)',
              transform: 'perspective(1000px) rotateX(-10deg) rotateY(5deg)',
              filter: 'drop-shadow(0 8px 16px rgba(59, 130, 246, 0.3))'
            }}>Build?</span></PointerHighlight></span>
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {/* Removed Search Projects button */}
          {mockup !== false && (
            <div className="relative w-full pt-12 pb-10">
              <a href="/search" className="block">
                <MockupFrame
                  className="animate-appear opacity-0 delay-700"
                  size="small"
                >
                  <Mockup
                    type="responsive"
                    className="bg-background/90 w-full rounded-xl border-0"
                  >
                    {mockup}
                  </Mockup>
                </MockupFrame>
              </a>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 delay-1000"
              />
            </div>
          )}
        </div>
      </div>

      <MagicBean />

      <div>
        <Features forceDarkMode={true} />
      </div>
      
      {/* BentoCrad section with same Hero background */}
      {/* <div className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-container mx-auto">
          <BentoCrad />
        </div>
      
      </div> */}
      {/* <CanvasCard /> */}

       

      <CompareCard />
      
      <Section2 />

      <RollingText />

     
      
       <Footer />

    </Section>
  );
}
