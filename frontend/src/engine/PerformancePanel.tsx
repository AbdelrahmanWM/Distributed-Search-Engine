import { useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import { useServices } from '../state/services';
import { Panel } from './primitives';

export default function PerformancePanel() {
  const { run, notify } = useServices();
  const [threads, setThreads] = useState<number>(() => loadJSON('distirolis.threads', 8));

  async function apply() {
    try {
      const msg = await run('PUT', '/setThreadsNumber', (api) => api.setThreadsNumber(threads));
      saveJSON('distirolis.threads', threads);
      notify('ok', msg);
    } catch { /* handled — server enforces the valid range and its message is toasted */ }
  }

  return (
    <Panel title="Performance">
      <p style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: 0 }}>
        Worker threads for crawling and indexing. The engine validates the allowed range.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn" aria-label="fewer threads" onClick={() => setThreads((t) => Math.max(0, t - 1))}>−</button>
        <input
          className="input"
          type="number"
          min={0}
          aria-label="threads value"
          value={threads}
          onChange={(e) => setThreads(Math.max(0, Number(e.target.value) || 0))}
          style={{ width: 80, textAlign: 'center', fontFamily: 'var(--mono)' }}
        />
        <button className="btn" aria-label="more threads" onClick={() => setThreads((t) => t + 1)}>+</button>
        <button className="btn btn-primary" onClick={apply}>Apply threads</button>
      </div>
    </Panel>
  );
}
