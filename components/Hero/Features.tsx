/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaPlay, FaChevronRight, FaRocket, FaCode,
  FaEye, FaSearch, FaUsers, FaFileAlt
} from 'react-icons/fa';
import { GlowingEffect } from "@/components/ui/glowing-effect";
import Glow from "@/components/ui/glow";
import { GoodText1 } from './GoodText';

const Features = ({ forceDarkMode = true }) => {
  const [activeFeature, setActiveFeature] = useState('idea-to-repo');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x, y });
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
      return () => section.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const premiumFeatures = [
    {
      id: 'idea-to-repo',
      title: "Your Random Idea to GitHub Repo",
      description: "Transform your creative ideas into structured GitHub repositories with AI-powered project scaffolding",
      icon: <FaRocket />,
      videoSrc: "/images/hero4.png",
      posterSrc: "/images/heroo1.png"
    },
    {
      id: 'find-repos',
      title: "Find Best Open Source Repos to Contribute",
      description: "Discover good first issues, bounty issues, and major contributions across different programming languages",
      icon: <FaSearch />,
      videoSrc: "/images/hero4.png",
      posterSrc: "/images/hero2.png"
    },
    {
      id: 'compare-devs',
      title: "Compare GitHub Devs and See Who Wins",
      description: "Compare GitHub profiles, analyze contribution patterns, and visualize developer statistics side by side",
      icon: <FaUsers />,
      videoSrc: "/videos/compare-devs.mp4",
      posterSrc: "/images/hero3.png"
    },
    {
      id: 'generate-readme',
      title: "Generate a Great README",
      description: "Paste a repo URL, analyze the codebase, and draft a polished README with live edit and preview.",
      icon: <FaFileAlt />,
      videoSrc: "/videos/generate-readme.mp4",
      posterSrc: "/images/hero4.png"
    }
  ];

  const handleFeatureClick = (id: string) => {
    setActiveFeature(id);
    setVideoLoaded(false);
  };

  const activeFeatureData = premiumFeatures.find(f => f.id === activeFeature);

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Glow Effect */}
      <Glow variant="center" className="opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white transform-gpu">
                EXPLORE{' '}
                <span className="inline-block align-middle"><GoodText1 /></span>
              </h2>
            </div>
          </div>
          <p className="max-w-3xl mx-auto text-lg text-white/70 leading-relaxed">
            Discover powerful tools to transform your GitHub workflow and unlock your development potential
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 lg:mb-20">
          {/* Feature List - Mobile (icons + inline video) */}
          <div className="order-1 lg:order-1 grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
            {premiumFeatures.map((feature) => (
              <React.Fragment key={feature.id}>
                <button
                  onClick={() => handleFeatureClick(feature.id)}
                  aria-label={feature.title}
                  className={`group relative aspect-square rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all duration-500 ${
                    activeFeature === feature.id 
                      ? 'ring-2 ring-yellow-400/50 shadow-[0_0_25px_5px_rgba(255,215,0,0.3)] bg-gradient-to-br from-yellow-900/40 to-amber-900/20 border-yellow-400/40' 
                      : 'hover:border-white/20 hover:bg-black/60'
                  }`}
                >
                  <div className={`text-2xl transition-all duration-500 ${
                    activeFeature === feature.id ? 'text-yellow-300' : 'text-white'
                  }`}>{feature.icon}</div>
                </button>
                {activeFeature === feature.id && (
                  <div className="col-span-2 -mt-1">
                    <div 
                      className="relative rounded-2xl border border-white/10 p-2 transition-all duration-300 hover:border-white/20 group"
                    >
                      <GlowingEffect
                        blur={0}
                        borderWidth={2}
                        spread={60}
                        glow={true}
                        disabled={false}
                        proximity={48}
                        inactiveZone={0.01}
                      />
                      <div className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm border border-white/5">
                        <div className="relative aspect-video w-full">
                          {feature.videoSrc?.toLowerCase().endsWith('.mp4') ? (
                            <video 
                              key={feature.videoSrc}
                              className="w-full h-full object-cover"
                              poster={feature.posterSrc}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="auto"
                            >
                              <source src={feature.videoSrc} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <Image
                              src={feature.videoSrc || feature.posterSrc}
                              alt={feature.title}
                              fill
                              sizes="100vw"
                              className="object-cover"
                              priority={false}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                        <div className="p-4 bg-black/40 backdrop-blur-sm">
                          <div className="flex items-center mb-2">
                            <div className="w-fit rounded-lg border border-white/20 bg-white/5 p-2 backdrop-blur-sm mr-3">
                              <div className="h-4 w-4 text-white">
                                {feature.icon}
                              </div>
                            </div>
                            <h3 className="font-sans text-lg font-semibold text-white">{feature.title}</h3>
                          </div>
                          <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Feature List - Desktop (full cards) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4">
            {premiumFeatures.map((feature) => (
              <div
                key={feature.id}
                className={`group relative cursor-pointer transition-all duration-500 rounded-2xl md:rounded-3xl overflow-hidden ${
                  activeFeature === feature.id 
                    ? 'scale-105 z-20 -translate-y-1' 
                    : 'hover:scale-[1.02] hover:border-white/20'
                }`}
                style={
                  activeFeature === feature.id
                    ? {
                        borderImage: 'linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 193, 7, 0.6), rgba(255, 165, 0, 0.4)) 1',
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1), rgba(255, 165, 0, 0.05))',
                        boxShadow: `
                          0 0 30px 5px rgba(255, 215, 0, 0.3),
                          0 0 60px 10px rgba(255, 193, 7, 0.2),
                          0 0 100px 20px rgba(255, 165, 0, 0.1),
                          inset 0 1px 0 rgba(255, 215, 0, 0.4)
                        `,
                        transform: 'scale(1.05) translateY(-6px)',
                        border: '2px solid transparent',
                        backgroundClip: 'padding-box'
                      }
                    : undefined
                }
                onClick={() => handleFeatureClick(feature.id)}
              >
                <div className="relative rounded-2xl border border-white/10 p-2 transition-all duration-500 hover:border-white/20 md:rounded-3xl md:p-3 group-hover:border-golden/30">
                  <GlowingEffect
                    blur={0}
                    borderWidth={2}
                    spread={80}
                    glow={true}
                    disabled={false}
                    proximity={60}
                    inactiveZone={0.01}
                  />
                  <div className={`relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl backdrop-blur-sm p-6 border md:p-6 transition-all duration-500 ${
                    activeFeature === feature.id 
                      ? 'bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-orange-900/10 border-yellow-500/30 shadow-inner' 
                      : 'bg-black/40 border-white/5'
                  } dark:shadow-[0px_0px_27px_0px_#2D2D2D]`}>
                    <div className="flex items-center">
                      <div className={`w-fit rounded-lg border backdrop-blur-sm mr-4 p-2 transition-all duration-500 ${
                        activeFeature === feature.id 
                          ? 'border-yellow-400/40 bg-gradient-to-br from-yellow-400/20 to-amber-500/10 shadow-lg shadow-yellow-500/20' 
                          : 'border-white/20 bg-white/5'
                      }`}>
                        <div className={`h-4 w-4 transition-all duration-500 ${
                          activeFeature === feature.id ? 'text-yellow-300' : 'text-white'
                        }`}>
                          {feature.icon}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h3 className={`-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance transition-all duration-500 ${
                          activeFeature === feature.id ? 'text-yellow-100' : 'text-white'
                        }`}>
                          {feature.title}
                        </h3>
                      </div>
                      <div className={`transition-all duration-500 transform ${
                        activeFeature === feature.id 
                          ? 'text-yellow-300 translate-x-3 scale-110' 
                          : 'text-white/50 group-hover:text-white/70 group-hover:translate-x-1'
                      }`}>
                        <FaChevronRight />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Video Section - Desktop/Tablet only */}
          <div className="hidden lg:block lg:order-2 col-span-1 lg:col-span-2">
            <div 
              className="relative rounded-2xl border border-white/10 p-2 transition-all duration-300 hover:border-white/20 md:rounded-3xl md:p-3 group"
              style={{
                transform: 'perspective(1000px) rotateX(2deg) rotateY(-2deg)',
              }}
            >
              <GlowingEffect
                blur={0}
                borderWidth={2}
                spread={60}
                glow={true}
                disabled={false}
                proximity={48}
                inactiveZone={0.01}
              />
              <div className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
              <div className="relative aspect-video w-full">
                {activeFeatureData?.videoSrc?.toLowerCase().endsWith('.mp4') ? (
                  <video 
                    key={activeFeatureData?.videoSrc}
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    poster={activeFeatureData?.posterSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => setVideoLoaded(true)}
                  >
                    <source src={activeFeatureData?.videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <Image
                    src={activeFeatureData?.videoSrc || activeFeatureData?.posterSrc || '/images/hero1.png'}
                    alt={activeFeatureData?.title || 'Preview'}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={false}
                  />
                )}
                {/* Video overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

                <div className="p-6 bg-black/40 backdrop-blur-sm">
                  <div className="flex items-center mb-3">
                    <div className="w-fit rounded-lg border border-white/20 bg-white/5 p-2 backdrop-blur-sm mr-3">
                      <div className="h-4 w-4 text-white">
                        {activeFeatureData?.icon}
                      </div>
                    </div>
                    <h3 className="-tracking-4 pt-0.5 font-sans text-2xl/[1.875rem] font-semibold text-balance text-white">{activeFeatureData?.title}</h3>
                  </div>
                  <p className="font-sans text-base/[1.375rem] text-white/70 leading-relaxed">{activeFeatureData?.description}</p>
                  {activeFeatureData?.id === 'generate-readme' && (
                    <div className="mt-5">
                      <Link href="/readme" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all">
                        <FaPlay className="w-4 h-4" /> Try README Generator
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        
      </div>
    </section>
  );
};

export default Features;