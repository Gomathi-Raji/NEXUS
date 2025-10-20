import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');
  const labels = searchParams.get('labels');
  const state = searchParams.get('state') as 'open' | 'closed' | 'all' || 'open';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('perPage') || '10');
  const bountySignals = (searchParams.get('bountySignals') || 'false') === 'true';

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  try {
    // Special bounty path: use GitHub search/issues to catch text and labels
    if (bountySignals) {
      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) {
        return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 });
      }
      const token = process.env.GITHUB_TOKEN;
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'WhatToBuild-App',
      };
      if (token) headers.Authorization = `token ${token}`;

      const moneyTokens = ['"$"', '"$10"', '"$25"', '"$50"', '"$75"', '"$100"', '"$200"', '"$300"', '"$500"', '"$1000"', 'USD', 'EUR', 'INR'];
      const bountyTokens = ['bounty', 'reward', 'paid', 'funded', 'bug-bounty', 'cash', 'gitcoin', 'issuehunt', 'algora'];
      const qParts = [
        `repo:${owner}/${repo}`,
        'is:issue',
        `state:${state}`,
        `in:title,body (${[...bountyTokens, ...moneyTokens].join(' OR ')})`,
        '(label:bounty OR label:bug-bounty OR label:reward OR label:paid)'
      ];
      const q = qParts.join(' ');
      const resp = await axios.get('https://api.github.com/search/issues', {
        headers,
        params: { q, sort: 'updated', order: 'desc', per_page: perPage, page },
      });
      // Normalize to GitHubService issue shape subset
      type SearchIssueUser = { login: string; avatar_url: string; html_url: string };
      type SearchIssueLabel = { id: number; name: string; color: string; description?: string };
      type SearchIssueItem = {
        id: number;
        number: number;
        title: string;
        state: string;
        html_url: string;
        user: SearchIssueUser;
        labels: SearchIssueLabel[];
        created_at: string;
        updated_at: string;
        comments: number;
      };
      const items = ((resp.data?.items || []) as SearchIssueItem[]).map((it) => ({
        id: it.id,
        number: it.number,
        title: it.title,
        state: it.state,
        html_url: it.html_url,
        user: it.user,
        labels: it.labels,
        created_at: it.created_at,
        updated_at: it.updated_at,
        comments: it.comments,
        pull_request: undefined as unknown, // ensure treated as issue downstream
      }));
      return NextResponse.json({
        issues: items,
        total: resp.data?.total_count || items.length,
        page,
        perPage,
        hasMore: items.length === perPage,
      });
    }

    const githubService = new GitHubService();
    // Standard labeled issues path (filter out PRs)
    const issuesRaw = await githubService.getRepositoryIssues(
      repoFullName,
      state,
      perPage,
      page,
      labels || undefined
    );
    type MaybePR = { pull_request?: unknown };
    const issues = issuesRaw.filter((it) => !(it as unknown as MaybePR).pull_request);
    let estimatedTotal = issues.length;
    if (issues.length === perPage) {
      estimatedTotal = Math.max(issues.length, perPage * 2);
    }
    return NextResponse.json({ issues, total: estimatedTotal, page, perPage, hasMore: issues.length === perPage });
  } catch (error) {
    console.error('Error fetching repository issues with labels:', error);
    
    // Handle specific GitHub API errors
    if (error instanceof Error) {
      if (error.message.includes('GitHub token not configured')) {
        return NextResponse.json({ 
          error: 'GitHub authentication not configured. Please set GITHUB_TOKEN in .env.local',
          docs: '/GITHUB_SETUP.md'
        }, { status: 401 });
      }
      
      if (error.message.includes('Request failed with status code 401')) {
        return NextResponse.json({ 
          error: 'GitHub token is invalid or expired. Please update GITHUB_TOKEN in .env.local',
          docs: '/GITHUB_SETUP.md'
        }, { status: 401 });
      }
      
      if (error.message.includes('Request failed with status code 403')) {
        return NextResponse.json({ 
          error: 'GitHub API rate limit exceeded. Please wait or use an authenticated token.',
          docs: '/GITHUB_SETUP.md'
        }, { status: 429 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch repository issues',
      hint: 'Check console for details or ensure GitHub token is properly configured'
    }, { status: 500 });
  }
}