'use client';

import React from 'react';
import { GitHubRepo } from '@/lib/github';
import RepositoryCard from '@/components/RepositoryCard';
import { Loader2, Search } from 'lucide-react';

interface RepoListProps {
  repositories: GitHubRepo[];
  isSearching: boolean;
}

export default function RepoList({ repositories, isSearching }: RepoListProps) {
  if (isSearching) {
    return (
      <div className="flex items-center justify-center gap-3 text-lg text-gray-300 py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Searching for similar projects on GitHub...</span>
      </div>
    );
  }

  if (repositories.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Search /> Similar GitHub Repositories
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repositories.map(repo => (
          <RepositoryCard key={repo.id} repo={repo} />
        ))}
      </div>
    </div>
  );
}
