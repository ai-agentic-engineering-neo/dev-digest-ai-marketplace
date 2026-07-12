import { useEffect, useMemo, useRef, useState } from 'react';
import type { IndexEntry } from '../types';
import type { SearchProvider } from '../search/SearchProvider';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { KindDot } from './KindBadge';
import { displayNameOf, metaLabelFor } from '../lib/entryHelpers';
import { t } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  provider: SearchProvider;
  entries: IndexEntry[];
  byId: Map<string, IndexEntry>;
}

export function CommandPalette({ open, onClose, provider, entries, byId }: Props) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  const results = useMemo(() => {
    if (!open) return [];
    const list = q.trim()
      ? provider.search(q).map((r) => byId.get(r.id)).filter((e): e is IndexEntry => !!e)
      : entries;
    return list.slice(0, 8);
  }, [q, open, provider, entries, byId]);

  useEffect(() => { setActive(0); }, [q]);

  if (!open) return null;

  const go = (e: IndexEntry) => {
    onClose();
    nav(e.kind === 'plugin' ? routes.plugin(e.name) : routes.artifact(e.id));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]); }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh', animation: 'fade .12s ease',
      }}
    >
      <div
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
        style={{
          width: 600, maxWidth: '92vw', background: 'var(--bg-elev)', border: '1px solid var(--border-strong)',
          borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)', animation: 'pop .14s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-faint)' }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.palette.placeholder}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 15 }}
          />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 5 }}>{t.palette.esc}</span>
        </div>
        <div style={{ maxHeight: '52vh', overflow: 'auto', padding: 6 }}>
          {results.map((e, i) => (
            <button
              key={e.id}
              onClick={() => go(e)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 12px',
                background: i === active ? 'var(--bg-hover)' : 'none', border: 'none', borderRadius: 9,
                cursor: 'pointer', color: 'var(--text)', textAlign: 'left',
              }}
            >
              <KindDot kind={e.kind} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 500 }}>{displayNameOf(e)}</span>{' '}
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>· {metaLabelFor(e, byId)}</span>
              </span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'capitalize' }}>{t.kindSingular[e.kind]}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div style={{ padding: 26, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{t.palette.empty}</div>
          )}
        </div>
      </div>
    </div>
  );
}
