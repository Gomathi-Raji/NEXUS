import { useState, useEffect } from 'react';

interface GitHubStatus {
  hasToken: boolean;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  error?: string;
}

export function GitHubStatusIndicator() {
  const [status, setStatus] = useState<GitHubStatus>({ hasToken: false });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    try {
      const response = await fetch('/api/github-status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({ 
        hasToken: false, 
        error: 'Failed to check GitHub API status' 
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        Checking GitHub API...
      </div>
    );
  }

  const getStatusColor = () => {
    if (status.error) return 'bg-red-400';
    if (!status.hasToken) return 'bg-orange-400';
    return 'bg-green-400';
  };

  const getStatusText = () => {
    if (status.error) return 'API Error';
    if (!status.hasToken) return 'No Token';
    return 'Connected';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 ${getStatusColor()} rounded-full`} />
      <span className="text-gray-300">GitHub: {getStatusText()}</span>
      {status.rateLimitRemaining && (
        <span className="text-gray-400">
          ({status.rateLimitRemaining} requests left)
        </span>
      )}
      {!status.hasToken && (
        <a 
          href="/GITHUB_SETUP.md" 
          target="_blank"
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Setup Guide
        </a>
      )}
    </div>
  );
}

export default GitHubStatusIndicator;