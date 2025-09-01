import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github';

interface TreeNode {
  path: string;
  type: string;
  size?: number;
  sha: string;
  url: string;
  mode?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  extension?: string;
}

function buildFileTree(files: TreeNode[]): FileNode[] {
  const root: FileNode[] = [];
  const directories: Record<string, FileNode> = {};
  
  // First, create all directory nodes
  files.forEach(file => {
    const pathParts = file.path.split('/');
    
    // Create directory nodes for each part of the path
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (!directories[currentPath]) {
        const dirNode: FileNode = {
          name: part,
          path: currentPath,
          type: 'directory',
          children: []
        };
        directories[currentPath] = dirNode;
        
        if (parentPath) {
          // Add to parent directory
          directories[parentPath].children?.push(dirNode);
        } else {
          // Add to root if no parent
          root.push(dirNode);
        }
      }
    }
  });
  
  // Then, add all file nodes to their parent directories
  files.forEach(file => {
    if (file.type === 'blob') { // Only process files, not trees
      const pathParts = file.path.split('/');
      const fileName = pathParts.pop() || '';
      const parentPath = pathParts.join('/');
      const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
      
      const fileNode: FileNode = {
        name: fileName,
        path: file.path,
        type: 'file',
        size: file.size,
        extension
      };
      
      if (parentPath) {
        // Add to parent directory
        directories[parentPath]?.children?.push(fileNode);
      } else {
        // Add to root if no parent
        root.push(fileNode);
      }
    }
  });
  
  return root;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get('repo');

  if (!repoFullName) {
    return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
  }

  const github = new GitHubService();

  try {
    // Get the full file tree from GitHub
    const fileTree = await github.getFullFileTree(repoFullName);
    
    // Build a hierarchical file tree structure
    const hierarchicalTree = buildFileTree(fileTree);
    
    // Get repository details
    const [owner, repo] = repoFullName.split('/');
    const repoDetails = await github.getRepositoryStats(owner, repo);
    const languages = await github.getRepositoryLanguages(owner, repo);
    
    return NextResponse.json({ 
      tree: hierarchicalTree,
      details: repoDetails?.repo || null,
      languages,
      contributors: repoDetails?.topContributors || [],
      commits: repoDetails?.recentCommits || []
    });

  } catch (error) {
    console.error(`[GET_REPO_STRUCTURE_API] Error fetching structure for ${repoFullName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching the repository structure.';
    return NextResponse.json({ error: `Failed to fetch repository structure: ${errorMessage}` }, { status: 500 });
  }
}