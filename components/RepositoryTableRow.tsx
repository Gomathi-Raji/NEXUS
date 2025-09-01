'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GitHubRepo } from '@/lib/github';
import { BarChart3, Search, ExternalLink, Star } from 'lucide-react';

interface RepositoryTableRowProps {
  repo: GitHubRepo;
  onViewDetails?: (repo: GitHubRepo) => void;
}

export default function RepositoryTableRow({ repo, onViewDetails }: RepositoryTableRowProps) {
  const router = useRouter();

  return (
    <tr className="hover:bg-black/40 transition-all duration-300 group border-b border-white/10 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-left-2">
      {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-golden-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <td className="py-4 px-6">
        <div className="flex flex-col">
          <h3 
                            className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors cursor-pointer hover:underline"
            onClick={() => onViewDetails && onViewDetails(repo)}
          >
            {repo.full_name || repo.name}
          </h3>
          <p className="text-white/70 text-sm mt-1 line-clamp-2">
            {repo.description ? 
              (repo.description.length > 120 ? `${repo.description.substring(0, 120)}...` : repo.description) 
              : 'No description available'
            }
          </p>
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 max-w-full overflow-hidden">
              {repo.topics.slice(0, 3).map((topic) => (
                <span key={topic} className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 px-2 py-0.5 rounded-full text-xs shadow-sm hover:bg-black/40 hover:border-white/30 transition-all duration-300 hover:scale-105">
                  {topic}
                </span>
              ))}
              {repo.topics.length > 3 && (
                <span className="text-white/50 text-xs px-2 py-0.5">
                  +{repo.topics.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-4 hidden sm:table-cell">
        <div className="flex items-center">
                          <span className="w-3 h-3 rounded-full bg-amber-500 mr-2 shadow-sm shadow-amber-500/30"></span>
          <span className="text-white/80 text-sm">
            {repo.language || 'Unknown'}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 hidden sm:table-cell">
        <div className="flex items-center text-yellow-400">
          <Star className="w-4 h-4 mr-1 fill-current" />
          <span className="text-white font-medium">
            {repo.stargazers_count.toLocaleString()}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 hidden md:table-cell">
        {repo.relevance_score ? (
          <div className="flex items-center">
            <div className="w-16 bg-black/30 rounded-full h-2 mr-2 backdrop-blur-sm border border-white/10">
              <div 
                className="bg-gradient-to-r from-amber-500 to-golden-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${repo.relevance_score * 100}%` }}
              ></div>
            </div>
                            <span className="text-amber-300 text-sm font-medium">
              {Math.round(repo.relevance_score * 100)}%
            </span>
          </div>
        ) : (
          <span className="text-white/50 text-sm">-</span>
        )}
      </td>
      <td className="py-4 px-6 text-right">
      <div className="flex gap-2 justify-end items-center">
          <button
            onClick={() => router.push(`/visualize?repo=${encodeURIComponent(repo.full_name)}`)}
            className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium flex items-center space-x-1 shadow-sm"
            title="Generate Architecture Diagram"
          >
            <BarChart3 className="w-4 h-4 text-purple-400 hidden sm:inline" />
            <span>Visualize</span>
          </button>
          <button
            onClick={() => router.push(`/analyze?repo=${encodeURIComponent(repo.full_name)}`)}
            className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium flex items-center space-x-1 shadow-sm"
            title="Analyze Repository Structure"
          >
            <Search className="w-4 h-4 text-cyan-400 hidden sm:inline" />
            <span>Analyze</span>
          </button>
          <a
            href={`https://github.com/${repo.full_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 text-xs sm:text-sm font-medium flex items-center space-x-1 shadow-sm"
            title="View on GitHub"
          >
            <ExternalLink className="w-4 h-4 text-indigo-400 hidden sm:inline" />
            <span>GitHub</span>
          </a>
        </div>
      </td>
    </tr>
  );
}
