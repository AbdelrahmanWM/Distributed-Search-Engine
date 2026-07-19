import { useRef, useState } from 'react';
import type { SearchResult } from '../api/client';
import { loadJSON, saveJSON } from '../lib/storage';
import { useServices } from '../state/services';
import ResultCard from './ResultCard';

const CHIPS: { label: string; insert: string; caretBack?: number }[] = [
  { label: 'AND', insert: 'AND ' },
  { label: 'OR', insert: 'OR ' },
  { label: 'NOT', insert: 'NOT ' },
  { label: '( )', insert: '() ', caretBack: 2 },
  { label: '"phrase"', insert: '"" ', caretBack: 2 },
];

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function SearchRealm() {
  const { run } = useServices();
  const [query, setQuery] = useState('');
  const [accuracy, setAccuracy] = useState(() => loadJSON('distirolis.accuracy', 0.5));
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hero = status === 'idle';

  async function doSearch() {
    const q = query.trim();
    if (!q || status === 'loading') return;
    setStatus('loading');
    const t0 = performance.now();
    try {
      const r = await run('GET', '/search', (api) => api.search(q, accuracy));
      setElapsedMs(Math.round(performance.now() - t0));
      setResults(r);
      setStatus('done');
    } catch {
      setStatus('error'); // toast already shown by services.run
    }
  }

  function insertChip(chip: (typeof CHIPS)[number]) {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? query.length;
    const needsSpace = pos > 0 && !/\s/.test(query[pos - 1]);
    const insert = (needsSpace ? ' ' : '') + chip.insert;
    const next = query.slice(0, pos) + insert + query.slice(pos);
    setQuery(next);
    requestAnimationFrame(() => {
      const caret = pos + insert.length - (chip.caretBack ?? 0);
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  const maxScore = results.length ? Math.max(...results.map((r) => r.score)) : 0;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 60px' }}>
      <div style={{ textAlign: 'center', paddingTop: hero ? '18vh' : 8, transition: 'padding 0.4s ease' }}>
        {hero && (
          <h1 className="grad-text" style={{ fontSize: 44, letterSpacing: 10, marginBottom: 30 }}>
            DISTIROLIS
          </h1>
        )}
        <input
          ref={inputRef}
          type="search"
          className="input"
          placeholder='Search the index…  e.g.  raft AND "log replication" NOT paxos'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          style={{ width: '100%', padding: '14px 22px', borderRadius: 999, fontSize: 16 }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {CHIPS.map((c) => (
            <button key={c.label} className="chip" onClick={() => insertChip(c)}>
              {c.label}
            </button>
          ))}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
            <span className="label">accuracy {accuracy.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={accuracy}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAccuracy(v);
                saveJSON('distirolis.accuracy', v);
              }}
              style={{ width: 110 }}
              aria-label="accuracy"
            />
          </span>
        </div>
        {hero && (
          <p style={{ fontSize: 12, color: 'var(--text-dimmer)', marginTop: 18 }}>
            terms · "exact phrases" · AND · OR · NOT · ( grouping )
          </p>
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        {status === 'loading' && (
          <>
            <div className="skeleton" style={{ height: 92, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 92, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 92 }} />
          </>
        )}
        {status === 'done' && (
          <>
            <p className="label" style={{ marginBottom: 14 }}>
              {results.length} results · {elapsedMs} ms
            </p>
            {results.length === 0 && (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: 40 }}>
                No results. The index may be empty; crawl and index some pages in the Engine Room.
              </p>
            )}
            {results.map((r, i) => (
              <ResultCard key={`${r.url}-${i}`} result={r} maxScore={maxScore} />
            ))}
          </>
        )}
        {status === 'error' && (
          <p style={{ color: 'var(--danger)', textAlign: 'center', marginTop: 40 }}>
            Search failed. See the toast or the Engine Room activity log.
          </p>
        )}
      </div>
    </div>
  );
}
