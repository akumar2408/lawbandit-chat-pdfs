// app/api/upload/route.ts
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { chunkPages } from '@/lib/chunks';
import { embedTexts } from '@/lib/embeddings';
import { storeChunks, storeDoc } from '@/lib/store';
import { getOrCreateSessionId } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- NEW: infer case/reporter page numbers on each PDF page ----------
/**
 * Tries to read the *legal case* page numbers from page headers/footers.
 * We keep it permissive and then smooth gaps by incrementing when possible.
 */
function inferCasePageNumbers(rawPages: { pageNum: number; text: string }[]) {
  const headerTail = 250; // first N chars to scan
  const footerTail = 250; // last N chars to scan
  const candidates: (number | null)[] = new Array(rawPages.length).fill(null);

  // Ordered set of regexes—we accept the first match we find in head/foot.
  const regexes: RegExp[] = [
    /\b\*?(\d{2,4})\*?\b/,               // 523 or *523 or 523*
    /\b(?:Page|PAGE|p\.)\s*(\d{2,4})\b/, // "Page 523", "p. 523"
    /[\[(—-]\s*(\d{2,4})\s*[\])-—]/,     // (523)  [523]  — 523 —
    /\b(\d{2,4})\b/,                     // last resort: bare number
  ];

  for (let i = 0; i < rawPages.length; i++) {
    const t = rawPages[i].text || '';
    const head = t.slice(0, headerTail);
    const foot = t.slice(Math.max(0, t.length - footerTail));
    const zones = [head, foot];

    outer: for (const zone of zones) {
      for (const re of regexes) {
        const m = zone.match(re);
        if (m && m[1]) {
          const n = parseInt(m[1], 10);
          if (Number.isFinite(n) && n >= 1 && n <= 3000) {
            candidates[i] = n;
            break outer;
          }
        }
      }
    }
  }

  // Simple smoothing: if we missed a page but have the previous, assume +1
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] == null) {
      if (i > 0 && candidates[i - 1] != null) {
        candidates[i] = (candidates[i - 1] as number) + 1;
      }
    }
  }

  const any = candidates.some((v) => v != null);

  return rawPages.map((p, i) => {
    const casePage = any && candidates[i] != null ? (candidates[i] as number) : p.pageNum;
    return {
      // NOTE: we replace pageNum with the *legal* case page number.
      pageNum: casePage,
      text: p.text,
      // If you ever want the original PDF sheet index, extend the type:
      // pdfPage: p.pageNum,
    };
  });
}

// Simple health check
export async function GET() {
  return Response.json({ ok: true, route: '/api/upload' });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files') as unknown as File[];
    if (!files || files.length === 0) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const file = files[0];
    const name = (file as any)?.name || 'document.pdf';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!Buffer.isBuffer(buffer) || buffer.byteLength === 0) {
      return Response.json({ error: 'Empty or invalid file buffer' }, { status: 400 });
    }

    // Lazy import for build safety on Vercel
    const { default: pdfParse } = await import('pdf-parse');

    const DELIM = '[[[LB_PAGE_BREAK]]]';
    const data = await pdfParse(buffer, {
      pagerender: (pageData: any) =>
        pageData
          .getTextContent()
          .then(
            (tc: any) =>
              tc.items.map((it: any) => (typeof it?.str === 'string' ? it.str : '')).join(' ') +
              `\n${DELIM}\n`
          ),
    });

    const fullText: string = data?.text ?? '';
    const rawPages = fullText
      .split(DELIM)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ pageNum: i + 1, text })); // start with raw PDF sheet index

    if (rawPages.length === 0) {
      return Response.json(
        {
          error:
            'No extractable text found in PDF. If this is a scanned PDF, please OCR it first.',
        },
        { status: 400 }
      );
    }

    // ---------- NEW: convert to *legal case* page numbers ----------
    const pages = inferCasePageNumbers(rawPages);

    // Chunk + embed using *legal* page numbers
    const docId = uuidv4();
    const chunks = chunkPages(pages, docId, 1500, 200);
    const vectors = await embedTexts(chunks.map((c) => `Page ${c.pageNum}: ${c.text}`));
    const stored = chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));

    // Store in session
    const sessionId = getOrCreateSessionId();
    storeDoc(sessionId, { docId, name, pages: pages.length });
    storeChunks(sessionId, stored);

    return Response.json({ docId, name, pages: pages.length }, { status: 200 });
  } catch (e: any) {
    console.error('[upload] error:', e);
    return Response.json(
      { error: `Upload error: ${e?.message ?? String(e)}` },
      { status: 500 }
    );
  }
}
