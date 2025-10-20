"use client"

import React from "react"
import Image from "next/image"
import Hero from "@/components/sections/hero/default"
import {
  SparklingGoldParticles,
  FloatingGoldenOrbs,
  GoldenSparkleTrail,
} from "@/components/ui/sparkling-gold-particles"
import { PointerHighlight } from "@/components/ui/pointer-highlight"

const Page = () => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Decorative Background */}
      <SparklingGoldParticles particleCount={80} size="md" intensity="medium" animationSpeed="normal" />
      <FloatingGoldenOrbs />
      <GoldenSparkleTrail />

      {/* Fullscreen Hero Cover - Optimized without 3D element */}
      <section className="relative w-full h-screen z-10 overflow-hidden">
        {/* Elegant gradient background instead of Spline */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-amber-950/20 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(180,83,9,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

        {/* Centered Title - Positioned higher for better flow */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-gradient-to-r bg-clip-text text-3xl leading-tight font-semibold text-balance text-white drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight">
            <span className="inline-block align-middle">
              <PointerHighlight rectangleClassName="border-2 border-yellow-400" pointerClassName="text-yellow-400" containerClassName="inline-block align-middle">
                <span className="font-bold text-white-400 drop-shadow-[0_0_10px_rgba(190, 111, 9, 0.88)] transform hover:scale-110 transition-all duration-300 nexus-3d-title">NEXUS</span>
              </PointerHighlight>
            </span>
          </h1>
          <p className="text-golden-400/80 text-lg md:text-xl mt-4 max-w-2xl">
            Enter a concept to discover and analyze relevant open-source projects
          </p>

          {/* External badges below the heading and description */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 flex-wrap relative z-30 pointer-events-auto">
            <a 
              href="https://peerlist.io/personal_dev/project/pick-me-a" 
              target="_blank" 
              rel="noreferrer noopener"
              aria-label="Open Peerlist project badge for Pick Me A"
              title="Open Peerlist project badge for Pick Me A"
              className="block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://peerlist.io/api/v1/projects/embed/PRJHP6L86K6DDM88MIRR866DKOAJNP?showUpvote=true&theme=dark"
                alt="Pick Me A on Peerlist"
                className="w-[250px] h-[54px] block"
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
              className="block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105"
            >
              <Image 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1011161&theme=dark&t=1756707053692" 
                alt="Pick Me A - Discover your next favorite entertainment | Product Hunt" 
                className="w-[250px] h-[54px] block"
                width={250}
                height={54}
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </section>

      {/* Hero Section - Moved up for seamless integration */}
      <section className="relative z-30 -mt-32 pt-16 pb-16 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-10xl mx-auto px-4">
          {/* Subtle separator line for visual flow */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-golden-400/50 to-transparent mx-auto mb-8"></div>
          
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