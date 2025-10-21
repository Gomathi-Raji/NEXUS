'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, TrendingUp, Code2, Users, ExternalLink, MapPin, Building2, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
  z_score?: number;
  stars_velocity?: number;
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
        <div className="absolute -right-8 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse animate-delay-500" />
        <div className="absolute left-1/2 -top-6 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse animate-delay-1000" />
        
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

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-golden-500/50"
            aria-label="Select programming language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value} className="bg-gray-900">
                {lang.label}
              </option>
            ))}
          </select>

          <select
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="px-4 py-2 rounded-xl bg-black/20 backdrop-blur-xl border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-golden-500/50"
            aria-label="Select time range"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value} className="bg-gray-900">
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-golden-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <X className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Repositories */}
        {type === 'repositories' && !loading && !error && (
          <div className="grid gap-6 md:gap-8">
            {repos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20 hover:border-golden-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-white hover:text-golden-400 transition-colors">
                        <Link href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.full_name}
                        </Link>
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>#{index + 1}</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <Link
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>

                {repo.description && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {repo.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GitFork className="w-4 h-4" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                  </div>
                  {repo.language && (
                    <div className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded-full ${getLanguageClass(repo.language)}`}></div>
                      <span>{repo.language}</span>
                    </div>
                  )}
                  {/* Show Z-score for development with color coding */}
                  {process.env.NODE_ENV === 'development' && repo.z_score !== undefined && (
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      repo.z_score > 1.5 
                        ? 'bg-green-500/30 text-green-200 border border-green-400/40' 
                        : repo.z_score > 0.5
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                        : repo.z_score > 0
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                        : 'bg-red-500/30 text-red-200 border border-red-400/40'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      <span>Z: {repo.z_score.toFixed(2)}</span>
                      <span className="text-xs opacity-75">
                        {repo.z_score > 1.5 ? '🔥' : repo.z_score > 0.5 ? '📈' : repo.z_score > 0 ? '↗️' : '📉'}
                      </span>
                    </div>
                  )}
                </div>

                {repo.topics && repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {repo.topics.slice(0, 5).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 text-xs rounded-md bg-white/5 border border-white/10 text-gray-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Developers */}
        {type === 'developers' && !loading && !error && (
          <div className="grid gap-6 md:gap-8">
            {developers.map((developer, index) => (
              <motion.div
                key={developer.login}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-6 shadow-2xl shadow-black/20 hover:border-golden-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={developer.avatar_url}
                      alt={developer.login}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-white hover:text-golden-400 transition-colors">
                        <Link href={developer.html_url} target="_blank" rel="noopener noreferrer">
                          {developer.name || developer.login}
                        </Link>
                      </h3>
                      <p className="text-gray-400">@{developer.login}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                        <span>#{index + 1}</span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <Link
                    href={developer.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>

                {developer.bio && (
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {developer.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{developer.followers.toLocaleString()} followers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Code2 className="w-4 h-4" />
                    <span>{developer.public_repos} repos</span>
                  </div>
                  {developer.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{developer.location}</span>
                    </div>
                  )}
                  {developer.company && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{developer.company}</span>
                    </div>
                  )}
                </div>

                {developer.popularRepo && (
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Popular repository</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={developer.popularRepo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-golden-400 hover:text-golden-300 font-medium"
                        >
                          {developer.popularRepo.name}
                        </Link>
                        {developer.popularRepo.description && (
                          <p className="text-xs text-gray-400 mt-1">
                            {developer.popularRepo.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Star className="w-3 h-3" />
                        <span>{developer.popularRepo.stargazers_count.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && ((type === 'repositories' && repos.length === 0) || (type === 'developers' && developers.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No trending {type} found for the selected criteria.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
