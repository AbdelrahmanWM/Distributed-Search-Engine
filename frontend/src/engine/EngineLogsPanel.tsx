import { useEffect, useRef, useState } from 'react';
import type { EngineLogLine } from '../api/client';
import { useServices } from '../state/services';

const POLL_MS = 2000;
const MAX_LINES = 500;

export default function EngineLogsPanel({ active }: { active: boolean }) {
  const { api } = useServices();
  const [lines, setLines] = useState<EngineLogLine[]>([]);
  const [offline, setOffline] = useState(false);
  const [follow, setFollow] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await api.logs(lastIdRef.current);
        if (cancelled) return;
        setOffline(false);
        if (fresh.length > 0) {
          lastIdRef.current = fresh[fresh.length - 1].id;
          setLines((prev) => [...prev, ...fresh].slice(-MAX_LINES));
        }
      } catch {
        if (!cancelled) setOffline(true); // polling stays silent: no toast, no activity log
      }
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [active, api]);

  useEffect(() => {
    if (follow && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [lines, follow]);

  function onScroll() {
    const el = boxRef.current;
    if (!el) return;
    setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  }

  return (
    <section className="glass" style={{ padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="panel-title">Engine Logs</h2>
        {offline && <span className="label" style={{ color: 'var(--danger)' }}>engine offline</span>}
      </div>
      <div
        ref={boxRef}
        onScroll={onScroll}
        role="log"
        aria-label="engine logs"
        style={{
          height: 260,
          overflowY: 'auto',
          fontFamily: 'var(--mono, ui-monospace, monospace)',
          fontSize: 12.5,
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {lines.length === 0 ? (
          <span style={{ color: 'var(--text-dim)' }}>No engine output yet.</span>
        ) : (
          lines.map((l) => (
            <div key={l.id}>
              <span style={{ color: 'var(--text-dim)' }}>{l.time}</span> {l.text}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
