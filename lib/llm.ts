import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Retrieved = {
  pageNum: number;
  text: string;
  score: number;
};

export type LLMAnswer = {
  answer: string;
  page_hits: number[];
  citations: { page: number; snippet: string }[];
  reasoning: string;
};

const SYSTEM = `You are a precise legal-document assistant for law students.
You will receive a user question and retrieved passages with page numbers from a PDF.
Rules:
- If the answer exists, respond with strict JSON: {"answer": "...", "page_hits": [numbers], "citations": [{"page": n, "snippet": "..." }], "reasoning": "one or two short sentences describing *how* you located the answer (e.g., keywords matched on pages 14 and 22). Do not reveal detailed chain-of-thought."}
- "answer" MUST include page numbers inline when referencing where the proposition is found.
- "citations" should contain short quotes (max 25 words each) that support the answer.
- If the answer is not present, return {"answer": "Not found in document.", "page_hits": [], "citations": [], "reasoning": "Searched top-ranked passages; nothing matched exactly."}
- Never include additional keys. Always valid JSON.`;

export async function answerWithCitations(question: string, retrieved: Retrieved[]): Promise<LLMAnswer> {
  const context = retrieved.map((r, i) => ({
    role: "user" as const,
    content: `# Passage ${i+1}
[page ${r.pageNum}] (score=${r.score.toFixed(3)})
${r.text.slice(0, 1200)}`
  }));

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Question: ${question}\nUse only the passages provided below. Return strict JSON.`},
    ...context
  ];

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages,
    response_format: { type: "json_object" }
  });

  const txt = res.choices[0].message.content || "{}";
  try {
    const obj = JSON.parse(txt) as LLMAnswer;
    if (typeof obj.answer === "string" && Array.isArray(obj.page_hits)) {
      return obj;
    }
  } catch {}
  return {
    answer: "I couldn't parse a valid JSON answer from the model.",
    page_hits: [],
    citations: [],
    reasoning: "Model returned malformed JSON."
  };
}
