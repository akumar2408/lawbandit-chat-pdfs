'use client';

import { useState } from 'react';
import Sources, { Source } from './Sources';

type Msg = { role: 'user' | 'assistant'; text: string };

export default function Chat() {
  const [q, setQ] = useState('On what page does this document define consideration?');
  const [history, setHistory] = useState<Msg[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask() {
    const question = q.trim();
    if (!question) return;
    setBusy(true);
    setHistory(h => [...h, { role: 'user', text: question }]);
    setSources([]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      const answer = data.answer?.answer ?? data.answer ?? 'No answer';
      setHistory(h => [...h, { role: 'assistant', text: answer }]);
      const srcs: Source[] = (data.retrieved ?? []).map((r: any) => ({
        pageNum: r.pageNum,
        snippet: r.text,
        score: r.score
      }));
      setSources(srcs);
    } catch (e:any) {
      setHistory(h => [...h, { role: 'assistant', text: e.message || 'Error' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4 mt-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' ? ask() : null}
            placeholder="Ask a page-specific question..."
            className="flex-1 rounded-xl bg-gray-900/50 px-3 py-2 outline-none text-sm"
          />
          <button onClick={ask} disabled={busy} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold">
            {busy ? 'Thinking…' : 'Ask'}
          </button>
        </div>

        <div className="space-y-3">
          {history.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-gray-800' : 'bg-gray-700/70'}`}>
              <div className="text-xs text-gray-300 mb-1">{m.role === 'user' ? 'You' : 'Assistant'}</div>
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          ))}
        </div>

        <Sources items={sources} />
      </div>
    </div>
  );
}
