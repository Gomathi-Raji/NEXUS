import { NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET() {
  try {
    const hasToken = !!process.env.GITHUB_TOKEN;
    
    if (!hasToken) {
      return NextResponse.json({
        hasToken: false,
        error: 'GITHUB_TOKEN not configured in environment variables'
      });
    }

    // Test the token by making a simple API call
    const githubService = new GitHubService();
    
    try {
      // Make a lightweight API call to check rate limits
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'NEXUS-App'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API responded with status ${response.status}`);
      }

      const rateLimitData = await response.json();
      
      return NextResponse.json({
        hasToken: true,
        rateLimitRemaining: rateLimitData.rate.remaining,
        rateLimitReset: new Date(rateLimitData.rate.reset * 1000),
        rateLimitLimit: rateLimitData.rate.limit
      });

    } catch (apiError) {
      return NextResponse.json({
        hasToken: true,
        error: apiError instanceof Error ? apiError.message : 'Failed to validate GitHub token'
      });
    }

  } catch (error) {
    return NextResponse.json({
      hasToken: false,
      error: 'Failed to check GitHub API status'
    }, { status: 500 });
  }
}