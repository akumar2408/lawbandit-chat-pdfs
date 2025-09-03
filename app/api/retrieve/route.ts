import { NextRequest } from 'next/server';
import { embedOne } from '@/lib/embeddings';
import { getOrCreateSessionId } from '@/lib/session';
import { retrieve } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = (body?.question || '').toString();
    if (!question) return new Response('Missing question', { status: 400 });
    const sessionId = getOrCreateSessionId();
    const qEmb = await embedOne(question);
    const top = retrieve(sessionId, qEmb, 6).map(r => ({
      pageNum: r.pageNum,
      text: r.text,
      score: r.score
    }));
    return Response.json({ retrieved: top });
  } catch (e:any) {
    return new Response(`Retrieve error: ${e.message}`, { status: 500 });
  }
}
