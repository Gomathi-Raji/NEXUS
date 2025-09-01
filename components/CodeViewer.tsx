/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import './RepositoryIssuesScrollbar.css';
import './ui/hide-scrollbar.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeViewerProps {
  code: string;
  language: string;
  fileName: string;
  repoFullName: string;
  showLineNumbers?: boolean;
}

const languageMap: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  go: 'go',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  md: 'markdown',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  dockerfile: 'dockerfile',
  sql: 'sql',
  graphql: 'graphql',
  xml: 'xml',
};

export default function CodeViewer({ code, language, fileName, repoFullName, showLineNumbers = true }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getGitHubUrl = () => {
    return `https://github.com/${repoFullName}/blob/main/${fileName}`;
  };
  
  // Map file extension to language for syntax highlighting
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const highlightLanguage = languageMap[fileExtension] || fileExtension || 'text';
  
  return (
    <div className="rounded-lg overflow-hidden bg-black/50 border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-white/90">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-2 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span className="ml-2 text-xs">Download</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => window.open(getGitHubUrl(), '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="ml-2 text-xs">GitHub</span>
          </Button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-auto hide-native-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <SyntaxHighlighter
          language={highlightLanguage}
          style={vscDarkPlus}
          showLineNumbers={showLineNumbers}
          wrapLines
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.9rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}