import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { t } from '../i18n';

const Ctx = createContext<(msg?: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((m: string = t.toast.copied) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2000);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 70,
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elev2)',
            border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 16px',
            fontSize: 13, boxShadow: '0 12px 30px -10px rgba(0,0,0,.6)', animation: 'pop .16s ease',
          }}
        >
          <span style={{ color: 'var(--kind-skill)' }}>✓</span> {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
