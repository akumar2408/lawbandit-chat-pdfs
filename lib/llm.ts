import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Retrieved = {
  /** Legal/reporter page number (already inferred at upload time). */
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
You will receive a user question and retrieved passages with LEGAL/REPORTER page numbers (not raw PDF sheet numbers).
Rules:
- If the answer exists, respond with STRICT JSON ONLY:
  {"answer":"...","page_hits":[numbers],"citations":[{"page":n,"snippet":"..."}],"reasoning":"one or two short sentences about how you located the answer. Do not reveal detailed chain-of-thought."}
- In "answer", include the page numbers inline, formatted with a leading asterisk (e.g., "*736–37") when you cite one or a range.
- "citations" should contain short quotes (max 25 words) that support the answer; set "page" to the legal/reporter page number.
- If not present, return {"answer":"Not found in document.","page_hits":[],"citations":[],"reasoning":"Searched top-ranked passages; nothing matched exactly."}
- Never include additional keys. Always valid JSON.`;

function starFmt(p: number) {
  // Let the model see pages as *NNN to encourage star-page answers.
  return `*${p}`;
}

export async function answerWithCitations(
  question: string,
  retrieved: Retrieved[]
): Promise<LLMAnswer> {
  const context = retrieved.map((r, i) => ({
    role: 'user' as const,
    content: `# Passage ${i + 1}
[page ${starFmt(r.pageNum)}] (score=${r.score.toFixed(3)})
${r.text.slice(0, 1200)}`,
  }));

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content:
        `Question: ${question}\nUse ONLY the passages below. Return strict JSON.`,
    },
    ...context,
  ];

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages,
    response_format: { type: 'json_object' },
  });

  const txt = res.choices[0].message.content || '{}';
  try {
    const obj = JSON.parse(txt) as LLMAnswer;
    if (typeof obj.answer === 'string' && Array.isArray(obj.page_hits)) {
      return obj;
    }
  } catch {}
  return {
    answer: "I couldn't parse a valid JSON answer from the model.",
    page_hits: [],
    citations: [],
    reasoning: 'Model returned malformed JSON.',
  };
}
