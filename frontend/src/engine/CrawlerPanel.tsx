import { useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import { useServices } from '../state/services';
import { ConfirmButton, Panel, Toggle } from './primitives';

type Busy = null | 'crawling' | 'crawling + indexing';

function parseSeeds(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export default function CrawlerPanel() {
  const { run, notify } = useServices();
  const [seedsText, setSeedsText] = useState<string>(() =>
    loadJSON('distirolis.seedUrls', ['https://en.wikipedia.org/wiki/Web_crawler']).join('\n'),
  );
  const [pages, setPages] = useState<number | ''>(() => loadJSON('distirolis.pages', 10));
  const [clearIndexFirst, setClearIndexFirst] = useState(false);
  const [clearDocsOnTerminate, setClearDocsOnTerminate] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  const validSeeds = parseSeeds(seedsText);

  function updateSeeds(text: string) {
    setSeedsText(text);
    saveJSON('distirolis.seedUrls', parseSeeds(text));
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
        <textarea
          className="input"
          aria-label="seed urls"
          placeholder="https://… (one per line)"
          rows={8}
          value={seedsText}
          onChange={(e) => updateSeeds(e.target.value)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 6,
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div className="label" style={{ marginTop: 4 }}>
          {validSeeds.length} seed URL{validSeeds.length === 1 ? '' : 's'}
        </div>
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
