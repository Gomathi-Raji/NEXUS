import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

// Helper: parse owner/repo from URL or raw string
function parseRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  // Match full GitHub URL
  const urlMatch = trimmed.match(/https?:\/\/github\.com\/(?:#?@)?([^\/?#]+)\/([^\/?#]+)(?:\.git)?/i);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };

  // Match owner/repo format
  const simpleMatch = trimmed.match(/^([^\s\/]+)\/([^\s\/]+)$/);
  if (simpleMatch) return { owner: simpleMatch[1], repo: simpleMatch[2] };

  return null;
}

// Minimal GitHub repo metadata used in this module
interface GitHubRepoMeta {
  description?: string | null;
  stargazers_count?: number;
  language?: string | null;
}

// GitHub API helpers
async function githubRequest<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'WhatToBuild-Readme-Generator'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`https://api.github.com${path}`, { headers, ...init });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status}: ${text}`);
  }
  return resp.json() as Promise<T>;
}

// Fetch a list of candidate file paths using git trees API (recursive)
async function getCandidateFiles(owner: string, repo: string, token?: string): Promise<Array<{ path: string; size?: number }>> {
  // Get default branch
  const repoInfo = await githubRequest<{ default_branch: string }>(`/repos/${owner}/${repo}` , token);
  const branch = repoInfo.default_branch || 'main';

  // Get tree recursively
  const tree = await githubRequest<{ tree: Array<{ path: string; type: string; size?: number }> }>(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    token
  );

  // Filter files of interest and limit count/size
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.rb', '.java', '.cs', '.php', '.kt', '.swift', '.md', '.json', '.yml', '.yaml'];
  const importantNames = ['README.md', 'readme.md', 'package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml', 'composer.json', 'Makefile', 'Dockerfile', 'docker-compose.yml', 'pnpm-lock.yaml', 'yarn.lock'];

  const files = tree.tree.filter(n => n.type === 'blob').map(n => ({ path: n.path, size: n.size }))
    .filter(f => importantNames.includes(f.path.split('/').pop() || '') || exts.some(e => f.path.endsWith(e)));

  // Prioritize docs and root files
  const scored = files.map(f => {
    let score = 0;
    const p = f.path.toLowerCase();
    if (p === 'readme.md') score += 100;
    if (p.includes('readme')) score += 20;
    if (p.startsWith('docs/')) score += 30;
    if (!p.includes('/')) score += 25; // root files
    if (p.endsWith('.md')) score += 15;
    if (p.endsWith('package.json')) score += 40;
    if (p.endsWith('dockerfile')) score += 20;
    if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx')) score += 5;
    return { ...f, score };
  })
  .sort((a, b) => b.score - a.score);

  // Limit total files and cumulative size to keep prompt manageable
  const MAX_FILES = 40;
  const MAX_TOTAL_BYTES = 600_000; // ~600KB
  const selected: Array<{ path: string; size?: number }> = [];
  let total = 0;
  for (const f of scored) {
    const size = f.size ?? 0;
    if (selected.length >= MAX_FILES) break;
    if (size > 150_000) continue; // skip very large files
    if (total + size > MAX_TOTAL_BYTES) continue;
    selected.push({ path: f.path, size });
    total += size;
  }
  return selected;
}

async function getFileContent(owner: string, repo: string, path: string, token?: string): Promise<string> {
  // Use contents API which returns base64 for blobs
  const data = await githubRequest<{ content?: string; encoding?: string; download_url?: string; type: string }>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token
  );
  if (data.type !== 'file') return '';
  if (data.content && data.encoding === 'base64') {
    try {
      // Node at edge runtime may not have Buffer; use atob polyfill alternative
      const buff = Buffer.from(data.content, 'base64');
      return buff.toString('utf-8');
    } catch {
      // Fallback to direct download
      if (data.download_url) {
        const resp = await fetch(data.download_url);
        return await resp.text();
      }
    }
  }
  if (data.download_url) {
    const resp = await fetch(data.download_url);
    return await resp.text();
  }
  return '';
}

// Normalize generated Markdown to be clean GitHub-flavored Markdown (no stray HTML, proper spacing)
function normalizeMarkdown(input: string): string {
  let s = input || '';
  // Convert HTML headings to MD
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl: string, text: string) => {
    const hashes = '#'.repeat(Number(lvl));
    return `\n${hashes} ${text.trim()}\n`;
  });
  // Drop simple wrapper divs and center blocks
  s = s.replace(/<div[^>]*>\s*/gi, '\n').replace(/\s*<\/div>/gi, '\n');
  // <br> -> newline
  s = s.replace(/<br\s*\/?>(\s*)/gi, '\n');
  // Ensure space after list markers
  s = s.replace(/^(\s*)([-*+])(\S)/gm, '$1$2 $3');
  // Ensure blank lines before common blocks
  s = s
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    .replace(/([^\n])\n(\s*[-*+] )/g, '$1\n\n$2')
    .replace(/([^\n])\n(```)/g, '$1\n\n$2')
    .replace(/([^\n])\n(> )/g, '$1\n\n$2');
  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n');
  // Standardize code fences (```lang) and ensure isolated lines
  s = s
    .replace(/^[ \t]*```[ \t]*([a-zA-Z0-9_-]+)?[ \t]*$/gm, (m, lang) => `\n\n\
\`\`\`${lang ? lang.trim() : ''}\n`) // open fence
    .replace(/^[ \t]*\`\`\`[ \t]*$/gm, '```') // trim stray spaces on closing
    .replace(/\n\n\n+/g, '\n\n');

  // Fix shields-style badges accidentally written as [[Label]](url)
  s = s.replace(/\[\[[^\]]+\]\]\((https?:\/\/img\.shields\.io\/[^)]+)\)/g, '![]($1)');
  // Also convert [![alt](img)](link) preserved; no change needed
  // Merge consecutive badge image lines into a single line
  s = s.replace(/(?:^!\[[^\]]*\]\([^\)]+\)\s*\n){2,}/gm, (block) => block.trim().split(/\n+/).join(' ')+"\n\n");

  // Ensure tables have header separator if missing (simple 3+ col case)
  s = s.replace(/\n(\|[^\n]*\|)\n(?!\|?\s*-)/g, (m, header) => {
    const cols = header.split('|').filter(Boolean).length;
    const sep = '|' + Array(cols).fill('---').join('|') + '|';
    return `\n${header}\n${sep}\n`;
  });
  // Ensure blank lines around tables
  s = s.replace(/\n([^\n]*\|[^\n]*\n\s*\|?\s*-+[^\n]*\n[\s\S]*?(?=\n\n|$))/g, (m, tbl) => `\n\n${tbl}\n\n`);
  // Robust table reconstruction: collapse inner blanks, ensure single table block
  {
    const lines = s.split('\n');
    const out: string[] = [];
    let i = 0;
    const isTableLine = (ln: string) => /^\s*\|.*\|\s*$/.test(ln);
    const isSepLine = (ln: string) => /^\s*\|?\s*[-: ]+\|[-:| ]+.*$/.test(ln);
    while (i < lines.length) {
      if (isTableLine(lines[i])) {
        const block: string[] = [];
        while (i < lines.length && (isTableLine(lines[i]) || isSepLine(lines[i]) || lines[i].trim() === '')) {
          if (lines[i].trim() !== '') block.push(lines[i].trim());
          i++;
        }
        if (block.length) {
          const header = block[0];
          const colCount = header.split('|').filter(Boolean).length;
          const hasSep = block[1] && isSepLine(block[1]);
          const sep = '|' + Array(colCount).fill('---').join('|') + '|';
          const fixed = hasSep ? block : [header, sep, ...block.slice(1)];
          if (out.length && out[out.length - 1] !== '') out.push('');
          out.push(...fixed);
          out.push('');
        }
        continue;
      }
      out.push(lines[i]);
      i++;
    }
    s = out.join('\n');
  }
  // Trim trailing whitespace
  s = s.replace(/[ \t]+$/gm, '');
  return s.trim() + '\n';
}

function buildPrompt(repoFullName: string, repoMeta: GitHubRepoMeta, files: Array<{ path: string; content: string }>) {
  const metaSnippet = `Repository: ${repoFullName}\nDescription: ${repoMeta?.description ?? ''}\nStars: ${repoMeta?.stargazers_count ?? 'N/A'}\nLanguage: ${repoMeta?.language ?? 'N/A'}`;
  const fileSummaries = files.map(f => `---\nPath: ${f.path}\n\n${f.content.substring(0, 4000)}`).join('\n\n');

  return `You are an expert open-source maintainer. Generate a comprehensive, professional README.md for the repository below.\n\nStrict formatting rules:\n- Output must be GitHub-Flavored Markdown (GFM) only.\n- Do NOT use raw HTML tags (no <div>, <h3>, <center>, etc.).\n- Ensure proper spacing:\n  - Exactly one blank line between sections and before/after lists, code blocks, and tables.\n  - A space after list markers (-, *, +).\n- Use fenced code blocks with language hints.\n\nContent requirements (use this exact section order unless user notes say otherwise):\n1. Title and short description\n2. Badges (build, license, package, coverage if applicable)\n3. Table of Contents\n4. Key Features (bulleted)\n5. Architecture Overview (1–2 paragraphs + optional diagram code block)\n6. Tech Stack (as a table)\n7. Getting Started (installation, prerequisites)\n8. Configuration (as a table of env vars)\n9. Usage (code examples)\n10. Project Structure (tree in a fenced code block)\n11. Scripts (as a table of npm/pnpm/yarn scripts, if relevant)\n12. Roadmap (checkbox task list)\n13. Contributing\n14. Testing\n15. License\n16. Acknowledgements\n\nTables — use these schemas exactly and include a blank line before and after each table:\n- Tech Stack:\n\n| Area | Tool | Version |\n|---|---|---|\n| Frontend | Next.js | 15.x |\n\n- Configuration:\n\n| ENV | Description | Example |\n|---|---|---|\n| NEXT_PUBLIC_API | Public API base URL | https://api.example.com |\n\n- Scripts (skip if not applicable):\n\n| Command | Description |\n|---|---|\n| dev | Start local dev server |\n\nRoadmap format (example):\n\n- [ ] Improve documentation\n- [ ] Add e2e tests\n- [ ] Publish Docker image\n\nPrefer concise, actionable content. Derive details from the provided files and metadata. If something is unknown, suggest sensible defaults and placeholders.\n\n${metaSnippet}\n\nProject files (samples):\n${fileSummaries}`;
}

export async function POST(req: NextRequest) {
  try {
    const { repo, githubToken, userNotes } = await req.json();
    if (!repo || typeof repo !== 'string') {
      return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
    }

    const parsed = parseRepo(repo);
    if (!parsed) return NextResponse.json({ error: 'Invalid GitHub repo. Use URL or owner/repo.' }, { status: 400 });

    const { owner, repo: repoName } = parsed;

    // Basic repo metadata (also validates private access if token provided)
    const repoMeta = await githubRequest<GitHubRepoMeta>(`/repos/${owner}/${repoName}`, githubToken);

    // Collect candidate files and fetch contents
    const candidates = await getCandidateFiles(owner, repoName, githubToken);
    const files: Array<{ path: string; content: string }> = [];
    for (const f of candidates) {
      try {
        const content = await getFileContent(owner, repoName, f.path, githubToken);
        if (content) files.push({ path: f.path, content });
      } catch {
        // Skip unreadable files
      }
    }

    // Build prompt
    const basePrompt = buildPrompt(`${owner}/${repoName}`, repoMeta, files);
    const finalPrompt = userNotes && typeof userNotes === 'string' && userNotes.trim().length
      ? `${basePrompt}\n\nAdditional author notes/preferences:\n${userNotes}`
      : basePrompt;

    // Call Gemini server-side using env key
    const apiKey = process.env.GEMINI_API_KEY_SECOND;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server misconfigured: GEMINI_API_KEY_SECOND missing' }, { status: 500 });
    }

    const geminiResp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: finalPrompt }] }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096
        }
      })
    });

    if (!geminiResp.ok) {
      const text = await geminiResp.text();
      return NextResponse.json({ error: `Gemini error ${geminiResp.status}: ${text}` }, { status: 500 });
    }

    const data = await geminiResp.json();
    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
    }
    const cleaned = normalizeMarkdown(text);
    
    return NextResponse.json({ markdown: cleaned });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
