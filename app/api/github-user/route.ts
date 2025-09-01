/* eslint-disable @typescript-eslint/no-unused-vars */
interface Repo {
  name: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  created_at: string;
  description: string | null;
  html_url: string;
}

// Fetch real contribution data using GitHub GraphQL API
async function fetchRealContributions(username: string, githubToken: string): Promise<number[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contribution data');
  }
  const result = await response.json();
  const weeks = result?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
  // Flatten the weeks into a single array of days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = weeks.flatMap((week: any) => week.contributionDays);
  // Get the last 365 days (GitHub returns 53 weeks sometimes)
  const last365 = days.slice(-365);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return last365.map((day: any) => day.contributionCount);
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  try {
    // Fetch user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await userResponse.json();

    // Fetch user's repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const repos: Repo[] = await reposResponse.json();

    // Fetch real contribution data using GraphQL API
    let contributionData: number[] = [];
    try {
      contributionData = await fetchRealContributions(username, process.env.GITHUB_TOKEN!);
    } catch (e) {
      // fallback to empty array if error
      contributionData = [];
    }

    // Sort all repos by stars descending and take top 2 for detailed cards
    const reposByStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);

    // Fetch detailed repo data with commit counts for the top starred repos
    const reposWithCommits = await Promise.all(
      reposByStars.slice(0, 2).map(async (repo: Repo) => {
        try {
          // Fetch commit count for each repo
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`,
            {
              headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );
          
          let commitCount = 0;
          if (commitsResponse.ok) {
            const linkHeader = commitsResponse.headers.get('link');
            if (linkHeader) {
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              commitCount = match ? parseInt(match[1]) : 1;
            } else {
              commitCount = 1; // If no link header, there's at least one commit
            }
          }

          const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            name: repo.name,
            stars: repo.stargazers_count,
            language: repo.language || 'Unknown',
            description: repo.description,
            updated_at: repo.updated_at,
            daysSinceUpdate,
            commitCount,
            url: repo.html_url,
          };
        } catch (error) {
          console.error(`Error fetching commits for ${repo.name}:`, error);
          return {
            name: repo.name,
            stars: repo.stargazers_count,
            language: repo.language || 'Unknown',
            description: repo.description,
            updated_at: repo.updated_at,
            daysSinceUpdate: Math.floor(
              (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
            ),
            commitCount: 0,
            url: repo.html_url,
          };
        }
      })
    );

    // Calculate stats
    const stats = {
      totalStars: repos.reduce((sum: number, repo: Repo) => sum + repo.stargazers_count, 0),
      totalForks: repos.reduce((sum: number, repo: Repo) => sum + repo.forks_count, 0),
      languages: repos.reduce((langs: Record<string, number>, repo: Repo) => {
        if (repo.language) {
          langs[repo.language] = (langs[repo.language] || 0) + 1;
        }
        return langs;
      }, {}),
      contributions: contributionData.reduce((sum: number, day: number) => sum + day, 0),
      contributionData,
      topRepos: reposWithCommits,
      totalCommits: reposWithCommits.reduce((sum, repo) => sum + repo.commitCount, 0),
      languageStats: repos.reduce((stats: Record<string, { count: number; percentage: number }>, repo: Repo) => {
        if (repo.language) {
          stats[repo.language] = stats[repo.language] || { count: 0, percentage: 0 };
          stats[repo.language].count++;
        }
        return stats;
      }, {}),
    };

    // Calculate language percentages
    const totalRepos = repos.length;
    Object.keys(stats.languageStats).forEach(lang => {
      stats.languageStats[lang].percentage = Math.round((stats.languageStats[lang].count / totalRepos) * 100);
    });

    return NextResponse.json({ user, stats });
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}
