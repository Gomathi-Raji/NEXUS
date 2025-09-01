/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import './RepositoryIssuesScrollbar.css';
import './RepositoryKeyFilesScrollbar.css';

import { Loader2, FileCode, GitCommit, Star, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileCode2, FileJson, FileText, Layout, Globe, Settings } from 'lucide-react';

function getFileIcon(filePath: string) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-green-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'css':
    case 'scss':
    case 'sass':
      return <Layout className="w-4 h-4 text-purple-400" />;
    case 'html':
      return <Globe className="w-4 h-4 text-orange-400" />;
    case 'yml':
    case 'yaml':
      return <Settings className="w-4 h-4 text-gray-400" />;
    default:
      return <FileText className="w-4 h-4 text-gray-400" />;
  }
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import CodeViewer from './CodeViewer';

interface KeyFile {
  path: string;
  name: string;
  reason: string;
  summary: string;
  size: number;
  content?: string;
  detailedAnalysis?: string;
}

export default function RepositoryKeyFiles({ repoFullName }: { repoFullName: string }) {
  const [keyFiles, setKeyFiles] = useState<KeyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<KeyFile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);

// Use a global cache on window to persist across remounts/tab switches
const getKeyFilesCache = (): { [key: string]: KeyFile[] } => {
  if (typeof window !== 'undefined') {
    
    if (!(window as any).__keyFilesCache) {
      (window as any).__keyFilesCache = {};
    }
   
    return (window as any).__keyFilesCache;
  }
  // SSR fallback (shouldn't happen for this component)
  return {};
};

  useEffect(() => {
    // Declare controller and timeoutId in the outer scope so they are accessible in cleanup
    let controller: AbortController;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchKeyFiles = async () => {
      if (!repoFullName) return;
      const cache = getKeyFilesCache();
      if (cache[repoFullName]) {
        setKeyFiles(cache[repoFullName]);
        setLoading(false);
        return;
      }
      
      // Use AbortController to handle timeouts and cancellations
      controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      setLoading(true);
      setError(null);
      try {
        // Use our API endpoint to get the repository structure
        const structureRes = await fetch(`/api/get-repo-structure?repo=${encodeURIComponent(repoFullName)}`);
        const structureData = await structureRes.json();
        // Debug: log the structureData for troubleshooting
        if (typeof window !== 'undefined') {
          // Only log in browser
          console.log('Repo structureData:', structureData);
        }
        // Get the file tree from the structure data
        
        let files: any[] = [];
        if (structureData.fileTree && Array.isArray(structureData.fileTree)) {
          // Extract all files from the hierarchical file tree
         
          const extractFiles = (nodes: any[], result: any[] = []) => {
            for (const node of nodes) {
              if (node.type === 'file' || node.type === 'blob') {
                result.push({
                  path: node.path,
                  type: 'blob',
                  size: node.size || 0
                });
              } else if ((node.type === 'directory' || node.type === 'tree') && node.children) {
                extractFiles(node.children, result);
              }
            }
            return result;
          };
          files = extractFiles(structureData.fileTree);
        } else if (structureData.tree && Array.isArray(structureData.tree)) {
          files = structureData.tree.filter((item: any) => item.type === 'blob' || item.type === 'file');
        } else if (structureData.files && Array.isArray(structureData.files)) {
          files = structureData.files.filter((item: any) => item.type === 'blob' || item.type === 'file');
        } else {
          // Try to fallback to any array of files/blobs in the response
          const possibleArrays = Object.values(structureData).filter(v => Array.isArray(v));
          for (const arr of possibleArrays) {
            const fileCandidates = arr.filter((item: any) => item && (item.type === 'blob' || item.type === 'file') && item.path);
            if (fileCandidates.length > 0) {
              files = fileCandidates;
              break;
            }
          }
        }
        // If still no files, show a warning
        if (!Array.isArray(files) || files.length === 0) {
          setKeyFiles([]);
          setError('No files found in this repository. The structure API may not be returning files as expected.');
          getKeyFilesCache()[repoFullName] = [];
          setLoading(false);
          return;
        }

        // Categories for file classification
        const categories = {
          entryPoints: ['index.js','index.ts','main.js','main.ts','app.js','app.ts','server.js','server.ts','index.jsx','index.tsx','main.jsx','main.tsx','app.jsx','app.tsx'],
          configs: ['package.json','tsconfig.json','webpack.config.js','.env.example','docker-compose.yml','Dockerfile','next.config.js','next.config.ts','vite.config.js','vite.config.ts','tailwind.config.js','tailwind.config.ts','jest.config.js','jest.config.ts'],
          readmePattern: /readme\.md/i,
          frameworkFiles: ['layout.tsx', 'page.tsx', 'routes.tsx', 'App.tsx', 'App.jsx', 'store.ts', 'store.js', 'context.tsx', 'context.jsx', 'schema.graphql', 'schema.prisma']
        };
        
        // Process files to create KeyFile objects
        const processedFiles = files.map(file => {
          const fileName = file.path.split('/').pop() || '';
          const filePath = file.path.toLowerCase();
          let reason = '';
          
          // Determine file category
          if (categories.entryPoints.includes(fileName)) {
            reason = 'Main entry point';
          } else if (categories.configs.includes(fileName)) {
            reason = 'Configuration file';
          } else if (categories.readmePattern.test(fileName)) {
            reason = 'Project documentation';
          } else if (categories.frameworkFiles.includes(fileName)) {
            reason = 'Framework file';
          } else if (filePath.includes('/src/') && (filePath.endsWith('/index.ts') || filePath.endsWith('/index.js') || filePath.endsWith('/index.tsx') || filePath.endsWith('/index.jsx'))) {
            reason = 'Module entry point';
          } else if (filePath.includes('/api/') && filePath.includes('/route.ts')) {
            reason = 'API endpoint';
          } else if (filePath.includes('/components/')) {
            reason = 'UI Component';
          } else if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
            reason = 'Utility/Library';
          } else if (filePath.includes('/hooks/')) {
            reason = 'React Hook';
          } else if (filePath.includes('/styles/') || filePath.endsWith('.css') || filePath.endsWith('.scss')) {
            reason = 'Styling';
          } else if (filePath.includes('/models/') || filePath.includes('/types/')) {
            reason = 'Data Model/Type';
          } else {
            reason = 'Source File';
          }
          
          return {
            path: file.path,
            name: fileName,
            reason,
            summary: getFileSummary(fileName, reason, filePath),
            size: file.size || 0,
            detailedAnalysis: ''
          };
        });
        
        // Sort files by importance and relevance
        const reasonPriority: Record<string, number> = {
          'Project documentation': 1,
          'Main entry point': 2,
          'Configuration file': 3,
          'Framework file': 4,
          'API endpoint': 5,
          'Module entry point': 6,
          'UI Component': 7,
          'Data Model/Type': 8,
          'Utility/Library': 9,
          'React Hook': 10,
          'Styling': 11,
          'Source File': 12
        };
        
        const sortedFiles = processedFiles.sort((a, b) => {
          // First sort by reason priority
          const priorityA = reasonPriority[a.reason] || 99;
          const priorityB = reasonPriority[b.reason] || 99;
          if (priorityA !== priorityB) return priorityA - priorityB;
          
          // Then by path depth (root files first)
          const depthA = a.path.split('/').length;
          const depthB = b.path.split('/').length;
          if (depthA !== depthB) return depthA - depthB;
          
          // Then by size for same reason
          return b.size - a.size;
        });
        
        // Take top 15 files instead of 20 to improve performance
        const topFiles = sortedFiles.slice(0, 15);
        setKeyFiles(topFiles);
        getKeyFilesCache()[repoFullName] = topFiles;

        // Do NOT prefetch Gemini analysis for all files. Only fetch on click in the dialog.
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError') {
          setError('Request timed out. The repository might be too large or the server is busy.');
        } else {
          console.error('Error fetching key files:', err);
          setError('Failed to fetch key files. Please try again.');
        }
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };
    fetchKeyFiles();
    
    // Clean up the abort controller on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (controller) controller.abort();
    };
  }, [repoFullName]);

  // Helper: 1-2 line summary for file type with more detailed descriptions
  function getFileSummary(fileName: string, reason: string, filePath: string = '') {
    // Framework-specific summaries
    if (/layout\.tsx$/.test(fileName)) return 'Next.js layout component that wraps pages with common UI elements.';
    if (/page\.tsx$/.test(fileName)) return 'Next.js page component that defines a route in the application.';
    if (/route\.ts$/.test(fileName)) return 'Next.js API route handler for server-side API endpoints.';
    if (/App\.tsx$|App\.jsx$/.test(fileName)) return 'Root React component that initializes the application.';
    if (/store\.ts$|store\.js$/.test(fileName)) return 'State management store configuration (Redux/Zustand/etc).';
    if (/context\.tsx$|context\.jsx$/.test(fileName)) return 'React context provider for state management.';
    
    // Common file types
    if (/readme\.md/i.test(fileName)) return 'Project overview, setup instructions and documentation.';
    if (/package\.json/.test(fileName)) return 'Defines project dependencies, scripts, and metadata.';
    if (/tsconfig\.json/.test(fileName)) return 'TypeScript compiler configuration and type checking options.';
    if (/dockerfile/i.test(fileName)) return 'Docker container build instructions and environment setup.';
    if (/\.env/.test(fileName)) return 'Environment variable definitions for configuration.';
    if (/next\.config/.test(fileName)) return 'Next.js framework configuration for routing, plugins, and build options.';
    if (/vite\.config/.test(fileName)) return 'Vite build tool configuration for development and production.';
    if (/tailwind\.config/.test(fileName)) return 'Tailwind CSS configuration for styling and theme customization.';
    if (/jest\.config/.test(fileName)) return 'Jest testing framework configuration for unit and integration tests.';
    
    // Entry points
    if (/main\./i.test(fileName)) return 'Main application entry point that bootstraps the app.';
    if (/index\./i.test(fileName)) {
      if (filePath.includes('/api/')) return 'API route entry point for handling requests.';
      if (filePath.includes('/components/')) return 'Component entry point for exporting UI elements.';
      if (filePath.includes('/pages/')) return 'Page component that defines a route in the application.';
      if (filePath.includes('/hooks/')) return 'Custom React hooks entry point for shared logic.';
      if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'Utility functions entry point for shared helpers.';
      return 'Module or application entry point.';
    }
    
    if (/server\./i.test(fileName)) return 'Server initialization and configuration.';
    if (/webpack\.config/i.test(fileName)) return 'Webpack bundler configuration for build process.';
    if (/docker-compose/i.test(fileName)) return 'Multi-container Docker services configuration.';
    if (/app\./i.test(fileName)) return 'Main application logic and initialization.';
    
    // File extensions
    if (/\.jsx$|\.tsx$/.test(fileName)) return 'React component with JSX syntax.';
    if (/\.js$|\.ts$/.test(fileName)) {
      if (filePath.includes('/api/')) return 'API endpoint or service function.';
      if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'Utility functions or helper library.';
      if (filePath.includes('/hooks/')) return 'Custom React hook for shared stateful logic.';
      if (filePath.includes('/context/')) return 'Context provider for state management.';
      if (filePath.includes('/services/')) return 'Service layer for external API communication.';
      return 'JavaScript/TypeScript source code.';
    }
    
    if (/\.json$/.test(fileName)) return 'JSON configuration or data file.';
    if (/\.md$/.test(fileName)) return 'Markdown documentation file.';
    if (/\.css$|\.scss$|\.sass$|\.less$/.test(fileName)) return 'Stylesheet for component or application styling.';
    if (/\.svg$|\.png$|\.jpg$|\.jpeg$/.test(fileName)) return 'Image asset used in the UI.';
    if (/\.graphql$|\.gql$/.test(fileName)) return 'GraphQL schema or query definitions.';
    if (/\.prisma$/.test(fileName)) return 'Prisma ORM schema defining database models.';
    
    // Reason-based fallbacks
    if (reason === 'Large file') {
      if (/\.json$/.test(fileName)) return 'Large data file containing application data or configuration.';
      if (/\.min\.js$/.test(fileName)) return 'Minified JavaScript library or bundle.';
      return 'Large source file that may contain core application logic.';
    }
    
    if (reason === 'Framework file') return 'Core framework file for application structure.';
    if (reason === 'API endpoint') return 'Server-side API endpoint handler for data operations.';
    if (reason === 'Module entry point') return 'Entry point for a module that exports functionality.';
    
    return reason;
  }

  // Function to get detailed analysis of file content using Gemini
  async function getDetailedFileAnalysis(repoFullName: string, filePath: string): Promise<string> {
    // Use AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(
        `/api/analyze-file-content?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(filePath)}`,
        { signal: controller.signal }
      );
      
      if (!response.ok) {
        console.error('API response not OK:', response.status);
        throw new Error(`Failed to fetch file analysis: ${response.status}`);
      }
      
      const data = await response.json();
      return data.analysis || 'No detailed analysis available.';
    } catch (err) {
      console.error('Error fetching file analysis:', err);
      if (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError') {
        return 'Analysis request timed out. The file might be too large or complex.';
      }
      return 'Unable to generate detailed analysis for this file.';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Use a ref to persist cached file contents across renders
  const cachedFileContentsRef = React.useRef<{
    [key: string]: string
  }>({});

  const fetchFileContent = async (filePath: string) => {
    setFileContentLoading(true);
    
    // Use AbortController to handle timeouts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    try {
      // Check if we already have cached content for this file
      const cacheKey = `${repoFullName}:${filePath}`;
      if (cachedFileContentsRef.current[cacheKey]) {
        console.log('Using cached file content for:', filePath);
        return cachedFileContentsRef.current[cacheKey];
      }

      console.log('Fetching file content for:', filePath);
      // Use the correct parameter format for our API
      const response = await fetch(
        `/api/get-file-content?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(filePath)}`,
        { signal: controller.signal }
      );
      
      if (!response.ok) {
        console.error('API response not OK:', response.status);
        throw new Error(`Failed to fetch file content: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('File content response:', { path: data.path, contentLength: data.content?.length || 0 });
      
      // Cache the file content
      if (data.content) {
        cachedFileContentsRef.current[cacheKey] = data.content;
      } else {
        console.warn('No content returned from API for:', filePath);
      }
      
      return data.content;
    } catch (err) {
      console.error('Error fetching file content:', err);
      if (typeof err === 'object' && err !== null && 'name' in err && (err as { name?: string }).name === 'AbortError') {
        console.warn('File content request timed out for:', filePath);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      setFileContentLoading(false);
    }
  };

  const handleFileClick = async (file: KeyFile) => {
    setSelectedFile(file);
    setIsDialogOpen(true);
    
    // First check if the file already has content
    if (file.content) {
      console.log('Using existing file content from keyFiles');
      setFileContent(file.content);
      
      // If we don't have detailed analysis yet, fetch it
      if (!file.detailedAnalysis) {
        try {
          const analysis = await getDetailedFileAnalysis(repoFullName, file.path);
          
          // Update the file with the analysis
          const updatedKeyFiles = keyFiles.map(f => 
            f.path === file.path ? { ...f, detailedAnalysis: analysis } : f
          );
          setKeyFiles(updatedKeyFiles);
          
          // Update keyFiles cache
          getKeyFilesCache()[repoFullName] = updatedKeyFiles;
        } catch (error) {
          console.error('Error fetching detailed analysis:', error);
        }
      }
      return;
    }
    
    // Then check our content cache
    const cacheKey = `${repoFullName}:${file.path}`;
    if (cachedFileContentsRef.current[cacheKey]) {
      console.log('Using cached file content');
      const cachedContent = cachedFileContentsRef.current[cacheKey];
      setFileContent(cachedContent);
      
      // Update the file in keyFiles with the cached content
      const updatedKeyFiles = keyFiles.map(f => 
        f.path === file.path ? { ...f, content: cachedContent } : f
      );
      setKeyFiles(updatedKeyFiles);
      
      // Update keyFiles cache
      getKeyFilesCache()[repoFullName] = updatedKeyFiles;
      
      // If we don't have detailed analysis yet, fetch it
      if (!file.detailedAnalysis) {
        try {
          const analysis = await getDetailedFileAnalysis(repoFullName, file.path);
          
          // Update the file with the analysis
          const updatedKeyFiles = keyFiles.map(f => 
            f.path === file.path ? { ...f, detailedAnalysis: analysis } : f
          );
          setKeyFiles(updatedKeyFiles);
          
          // Update keyFiles cache
      getKeyFilesCache()[repoFullName] = updatedKeyFiles;
        } catch (error) {
          console.error('Error fetching detailed analysis:', error);
        }
      }
      return;
    }
    
    // Otherwise fetch the content
    setFileContentLoading(true);
    try {
      // Use our fetchFileContent helper
      const content = await fetchFileContent(file.path);
      
      if (content) {
        setFileContent(content);
        
        // Fetch detailed analysis
        let analysis = '';
        try {
          analysis = await getDetailedFileAnalysis(repoFullName, file.path);
        } catch (error) {
          console.error('Error fetching detailed analysis:', error);
        }
        
        // Update the file in keyFiles with the content and analysis
        const updatedKeyFiles = keyFiles.map(f => 
          f.path === file.path ? { ...f, content, detailedAnalysis: analysis } : f
        );
        setKeyFiles(updatedKeyFiles);
        
        // Update keyFiles cache
      getKeyFilesCache()[repoFullName] = updatedKeyFiles;
      } else {
        setFileContent(null);
      }
    } catch (error) {
      console.error('Error in handleFileClick:', error);
      setFileContent(null);
    } finally {
      setFileContentLoading(false);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      go: 'go',
      php: 'php',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      md: 'markdown',
      json: 'json',
      yml: 'yaml',
      yaml: 'yaml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      sh: 'bash',
      bash: 'bash',
      sql: 'sql',
      graphql: 'graphql',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      dart: 'dart',
      ex: 'elixir',
      exs: 'elixir',
      hs: 'haskell',
      lua: 'lua',
      pl: 'perl',
      r: 'r',
      scala: 'scala',
      clj: 'clojure',
      fs: 'fsharp',
      elm: 'elm',
      dockerfile: 'dockerfile',
    };
    
    return languageMap[extension.toLowerCase()] || 'text';
  };

  // Add useEffect to toggle body class when dialog is open
    useEffect(() => {
      if (isDialogOpen) {
        document.body.classList.add('dialog-open');
      } else {
        document.body.classList.remove('dialog-open');
      }
      
      // Clean up on unmount
      return () => {
        document.body.classList.remove('dialog-open');
      };
    }, [isDialogOpen]);
  
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Identifying key files...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      );
    }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Key Files</h3>
        <Badge variant="outline" className="text-xs">{keyFiles.length} files</Badge>
      </div>
      
      <div>
        <div className="space-y-2">
          {(Array.isArray(keyFiles) && keyFiles.length === 0) ? (
            <div className="p-6 text-center bg-black/20 rounded-md border border-white/10 flex flex-col items-center space-y-3">
              <AlertCircle className="h-8 w-8 text-yellow-500/70 mb-2" />
              <h4 className="text-white/90 font-medium">No key files found</h4>
              <p className="text-white/70 max-w-md">
                We couldn&apos;t identify key files in this repository. This might happen with non-standard project structures or empty repositories.
              </p>
              <p className="text-white/50 text-sm">
                Try a different repository or check if the repository has content in the main branch.
              </p>
            </div>
          ) : (
            (Array.isArray(keyFiles) ? keyFiles : []).map((file, index) => (
              <div
                key={index}
                className="flex flex-col gap-1 p-3 rounded-md bg-black/20 hover:bg-black/30 transition-colors cursor-pointer border border-white/10"
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.name)}
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{file.path}</p>
                      <p className="text-xs text-white/70 mt-1 max-w-[300px]">{file.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">{file.reason}</Badge>
                    {file.size > 10000 && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <GitCommit className="h-3 w-3 mr-1" />
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* No AI analysis in the list view. Only show in dialog on click. */}
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-full bg-black/60 backdrop-blur-xl border border-white/20 text-white/90 max-h-[90vh] shadow-2xl shadow-black/20 z-50 overflow-hidden fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col">
          {/* Liquid glass effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none"></div>
          
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              {selectedFile && getFileIcon(selectedFile.path)}
              <span>{selectedFile?.path}</span>
            </DialogTitle>
            
            {/* File analysis section */}
            {selectedFile?.detailedAnalysis && (
              <div className="mt-2 p-3 bg-black/30 rounded-md border border-white/10 text-sm">
                <h4 className="text-white/90 font-medium mb-1">Analysis:</h4>
                <p className="text-white/80">{selectedFile.detailedAnalysis}</p>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-grow overflow-auto custom-scrollbar">
            {fileContentLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : fileContent ? (
              <CodeViewer 
                code={fileContent} 
                language={selectedFile ? getLanguageFromPath(selectedFile.path) : 'text'}
                showLineNumbers
                repoFullName={repoFullName}
                fileName={selectedFile?.path || ''}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Failed to load file content
              </div>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}