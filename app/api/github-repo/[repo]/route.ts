import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repo: string }> }
) {
  try {
    const resolvedParams = await params;
    const repoName = decodeURIComponent(resolvedParams.repo);
    
    if (!repoName || !repoName.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid repository name. Format should be owner/repo' },
        { status: 400 }
      );
    }
    
    const githubService = new GitHubService();
    const repo = await githubService.getRepository(repoName);
    
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(repo);
    
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}
