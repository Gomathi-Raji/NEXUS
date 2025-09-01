import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Owner and repository name are required' }, { status: 400 });
  }

  const github = new GitHubService();

  try {
    const stats = await github.getRepositoryStats(owner, repo);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching repository stats:', error);
    return NextResponse.json({ error: 'Failed to fetch repository stats' }, { status: 500 });
  }
}