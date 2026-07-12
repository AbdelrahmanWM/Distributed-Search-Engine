import type { SearchResult } from '../api/client';
import { sanitizeSnippet } from '../lib/sanitizeSnippet';

export default function ResultCard({ result, maxScore }: { result: SearchResult; maxScore: number }) {
  const pct = maxScore > 0 ? Math.max(4, (result.score / maxScore) * 100) : 0;
  return (
    <article className="glass rise" style={{ padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <h3 style={{ fontSize: 16 }}>{result.title || '(untitled)'}</h3>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--cyan)', whiteSpace: 'nowrap' }}>
          {result.score.toFixed(2)}
        </span>
      </div>
      <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, opacity: 0.85 }}>
        {result.url}
      </a>
      <p
        style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-dim)', margin: '8px 0 10px' }}
        dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.content) }}
      />
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.06)' }}>
        <div style={{ height: 3, borderRadius: 2, width: `${pct}%`, background: 'var(--grad)' }} />
      </div>
    </article>
  );
}
