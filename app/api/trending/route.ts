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
  // Add fields for Z-score calculation
  z_score?: number;
  stars_velocity?: number;
  activity_score?: number;
  final_trending_score?: number;
  rawTrendingScore?: number;
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

// Z-score calculation for trending detection
// z = (x - μ) / σ where:
// x = current value, μ = mean, σ = standard deviation
function calculateZScore(values: number[]): number[] {
  if (values.length < 2) return values.map(() => 0);
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Avoid division by zero
  if (stdDev === 0) return values.map(() => 0);
  
  return values.map(val => (val - mean) / stdDev);
}

// Calculate trending score using multiple metrics and Z-score
function calculateTrendingScore(repo: TrendingRepo): number {
  const now = new Date();
  const createdAt = new Date(repo.created_at);
  const updatedAt = new Date(repo.updated_at);
  const pushedAt = new Date(repo.pushed_at);
  
  // Calculate age and recency factors
  const ageInDays = Math.max((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24), 1);
  const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const daysSincePush = (now.getTime() - pushedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Stars velocity (stars per day since creation) - this is our primary trending indicator
  const starsVelocity = repo.stargazers_count / ageInDays;
  
  // Recent activity boost - repositories that are actively maintained
  const recentActivityMultiplier = Math.max(
    1 / (1 + daysSinceUpdate / 7), // Recent updates boost
    1 / (1 + daysSincePush / 3)    // Recent pushes boost (more important)
  );
  
  // Engagement score (forks and watchers relative to stars)
  const engagementRatio = repo.stargazers_count > 0 
    ? (repo.forks_count + repo.watchers_count) / repo.stargazers_count 
    : 0;
  
  // Focus on stars velocity as the main trending indicator
  // Recent repos with high star velocity should score higher
  const velocityWeight = ageInDays < 30 ? 2.0 : ageInDays < 90 ? 1.5 : 1.0;
  
  const rawScore = starsVelocity * velocityWeight * recentActivityMultiplier * (1 + engagementRatio * 0.3);
  
  return rawScore;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || '';
    const since = searchParams.get('since') || 'daily';
    const type = searchParams.get('type') || 'repositories'; // repositories or developers

    if (type === 'developers') {
      // Fetch trending developers using a better approach
      const dateRange = getDateRange(since);
      
      try {
        // Search for users who have been active recently (pushed code)
        let query = `type:user`;
        if (language) {
          // Search for users with recent repos in the specified language
          query = `${language} in:readme type:user`;
        }

        const response = await axios.get(`${GITHUB_API}/search/users`, {
          headers: ghHeaders(),
          params: {
            q: query,
            sort: 'repositories',
            order: 'desc',
            per_page: 30,
          },
        });

        const developers = await Promise.all(
          response.data.items.slice(0, 25).map(async (user: { login: string }) => {
            try {
              // Get detailed user info
              const userResponse = await axios.get(`${GITHUB_API}/users/${user.login}`, {
                headers: ghHeaders(),
              });

              // Get user's recent repositories with better error handling
              let popularRepo = null;
              try {
                const reposResponse = await axios.get(`${GITHUB_API}/users/${user.login}/repos`, {
                  headers: ghHeaders(),
                  params: {
                    sort: 'updated',
                    direction: 'desc',
                    per_page: 5,
                  },
                  timeout: 5000, // 5 second timeout
                });

                // Find the most popular recent repository
                const recentRepos = reposResponse.data.filter((repo: TrendingRepo) => {
                  const updatedAt = new Date(repo.updated_at);
                  const cutoff = new Date(dateRange);
                  return updatedAt >= cutoff;
                });

                popularRepo = recentRepos.length > 0 
                  ? recentRepos.reduce((prev: TrendingRepo, current: TrendingRepo) => 
                      prev.stargazers_count > current.stargazers_count ? prev : current)
                  : reposResponse.data[0]; // fallback to most recent repo
              } catch (repoError) {
                console.warn(`Could not fetch repos for ${user.login}:`, repoError);
                // Continue without repo data
              }

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
      } catch (devError) {
        console.error('Developer search failed:', devError);
        return NextResponse.json({
          items: [],
          total_count: 0,
        });
      }
    }

    // Fetch trending repositories using a multi-strategy approach
    const dateRange = getDateRange(since);
    
    try {
      // Strategy 1: Recently updated repos with good star counts
      let query1 = `pushed:>=${dateRange} stars:>=10`;
      if (language) {
        query1 += ` language:${language}`;
      }

      // Strategy 2: Recently created repos that gained traction quickly  
      let query2 = `created:>=${dateRange} stars:>=5`;
      if (language) {
        query2 += ` language:${language}`;
      }

      // Execute both searches in parallel with better error handling
      const [recentlyUpdatedResult, recentlyCreatedResult] = await Promise.allSettled([
        axios.get(`${GITHUB_API}/search/repositories`, {
          headers: ghHeaders(),
          params: {
            q: query1,
            sort: 'updated',
            order: 'desc',
            per_page: 15,
          },
          timeout: 10000, // 10 second timeout
        }),
        axios.get(`${GITHUB_API}/search/repositories`, {
          headers: ghHeaders(),
          params: {
            q: query2,
            sort: 'stars',
            order: 'desc',
            per_page: 15,
          },
          timeout: 10000, // 10 second timeout
        })
      ]);

      // Extract successful results
      const recentlyUpdated = recentlyUpdatedResult.status === 'fulfilled' ? recentlyUpdatedResult.value : { data: { items: [] } };
      const recentlyCreated = recentlyCreatedResult.status === 'fulfilled' ? recentlyCreatedResult.value : { data: { items: [] } };

      // Combine and deduplicate results
      const allRepos = [...recentlyUpdated.data.items, ...recentlyCreated.data.items];
      const uniqueRepos = allRepos.filter((repo, index, arr) => 
        arr.findIndex(r => r.id === repo.id) === index
      );

      // Calculate trending scores for all repos
      const scoredRepos = uniqueRepos.map(repo => {
        const score = calculateTrendingScore(repo);
        return { ...repo, rawTrendingScore: score };
      });

      // Calculate Z-scores for statistical trending detection
      const rawScores = scoredRepos.map(repo => repo.rawTrendingScore);
      const zScores = calculateZScore(rawScores);
      
      // Combine raw scores with Z-scores for final trending score
      const finalScoredRepos = scoredRepos.map((repo, index) => {
        const zScore = zScores[index];
        
        // Z-score based trending: only positive Z-scores should rank high
        // z > 1.5: Highly trending (significant statistical anomaly)
        // z > 0.5: Moderately trending (above average)
        // z > 0: Slightly trending (above mean)
        // z <= 0: Not trending (below or at mean)
        
        let finalScore;
        if (zScore > 1.5) {
          // Highly trending - major boost
          finalScore = repo.rawTrendingScore * (1 + zScore * 1.0);
        } else if (zScore > 0.5) {
          // Moderately trending - moderate boost  
          finalScore = repo.rawTrendingScore * (1 + zScore * 0.7);
        } else if (zScore > 0) {
          // Slightly trending - small boost
          finalScore = repo.rawTrendingScore * (1 + zScore * 0.3);
        } else {
          // Not trending - significant penalty for negative Z-scores
          finalScore = repo.rawTrendingScore * Math.max(0.1, 1 + zScore * 0.5);
        }
        
        return {
          ...repo,
          z_score: zScore,
          final_trending_score: finalScore,
          stars_velocity: repo.stargazers_count / Math.max(
            (new Date().getTime() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24), 
            1
          ),
        };
      });

      // Sort by final trending score and take top 25
      const trendingRepos = finalScoredRepos
        .sort((a, b) => b.final_trending_score - a.final_trending_score)
        .slice(0, 25);

        const repos: TrendingRepo[] = trendingRepos;

      return NextResponse.json({
        items: repos,
        total_count: repos.length,
        // Add debugging info for Z-score algorithm
        debug: process.env.NODE_ENV === 'development' ? {
          algorithm: 'Z-score based trending detection',
          z_score_explanation: 'z = (x - μ) / σ where x=score, μ=mean, σ=std_dev',
          scoring_rules: {
            'z > 1.5': 'Highly trending (major boost)',
            'z > 0.5': 'Moderately trending (moderate boost)', 
            'z > 0': 'Slightly trending (small boost)',
            'z <= 0': 'Not trending (penalty applied)'
          },
          dataset_stats: {
            total_repos: finalScoredRepos.length,
            mean_z_score: (zScores.reduce((a, b) => a + b, 0) / zScores.length).toFixed(3),
            positive_z_count: zScores.filter(z => z > 0).length,
            highly_trending_count: zScores.filter(z => z > 1.5).length
          },
          top_results: repos.slice(0, 10).map(r => ({
            name: r.full_name,
            z_score: r.z_score?.toFixed(2),
            stars_velocity: r.stars_velocity?.toFixed(3),
            stars: r.stargazers_count,
            age_days: Math.floor((new Date().getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)),
            final_score: r.final_trending_score?.toFixed(3)
          }))
        } : undefined
      });

    } catch (searchError) {
      console.error('Advanced trending search failed, falling back to simple search:', searchError);
      
      // Fallback to simple search if advanced approach fails
      let fallbackQuery = `stars:>=10`;
      if (language) {
        fallbackQuery += ` language:${language}`;
      }
      
      const fallbackResponse = await axios.get(`${GITHUB_API}/search/repositories`, {
        headers: ghHeaders(),
        params: {
          q: fallbackQuery,
          sort: 'updated',
          order: 'desc',
          per_page: 25,
        },
      });

      return NextResponse.json({
        items: fallbackResponse.data.items,
        total_count: fallbackResponse.data.total_count,
      });
    }

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
