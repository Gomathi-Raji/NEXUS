"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SingleTweetTestimonialProps {
  name: string;
  handle: string; // without @
  tweetUrl: string;
  avatarUrl: string;
  text: string;
  className?: string;
}

const TwitterBird = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M19.633 7.997c.013.178.013.357.013.535 0 5.454-4.154 11.747-11.747 11.747-2.337 0-4.503-.68-6.326-1.857.325.038.636.051.974.051a8.313 8.313 0 0 0 5.151-1.775 4.157 4.157 0 0 1-3.878-2.878c.254.038.51.064.777.064.374 0 .748-.051 1.096-.14A4.149 4.149 0 0 1 2.83 9.697v-.051c.546.305 1.18.497 1.854.523a4.145 4.145 0 0 1-1.85-3.45c0-.764.203-1.468.558-2.081a11.79 11.79 0 0 0 8.553 4.338 4.681 4.681 0 0 1-.102-.95 4.146 4.146 0 0 1 7.17-2.84 8.167 8.167 0 0 0 2.633-1.006 4.134 4.134 0 0 1-1.824 2.287 8.29 8.29 0 0 0 2.383-.637 8.897 8.897 0 0 1-2.192 2.28z"
    />
  </svg>
);

export default function SingleTweetTestimonial({
  name,
  handle,
  tweetUrl,
  avatarUrl,
  text,
  className,
}: SingleTweetTestimonialProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)] p-4 sm:p-5 max-w-xl",
        "hover:border-white/20 transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
      role="article"
    >
      <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="block focus:outline-none focus:ring-2 focus:ring-white/30 rounded-xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={avatarUrl}
              alt={name}
              width={40}
              height={40}
              className="rounded-full border border-white/10"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold truncate max-w-[12rem]">{name}</span>
              </div>
              <div className="text-white/60 text-sm truncate">@{handle}</div>
            </div>
          </div>
          <TwitterBird className="w-5 h-5 text-white/70" />
        </header>
        <div className="mt-3 text-[15px] leading-relaxed text-white/90">
          {text}
        </div>
      </a>
    </article>
  );
} 