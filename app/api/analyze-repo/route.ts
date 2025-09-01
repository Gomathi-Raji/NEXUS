import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';
import { GeminiService } from '@/lib/gemini';

// List of common source code extensions to prioritize for analysis
const SOURCE_CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', // JavaScript/TypeScript
  '.py', // Python
  '.go', // Go
  '.java', // Java
  '.cs', // C#
  '.rb', // Ruby
  '.php', // PHP
  '.rs', // Rust
  '.c', '.cpp', '.h', '.hpp', // C/C++
  '.swift', // Swift
  '.kt', '.kts', // Kotlin
  'Dockerfile',
  'Makefile',
  '.yml', '.yaml', // Config files
  '.json',
  '.md' // Markdown files
];

// Increase the analysis breadth to provide richer insights on /analyze
const MAX_FILES_TO_ANALYZE = 120;

// Directories to prioritize when sampling files for analysis
const PRIORITY_DIRS = [
  'src/', 'app/', 'pages/', 'components/', 'lib/', 'utils/', 'hooks/', 'server/',
  'api/', 'routes/', 'models/', 'schemas/', 'types/', 'interfaces/', 'controllers/',
  'services/', 'store/', '.github/workflows/'
];

// Important repo root files to include when present
const IMPORTANT_ROOT_FILES = [
  'README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'package.json', 'pnpm-lock.yaml',
  'yarn.lock', 'package-lock.json', 'tsconfig.json', 'jsconfig.json', 'next.config.js',
  'next.config.mjs', 'vite.config.ts', 'vite.config.js', '.eslintrc', '.eslintrc.js',
  '.prettierrc', '.prettierrc.json', 'docker-compose.yml', 'Dockerfile'
];

function isSourceFile(path: string): boolean {
  return SOURCE_CODE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

type Category = 'components' | 'pages' | 'apis' | 'dataModels' | 'utilities' | 'configurations' | 'other';

function categorizePath(p: string): Category {
  const path = p.toLowerCase();
  if (path.includes('component') || path.includes('/ui/') || path.includes('/components/')) return 'components';
  if (path.includes('/pages/') || path.includes('/page.') || path.includes('/views/') || path.startsWith('app/')) return 'pages';
  if (path.includes('/api/') || path.includes('controller') || path.includes('route.') || path.includes('endpoint') || path.includes('/routes/')) return 'apis';
  if (path.includes('model') || path.includes('schema') || path.includes('entity') || path.includes('type') || path.includes('interface')) return 'dataModels';
  if (path.includes('util') || path.includes('helper') || path.includes('service') || path.includes('lib') || path.includes('hook') || path.includes('/store/')) return 'utilities';
  if (path.includes('config') || path.endsWith('.json') || path.endsWith('.yml') || path.endsWith('.yaml') || path.includes('.env') || path.endsWith('.rc')) return 'configurations';
  return 'other';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  const [owner, repo] = repoFullName.split('/');
  const github = new GitHubService();
  const gemini = new GeminiService();

  try {
    // 1. Get the full file tree
    const fileTree = await github.getFullFileTree(repoFullName);

    // 2. Build candidate lists with prioritization and ensure per-category representation
    type FileEntry = { path: string };
    const allSource: FileEntry[] = (fileTree as FileEntry[]).filter((f) => isSourceFile(f.path));

    // Buckets by category
    const buckets: Record<Category, string[]> = {
      components: [], pages: [], apis: [], dataModels: [], utilities: [], configurations: [], other: []
    };
    for (const f of allSource) {
      buckets[categorizePath(f.path)].push(f.path);
    }

    // Start with important root files if present
    const selectedSet = new Set<string>();
    for (const name of IMPORTANT_ROOT_FILES) {
      const found = allSource.find((f) => f.path === name);
      if (found) selectedSet.add(found.path);
    }

    // Ensure at least a few examples per category (aim for 5, min 3 where possible)
    const MIN_PER_CATEGORY = 3;
    const TARGET_PER_CATEGORY = 5;
    (['components', 'pages', 'apis', 'dataModels', 'utilities', 'configurations'] as Category[]).forEach((cat) => {
      const arr = buckets[cat];
      const takeCount = Math.min(TARGET_PER_CATEGORY, Math.max(MIN_PER_CATEGORY, arr.length));
      for (let i = 0; i < takeCount && i < arr.length; i++) selectedSet.add(arr[i]);
    });

    // Prefer files inside priority directories next
    const priorityCandidates = allSource
      .filter((f) => PRIORITY_DIRS.some((d) => f.path.startsWith(d)))
      .map((f) => f.path);
    for (const p of priorityCandidates) {
      if (selectedSet.size >= MAX_FILES_TO_ANALYZE) break;
      selectedSet.add(p);
    }

    // Fill the rest from any remaining source files
    for (const f of allSource) {
      if (selectedSet.size >= MAX_FILES_TO_ANALYZE) break;
      selectedSet.add(f.path);
    }

    const relevantFiles = Array.from(selectedSet).slice(0, MAX_FILES_TO_ANALYZE).map((path) => ({ path }));

    if (relevantFiles.length === 0) {
      return NextResponse.json({ summaries: [], message: 'No relevant source code files were found to analyze.' });
    }

    // 3. Fetch content for each relevant file
    const filesWithContent = await Promise.all(
      relevantFiles.map(async (file) => {
        try {
          const content = await github.getFileContent(owner, repo, file.path);
          // Return null for empty files so they can be filtered out
          if (content === null) return null;
          return { path: file.path, content };
        } catch {
          console.warn(`Could not fetch content for ${file.path}, skipping.`);
          return null; // Skip files that fail to fetch
        }
      })
    );

    const validFiles = filesWithContent.filter(f => f !== null) as { path: string; content: string }[];

    if (validFiles.length === 0) {
      throw new Error('Could not fetch content for any of the relevant files.');
    }

    // 4. Use Gemini to summarize the files
    const summaries = await gemini.summarizeFiles(validFiles);

    return NextResponse.json({ summaries });

  } catch (error) {
    console.error(`[ANALYZE_REPO_API] Error analyzing ${repoFullName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
    return NextResponse.json({ error: `Failed to analyze repository: ${errorMessage}` }, { status: 500 });
  }
}
