import { Chunk } from './chunks';

export type StoredChunk = Required<Chunk>;

type SessionStore = {
  docs: Record<
    string,
    { docId: string; name: string; pages: number; createdAt: number }
  >;
  chunks: StoredChunk[];
};

const memory = new Map<string, SessionStore>();

function getOrCreateStore(sessionId: string): SessionStore {
  const existing = memory.get(sessionId);
  if (existing) return existing;
  const fresh: SessionStore = { docs: {}, chunks: [] };
  memory.set(sessionId, fresh);
  return fresh;
}

export function cosineSim(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

export function storeDoc(
  sessionId: string,
  docMeta: { docId: string; name: string; pages: number }
) {
  const s = getOrCreateStore(sessionId);
  s.docs[docMeta.docId] = { ...docMeta, createdAt: Date.now() };
}

export function storeChunks(sessionId: string, chunks: StoredChunk[]) {
  const s = getOrCreateStore(sessionId);
  s.chunks.push(...chunks);
}

export function retrieve(
  sessionId: string,
  queryEmbedding: number[],
  topK = 6
) {
  const s = getOrCreateStore(sessionId);
  const scored = s.chunks.map((c) => ({
    ...c,
    score: cosineSim(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export function listDocs(sessionId: string) {
  const s = getOrCreateStore(sessionId);
  return Object.values(s.docs).sort((a, b) => b.createdAt - a.createdAt);
}

export function clearAll(sessionId: string) {
  memory.delete(sessionId);
}
