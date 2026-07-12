import { useServices } from '../state/services';

export default function ActivityLogStrip() {
  const { log } = useServices();
  return (
    <section className="glass" style={{ marginTop: 16, padding: '14px 18px' }}>
      <h2 className="panel-title" style={{ marginBottom: 10 }}>Activity</h2>
      {log.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-dimmer)', margin: 0 }}>
          No engine calls yet this session.
        </p>
      ) : (
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 12 }}>
            <tbody>
              {log.map((e) => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--text-dimmer)', whiteSpace: 'nowrap' }}>{e.time}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--violet)' }}>{e.method}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--cyan)' }}>{e.endpoint}</td>
                  <td style={{ padding: '6px 8px', color: e.ok ? 'var(--ok)' : 'var(--danger)' }}>
                    {e.ok ? 'ok' : 'error'}
                  </td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-dim)', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.message}>
                    {e.message}
                  </td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-dimmer)', whiteSpace: 'nowrap' }}>{e.durationMs} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
