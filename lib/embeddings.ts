import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Embed a list of texts (returns one embedding per string)
export async function embedTexts(texts: string[]) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small", // or "text-embedding-3-large"
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

// Embed a single string (helper)
export async function embedOne(text: string) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: [text],
  });

  return response.data[0].embedding;
}
