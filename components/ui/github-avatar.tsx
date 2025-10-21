import { useState } from 'react';
import Image from 'next/image';

interface GitHubAvatarProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackText?: string;
}

export function GitHubAvatar({ 
  src, 
  alt, 
  width, 
  height, 
  className = "",
  fallbackText 
}: GitHubAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    // Fallback avatar with initials
    const initials = fallbackText 
      ? fallbackText.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';
    
    return (
      <div 
        className={`bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold rounded-full ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-300 animate-pulse rounded-full"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`rounded-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        priority={false}
        // Add timeout handling
        loading="lazy"
      />
    </div>
  );
}