'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import '@/components/ui/responsive-dialog.css';
import CodeViewer from './CodeViewer';
import { Badge } from '@/components/ui/badge';
import { FileCode2, FileText, FileJson, Layout, Globe, Settings } from 'lucide-react';

interface FileDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    path: string;
    name: string;
    extension?: string;
    content?: string;
    summary?: string;
  } | null;
  repoFullName: string;
}

function getFileIcon(extension: string | undefined) {
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode2 className="w-5 h-5 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-5 h-5 text-green-400" />;
    case 'md':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'css':
    case 'scss':
    case 'sass':
      return <Layout className="w-5 h-5 text-purple-400" />;
    case 'html':
      return <Globe className="w-5 h-5 text-orange-400" />;
    case 'yml':
    case 'yaml':
      return <Settings className="w-5 h-5 text-gray-400" />;
    default:
      return <FileText className="w-5 h-5 text-gray-400" />;
  }
}

export function FileDetailsDialog({ isOpen, onClose, file, repoFullName }: FileDetailsDialogProps) {
  // Add effect to toggle body class when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('dialog-open');
    } else {
      document.body.classList.remove('dialog-open');
    }
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('dialog-open');
    };
  }, [isOpen]);

  if (!file) return null;
  
  const fileName = file.name;
  const extension = file.extension || fileName.split('.').pop();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="responsive-dialog-content bg-black/60 backdrop-blur-xl border border-white/20 text-white/90 shadow-2xl shadow-black/20 z-50 overflow-auto fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2">
        {/* Liquid glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 pointer-events-none"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0 blur-xl opacity-50 -z-10"></div>
        
        <DialogHeader className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-lg p-4 mb-4 shadow-sm relative overflow-hidden group hover:bg-black/40 hover:border-white/20 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          <DialogTitle className="text-xl font-medium text-white flex items-center gap-2 flex-wrap">
            {getFileIcon(extension)}
            <span className="break-all">{file.path}</span>
            {extension && (
              <Badge variant="outline" className="ml-auto text-xs bg-white/10">
                {extension.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {file.summary && (
          <div className="bg-black/40 rounded-lg p-4 border border-white/10 mb-4">
            <h4 className="text-white/80 text-sm font-medium mb-2">Summary</h4>
            <p className="text-white/70">{file.summary}</p>
          </div>
        )}
        
        {file.content ? (
          <div>
            <CodeViewer 
              code={file.content} 
              language={extension || 'text'} 
              fileName={fileName} 
              repoFullName={repoFullName} 
              showLineNumbers
            />
          </div>
        ) : (
          <div className="bg-black/40 rounded-lg p-4 border border-white/10 text-center py-8">
            <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">Content Not Available</h3>
            <p className="text-white/60 max-w-md mx-auto">
              The content of this file is not available for preview.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}