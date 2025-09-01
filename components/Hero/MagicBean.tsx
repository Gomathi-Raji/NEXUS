"use client";

import React, { forwardRef, useRef } from "react";



import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { Github, Dock, Gitlab, Slack, Chrome, TerminalSquare, Feather } from 'lucide-react';
import { BookOpen } from 'lucide-react';

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-14 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-black/70 to-black/50 p-3 backdrop-blur-xl shadow-[0_0_30px_-5px_rgba(120,120,255,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_0px_rgba(120,120,255,0.4)] group",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";


export function MagicBean() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);
  const div8Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden p-6 sm:p-10 md:p-16 h-[520px] sm:h-[600px] md:h-[700px]"
      ref={containerRef}
    >
      {/* Background radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.35),rgba(218,165,32,0.15)_45%,transparent_70%)] blur-2xl" />
        <div className="absolute left-[20%] top-[25%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.25),transparent_60%)] blur-2xl" />
        <div className="absolute left-[80%] top-[70%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(205,127,50,0.2),transparent_60%)] blur-2xl" />
      </div>

      <div className="flex size-full sm:max-h-[560px] md:max-h-[600px] max-w-5xl flex-col items-stretch justify-between gap-12 sm:gap-16 md:gap-24 relative">
        {/* Additional golden sparkle effects */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-[radial-gradient(circle,rgba(255,215,0,0.2),transparent_70%)] rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-[radial-gradient(circle,rgba(218,165,32,0.15),transparent_70%)] rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-[radial-gradient(circle,rgba(205,127,50,0.12),transparent_70%)] rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.3s' }} />
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <Gitlab className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
          <Circle ref={div5Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <Dock className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
          <Circle ref={div6Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <Slack className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <Chrome className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
          <Circle ref={div4Ref} className="size-20 md:size-24 bg-gradient-to-br from-black/70 to-black/50 border-white/20 shadow-[0_0_40px_0px_rgba(255,215,0,0.5),0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center">
            <Github className="w-12 h-12 md:w-16 md:h-16 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.6))'}} />
          </Circle>
          <Circle ref={div3Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <TerminalSquare className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between mx-auto w-4/5 sm:w-3/4">
          <Circle ref={div7Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <Feather className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
          <Circle ref={div8Ref} className="size-12 md:size-14 shadow-[0_0_30px_-5px_rgba(255,215,0,0.3),0_0_15px_rgba(255,255,255,0.2)]">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-white/80 transition-all duration-300 group-hover:text-white" style={{filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
        curvature={-60}
        endYOffset={15}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div8Ref}
        toRef={div4Ref}
        curvature={60}
        endYOffset={15}
      />
    </div>
  );
}

