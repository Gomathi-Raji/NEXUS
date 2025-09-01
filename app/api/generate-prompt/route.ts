import { NextResponse } from 'next/server';
import { GeminiService, ProjectPlan } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const projectPlan: ProjectPlan = await request.json();

    if (!projectPlan) {
      return NextResponse.json({ error: 'Project plan is required' }, { status: 400 });
    }

    const geminiService = new GeminiService();
    const idePrompt = await geminiService.generateAIIDEPrompt(projectPlan);

    return NextResponse.json({ prompt: idePrompt });
  } catch (error) {
    console.error('Error generating AI IDE prompt:', error);
    return NextResponse.json({ error: 'Failed to generate AI IDE prompt' }, { status: 500 });
  }
}
