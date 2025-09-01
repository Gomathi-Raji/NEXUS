import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET() {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    // Test GitHub API connection
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WhatToBuild-App'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'GitHub API error', 
        status: response.status,
        statusText: response.statusText 
      }, { status: 500 });
    }

    const userData = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'GitHub API connection successful',
      user: userData.login,
      rateLimit: {
        remaining: response.headers.get('X-RateLimit-Remaining'),
        limit: response.headers.get('X-RateLimit-Limit'),
        reset: response.headers.get('X-RateLimit-Reset')
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to connect to GitHub API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
