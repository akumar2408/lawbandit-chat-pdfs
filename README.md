# LawBandit – Chat with PDFs (Smarter RAG)
Upload long case PDFs or scholarly articles and ask: **“On what page does this document mention _X_?”**  
Answers include page numbers, short supporting quotes, and a brief *how-it-found-it* explanation.

> Built with **Next.js 14 + TypeScript + Node.js** and deploy-ready for **Vercel**.

---

## 🚀 Live Demo (after you deploy)
- Vercel URL: _add after deploy_

## 🧠 Features
- Upload one or more PDFs
- Page-level indexing → **chunked embeddings with page numbers**
- Ask questions and get **page-cited answers**
- **“How I found it”**: concise explanation of retrieval (no chain-of-thought)
- Show top matches with page numbers, scores, and snippets
- Clean, readable code with comments and a small footprint

## 🗂️ Project Structure
```
app/
  api/
    upload/route.ts     # PDF → pages → chunks → embeddings → in-memory store
    retrieve/route.ts   # question → embed → topK chunks
    chat/route.ts       # question + retrieved → LLM JSON answer with citations
  page.tsx              # main UI (upload + chat)
  layout.tsx
components/
  Uploader.tsx          # PDF upload and indexing
  Chat.tsx              # Q&A UI with answers
  Sources.tsx           # sidebar with retrieved pages/snippets
lib/
  chunks.ts             # page chunking logic
  embeddings.ts         # OpenAI embeddings helpers
  llm.ts                # Chat completion with strict JSON & citations
  session.ts            # cookie session helper
  store.ts              # in-memory vector store + cosine similarity
```

## ⚙️ Setup
```bash
# 1) Install deps
npm i

# 2) Add env
cp .env.example .env.local
# Fill in your OpenAI key:
# OPENAI_API_KEY=sk-...

# 3) Dev
npm run dev
```

Open http://localhost:3000 and upload a PDF.

## ☁️ Deploy to Vercel
1. Push this folder to a **public GitHub repo** (or import directly in Vercel).
2. On Vercel, **New Project** → import repo.
3. Add env var: `OPENAI_API_KEY` (Project → Settings → Environment Variables).
4. Deploy. Done.

> **Note**: The MVP uses an **in-memory store** (simple, fast). In serverless, memory is per instance; it persists for a while but not across cold starts. That’s fine for the bounty demo. For persistence, swap to Supabase pgvector or Vercel Postgres — the code is structured to make that an easy follow-on change.

## 🧪 Judge Mode (what the reviewer asked for)
- Use long cases or law review articles.
- Ask: “On what page does this case mention _res judicata_?” or “Where is 'consideration' defined?”
- The model returns:
  - The **page number(s)** in the answer text.
  - **Citations**: short quotes + page numbers.
  - **Reasoning**: one sentence about how it found it (e.g., “keywords matched; top-ranked pages 14 and 22”).

## 🔒 Safety & Reasoning
- The assistant **does not** reveal step-by-step chain-of-thought.
- It provides concise reasoning + evidence via page citations.

## 🧰 Notes & Trade-offs
- **PDF parsing**: uses `pdf-parse` with a per-page delimiter trick to recover page texts. Works well for most PDFs; for scanned PDFs without OCR, use a pre-OCRed file.
- **Chunking**: ~1500 chars w/ 200 overlap; adjust in `lib/chunks.ts` if needed.
- **Embeddings**: `text-embedding-3-small` for cost/perf balance.
- **LLM**: `gpt-4o-mini` with `response_format: json_object` so answers are strict JSON.

## 🐛 Troubleshooting
- _Build complains about pdf-parse_: keep `runtime = 'nodejs'` on API routes (already set).
- _Answers without page numbers_: Ensure you uploaded the document and that it has extractable text (not just images).

## 📄 License
MIT for this demo.
