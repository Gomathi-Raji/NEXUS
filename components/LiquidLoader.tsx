'use client';

import React from 'react';

interface LiquidLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LiquidLoader({ 
  text = 'Loading issues...', 
  size = 'md',
  className = ''
}: LiquidLoaderProps) {
  const sizeConfig = {
    sm: {
      container: 'px-4 py-3',
      spinner: 'w-6 h-6',
      text: 'text-sm'
    },
    md: {
      container: 'px-6 py-4',
      spinner: 'w-8 h-8',
      text: 'text-base'
    },
    lg: {
      container: 'px-8 py-6',
      spinner: 'w-10 h-10',
      text: 'text-lg'
    }
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`
        relative
        bg-gradient-to-br from-gray-800/40 via-gray-900/30 to-black/40
        backdrop-blur-2xl 
        border border-white/10
        rounded-2xl 
        ${sizeConfig[size].container} 
        shadow-2xl 
        flex items-center space-x-4 
        overflow-hidden 
        group
        before:absolute before:inset-0 
        before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-transparent 
        before:rounded-2xl before:pointer-events-none
        after:absolute after:inset-0 
        after:bg-gradient-to-t after:from-black/10 after:via-transparent after:to-white/5 
        after:rounded-2xl after:pointer-events-none
      `}>
        
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/5 via-transparent to-purple-400/5 pointer-events-none rounded-2xl"></div>
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-2xl"></div>
        
        <div className={`relative ${sizeConfig[size].spinner} flex items-center justify-center`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-sm animate-pulse"></div>
          
          <div className="absolute inset-0 rounded-full border-2 border-gray-600/30"></div>
          
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-indigo-400 border-r-indigo-500 animate-spin" 
               style={{ 
                 background: 'conic-gradient(from 0deg, transparent 0deg, rgba(99, 102, 241, 0.3) 90deg, transparent 360deg)',
                 borderRadius: '50%',
                 WebkitMask: 'radial-gradient(circle at center, transparent 60%, black 61%)',
                 mask: 'radial-gradient(circle at center, transparent 60%, black 61%)'
               }}>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full animate-pulse shadow-lg shadow-indigo-500/30"></div>
          </div>
          
          <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 w-1 h-1 bg-white/60 rounded-full blur-sm transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
        
        <div className="relative">
          <span className={`
            text-white/90 
            font-medium 
            ${sizeConfig[size].text}
            bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent
            drop-shadow-sm
          `}>
            {text}
            <span className="animate-pulse text-indigo-300/80">...</span>
          </span>
        </div>
        
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-indigo-400/40 rounded-full animate-ping" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
          <div className="absolute top-3/4 right-1/3 w-0.5 h-0.5 bg-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
          <div className="absolute bottom-1/3 left-2/3 w-0.5 h-0.5 bg-indigo-300/25 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}></div>
        </div>
      </div>
    </div>
  );
}