"use client"

import React, { useState, useEffect } from "react"
import Hero from "@/components/sections/hero/default"
import {
  SparklingGoldParticles,
  FloatingGoldenOrbs,
  GoldenSparkleTrail,
} from "@/components/ui/sparkling-gold-particles"
import { PointerHighlight } from "@/components/ui/pointer-highlight"

// Lazy load Spline
const Spline = React.lazy(() => import("@splinetool/react-spline"))

// Error boundary for Spline
const SplineErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Spline Error:", error)
      setHasError(true)
    }

    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  if (hasError) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-golden-900/20 via-amber-900/10 to-bronze-900/20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-amber-400 text-4xl">⚠️</div>
          <p className="text-amber-300 text-lg font-medium">3D Scene Error</p>
          <p className="text-amber-400/70 text-sm mt-2">
            Failed to load Spline component
          </p>
        </div>
      </div>
    )
  }

  return children
}

const Page = () => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Decorative Background */}
      <SparklingGoldParticles particleCount={80} size="md" intensity="medium" animationSpeed="normal" />
      <FloatingGoldenOrbs />
      <GoldenSparkleTrail />

      {/* Fullscreen Hero Cover with Spline - Reduced height for more immersive flow */}
      <section className="relative w-full h-screen z-10 overflow-hidden">
        {/* Spline Background */}
        <div className="absolute inset-0">
          <SplineErrorBoundary>
            <React.Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-golden-900/20 via-amber-900/10 to-bronze-900/20">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 border-4 border-golden-500/50 border-t-golden-400 rounded-full animate-spin"></div>
                  </div>
                </div>
              }
            >
              <Spline
                scene="https://prod.spline.design/6-dRuKzCuWJc2rzT/scene.splinecode"
                className="w-full h-full"
                style={{
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </React.Suspense>
          </SplineErrorBoundary>
        </div>

        {/* Lighter gradient overlay for better integration */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

        {/* Centered Title - Positioned higher for better flow */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-gradient-to-r bg-clip-text text-3xl leading-tight font-semibold text-balance text-white drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight">
            <span className="inline-block align-middle">
              <PointerHighlight rectangleClassName="border-2 border-yellow-400" pointerClassName="text-yellow-400" containerClassName="inline-block align-middle">
                <span className="font-bold text-white-400 drop-shadow-[0_0_10px_rgba(190, 111, 9, 0.88)] transform hover:scale-110 transition-all duration-300" style={{
                  textShadow: '0 0 20px rgba(246, 168, 59, 0.8), 0 4px 8px rgba(0, 0, 0, 0.5)',
                  transform: 'perspective(1000px) rotateX(-10deg) rotateY(5deg)',
                  filter: 'drop-shadow(0 8px 16px rgba(190, 111, 9, 0.88))'
                }}>NEXUS</span>
              </PointerHighlight>
            </span>
          </h1>
          <p className="text-golden-400/80 text-lg md:text-xl mt-4 max-w-2xl">
            Enter a concept to discover and analyze relevant open-source projects
          </p>
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
            buttons={[
              {
                href: "/search",
                text: "Search Projects",
                variant: "default",
              },
            ]}
          />
        </div>
      </section>
    </div>
  )
}

export default Page