import { useState } from 'react';
import { useServices } from '../state/services';
import { Panel, Toggle } from './primitives';

export default function IndexerPanel() {
  const { run, notify } = useServices();
  const [clearFirst, setClearFirst] = useState(false);
  const [clearHistoryOnTerminate, setClearHistoryOnTerminate] = useState(false);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      notify('ok', await run('POST', '/indexDocuments', (api) => api.indexDocuments(clearFirst)));
    } catch {
      /* handled by services.run */
    } finally {
      setBusy(false);
    }
  }

  async function terminate() {
    try {
      notify('ok', await run('PUT', '/indexDocuments_terminate', (api) => api.terminateIndex(clearHistoryOnTerminate)));
    } catch { /* handled */ }
  }

  return (
    <Panel title="Indexer" busyLabel={busy ? 'indexing' : null}>
      <p style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: 0 }}>
        Builds the inverted index from crawled documents.
      </p>
      <Toggle label="clear existing index before build" checked={clearFirst} onChange={setClearFirst} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" disabled={busy} onClick={build}>
          Build index
        </button>
        <button className="btn btn-danger" onClick={terminate}>
          Terminate indexing
        </button>
      </div>
      <Toggle
        label="clear index history on terminate"
        checked={clearHistoryOnTerminate}
        onChange={setClearHistoryOnTerminate}
      />
    </Panel>
  );
}
