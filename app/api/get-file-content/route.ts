import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');
  const filePath = searchParams.get('path');

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  const [owner, repo] = repoFullName.split('/');
  const github = new GitHubService();

  try {
    // Get file content from GitHub
    const content = await github.getFileContent(owner, repo, filePath);
    
    if (content === null) {
      return NextResponse.json({ error: 'File content not found or empty' }, { status: 404 });
    }

    // Get file extension to determine language
    const extension = filePath.split('.').pop() || '';
    
    return NextResponse.json({ 
      content,
      path: filePath,
      language: extension,
      repo: repoFullName
    });

  } catch (error) {
    console.error(`[GET_FILE_CONTENT_API] Error fetching ${filePath} from ${repoFullName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the file.';
    return NextResponse.json({ error: `Failed to fetch file content: ${errorMessage}` }, { status: 500 });
  }
}