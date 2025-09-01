import { NextResponse } from 'next/server';
import { GeminiService } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    console.log('Received prompt in generate-idea:', prompt);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const geminiService = new GeminiService();
    const projectIdea = await geminiService.generateProjectIdea(prompt);

    return NextResponse.json(projectIdea);
  } catch (error) {
    console.error('Error generating project idea:', error);
    return NextResponse.json({ error: 'Failed to generate project idea' }, { status: 500 });
  }
}
