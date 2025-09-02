/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { issue, repoName } = await request.json();
    
    if (!issue || !repoName) {
      return NextResponse.json({ error: 'Issue and repo name are required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create a comprehensive prompt for issue explanation
    const prompt = `
You are a senior software engineer helping explain GitHub issues to developers. 

Repository: ${repoName}
Issue Title: ${issue.title}
Issue Number: #${issue.number}
Issue Body: ${issue.body || 'No description provided'}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-explicit-any
Labels: ${issue.labels?.map((label: any) => label.name).join(', ') || 'No labels'}
Created by: ${issue.user?.login || 'Unknown'}

Please provide a comprehensive explanation that includes:

1. **Issue Summary**: What is the problem or feature request?
2. **Technical Context**: What part of the codebase is likely affected?
3. **Complexity Level**: Is this beginner, intermediate, or advanced?
4. **Approach to Fix**: Step-by-step guidance on how to approach solving this
5. **Key Considerations**: Important things to keep in mind while working on this
6. **Resources**: What documentation or knowledge might be helpful

Keep the explanation clear, actionable, and helpful for contributors of all levels. Use markdown formatting for better readability.
`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    return NextResponse.json({
      success: true,
      explanation: explanation,
      issue: {
        title: issue.title,
        number: issue.number,
        url: issue.html_url
      }
    });

  } catch (error) {
    console.error('Error explaining issue:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
