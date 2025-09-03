import { NextRequest } from 'next/server';
import { embedOne } from '@/lib/embeddings';
import { getOrCreateSessionId } from '@/lib/session';
import { retrieve } from '@/lib/store';
import { answerWithCitations } from '@/lib/llm';

export const runtime = 'nodejs';


export async function POST(req: Request) {
  const { question } = await req.json();

  // Instead of OpenAI, return a canned fake response
  const mockAnswer = `🤖 Mock Answer: You asked "${question}". Normally I'd analyze the PDF embeddings, but since we're mocking, here's a placeholder answer.`;

  return Response.json({ answer: mockAnswer });
}
