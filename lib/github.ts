import axios from 'axios';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string;
  topics: string[];
  updated_at: string;
  created_at: string;
  size: number;
  open_issues_count: number;
  license: {
    name: string;
    spdx_id: string;
  } | null;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  homepage?: string;
  relevance_score?: number;
  issue_count?: number;
  sample_issues?: GitHubIssue[];
}

export interface RepoContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string;
  content?: string;
}

export interface RepoAnalysis {
  repo: GitHubRepo;
  fileStructure: RepoContent[];
  packageJson?: Record<string, unknown>;
  readme?: string;
  mainFiles: RepoContent[];
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  body: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  labels: {
    id: number;
    name: string;
    color: string;
    description?: string;
  }[];
  comments: number;
}

export class GitHubService {
  private token = process.env.GITHUB_TOKEN;
  private baseURL = 'https://api.github.com';

  constructor() {
    if (!this.token) {
      console.warn('⚠️  GitHub token not found. Please set GITHUB_TOKEN in your .env.local file');
      console.log('📝 Get your token from: https://github.com/settings/tokens');
      console.log('🔐 Required scopes: public_repo (or repo for private repositories)');
    }
  }

  private getHeaders() {
    if (!this.token) {
      throw new Error('GitHub token not configured. Please set GITHUB_TOKEN in your .env.local file');
    }
    return {
      'Authorization': `token ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'WhatToBuild-App'
    };
  }

  async searchRepositories(
    keywords: string[], 
    language?: string, 
    minStars = 100,
    page = 1
  ): Promise<GitHubRepo[]> {
    try {
      const query = [
        ...keywords.map(k => `"${k}"`),
        language ? `language:${language}` : '',
        `stars:>=${minStars}`,
        'is:public'
      ].filter(Boolean).join(' ');

      const response = await axios.get(`${this.baseURL}/search/repositories`, {
        headers: this.getHeaders(),
        params: {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 10,
          page: page
        }
      });

      return response.data.items;
    } catch (error) {
      console.error('GitHub search error:', error);
      return [];
    }
  }

  async getRepository(repoFullName: string): Promise<GitHubRepo | null> {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${repoFullName}`, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('GitHub get repository error:', error);
      return null;
    }
  }

  async getRepositoryContents(owner: string, repo: string, path = ''): Promise<RepoContent[]> {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.getHeaders()
      });

      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error('GitHub contents error:', error);
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.getHeaders()
      });

      if (response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      console.error('GitHub file content error:', error);
      return null;
    }
  }

  async analyzeRepository(repo: GitHubRepo): Promise<RepoAnalysis> {
    const [owner, repoName] = repo.full_name.split('/');
    
    // Get root contents
    const rootContents = await this.getRepositoryContents(owner, repoName);
    
    // Get package.json if it exists
    let packageJson = null;
    const packageFile = rootContents.find(f => f.name === 'package.json');
    if (packageFile) {
      const content = await this.getFileContent(owner, repoName, 'package.json');
      if (content) {
        try {
          packageJson = JSON.parse(content);
        } catch (e) {
          console.error('Failed to parse package.json:', e);
        }
      }
    }

    // Get README
    let readme = null;
    const readmeFile = rootContents.find(f => 
      f.name.toLowerCase().startsWith('readme')
    );
    if (readmeFile) {
      readme = await this.getFileContent(owner, repoName, readmeFile.path);
    }

    // Identify main files
    const mainFiles = rootContents.filter(f => 
      f.type === 'file' && (
        f.name.includes('index') ||
        f.name.includes('main') ||
        f.name.includes('app') ||
        f.name === 'package.json' ||
        f.name.toLowerCase().startsWith('readme')
      )
    );

    return {
      repo,
      fileStructure: rootContents,
      packageJson,
      readme: readme || undefined,
      mainFiles
    };
  }

  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('GitHub languages error:', error);
      return {};
    }
  }

  async getRepositoryStats(owner: string, repo: string) {
    try {
      const [repoResponse, contributorsResponse, commitsResponse] = await Promise.all([
        axios.get(`${this.baseURL}/repos/${owner}/${repo}`, { headers: this.getHeaders() }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/contributors`, { 
          headers: this.getHeaders(),
          params: { per_page: 5 }
        }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/commits`, { 
          headers: this.getHeaders(),
          params: { per_page: 10 }
        })
      ]);

      return {
        repo: repoResponse.data,
        topContributors: contributorsResponse.data,
        recentCommits: commitsResponse.data
      };
    } catch (error) {
      console.error('GitHub stats error:', error);
      return null;
    }
  }

  async getReadme(repoFullName: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseURL}/repos/${repoFullName}/readme`, {
        headers: this.getHeaders(),
      });
      const readme = response.data;
      // README content is Base64 encoded
      const content = Buffer.from(readme.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to fetch README for ${repoFullName}:`, error);
      throw new Error('Could not fetch README file. It might not exist or the repository is private.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getFullFileTree(repoFullName: string): Promise<any[]> {
    const [owner, repo] = repoFullName.split('/');
    try {
      const repoDetails = await axios.get(`${this.baseURL}/repos/${owner}/${repo}`, { headers: this.getHeaders() });
      const defaultBranch = repoDetails.data.default_branch;

      const branchDetails = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/branches/${defaultBranch}`, { headers: this.getHeaders() });
      const treeSha = branchDetails.data.commit.commit.tree.sha;

      const treeResponse = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, { headers: this.getHeaders() });
      
      interface TreeNode {
        path: string;
        mode: string;
        type: string;
        sha: string;
        size?: number;
        url: string;
      }
      return treeResponse.data.tree.filter((node: TreeNode) => node.type === 'blob');
    } catch (error) {
      console.error(`Failed to fetch file tree for ${repoFullName}:`, error);
      throw new Error('Could not fetch the repository file tree.');
    }
  }

  async getRepositoryIssues(
    repoFullName: string, 
    state: 'open' | 'closed' | 'all' = 'open', 
    perPage = 10, 
    page = 1,
    labels?: string
  ): Promise<GitHubIssue[]> {
    const [owner, repo] = repoFullName.split('/');
    try {
      // If labels are provided, try each label individually since GitHub treats
      // comma-separated labels as AND (must have all) not OR (can have any)
      if (labels) {
        const labelVariants = labels.split(',').map(label => label.trim());
        const allIssues: GitHubIssue[] = [];
        const seenIssueIds = new Set<number>();

        // Try each label variant individually
        for (const label of labelVariants) {
          try {
            const params = {
              state,
              per_page: Math.min(perPage * 2, 100), // Get more results to account for duplicates
              page: 1, // Always start from page 1 for each label
              sort: 'updated',
              direction: 'desc',
              labels: label
            };

            const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues`, {
              headers: this.getHeaders(),
              params
            });

            // Add unique issues (avoid duplicates)
            for (const issue of response.data) {
              if (!seenIssueIds.has(issue.id)) {
                seenIssueIds.add(issue.id);
                allIssues.push(issue);
              }
            }
          } catch (labelError) {
            // Continue with next label if one fails
            console.warn(`Failed to fetch issues for label "${label}" in ${repoFullName}:`, labelError);
            continue;
          }
        }

        // Sort by updated date and return requested page
        allIssues.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        // Handle pagination for the combined results
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        return allIssues.slice(startIndex, endIndex);
      }

      // Fallback to original behavior for single label or no labels
      const params: {
        state: string;
        per_page: number;
        page: number;
        sort: string;
        direction: string;
        labels?: string;
      } = {
        state,
        per_page: perPage,
        page,
        sort: 'updated',
        direction: 'desc'
      };

      if (labels) {
        params.labels = labels;
      }

      const response = await axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues`, {
        headers: this.getHeaders(),
        params
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch issues for ${repoFullName}:`, error);
      return [];
    }
  }
}
