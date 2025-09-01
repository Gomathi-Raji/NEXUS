import { NextResponse } from 'next/server';
import { GeminiService, ProjectIdea } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { idea, userSkills } = await request.json() as { idea: ProjectIdea, userSkills: Record<string, number> };

    if (!idea) {
      return NextResponse.json({ error: 'Project idea is required' }, { status: 400 });
    }

    const geminiService = new GeminiService();
    const projectPlan = await geminiService.generateProjectPlan(idea, userSkills || {});

    return NextResponse.json(projectPlan);
  } catch (error) {
    console.error('Error generating project plan:', error);
    return NextResponse.json({ error: 'Failed to generate project plan' }, { status: 500 });
  }
}
