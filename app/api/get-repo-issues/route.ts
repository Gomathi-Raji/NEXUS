import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');
  const state = searchParams.get('state') as 'open' | 'closed' | 'all' || 'open';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '10');

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  try {
    const githubService = new GitHubService();
    const issues = await githubService.getRepositoryIssues(repoFullName, state, perPage, page);
    
    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Error fetching repository issues:', error);
    return NextResponse.json({ error: 'Failed to fetch repository issues' }, { status: 500 });
  }
}