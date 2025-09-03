import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { chunkPages } from '@/lib/chunks';
import { embedTexts } from '@/lib/embeddings';
import { storeChunks, storeDoc } from '@/lib/store';
import { getOrCreateSessionId } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ ok: true, route: '/api/upload' });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const files = form.getAll('files') as unknown as File[];
    if (!files?.length) return Response.json({ error: 'No files uploaded' }, { status: 400 });

    const sessionId = getOrCreateSessionId();
    const docId = uuidv4();

    const first = files[0];
    const name = (first as any)?.name || 'document.pdf';

    // Always a Node Buffer
    const arrayBuffer = await first.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!Buffer.isBuffer(buffer) || buffer.byteLength === 0) {
      return Response.json({ error: 'Upload error: empty or invalid file buffer' }, { status: 400 });
    }

    // Robustly load pdf-parse (works for both CJS and ESM builds)
    const mod: any = await import('pdf-parse');
    const pdfParse: (data: Buffer, opts?: any) => Promise<any> = (mod?.default ?? mod);

    if (typeof pdfParse !== 'function') {
      return Response.json({ error: 'Upload error: pdf-parse did not export a function' }, { status: 500 });
    }

    // Insert a delimiter after each page so we can split reliably
    const DELIM = '[[[LB_PAGE_BREAK]]]';
    const data = await pdfParse(buffer, {
      pagerender: (pageData: any) =>
        pageData
          .getTextContent()
          .then((tc: any) => tc.items.map((it: any) => it.str).join(' ') + `\n${DELIM}\n`),
    });

    const full = data?.text ?? '';
    const pages = full
      .split(DELIM)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ pageNum: i + 1, text }));

    if (pages.length === 0) {
      return Response.json(
        { error: 'No extractable text found in PDF. If it is a scanned PDF, please OCR it first.' },
        { status: 400 }
      );
    }

    const chunks = chunkPages(pages, docId, 1500, 200);
    const vectors = await embedTexts(chunks.map((c) => `Page ${c.pageNum}: ${c.text}`));
    const stored = chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));

    storeDoc(sessionId, { docId, name, pages: pages.length });
    storeChunks(sessionId, stored);

    return Response.json({ docId, name, pages: pages.length }, { status: 200 });
  } catch (e: any) {
    // Always send JSON so the client never tries to JSON.parse HTML
    return Response.json({ error: `Upload error: ${e?.message || 'unknown'}` }, { status: 500 });
  }
}
