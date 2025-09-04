export interface PageText {
  /** Legal/reporter page number for this page (not the raw PDF sheet). */
  pageNum: number;
  text: string;
}

export interface Chunk {
  id: string;
  docId: string;
  /** Legal/reporter page number of the chunk’s source page. */
  pageNum: number;
  text: string;
  embedding?: number[];
}

function normalizeWhitespace(s: string) {
  return s
    .replace(/[\u00A0\t]+/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Simple character-based chunker with overlap.
 * Tuned for ~1500 chars per chunk with 200 char overlap.
 */
export function chunkPages(
  pages: PageText[],
  docId: string,
  size = 1500,
  overlap = 200
): Chunk[] {
  const chunks: Chunk[] = [];
  for (const page of pages) {
    const clean = normalizeWhitespace(page.text || '');
    let i = 0;
    while (i < clean.length) {
      const part = clean.slice(i, i + size);
      if (part.trim().length) {
        chunks.push({
          id: `${docId}-${page.pageNum}-${i}`,
          docId,
          pageNum: page.pageNum,
          text: part,
        });
      }
      i += size - overlap;
    }
  }
  return chunks;
}
