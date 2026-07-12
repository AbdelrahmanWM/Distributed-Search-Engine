import CrawlerPanel from './CrawlerPanel';
import IndexerPanel from './IndexerPanel';

export default function EngineRoom() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <CrawlerPanel />
        <IndexerPanel />
        {/* RankerPanel + PerformancePanel + ConnectionRow (Task 10) */}
      </div>
      {/* ActivityLogStrip (Task 11) */}
    </div>
  );
}
