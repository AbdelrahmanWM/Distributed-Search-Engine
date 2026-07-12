import { useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import { useServices } from '../state/services';
import { ConfirmButton, Panel, Toggle } from './primitives';

type Busy = null | 'crawling' | 'crawling + indexing';

export default function CrawlerPanel() {
  const { run, notify } = useServices();
  const [seeds, setSeeds] = useState<string[]>(() =>
    loadJSON('distirolis.seedUrls', ['https://en.wikipedia.org/wiki/Web_crawler']),
  );
  const [pages, setPages] = useState<number | ''>(() => loadJSON('distirolis.pages', 10));
  const [clearIndexFirst, setClearIndexFirst] = useState(false);
  const [clearDocsOnTerminate, setClearDocsOnTerminate] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  const validSeeds = seeds.map((s) => s.trim()).filter(Boolean);

  function updateSeed(i: number, value: string) {
    // pasting a whitespace/newline-separated list expands into rows
    const pieces = value.split(/\s+/).filter(Boolean);
    const next = [...seeds];
    if (pieces.length > 1) next.splice(i, 1, ...pieces);
    else next[i] = value;
    setSeeds(next);
    saveJSON('distirolis.seedUrls', next);
  }

  function removeSeed(i: number) {
    const next = seeds.length > 1 ? seeds.filter((_, j) => j !== i) : [''];
    setSeeds(next);
    saveJSON('distirolis.seedUrls', next);
  }

  async function start(withIndex: boolean) {
    if (validSeeds.length === 0) {
      notify('error', 'Add at least one seed URL.');
      return;
    }
    const pageCount = Math.max(1, Number(pages) || 1);
    setBusy(withIndex ? 'crawling + indexing' : 'crawling');
    try {
      const msg = withIndex
        ? await run('POST', '/crawlAndIndexDocument', (api) => api.crawlAndIndex(validSeeds, pageCount, clearIndexFirst))
        : await run('POST', '/crawl', (api) => api.crawl(validSeeds, pageCount));
      notify('ok', msg);
    } catch {
      /* logged + toasted by services.run */
    } finally {
      setBusy(null);
    }
  }

  async function terminate() {
    try {
      notify('ok', await run('PUT', '/crawl_terminate', (api) => api.terminateCrawl(clearDocsOnTerminate)));
    } catch { /* handled */ }
  }

  async function clearHistory() {
    try {
      notify('ok', await run('DELETE', '/clearCrawlHistory', (api) => api.clearCrawlHistory()));
    } catch { /* handled */ }
  }

  return (
    <Panel title="Crawler" busyLabel={busy}>
      <div>
        <span className="label">Seed URLs</span>
        {seeds.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input
              className="input"
              style={{ flex: 1, fontSize: 13 }}
              placeholder="https://…"
              value={s}
              onChange={(e) => updateSeed(i, e.target.value)}
            />
            <button className="btn" aria-label={`remove seed ${i + 1}`} onClick={() => removeSeed(i)} style={{ padding: '4px 10px' }}>
              ✕
            </button>
          </div>
        ))}
        <button className="chip" style={{ marginTop: 8 }} onClick={() => setSeeds([...seeds, ''])}>
          + add seed
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <span className="label">Pages</span>
        <input
          className="input"
          type="number"
          min={1}
          aria-label="pages"
          value={pages}
          onChange={(e) => {
            if (e.target.value === '') {
              setPages('');
              return;
            }
            const v = Math.max(1, Number(e.target.value) || 1);
            setPages(v);
            saveJSON('distirolis.pages', v);
          }}
          style={{ width: 90 }}
        />
      </label>

      <Toggle label="clear existing index before Crawl + Index" checked={clearIndexFirst} onChange={setClearIndexFirst} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" disabled={busy !== null} onClick={() => start(false)}>
          Crawl
        </button>
        <button className="btn btn-primary" disabled={busy !== null} onClick={() => start(true)}>
          Crawl + Index
        </button>
        <button className="btn btn-danger" onClick={terminate}>
          Terminate
        </button>
      </div>
      <Toggle label="clear documents history on terminate" checked={clearDocsOnTerminate} onChange={setClearDocsOnTerminate} />
      <ConfirmButton label="Clear crawl history" onConfirm={clearHistory} disabled={busy !== null} />
    </Panel>
  );
}
