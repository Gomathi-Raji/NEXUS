"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

interface TweetTestimonialsProps {
  tweetUrls: string[]; // Full tweet URLs, e.g., https://twitter.com/username/status/123...
  className?: string;
}

export default function TweetTestimonials({ tweetUrls, className }: TweetTestimonialsProps) {
  useEffect(() => {
    // Load Twitter widgets script once
    const id = "twitter-widgets";
    if (!document.getElementById(id)) {
      const script = document.createElement("script");
      script.id = id;
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.twttr?.widgets?.load) {
      window.twttr.widgets.load();
    }
  }, [tweetUrls]);

  if (!tweetUrls || tweetUrls.length === 0) return null;

  return (
    <section className={cn("relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16", className)}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-white mb-6">Testimonials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tweetUrls.map((url) => (
            <article key={url} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3">
              {/* Embedded Tweet. Clicking anywhere opens the tweet */}
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open tweet">
                <blockquote className="twitter-tweet" data-theme="dark" style={{ margin: 0 }}>
                  <a href={url}></a>
                </blockquote>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
} 