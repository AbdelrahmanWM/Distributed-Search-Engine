import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function useElapsed(active: boolean): string {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function Panel({
  title,
  busyLabel,
  children,
}: {
  title: string;
  busyLabel?: string | null;
  children: ReactNode;
}) {
  const elapsed = useElapsed(Boolean(busyLabel));
  return (
    <section className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title">{title}</h2>
        {busyLabel && (
          <span
            style={{ fontSize: 12, color: 'var(--violet)', fontFamily: 'var(--mono)', animation: 'pulse 1.2s infinite' }}
          >
            {busyLabel}… {elapsed}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-dim)', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--violet)' }} />
      {label}
    </label>
  );
}

export function ConfirmButton({
  label,
  onConfirm,
  disabled,
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      className="btn btn-danger"
      disabled={disabled}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 3000);
        } else {
          clearTimeout(timer.current);
          setArmed(false);
          onConfirm();
        }
      }}
    >
      {armed ? `Really ${label.toLowerCase()}?` : label}
    </button>
  );
}
