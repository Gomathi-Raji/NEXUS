/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { GitHubRepo, GitHubIssue } from '@/lib/github';
import RepositoryTable from '@/components/RepositoryTable';
import { Button } from '@/components/ui/button';
import { 
  Search, Code, ChevronLeft, ChevronRight, X,
  Calendar, AlertCircle, Tag, ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/components/ui/hide-scrollbar.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import LiquidLoader from '@/components/LiquidLoader';

export default function OpenSourcePage() {
  // Timeout message state
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Filter state
  const [filter, setFilter] = useState<'good first issue' | 'bounty issue' | 'major issue'>('good first issue');
  const [language, setLanguage] = useState<string>('');
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [showRepoDetails, setShowRepoDetails] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Issues state
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  
  // Cache for repository issues by repo name and filter
  const [issuesCache, setIssuesCache] = useState<Record<string, GitHubIssue[]>>({});
  const [explanationCache, setExplanationCache] = useState<Record<string, string>>({});
  // Background counts cache to avoid blocking pagination
  const [issueCounts, setIssueCounts] = useState<Record<string, number>>({});
  // Track which repos have already had counts computed (even if zero)
  const [computedIssueCounts, setComputedIssueCounts] = useState<Record<string, boolean>>({});
  
  // Explanation state
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10); // Fixed at 10 items per page
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  // Track which pages are already loaded to avoid re-fetching
  const [pagesLoaded, setPagesLoaded] = useState<Record<number, boolean>>({ 1: false });
  
  // Issues pagination
  const [issuesPage, setIssuesPage] = useState(1);
  const [issuesPerPage] = useState(10);
  
  // Sorting state
  const [sortOrder, setSortOrder] = useState('relevance');
  
  // Refs
  const resultsRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const lastFetchKey = useRef<string>('');

  const sortedRepositories = useMemo(() => {
    const sorted = [...repositories];
    if (sortOrder === 'relevance') {
      sorted.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    } else if (sortOrder === 'stars') {
      sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    return sorted;
  }, [repositories, sortOrder]);

  // Auto-trigger search when user selects the Bounty filter
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (filter === 'bounty issue') {
      // Trigger immediate search for bounty filter
      void handleSearch();
    }
  }, [filter]);

  // Fetch issue counts in background with limited concurrency
  const backgroundLoadIssueCounts = async (repos: GitHubRepo[], selectedFilter: string) => {
    const concurrency = 3;
    let idx = 0;
    const runNext = async (): Promise<void> => {
      const i = idx++;
      if (i >= repos.length) return;
      const repo = repos[i] as GitHubRepo;
      const repoName = repo.full_name;
      try {
        if (computedIssueCounts[repoName]) {
          // already computed, skip
        } else {
          let count = 0;
          if (selectedFilter === 'major issue') {
            // major issue counts are derived client-side when viewing; skip counting here
            count = 0;
          } else if (selectedFilter === 'bounty issue') {
            const resp = await axios.get(`/api/get-labeled-issues`, {
              params: { repo: repoName, state: 'open', page: 1, perPage: 50, bountySignals: true },
            });
            count = (resp.data?.issues || []).length;
          } else {
            const resp = await axios.get(`/api/get-labeled-issues`, {
              params: {
                repo: repoName,
                labels: 'good first issue,good-first-issue,Good first issue,help wanted,help-wanted,beginner,beginner-friendly,easy,E-easy,newcomer,first-timers-only,up-for-grabs,low-hanging-fruit',
                state: 'open', page: 1, perPage: 50,
              },
            });
            count = (resp.data?.issues || []).length;
          }
          setIssueCounts(prev => ({ ...prev, [repoName]: count }));
          setComputedIssueCounts(prev => ({ ...prev, [repoName]: true }));
          // Update repositories list progressively; do NOT remove repos with zero issues
          setRepositories(prev =>
            prev.map(r =>
              r.full_name === repoName
                ? { ...r, issue_count: count, has_target_issues: count > 0 }
                : r
            )
          );
        }
      } catch {
        // ignore count errors in background
      } finally {
        await runNext();
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, repos.length) }, () => runNext()));
  };

  // Helper: detect and filter out issues with CJK (Chinese/Japanese/Korean) characters
  const isCJKText = (text?: string): boolean => {
    if (!text) return false;
    // Unified CJK, Hiragana, Katakana, Hangul ranges
    const cjkRegex = /[\u3400-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;
    return cjkRegex.test(text);
  };

  const filterOutCJKIssues = (list: GitHubIssue[]): GitHubIssue[] =>
    list.filter((issue) => !isCJKText(`${issue.title || ''} ${issue.body || ''}`));

  const fetchTrendingRepos = async (selectedFilter: string, selectedLanguage: string, pageNumber: number) => {
    try {
      setError(null);
      const key = `${selectedFilter}|${selectedLanguage}|${pageNumber}`;
      if (lastFetchKey.current === key) {
        // prevent duplicate fetches for the same page/query
        return;
      }
      lastFetchKey.current = key;
      
      // Fetch trending repositories with strict language and filter qualifiers
      const searchResponse = await axios.get('/api/search-trending-repos', {
        params: {
          filter: selectedFilter,
          language: selectedLanguage,
          page: pageNumber,
          per_page: 10,
        }
      });
      
      const items = (searchResponse.data.items || []) as GitHubRepo[];
      
      if (!items || items.length === 0) {
        if (pageNumber === 1) {
          setError('No repositories found matching your criteria. Try different filters.');
        }
        return;
      }
      // Use items directly to avoid per-repo blocking calls; seed with cached counts
      const seeded = items.map((r: GitHubRepo) => ({
        ...r,
        issue_count: issueCounts[r.full_name] ?? 0,
        has_target_issues: (issueCounts[r.full_name] ?? 0) > 0,
      }));
      
      const validRepos = seeded;
      
      // Honor API has_more when available; otherwise, approximate by page size
      const apiHasMore = Boolean(searchResponse.data.has_more);
      setHasMore(apiHasMore || validRepos.length === 10);
      
      // Update repositories based on page number (fast path, no blocking issue fetch)
      if (pageNumber === 1) {
        setRepositories(validRepos);
      } else {
        // Only add new repos that aren't already in the list (by id)
        const existingIds = new Set(repositories.map(repo => repo.id));
        const uniqueNewRepos = validRepos.filter(repo => !existingIds.has(repo.id));
        setRepositories(prevRepos => [...prevRepos, ...uniqueNewRepos]);
      }
      
      // Set total pages
      setTotalPages(Math.max(pageNumber, totalPages));
      
      if (validRepos.length === 0 && pageNumber === 1) {
        setError('No repositories found with actual issues matching your criteria. Try different filters.');
      }

      // Load issue counts for all repos before finishing, so UI shows loading until complete
      await backgroundLoadIssueCounts(items as GitHubRepo[], selectedFilter);
    } catch (err) {
      console.error('Error fetching trending repositories:', err);
      // Surface server-provided message when available
      let apiMsg: string | undefined;
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { error?: string; message?: string } | undefined;
        apiMsg = data?.error ?? data?.message;
      }
      setError(apiMsg ?? 'Failed to fetch trending repositories. Please try again later.');
    }
  };

  const fetchIssuesWithLabels = async (repoFullName: string, selectedFilter: string, pageNumber: number) => {
    const cacheKey = `${repoFullName}-${selectedFilter}`;
    
    // Check cache first
    if (issuesCache[cacheKey]) {
      setIssues(issuesCache[cacheKey]);
      setIssuesError(null);
      return;
    }
    
    try {
      setIssuesError(null);
      setIsLoadingIssues(true);
      
      // For major issues, we need to get all issues and filter out good first and bounty
      if (selectedFilter === 'major issue') {
        // Get all issues first
        const allIssuesResponse = await axios.get(`/api/get-labeled-issues`, {
          params: {
            repo: repoFullName,
            labels: '', // Get all issues
            state: 'open',
            page: pageNumber,
            perPage: 100
          }
        });
        
        // Then filter out good first and bounty issues
        const allIssues = allIssuesResponse.data.issues || [];
        const majorIssues = allIssues.filter((issue: GitHubIssue) => {
          const labels = issue.labels.map((label) => label.name.toLowerCase());
          const hasGoodFirst = labels.some(label => 
            label.includes('good first') || 
            label.includes('good-first') || 
            label.includes('beginner') || 
            label.includes('easy') || 
            label.includes('help wanted') ||
            label.includes('newcomer') ||
            label.includes('first-timers')
          );
          const hasBounty = labels.some(label => 
            label.includes('bounty') || 
            label.includes('hacktoberfest') || 
            label.includes('monetary') || 
            label.includes('reward') || 
            label.includes('prize')
          );
          return !hasGoodFirst && !hasBounty;
        });
        
        const filteredMajor = filterOutCJKIssues(majorIssues);
        if (filteredMajor.length > 0) {
          setIssues(filteredMajor);
          setIssuesCache(prev => ({ ...prev, [cacheKey]: filteredMajor }));
        } else {
          setIssuesError(`No major issues found in this repository.`);
          setIssues([]);
        }
        
      } else {
        if (selectedFilter === 'bounty issue') {
          const response = await axios.get(`/api/get-labeled-issues`, {
            params: {
              repo: repoFullName,
              state: 'open',
              page: pageNumber,
              perPage: 100,
              bountySignals: true,
            }
          });
          
          const filtered = filterOutCJKIssues(response.data.issues || []);
          if (filtered.length > 0) {
            setIssues(filtered);
            setIssuesCache(prev => ({ ...prev, [cacheKey]: filtered }));
          } else {
            setIssuesError(`No ${selectedFilter}s found in this repository.`);
            setIssues([]);
          }
        } else {
          // Convert filter to label format - use comprehensive label variations
          const labels = 'good first issue,good-first-issue,Good first issue,help wanted,help-wanted,beginner,beginner-friendly,easy,E-easy,newcomer,first-timers-only,up-for-grabs,low-hanging-fruit';
          const response = await axios.get(`/api/get-labeled-issues`, {
            params: {
              repo: repoFullName,
              labels: labels,
              state: 'open',
              page: pageNumber,
              perPage: 100
            }
          });
          
          const filtered = filterOutCJKIssues(response.data.issues || []);
          if (filtered.length > 0) {
            setIssues(filtered);
            setIssuesCache(prev => ({ ...prev, [cacheKey]: filtered }));
          } else {
            setIssuesError(`No ${selectedFilter}s found in this repository.`);
            setIssues([]);
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching ${selectedFilter}s:`, err);
      setIssuesError(`Failed to fetch ${selectedFilter}s. Please try again later.`);
      setIssues([]);
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleSearch = async () => {
    setPage(1);
    setRepositories([]);
    setIsLoading(true);
    setError(null);
    // Reset caches for a fresh query
    setIssueCounts({});
    setComputedIssueCounts({});
    // Reset loaded pages cache
    setPagesLoaded({ 1: false });

    // Timeout logic: show message after 3s, hide only when loading ends
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTimeoutMessage(false);
    timeoutRef.current = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 3000);

    await fetchTrendingRepos(filter, language, 1);
    setPagesLoaded(prev => ({ ...prev, 1: true }));

    setIsLoading(false);
    setShowTimeoutMessage(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Scroll to results after search completes
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || isLoadingMore) return;
    setPage(newPage);
    // If this page is not loaded yet and has more, fetch it; otherwise reuse cached items
    if (!pagesLoaded[newPage]) {
      setIsLoadingMore(true);
      await fetchTrendingRepos(filter, language, newPage);
      setIsLoadingMore(false);
      setPagesLoaded(prev => ({ ...prev, [newPage]: true }));
    }
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };
  
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    await fetchTrendingRepos(filter, language, nextPage);
    
    setPage(nextPage);
    setIsLoadingMore(false);
  };
  
  const openRepoDetails = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setShowRepoDetails(true);
  };
  
  const closeRepoDetails = () => {
    setShowRepoDetails(false);
    setTimeout(() => setSelectedRepo(null), 300); // Clear after animation
  };
  
  const viewRepoIssues = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setShowIssues(true);
    
    await fetchIssuesWithLabels(repo.full_name, filter, 1);
  };
  
  const explainIssue = async (issue: GitHubIssue) => {
    const cacheKey = `${selectedRepo?.full_name}-${issue.number}`;
    
    // Check cache first
    if (explanationCache[cacheKey]) {
      setExplanation(explanationCache[cacheKey]);
      setSelectedIssue(issue);
      setShowExplanation(true);
      return;
    }
    
    setIsLoadingExplanation(true);
    setSelectedIssue(issue);
    setShowExplanation(true);
    
    try {
      const response = await axios.post('/api/explain-issue', {
        issue: issue,
        repoName: selectedRepo?.full_name
      });
      
      if (response.data.success) {
        setExplanation(response.data.explanation);
        setExplanationCache(prev => ({ ...prev, [cacheKey]: response.data.explanation }));
      } else {
        setExplanation('Failed to generate explanation. Please try again.');
      }
    } catch (error) {
      console.error('Error explaining issue:', error);
      setExplanation('Failed to generate explanation. Please try again.');
    } finally {
      setIsLoadingExplanation(false);
    }
  };
  
  const closeIssues = () => {
    setShowIssues(false);
    setIssues([]);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Load initial data
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide header when dialogs are open
  useEffect(() => {
    if (showIssues || showExplanation) {
      document.body.classList.add('dialog-open');
    } else {
      document.body.classList.remove('dialog-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dialog-open');
    };
  }, [showIssues, showExplanation]);

  return (
    <div className="container mx-auto p-4 md:p-8 pt-24 md:pt-32">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/80 via-gray-900/60 to-black/80 pointer-events-none" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-60 pointer-events-none" />
      
      {/* Hide header when dialog or sheet is open */}
      {!(showIssues || showExplanation) && (
        <header className="text-center mt-24 md:mt-32 mb-8 md:mb-12">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              Find Open Source Issues
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-xl opacity-50 -z-10"></div>
          </div>
          <p className="mt-4 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Discover repositories with good first issues and bounties to contribute to open source.
          </p>
        </header>
      )}

      <main>
        {/* Filter Controls */}
        <div className="relative max-w-3xl mx-auto mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-black/30 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/20 group transition-all duration-300 hover:border-white/30 hover:bg-black/40 focus-within:border-white/40 focus-within:bg-black/50 animate-in fade-in slide-in-from-top-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            
            <div className="p-6 space-y-4">
              {/* Filter Type */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm">Filter Type</label>
                <div className="flex justify-center">
                  <div className="relative overflow-hidden rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-1 shadow-2xl shadow-black/20 flex">
                    <button
                      onClick={() => setFilter('good first issue')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${filter === 'good first issue' 
                        ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                        : 'text-white/60 hover:text-white/80'}`}
                    >
                      <Code className="w-4 h-4 inline-block mr-1" />
                      Good First Issue
                    </button>
                    <button
                      onClick={() => setFilter('major issue')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${filter === 'major issue' 
                        ? 'bg-white/10 text-white shadow-lg border border-white/20' 
                        : 'text-white/60 hover:text-white/80'}`}
                    >
                      <AlertCircle className="w-4 h-4 inline-block mr-1" />
                      Major Issue
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm">Language (Optional)</label>
                <Select value={language} onValueChange={(value) => setLanguage(value === 'any' ? '' : value)}>
                  <SelectTrigger className="w-full bg-black/30 text-white/90 border-white/20 rounded-lg backdrop-blur-xl hover:bg-black/40 hover:border-white/30 transition-all duration-300 shadow-sm">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 border-white/20 text-white/90 backdrop-blur-xl rounded-lg shadow-lg">
                    <SelectItem value="any" className="hover:bg-black/50 focus:bg-black/50">Any Language</SelectItem>
                    <SelectItem value="javascript" className="hover:bg-black/50 focus:bg-black/50">JavaScript</SelectItem>
                    <SelectItem value="typescript" className="hover:bg-black/50 focus:bg-black/50">TypeScript</SelectItem>
                    <SelectItem value="python" className="hover:bg-black/50 focus:bg-black/50">Python</SelectItem>
                    <SelectItem value="java" className="hover:bg-black/50 focus:bg-black/50">Java</SelectItem>
                    <SelectItem value="go" className="hover:bg-black/50 focus:bg-black/50">Go</SelectItem>
                    <SelectItem value="rust" className="hover:bg-black/50 focus:bg-black/50">Rust</SelectItem>
                    <SelectItem value="c#" className="hover:bg-black/50 focus:bg-black/50">C#</SelectItem>
                    <SelectItem value="php" className="hover:bg-black/50 focus:bg-black/50">PHP</SelectItem>
                    <SelectItem value="ruby" className="hover:bg-black/50 focus:bg-black/50">Ruby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="w-full bg-black/50 hover:bg-black/70 text-white/90 font-medium border border-white/20 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm backdrop-blur-xl px-8 hover:scale-105 active:scale-95"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Repositories
              </Button>
            </div>
            
            {/* Animated glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="my-12 animate-in fade-in duration-300">
            <LiquidLoader text="Finding repositories with real issues" size="lg" />
            {showTimeoutMessage && (
              <div className="mt-6 text-center text-amber-300 text-base font-medium animate-pulse bg-black/40 border border-amber-500/20 rounded-xl px-6 py-3 max-w-lg mx-auto shadow-lg backdrop-blur-xl">
                Please wait, It may take some moment
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
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
        {!isLoading && !isLoadingMore && sortedRepositories.length === 0 && (
          <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-8 text-center shadow-lg my-8 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-golden-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-golden-500/0 blur-xl opacity-30 -z-10"></div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shadow-inner">
              <Search className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-xl font-medium text-white/90 mb-2">No repositories found</h3>
            <p className="text-white/70 max-w-md mx-auto">
              We couldn&apos;t find any repositories matching your search. Try using different filters.
            </p>
          </div>
        )}

        {/* Repository Results Table */}
        {sortedRepositories.length > 0 && (
          <div ref={resultsRef} id="results-container" className="w-full overflow-x-auto">
            <RepositoryTable 
              repositories={sortedRepositories}
              onViewDetails={(repo) => {
                viewRepoIssues(repo);
              }}
              actionButtonText={`View ${filter}s`}
              showIssueCount={true}
              filterType={filter}
            />
          </div>
        )}

        {/* Loading Indicator for Load More */}
        {(!isLoading && isLoadingMore) && (
          <div className="py-8">
            <LiquidLoader text="Loading more" size="md" />
          </div>
        )}

        {/* Load More Button */}
        {sortedRepositories.length > 0 && hasMore && !isLoading && !isLoadingMore && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleLoadMore}
              className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm px-6 py-2 rounded-xl"
            >
              Load More Repositories
            </Button>
          </div>
        )}

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

        {/* Issues Dialog */}
        <Dialog open={showIssues} onOpenChange={setShowIssues}>
        <DialogContent 
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white/90 w-full sm:w-[95vw] sm:max-w-6xl h-[98vh] sm:h-[95vh] shadow-2xl shadow-black/20 p-0 sm:p-0 rounded-none sm:rounded-2xl overflow-hidden"
          style={{ zIndex: 'var(--z-dialog, 10000)' }}
        >
            {/* Accessible title for screen readers */}
            <DialogTitle className="sr-only">
              {selectedRepo ? `Issues for ${selectedRepo.full_name}` : 'Repository Issues'}
            </DialogTitle>

            {/* Liquid glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-50 -z-10"></div>
            
            {/* Mobile Close Button */}
            <button
              onClick={() => setShowIssues(false)}
              className="absolute top-4 right-4 z-20 sm:hidden bg-black/50 backdrop-blur-xl border border-white/20 rounded-full p-2 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Full height content container */}
            <div className="flex flex-col h-full max-h-[98vh] sm:max-h-[95vh]">
              {/* Header - fixed at top */}
              {selectedRepo && (
                <div className="flex-shrink-0 p-4 sm:p-6 pb-4">
                  <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4 shadow-sm relative overflow-hidden group hover:bg-black/40 hover:border-white/20 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-start gap-2 flex-wrap pr-8 sm:pr-0">
                      <span className="break-all text-sm sm:text-base md:text-lg overflow-wrap-anywhere" style={{ wordBreak: 'break-word' }}>{selectedRepo.full_name}</span>
                      <a 
                        href={selectedRepo.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white/80 hover:text-white ml-2 inline-flex items-center flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                      </a>
                    </div>
                    <div className="text-white/70 text-sm sm:text-base mt-2 break-words overflow-wrap-anywhere" style={{ wordBreak: 'break-word' }}>
                      {selectedRepo.description || 'No description available'}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scrollable content area - takes remaining height */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 scrollbar-none">
                <style jsx>{`
                  .scrollbar-none {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  }
                  .scrollbar-none::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="space-y-4 pb-6">
                  {/* Issues Loading */}
                  {isLoadingIssues && (
                    <div className="py-12">
                      <LiquidLoader text="Loading issues" size="md" />
                    </div>
                  )}
                  
                  {/* Issues Error */}
                  {issuesError && !isLoadingIssues && (
                    <div className="my-8 overflow-hidden rounded-xl bg-black/30 backdrop-blur-xl border border-red-500/30 p-6 shadow-lg relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 blur-xl opacity-30 -z-10"></div>
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-full p-1.5 shadow-sm">
                          <X className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-lg font-medium text-red-400">No Issues Found</h3>
                          <p className="mt-1 text-white/70">{issuesError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Issues List */}
                  {!isLoadingIssues && !issuesError && issues.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-medium text-white/90 flex items-center gap-2">
                          <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                          {filter === 'good first issue' ? 'Good First Issues' : 
                           filter === 'bounty issue' ? 'Bounty Issues' : 'Major Issues'}
                        </h3>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
                          {issues.length} {filter === 'good first issue' ? 'Good First Issues' : 
                                         filter === 'bounty issue' ? 'Bounty Issues' : 'Major Issues'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        {issues.map(issue => (
                          <div 
                            key={issue.id}
                            className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-3 sm:p-4 shadow-sm hover:bg-black/40 hover:border-white/20 transition-all duration-300 relative overflow-hidden group"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <h4 className="text-white/90 text-sm sm:text-base font-medium hover:text-white transition-colors break-words leading-tight">
                                    <a 
                                      href={issue.html_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-start gap-1"
                                    >
                                      {issue.title}
                                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 inline-block mt-0.5 flex-shrink-0" />
                                    </a>
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white/50 text-xs sm:text-sm">#{issue.number}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => explainIssue(issue)}
                                      className="bg-amber-500/20 border-amber-400/30 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400/50 hover:text-amber-200 text-xs px-2 py-1 h-auto"
                                    >
                                      Explain
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {issue.labels.map((label) => (
                                    <Badge 
                                      key={label.id} 
                                      style={{ backgroundColor: `#${label.color}`, color: parseInt(label.color, 16) > 0x888888 ? '#000' : '#fff' }}
                                      className="text-xs"
                                    >
                                      {label.name}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="flex flex-wrap items-center mt-3 text-xs text-white/60 gap-2 sm:gap-4">
                                  <div className="flex items-center">
                                    <Image 
                                      src={issue.user.avatar_url} 
                                      alt={issue.user.login}
                                      width={16}
                                      height={16}
                                      className="rounded-full mr-1"
                                    />
                                    <span>{issue.user.login}</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    <span>{formatDate(issue.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* View on GitHub button */}
                  {selectedRepo && (
                    <div className="flex justify-end mt-6">
                      <Button 
                        variant="outline" 
                        className="bg-white/5 border-white/20 hover:bg-white/10"
                        onClick={() => window.open(selectedRepo.html_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on GitHub
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Explanation Sheet */}
      <Sheet open={showExplanation} onOpenChange={setShowExplanation}>
        <SheetContent 
          className="w-full sm:w-[1200px] xl:w-[40vw] max-w-full sm:max-w-screen-2xl bg-black/90 backdrop-blur-xl border-white/20 text-white overflow-hidden flex flex-col h-[98vh] sm:h-full px-4 sm:px-8 xl:px-12 rounded-none sm:rounded-2xl"
          style={{ zIndex: 'var(--z-sheet, 10000)' }}
        >
          {/* Liquid Glass Close Button (all devices) */}
          <button
            onClick={() => setShowExplanation(false)}
                            className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-white/10 via-amber-500/10 to-golden-500/10 backdrop-blur-xl border border-white/20 rounded-full shadow-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300"
            style={{
              boxShadow: '0 4px 24px 0 rgba(80, 0, 160, 0.12)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              backdropFilter: 'blur(16px) saturate(180%)',
            }}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white/80 drop-shadow" />
            <span className="sr-only">Close</span>
                            <span className="absolute inset-0 pointer-events-none rounded-full bg-gradient-to-tr from-white/20 via-amber-400/10 to-golden-400/10 opacity-30 animate-pulse" />
          </button>
          
          <SheetHeader className="border-b border-white/10 pb-4 mb-4 sm:mb-6 flex-shrink-0 pt-12 sm:pt-8 lg:pt-12">
            <SheetTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 pr-8 sm:pr-0">
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
              <span className="break-words">Issue Explanation</span>
            </SheetTitle>
            {selectedIssue && (
              <SheetDescription className="text-white/70 text-left">
                <div className="flex items-start gap-2 mt-2">
                  <span className="font-medium flex-shrink-0">#{selectedIssue.number}:</span>
                  <span className="break-words overflow-wrap-anywhere">{selectedIssue.title}</span>
                </div>
                <a 
                  href={selectedIssue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-amber-400 hover:text-amber-300 text-sm"
                >
                  View on GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 sm:pr-4 scrollbar-hidden">
            <style jsx>{`
              .scrollbar-hidden {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .scrollbar-hidden::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="space-y-4">
              {isLoadingExplanation ? (
                <div className="py-8">
                  <LiquidLoader text="Generating explanation" size="md" />
                </div>
              ) : explanation ? (
                <div className="prose prose-invert max-w-none xl:max-w-[1100px] 2xl:max-w-[1300px] mx-auto px-0 sm:px-6 xl:px-0">
                  <div 
                    className="text-white/90 text-sm sm:text-base xl:text-lg leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    dangerouslySetInnerHTML={{ 
                      __html: explanation.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold break-words">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="text-white/80 italic break-words">$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-amber-300 font-mono text-xs break-all">$1</code>')
                        .replace(/###\s(.*?)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-3 border-b border-white/10 pb-2 break-words">$1</h3>')
                        .replace(/##\s(.*?)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
                        .replace(/^\d+\.\s/gm, '<span class="text-amber-400 font-medium">•</span> ')
                        .replace(/^\-\s/gm, '<span class="text-white/60">→</span> ')
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-white/70">
                  Failed to generate explanation. Please try again.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}