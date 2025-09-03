'use client';

export type Source = { pageNum: number; snippet: string; score: number };

export default function Sources({ items }: { items: Source[] }) {
  if (!items?.length) return null;
  return (
    <div className="card p-4 mt-4">
      <div className="text-sm text-gray-300 mb-2">Top matches</div>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold">Page {s.pageNum}</span>{" "}
            <span className="text-gray-400">({s.score.toFixed(3)})</span>
            <div className="text-gray-300 mt-1">“{s.snippet.slice(0, 240)}{s.snippet.length > 240 ? "…" : ""}”</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
