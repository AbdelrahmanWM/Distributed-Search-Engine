import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiClient, EngineOfflineError } from '../api/client';
import { loadJSON, saveJSON } from '../lib/storage';

export interface LogEntry {
  id: number;
  time: string;
  method: string;
  endpoint: string;
  ok: boolean;
  message: string;
  durationMs: number;
}

export interface Toast {
  id: number;
  kind: 'ok' | 'error';
  text: string;
}

interface Services {
  api: ApiClient;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  offline: boolean;
  log: LogEntry[];
  toasts: Toast[];
  notify: (kind: 'ok' | 'error', text: string) => void;
  dismissToast: (id: number) => void;
  run: <T>(method: string, endpoint: string, fn: (api: ApiClient) => Promise<T>) => Promise<T>;
}

const Ctx = createContext<Services | null>(null);

export const DEFAULT_BASE_URL = 'http://localhost:8080';

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(() => loadJSON('distirolis.baseUrl', DEFAULT_BASE_URL));
  const [offline, setOffline] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const api = useMemo(() => new ApiClient(baseUrl), [baseUrl]);

  const setBaseUrl = useCallback((url: string) => {
    setBaseUrlState(url);
    saveJSON('distirolis.baseUrl', url);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (kind: 'ok' | 'error', text: string) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts, { id, kind, text }]);
      setTimeout(() => dismissToast(id), 5000);
    },
    [dismissToast],
  );

  const record = useCallback((entry: Omit<LogEntry, 'id' | 'time'>) => {
    setLog((l) =>
      [{ ...entry, id: nextId.current++, time: new Date().toLocaleTimeString() }, ...l].slice(0, 200),
    );
  }, []);

  const run = useCallback(
    async <T,>(method: string, endpoint: string, fn: (api: ApiClient) => Promise<T>): Promise<T> => {
      const t0 = performance.now();
      try {
        const result = await fn(api);
        setOffline(false);
        record({
          method,
          endpoint,
          ok: true,
          message: typeof result === 'string' ? result : `${(result as unknown[]).length} results`,
          durationMs: Math.round(performance.now() - t0),
        });
        return result;
      } catch (err) {
        if (err instanceof EngineOfflineError) setOffline(true);
        const message = err instanceof Error ? err.message : String(err);
        record({ method, endpoint, ok: false, message, durationMs: Math.round(performance.now() - t0) });
        notify('error', message);
        throw err;
      }
    },
    [api, record, notify],
  );

  const value = useMemo(
    () => ({ api, baseUrl, setBaseUrl, offline, log, toasts, notify, dismissToast, run }),
    [api, baseUrl, setBaseUrl, offline, log, toasts, notify, dismissToast, run],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useServices(): Services {
  const s = useContext(Ctx);
  if (!s) throw new Error('useServices must be used inside ServicesProvider');
  return s;
}

export function ToastHost() {
  const { toasts, dismissToast } = useServices();
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 50,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass rise"
          role="status"
          style={{
            padding: '10px 16px',
            maxWidth: 420,
            fontSize: 13,
            borderColor: t.kind === 'error' ? 'rgba(248,113,113,.4)' : 'rgba(52,211,153,.4)',
            cursor: 'pointer',
          }}
          onClick={() => dismissToast(t.id)}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function OfflineBanner() {
  const { offline, baseUrl } = useServices();
  if (!offline) return null;
  return (
    <div
      className="glass"
      style={{
        margin: '0 28px 16px',
        padding: '10px 16px',
        fontSize: 13,
        borderColor: 'rgba(248,113,113,.4)',
        color: 'var(--danger)',
      }}
    >
      Engine offline — nothing is listening at {baseUrl}. Start the engine, then retry your action.
    </div>
  );
}
