import ActivityLogStrip from './ActivityLogStrip';
import ConnectionRow from './ConnectionRow';
import EngineLogsPanel from './EngineLogsPanel';
import CrawlerPanel from './CrawlerPanel';
import IndexerPanel from './IndexerPanel';
import PerformancePanel from './PerformancePanel';
import RankerPanel from './RankerPanel';

export default function EngineRoom({ visible = true }: { visible?: boolean }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
      <ConnectionRow />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <CrawlerPanel />
        <IndexerPanel />
        <RankerPanel />
        <PerformancePanel />
      </div>
      <EngineLogsPanel active={visible} />
      <ActivityLogStrip />
    </div>
  );
}
