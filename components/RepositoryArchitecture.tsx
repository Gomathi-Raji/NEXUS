/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import './RepositoryIssuesScrollbar.css';
import { Workflow, AlertCircle, FolderTree, FileCode2, Database, Server, Layout, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  extension?: string;
}

interface RepositoryArchitectureProps {
  repoFullName: string;
  onSelectFile?: (file: FileNode) => void;
}

interface CategoryCount {
  components: number;
  pages: number;
  apis: number;
  models: number;
  utils: number;
  configs: number;
  other: number;
}

function categorizeFile(path: string): keyof CategoryCount {
  const lowerPath = path.toLowerCase();
  
  if (lowerPath.includes('component') || lowerPath.includes('/ui/') || lowerPath.includes('/components/')) {
    return 'components';
  } else if (lowerPath.includes('/pages/') || lowerPath.includes('/page.') || lowerPath.includes('/views/')) {
    return 'pages';
  } else if (lowerPath.includes('/api/') || lowerPath.includes('controller') || lowerPath.includes('route.') || lowerPath.includes('endpoint')) {
    return 'apis';
  } else if (lowerPath.includes('model') || lowerPath.includes('schema') || lowerPath.includes('entity') || lowerPath.includes('type') || lowerPath.includes('interface')) {
    return 'models';
  } else if (lowerPath.includes('util') || lowerPath.includes('helper') || lowerPath.includes('service') || lowerPath.includes('lib')) {
    return 'utils';
  } else if (lowerPath.includes('config') || lowerPath.includes('.json') || lowerPath.includes('.yml') || lowerPath.includes('.env') || lowerPath.includes('.rc')) {
    return 'configs';
  } else {
    return 'other';
  }
}

function countFileCategories(files: FileNode[]): CategoryCount {
  const counts: CategoryCount = {
    components: 0,
    pages: 0,
    apis: 0,
    models: 0,
    utils: 0,
    configs: 0,
    other: 0
  };
  
  function traverseTree(node: FileNode) {
    if (node.type === 'file') {
      const category = categorizeFile(node.path);
      counts[category]++;
    } else if (node.children) {
      node.children.forEach(traverseTree);
    }
  }
  
  files.forEach(traverseTree);
  return counts;
}

function getFileIcon(extension: string | undefined) {
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileCode2 className="w-4 h-4 text-green-400" />;
    case 'md':
      return <FileCode2 className="w-4 h-4 text-blue-400" />;
    case 'css':
    case 'scss':
    case 'sass':
      return <Layout className="w-4 h-4 text-purple-400" />;
    case 'html':
      return <Layout className="w-4 h-4 text-orange-400" />;
    case 'yml':
    case 'yaml':
      return <Settings className="w-4 h-4 text-gray-400" />;
    default:
      return <FileCode2 className="w-4 h-4 text-gray-400" />;
  }
}

function FileTree({ node, level = 0, onSelectFile }: { 
  node: FileNode; 
  level?: number; 
  onSelectFile?: (file: FileNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && node.children.length > 0;
  
  const extension = node.name.split('.').pop();
  const category = node.type === 'file' ? categorizeFile(node.path) : null;
  
  return (
    <div className="animate-in fade-in slide-in-from-left-1 duration-300" style={{ animationDelay: `${level * 50}ms` }}>
      <div 
        className={`flex items-center py-1 px-2 rounded-md ${!isDirectory ? 'hover:bg-white/10 cursor-pointer' : ''} transition-colors duration-200`}
        onClick={() => {
          if (isDirectory && hasChildren) {
            setIsOpen(!isOpen);
          } else if (!isDirectory && onSelectFile) {
            onSelectFile(node);
          }
        }}
      >
        <div className="mr-1">
          {isDirectory ? (
            isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <path d="m9 6 6 6-6 6"/>
              </svg>
            )
          ) : getFileIcon(extension)}
        </div>
        <span className={`text-sm ${isDirectory ? 'font-medium text-white' : 'text-white/80'}`}>
          {node.name}
        </span>
        
        {!isDirectory && category && (
          <Badge 
            variant="outline" 
            className="ml-2 text-[10px] py-0 h-4 bg-white/5 border-white/10"
          >
            {category}
          </Badge>
        )}
      </div>
      
      {isOpen && hasChildren && (
        <div className="ml-4 pl-2 border-l border-white/10">
          {node.children!.map((child, index) => (
            <FileTree 
              key={index} 
              node={child} 
              level={level + 1} 
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepositoryArchitecture({ repoFullName, onSelectFile }: RepositoryArchitectureProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount | null>(null);
  const [repoDetails, setRepoDetails] = useState<unknown>(null);
  const [languages, setLanguages] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const fetchRepoStructure = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/get-repo-structure?repo=${repoFullName}`);
        const data = await response.json();
        
        if (response.ok) {
          setFileTree(data.tree || []);
          setRepoDetails(data.details || null);
          setLanguages(data.languages || {});
          
          // Calculate category counts
          if (data.tree) {
            setCategoryCounts(countFileCategories(data.tree));
          }
        } else {
          setError(data.error || 'Failed to fetch repository structure');
        }
      } catch (err) {
        console.error('Error fetching repo structure:', err);
        setError('An error occurred while fetching the repository structure');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (repoFullName) {
      fetchRepoStructure();
    }
  }, [repoFullName]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="text-center">
          <Workflow className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading repository structure...</p>
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
            <h3 className="text-red-500 font-medium">Error Loading Repository Structure</h3>
            <p className="text-white/70 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {categoryCounts && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-medium">UI Components</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.components}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium">Pages/Views</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.pages}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-medium">API Endpoints</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.apis}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-medium">Data Models</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.models}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-medium">Utilities</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.utils}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              <h3 className="text-white font-medium">Configurations</h3>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{categoryCounts.configs}</p>
          </div>
        </div>
      )}
      
      {languages && Object.keys(languages).length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(languages)
              .sort(([, a], [, b]) => b - a)
              .map(([language, bytes]) => {
                const totalBytes = Object.values(languages).reduce((sum, val) => sum + val, 0);
                const percentage = Math.round((bytes / totalBytes) * 100);
                return (
                  <Badge 
                    key={language} 
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    {language}: {percentage}%
                  </Badge>
                );
              })}
          </div>
        </div>
      )}
      
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-indigo-400" />
          File Structure
        </h3>
        <div className="max-h-[500px] overflow-y-auto pr-2 hide-native-scrollbar">
          {fileTree.map((node, index) => (
            <FileTree 
              key={index} 
              node={node} 
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      </div>
    </div>
  );
}