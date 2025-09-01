/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import './RepositoryIssuesScrollbar.css';
import axios from 'axios';
import { GitHubIssue as OriginalGitHubIssue } from '@/lib/github';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageSquare, Clock, ExternalLink, User, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


// Extend GitHubIssue to include assignees
interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

interface GitHubIssue extends OriginalGitHubIssue {
  assignees?: GitHubUser[];
}

interface RepositoryIssuesProps {
  repoFullName: string;
}

export function RepositoryIssues({ repoFullName }: RepositoryIssuesProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<'open' | 'closed' | 'all'>('open');
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  
  // Use a global cache on window to persist across remounts/tab switches
  const getIssuesCache = (): {
    [key: string]: {
      [state: string]: GitHubIssue[]
    }
  } => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).__issuesCache) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__issuesCache = {};
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__issuesCache;
    }
    // SSR fallback (shouldn't happen for this component)
    return {};
  };

  useEffect(() => {
    const fetchIssues = async () => {
      // Check if we already have cached issues for this repo and state
      const cache = getIssuesCache();
      if (cache[repoFullName]?.[activeState]) {
        setIssues(cache[repoFullName][activeState]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get('/api/get-repo-issues', {
          params: {
            repo: repoFullName,
            state: activeState
          }
        });
        
        const fetchedIssues = response.data.issues;
        setIssues(fetchedIssues);
        
        // Cache the fetched issues using the ref
        const cache = getIssuesCache();
        cache[repoFullName] = {
          ...cache[repoFullName],
          [activeState]: fetchedIssues
        };
      } catch (err) {
        console.error('Error fetching issues:', err);
        setError('Failed to load repository issues');
      } finally {
        setLoading(false);
      }
    };
    
    if (repoFullName) {
      fetchIssues();
    }
  }, [repoFullName, activeState]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getColorForLabel = (color: string) => {
    // Convert hex color to RGB
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // Calculate brightness (simple formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return text color based on brightness
    return brightness > 128 ? 'text-black' : 'text-white';
  };

  return (
    <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden shadow-lg relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <div className="p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-400" />
          Repository Issues
        </h3>
        
        <div className="flex space-x-2 mb-4">
          <Button 
            variant={activeState === 'open' ? 'default' : 'outline'}
            size="sm"
            className={activeState === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-black/20 border-white/20 hover:bg-white/10'}
            onClick={() => setActiveState('open')}
          >
            Open
          </Button>
          <Button 
            variant={activeState === 'closed' ? 'default' : 'outline'}
            size="sm"
            className={activeState === 'closed' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-black/20 border-white/20 hover:bg-white/10'}
            onClick={() => setActiveState('closed')}
          >
            Closed
          </Button>
          <Button 
            variant={activeState === 'all' ? 'default' : 'outline'}
            size="sm"
            className={activeState === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black/20 border-white/20 hover:bg-white/10'}
            onClick={() => setActiveState('all')}
          >
            All
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-white/80">{error}</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">No {activeState} issues found</h3>
            <p className="text-white/60 max-w-md mx-auto">
              This repository doesn&apos;t have any {activeState} issues at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div 
                key={issue.id} 
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-300 animate-in fade-in slide-in-from-right-5 cursor-pointer"
                onClick={() => {
                  setSelectedIssue(issue);
                  setIsIssueDialogOpen(true);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {issue.state === 'open' ? (
                      <AlertCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white/90 text-sm font-medium truncate hover:text-white transition-colors">
                        <a 
                          href={issue.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {issue.title}
                          <ExternalLink className="w-3 h-3 inline-block ml-1" />
                        </a>
                      </h4>
                      <span className="text-white/50 text-xs">#{issue.number}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {issue.labels.map((label) => (
                        <Badge 
                          key={label.id} 
                          style={{ backgroundColor: `#${label.color}` }}
                          className={`text-xs ${getColorForLabel(label.color)}`}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center mt-3 text-xs text-white/60 space-x-4">
                      <div className="flex items-center">
                        <img 
                          src={issue.user.avatar_url} 
                          alt={issue.user.login}
                          className="w-4 h-4 rounded-full mr-1"
                        />
                        <span>{issue.user.login}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDate(issue.created_at)}</span>
                      </div>
                      
                      {issue.comments > 0 && (
                        <div className="flex items-center">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          <span>{issue.comments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Issue Details Dialog */}
      {selectedIssue && (
        <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
          <DialogContent className="max-w-3xl w-full bg-black/60 backdrop-blur-xl border border-white/20 text-white/90 max-h-[90vh] shadow-2xl shadow-black/20 z-50 overflow-hidden fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 p-0 flex flex-col">
            {/* Liquid glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-50 -z-10"></div>
            
            <DialogHeader className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-sm relative overflow-hidden group hover:bg-black/40 hover:border-white/20 transition-all duration-300 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <DialogTitle className="text-xl font-medium text-white flex items-center gap-2 flex-wrap">
                <AlertCircle className={`w-5 h-5 ${selectedIssue.state === 'open' ? 'text-green-400' : 'text-purple-400'}`} />
                <span className="break-all">{selectedIssue.title}</span>
                <Badge variant="outline" className="ml-auto text-xs bg-white/10">
                  #{selectedIssue.number}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            {/* Scrollable content area */}
            <div className="overflow-y-auto hide-native-scrollbar px-4 py-2 flex-grow">
              <div className="space-y-4 mb-16"> {/* Add bottom margin for button space */}
                {/* Issue metadata */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-white/80">Created by:</span>
                      <a 
                        href={selectedIssue.user.html_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        {selectedIssue.user.login}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-white/80">Created:</span>
                      <span>{formatDate(selectedIssue.created_at)}</span>
                    </div>
                    
                    {selectedIssue.assignees && selectedIssue.assignees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-400" />
                        <span className="text-white/80">Assigned to:</span>
                        <div className="flex items-center gap-1">
                          {selectedIssue.assignees.map((assignee: GitHubUser) => (
                            <a 
                              key={assignee.id}
                              href={assignee.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:underline flex items-center gap-1"
                            >
                              {assignee.login}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Labels */}
                {selectedIssue.labels && selectedIssue.labels.length > 0 && (
                  <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIssue.labels.map((label) => (
                        <Badge 
                          key={label.id} 
                          style={{ backgroundColor: `#${label.color}` }}
                          className={`text-xs ${getColorForLabel(label.color)}`}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Issue body */}
                <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                  <h4 className="text-white/80 text-sm font-medium mb-2">Description</h4>
                  <div className="text-white/70 prose prose-invert prose-sm max-w-none">
                    {selectedIssue.body ? (
                      <div className="whitespace-pre-wrap">{selectedIssue.body}</div>
                    ) : (
                      <p className="text-white/50 italic">No description provided.</p>
                    )}
                  </div>
                </div>
                
                {/* Comments count */}
                {selectedIssue.comments > 0 && (
                  <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span className="text-white/80">{selectedIssue.comments} comments on this issue</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* View on GitHub button - fixed at bottom */}
            <div className="flex justify-end p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl z-10 flex-shrink-0 mt-auto">
              <Button 
                variant="outline" 
                className="bg-white/5 border-white/20 hover:bg-white/10"
                onClick={() => window.open(selectedIssue.html_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}