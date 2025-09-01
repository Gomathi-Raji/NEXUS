'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaFileAlt, FaPlay, FaLink } from 'react-icons/fa';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import Glow from '@/components/ui/glow';
import { GoodTextReadme } from '@/components/Hero/GoodText';

const Readme: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');

  const buildHref = () => {
    try {
      if (!repoUrl) return '/readme';
      const url = new URL(repoUrl);
      // Accept full GitHub URL or owner/repo shorthand
      const path = url.hostname.includes('github.com') ? url.pathname.replace(/^\//, '') : repoUrl;
      return `/readme?repo=${encodeURIComponent(path)}`;
    } catch {
      // If not a URL, treat as shorthand owner/repo
      if (!repoUrl) return '/readme';
      return `/readme?repo=${encodeURIComponent(repoUrl)}`;
    }
  };

  return (
    <section className="relative px-3 sm:px-6 lg:px-8 py-6 sm:py-12 -mt-4 sm:-mt-10">
      {/* Background subtle glow */}
      <Glow variant="center" className="opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header matching Compare Developers style */}
        <div className="text-center mb-6 sm:mb-12">
          <h2
            className="text-2xl md:text-4xl font-bold mb-3 sm:mb-4 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)] tracking-wide"
            style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            GENERATE GITHUB <span className="inline-block align-middle"><GoodTextReadme /></span>
          </h2>
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-white/70 leading-relaxed px-2">
            Analyze repositories, auto-outline sections, and craft a polished README with live preview
          </p>
        </div>
        <div className="relative rounded-2xl md:rounded-3xl border border-white/10 p-1.5 sm:p-2 transition-all duration-300 hover:border-white/20 shadow-[0_0_60px_-20px_rgba(255,215,0,0.35)]">
          <GlowingEffect
            blur={0}
            borderWidth={2}
            spread={60}
            glow
            disabled={false}
            proximity={48}
            inactiveZone={0.01}
          />
          <div className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm border border-white/5 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
            {/* Top gradient accent */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,215,0,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(218,165,32,0.12),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(255,193,7,0.12),transparent_35%)]" />

            <div className="relative p-5 sm:p-10">
              <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:items-center">
                {/* Left: icon and copy */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 sm:mb-3 relative">
                    {/* Golden sparkle effects around title */}
                    <div className="absolute -left-6 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
                    <div className="absolute -right-6 top-1/2 w-2 h-2 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute left-1/2 -top-4 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <div className="w-fit rounded-lg border border-white/20 bg-white/5 p-2 backdrop-blur-sm">
                      <FaFileAlt className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-2xl md:text-4xl font-semibold text-white tracking-tight">
                      Generate a Great README
                    </h2>
                  </div>
                  <p className="text-white/70 leading-relaxed max-w-2xl text-sm sm:text-lg">
                    Turn any GitHub repository into a polished, professional README. Paste a repo URL or owner/repo, and start crafting with live preview.
                  </p>
                </div>

                {/* Right: input + CTA */}
                <div className="w-full lg:w-[640px]">
                  <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-4 sm:p-6 shadow-inner">
                    <label className="block text-xs sm:text-sm text-white/70 mb-2">Repository URL or owner/repo</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/50">
                          <FaLink className="h-5 w-5" />
                        </div>
                        <input
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/owner/repo or owner/repo"
                          className="w-full rounded-xl border border-white/10 bg-black/50 pl-10 pr-3 py-3 text-sm sm:text-lg text-white placeholder-white/40 outline-none focus:border-white/20 focus:ring-0"
                        />
                      </div>
                      <Link
                        href={buildHref()}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/10 px-5 sm:px-6 py-3 text-sm sm:text-lg font-semibold text-white hover:bg-white/15 transition-all hover:scale-[1.02]"
                      >
                        <FaPlay className="h-4 w-4 sm:h-5 sm:w-5" />
                        Open
                      </Link>
                    </div>
                    <div className="mt-2 text-[11px] sm:text-xs text-white/60">
                      Tip: Leave empty and just click Open to try the README generator demo.
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    title: 'Smart Outline',
                    desc: 'Auto-generate sections like Features, Setup, Usage, Roadmap, and Contributing.'
                  },
                  {
                    title: 'Code-aware',
                    desc: 'Understands languages, tooling, and scripts to tailor accurate instructions.'
                  },
                  {
                    title: 'Live Preview',
                    desc: 'Edit and see the README update instantly with polished formatting.'
                  },
                  {
                    title: 'One-click Start',
                    desc: 'Begin with a template and refine with AI—fast, clean, and consistent.'
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl sm:rounded-2xl border border-white/10 bg-black/35 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                    <div className="text-sm sm:text-lg font-semibold text-white">{item.title}</div>
                    <div className="text-xs sm:text-base text-white/60 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Readme;
