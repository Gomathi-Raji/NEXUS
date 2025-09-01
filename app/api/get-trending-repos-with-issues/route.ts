import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini';

function getDefaultRepositories(filter: string, language?: string): string[] {
  const defaultRepos = [
    'microsoft/PowerToys',
    'home-assistant/core',
    'grafana/grafana',
    'zulip/zulip',
    'rust-lang/cargo',
    'tokio-rs/tokio',
    'denoland/deno',
    'spring-projects/spring-boot',
    'storybookjs/storybook',
    'kubernetes/kubernetes',
    'facebook/react',
    'microsoft/vscode',
    'elastic/elasticsearch',
    'apache/spark',
    'django/django'
  ];

  // Filter by language if specified
  if (language) {
    const languageRepos = {
      'javascript': ['facebook/react', 'storybookjs/storybook', 'denoland/deno'],
      'typescript': ['microsoft/vscode', 'grafana/grafana', 'storybookjs/storybook'],
      'python': ['home-assistant/core', 'zulip/zulip', 'django/django'],
      'rust': ['rust-lang/cargo', 'tokio-rs/tokio'],
      'java': ['spring-projects/spring-boot', 'apache/spark', 'elastic/elasticsearch'],
      'go': ['kubernetes/kubernetes'],
      'c#': ['microsoft/PowerToys']
    };

    const filtered = languageRepos[language.toLowerCase() as keyof typeof languageRepos];
    if (filtered) {
      return [...filtered, ...defaultRepos.filter(repo => !filtered.includes(repo))].slice(0, 10);
    }
  }

  return defaultRepos.slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const { filter, language, page } = await request.json();
    
    // For now, let's prioritize our verified repositories that we know have good first issues
    const verifiedRepos = [
      'microsoft/PowerToys',
      'home-assistant/core', 
      'grafana/grafana',
      'zulip/zulip',
      'rust-lang/cargo',
      'tokio-rs/tokio',
      'denoland/deno',
      'spring-projects/spring-boot',
      'storybookjs/storybook',
      'kubernetes/kubernetes'
    ];
    
    const geminiService = new GeminiService();
    
    // Create a detailed prompt for Gemini to find repositories with actual issues
    const prompt = `You are a GitHub repository expert. I need you to provide a list of 10 real, active GitHub repositories that currently have open issues labeled with "${filter}".

Requirements:
- These must be REAL repositories that exist on GitHub and are actively maintained
${filter === 'good first issue' 
  ? '- Each repository must currently have at least 3 open issues with labels like: "good first issue", "help wanted", "beginner", "beginner-friendly", "easy", "E-easy", "newcomer", "first-timers-only", or "up-for-grabs"'
  : filter === 'bounty issue'
  ? '- Each repository must currently have issues with labels like: "bounty", "hacktoberfest", "monetary", "reward", "prize", "hackathon", "bounty-hunter", or "bug-bounty"'
  : '- Each repository must currently have critical issues with labels like: "bug", "critical", "urgent", "high priority", "blocker", "regression", or "security"'
}
- Repositories should be popular (500+ stars) and actively maintained (commits within last 3 months)
${filter === 'good first issue' 
  ? '- Focus on repositories that are known for welcoming new contributors'
  : filter === 'bounty issue'
  ? '- Focus on repositories that offer monetary rewards or hackathon participation'
  : '- Focus on repositories that have urgent issues needing immediate attention'
}
${language ? `- Repositories should primarily use ${language} programming language` : '- Include repositories from various programming languages (JavaScript, TypeScript, Python, Go, Rust, Java)'}
- Prioritize repositories from major organizations like Microsoft, Google, Facebook, Mozilla, Elastic, etc.
${filter === 'good first issue' ? '- Include projects that have established contributor onboarding processes' : ''}

VERIFIED repositories with good first issues include:
- microsoft/PowerToys (TypeScript/C#)
- home-assistant/core (Python)  
- grafana/grafana (TypeScript)
- zulip/zulip (Python)
- rust-lang/cargo (Rust)
- tokio-rs/tokio (Rust)
- denoland/deno (TypeScript)
- spring-projects/spring-boot (Java)
- storybookjs/storybook (TypeScript)
- kubernetes/kubernetes (Go)

Please respond with ONLY a JSON array of repository names in the format "owner/repo-name". Do not include any explanations, markdown formatting, or additional text.

Example format:
["microsoft/PowerToys", "home-assistant/core", "grafana/grafana"]`;

    let repositories: string[] = [];
    
    try {
      const response = await geminiService.generateContent(prompt);
      
      // Try to parse the response as JSON
      const cleanResponse = response.trim().replace(/```json\s*|\s*```/g, '');
      repositories = JSON.parse(cleanResponse);
      
      // Validate that we got an array of strings
      if (!Array.isArray(repositories) || repositories.length === 0) {
        throw new Error('Invalid response format');
      }
      
      // Filter out any invalid repository names
      repositories = repositories.filter(repo => 
        typeof repo === 'string' && 
        repo.includes('/') && 
        repo.split('/').length === 2 &&
        repo.split('/')[0].length > 0 &&
        repo.split('/')[1].length > 0
      );
      
      // If we got good results from Gemini, mix them with our verified repos
      if (repositories.length >= 5) {
        repositories = [...verifiedRepos.slice(0, 3), ...repositories.slice(0, 7)];
      } else {
        throw new Error('Not enough repositories from Gemini');
      }
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response or get enough repositories:', parseError);
      
      // Fallback to verified repositories
      repositories = getDefaultRepositories(filter, language);
    }
    
    // Ensure we have at least some repositories
    if (repositories.length === 0) {
      repositories = getDefaultRepositories(filter, language);
    }

    return NextResponse.json({
      repositories: repositories.slice(0, 10),
      page,
      total: repositories.length
    });
    
  } catch (error) {
    console.error('Error getting trending repositories from Gemini:', error);
    
    // Fallback to default repositories
    const { filter, language } = await request.json().catch(() => ({ filter: 'good first issue', language: '' }));
    const fallbackRepos = getDefaultRepositories(filter, language);
    
    return NextResponse.json({
      repositories: fallbackRepos,
      page: 1,
      total: fallbackRepos.length
    });
  }
}
