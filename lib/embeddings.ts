// lib/embeddings.ts
// Mock by default unless NEXT_PUBLIC_USE_MOCK=false
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK?.toLowerCase() !== 'false';

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (USE_MOCK) {
    // small 10-dim fake vectors for local testing
    return texts.map(() => Array.from({ length: 10 }, () => Math.random()));
  }

  // Real embeddings only when mock is off
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const res = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return res.data.map((d) => d.embedding);
}

// <-- add this helper so routes can embed a single string
export async function embedOne(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
