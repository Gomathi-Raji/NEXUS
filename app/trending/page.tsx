/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, TrendingUp, Calendar, Code2, Users, ExternalLink, MapPin, Building2, X } from 'lucide-react';
import Link from 'next/link';
import './page.css';

interface TrendingRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  homepage?: string;
}

interface TrendingDeveloper {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  followers: number;
  public_repos: number;
  popularRepo?: {
    name: string;
    description: string | null;
    stargazers_count: number;
    html_url: string;
  };
}

const LANGUAGES = [
  { value: '', label: 'All Languages' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c++', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'c#', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
  { value: 'scala', label: 'Scala' },
  { value: 'r', label: 'R' },
  { value: 'shell', label: 'Shell' },
  { value: 'vue', label: 'Vue' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const DATE_RANGES = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This week' },
  { value: 'monthly', label: 'This month' },
];

function getLanguageClass(language: string | null): string {
  if (!language) return 'lang-default';
  const normalized = language.toLowerCase().replace(/[^a-z]/g, '');
  return `lang-${normalized}`;
}

export default function TrendingPage() {
  const [type, setType] = useState<'repositories' | 'developers'>('repositories');
  const [language, setLanguage] = useState('');
  const [since, setSince] = useState('daily');
  const [repos, setRepos] = useState<TrendingRepo[]>([]);
  const [developers, setDevelopers] = useState<TrendingDeveloper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        type,
        since,
        ...(language && { language }),
      });

      const response = await fetch(`/api/trending?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch trending data');
      }

      if (type === 'repositories') {
        setRepos(data.items);
      } else {
        setDevelopers(data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [type, language, since]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-golden-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <header className="text-center mt-24 md:mt-32 mb-8 md:mb-12 relative">
        <div className="absolute -left-8 top-1/2 w-4 h-4 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
        <div className="absolute -right-8 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-1/2 -top-6 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Trending on GitHub
          </h1>
          <div className="absolute -inset-1 bg-gradient-to-r from-golden-500/0 via-golden-500/10 to-golden-500/0 blur-xl opacity-50 -z-10"></div>
        </div>
        <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          See what the GitHub community is most excited about {since === 'daily' ? 'today' : since === 'weekly' ? 'this week' : 'this month'}
        </p>
      </header>

      <main>
        <div className="flex justify-center mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-1 shadow-2xl shadow-black/20 flex">
            <button
              onClick={() => setType('repositories')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${type === 'repositories' ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-white/60 hover:text-white/80'}`}
            >
              <Code2 className="w-4 h-4 inline-block mr-1" />
              Repositories
            </button>
            <button
              onClick={() => setType('developers')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${type === 'developers' ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-white/60 hover:text-white/80'}`}
            >
              <Users className="w-4 h-4 inline-block mr-1" />
              Developers
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
