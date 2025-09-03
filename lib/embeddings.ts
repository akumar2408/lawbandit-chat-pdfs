import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedTexts(texts: string[]): Promise<number[][]> {
  // Create fake embeddings: each text gets a vector of 10 random numbers
  return texts.map(() =>
    Array.from({ length: 10 }, () => Math.random()) // small fake vector
  );
}

export async function embedOne(text: string): Promise<number[]> {
  const res = await embedTexts([text]);
  return res[0];
}
