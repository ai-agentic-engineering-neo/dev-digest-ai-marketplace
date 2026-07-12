import type { Release } from '../types';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';

export function WhatsNewList({ releases, compact }: { releases: Release[]; compact?: boolean }) {
  const nav = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10 }}>
      {releases.map((r, i) => (
        <div
          key={`${r.plugin}-${r.version}-${i}`}
          onClick={() => nav(routes.plugin(r.plugin))}
          className="card-hover"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: compact ? '14px 16px' : '16px 18px',
            background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: compact ? 11 : 12, cursor: 'pointer',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 12, padding: '2px 8px', borderRadius: 6, color: 'var(--kind-plugin)',
              background: 'color-mix(in oklab, var(--kind-plugin) 15%, transparent)', flexShrink: 0,
            }}
          >v{r.version}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{r.displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</div>
          </div>
          {r.date && <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', flexShrink: 0 }}>{r.date}</span>}
        </div>
      ))}
    </div>
  );
}
