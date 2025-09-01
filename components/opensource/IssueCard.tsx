'use client';

import React from 'react';
import { GitHubIssue } from '@/lib/github';
import { 
  Star, 
  MessageCircle, 
  Calendar,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface IssueCardProps {
  issue: GitHubIssue;
  isSaved: boolean;
  onSave: () => void;
  repository?: {
    owner: {
      login: string;
      avatar_url: string;
    };
    name: string;
    full_name: string;
    description?: string;
    stargazers_count: number;
    language?: string;
  };
}

export function IssueCard({ issue, isSaved, onSave, repository }: IssueCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getLanguageColor = (language: string | null) => {
    if (!language) return 'bg-gray-500/20 text-gray-300';
    
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500/20 text-yellow-300',
      'TypeScript': 'bg-blue-500/20 text-blue-300',
      'Python': 'bg-green-500/20 text-green-300',
      'Java': 'bg-orange-500/20 text-orange-300',
      'Go': 'bg-cyan-500/20 text-cyan-300',
      'Rust': 'bg-orange-600/20 text-orange-300',
      'C++': 'bg-blue-600/20 text-blue-300',
      'C#': 'bg-purple-500/20 text-purple-300',
      'Ruby': 'bg-red-500/20 text-red-300',
      'PHP': 'bg-indigo-500/20 text-indigo-300',
      'Swift': 'bg-orange-500/20 text-orange-300',
      'Kotlin': 'bg-purple-600/20 text-purple-300',
    };
    
    return colors[language] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <Card className="bg-black/30 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300 group overflow-hidden">
      {/* Repository Header */}
      {repository && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={repository.owner.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                  {repository.owner.login[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                  {repository.owner.login} / {repository.name}
                </h3>
                <div className="flex items-center space-x-3 text-xs text-white/60">
                  <div className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-yellow-400" />
                    {repository.stargazers_count.toLocaleString()}
                  </div>
                  {repository.language && (
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1.5 ${getLanguageColor(repository.language).split(' ')[0]}`} />
                      {repository.language}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-blue-400" />
                    {formatDate(issue.updated_at)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={onSave}
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10 p-1"
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </Button>
              <Badge className={getDifficultyColor()} variant="outline">
                good first issue
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Issue Content */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-white text-lg font-semibold mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors">
            #{issue.number} {issue.title}
          </h4>
          {repository?.description && (
            <p className="text-white/60 text-sm line-clamp-2">
              {repository.description}
            </p>
          )}
        </div>

        {/* Labels */}
        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {issue.labels.slice(0, 5).map((label: { id: number; name: string; color: string }, index: number) => (
              <Badge 
                key={label.id || index} 
                variant="outline" 
                className="bg-white/5 border-white/20 text-white/70 text-xs px-2 py-0.5"
                style={{ backgroundColor: `#${label.color}20`, borderColor: `#${label.color}40` }}
              >
                {label.name}
              </Badge>
            ))}
            {issue.labels.length > 5 && (
              <Badge variant="outline" className="bg-white/5 border-white/20 text-white/50 text-xs px-2 py-0.5">
                +{issue.labels.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Issue Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-white/60">
            <div className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              {issue.comments}
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(issue.created_at)}
            </div>
          </div>

          <Button
            onClick={() => window.open(issue.html_url, '_blank')}
            size="sm"
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 text-xs px-3 py-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Issue
          </Button>
        </div>
      </div>
    </Card>
  );
}