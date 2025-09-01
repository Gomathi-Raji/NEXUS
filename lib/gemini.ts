import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in the environment variables');
}
console.log('Using Gemini API Key:', apiKey ? `loaded (ends with ${apiKey.slice(-4)})` : 'not loaded');

const genAI = new GoogleGenerativeAI(apiKey);

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  keywords: string[];
}

export interface CodeSnippet {
  language: string;
  snippet: string;
}

export interface Step {
  id: string;
  title: string;
  explanation: string;
  code?: CodeSnippet;
  shellCommand?: string;
}

export interface ProjectPlan {
  idea: ProjectIdea;
  steps: Step[];
  flowchart: string; // Mermaid diagram
  architectureDiagram: string; // Mermaid diagram
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  description: string;
  language: string;
  topics: string[];
  stargazers_count: number;
}

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  constructor() {
    console.log('GeminiService initialized with model: gemini-2.5-flash');
  }

  async generateDetailedArchitectureDiagram(context: {
    repoFullName: string;
    readme?: string;
    fileTreeSample: string[]; // list of file paths
    dependencies?: Record<string, string> | null;
    scripts?: Record<string, string> | null;
    categories: Record<string, string[]>; // e.g., pages, apiRoutes, components, models, utils, configs, workflows
  }): Promise<{ diagram: string; prompt: string }> {
    const { repoFullName, readme, fileTreeSample, dependencies, scripts, categories } = context;

    const system = `You are a principal software architect. Using the provided repository context, produce a highly readable, detailed Mermaid flowchart that helps a developer understand the full system. Use subgraphs for layers and group related nodes. Keep labels short, avoid parentheses/brackets in labels, and prefer 1-3 word titles. Show external services (e.g., GitHub Actions, databases, third-party APIs) as nodes too.`;

    const guidance = `
Return JSON:
{"diagram": "graph TD..."}

Diagram requirements:
- Use graph TD
- Use subgraphs in this order if applicable: Client(UI) -> Routing -> Controllers/Handlers -> Services/Business -> Data Access -> Data Stores -> External Integrations -> CI/CD
- From Pages/UI to API routes, then to services/utils, then to models/db, show edges accordingly
- Include up to 12 nodes per layer; prefer representative entries from categories provided
- Show technology hints in node labels with a short suffix (e.g., "Next.js", "Prisma", "MongoDB") only if concise
- Always include legend subgraph explaining edge directions and symbols
- Keep arrows simple: -->
- No code blocks or markdown fences; only the JSON
`;

    const input = {
      repo: repoFullName,
      overview: {
        dependencies: dependencies || null,
        scripts: scripts || null
      },
      categories,
      fileTreeSample: fileTreeSample.slice(0, 300),
      readmePreview: readme ? readme.slice(0, 8000) : null
    };

    const prompt = `${system}\n${guidance}\nContext:\n${JSON.stringify(input, null, 2)}`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON object with diagram found');
      const parsed = JSON.parse(jsonMatch[0]);
      let diagram = typeof parsed.diagram === 'string' ? parsed.diagram : '';
      if (!diagram.trim().startsWith('graph')) throw new Error('Invalid diagram format');
      diagram = this.ensureMermaidDarkTheme(this.cleanMermaidDiagram(diagram));
      return { diagram, prompt };
    } catch (err) {
      console.error('Error generating detailed architecture diagram:', err);
      throw err;
    }
  }

  private cleanMermaidDiagram(diagram: string): string {
    // Just basic cleaning - React Flow will handle the rest
    let cleaned = diagram.replace(/<[^>]*>/g, ''); // Remove HTML
    cleaned = cleaned.replace(/[\u2013\u2014\u2015]/g, '-'); // Fix dashes
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"'); // Fix quotes
    cleaned = cleaned.replace(/\([^)]*\)/g, ''); // Remove parentheses
    return cleaned.trim();
  }

  private ensureMermaidDarkTheme(diagram: string): string {
    const initHeader = "%%{init: { 'theme': 'dark', 'themeVariables': { 'primaryColor': '#0f172a', 'primaryTextColor': '#e5e7eb', 'primaryBorderColor': '#475569', 'lineColor': '#64748b', 'secondaryColor': '#111827', 'tertiaryColor': '#0b1220', 'fontSize': '14px', 'edgeLabelBackground':'#0b1220' }, 'flowchart': { 'nodeSpacing': 50, 'rankSpacing': 60, 'htmlLabels': true } }}%%\n";
    if (diagram.startsWith('%%{init:')) return diagram; // already themed
    return initHeader + diagram;
  }

  async generateProjectIdea(prompt: string): Promise<ProjectIdea> {
    const systemPrompt = `
You are an expert software architect and project planner. Generate a detailed project idea based on the user's prompt.

Return a JSON object with the following structure:
{
  "title": "Project name",
  "description": "Detailed description of what the project does",
  "techStack": ["technology1", "technology2"],
  "mustHaveFeatures": ["feature1", "feature2"],
  "niceToHaveFeatures": ["feature1", "feature2"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedTime": "X weeks/months",
  "keywords": ["keyword1", "keyword2"] // for GitHub search
}

Make it practical, achievable, and exciting to build.
`;

    const result = await this.model.generateContent([
      { text: systemPrompt },
      { text: `User prompt: ${prompt}` }
    ]);

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse project idea from Gemini response');
  }

  async generateProjectPlan(idea: ProjectIdea, userSkills: Record<string, number>): Promise<ProjectPlan> {
    const systemPrompt = `
You are an expert software architect. Create a detailed step-by-step build plan for the given project idea.
Consider the user's skill levels (1-5 scale) when creating explanations.

Return a JSON object with:
{
  "idea": ${JSON.stringify(idea)},
  "steps": [
    {
      "id": "step-1",
      "title": "Step title",
      "explanation": "What this step accomplishes",
      "code": {
        "language": "javascript",
        "snippet": "console.log('Hello World');"
      },
      "shellCommand": "npm install example"
    }
  ],
  "flowchart": "mermaid flowchart syntax",
  "architectureDiagram": "mermaid architecture diagram syntax"
}

User skills: ${JSON.stringify(userSkills)}
Adjust complexity based on skill levels.
`;

    const result = await this.model.generateContent([
      { text: systemPrompt },
      { text: `Project: ${JSON.stringify(idea)}` }
    ]);

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse project plan from Gemini response');
  }

  async generateAIIDEPrompt(projectPlan: ProjectPlan): Promise<string> {
    const systemPrompt = `
Generate a comprehensive prompt that a user can paste into an AI IDE (like Cursor, Windsurf, etc.) to build the entire project.

The prompt should include:
1. Clear project overview
2. Complete tech stack and dependencies
3. Detailed file structure
4. Step-by-step implementation guide
5. Code examples and snippets
6. Configuration files needed
7. Environment setup instructions

Make it actionable and complete so the AI IDE can build the entire project.
`;

    const result = await this.model.generateContent([
      { text: systemPrompt },
      { text: `Project Plan: ${JSON.stringify(projectPlan)}` }
    ]);

    return result.response.text();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async analyzeRepository(repoData: any): Promise<{
    architecture: string;
    dependencies: string;
    complexity: number;
    highlights: string[];
  }> {
    const systemPrompt = `
Analyze this GitHub repository and provide:
1. Architecture diagram in Mermaid syntax
2. Dependency graph in Mermaid syntax
3. Complexity score (1-10)
4. Key highlights/features

Return JSON format:
{
  "architecture": "mermaid diagram",
  "dependencies": "mermaid dependency graph",
  "complexity": 7,
  "highlights": ["feature1", "feature2"]
}
`;

    const result = await this.model.generateContent([
      { text: systemPrompt },
      { text: `Repository data: ${JSON.stringify(repoData)}` }
    ]);

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse repository analysis');
  }

  async rankRepositories(repos: GitHubRepo[], query: string): Promise<GitHubRepo[]> {
    const systemPrompt = `
You are a senior software engineer tasked with evaluating open-source projects. Based on the user's query, rank the following GitHub repositories for relevance. 

User Query: "${query}"

For each repository, provide a relevance score from 0.0 to 1.0 (where 1.0 is a perfect match) and a brief, one-sentence reasoning for your score. Consider the repository's description, topics, and language.

Return a JSON array with the following structure for each repository:
[
  {
    "id": <repository_id>,
    "relevance_score": <score_between_0.0_and_1.0>,
    "relevance_reasoning": "<one_sentence_explanation>"
  }
]

Here are the repositories to rank:
`;

    const repoData = repos.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics
    }));

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: JSON.stringify(repoData, null, 2) }
      ]);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/(\[[\s\S]*\])/);
      if (!jsonMatch) {
        throw new Error('Failed to find JSON array in Gemini response for ranking.');
      }
      const rankings: { id: number; relevance_score: number; relevance_reasoning: string }[] = JSON.parse(jsonMatch[0]);

      const rankedRepoMap = new Map(rankings.map(r => [r.id, r]));

      const mergedRepos = repos.map(repo => {
        const ranking = rankedRepoMap.get(repo.id);
        return {
          ...repo,
          relevance_score: ranking?.relevance_score,
          relevance_reasoning: ranking?.relevance_reasoning
        };
      });

      return mergedRepos.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    } catch (error) {
      console.error('Error ranking repositories with Gemini:', error);
      // If Gemini fails, return the original list sorted by stars as a fallback
      return repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
  }

  async generateArchitectureDiagram(readmeContent: string, repoFullName: string): Promise<{ diagram: string; prompt: string }> {
    const prompt = `
You are an expert software architect. Analyze the README of the repository ${repoFullName} and generate a comprehensive architecture diagram.

Repository: ${repoFullName}
README Content: ${readmeContent}

Generate a Mermaid flowchart diagram that shows:
1. The main application structure
2. Key components and their relationships
3. Data flow between components
4. External dependencies and integrations
5. Technology stack and frameworks used

Return ONLY a valid Mermaid flowchart in the following JSON format:
{"diagram": "graph TD\n    A[Main Component] --> B[Sub Component]\n    B --> C[Another Component]\n    ..."}

CRITICAL RULES - generate valid Mermaid syntax:
- Use simple, clean node labels WITHOUT parentheses, brackets, or special characters
- Use only alphanumeric characters, spaces, and hyphens in node labels
- Example: use "Mobile App" instead of "Mobile Application(Android/iOS Demos)"
- Keep node labels short and descriptive
- Ensure proper arrow syntax: A --> B
- Use proper Mermaid graph TD format
- Never use nested parentheses or brackets in labels
`;
    const fullPrompt = `${prompt}\n${readmeContent.substring(0, 30000)}`;

    try {
      const result = await this.model.generateContent(fullPrompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to find JSON object in Gemini response for diagram.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      let diagram = parsed.diagram;

      if (typeof diagram !== 'string' || !diagram.trim().startsWith('graph')) {
        throw new Error('Invalid diagram format received from Gemini.');
      }

      // Clean the diagram to ensure valid Mermaid syntax
      diagram = this.ensureMermaidDarkTheme(this.cleanMermaidDiagram(diagram));

      return {
        diagram: diagram,
        prompt: fullPrompt
      };
    } catch (error) {
      console.error('Error generating architecture diagram with Gemini:', error);
      throw new Error('Failed to generate diagram from README.');
    }
  }

  async summarizeFiles(files: { path: string; content: string }[]): Promise<{ path: string; summary: string }[]> {
    const systemPrompt = `
You are an expert code analyst. For each file provided below, generate a concise, one-sentence summary of its primary purpose or function. Focus on the file's role in the project.

Return ONLY a JSON array (no prose, no markdown fences) with the following structure:
[
  {
    "path": "<file_path>",
    "summary": "<one_sentence_summary>"
  }
]

Here are the files to summarize:
`;

    const fileData = files.map(f => ({ path: f.path, content: f.content.substring(0, 2000) })); // Truncate content to be safe

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: JSON.stringify(fileData, null, 2) },
      ]);
      const response = await result.response;
      const rawText = response.text();

      // Try to extract a JSON array from the response robustly
      const tryParseArray = (text: string): unknown => {
        // Strip common markdown fences first
        const stripped = text
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();

        // Prefer the first JSON array in the text
        const arrayMatch = stripped.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          return JSON.parse(arrayMatch[0]);
        }

        // As a last resort, slice from first '[' to last ']' if both exist
        const firstIdx = stripped.indexOf('[');
        const lastIdx = stripped.lastIndexOf(']');
        if (firstIdx !== -1 && lastIdx !== -1 && lastIdx > firstIdx) {
          const candidate = stripped.slice(firstIdx, lastIdx + 1);
          return JSON.parse(candidate);
        }

        // Fall through to a direct parse (may throw)
        return JSON.parse(stripped);
      };

      let parsed: unknown;
      try {
        parsed = tryParseArray(rawText);
      } catch (e) {
        console.error('Gemini summarizeFiles raw response (truncated):', rawText.slice(0, 400));
        throw e;
      }

      // Validate structure and coerce if necessary
      const items = Array.isArray(parsed) ? parsed : [];
      const normalized = items
        .map((it) => {
          if (!it || typeof it !== 'object') return null;
          const obj = it as { path?: unknown; summary?: unknown };
          const path = typeof obj.path === 'string' ? obj.path : undefined;
          const summary = typeof obj.summary === 'string' ? obj.summary : undefined;
          if (!path || !summary) return null;
          return { path, summary };
        })
        .filter(Boolean) as { path: string; summary: string }[];

      if (normalized.length > 0) return normalized;

      // Graceful fallback: generate ultra-simple summaries locally
      const fallback = files.map(({ path, content }) => ({
        path,
        summary: this.generateFallbackSummary(path, content)
      }));
      return fallback;
    } catch (error) {
      console.error('Error summarizing files with Gemini:', error);
      // Final fallback to avoid breaking /analyze entirely
      const safeFallback = files.map(({ path, content }) => ({
        path,
        summary: this.generateFallbackSummary(path, content)
      }));
      return safeFallback;
    }
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content with Gemini:', error);
      throw new Error('Failed to generate content.');
    }
  }

  // Create simple summaries when the model output is unusable
  private generateFallbackSummary(path: string, content: string): string {
    const lower = path.toLowerCase();
    if (lower.endsWith('.md')) return `${path} - documentation or project notes.`;
    if (lower.endsWith('.json')) return `${path} - configuration or structured data.`;
    if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return `${path} - YAML configuration.`;
    if (lower.includes('/api/') || /route\.(t|j)sx?$/i.test(lower)) return `${path} - API route or server handler.`;
    if (lower.includes('/components/') || lower.includes('/ui/')) return `${path} - UI component.`;
    if (lower.includes('/pages/') || /page\.(t|j)sx?$/i.test(lower)) return `${path} - application page/view.`;
    if (/model|schema|entity|type|interface/i.test(lower)) return `${path} - data model or type definitions.`;
    if (/util|helper|service|lib|hook/i.test(lower)) return `${path} - utility, service, or helper functions.`;

    // Peek into content for hints
    const snippet = (content || '').slice(0, 400);
    if (/fetch\(|axios\.|request/i.test(snippet)) return `${path} - performs network requests.`;
    if (/react|useState|useEffect/i.test(snippet)) return `${path} - React component or hook.`;
    if (/express|next\-?api|router/i.test(snippet)) return `${path} - server route or middleware.`;
    if (/class |function |const |let /i.test(snippet)) return `${path} - source code implementing app logic.`;

    return `${path} - project file.`;
  }
}
