/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Star, GitFork, Eye, Calendar, Users, GitCommit, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RepositoryDetailsProps {
  repoFullName: string;
}

interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  createdAt: string;
  updatedAt: string;
  defaultBranch: string;
  license?: string;
  homepage?: string;
  topics: string[];
  contributors: {
    login: string;
    avatarUrl: string;
    contributions: number;
    profileUrl: string;
  }[];
  recentCommits: {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  }[];
}

export function RepositoryDetails({ repoFullName }: RepositoryDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepositoryInfo | null>(null);
  
  useEffect(() => {
    const fetchRepoDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/get-repo-structure?repo=${repoFullName}`);
        const data = await response.json();
        
        if (response.ok && data.repoDetails) {
          // Transform the data into our expected format
          const repoDetails = data.repoDetails;
          const contributors = data.contributors || [];
          const recentCommits = data.recentCommits || [];
          
          setRepoInfo({
            name: repoDetails.name,
            fullName: repoDetails.full_name,
            description: repoDetails.description || 'No description provided',
            stars: repoDetails.stargazers_count,
            forks: repoDetails.forks_count,
            watchers: repoDetails.watchers_count,
            createdAt: repoDetails.created_at,
            updatedAt: repoDetails.updated_at,
            defaultBranch: repoDetails.default_branch,
            license: repoDetails.license?.name,
            homepage: repoDetails.homepage,
            topics: repoDetails.topics || [],
            contributors: contributors.map((contributor: {
              login: string;
              avatar_url: string;
              contributions: number;
              html_url: string;
            }) => ({
              login: contributor.login,
              avatarUrl: contributor.avatar_url,
              contributions: contributor.contributions,
              profileUrl: contributor.html_url
            })),
            recentCommits: recentCommits.map((commit: {
              sha: string;
              commit: {
                message: string;
                author: {
                  name: string;
                  date: string;
                };
              };
              html_url: string;
            }) => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author.name,
              date: commit.commit.author.date,
              url: commit.html_url
            }))
          });
        } else {
          setError(data.error || 'Failed to fetch repository details');
        }
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError('An error occurred while fetching repository details');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (repoFullName) {
      fetchRepoDetails();
    }
  }, [repoFullName]);
  
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[200px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading repository details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-500 font-medium">Error Loading Repository Details</h3>
            <p className="text-white/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!repoInfo) {
    return (
      <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="text-yellow-500 font-medium">No Repository Details Available</h3>
            <p className="text-white/70 mt-1">Could not retrieve repository information.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Repository Overview */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">{repoInfo.name}</h2>
        <p className="text-white/70 mb-4">{repoInfo.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {repoInfo.topics.map((topic, index) => (
            <Badge key={index} className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
              {topic}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-white/80">{formatNumber(repoInfo.stars)} stars</span>
          </div>
          
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-400" />
            <span className="text-white/80">{formatNumber(repoInfo.forks)} forks</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-400" />
            <span className="text-white/80">{formatNumber(repoInfo.watchers)} watchers</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-white/80">Created {formatDate(repoInfo.createdAt)}</span>
          </div>
        </div>
        
        {repoInfo.license && (
          <div className="mt-4 text-white/60 text-sm">
            License: {repoInfo.license}
          </div>
        )}
        
        {repoInfo.homepage && (
          <div className="mt-2">
            <a 
              href={repoInfo.homepage} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm inline-flex items-center gap-1"
            >
              Visit homepage
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}
      </div>
      
      {/* Contributors */}
      {repoInfo.contributors.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-white">Top Contributors</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repoInfo.contributors.slice(0, 6).map((contributor, index) => (
              <a 
                key={index} 
                href={contributor.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors duration-300 p-3 rounded-lg"
              >
                <img 
                  src={contributor.avatarUrl} 
                  alt={contributor.login} 
                  className="w-10 h-10 rounded-full border border-white/20"
                />
                <div>
                  <div className="text-white font-medium">{contributor.login}</div>
                  <div className="text-white/60 text-sm">{contributor.contributions} commits</div>
                </div>
              </a>
            ))}
          </div>
          
          {repoInfo.contributors.length > 6 && (
            <div className="mt-3 text-center">
              <span className="text-white/60 text-sm">
                + {repoInfo.contributors.length - 6} more contributors
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Recent Commits */}
      {repoInfo.recentCommits.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-medium text-white">Recent Commits</h3>
          </div>
          
          <div className="space-y-3">
            {repoInfo.recentCommits.slice(0, 5).map((commit, index) => {
              // Truncate commit message if too long
              const truncatedMessage = commit.message.length > 80 
                ? commit.message.substring(0, 80) + '...' 
                : commit.message;
              
              return (
                <a 
                  key={index} 
                  href={commit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white/5 hover:bg-white/10 transition-colors duration-300 p-3 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-white font-medium">{truncatedMessage}</div>
                    <div className="text-white/60 text-xs whitespace-nowrap ml-4">
                      {formatDate(commit.date)}
                    </div>
                  </div>
                  <div className="text-white/60 text-sm mt-1">
                    by {commit.author}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}