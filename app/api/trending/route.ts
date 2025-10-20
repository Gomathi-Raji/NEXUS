import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

function ghHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    ...(token ? { Authorization: `token ${token}` } : {}),
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'NEXUS-App',
  } as Record<string, string>;
}

interface TrendingRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  created_at: string;
  pushed_at: string;
  open_issues_count: number;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  homepage?: string;
  size: number;
  default_branch: string;
}

interface TrendingDeveloper {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  company: string | null;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
  updated_at: string;
  popularRepo?: {
    name: string;
    description: string | null;
    stargazers_count: number;
    html_url: string;
  };
}

function getDateRange(since: string): string {
  const now = new Date();
  let date: Date;

  switch (since) {
    case 'daily':
      date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || '';
    const since = searchParams.get('since') || 'daily';
    const spokenLanguage = searchParams.get('spoken_language_code') || '';
    const type = searchParams.get('type') || 'repositories'; // repositories or developers

    if (type === 'developers') {
      // Fetch trending developers
      const dateRange = getDateRange(since);
      
      // Build query for developers who have been active recently
      let query = `type:user created:>=${dateRange}`;
      if (language) {
        query += ` language:${language}`;
      }
      if (spokenLanguage) {
        query += ` location:${spokenLanguage}`;
      }

      const response = await axios.get(`${GITHUB_API}/search/users`, {
        headers: ghHeaders(),
        params: {
          q: query,
          sort: 'followers',
          order: 'desc',
          per_page: 25,
        },
      });

      const developers = await Promise.all(
        response.data.items.map(async (user: { login: string }) => {
          try {
            // Get detailed user info
            const userResponse = await axios.get(`${GITHUB_API}/users/${user.login}`, {
              headers: ghHeaders(),
            });

            // Get user's most popular repo
            const reposResponse = await axios.get(`${GITHUB_API}/users/${user.login}/repos`, {
              headers: ghHeaders(),
              params: {
                sort: 'stars',
                direction: 'desc',
                per_page: 1,
              },
            });

            const popularRepo = reposResponse.data[0];

            return {
              ...userResponse.data,
              popularRepo: popularRepo ? {
                name: popularRepo.name,
                description: popularRepo.description,
                stargazers_count: popularRepo.stargazers_count,
                html_url: popularRepo.html_url,
              } : null,
            } as TrendingDeveloper;
          } catch (error) {
            console.error(`Error fetching developer ${user.login}:`, error);
            return null;
          }
        })
      );

      const validDevelopers = developers.filter((dev): dev is TrendingDeveloper => dev !== null);

      return NextResponse.json({
        items: validDevelopers,
        total_count: validDevelopers.length,
      });
    }

    // Fetch trending repositories
    const dateRange = getDateRange(since);
    
    // Build query string
    let query = `created:>=${dateRange} stars:>=10`;
    if (language) {
      query += ` language:${language}`;
    }

    const response = await axios.get(`${GITHUB_API}/search/repositories`, {
      headers: ghHeaders(),
      params: {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 25,
      },
    });

    const repos: TrendingRepo[] = response.data.items;

    return NextResponse.json({
      items: repos,
      total_count: response.data.total_count,
    });

  } catch (error) {
    console.error('Error fetching trending data:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: error.response?.data?.message || 'Failed to fetch trending data' },
        { status: error.response?.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    );
  }
}
