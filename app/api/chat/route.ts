// app/api/chat/route.ts
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { question, context } = await req.json();
  const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK?.toLowerCase() !== 'false';

  if (USE_MOCK) {
    const mockAnswer =
      `🤖 Mock Answer: "${question}".\n\n` +
      `Top snippets:\n` +
      (context?.snippets?.slice(0, 2)?.map((s: any) =>
        `• p.${s.pageNum}: ${s.text?.slice(0, 160)}…`).join('\n') || '• (no snippets)');
    return Response.json({ answer: mockAnswer });
  }

  // Real LLM (only when USE_MOCK=false)
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful legal assistant. Cite page numbers when possible.' },
      { role: 'user', content: question }
    ]
  });

  return Response.json({ answer: completion.choices[0]?.message?.content ?? '' });
}
