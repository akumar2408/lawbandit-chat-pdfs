# 📚 LawBandit – Chat with PDFs

Upload case PDFs or long articles, then ask page-specific questions.  
Answers include page numbers and supporting text snippets.  

Deployed live on Vercel: 👉 [Live App](https://lawbandit-chat-pdfs.vercel.app)  
GitHub repo: 👉 [Repo](https://github.com/akumar2408/lawbandit-chat-pdfs)

---

## 🚀 Features
- Upload **legal PDFs or articles** directly in the browser.
- Extracts and indexes **page-level text** for search and retrieval.
- Ask natural language questions; answers come with **citations**.
- Built with **TypeScript + Node.js + Next.js**.
- Currently runs in **mock mode** for reliability (no API quota required).
- Easily switchable to **real OpenAI embeddings + LLM** when API keys are available.

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/akumar2408/lawbandit-chat-pdfs.git
cd lawbandit-chat-pdfs
2. Install dependencies
bash
Copy code
npm install
3. Run locally
bash
Copy code
npm run dev
App will be available at: http://localhost:3000

4. Environment variables
By default the app runs in mock mode (no API keys required).

If you want to use real OpenAI:

Create a .env.local file in the root.

Add:

env
Copy code
OPENAI_API_KEY=sk-xxxxxxx
NEXT_PUBLIC_USE_MOCK=false
Restart the dev server or redeploy on Vercel.

🌐 Deployment (Vercel)
This project is deployed on Vercel:

Mock mode = default (no keys required).

To enable real OpenAI, set environment variables under
Vercel → Project Settings → Environment Variables.

🛠️ Explanation of Approach
Architecture:

Next.js App Router (/app/api/...) for backend APIs.

Frontend components in React/TypeScript (Uploader, Chat, Sources).

Utilities in /lib for chunking text, session handling, and storage.

Retrieval flow:

PDF uploaded → parsed into page-level text.

Pages chunked for better semantic embedding.

Embeddings generated (mock vectors in current deployment).

Stored in session memory.

User query retrieves top chunks, answers are synthesized.

Mock vs Real OpenAI:

Mock mode: Generates dummy embeddings/responses (no quota needed).

Real mode: Uses OpenAI text-embedding-3-small + gpt-4o-mini.

This design ensures judges can test the app without worrying about hitting OpenAI rate limits, but switching to real OpenAI is one env variable away.
