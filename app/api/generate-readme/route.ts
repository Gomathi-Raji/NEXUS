import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { GeminiService } from "@/lib/gemini";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_HEADERS = {
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

const geminiService = new GeminiService();

export const maxDuration = 120; // 2 minutes

async function getRepoFiles(owner: string, repo: string, path = "", maxFiles = 30) {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: GITHUB_HEADERS }
    );

    let files: unknown[] = [];
    if (Array.isArray(response.data)) {
      files = response.data.slice(0, maxFiles);
    } else if (response.data.type === "file") {
      files = [response.data];
    }

    return files;
  } catch {
    console.error("Error fetching repo files");
    return [];
  }
}

async function getFileContent(owner: string, repo: string, path: string) {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      { headers: GITHUB_HEADERS }
    );

    if (Array.isArray(response.data) || response.data.type !== "file") {
      return null;
    }

    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    return content.slice(0, 1000); // Limit content to 1000 chars
  } catch {
    return null;
  }
}

interface RepoData {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
}

function buildPrompt(repoData: RepoData, fileSummaries: string) {
  const { name, description, language, topics } = repoData;
  
  return `Create a comprehensive README.md for the GitHub repository "${name}".

Repository Info:
- Name: ${name}
- Description: ${description || "No description provided"}
- Primary Language: ${language || "Not specified"}
- Topics: ${topics?.join(", ") || "None"}

Key Files Overview:
${fileSummaries}

Create a README with these sections:

1. Project title with description
2. Key features (3-5 bullet points)
3. Installation instructions
4. Basic usage examples
5. Tech stack
6. Contributing guidelines
7. License information

Requirements:
- Use appropriate badges
- Include clear installation steps
- Add usage examples with code blocks
- Keep it professional and well-structured
- Use emojis for section headers
- Make it engaging but concise

Generate the complete README.md content:`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo, repoUrl } = body;

    // Accept either 'repo' or 'repoUrl' field
    const repositoryUrl = repoUrl || repo;

    if (!repositoryUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // Extract owner and repo from URL
    let match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    
    // If it's just owner/repo format, construct the full URL
    if (!match && repositoryUrl.includes('/') && !repositoryUrl.includes('http')) {
      const parts = repositoryUrl.split('/');
      if (parts.length === 2) {
        match = [null, parts[0], parts[1]];
      }
    }
    
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL or repository format" }, { status: 400 });
    }

    const [, owner, repoName] = match;

    // Get repository data
    const repoResponse = await axios.get(
      `${GITHUB_API_BASE}/repos/${owner}/${repoName}`,
      { headers: GITHUB_HEADERS }
    );

    const repoData = repoResponse.data;

    // Get repository files
    const files = await getRepoFiles(owner, repoName);
    
    // Type guard for file objects
    interface GitHubFile {
      type: string;
      name: string;
      path: string;
    }

    const isGitHubFile = (file: unknown): file is GitHubFile => {
      return typeof file === 'object' && file !== null && 
             'type' in file && 'name' in file && 'path' in file;
    };

    // Analyze key files
    const keyFiles = files.filter((file): file is GitHubFile => 
      isGitHubFile(file) &&
      file.type === "file" && 
      (file.name.includes("package.json") || 
       file.name.includes("requirements.txt") ||
       file.name.includes("Cargo.toml") ||
       file.name.includes("pom.xml") ||
       file.name.includes("go.mod") ||
       file.name.endsWith(".py") ||
       file.name.endsWith(".js") ||
       file.name.endsWith(".ts") ||
       file.name.endsWith(".jsx") ||
       file.name.endsWith(".tsx") ||
       file.name.endsWith(".md"))
    ).slice(0, 10);

    // Get content for key files
    const fileSummaries = await Promise.all(
      keyFiles.map(async (file) => {
        const content = await getFileContent(owner, repoName, file.path);
        return `File: ${file.name}\n${content ? content.slice(0, 500) : "Content not accessible"}`;
      })
    );

    const prompt = buildPrompt(repoData, fileSummaries.join("\n\n"));

    // Generate README using Gemini
    const readme = await geminiService.generateContent(prompt);

    return NextResponse.json({ 
      markdown: readme,
      content: readme,
      repoData: {
        name: repoData.name,
        description: repoData.description,
        language: repoData.language,
        topics: repoData.topics,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
      }
    });

  } catch (error) {
    console.error("Error generating README:", error);
    
    // More detailed error message
    let errorMessage = "Failed to generate README";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        markdown: "",
        content: ""
      },
      { status: 500 }
    );
  }
}