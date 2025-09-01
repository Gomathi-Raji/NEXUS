/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';
import './page.css';

import React, { useState } from 'react';
import GlassShineAnimation from './animation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Github, Users, Star, Download, Trophy, Code, Flame, RotateCcw, Shuffle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import ContributionGraph from '@/components/ContributionGraph';
import Glow from '@/components/ui/glow';
import './page.css';
import { Permanent_Marker } from 'next/font/google';


interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  location: string;
  blog: string;
  company: string;
}

interface GitHubStats {
  totalStars: number;
  totalForks: number;
  languages: Record<string, number>;
  contributions: number;
  contributionData: number[];
  totalCommits: number;
  languageStats: Record<string, { count: number; percentage: number }>;
  topRepos: Array<{
    name: string;
    stars: number;
    language: string;
    description: string | null;
    updated_at: string;
    daysSinceUpdate: number;
    commitCount: number;
    url: string;
  }>;
}

interface GitHubSuggestion {
  login: string;
  avatar_url: string;
  type: string;
  score: number;
}

const permanentMarker = Permanent_Marker({
  weight: '400', // Permanent Marker only has weight 400
  subsets: ['latin'],
});


export default function ComparePage() {

  // State declarations (move above useEffect to avoid 'used before initialization' error)
  const [showResults, setShowResults] = useState(false);
  const [roastText, setRoastText] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [user1Data, setUser1Data] = useState<GitHubUser | null>(null);
  const [user2Data, setUser2Data] = useState<GitHubUser | null>(null);
  const [user1Stats, setUser1Stats] = useState<GitHubStats | null>(null);
  const [user2Stats, setUser2Stats] = useState<GitHubStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [battleStats, setBattleStats] = useState<{
    totalCommitsCompared: number;
    totalStarsClashed: number;
    totalReposJudged: number;
    totalContributions: number;
  } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [suggestions1, setSuggestions1] = useState<GitHubSuggestion[]>([]);
  const [suggestions2, setSuggestions2] = useState<GitHubSuggestion[]>([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [searchTimeout1, setSearchTimeout1] = useState<NodeJS.Timeout | null>(null);
  const [searchTimeout2, setSearchTimeout2] = useState<NodeJS.Timeout | null>(null);
  const [recentDev1, setRecentDev1] = useState<string[]>([]);
  const [recentDev2, setRecentDev2] = useState<string[]>([]);
  // Main compare action wrapped in useCallback so it is stable for effects
  const handleCompare = React.useCallback(async () => {
    if (!username1.trim() || !username2.trim()) {
      setError('Please enter both usernames');
      return;
    }

    // Record confirmed usernames as recents (full words only)
    setRecentDev1((prev) => {
      const u = username1.trim();
      if (!u) return prev;
      const next = [u, ...prev.filter((x) => x !== u)];
      return next.slice(0, 8);
    });
    setRecentDev2((prev) => {
      const u = username2.trim();
      if (!u) return prev;
      const next = [u, ...prev.filter((x) => x !== u)];
      return next.slice(0, 8);
    });

    setIsLoading(true);
    setError('');

    try {
      const [user1Response, user2Response] = await Promise.all([
        fetch(`/api/github-user?username=${username1.trim()}`),
        fetch(`/api/github-user?username=${username2.trim()}`)
      ]);

      if (!user1Response.ok || !user2Response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const user1Result = await user1Response.json();
      const user2Result = await user2Response.json();

      if (user1Result.stats.topRepos) {
        user1Result.stats.topRepos.sort((a: { stars: number }, b: { stars: number }) => b.stars - a.stars);
      }
      if (user2Result.stats.topRepos) {
        user2Result.stats.topRepos.sort((a: { stars: number }, b: { stars: number }) => b.stars - a.stars);
      }

      setUser1Data(user1Result.user);
      setUser2Data(user2Result.user);
      setUser1Stats(user1Result.stats);
      setUser2Stats(user2Result.stats);

      const roastResponse = await fetch('/api/generate-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1: user1Result,
          user2: user2Result
        })
      });

      if (roastResponse.ok) {
        const roastData = await roastResponse.json();
        setRoastText(roastData.roast);
        setBattleStats(roastData.battleStats);
        const user1Score = user1Result.stats.totalStars + user1Result.user.followers + user1Result.stats.contributions;
        const user2Score = user2Result.stats.totalStars + user2Result.user.followers + user2Result.stats.contributions;
        setWinner(user1Score > user2Score ? user1Result.user.login : user2Result.user.login);
      } else {
        console.error('Failed to generate roast:', roastResponse.status);
        setRoastText(`🔥 **${user1Result.user.login}** vs **${user2Result.user.login}** \n\nThe battle data has been analyzed! Check out the brutal comparison above! 💀`);
        setBattleStats({
          totalCommitsCompared: (user1Result.stats.totalCommits || 0) + (user2Result.stats.totalCommits || 0),
            totalStarsClashed: user1Result.stats.totalStars + user2Result.stats.totalStars,
            totalReposJudged: user1Result.user.public_repos + user2Result.user.public_repos,
            totalContributions: user1Result.stats.contributions + user2Result.stats.contributions,
        });
        const user1Score = user1Result.stats.totalStars + user1Result.user.followers + user1Result.stats.contributions;
        const user2Score = user2Result.stats.totalStars + user2Result.user.followers + user2Result.stats.contributions;
        setWinner(user1Score > user2Score ? user1Result.user.login : user2Result.user.login);
      }

      setShowResults(true);
    } catch (err) {
      setError('Failed to fetch user data. Please check the usernames.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [username1, username2]);


  // Curated list used for quick chips and shuffle
  const popularUsers = React.useMemo(
    () => [
      'torvalds',
      'gaearon',
      'yyx990803',
      'sindresorhus',
      'midudev',
      'kentcdodds',
      'thepracticaldev',
      'evanyou',
      'sebastianramirez',
      'jonasschmedtmann',
      'migueldurand',
      'jakearchibald',
      'dhh',
      'pomber',
      'shadcn',
      't3dotgg',
      'leerob',
      'rauchg',
      'addyosmani',
    ],
    []
  );

  // Search GitHub users function
  const searchGitHubUsers = async (query: string): Promise<GitHubSuggestion[]> => {
    if (query.trim().length < 2) return [];
    
    try {
      const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=8`);
      if (!response.ok) return [];
      
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.items?.map((user: any) => ({
        login: user.login,
        avatar_url: user.avatar_url,
        type: user.type,
        score: user.score
      })) || [];
    } catch (error) {
      console.error('Error searching GitHub users:', error);
      return [];
    }
  };

  // Handle username input with debounced search
  const handleUsernameChange = async (value: string, isFirstInput: boolean) => {
    if (isFirstInput) {
      setUsername1(value);
      if (searchTimeout1) clearTimeout(searchTimeout1);
      const timeout = setTimeout(async () => {
        if (value.trim().length >= 2) {
          const results = await searchGitHubUsers(value);
          setSuggestions1(results);
          setShowSuggestions1(true);
        } else {
          setSuggestions1([]);
          setShowSuggestions1(false);
        }
      }, 300);
      setSearchTimeout1(timeout);
    } else {
      setUsername2(value);
      if (searchTimeout2) clearTimeout(searchTimeout2);
      const timeout = setTimeout(async () => {
        if (value.trim().length >= 2) {
          const results = await searchGitHubUsers(value);
          setSuggestions2(results);
          setShowSuggestions2(true);
        } else {
          setSuggestions2([]);
          setShowSuggestions2(false);
        }
      }, 300);
      
      setSearchTimeout2(timeout);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (username: string, isFirstInput: boolean) => {
    if (isFirstInput) {
      setUsername1(username);
      setShowSuggestions1(false);
      setSuggestions1([]);
      // Record confirmed selection for Dev I
      setRecentDev1((prev) => {
        const next = [username, ...prev.filter((u) => u !== username)];
        return next.slice(0, 8);
      });
    } else {
      setUsername2(username);
      setShowSuggestions2(false);
      setSuggestions2([]);
      // Record confirmed selection for Dev II
      setRecentDev2((prev) => {
        const next = [username, ...prev.filter((u) => u !== username)];
        return next.slice(0, 8);
      });
    }
  };

  // Swap usernames for convenience
  const swapUsernames = () => {
    setUsername1((prev1) => {
      setUsername2((prev2) => prev1);
      return username2;
    });
  };

  // Allow pressing Enter to start the battle when both usernames are provided
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showResults && !isLoading && username1.trim() && username2.trim()) {
        e.preventDefault();
        handleCompare();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showResults, isLoading, username1, username2, handleCompare]);

  // Shuffle random well-known usernames into both inputs
  const randomizeUsernames = () => {
    if (popularUsers.length < 2) return;
    const pick = () => popularUsers[Math.floor(Math.random() * popularUsers.length)];
    const a = pick();
    let b = pick();
    let guard = 0;
    while (b === a && guard < 10) { b = pick(); guard++; }
    setUsername1(a);
    setUsername2(b);
  };

  // Trigger confetti when results are shown
  React.useEffect(() => {
    if (showResults && roastText) {
      setShowConfetti(true);
      // Hide confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showResults, roastText]);

  // handleCompare moved above and memoized

  const downloadAsImage = async () => {
    const element = document.getElementById('battle-cards');
    if (!element) return;

    try {
      const dataUrl = await toPng(element, { 
        cacheBust: true, 
        quality: 0.95,
        backgroundColor: '#000000',
      });
      saveAs(dataUrl, `github-battle-${username1}-vs-${username2}.png`);
    } catch (error) {
      console.error('oops, something went wrong!', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  const shareToTwitter = async () => {
    const element = document.getElementById('comparison-card');
    if (!element) return;

    try {
      const blob = await toPng(element, { 
        cacheBust: true, 
        quality: 0.95,
        backgroundColor: '#000000',
      }).then(dataUrl => fetch(dataUrl).then(res => res.blob()));

      const file = new File([blob], `github-battle-${username1}-vs-${username2}.png`, { type: 'image/png' });

      const shareData = {
        title: 'GitHub Battle',
        text: `🔥 EPIC GitHub Battle: @${username1} vs @${username2}!\n\nThe roast is ABSOLUTELY SAVAGE! 💀\n\nWho's the better dev? The results will shock you! 👑\n\n#GitHubBattle #DevRoast #CodingShowdown #GitHubWarriors`,
        files: [file],
      };

      const text = `When @${username1} opens VS Code, GitHub shivers. @${username2} tried to roast, but forgot to import 🔥. This isn't a pull request, it's a public execution. #GitHubBattle #Whattobuild .. Make your own - your-domain.com/compare`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('oops, something went wrong!', error);
      alert('Failed to generate image for sharing. Please try again.');
    }
  };

  const resetBattle = () => {
    setShowResults(false);
    setUser1Data(null);
    setUser2Data(null);
    setUser1Stats(null);
    setUser2Stats(null);
    setRoastText('');
    setBattleStats(null);
    setWinner(null);
    setUsername1('');
    setUsername2('');
    setError('');
    // Clear suggestions
    setSuggestions1([]);
    setSuggestions2([]);
    setShowSuggestions1(false);
    setShowSuggestions2(false);
    // Clear timeouts
    if (searchTimeout1) clearTimeout(searchTimeout1);
    if (searchTimeout2) clearTimeout(searchTimeout2);
  };

  const getBadge = (user: GitHubUser, stats: GitHubStats) => {
    if (stats.totalStars > 1000) return { icon: Star, text: 'Star Hunter', color: 'text-yellow-400' };
    if (user.followers > 500) return { icon: Users, text: 'Influencer', color: 'text-golden-400' };
    if (user.public_repos > 50) return { icon: Code, text: 'Code Machine', color: 'text-green-400' };
    if (stats.contributions > 500) return { icon: Flame, text: 'Commit Beast', color: 'text-red-400' };
    return { icon: Trophy, text: 'Rising Star', color: 'text-orange-400' };
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden custom-scrollbar">
      {/* Background effects matching default.tsx */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      {/* Glow effect */}
      <div className="relative w-full">
        <Glow variant="top" className="opacity-40" />
      </div>

      
      {/* Confetti Canvas Overlay */}
      {showConfetti && (
        <ConfettiOverlay />
      )}
      <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32 relative z-10">
        {!showResults ? (
          <div className="text-center mb-12">
            <div className="flex flex-col items-center justify-center relative" style={{ minHeight: '220px' }}>
              {/* Golden sparkle effects around header */}
              <div className="absolute -left-8 top-1/2 w-4 h-4 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
              <div className="absolute -right-8 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute left-1/2 -top-6 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              
              <h1 className="text-6xl font-bold mb-4 font-bungee text-center" style={{ lineHeight: 1.1 }}>
                <span className="bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent drop-shadow-lg">
                  GitHub Battle Arena
                </span>
              </h1>
              <p className="text-xl text-white/70 mb-8 text-center">
                Compare two GitHub warriors and watch the sparks fly! 🔥
              </p>
            </div>
        {/* Subtle divider under header */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          margin: '8px 0 10px 0'
        }} />
            {/* Input Section */}
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-14 max-w-4xl mx-auto shadow-2xl" style={{ minHeight: '340px' }}>
              {/* Enhanced glassmorphic effect: inner shadow, increased blur, faint white border with glow, and animated glass shine */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl z-0">
                {/* Animated Glass Shine Overlay */}
                <GlassShineAnimation />
                {/* Removed blurred gradient overlay under the box to eliminate shadow/reflection */}
                {/* Soft inner shadow for depth */}
                <div className="w-full h-full rounded-2xl" style={{
                  boxShadow: 'inset 0 2px 24px 0 rgba(255,255,255,0.18), inset 0 1px 8px 0 rgba(255,255,255,0.10)',
                  pointerEvents: 'none',
                }} />
                {/* Faint white border with glow */}
                <div className="absolute inset-0 rounded-2xl" style={{
                  border: '2px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 0 16px 2px rgba(255,255,255,0.10)',
                  pointerEvents: 'none',
                }} />
              </div>
              <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
                <div className="flex-1 relative">
                  <label className="flex text-white/80 text-lg font-bold mb-4 items-center gap-3">
                    <Github className="w-5 h-5 text-white/80" />
                    <span className="font-bold text-xl germania-one-regular">Dev I</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="octocat"
                      value={username1}
                      onChange={(e) => handleUsernameChange(e.target.value, true)}
                      onFocus={() => username1.length >= 2 && setShowSuggestions1(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions1(false), 200)}
                      aria-label="First GitHub username"
                      className="bg-black/40 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-2xl py-8 px-10 rounded-2xl shadow-xl transition-all"
                    />
                    {/* Recent typed profiles for Dev I (only items the user searched/typed) */}
                    {recentDev1.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {recentDev1.map((u) => (
                          <button
                            type="button"
                            key={`dev1-${u}`}
                            onClick={() => handleSuggestionSelect(u, true)}
                            className="px-3 py-1 text-sm text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 rounded-full transition-all backdrop-blur-sm"
                            title="Recent"
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggestions Dropdown for Dev I */}
                    {showSuggestions1 && suggestions1.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto suggestions-scrollbar"
                        style={{
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.25) 80%, rgba(0,0,0,0.35) 100%)',
                          backdropFilter: 'blur(25px) saturate(150%)',
                          boxShadow: '0 25px 50px rgba(0,0,0,0.9), inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}>
                        {/* Liquid glass overlay effects */}
                        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                          {/* Top highlight */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                          }} />
                          {/* Glass refraction effect */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '40px',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                            opacity: 0.8,
                          }} />
                          {/* Curved glass highlight */}
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '15%',
                            width: '70%',
                            height: '30px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
                            borderRadius: '50% 50% 0 0',
                            opacity: 0.6,
                          }} />
                        </div>
                        
                        {suggestions1.map((suggestion) => (
                          <div
                            key={suggestion.login}
                            onClick={() => handleSuggestionSelect(suggestion.login, true)}
                            className="relative flex items-center gap-4 p-4 cursor-pointer transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl border-b border-white/8 last:border-b-0 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/6"
                            style={{
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            <img 
                              src={suggestion.avatar_url} 
                              alt={suggestion.login}
                              className="w-10 h-10 rounded-full border-2 border-white/25 shadow-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzQxNTEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIiBzdHJva2U9IiM5Q0E5QjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIgc3Ryb2tlPSIjOUNBOUI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+';
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-white font-semibold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{suggestion.login}</div>
                              <div className="text-white/70 text-sm capitalize font-medium">{suggestion.type}</div>
                            </div>
                            <div className="text-white/50 text-xs font-medium bg-white/10 px-2 py-1 rounded-md">
                              {Math.round(suggestion.score)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={`${permanentMarker.className} text-white/85 font-bold text-[7rem] transition-all ${username1 && username2 ? 'animate-pulse-vs' : ''}`}
                    style={{
                      display: 'inline-block',
                      padding: '0 2rem',
                      textShadow: '0 0 3px rgba(96,165,250,0.9), 0 0 14px rgba(59,130,246,0.65), 0 0 30px rgba(37,99,235,0.5), 0 0 48px rgba(29,78,216,0.35)'
                    }}
                  >
                    VS
                  </div>
                  {/* Shuffle button below VS */}
                  <button
                    type="button"
                    onClick={randomizeUsernames}
                    aria-label="Shuffle random usernames"
                    className="mt-3 group relative w-14 h-14 rounded-full border border-white/20 bg-black/30 backdrop-blur-xl shadow-xl hover:border-white/40 transition-all"
                    title="Shuffle random devs"
                  >
                    <Shuffle className="w-6 h-6 text-white/85 mx-auto my-auto absolute inset-0 m-auto group-hover:rotate-180 transition-transform duration-300" />
                    <span className="absolute inset-0 rounded-full pointer-events-none" style={{
                      background: 'linear-gradient(120deg, rgba(255,255,255,0.18) 10%, rgba(255,255,255,0.06) 70%)',
                      mixBlendMode: 'screen'
                    }} />
                  </button>
                </div>
                <div className="flex-1 relative">
                  <label className="flex text-white/80 text-lg font-bold mb-4 items-center gap-3">
                    <Github className="w-5 h-5 text-white/80" />
                    <span className="font-bold text-xl germania-one-regular">Dev II</span>
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="torvalds"
                      value={username2}
                      onChange={(e) => handleUsernameChange(e.target.value, false)}
                      onFocus={() => username2.length >= 2 && setShowSuggestions2(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions2(false), 200)}
                      className="bg-black/40 backdrop-blur-xl border border-white/20 text-white placeholder:text-white/60 focus:border-white/40 text-2xl py-8 px-10 rounded-2xl shadow-xl transition-all"
                    />
                    {/* Recent typed profiles for Dev II (only items the user searched/typed) */}
                    {recentDev2.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {recentDev2.map((u) => (
                          <button
                            type="button"
                            key={`dev2-${u}`}
                            onClick={() => handleSuggestionSelect(u, false)}
                            className="px-3 py-1 text-sm text-white/80 bg-white/10 hover:bg-white/15 border border-white/15 rounded-full transition-all backdrop-blur-sm"
                            title="Recent"
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Suggestions Dropdown for Dev II */}
                    {showSuggestions2 && suggestions2.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto suggestions-scrollbar"
                        style={{
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.25) 80%, rgba(0,0,0,0.35) 100%)',
                          backdropFilter: 'blur(25px) saturate(150%)',
                          boxShadow: '0 25px 50px rgba(0,0,0,0.9), inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}>
                        {/* Liquid glass overlay effects */}
                        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                          {/* Top highlight */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                          }} />
                          {/* Glass refraction effect */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '40px',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                            opacity: 0.8,
                          }} />
                          {/* Curved glass highlight */}
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: '15%',
                            width: '70%',
                            height: '30px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
                            borderRadius: '50% 50% 0 0',
                            opacity: 0.6,
                          }} />
                        </div>
                        
                        {suggestions2.map((suggestion) => (
                          <div
                            key={suggestion.login}
                            onClick={() => handleSuggestionSelect(suggestion.login, false)}
                            className="relative flex items-center gap-4 p-4 cursor-pointer transition-all duration-300 first:rounded-t-2xl last:rounded-b-2xl border-b border-white/8 last:border-b-0 hover:bg-gradient-to-r hover:from-white/12 hover:to-white/6"
                            style={{
                              backdropFilter: 'blur(10px)',
                            }}
                          >
                            <img 
                              src={suggestion.avatar_url} 
                              alt={suggestion.login}
                              className="w-10 h-10 rounded-full border-2 border-white/25 shadow-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzQxNTEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIiBzdHJva2U9IiM5Q0E5QjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIgc3Ryb2tlPSIjOUNBOUI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+';
                              }}
                            />
                            <div className="flex-1">
                              <div className="text-white font-semibold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{suggestion.login}</div>
                              <div className="text-white/70 text-sm capitalize font-medium">{suggestion.type}</div>
                            </div>
                            <div className="text-white/50 text-xs font-medium bg-white/10 px-2 py-1 rounded-md">
                              {Math.round(suggestion.score)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCompare}
                disabled={isLoading}
                className="mx-auto flex items-center justify-center bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-bold text-2xl py-7 px-14 rounded-full border border-white/30 shadow-[0_2px_24px_0_rgba(255,255,255,0.18),0_1px_8px_0_rgba(255,255,255,0.10)] hover:border-white/40 transition-all mt-16 relative overflow-visible max-w-sm min-w-[140px]"
              >
                {/* Enhanced glass shine and 3D liquid glass effect */}
                <span className="absolute inset-0 rounded-full pointer-events-none z-0" style={{
                  background: 'linear-gradient(120deg, rgba(255,255,255,0.22) 10%, rgba(255,255,255,0.10) 40%, rgba(255,255,255,0.00) 70%)',
                  opacity: 0.7,
                  mixBlendMode: 'screen',
                  boxShadow: '0 0 32px 8px rgba(255,255,255,0.10), 0 2px 24px 0 rgba(255,255,255,0.18)',
                }} />
              
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Preparing...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 rye-regular text-5xl font-bold">
                    
                    Battle
                  </span>
                )}
              </Button>
              {/* Helper hint */}
              <div className="text-center text-white/60 text-xs mt-3">Press Enter to start the battle</div>
              {error && (
                <div className="mt-6 px-6 py-4 bg-gradient-to-r from-red-500/30 via-black/40 to-orange-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-lg text-red-200 text-base font-semibold flex items-center gap-3 animate-fade-in relative overflow-hidden">
                  <span className="absolute inset-0 pointer-events-none rounded-2xl z-0" style={{
                    background: 'linear-gradient(120deg, rgba(255,255,255,0.10) 10%, rgba(255,255,255,0.00) 70%)',
                    opacity: 0.5,
                    mixBlendMode: 'screen',
                  }} />
                  <span className="flex items-center justify-center z-10">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mr-3 text-red-400 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {error}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div id="comparison-card" className="space-y-6 max-w-7xl mx-auto">
            {/* Only show current battle results, no previous results/history */}
            {/* Header - Centered with Action Buttons */}
            <div className="flex flex-col items-center justify-center mb-6 gap-4">
              <div className="relative">
                <h1 className="text-5xl font-bold mb-2 relative">
                  <span className="bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text germania-one-regular text-transparent relative z-10 drop-shadow-lg">
                    Battle Results
                  </span>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 blur-xl opacity-20" />
                </h1>
              </div>
              
              {/* Action Buttons - Clean sophisticated design */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center print:hidden">
                <Button
                  onClick={resetBattle}
                  className="premium-btn text-white/90 font-medium py-3 px-8 rounded-xl transition-all text-sm relative overflow-hidden hover:text-white"
                >
                  <span className="relative z-10 flex items-center">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Battle
                  </span>
                </Button>
                <Button
                  onClick={downloadAsImage}
                  className="premium-btn text-white/90 font-medium py-3 px-8 rounded-xl transition-all text-sm relative overflow-hidden hover:text-white"
                >
                  <span className="relative z-10 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download Battle
                  </span>
                </Button>
                <Button
                  onClick={shareToTwitter}
                  className="premium-btn text-white/90 font-medium py-3 px-8 rounded-xl transition-all text-sm relative overflow-hidden hover:text-white"
                >
                  <span className="relative z-10 flex items-center">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </span>
                </Button>
              </div>
            </div>
            {/* Roast Section - Clean sophisticated design */}
            {roastText && (
              <div className="roast-section backdrop-blur-2xl rounded-2xl p-6 relative overflow-hidden border"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.22) 100%)',
                  borderColor: 'rgba(255,255,255,0.10)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.90), 0 10px 30px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}>
                {/* Clean glass overlays */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl">
                  {/* Simple top highlight */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                  }} />
                  {/* Clean gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 55%, transparent 100%)',
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                    opacity: 0.6,
                  }} />
                  {/* Bottom vignette */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '56px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    borderBottomLeftRadius: 'inherit',
                    borderBottomRightRadius: 'inherit',
                    opacity: 0.7,
                  }} />
                  {/* Soft corner bloom */}
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '160px',
                    height: '160px',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 60%, transparent 70%)',
                    filter: 'blur(12px)',
                  }} />
                </div>
                
                {/* Clean header with battle stats */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center">
                      <span className="text-sm">🔥</span>
                    </div>
                    <h2 className="text-xl font-semibold text-white/95">The Brutal Roast</h2>
                  </div>
                  
                  {/* Clean battle stats */}
                  {battleStats && (
                    <div className="flex items-center gap-4 backdrop-blur-md border rounded-xl px-4 py-2 relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.20) 100%)',
                        borderColor: 'rgba(255,255,255,0.10)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 12px rgba(0,0,0,0.30)',
                      }}>
                      <div className="flex items-center gap-2 text-sm relative z-10">
                        <span className="text-white/70 font-medium">Commits:</span>
                        <span className="text-white/95 font-semibold">{battleStats.totalCommitsCompared.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm relative z-10">
                        <span className="text-white/70 font-medium">Stars:</span>
                        <span className="text-white/95 font-semibold">{battleStats.totalStarsClashed.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm relative z-10">
                        <span className="text-white/70 font-medium">Repos:</span>
                        <span className="text-white/95 font-semibold">{battleStats.totalReposJudged}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Clean readable roast text */}
                <div className="text-sm text-white/95 leading-relaxed relative z-10 font-medium">
                  {roastText.split(/\n{2,}/).map((block, i) => {
                    // Check if this block contains key player mentions
                    const isKeyPlayerBlock = block.includes('WINNER:') || block.includes('Winner:') || block.includes('🏆') || block.includes('👑');
                    
                    if (isKeyPlayerBlock) {
                      return (
                        <div key={i} className="mb-4 p-4 rounded-xl relative overflow-hidden border"
                          style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0.25) 100%)',
                            backdropFilter: 'blur(22px)',
                            boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.18), 0 10px 28px rgba(0,0,0,0.45)',
                            borderColor: 'rgba(255,255,255,0.14)',
                          }}>
                          {/* Liquid glass 3D effect */}
                          <div className="absolute inset-0 rounded-lg pointer-events-none">
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '2px',
                              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                              borderTopLeftRadius: 'inherit',
                              borderTopRightRadius: 'inherit',
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '30px',
                              background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)',
                              borderTopLeftRadius: 'inherit',
                              borderTopRightRadius: 'inherit',
                              opacity: 0.8,
                            }} />
                          </div>
                          <div className="relative z-10">
                            <span dangerouslySetInnerHTML={{
                              __html: block
                                .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                                .replace(/\*([^*]+)\*/g, '<em class="text-white/90">$1</em>')
                                .replace(/\n/g, '<br />')
                                .replace(/(🔥|🏆|🥇|💀|😈|😱|😳|😎|😡|😅|😬|😆|😢|😂|😜|🤡|👑|😤|😏|😲|😐|😴|😵)/g, '<span class="inline-block align-middle text-lg">$1</span>')
                            }} />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={i} className="mb-3 p-3 rounded-lg border"
                          style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.16) 100%)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                          }}>
                          <span dangerouslySetInnerHTML={{
                            __html: block
                              .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                              .replace(/\*([^*]+)\*/g, '<em class="text-white/85">$1</em>')
                              .replace(/\n/g, '<br />')
                              .replace(/(🔥|💀|😈|😱|😳|😎|😡|😅|😬|😆|😢|😂|😜|🤡|😤|😏|😲|😐|😴|😵)/g, '<span class="inline-block align-middle">$1</span>')
                          }} />
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
            {/* User Comparison Cards */}
            {user1Data && user2Data && user1Stats && user2Stats && winner && (
              <div id="battle-cards" className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
                <div className="w-full lg:w-1/2 flex flex-col">
                  <UserComparisonCard 
                    user={user1Data} 
                    stats={user1Stats} 
                    badge={getBadge(user1Data, user1Stats)}
                    winner={winner}
                  />
                </div>
                <div className="w-full lg:w-1/2 flex flex-col">
                  <UserComparisonCard 
                    user={user2Data} 
                    stats={user2Stats} 
                    badge={getBadge(user2Data, user2Stats)}
                    winner={winner}
                  />
                </div>
              </div>
            )}
            
            
            {/* Clean Battle Verdict Section */}
            {user1Data && user2Data && user1Stats && user2Stats && winner && (
              <div className="backdrop-blur-2xl rounded-2xl p-6 relative overflow-hidden border"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.22) 100%)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.90), 0 10px 30px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.10)'
                }}>
                {/* Clean glass overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl">
                  {/* Simple top highlight */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                  }} />
                  {/* Clean gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 55%, transparent 100%)',
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit',
                    opacity: 0.6,
                  }} />
                  {/* Bottom vignette */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '56px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
                    borderBottomLeftRadius: 'inherit',
                    borderBottomRightRadius: 'inherit',
                    opacity: 0.7,
                  }} />
                  {/* Soft corner bloom */}
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '160px',
                    height: '160px',
                    background: 'radial-gradient(circle at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 60%, transparent 70%)',
                    filter: 'blur(12px)',
                  }} />
                </div>
                
                <div className="flex items-center gap-4 mb-6 relative z-20">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  <h2 className="text-3xl font-bold text-white">Battle Verdict</h2>
                </div>
                
                <div className="relative z-20">
                  <div className="grid md:grid-cols-2 gap-8 mb-6">
                    {/* Clean Category Winners */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white/95 mb-4">Category Champions</h3>
                      {[
                        { 
                          category: 'Stars', 
                          winner: user1Stats.totalStars > user2Stats.totalStars ? user1Data.login : user2Data.login,
                          value1: user1Stats.totalStars,
                          value2: user2Stats.totalStars,
                          icon: '⭐'
                        },
                        { 
                          category: 'Followers', 
                          winner: user1Data.followers > user2Data.followers ? user1Data.login : user2Data.login,
                          value1: user1Data.followers,
                          value2: user2Data.followers,
                          icon: '👥'
                        },
                        { 
                          category: 'Repos', 
                          winner: user1Data.public_repos > user2Data.public_repos ? user1Data.login : user2Data.login,
                          value1: user1Data.public_repos,
                          value2: user2Data.public_repos,
                          icon: '📦'
                        },
                        { 
                          category: 'Contributions', 
                          winner: user1Stats.contributions > user2Stats.contributions ? user1Data.login : user2Data.login,
                          value1: user1Stats.contributions,
                          value2: user2Stats.contributions,
                          icon: '🔥'
                        }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg relative overflow-hidden"
                          style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.20) 100%)',
                            backdropFilter: 'blur(15px)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 15px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-white/90 font-semibold">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/70 text-sm font-medium">
                              {item.value1.toLocaleString()} vs {item.value2.toLocaleString()}
                            </span>
                            <span className="text-green-400 font-bold text-sm bg-green-400/10 px-2 py-1 rounded-md">@{item.winner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Clean Overall Winner */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-white/95 mb-4">Overall Victor</h3>
                      {/* Winner Card - Enhanced Text Clarity */}
                      <div className="p-6 rounded-xl relative overflow-hidden"
                        style={{
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 100%)',
                          backdropFilter: 'blur(15px)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px rgba(0,0,0,0.4)',
                          transform: 'translateY(-2px)',
                        }}>
                        {/* Golden touch from top */}
                        <div className="absolute inset-0 rounded-xl pointer-events-none">
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.6) 50%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                          }} />
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '20px',
                            background: 'linear-gradient(180deg, rgba(255,215,0,0.08) 0%, transparent 100%)',
                            borderTopLeftRadius: 'inherit',
                            borderTopRightRadius: 'inherit',
                            opacity: 0.7,
                          }} />
                        </div>
                        
                        <div className="relative z-20 text-center">
                          <div className="text-5xl mb-3">👑</div>
                          <div className="text-2xl font-bold mb-2 text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>@{winner}</div>
                          <div className="text-white text-sm font-semibold mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Dominates the battlefield!</div>
                        </div>
                      </div>
                      
                      {/* AI Summary - Enhanced Text Clarity */}
                      <div className="p-5 rounded-lg relative overflow-hidden"
                        style={{
                          background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.15) 100%)',
                          backdropFilter: 'blur(15px)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 15px rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}>
                        <div className="text-white text-sm leading-relaxed font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          <strong className="text-white font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>@{winner}</strong> emerges victorious with superior {
                            user1Stats.totalStars + user1Data.followers > user2Stats.totalStars + user2Data.followers 
                              ? user1Data.login === winner ? 'star power and community influence' : 'overall development metrics'
                              : user2Data.login === winner ? 'star power and community influence' : 'overall development metrics'
                          }. {
                            winner === user1Data.login 
                              ? `${user1Data.login}'s ${user1Stats.totalStars > user2Stats.totalStars ? 'stellar repositories' : 'consistent contributions'} showcase technical excellence.`
                              : `${user2Data.login}'s ${user2Stats.totalStars > user1Stats.totalStars ? 'stellar repositories' : 'consistent contributions'} showcase technical excellence.`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}

// Simple confetti overlay component
function ConfettiOverlay() {
  const [opacity, setOpacity] = React.useState(1);
  const opacityRef = React.useRef(1);
  React.useEffect(() => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    const confettiColors = ['#f1e05a', '#2b7489', '#ffac45', '#f34b7d', '#00ADD8', '#dea584', '#4F5D95', '#701516', '#ffac45', '#fff', '#e53e3e', '#38bdf8', '#fbbf24'];
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * W,
      y: Math.random() * -H,
      r: 6 + Math.random() * 8,
      d: Math.random() * 80,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      tilt: Math.random() * 10,
      tiltAngle: Math.random() * Math.PI * 2,
      tiltAngleInc: 0.05 + Math.random() * 0.07
    }));
    let frame = 0;
    let fadeStarted = false;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = opacityRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, p.tiltAngle, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85 * opacityRef.current;
        ctx.fill();
        ctx.globalAlpha = opacityRef.current;
        // Animate
        p.y += 3 + Math.sin(frame / 10 + p.d) * 1.5;
        p.x += Math.sin(frame / 20 + p.d) * 2;
        p.tiltAngle += p.tiltAngleInc;
        if (p.y > H + 20) {
          p.y = Math.random() * -40;
          p.x = Math.random() * W;
        }
      }
      ctx.restore();
      frame++;
      if (frame < 90) {
        requestAnimationFrame(draw);
      } else if (!fadeStarted) {
        fadeStarted = true;
        // Fade out over 0.5s
        let fadeFrame = 0;
        function fade() {
          fadeFrame++;
          opacityRef.current = 1 - fadeFrame / 30;
          setOpacity(opacityRef.current);
          if (fadeFrame < 30) {
            requestAnimationFrame(fade);
          } else {
            opacityRef.current = 0;
            setOpacity(0);
          }
        }
        fade();
      }
    }
    draw();
    // Clean up
    return () => {
      if (ctx) ctx.clearRect(0, 0, W, H);
    };
  }, []);
  return (
    <canvas id="confetti-canvas" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 50,
      opacity,
      transition: 'opacity 0.5s',
    }} />
  );
}

// Move UserComparisonCard and its props outside ConfettiOverlay so it is in scope for ComparePage
interface UserComparisonCardProps {
  user: GitHubUser;
  stats: GitHubStats;
  badge: { icon: LucideIcon; text: string; color: string };
  winner: string | null;
}

function UserComparisonCard({ user, stats, badge, winner }: UserComparisonCardProps) {
  const BadgeIcon = badge.icon;
  
  // Determine avatar glow based on profile type
  const getAvatarGlow = (user: GitHubUser, stats: GitHubStats) => {
    if (stats.contributions > 1000) return 'avatar-active'; // Green for active contributor
    if (stats.totalStars > 500 || user.followers > 200) return 'avatar-rising'; // Yellow for rising dev
    return 'avatar-niche'; // Golden for niche language user
  };
  
  // Get language colors
  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      Go: '#00ADD8',
      Rust: '#dea584',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Swift: '#ffac45',
      'C#': '#239120',
      Kotlin: '#7F52FF',
      Dart: '#0175C2',
      Scala: '#DC322F',
    };
    return colors[language] || '#64748b';
  };
  
  // Format time ago
  const formatTimeAgo = (days: number) => {
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  // Generate contribution traits (mock for now - can be enhanced with AI)
  const generateContributionTraits = (user: GitHubUser, stats: GitHubStats) => {
    const traits = [];
    
    // Analyze contribution patterns
    if (stats.contributions > 1000) {
      traits.push("Heavy contributor with consistent activity");
    } else if (stats.contributions > 500) {
      traits.push("Regular contributor with steady progress");
    } else {
      traits.push("Selective contributor with focused commits");
    }
    
    // Analyze repo count vs stars
    if (stats.totalStars / user.public_repos > 10) {
      traits.push("Quality over quantity - high star ratio");
    } else if (user.public_repos > 50) {
      traits.push("Prolific creator with many projects");
    }
    
    return traits.slice(0, 2); // Keep it compact
  };

  // Generate unique dev title
  const generateDevTitle = (user: GitHubUser, stats: GitHubStats) => {
    const locations = user.location ? user.location.split(',')[0] : 'Digital';
    const titles = [
      `The Code Architect of ${locations}`,
      `Shadow Committer of ${locations}`,
      `Digital Craftsperson from ${locations}`,
      `Code Virtuoso of ${locations}`,
      `The Silent Builder of ${locations}`,
    ];
    
    if (stats.totalStars > 1000) return `Star Collector of ${locations}`;
    if (user.public_repos > 50) return `Project Maestro of ${locations}`;
    if (stats.contributions > 1000) return `Commit Champion of ${locations}`;
    
    return titles[Math.floor(Math.random() * titles.length)];
  };

  const traits = generateContributionTraits(user, stats);
  const devTitle = generateDevTitle(user, stats);
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
  
  const avatarGlow = getAvatarGlow(user, stats);
  const isWinner = winner === user.login;
  return (
    <div
      data-github-card
      className={`glass-card backdrop-blur-3xl backdrop-saturate-200 border rounded-2xl p-6 relative overflow-hidden group transition-all duration-500 w-full ${
        isWinner 
          ? 'winner-frost' 
          : ''
      }`}
      style={{ 
        minWidth: 0, 
        touchAction: 'manipulation', 
        zIndex: 2,
        background: isWinner 
          ? 'linear-gradient(135deg, rgba(12,12,15,0.98) 80%, rgba(8,8,12,0.96) 100%)'
          : 'linear-gradient(135deg, rgba(8,8,10,0.98) 80%, rgba(3,3,5,0.96) 100%)',
        boxShadow: isWinner 
          ? '0 24px 60px 0 rgba(0,0,0,0.99), 0 0 80px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.18)'
          : '0 16px 48px 0 rgba(0,0,0,0.99), 0 0 60px 16px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
        border: isWinner ? 'none' : '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(40px) saturate(200%)',
        transform: isWinner ? 'translateY(-2px)' : 'none',
      }}>
      {/* Enhanced liquid glass overlays */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl z-0">
        {/* Enhanced top highlight for winner */}
        {isWinner && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.25) 25%, rgba(255,255,255,0.4) 50%, rgba(255,215,0,0.25) 75%, transparent 100%)',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }} />
        )}
        {/* Regular top glass highlight */}
        {!isWinner && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
          }} />
        )}
        {/* Subtle top gradient for liquid glass effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: isWinner 
            ? 'linear-gradient(180deg, rgba(255,215,0,0.05) 0%, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.04) 50%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)',
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />
        {/* Bottom vignette for depth */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
          borderBottomLeftRadius: 'inherit',
          borderBottomRightRadius: 'inherit',
          opacity: 0.7,
        }} />
        {/* Soft corner bloom */}
        <div style={{
          position: 'absolute',
          top: '-36px',
          right: '-36px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 60%, transparent 70%)',
          filter: 'blur(12px)',
        }} />
        {/* Glass reflection - more pronounced */}
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '15%',
          width: '70%',
          height: '35%',
          background: isWinner
            ? 'linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.05) 40%, transparent 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 100%)',
          borderRadius: '50% 50% 0 0',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />
        {/* Inner glow */}
        <div style={{
          position: 'absolute',
          inset: '1px',
          borderRadius: 'calc(1rem - 1px)',
          background: isWinner
            ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
      </div>
      <div className="relative z-10">
        {/* Winner Crown */}
        {/* Winner badge removed as requested */}
        
        {/* Header - Compact design */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative group">
            <img
              src={user.avatar_url}
              alt={user.name || user.login}
              width={48}
              height={48}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className={`w-12 h-12 rounded-xl transition-all duration-300 ${avatarGlow}`}
              style={{ 
                touchAction: 'manipulation',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzNzQxNTEiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDhhNCA0IDAgMCAwLTQgNHYyIiBzdHJva2U9IiM5Q0E5QjQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIgc3Ryb2tlPSIjOUNBOUI0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+';
              }}
            />
            {/* Glass overlay on avatar */}
            <div className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
            
            {/* Avatar tooltip removed as requested */}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white/95 truncate">{user.name || user.login}</h3>
            <p className="text-white/50 text-xs mb-1">@{user.login}</p>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <BadgeIcon className="w-3 h-3" />
              <span>{badge.text}</span>
              <span>•</span>
              <span>Joined {joinDate}</span>
            </div>
          </div>
          <a
            href={`https://github.com/${user.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5"
            title="View GitHub Profile"
            style={{ touchAction: 'manipulation' }}
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Dev Title - Fire themed colors to match the vibe */}
        <div className="mb-3 p-3 rounded-lg border border-white/8 relative group"
          style={{
            background: isWinner 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.22) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.20) 100%)',
            boxShadow: isWinner 
              ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 8px rgba(0,0,0,0.4)'
              : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3)',
            transform: isWinner ? 'translateY(-1px)' : 'translateY(-0.5px)',
          }}>
          <p className="text-xs font-bold italic text-center bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent group-hover:from-yellow-300 group-hover:via-orange-400 group-hover:to-red-500 transition-all duration-500"
            style={{
              textShadow: '0 0 20px rgba(251, 146, 60, 0.5)',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}>
            &quot;{devTitle}&quot;
          </p>
          {/* Animated glow effect - fire themed */}
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(45deg, rgba(251,146,60,0.1), rgba(239,68,68,0.1), rgba(245,158,11,0.1))',
              filter: 'blur(8px)',
            }} />
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Repos', value: user.public_repos, gradient: 'from-amber-500/15 to-amber-600/5' },
            { label: 'Followers', value: user.followers, gradient: 'from-green-500/15 to-green-600/5' },
            { label: 'Stars', value: stats.totalStars, gradient: 'from-yellow-500/15 to-yellow-600/5' },
            { label: 'Forks', value: stats.totalForks, gradient: 'from-purple-500/15 to-purple-600/5' }
          ].map((stat) => (
            <div
              key={stat.label}
              className={`stat-card text-center py-2 px-1 rounded-lg border border-white/8 relative transition-all duration-300 bg-gradient-to-br ${stat.gradient}`}
              style={{
                backdropFilter: 'blur(10px)',
                boxShadow: isWinner 
                  ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 3px 8px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)',
                background: isWinner
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.18) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0.16) 100%)',
                transform: isWinner ? 'translateY(-1px) scale(1.02)' : 'translateY(-0.5px) scale(1.01)',
              }}
            >
              <div className="text-base font-bold text-white/95 leading-tight">{stat.value.toLocaleString()}</div>
              <div className="text-white/60 text-xs">{stat.label}</div>
              {/* Top light streak */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                borderTopLeftRadius: 'inherit',
                borderTopRightRadius: 'inherit',
                pointerEvents: 'none'
              }} />
            </div>
          ))}
        </div>

        {/* Contribution Graph - Compact */}
        <div className="mb-3">
          <ContributionGraph 
            data={stats.contributionData} 
            username={user.login}
            totalContributions={stats.contributions}
          />
        </div>

        {/* Contribution Traits */}
        <div className="mb-3">
          <h4 className="text-sm font-medium text-white/75 mb-2">Traits</h4>
          <div className="space-y-1.5">
            {traits.map((trait, index) => (
              <div key={index} className="text-xs text-white/70 flex items-center gap-2 p-2 rounded-md border border-white/6"
                style={{
                  background: isWinner 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.11) 100%)',
                  boxShadow: isWinner 
                    ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.3)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 4px rgba(0,0,0,0.25)',
                  transform: isWinner ? 'translateY(-0.5px)' : 'translateY(-0.25px)',
                }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                {trait}
              </div>
            ))}
          </div>
        </div>

        {/* Languages - With original colors, inline, hover effects */}
        <div className="mb-3 flex items-center">
          <h4 className="text-sm font-medium text-white/75 mr-2">Languages</h4>
          <div className="flex flex-row gap-1.5">
            {Object.entries(stats.languageStats || {}).slice(0, 3).map(([lang, langStats]) => (
              <div key={lang} className="relative">
                <span
                  className="language-badge px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 cursor-default"
                  style={{
                    backgroundColor: getLanguageColor(lang) + '15',
                    color: getLanguageColor(lang),
                    borderColor: getLanguageColor(lang) + '30',
                    background: `linear-gradient(135deg, ${getLanguageColor(lang)}15 0%, rgba(0,0,0,0.10) 100%)`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                  tabIndex={0}
                  onMouseEnter={e => {
                    const tooltip = e.currentTarget.nextSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    const tooltip = e.currentTarget.nextSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '0';
                  }}
                  onFocus={e => {
                    const tooltip = e.currentTarget.nextSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '1';
                  }}
                  onBlur={e => {
                    const tooltip = e.currentTarget.nextSibling as HTMLElement;
                    if (tooltip) tooltip.style.opacity = '0';
                  }}
                >
                  {lang}
                </span>
                {/* Language usage tooltip */}
                <div
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(8,8,10,0.98) 80%, rgba(3,3,5,0.96) 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                    color: '#fff',
                    fontSize: '11px',
                    opacity: 0,
                  }}
                >
                  <div className="font-medium">{lang}</div>
                  <div className="text-white/80 mt-1">
                    {typeof langStats.percentage === 'number' 
                      ? `${langStats.percentage.toFixed(1)}%` 
                      : `${parseFloat(langStats.percentage || '0').toFixed(1)}%`
                    } of repositories
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    {langStats.count} {langStats.count === 1 ? 'repository' : 'repositories'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Repos - Enhanced cards with more info */}
        <div>
          <h4 className="text-sm font-medium text-white/75 mb-2">Top Repos</h4>
          <div className="flex flex-row gap-2.5">
            {stats.topRepos.slice(0, 2).map((repo, index) => (
              <a
                key={index}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-card p-3.5 rounded-lg border border-white/8 flex-1 min-w-0 transition-all duration-300 hover:border-white/15 group"
                style={{
                  background: isWinner
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.16) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.15) 100%)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isWinner
                    ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 10px rgba(0,0,0,0.3), 0 1px 6px rgba(0,0,0,0.2)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.25)',
                  transform: isWinner ? 'translateY(-0.5px)' : 'translateY(-0.25px)',
                }}
              >
                {/* Glass overlay for repo card */}
                <div className="pointer-events-none absolute inset-0 rounded-lg" style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                }} />
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/90 font-medium text-sm truncate group-hover:text-white transition-colors">
                        {repo.name}
                      </div>
                      {repo.description && (
                        <div className="text-white/50 text-xs mt-1 line-clamp-2">
                          {repo.description.length > 40 ? repo.description.substring(0, 40) + '...' : repo.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-white/60 ml-2">
                      <Star className="w-3 h-3" />
                      <span className="text-sm font-medium">{repo.stars.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-300"
                      style={{
                        backgroundColor: getLanguageColor(repo.language || 'Unknown') + '20',
                        color: getLanguageColor(repo.language || 'Unknown'),
                        border: `1px solid ${getLanguageColor(repo.language || 'Unknown')}40`,
                      }}
                    >
                      {repo.language || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>{repo.commitCount.toLocaleString()} commits</span>
                      <span>•</span>
                      <span>{formatTimeAgo(repo.daysSinceUpdate)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


