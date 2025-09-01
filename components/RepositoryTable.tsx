/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GitHubRepo } from '@/lib/github';
import { BarChart3, Search, ExternalLink, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RepositoryTableProps {
  repositories: GitHubRepo[];
  onViewDetails?: (repo: GitHubRepo) => void;
  actionButtonText?: string;
  showIssueCount?: boolean;
  filterType?: string;
}

export default function RepositoryTable({ 
  repositories, 
  onViewDetails, 
  actionButtonText = 'View Details',
  showIssueCount = false,
  filterType = ''
}: RepositoryTableProps) {
  const router = useRouter();

  return (
    // CHANGE 1: Add responsive container with horizontal scroll
    <div className="w-full overflow-x-auto">
      <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-lg relative group animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[180px] sm:w-[240px] md:w-[300px]" />
            <col className="w-[120px] hidden sm:table-column" />
            <col className="w-[90px] hidden sm:table-column" />
            <col className="w-[120px] hidden md:table-column" />
            <col className="w-[120px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-black/50 border-b border-white/10 hover:bg-black/50">
              {/* CHANGE 2: Remove fixed widths, use min-width instead */}
              <TableHead className="text-left py-4 pl-6 pr-2 text-sm font-semibold text-white/90 uppercase tracking-wider w-[180px] sm:w-[240px] md:w-[300px]">
                Repository
              </TableHead>
              <TableHead className="text-left py-4 px-2 text-sm font-semibold text-white/90 uppercase tracking-wider hidden sm:table-cell min-w-[100px]">
                Language
              </TableHead>
              <TableHead className="text-left py-4 px-2 text-sm font-semibold text-white/90 uppercase tracking-wider hidden sm:table-cell min-w-[80px]">
                Stars
              </TableHead>
              <TableHead className="text-left py-4 px-2 text-sm font-semibold text-white/90 uppercase tracking-wider hidden md:table-cell min-w-[100px]">
                Relevance
              </TableHead>
              <TableHead className="text-right py-4 pl-2 pr-4 text-sm font-semibold text-white/90 uppercase tracking-wider min-w-[90px] whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/10">
            {repositories.map((repo, index) => (
              <TableRow key={repo.id || index} className="hover:bg-white/5 transition-all duration-300 group border-b border-white/10 backdrop-blur-sm relative overflow-hidden animate-in fade-in slide-in-from-left-2">
                {/* Remove absolute overlay div for correct table layout */}
                <TableCell className="py-4 pl-4 pr-2 min-w-0 w-[180px] sm:w-[240px] md:w-[300px]">
                  <div className="flex flex-col min-w-0 w-full">
                    <h3 
                      className="text-sm md:text-base font-semibold text-white group-hover:text-white/90 transition-colors cursor-pointer hover:underline truncate w-full"
                      onClick={() => onViewDetails && onViewDetails(repo)}
                      title={repo.full_name || repo.name}
                    >
                      {repo.full_name || repo.name}
                    </h3>
                    <p
                      className="hidden xl:block text-white/60 text-[11px] mt-0.5 w-full"
                      title={repo.description || 'No description available'}
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {repo.description || 'No description available'}
                    </p>
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="hidden xl:flex flex-wrap gap-1 mt-1 w-full overflow-hidden">
                        {repo.topics.slice(0, 2).map((topic) => (
                          <span key={topic} className="bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 px-2 py-0.5 rounded-full text-xs shadow-sm hover:bg-white/15 hover:border-white/30 transition-all duration-300">
                            {topic}
                          </span>
                        ))}
                        {repo.topics.length > 2 && (
                          <span className="text-white/50 text-xs px-2 py-0.5">
                            +{repo.topics.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-2 hidden sm:table-cell">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-white/60 mr-2 shadow-sm flex-shrink-0"></span>
                    <span className="text-white/80 text-sm truncate">
                      {repo.language || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-2 hidden sm:table-cell">
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 mr-1 fill-current flex-shrink-0" />
                    <span className="text-white font-medium text-sm">
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-2 hidden md:table-cell">
                  {repo.relevance_score ? (
                    <div className="flex items-center">
                      <div className="w-12 bg-white/20 rounded-full h-2 mr-2 backdrop-blur-sm border border-white/10 flex-shrink-0">
                        <div 
                          className="bg-gradient-to-r from-white/60 to-white/80 h-2 rounded-full transition-all duration-300 shadow-sm"
                          style={{ width: `${repo.relevance_score * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-white/90 text-xs font-medium">
                        {Math.round(repo.relevance_score * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/50 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-2 text-right whitespace-nowrap">
                  <div className="flex gap-1 justify-end items-center flex-nowrap">
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(repo)}
                        className="bg-indigo-500/20 backdrop-blur-xl border border-indigo-500/30 text-white/90 hover:bg-indigo-500/30 hover:border-indigo-500/50 hover:text-white px-1.5 py-1 rounded-md transition-all duration-300 text-[11px] font-medium flex items-center space-x-1 shadow-sm flex-shrink-0"
                        title={showIssueCount && repo.issue_count ? `${actionButtonText} (${repo.issue_count})` : actionButtonText}
                      >
                        <Search className="w-3 h-3 text-white/70" />
                        <span className="hidden md:inline">
                          {actionButtonText}
                          {showIssueCount && repo.issue_count && (
                            <span className="ml-1 bg-indigo-600/50 px-0.5 py-0.5 rounded text-[9px] leading-none">
                              {repo.issue_count}
                            </span>
                          )}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/visualize?repo=${encodeURIComponent(repo.full_name)}`)}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30 hover:text-white px-1.5 py-1 rounded-md transition-all duration-300 text-[11px] font-medium flex items-center space-x-1 shadow-sm flex-shrink-0"
                      title="Generate Architecture Diagram"
                    >
                      <BarChart3 className="w-3 h-3 text-white/70" />
                      <span className="hidden md:inline">Visualize</span>
                    </button>
                    <button
                      onClick={() => router.push(`/analyze?repo=${encodeURIComponent(repo.full_name)}`)}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30 hover:text-white px-1.5 py-1 rounded-md transition-all duration-300 text-[11px] font-medium flex items-center space-x-1 shadow-sm flex-shrink-0"
                      title="Analyze Repository Structure"
                    >
                      <Search className="w-3 h-3 text-white/70" />
                      <span className="hidden md:inline">Analyze</span>
                    </button>
                    <a
                      href={`https://github.com/${repo.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-white/15 hover:border-white/30 hover:text-white px-1.5 py-1 rounded-md transition-all duration-300 text-[11px] font-medium flex items-center space-x-1 shadow-sm flex-shrink-0"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3 h-3 text-white/70" />
                      <span className="hidden md:inline">GitHub</span>
                    </a>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}