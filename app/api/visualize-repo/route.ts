import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { GeminiService } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoFullName = searchParams.get('repo');

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  try {
    const github = new GitHubService();
    const gemini = new GeminiService();

    // Fetch README (best-effort)
    let readmeContent: string | undefined;
    try {
      readmeContent = await github.getReadme(repoFullName);
    } catch {
      readmeContent = undefined;
    }

    // Fetch full file tree and a root listing for package.json
    const fileTree = await github.getFullFileTree(repoFullName);
    type FileEntry = { path: string };
    const filePaths: string[] = (fileTree as FileEntry[]).map((n) => n.path);

    // Try to read package.json for deps/scripts
    const [owner, repo] = repoFullName.split('/');
    let dependencies: Record<string, string> | null = null;
    let scripts: Record<string, string> | null = null;
    try {
      const pkg = await github.getFileContent(owner, repo, 'package.json');
      if (pkg) {
        const parsed = JSON.parse(pkg);
        dependencies = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
        scripts = parsed.scripts || null;
      }
    } catch {
      // ignore
    }

    // Categorize a sample of paths to help the LLM structure layers
    const categories = {
      pages: [] as string[],
      apiRoutes: [] as string[],
      components: [] as string[],
      models: [] as string[],
      utils: [] as string[],
      configs: [] as string[],
      workflows: [] as string[]
    };
    for (const p of filePaths) {
      const path = p.toLowerCase();
      if (path.startsWith('app/') || path.includes('/pages/') || path.includes('/page.')) categories.pages.push(p);
      else if (path.includes('/api/') || path.includes('/routes/') || path.includes('route.')) categories.apiRoutes.push(p);
      else if (path.includes('/components/') || path.includes('/ui/')) categories.components.push(p);
      else if (path.includes('model') || path.includes('schema') || path.includes('entity') || path.includes('prisma')) categories.models.push(p);
      else if (path.includes('util') || path.includes('helper') || path.includes('service') || path.includes('/lib/') || path.includes('hook')) categories.utils.push(p);
      else if (path.endsWith('.yml') || path.endsWith('.yaml') || path.endsWith('.json') || path.includes('config') || path.includes('.env') || path.endsWith('.rc')) categories.configs.push(p);
      if (path.startsWith('.github/workflows/')) categories.workflows.push(p);
    }

    const { diagram, prompt } = await gemini.generateDetailedArchitectureDiagram({
      repoFullName,
      readme: readmeContent,
      fileTreeSample: filePaths.slice(0, 400),
      dependencies,
      scripts,
      categories
    });

    return NextResponse.json({ diagram, prompt });
  } catch (error) {
    console.error(`Error visualizing repository ${repoFullName}:`, error);
    return NextResponse.json({ error: 'Failed to visualize repository' }, { status: 500 });
  }
}