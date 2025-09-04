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

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/akumar2408/lawbandit-chat-pdfs.git
cd lawbandit-chat-pdfs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run locally
```bash
npm run dev
```
App will be available at: `http://localhost:3000`

### 4. Environment variables
By default the app runs in **mock mode** (no API keys required).

If you want to use **real OpenAI**:
1. Create a `.env.local` file in the root.
2. Add:
   ```env
   OPENAI_API_KEY=sk-xxxxxxx
   NEXT_PUBLIC_USE_MOCK=false
   ```
3. Restart the dev server or redeploy on Vercel.

---

## 🌐 Deployment (Vercel)
This project is deployed on [Vercel](https://vercel.com):


## 🛠️ Explanation of Approach
- **Architecture**:  
  - Next.js App Router (`/app/api/...`) for backend APIs.  
  - Frontend components in React/TypeScript (`Uploader`, `Chat`, `Sources`).  
  - Utilities in `/lib` for chunking text, session handling, and storage.

- **Retrieval flow**:  
  1. PDF uploaded → parsed into page-level text.  
  2. Pages chunked for better semantic embedding.  
  3. Embeddings generated (mock vectors in current deployment).  
  4. Stored in session memory.  
  5. User query retrieves top chunks, answers are synthesized.  

---

## 📄 License
This project is for demonstration and internship submission purposes. 
