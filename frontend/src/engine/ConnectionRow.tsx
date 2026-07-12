import { useState } from 'react';
import { useServices } from '../state/services';

export default function ConnectionRow() {
  const { baseUrl, setBaseUrl, offline } = useServices();
  const [draft, setDraft] = useState(baseUrl);

  return (
    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', marginBottom: 16 }}>
      <span
        aria-label={offline ? 'engine offline' : 'engine address'}
        style={{ color: offline ? 'var(--danger)' : 'var(--ok)', fontSize: 11 }}
      >
        ●
      </span>
      <span className="label">Engine</span>
      <input
        className="input"
        aria-label="engine url"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        style={{ flex: 1, fontFamily: 'var(--mono)', fontSize: 13, padding: '5px 10px' }}
      />
      <button className="btn" onClick={() => setBaseUrl(draft.trim())}>Connect</button>
    </div>
  );
}
