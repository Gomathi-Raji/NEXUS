import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { user1, user2 } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const topLangs1 = Object.keys(user1.stats.languages).slice(0, 3);
    const topLangs2 = Object.keys(user2.stats.languages).slice(0, 3);
    
    // Calculate battle statistics
    const battleStats = {
      totalCommitsCompared: (user1.stats.totalCommits || 0) + (user2.stats.totalCommits || 0),
      totalStarsClashed: user1.stats.totalStars + user2.stats.totalStars,
      totalReposJudged: user1.user.public_repos + user2.user.public_repos,
      totalContributions: user1.stats.contributions + user2.stats.contributions,
    };
    
    const prompt = `You are a savage roast master analyzing GitHub profiles. Based on the data below, create a BRUTAL and SAVAGE roast for each user (2-3 lines each), and declare a winner based on their GitHub statistics. Don't hold back - make it spicy! 🔥

USER 1: ${user1.user.login}
- Repos: ${user1.user.public_repos}
- Followers: ${user1.user.followers}
- Following: ${user1.user.following}
- Total Stars: ${user1.stats.totalStars}
- Total Forks: ${user1.stats.totalForks}
- Total Commits: ${user1.stats.totalCommits || 0}
- Contributions: ${user1.stats.contributions}
- Top Languages: [${topLangs1.join(', ')}]
- Top Repo: ${user1.stats.topRepos[0]?.name} (${user1.stats.topRepos[0]?.stars} stars, ${user1.stats.topRepos[0]?.commitCount || 0} commits)
- Account Age: ${new Date(user1.user.created_at).getFullYear()}
- Bio: ${user1.user.bio || 'No bio'}

USER 2: ${user2.user.login}
- Repos: ${user2.user.public_repos}
- Followers: ${user2.user.followers}
- Following: ${user2.user.following}
- Total Stars: ${user2.stats.totalStars}
- Total Forks: ${user2.stats.totalForks}
- Total Commits: ${user2.stats.totalCommits || 0}
- Contributions: ${user2.stats.contributions}
- Top Languages: [${topLangs2.join(', ')}]
- Top Repo: ${user2.stats.topRepos[0]?.name} (${user2.stats.topRepos[0]?.stars} stars, ${user2.stats.topRepos[0]?.commitCount || 0} commits)
- Account Age: ${new Date(user2.user.created_at).getFullYear()}
- Bio: ${user2.user.bio || 'No bio'}

Format your response as:
🔥 **${user1.user.login}**: [2-3 line savage roast]

🔥 **${user2.user.login}**: [2-3 line savage roast]

🏆 **WINNER**: [Winner's username] - [1 line brutal reason why they dominated]

💀 **BATTLE VERDICT**: [2-3 line summary of who wins what categories and overall assessment]

Be absolutely RUTHLESS and SAVAGE. Roast their commit frequency, repo quality, follower-to-following ratio, language choices, bio, everything! Make it hurt but funny. No mercy!
When listing Top Languages, keep the array format (e.g. [TypeScript, JavaScript, Python]) so the frontend can render each language with its authentic color.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const roast = response.text();

    // Return top languages as arrays for capsule rendering
    return NextResponse.json({
      roast,
      battleStats,
      topLanguages: {
        user1: topLangs1,
        user2: topLangs2,
      },
    });
  } catch (error) {
    console.error('Error generating roast:', error);
    return NextResponse.json({ error: 'Failed to generate roast' }, { status: 500 });
  }
}
