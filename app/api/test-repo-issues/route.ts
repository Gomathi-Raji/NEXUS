import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repo = searchParams.get('repo') || 'microsoft/vscode';
  const labels = searchParams.get('labels') || 'good-first-issue,good first issue,help-wanted';

  try {
    const githubService = new GitHubService();
    
    console.log(`Testing repository: ${repo}`);
    console.log(`Testing labels: ${labels}`);
    
    // Get issues with labels
    const issues = await githubService.getRepositoryIssues(repo, 'open', 10, 1, labels);
    
    console.log(`Found ${issues.length} issues with labels`);
    
    // Also try without labels to see total issues
    const allIssues = await githubService.getRepositoryIssues(repo, 'open', 10, 1);
    
    console.log(`Found ${allIssues.length} total issues`);
    
    return NextResponse.json({
      repository: repo,
      labels_searched: labels,
      issues_with_labels: issues.length,
      total_issues: allIssues.length,
      sample_labeled_issues: issues.slice(0, 3).map(issue => ({
        number: issue.number,
        title: issue.title,
        labels: issue.labels.map(l => l.name)
      })),
      sample_all_issues: allIssues.slice(0, 3).map(issue => ({
        number: issue.number,
        title: issue.title,
        labels: issue.labels.map(l => l.name)
      }))
    });
  } catch (error) {
    console.error('Error testing repository issues:', error);
    return NextResponse.json({ 
      error: 'Failed to test repository issues',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
