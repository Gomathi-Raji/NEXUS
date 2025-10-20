import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';

export const runtime = 'nodejs';

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
  
  // Remove any markdown code fence markers that wrap the entire output
  s = s.replace(/^```markdown\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  
  // Convert HTML headings to MD
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, lvl: string, text: string) => {
    const hashes = '#'.repeat(Number(lvl));
    return `\n${hashes} ${text.trim()}\n`;
  });
  // Drop simple wrapper divs and center blocks
  s = s.replace(/<div[^>]*>\s*/gi, '\n').replace(/\s*<\/div>/gi, '\n');
  s = s.replace(/<center[^>]*>\s*/gi, '\n').replace(/\s*<\/center>/gi, '\n');
  // <br> -> newline
  s = s.replace(/<br\s*\/?>(\s*)/gi, '\n');
  // Remove <p> tags
  s = s.replace(/<\/?p[^>]*>/gi, '\n');
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
    .replace(/^[ \t]*```[ \t]*([a-zA-Z0-9_-]+)?[ \t]*$/gm, (m, lang) => `\n\n\`\`\`${lang ? lang.trim() : ''}\n`) // open fence
    .replace(/^[ \t]*\`\`\`[ \t]*$/gm, '```') // trim stray spaces on closing
    .replace(/\n\n\n+/g, '\n\n');

  // Fix shields-style badges: ensure proper format and spacing
  s = s.replace(/\[\[[^\]]+\]\]\((https?:\/\/img\.shields\.io\/[^)]+)\)/g, '![]($1)');
  // Ensure badges are on separate lines for better visibility  
  s = s.replace(/(!\[[^\]]*\]\([^\)]+\))(\s*)(!\[[^\]]*\]\([^\)]+\))/g, '$1\n$3');
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
  const [owner, repoName] = repoFullName.split('/');
  const metaSnippet = `Repository: ${repoFullName}\nDescription: ${repoMeta?.description ?? ''}\nStars: ${repoMeta?.stargazers_count ?? 'N/A'}\nLanguage: ${repoMeta?.language ?? 'N/A'}`;
  const fileSummaries = files.map(f => `---\nPath: ${f.path}\n\n${f.content.substring(0, 4000)}`).join('\n\n');

  return `You are an expert open-source documentation specialist with deep knowledge of GitHub best practices and modern README standards. Generate a stunning, comprehensive, and professional README.md for the repository below.

🎯 **CRITICAL FORMATTING RULES:**
- Output ONLY GitHub-Flavored Markdown (GFM)
- ABSOLUTELY NO HTML tags (<div>, <h3>, <center>, <br>, <p>, etc.)
- Use proper spacing: ONE blank line between sections, before/after lists, code blocks, and tables
- Space after list markers (-, *, +)
- Use fenced code blocks with language hints (bash, typescript, json, etc.)
- All badges MUST use shields.io format: ![Label](https://img.shields.io/...)

📋 **REQUIRED STRUCTURE (in this exact order):**

## 1. Header Section
- Repository title with emoji (choose relevant emoji)
- Compelling one-line tagline
- Comprehensive badge collection (create these badges using shields.io):
  * GitHub stats: ![Stars](https://img.shields.io/github/stars/${owner}/${repoName}?style=for-the-badge&logo=github)
  * ![Forks](https://img.shields.io/github/forks/${owner}/${repoName}?style=for-the-badge&logo=github)
  * ![Issues](https://img.shields.io/github/issues/${owner}/${repoName}?style=for-the-badge&logo=github)
  * ![Pull Requests](https://img.shields.io/github/issues-pr/${owner}/${repoName}?style=for-the-badge&logo=github)
  * License badge (detect from files or use MIT as default)
  * Language badge: ![Language](https://img.shields.io/github/languages/top/${owner}/${repoName}?style=for-the-badge)
  * Last commit: ![Last Commit](https://img.shields.io/github/last-commit/${owner}/${repoName}?style=for-the-badge&logo=github)
  * Package manager badges (npm, yarn, pnpm if applicable)
  * Technology-specific badges (React, Next.js, TypeScript, Python, etc. based on detected tech)
  * Build/CI status (if workflows detected)
  * Code quality badges (CodeClimate, Codecov if applicable)
- ALL badges on separate lines for better visibility

## 2. Overview Section
- Engaging 2-3 sentence description of what the project does
- Key problem it solves
- Target audience/use cases

## 3. ✨ Key Features
- Bulleted list with emojis
- Highlight 5-8 main features
- Be specific and benefit-focused

## 4. 🎯 Demo / Screenshots
- Suggest demo section with placeholder
- Mention live demo URL structure if it's a web app

## 5. 📑 Table of Contents
- Linked navigation to all major sections
- Use proper markdown links

## 6. 🏗️ Architecture Overview
- 2-3 paragraphs explaining high-level architecture
- If complex, include mermaid diagram in code block
- Explain data flow, component structure

## 7. 🛠️ Tech Stack
Create a comprehensive table:

| Category | Technologies | Purpose |
|----------|-------------|---------|
| Frontend | React, Next.js | UI Framework |
| Backend | Node.js, Express | Server |
| Database | PostgreSQL | Data Storage |
| Deployment | Vercel, Docker | Hosting |

## 8. 📋 Prerequisites
- List required software/tools
- Include version requirements
- Link to installation guides

## 9. 🚀 Getting Started

### Installation
Step-by-step commands in code blocks:
\`\`\`bash
# Clone the repository
git clone https://github.com/${owner}/${repoName}.git

# Navigate to directory
cd ${repoName}

# Install dependencies
npm install
\`\`\`

### Configuration
Table of environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| API_KEY | Your API key | Yes | - |
| PORT | Server port | No | 3000 |

### Running the Application
\`\`\`bash
# Development
npm run dev

# Production
npm run build && npm start
\`\`\`

## 10. 📖 Usage
- Provide practical code examples
- Show common use cases
- Include expected outputs

## 11. 📁 Project Structure
\`\`\`
project/
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
├── public/
├── tests/
└── package.json
\`\`\`

## 12. 📜 Available Scripts
Table of all npm/yarn scripts:

| Script | Description | Usage |
|--------|-------------|-------|
| dev | Start development server | \`npm run dev\` |
| build | Build for production | \`npm run build\` |
| test | Run tests | \`npm test\` |

## 13. 🧪 Testing
- Testing framework used
- How to run tests
- Coverage information
- Example test command

## 14. 🗺️ Roadmap
- [ ] Feature 1 - Brief description
- [ ] Feature 2 - Brief description
- [x] Completed feature
- [ ] Future enhancement

## 15. 🤝 Contributing
- Contribution guidelines
- How to submit issues
- Pull request process
- Code of conduct mention

## 16. 📝 API Documentation
(If applicable - skip if not an API/library)
- Endpoint documentation
- Request/response examples

## 17. 🔒 Security
- Security policy mention
- How to report vulnerabilities
- Best practices

## 18. 📄 License
- License type
- Link to LICENSE file
- Copyright notice

## 19. 👥 Authors & Contributors
- Main authors
- How to become a contributor
- Link to contributors page

## 20. 🙏 Acknowledgements
- Credits for libraries/tools used
- Inspiration sources
- Special thanks

## 21. 📞 Support & Contact
- How to get help
- Community links (Discord, Slack, etc.)
- Social media
- Email contact

---

**BADGE CREATION RULES:**
- Use https://img.shields.io/ for ALL badges
- Style: for-the-badge (looks more professional)
- Include logos where applicable (logo=github, logo=typescript, logo=react, etc.)
- Color scheme: use appropriate colors for different badge types
- Format: ![Alt Text](badge-url)

**QUALITY STANDARDS:**
- Professional, clear, and concise writing
- No marketing fluff - be technical and accurate
- Use emojis to enhance readability (but don't overdo it)
- All code blocks must have language specifiers
- Tables must be properly formatted with headers
- Links must be functional
- Derive ALL information from the provided files - be accurate!

${metaSnippet}

Project files (analyze these carefully to extract accurate information):
${fileSummaries}`;
}

export async function POST(req: NextRequest) {
  try {
    const { repo, githubToken, userNotes } = await req.json();
    console.log('Generate README request:', { repo, hasToken: !!githubToken });
    
    if (!repo || typeof repo !== 'string') {
      return NextResponse.json({ error: 'Missing repo parameter' }, { status: 400 });
    }

    const parsed = parseRepo(repo);
    if (!parsed) return NextResponse.json({ error: 'Invalid GitHub repo. Use URL or owner/repo.' }, { status: 400 });

    const { owner, repo: repoName } = parsed;
    console.log('Parsed repo:', { owner, repoName });

    // Basic repo metadata (also validates private access if token provided)
    let repoMeta: GitHubRepoMeta = {};
    try {
      repoMeta = await githubRequest<GitHubRepoMeta>(`/repos/${owner}/${repoName}`, githubToken);
    } catch {
      // Continue gracefully with minimal metadata; include hint in description
      repoMeta = { description: 'Metadata unavailable (GitHub API error or permissions)', stargazers_count: undefined, language: undefined };
    }

    // Collect candidate files and fetch contents
    let candidates: Array<{ path: string; size?: number }> = [];
    try {
      candidates = await getCandidateFiles(owner, repoName, githubToken);
    } catch {
      candidates = [];
    }
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
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_SECOND;
    if (!apiKey) {
      console.error('Missing Gemini API key');
      return NextResponse.json({ error: 'Server misconfigured: GEMINI_API_KEY (or GEMINI_API_KEY_SECOND) missing' }, { status: 500 });
    }

    console.log('Calling Gemini API with', files.length, 'files, prompt length:', finalPrompt.length);

    // Add a timeout to avoid hanging requests (increased for longer generation)
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60_000); // 60 seconds for comprehensive README
    const geminiResp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
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
          temperature: 0.4, // Slightly higher for more creative but still professional output
          maxOutputTokens: 8192, // Increased for comprehensive README with all sections
          topP: 0.95,
          topK: 40
        }
      }),
      signal: ctrl.signal
    }).catch((err) => {
      console.error('Gemini fetch failed:', err);
      throw err;
    }).finally(() => clearTimeout(timeout));

    if (!geminiResp.ok) {
      const text = await geminiResp.text();
      console.error('Gemini API error:', geminiResp.status, text);
      return NextResponse.json({ error: `Gemini error ${geminiResp.status}: ${text}` }, { status: 500 });
    }

    const data = await geminiResp.json();
    console.log('Gemini response received, candidates:', data?.candidates?.length);
    
    // Extract text from Gemini response (robustly join parts)
    try {
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];
      const joined = Array.isArray(parts)
        ? parts
            .map((p: unknown) => {
              const obj = (p as { text?: unknown }) || null;
              const value = obj && typeof obj === 'object' ? obj.text : undefined;
              return typeof value === 'string' ? value : value != null ? String(value) : '';
            })
            .join('')
        : '';
      const fallback = candidate?.output_text || candidate?.text || data?.text || '';
      const rawText = String(joined || fallback || '').trim();
      if (!rawText) {
        console.error('Gemini empty/unknown response shape:', JSON.stringify(data).slice(0, 1000));
        return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
      }
      const cleaned = normalizeMarkdown(rawText);
      console.log('README generated successfully, length:', cleaned.length);
      return NextResponse.json({ markdown: cleaned });
    } catch (ex) {
      console.error('Gemini parse error:', ex);
      return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    console.error('README generation error:', message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}