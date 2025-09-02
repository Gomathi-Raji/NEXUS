/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import { GitHubRepo, GitHubService } from '@/lib/github';
import { useRouter, useSearchParams } from 'next/navigation';
import RepositoryTable from '@/components/RepositoryTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, Code, Lightbulb, ChevronLeft, ChevronRight, X, Info,
  Star, GitFork, Eye, ExternalLink, Calendar, RefreshCw,
  FileText, Globe, Github, AlertCircle, Zap, Loader2, BarChart3 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RepositoryCard from '@/components/RepositoryCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function SearchPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'repo' | 'idea' | 'find'>('repo');
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [showRepoDetails, setShowRepoDetails] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRanking, setIsRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed at 10 items per page
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState('relevance');
  
  // Repository details dialog state already declared above
  
  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);

  const sortedRepositories = useMemo(() => {
    const sorted = [...repositories];
    if (sortOrder === 'relevance') {
      sorted.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    } else if (sortOrder === 'stars') {
      sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    return sorted;
  }, [repositories, sortOrder]);

  const fetchAndRankRepos = async (searchQuery: string, searchPage: number) => {
    try {
      // Step 1: Fetch repositories from GitHub
      console.log(`Fetching page ${searchPage} for query: "${searchQuery}"`);
      setError(null);
      setSuggestedQuery(null);
      
      // Determine the API endpoint based on search mode
      const endpoint = '/api/search-repos';
      
      const searchResponse = await axios.get(endpoint, {
        params: { 
          query: searchQuery, 
          page: searchPage,
          mode: searchMode,
          per_page: itemsPerPage
        },
      });
      console.log(`[${endpoint}] Response:`, searchResponse.data);

      const newRepos: GitHubRepo[] = searchResponse.data.items;
      setHasMore(searchResponse.data.has_more);
      
      // Calculate total pages based on total_count and items per page
      const totalCount = searchResponse.data.total_count || 0;
      const maxResults = Math.min(totalCount, 1000); // GitHub API limits to 1000 results
      setTotalPages(Math.ceil(maxResults / itemsPerPage) || 1);

      if (newRepos.length === 0) {
        if (searchPage === 1) {
            setRepositories([]);
        }
        return;
      }
      
      // For 'find' mode, skip AI ranking and use direct GitHub results
      if (searchMode === 'find') {
        if (searchPage === 1) {
          setRepositories(newRepos);
        } else {
          setRepositories(prevRepos => [...prevRepos, ...newRepos]);
        }
        return;
      }
      
      // Update state with search results
      if (searchPage === 1) {
        setRepositories(newRepos);
      } else {
        setRepositories(prevRepos => [...prevRepos, ...newRepos]);
      }
      
      // Step 2: Rank the newly fetched repositories (skip for find mode)
      setIsRanking(true);
      console.log('Sending to /api/rank-repos:', newRepos.map(r => r.full_name));
      
      // For idea search mode, we need to rank repositories based on relevance to the idea
      const rankResponse = await axios.post('/api/rank-repos', {
        repos: newRepos,
        query: searchQuery,
        mode: searchMode
      });
      
      console.log('[/api/rank-repos] Response:', rankResponse.data);
      const rankedRepos: GitHubRepo[] = rankResponse.data;

      // Step 3: Update with ranked results
      if (searchPage === 1) {
        setRepositories(rankedRepos);
      } else {
        setRepositories(prevRepos => {
          const prevReposWithoutNew = prevRepos.filter(pr => !newRepos.some(nr => nr.id === pr.id));
          return [...prevReposWithoutNew, ...rankedRepos];
        });
      }

    } catch (err: unknown) {
      console.error('Error in fetchAndRankRepos:', err);
      
      // Check if it's a spelling error and try to suggest corrections
      if (searchPage === 1 && searchQuery.length > 3) {
        try {
          // More comprehensive spelling correction for common programming terms
          const corrections: Record<string, string> = {
            'javascrip': 'javascript',
            'javascrpit': 'javascript',
            'javasript': 'javascript',
            'react js': 'reactjs',
            'react.js': 'reactjs',
            'node js': 'nodejs',
            'node.js': 'nodejs',
            'type script': 'typescript',
            'typescrpit': 'typescript',
            'pytohn': 'python',
            'pyhton': 'python',
            'djagno': 'django',
            'fluter': 'flutter',
            'anuglar': 'angular',
            'vuejs': 'vue',
            'vue js': 'vue',
            'vue.js': 'vue',
          };
          
          // Check if any part of the query matches a common misspelling
          const queryLower = searchQuery.toLowerCase();
          let correctedQuery = searchQuery;
          
          for (const [misspelled, correct] of Object.entries(corrections)) {
            if (queryLower.includes(misspelled)) {
              correctedQuery = correctedQuery.replace(new RegExp(misspelled, 'gi'), correct);
            }
          }
          
          if (correctedQuery !== searchQuery) {
            setSuggestedQuery(correctedQuery);
            setError(`Did you mean "${correctedQuery}"? Click to search.`);
          } else {
            setError('Failed to fetch or rank repositories. Please check your API keys and try again.');
          }
        } catch (correctionErr) {
          setError('Failed to fetch or rank repositories. Please check your API keys and try again.');
        }
      } else {
        setError('Failed to fetch or rank repositories. Please check your API keys and try again.');
      }
    } finally {
      setIsRanking(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setPage(1);
    setRepositories([]);
    setIsLoading(true);
    setError(null);

    if (searchMode === 'find') {
      // Direct GitHub repo search by exact repo name or URL
      try {
        let repoQuery = query.trim();
        
        // Extract repo name from GitHub URL if provided
        const githubUrlMatch = repoQuery.match(/github\.com\/(?:repo:)?([^\s#?]+\/[^\s/#?]+)/i);
        if (githubUrlMatch) {
          repoQuery = githubUrlMatch[1];
        }
        // Strip trailing .git if present
        repoQuery = repoQuery.replace(/\.git$/i, '');
        
        // If it looks like a repo name (owner/repo), search for exact match
        if (repoQuery.includes('/')) {
          const response = await axios.get('/api/search-repos', {
            params: { 
              query: `repo:${repoQuery}`, 
              page: 1,
              per_page: 1,
              mode: 'find',
            },
          });
          
          if (response.data.items && response.data.items.length > 0) {
            setRepositories(response.data.items);
            setTotalPages(1);
          } else {
            setRepositories([]);
            setError(`Repository "${repoQuery}" not found. Please check the repository name or URL.`);
          }
        } else {
          // Regular search for repo names containing the query
          const response = await axios.get('/api/search-repos', {
            params: { 
              query: repoQuery, 
              page: 1,
              per_page: itemsPerPage,
              mode: 'find',
            },
          });
          
          setRepositories(response.data.items || []);
          const totalCount = response.data.total_count || 0;
          const maxResults = Math.min(totalCount, 1000);
          setTotalPages(Math.ceil(maxResults / itemsPerPage) || 1);
        }
      } catch (err) {
        console.error('Error in direct GitHub search:', err);
        setError('Failed to fetch repository. Please check the repository name or URL and try again.');
      }
    } else {
      // Use AI for ranking
      await fetchAndRankRepos(query, 1);
    }

    setIsLoading(false);
    
    // Scroll to results after search completes
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSearchWithCorrection = async (correctedQuery: string) => {
    setQuery(correctedQuery);
    setPage(1);
    setRepositories([]);
    setIsLoading(true);
    setError(null);

    await fetchAndRankRepos(correctedQuery, 1);

    setIsLoading(false);
    
    // Scroll to results after search completes
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || isLoading) return;
    
    setIsLoading(true);
    setPage(newPage);
    
    await fetchAndRankRepos(query, newPage);
    
    setIsLoading(false);
    
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Load More functionality removed - using pagination instead
  
  const openRepoDetails = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setShowRepoDetails(true);
  };
  
  const closeRepoDetails = () => {
    setShowRepoDetails(false);
    setTimeout(() => setSelectedRepo(null), 300); // Clear after animation
  };

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-golden-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      <header className="text-center mt-24 md:mt-32 mb-8 md:mb-12 relative">
        {/* Golden sparkle effects around header */}
        <div className="absolute -left-8 top-1/2 w-4 h-4 bg-[radial-gradient(circle,rgba(255,215,0,0.4),transparent_70%)] rounded-full animate-pulse" />
        <div className="absolute -right-8 top-1/2 w-3 h-3 bg-[radial-gradient(circle,rgba(218,165,32,0.3),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-1/2 -top-6 w-2 h-2 bg-[radial-gradient(circle,rgba(205,127,50,0.5),transparent_70%)] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative inline-block">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Find Your Next Project
          </h1>
          <div className="absolute -inset-1 bg-gradient-to-r from-golden-500/0 via-golden-500/10 to-golden-500/0 blur-xl opacity-50 -z-10"></div>
        </div>
        <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
          Enter a concept to discover and analyze relevant open-source projects.
        </p>
      </header>

      <main>
        {/* Search Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-1 shadow-2xl shadow-black/20 flex">
            <button
              onClick={() => setSearchMode('repo')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${searchMode === 'repo' 
                ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                : 'text-white/60 hover:text-white/80'}`}
            >
              <Code className="w-4 h-4 inline-block mr-1" />
              Repository
            </button>
            <button
              onClick={() => setSearchMode('find')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${searchMode === 'find' 
                ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                : 'text-white/60 hover:text-white/80'}`}
            >
              <Search className="w-4 h-4 inline-block mr-1" />
              Find Repo
            </button>
            <button
              onClick={() => setSearchMode('idea')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${searchMode === 'idea' 
                ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                : 'text-white/60 hover:text-white/80'}`}
            >
              <Lightbulb className="w-4 h-4 inline-block mr-1" />
              Project Idea
            </button>
          </div>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/20 group transition-all duration-300 hover:border-white/30 hover:bg-black/40 focus-within:border-white/40 focus-within:bg-black/50 animate-in fade-in slide-in-from-top-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            
            <div className="flex items-center">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchMode === 'repo' ? "Search for repositories (e.g., 'react-native')" :
                  searchMode === 'find' ? "Enter Github URL or owner/repo (e.g., 'facebook/react')" :
                  "Describe your project idea (e.g., 'a chat app with react')"
                }
                className="flex-grow p-6 text-lg bg-transparent border-0 text-white/90 placeholder:text-white/40 focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 focus:scale-[1.02]"
              />
              <Button 
                type="submit" 
                size="lg" 
                className="m-2 bg-black/50 hover:bg-black/70 text-white/90 font-medium border border-white/20 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm backdrop-blur-xl px-8 hover:scale-105 active:scale-95"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
            
            {/* Animated glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>
          </div>
          
          {/* Search mode description */}
          <div className="text-center mt-3 text-sm text-white/50">
            {searchMode === 'repo' ? 
              "Search for specific GitHub repositories by name or keywords" :
              searchMode === 'find' ? 
              "Find exact repositories by Github URL or owner/repo name" :
              "Describe what you want to build and find matching open-source projects"}
          </div>
        </form>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center my-12 animate-in fade-in duration-300">
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl px-8 py-6 shadow-lg flex items-center space-x-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-golden-500/10 pointer-events-none"></div>
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 backdrop-blur-xl"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-amber-500 animate-spin"></div>
                <div className="absolute inset-0 rounded-full bg-amber-500/5 animate-pulse backdrop-blur-md"></div>
              </div>
              <span className="text-white/90 text-lg font-medium animate-pulse">Searching repositories...</span>
            </div>
          </div>
        )}

        {/* Error Message with Potential Correction */}
        {error && (
          <div className="my-8 max-w-2xl mx-auto overflow-hidden rounded-xl bg-black/30 backdrop-blur-xl border border-red-500/30 p-6 shadow-lg relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 blur-xl opacity-30 -z-10"></div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-full p-1.5 shadow-sm">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-red-400">Error</h3>
                <p className="mt-1 text-white/70">{error}</p>
                {suggestedQuery && (
                  <button 
                    onClick={() => handleSearchWithCorrection(suggestedQuery)}
                    className="mt-2 bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white px-3 py-1.5 rounded-xl transition-all duration-300 text-sm font-medium shadow-sm"
                  >
                    Search with correction
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        {sortedRepositories.length > 0 && (
          <div className="flex justify-end mb-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-golden-500/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-xl"></div>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px] bg-black/30 text-white/90 border-white/20 rounded-lg backdrop-blur-xl hover:bg-black/40 hover:border-white/30 transition-all duration-300 shadow-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-white/20 text-white/90 backdrop-blur-xl rounded-lg shadow-lg">
                  <SelectItem value="relevance" className="hover:bg-black/50 focus:bg-black/50">Sort by Relevance</SelectItem>
                  <SelectItem value="stars" className="hover:bg-black/50 focus:bg-black/50">Sort by Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && !isLoadingMore && sortedRepositories.length === 0 && query && (
          <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center shadow-lg my-8 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-golden-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-golden-500/0 blur-xl opacity-30 -z-10"></div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
              <Search className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-xl font-medium text-white/90 mb-2">No repositories found</h3>
            <p className="text-white/70 max-w-md mx-auto">
              We couldn&apos;t find any repositories matching your search. Try using different keywords or a more general query.
            </p>
          </div>
        )}

        {/* Repository Results Table */}
        {sortedRepositories.length > 0 && (
          <div ref={resultsRef} id="results-container">
            <RepositoryTable 
              repositories={sortedRepositories}
              onViewDetails={(repo) => {
                setSelectedRepo(repo);
              }}
            />
          </div>
        )}

        {/* Loading Indicator for Load More */}
        {(!isLoading && isLoadingMore) && (
          <div className="flex justify-center items-center py-8">
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl px-8 py-6 shadow-lg flex items-center space-x-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-golden-500/10 pointer-events-none"></div>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 backdrop-blur-xl"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-amber-500 animate-spin"></div>
                <div className="absolute inset-0 rounded-full bg-amber-500/5 animate-pulse backdrop-blur-md"></div>
              </div>
              <span className="text-white/90 text-lg font-medium">Loading more<span className="animate-pulse">...</span></span>
            </div>
          </div>
        )}

        {/* Repository Details Modal */}
        <Dialog open={!!selectedRepo} onOpenChange={(open) => !open && setSelectedRepo(null)}>
          {selectedRepo && (
                            <DialogContent className="max-w-3xl w-full bg-black/50 backdrop-blur-2xl border-white/20 text-white rounded-2xl shadow-2xl shadow-amber-500/20 animate-in fade-in zoom-in-95 duration-500">
              <DialogHeader>
                <DialogTitle className="text-2xl font-rye text-amber-300 tracking-wider">
                  {selectedRepo.full_name}
                </DialogTitle>
                <DialogDescription className="text-white/70 pt-2 line-clamp-3">
                  {selectedRepo.description || 'No description available.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 text-sm">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-semibold text-white/90 mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRepo.topics?.length > 0 ? (
                        selectedRepo.topics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="bg-black/30 border-white/20 backdrop-blur-xl hover:bg-black/40 transition-colors">
                            {topic}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-white/50">No topics listed.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white/90 mb-2">Language</h4>
                    <p className="text-amber-300 font-medium">{selectedRepo.language || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Stars</span>
                    <span className="font-bold text-yellow-400 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      {selectedRepo.stargazers_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Forks</span>
                    <span className="font-bold text-white">{selectedRepo.forks_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Watchers</span>
                    <span className="font-bold text-white">{selectedRepo.watchers_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Open Issues</span>
                    <span className="font-bold text-white">{selectedRepo.open_issues_count.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                                            <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline flex items-center gap-1.5 justify-end">
                      View on GitHub <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-4 bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl px-6 py-3 shadow-lg shadow-black/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="bg-black/20 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-black/40 hover:border-white/30 hover:text-white disabled:text-white/30 disabled:bg-black/10 disabled:border-white/5 transition-all duration-300 h-9 w-9 p-0 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="text-white/80 font-medium px-3 py-1 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                Page {page} of {totalPages}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || isLoading}
                className="bg-black/20 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-black/40 hover:border-white/30 hover:text-white disabled:text-white/30 disabled:bg-black/10 disabled:border-white/5 transition-all duration-300 h-9 w-9 p-0 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Load More functionality removed - using pagination instead */}
      </main>
      
      {/* Repository Details Dialog */}
      <Dialog open={showRepoDetails} onOpenChange={setShowRepoDetails}>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 transition-all duration-300" style={{ opacity: showRepoDetails ? 1 : 0, pointerEvents: showRepoDetails ? 'auto' : 'none' }}></div>
        <DialogContent className="bg-black/60 backdrop-blur-xl border border-white/20 text-white/90 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/20 z-50 relative overflow-hidden">  
          {/* Liquid glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-50 -z-10"></div>
          {selectedRepo && (
            <>
              <DialogHeader className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-4 mb-4 shadow-sm relative overflow-hidden group hover:bg-black/40 hover:border-white/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                  <span className="break-all">{selectedRepo.full_name}</span>
                  <a 
                    href={selectedRepo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white/80 hover:text-white ml-2 inline-flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </DialogTitle>
                <DialogDescription className="text-white/70 text-base mt-2 break-words">
                  {selectedRepo.description || 'No description available'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4 space-y-4">
                {/* Repository Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center shadow-sm hover:bg-black/40 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <Star className="w-5 h-5 text-white/80 mx-auto" />
                    <div className="mt-1 text-lg font-semibold">{selectedRepo.stargazers_count.toLocaleString()}</div>
                    <div className="text-xs text-white/60">Stars</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center shadow-sm hover:bg-black/40 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <GitFork className="w-5 h-5 text-white/80 mx-auto" />
                    <div className="mt-1 text-lg font-semibold">{selectedRepo.forks_count.toLocaleString()}</div>
                    <div className="text-xs text-white/60">Forks</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center shadow-sm hover:bg-black/40 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <Eye className="w-5 h-5 text-white/80 mx-auto" />
                    <div className="mt-1 text-lg font-semibold">{selectedRepo.watchers_count.toLocaleString()}</div>
                    <div className="text-xs text-white/60">Watchers</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 text-center shadow-sm hover:bg-black/40 hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <AlertCircle className="w-5 h-5 text-white/80 mx-auto" />
                    <div className="mt-1 text-lg font-semibold">{selectedRepo.open_issues_count.toLocaleString()}</div>
                    <div className="text-xs text-white/60">Issues</div>
                  </div>
                </div>
                
                {/* Topics */}
                {selectedRepo.topics && selectedRepo.topics.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-white/90">Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRepo.topics.map((topic) => (
                        <Badge key={topic} className="bg-black/30 backdrop-blur-xl border border-white/30 text-white/80 hover:bg-black/40 hover:border-white/50 hover:text-white transition-all duration-300 shadow-sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:bg-black/30 hover:border-white/20 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <h3 className="text-lg font-medium mb-3 text-white/90">Details</h3>
                    <div className="space-y-3 text-sm">
                      {selectedRepo.language && (
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-white/50 mr-2 shadow-sm"></div>
                          <span className="text-white/80">Primary Language: {selectedRepo.language}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-white/70" />
                        <span className="text-white/80">Created: {new Date(selectedRepo.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 text-white/70" />
                        <span className="text-white/80">Last Updated: {new Date(selectedRepo.updated_at).toLocaleDateString()}</span>
                      </div>
                      {selectedRepo.license && (
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-white/70" />
                          <span className="text-white/80">License: {selectedRepo.license.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:bg-black/30 hover:border-white/20 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <h3 className="text-lg font-medium mb-3 text-white/90">Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        className="w-full justify-start bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm"
                        onClick={() => window.open(selectedRepo.html_url, '_blank')}
                      >
                        <Github className="w-4 h-4 mr-2 text-white/70" />
                        View on GitHub
                      </Button>
                      {selectedRepo.homepage && (
                        <Button 
                          variant="outline" 
                          className="w-full justify-start bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm"
                          onClick={() => window.open(selectedRepo.homepage, '_blank')}
                        >
                          <Globe className="w-4 h-4 mr-2 text-white/70" />
                          Visit Homepage
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
