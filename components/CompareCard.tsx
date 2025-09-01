'use client';

import { Github, Star, Trophy, Users, Zap, LucideIcon } from "lucide-react";
import Image from "next/image";
import ContributionGraph from "./ContributionGraph";

// Types from compare page
interface GitHubUser {
  name: string | null;
  login: string;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  bio: string | null;
  created_at: string;
  company: string | null;
  blog: string | null;
}

interface GitHubStats {
  totalStars: number;
  totalForks: number;
  contributions: number;
  languageStats: Record<string, { percentage: number | string; count: number }>;
  topRepos: Array<{
    name: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    url: string;
    commitCount: number;
    daysSinceUpdate: number;
  }>;
  contributionData: Array<{ week: number; contributions: number }>;
}

// Mock GitHub profile data for your profile (updated with real data)
const mockGitHubUser: GitHubUser = {
  name: "Your Name",
  login: "your-username",
  avatar_url: "https://avatars.githubusercontent.com/u/your-user-id?v=4",
  followers: 17,
  following: 4,
  public_repos: 19,
  location: "Your Location",
  bio: "Your bio here",
  created_at: "2023-07-01T10:30:00Z",
  company: null,
  blog: "https://your-website.com"
};

const mockGitHubStats: GitHubStats = {
  totalStars: 8,
  totalForks: 6,
  contributions: 737,
  languageStats: {
    "JavaScript": { percentage: 35.2, count: 6 },
    "TypeScript": { percentage: 28.7, count: 4 },
    "Python": { percentage: 16.1, count: 3 },
    "CSS": { percentage: 12.4, count: 3 },
    "HTML": { percentage: 7.6, count: 3 }
  },
  topRepos: [
    {
      name: "Your-Project-1",
      description: "A beautiful project description",
      stars: 3,
      forks: 0,
      language: "TypeScript",
      url: "https://github.com/your-username/your-project-1",
      commitCount: 45,
      daysSinceUpdate: 2
    },
    {
      name: "Your-Project-2",
      description: "Another amazing project",
      stars: 2,
      forks: 0,
      language: "TypeScript",
      url: "https://github.com/your-username/your-project-2",
      commitCount: 67,
      daysSinceUpdate: 5
    }
  ],
  contributionData: [
    { week: 0, contributions: 12 },
    { week: 1, contributions: 18 },
    { week: 2, contributions: 25 },
    { week: 3, contributions: 31 },
    { week: 4, contributions: 22 },
    { week: 5, contributions: 28 },
    { week: 6, contributions: 19 },
    { week: 7, contributions: 24 },
    { week: 8, contributions: 33 },
    { week: 9, contributions: 29 },
    { week: 10, contributions: 27 },
    { week: 11, contributions: 35 },
    { week: 12, contributions: 31 },
    { week: 13, contributions: 28 },
    { week: 14, contributions: 26 },
    { week: 15, contributions: 32 },
    { week: 16, contributions: 29 },
    { week: 17, contributions: 34 },
    { week: 18, contributions: 30 },
    { week: 19, contributions: 27 },
    { week: 20, contributions: 25 },
    { week: 21, contributions: 33 },
    { week: 22, contributions: 28 },
    { week: 23, contributions: 31 },
    { week: 24, contributions: 29 },
    { week: 25, contributions: 26 },
    { week: 26, contributions: 34 },
    { week: 27, contributions: 32 },
    { week: 28, contributions: 28 },
    { week: 29, contributions: 30 },
    { week: 30, contributions: 27 },
    { week: 31, contributions: 35 },
    { week: 32, contributions: 33 },
    { week: 33, contributions: 29 },
    { week: 34, contributions: 31 },
    { week: 35, contributions: 28 },
    { week: 36, contributions: 32 },
    { week: 37, contributions: 26 },
    { week: 38, contributions: 34 },
    { week: 39, contributions: 30 },
    { week: 40, contributions: 29 },
    { week: 41, contributions: 27 },
    { week: 42, contributions: 33 },
    { week: 43, contributions: 31 },
    { week: 44, contributions: 28 },
    { week: 45, contributions: 32 },
    { week: 46, contributions: 29 },
    { week: 47, contributions: 26 },
    { week: 48, contributions: 34 },
    { week: 49, contributions: 30 },
    { week: 50, contributions: 28 },
    { week: 51, contributions: 31 }
  ]
};

// UserComparisonCard Component (exact copy from compare page)
function UserComparisonCard({ user, stats, badge, winner }: {
  user: GitHubUser;
  stats: GitHubStats;
  badge: { icon: LucideIcon; text: string; color: string };
  winner: string | null;
}) {
  const BadgeIcon = badge.icon;
  
  // Determine avatar glow based on profile type
  const getAvatarGlow = (user: GitHubUser, stats: GitHubStats) => {
    if (stats.contributions > 1000) return 'avatar-active'; // Green for active contributor
    if (stats.totalStars > 500 || user.followers > 200) return 'avatar-rising'; // Yellow for rising dev
    return 'avatar-niche'; // Blue for niche language user
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
        transform: isWinner ? 'translateY(-2px) scale(1.008)' : 'none',
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
        {/* Header - Compact design */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative group">
            <Image
              src={user.avatar_url}
              alt={user.name || user.login}
              width={48}
              height={48}
              className={`w-12 h-12 rounded-xl transition-all duration-300 ${avatarGlow}`}
              style={{ 
                touchAction: 'manipulation',
              }}
            />
            {/* Glass overlay on avatar */}
            <div className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent" />
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
            { label: 'Repos', value: user.public_repos, gradient: 'from-blue-500/15 to-blue-600/5' },
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
            </div>
          ))}
        </div>

        {/* Contribution Graph - Compact */}
        <div className="mb-3">
          <ContributionGraph 
            data={stats.contributionData.map(item => item.contributions)} 
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
            {Object.entries(stats.languageStats || {}).slice(0, 3).map(([lang]) => (
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
                >
                  {lang}
                </span>
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

export default function CompareCard() {
  const user = mockGitHubUser;
  const stats = mockGitHubStats;
  const badge = { icon: Trophy, text: "Active Contributor", color: "blue" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 relative">
            {/* Golden sparkle effects around header */}
            <div className="absolute -left-8 top-1/2 w-4 h-4 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
            <div className="absolute -right-8 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute left-1/2 -top-6 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-golden-400 via-amber-500 to-bronze-500 bg-clip-text text-transparent">
              Compare Developers
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Discover how developers stack up against each other through comprehensive GitHub analytics, contribution patterns, and coding expertise.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Feature Explanations */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                  What We Analyze
                </h2>
                
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Github className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Repository Analysis</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Deep dive into repository quality, star counts, fork ratios, and project diversity to understand coding impact.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Contribution Patterns</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Analyze commit frequency, contribution consistency, and activity patterns across different time periods.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Trophy className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Skill Assessment</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Evaluate programming language expertise, technology stack diversity, and project complexity levels.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Community Impact</h3>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Measure follower engagement, collaboration frequency, and influence within the developer community.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - GitHub Profile Card (Exact UserComparisonCard from /compare) */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <UserComparisonCard 
                  user={user}
                  stats={stats}
                  badge={badge}
                  winner={null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
