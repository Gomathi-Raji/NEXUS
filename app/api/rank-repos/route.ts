import { NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { GitHubRepo } from '@/lib/github';

export async function POST(request: Request) {
  try {
    const { repos, query } = await request.json();

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ error: 'Repositories are required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const geminiService = new GeminiService();
    const rankedRepos = await geminiService.rankRepositories(repos, query);

    return NextResponse.json(rankedRepos);
  } catch (error) {
    console.error('Error ranking repositories:', error);
    return NextResponse.json({ error: 'Failed to rank repositories' }, { status: 500 });
  }
}
