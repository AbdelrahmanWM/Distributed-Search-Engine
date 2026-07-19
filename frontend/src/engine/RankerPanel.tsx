import { useState } from 'react';
import type { RankerParams } from '../api/client';
import { loadJSON, saveJSON } from '../lib/storage';
import { useServices } from '../state/services';
import { Panel } from './primitives';

export const RANKER_DEFAULTS: RankerParams = {
  BM25_K1: 1.5,
  BM25_B: 0.75,
  PHRASE_BOOST: 1.2,
  EXACT_MATCH_WEIGHT: 2.0,
};

const FIELDS: { key: keyof RankerParams; label: string; min: number; max: number; step: number; hint: string }[] = [
  { key: 'BM25_K1', label: 'BM25 K1', min: 0, max: 3, step: 0.05, hint: 'term-frequency saturation' },
  { key: 'BM25_B', label: 'BM25 B', min: 0, max: 1, step: 0.05, hint: 'document-length normalization' },
  { key: 'PHRASE_BOOST', label: 'Phrase boost', min: 0, max: 5, step: 0.1, hint: 'weight of quoted phrases' },
  { key: 'EXACT_MATCH_WEIGHT', label: 'Exact match', min: 0, max: 5, step: 0.1, hint: 'weight of exact matches' },
];

export default function RankerPanel() {
  const { run, notify } = useServices();
  const [params, setParams] = useState<RankerParams>(() => loadJSON('distirolis.ranker', RANKER_DEFAULTS));
  const [applied, setApplied] = useState(false);

  function set(key: keyof RankerParams, value: number) {
    setApplied(false);
    setParams((p) => ({ ...p, [key]: value }));
  }

  async function apply() {
    try {
      const msg = await run('PUT', '/setRankerParameters', (api) => api.setRankerParameters(params));
      saveJSON('distirolis.ranker', params);
      setApplied(true);
      notify('ok', msg);
    } catch { /* handled by services.run */ }
  }

  return (
    <Panel title="Ranker Lab">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span className="label" title={f.hint}>{f.label}</span>
            <input
              className="input"
              type="number"
              aria-label={`${f.key} value`}
              min={f.min}
              max={f.max}
              step={f.step}
              value={params[f.key]}
              onChange={(e) => set(f.key, Number(e.target.value))}
              style={{ width: 84, padding: '4px 8px', fontSize: 13, fontFamily: 'var(--mono)' }}
            />
          </div>
          <input
            type="range"
            aria-label={`${f.key} slider`}
            min={f.min}
            max={f.max}
            step={f.step}
            value={params[f.key]}
            onChange={(e) => set(f.key, Number(e.target.value))}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={apply}>Apply parameters</button>
        <button className="btn" onClick={() => { setParams(RANKER_DEFAULTS); setApplied(false); }}>
          Reset to defaults
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-dimmer)', margin: 0 }}>
        {applied ? 'Applied to the engine.' : 'Values shown are as last applied by this browser; the engine has no read-back API.'}
      </p>
    </Panel>
  );
}
