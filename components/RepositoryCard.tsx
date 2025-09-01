/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitHubRepo, RepoAnalysis, RepoContent } from '@/lib/github';
import { Star, GitFork, Calendar, User, ExternalLink, Code, FileText, Folder, File, Eye, BarChart2 } from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';
import Link from 'next/link';

// Import React Markdown with proper fallback
import { default as ReactMarkdown } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RepositoryCardProps {
  repo: GitHubRepo;
  analysis?: RepoAnalysis;
  onAnalyze?: (repo: GitHubRepo) => void;
  isAnalyzing?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

// Types for markdown components
interface MarkdownComponentProps {
  children?: React.ReactNode;
}

interface CodeComponentProps extends MarkdownComponentProps {
  inline?: boolean;
}

interface LinkComponentProps extends MarkdownComponentProps {
  href?: string;
}

// Simple markdown renderer fallback if react-markdown fails
const MarkdownRenderer = ({ content }: { content: string }) => {
  try {
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        className="prose prose-invert prose-sm max-w-none"
        components={{
          h1: ({ children }: MarkdownComponentProps) => (
            <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>
          ),
          h2: ({ children }: MarkdownComponentProps) => (
            <h2 className="text-xl font-semibold text-white mb-3">{children}</h2>
          ),
          h3: ({ children }: MarkdownComponentProps) => (
            <h3 className="text-lg font-medium text-white mb-2">{children}</h3>
          ),
          p: ({ children }: MarkdownComponentProps) => (
            <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>
          ),
          code: ({ inline, children }: CodeComponentProps) => 
            inline ? (
              <code className="bg-gray-700 px-1 py-0.5 rounded text-sm text-blue-300">
                {children}
              </code>
            ) : (
              <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto">
                <code className="text-green-300 text-sm">{children}</code>
              </pre>
            ),
          ul: ({ children }: MarkdownComponentProps) => (
            <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }: MarkdownComponentProps) => (
            <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }: MarkdownComponentProps) => (
            <li className="text-gray-300">{children}</li>
          ),
          a: ({ href, children }: LinkComponentProps) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }: MarkdownComponentProps) => (
            <blockquote className="border-l-4 border-gray-600 pl-4 text-gray-400 italic mb-3">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  } catch (error) {
    // Fallback to simple text rendering if ReactMarkdown fails
    return (
      <div className="text-gray-300 whitespace-pre-wrap">
        {content}
      </div>
    );
  }
};

const FileTree = ({ files }: { files: RepoContent[] }) => (
  <ul className="space-y-2 font-mono text-sm">
    {files.map(file => (
      <li key={file.path} className="flex items-center gap-2 text-white/80 p-2 rounded-lg hover:bg-white/5 transition-colors">
        {file.type === 'dir' ? (
          <Folder className="w-4 h-4 text-indigo-400" />
        ) : (
          <File className="w-4 h-4 text-cyan-400" />
        )}
        <span>{file.name}</span>
        {file.size && file.type === 'file' && (
          <span className="text-xs text-white/50 ml-auto bg-white/10 px-2 py-0.5 rounded-full">
            {(file.size / 1024).toFixed(1)}KB
          </span>
        )}
      </li>
    ))}
  </ul>
);

const OverviewTab = ({ repo, analysis }: { repo: GitHubRepo; analysis: RepoAnalysis }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-md transition-all duration-300 hover:bg-white/10 hover:border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <Star className="w-4 h-4 text-yellow-400 mr-2" />
          Repository Stats
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Stars:</span>
            <span className="text-white font-medium">{formatNumber(repo.stargazers_count)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Forks:</span>
            <span className="text-white font-medium">{formatNumber(repo.forks_count)}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Language:</span>
            <span className="text-white font-medium">{repo.language || 'Not specified'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-white/60">Size:</span>
            <span className="text-white font-medium">{(repo.size / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-md transition-all duration-300 hover:bg-white/10 hover:border-white/20">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <Code className="w-4 h-4 text-indigo-400 mr-2" />
          Analysis Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Total Files:</span>
            <span className="text-white font-medium">{analysis.fileStructure.length}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Has Package.json:</span>
            <span className="text-white font-medium">{analysis.packageJson ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-white/10">
            <span className="text-white/60">Dependencies:</span>
            <span className="text-white font-medium">
              {analysis.packageJson?.dependencies ? Object.keys(analysis.packageJson.dependencies).length : 0}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-white/60">Has README:</span>
            <span className="text-white font-medium">{analysis.readme ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repo, analysis, onAnalyze, isAnalyzing }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const generateDependencyGraph = (dependencies: Record<string, string>) => {
    const depKeys = Object.keys(dependencies);
    if (depKeys.length === 0) {
      return 'graph TD\n    A[No dependencies found]';
    }
    
    const sanitizedRepoName = repo.name.replace(/[^a-zA-Z0-9]/g, '_');
    let graph = `graph TD\n    ${sanitizedRepoName}[${repo.name}] --> Dependencies{Dependencies}\n`;
    
    depKeys.slice(0, 10).forEach(dep => {
      const sanitizedDep = dep.replace(/[^a-zA-Z0-9]/g, '_');
      graph += `    Dependencies --> ${sanitizedDep}[${dep}]\n`;
    });
    
    if (depKeys.length > 10) {
      graph += `    Dependencies --> More[+${depKeys.length - 10} more...]`;
    }
    
    return graph;
  };

  return (
    <Card className="w-full bg-black/30 backdrop-blur-xl border border-white/20 hover:bg-black/40 hover:border-white/30 transition-all duration-300 shadow-lg shadow-black/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-white mb-2">
              <a 
                href={repo.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                {repo.name}
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardTitle>
            <p className="text-white/80 text-sm mb-3">{repo.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                {formatNumber(repo.stargazers_count)}
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="w-4 h-4 text-indigo-400" />
                {formatNumber(repo.forks_count)}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Updated {formatDate(repo.updated_at)}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 text-purple-400" />
                {repo.owner.login}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {repo.language && (
              <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {repo.language}
              </Badge>
            )}
            {!analysis && (
              <Button 
                onClick={() => onAnalyze?.(repo)} 
                disabled={isAnalyzing} 
                size="sm" 
                className="bg-gradient-to-br from-indigo-600/80 to-purple-600/80 hover:from-indigo-600/90 hover:to-purple-600/90 text-white border-0 shadow-lg"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            )}
          </div>
        </div>

        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {repo.topics.slice(0, 6).map((topic) => (
              <Badge 
                key={topic} 
                variant="outline" 
                className="text-xs border-white/20 text-white/80 bg-white/5 backdrop-blur-sm"
              >
                {topic}
              </Badge>
            ))}
            {repo.topics.length > 6 && (
              <Badge 
                variant="outline" 
                className="text-xs border-white/20 text-white/80 bg-white/5 backdrop-blur-sm"
              >
                +{repo.topics.length - 6} more
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      {/* Animated glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500 -z-10"></div>

      {analysis && (
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              <TabsTrigger 
                value="overview" 
                className="text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="architecture" 
                className="text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Architecture
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="readme" 
                className="text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
              >
                README
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg shadow-black/20 overflow-hidden">
                <OverviewTab repo={repo} analysis={analysis} />
              </div>
            </TabsContent>

            <TabsContent value="architecture" className="mt-4">
              <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg shadow-black/20 overflow-hidden">
                <MermaidDiagram 
                  chart={
                    analysis.packageJson?.dependencies
                      ? generateDependencyGraph(analysis.packageJson.dependencies as Record<string, string>)
                      : 'graph TD\n    A[No dependency info found]'
                  } 
                  title="Dependency Graph" 
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg shadow-black/20 max-h-80 overflow-y-auto">
                <FileTree files={analysis.fileStructure} />
              </div>
            </TabsContent>

            <TabsContent value="readme" className="mt-4">
              <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-lg shadow-black/20 max-h-96 overflow-y-auto">
                {analysis.readme ? (
                  <MarkdownRenderer content={analysis.readme} />
                ) : (
                  <p className="text-white/60">No README found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-sm text-white/60">
          {repo.language && <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 bg-indigo-500/10">{repo.language}</Badge>}
          <span>Updated {formatDate(repo.updated_at)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/visualize?repo=${repo.full_name}`} passHref>
            <Button variant="outline" size="sm" className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm">
              <Eye className="w-4 h-4 mr-2 text-purple-400" />
              Visualize
            </Button>
          </Link>
          <Link href={`/analyze?repo=${repo.full_name}`} passHref>
            <Button variant="outline" size="sm" className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm">
              <BarChart2 className="w-4 h-4 mr-2 text-cyan-400" />
              Analyze
            </Button>
          </Link>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="bg-black/30 backdrop-blur-xl border border-white/20 text-white/80 hover:bg-black/40 hover:border-white/30 hover:text-white transition-all duration-300 shadow-sm">
              <ExternalLink className="w-4 h-4 mr-2 text-indigo-400" />
              GitHub
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
};

export default RepositoryCard;