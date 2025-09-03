'use client';

import { useRef, useState } from 'react';

export default function Uploader(
  { onIndexed }: { onIndexed?: (meta: {docId: string; name: string; pages: number}) => void }
) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null); // show filename
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    setSuccess(null);
    if (!files || !files.length) return;
    setError(null);
    const first = files[0];
    setSelected(first.name);            // keep filename visible
    setBusy(true);

    const form = new FormData();
    for (const f of Array.from(files)) form.append('files', f);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(text); }

      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      setSuccess(`Indexed: ${data.name} (${data.pages} pages)`);
      onIndexed?.(data);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      // Do NOT clear ref.value; keep the filename visible for reassurance.
      // If you need to re-upload the same file later, you can refresh or click the input and re-pick.
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Upload case PDFs or law articles</div>
          <div className="text-sm text-gray-300">We’ll index pages for fast search and citations.</div>
        </div>
        <input
          ref={ref}
          type="file"
          accept="application/pdf"
          multiple
          disabled={busy}
          onChange={e => handleFiles(e.target.files)}
          className="text-sm"
        />
      </div>

      {selected && !busy && !success && !error && (
        <div className="text-sm text-gray-300 mt-2">Selected: {selected}</div>
      )}
      {busy && <div className="text-sm text-blue-300 mt-2">Indexing {selected ?? 'file'}…</div>}
      {success && <div className="text-sm text-green-400 mt-2">{success}</div>}
      {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
    </div>
  );
}
