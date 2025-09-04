// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { retrieve } from '@/lib/store';
import { embedOne } from '@/lib/embeddings';
import { getOrCreateSessionId } from '@/lib/session';
import { answerWithCitations } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question || !question.trim()) {
      return Response.json({ error: 'Question is required.' }, { status: 400 });
    }

    // 1) Get session
    const sessionId = getOrCreateSessionId();

    // 2) Embed the query text -> vector
    const queryEmbedding = await embedOne(question);

    // 3) Retrieve top-k passages for this session
    const topK = 8;
    const retrieved = retrieve(sessionId, queryEmbedding, topK); // [{pageNum,text,score,...}]

    const useOpenAI = (process.env.USE_OPENAI || '').trim() === '1';
    const hasKey = !!(process.env.OPENAI_API_KEY || '').trim();

    if (useOpenAI && hasKey) {
      // 4) Ask the model to answer with citations
      const ans = await answerWithCitations(question, retrieved);
      return Response.json(
        {
          mode: 'openai',
          ...ans,
          // optionally expose which pages were searched
          sources: retrieved.map(r => ({ page: r.pageNum, score: r.score })),
        },
        { status: 200 },
      );
    }

    // ------- Mock fallback (if no key or USE_OPENAI != 1) -------
    return Response.json(
      {
        mode: 'mock',
        answer: `Mock Answer: "${question}".`,
        page_hits: [],
        citations: [],
        reasoning: 'Mock mode (no API key or USE_OPENAI not set).',
        sources: retrieved.slice(0, 3).map(r => ({
          page: r.pageNum,
          snippet: r.text.slice(0, 180),
        })),
      },
      { status: 200 },
    );
  } catch (e: any) {
    return Response.json({ error: e?.message || 'Chat error' }, { status: 500 });
  }
}
