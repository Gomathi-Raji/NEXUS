"use client"

import React from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { PointerHighlight } from "@/components/ui/pointer-highlight"

// Lazy load heavy components
const Hero = dynamic(() => import("@/components/sections/hero/default"), {
  loading: () => <div className="min-h-[50vh] bg-black" />,
})

const SparklingGoldParticles = dynamic(
  () => import("@/components/ui/sparkling-gold-particles").then(mod => ({ default: mod.SparklingGoldParticles })),
  { ssr: false }
)
const FloatingGoldenOrbs = dynamic(
  () => import("@/components/ui/sparkling-gold-particles").then(mod => ({ default: mod.FloatingGoldenOrbs })),
  { ssr: false }
)
const GoldenSparkleTrail = dynamic(
  () => import("@/components/ui/sparkling-gold-particles").then(mod => ({ default: mod.GoldenSparkleTrail })),
  { ssr: false }
)

const Page = () => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Decorative Background - Lazy loaded */}
      <SparklingGoldParticles particleCount={50} size="sm" intensity="low" animationSpeed="slow" />
      <FloatingGoldenOrbs />
      <GoldenSparkleTrail />

      {/* Fullscreen Hero Cover - Responsive height with better mobile spacing */}
      <section className="relative w-full min-h-screen z-10 overflow-hidden flex items-center justify-center">
        {/* Background image */}
        <div className="absolute inset-0 bg-black bg-[url('/hero.png')] bg-cover bg-center bg-no-repeat" />

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

        {/* Centered Title - Better mobile spacing */}
        <div className="relative z-20 flex flex-col items-center justify-center w-full text-center px-6 py-16 space-y-8">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-gradient-to-r bg-clip-text text-5xl leading-[1.2] font-bold text-balance text-white drop-shadow-2xl sm:text-6xl sm:leading-[1.2] md:text-6xl md:leading-[1.2] lg:text-7xl lg:leading-[1.2]">
            <span className="inline-block align-middle">
              <PointerHighlight rectangleClassName="border-2 border-yellow-400" pointerClassName="text-yellow-400" containerClassName="inline-block align-middle">
                <span className="font-bold text-white-400 drop-shadow-[0_0_15px_rgba(190, 111, 9, 0.88)] transform hover:scale-110 transition-all duration-300 nexus-3d-title">NEXUS</span>
              </PointerHighlight>
            </span>
          </h1>
          
          <p className="text-golden-400/90 text-lg leading-relaxed font-medium max-w-[85%] sm:text-xl md:text-xl lg:text-2xl sm:max-w-xl md:max-w-2xl">
            Enter a concept to discover and analyze relevant open-source projects
          </p>

          {/* External badges - Better mobile sizing */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-[85%] sm:max-w-none">
            <a 
              href="https://peerlist.io/personal_dev/project/pick-me-a" 
              target="_blank" 
              rel="noreferrer noopener"
              aria-label="Open Peerlist project badge for Pick Me A"
              title="Open Peerlist project badge for Pick Me A"
              className="block rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://peerlist.io/api/v1/projects/embed/PRJHP6L86K6DDM88MIRR866DKOAJNP?showUpvote=true&theme=dark"
                alt="Pick Me A on Peerlist"
                className="w-full h-auto block min-h-[60px]"
                width="250"
                height="54"
                loading="lazy"
              />
            </a>

            <a 
              href="https://www.producthunt.com/products/pick-me-a?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pick%E2%80%91me%E2%80%91a" 
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Open Product Hunt badge for Pick Me A"
              title="Open Product Hunt badge for Pick Me A"
              className="block rounded-xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <Image 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1011161&theme=dark&t=1756707053692" 
                alt="Pick Me A - Discover your next favorite entertainment | Product Hunt" 
                className="w-full h-auto block min-h-[60px]"
                width={250}
                height={54}
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </section>

      {/* Hero Section - Better mobile spacing for search image */}
      <section className="relative z-30 -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-48 pt-8 pb-16 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="w-full px-4 sm:px-0">
          {/* Subtle separator line for visual flow */}
          <div className="w-24 sm:w-28 md:w-32 h-px bg-gradient-to-r from-transparent via-golden-400/50 to-transparent mx-auto mb-8"></div>
          
          <Hero
            title=""
            description=""
            badge={false}
          />
        </div>
      </section>
    </div>
  )
}

export default Page