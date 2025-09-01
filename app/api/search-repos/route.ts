import { NextResponse } from 'next/server';
import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

function getHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    ...(token ? { Authorization: `token ${token}` } : {}),
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'WhatToBuild-App',
  } as Record<string, string>;
}

function extractOwnerRepo(raw: string): string | null {
  try {
    // repo:owner/name qualifier
    const repoQualifier = raw.match(/^repo:([^\s]+\/[^\s]+)$/i);
    if (repoQualifier) return repoQualifier[1];

    // Full GitHub URL
    if (/https?:\/\/github\.com\//i.test(raw)) {
      const url = new URL(raw);
      const parts = url.pathname.replace(/^\//, '').split('/');
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    }

    // owner/repo pattern
    if (/^[^\s/]+\/[^\s/]+$/.test(raw)) return raw;

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    const page = Number(searchParams.get('page') || '1');
    const per_page = Math.min(Number(searchParams.get('per_page') || '10'), 50);
    const mode = (searchParams.get('mode') || '').toLowerCase();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const headers = getHeaders();

    // 1) Exact repo lookup if owner/repo or full URL provided
    const ownerRepo = extractOwnerRepo(query);
    if (ownerRepo) {
      try {
        const resp = await axios.get(`${GITHUB_API}/repos/${ownerRepo}`, { headers });
        return NextResponse.json({ items: [resp.data], has_more: false, total_count: 1 });
      } catch {
        // If exact repo not found, fall back to search below
      }
    }

    // 2) General search
    // For 'find' mode, keep it literal; for others, pass through as-is
    const q = query;
    const resp = await axios.get(`${GITHUB_API}/search/repositories`, {
      headers,
      params: {
        q,
        page,
        per_page,
        sort: mode === 'repo' ? 'stars' : undefined,
        order: mode === 'repo' ? 'desc' : undefined,
      },
    });

    const items = resp.data.items || [];
    const total_count = typeof resp.data.total_count === 'number' ? resp.data.total_count : 0;
    const has_more = page * per_page < Math.min(total_count, 1000) && items.length === per_page;

    return NextResponse.json({ items, has_more, total_count });
  } catch (error) {
    console.error('Error searching repositories:', error);
    return NextResponse.json({ error: 'Failed to search repositories' }, { status: 500 });
  }
}
