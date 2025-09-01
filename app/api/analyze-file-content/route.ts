import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { GeminiService } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');
  const filePath = searchParams.get('path');

  if (!repoFullName || !filePath) {
    return NextResponse.json({ error: 'Repository name and file path are required' }, { status: 400 });
  }

  try {
    const githubService = new GitHubService();
    const [owner, repo] = repoFullName.split('/');
    
    // Get file content
    const fileContent = await githubService.getFileContent(owner, repo, filePath);
    
    if (!fileContent) {
      return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 404 });
    }
    
    // Use Gemini to analyze the file content
    const geminiService = new GeminiService();
    const analysis = await geminiService.summarizeFiles([{ path: filePath, content: fileContent }]);
    
    // Return the analysis result
    return NextResponse.json({
      path: filePath,
      content: fileContent,
      analysis: analysis[0]?.summary || 'No analysis available',
    });
  } catch (error) {
    console.error(`Error analyzing file content for ${filePath} in ${repoFullName}:`, error);
    return NextResponse.json({ error: 'Failed to analyze file content' }, { status: 500 });
  }
}