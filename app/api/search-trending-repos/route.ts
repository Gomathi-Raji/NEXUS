import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    ...(token ? { Authorization: `token ${token}` } : {}),
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'WhatToBuild-App',
  } as Record<string, string>;
}

type Repo = {
  id: number;
  full_name: string;
  language: string | null;
};
type RepoWithMeta = Repo & { stargazers_count: number; pushed_at: string };

async function searchRepos(q: string, page: number, per_page: number) {
  const resp = await axios.get(`${GITHUB_API}/search/repositories`, {
    headers: ghHeaders(),
    params: { q, sort: 'stars', order: 'desc', page, per_page },
  });
  return resp.data as { items: Repo[]; total_count: number };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = (searchParams.get('filter') || 'good first issue').toLowerCase();
    const language = (searchParams.get('language') || '').trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const per_page = Math.min(parseInt(searchParams.get('per_page') || '10', 10), 50);

    // Common qualifiers for quality & recency
    const baseQuals = [
      'is:public',
      'archived:false',
      'stars:>=100',
      'pushed:>=2024-01-01',
    ];
    if (language) baseQuals.push(`language:${language}`);

    let items: Repo[] = [];
    let total = 0;

    if (filter === 'good first issue') {
      // Perform two queries and merge: good-first-issues:>0 OR help-wanted-issues:>0
      const q1 = [...baseQuals, 'good-first-issues:>0'].join(' ');
      const q2 = [...baseQuals, 'help-wanted-issues:>0'].join(' ');

      const [r1, r2] = await Promise.all([
        searchRepos(q1, page, per_page),
        searchRepos(q2, page, per_page),
      ]);
      const map = new Map<number, Repo>();
      [...r1.items, ...r2.items].forEach((r) => map.set(r.id, r));
      items = Array.from(map.values());
      // If language specified, ensure correctness
      if (language) items = items.filter((r) => (r.language || '').toLowerCase() === language.toLowerCase());
      // Limit to per_page
      items = items.slice(0, per_page);
      total = r1.total_count + r2.total_count; // rough upper bound
    } else if (filter === 'bounty issue') {
      try {
        // Tier 1: Open issues that signal bounties (labels OR text OR platforms)
        const moneyTokens = ['"$"', '"$10"', '"$25"', '"$50"', '"$75"', '"$100"', '"$200"', '"$300"', '"$500"', '"$1000"', 'USD', 'EUR', 'INR'];
        const bountyTokens = ['bounty', 'reward', 'paid', 'funded', 'bug-bounty', 'cash', 'gitcoin', 'issuehunt', 'algora'];
        const textOr = [...bountyTokens, ...moneyTokens].map(t => `${t}`).join(' OR ');
        const qText = `is:issue is:open in:title,body (${textOr})`;
        const qLabels = `is:issue is:open (label:bounty OR label:bug-bounty OR label:reward OR label:paid)`;

        const [issueResp1, issueResp2] = await Promise.all([
          axios.get(`${GITHUB_API}/search/issues`, { headers: ghHeaders(), params: { q: qText, sort: 'updated', order: 'desc', per_page: 100, page: 1 } }),
          axios.get(`${GITHUB_API}/search/issues`, { headers: ghHeaders(), params: { q: qLabels, sort: 'updated', order: 'desc', per_page: 100, page: 1 } }),
        ]);

        type IssueItem = { repository_url: string };
        const issueItems = ([...(issueResp1.data?.items || []), ...(issueResp2.data?.items || [])]) as IssueItem[];
        const repoApiUrls = Array.from(new Set(issueItems.map((it) => it.repository_url)));

        const repoBatch = await Promise.all(
          repoApiUrls.slice(0, 200).map(async (url) => {
            try {
              const r = await axios.get(url, { headers: ghHeaders() });
              return r.data as RepoWithMeta;
            } catch {
              return null;
            }
          })
        );
        let repoList = repoBatch.filter((r): r is RepoWithMeta => !!r);
        if (language) repoList = repoList.filter((r) => (r.language || '').toLowerCase() === language.toLowerCase());

        // Relaxed quality filters to avoid empty results for MVP
        const minStarsPrimary = 10;
        const minPushedPrimary = new Date('2023-01-01');
        let filtered: RepoWithMeta[] = repoList.filter((r) => r.stargazers_count >= minStarsPrimary && new Date(r.pushed_at) >= minPushedPrimary);
        if (filtered.length === 0) {
          // Drop recency if too strict
          filtered = repoList.filter((r) => r.stargazers_count >= minStarsPrimary);
        }
        if (filtered.length === 0) {
          // As last resort, keep any repos we found
          filtered = repoList;
        }
        filtered.sort((a, b) => b.stargazers_count - a.stargazers_count);

        total = filtered.length;
        const start = (page - 1) * per_page;
        const end = start + per_page;
        items = filtered.slice(start, end) as unknown as Repo[];

        // Tier 3 fallback: if still empty, run a very broad repo search without strict base qualifiers
        if (items.length === 0) {
          const qBroad = '(bounty in:readme OR bounty in:description OR reward in:readme OR reward in:description)';
          const resp = await axios.get(`${GITHUB_API}/search/repositories`, {
            headers: ghHeaders(),
            params: { q: language ? `${qBroad} language:${language}` : qBroad, sort: 'stars', order: 'desc', per_page, page },
          });
          items = resp.data?.items || [];
          total = resp.data?.total_count || 0;
        }
      } catch {
        console.warn('Bounty issues search failed, falling back to repo heuristic');
        // Tier 2 Fallback: run multiple simple queries to avoid 422 from complex boolean queries
        try {
          const qualifiers = [
            [...baseQuals, 'topic:bounty'].join(' '),
            [...baseQuals, 'topic:bug-bounty'].join(' '),
            [...baseQuals, 'bounty in:readme'].join(' '),
            [...baseQuals, 'reward in:readme'].join(' '),
            [...baseQuals, 'bounty in:description'].join(' '),
            [...baseQuals, 'reward in:description'].join(' '),
          ];

          const results = await Promise.all(
            qualifiers.map(async (q) => {
              try {
                const r = await axios.get(`${GITHUB_API}/search/repositories`, {
                  headers: ghHeaders(),
                  params: { q, sort: 'stars', order: 'desc', per_page, page },
                });
                return (r.data?.items || []) as (Repo & { stargazers_count?: number })[];
              } catch {
                return [];
              }
            })
          );
          const map = new Map<number, Repo>();
          results.flat().forEach((repo) => {
            if (repo && repo.id) map.set(repo.id, repo);
          });
          let list = Array.from(map.values());
          if (language) list = list.filter((x) => (x.language || '').toLowerCase() === language.toLowerCase());
          // Sort by stars
          list.sort((a, b) => ((b as RepoWithMeta).stargazers_count || 0) - ((a as RepoWithMeta).stargazers_count || 0));
          total = list.length;
          items = list.slice(0, per_page);
        } catch (fallbackErr) {
          console.error('Tier 2 fallback failed:', fallbackErr);
          // Final safeguard: avoid 500s
          return NextResponse.json({ items: [], has_more: false, error: 'No bounty repos found (fallback failed).' });
        }
      }
    } else {
      // 'major issue' or others: get highly active/popular repos; actual issue filtering occurs later client-side
      const q = [...baseQuals].join(' ');
      const r = await searchRepos(q, page, per_page);
      items = r.items;
      if (language) items = items.filter((r) => (r.language || '').toLowerCase() === language.toLowerCase());
      total = r.total_count;
    }

    const has_more = page * per_page < Math.min(total, 1000) && items.length === per_page;
    return NextResponse.json({ items, has_more, total_count: total });
  } catch (error) {
    console.error('Error searching trending repositories:', error);
    return NextResponse.json({ error: 'Failed to search trending repositories' }, { status: 500 });
  }
}