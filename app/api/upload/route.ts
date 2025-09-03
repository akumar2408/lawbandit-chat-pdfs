// app/api/upload/route.ts
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { chunkPages } from '@/lib/chunks';
import { embedTexts } from '@/lib/embeddings';
import { storeChunks, storeDoc } from '@/lib/store';
import { getOrCreateSessionId } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple health check
export async function GET() {
  return Response.json({ ok: true, route: '/api/upload' });
}

export async function POST(req: NextRequest) {
  try {
    // ---- read multipart form ----
    const form = await req.formData();
    const files = form.getAll('files') as unknown as File[];
    if (!files || files.length === 0) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // MVP: take only the first file
    const file = files[0];
    const name = (file as any)?.name || 'document.pdf';

    // ---- convert to Node Buffer ----
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!Buffer.isBuffer(buffer) || buffer.byteLength === 0) {
      return Response.json({ error: 'Empty or invalid file buffer' }, { status: 400 });
    }

    // ---- parse PDF text with lazy import (build-safe) ----
    const { default: pdfParse } = await import('pdf-parse');

    // put a delimiter after each page so we can split safely
    const DELIM = '[[[LB_PAGE_BREAK]]]';
    const data = await pdfParse(buffer, {
      pagerender: (pageData: any) =>
        pageData
          .getTextContent()
          .then(
            (tc: any) =>
              tc.items.map((it: any) => (typeof it?.str === 'string' ? it.str : '')).join(' ') +
              `\n${DELIM}\n`,
          ),
    });

    const fullText: string = data?.text ?? '';
    const pages = fullText
      .split(DELIM)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ pageNum: i + 1, text }));

    if (pages.length === 0) {
      return Response.json(
        {
          error:
            'No extractable text found in PDF. If this is a scanned PDF, please OCR it first.',
        },
        { status: 400 },
      );
    }

    // ---- chunk + embed (mock or real depending on lib/embeddings.ts) ----
    const docId = uuidv4();
    const chunks = chunkPages(pages, docId, 1500, 200); // (pages, docId, chunkSize, overlap)
    const vectors = await embedTexts(chunks.map((c) => `Page ${c.pageNum}: ${c.text}`));
    const stored = chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));

    // ---- store in session ----
    const sessionId = getOrCreateSessionId();
    storeDoc(sessionId, { docId, name, pages: pages.length });
    storeChunks(sessionId, stored);

    // ---- done ----
    return Response.json({ docId, name, pages: pages.length }, { status: 200 });
  } catch (e: any) {
    console.error('[upload] error:', e);
    return Response.json(
      { error: `Upload error: ${e?.message ?? String(e)}` },
      { status: 500 },
    );
  }
}
