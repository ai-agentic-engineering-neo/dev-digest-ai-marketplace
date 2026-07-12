import type { Stats, Kind } from '../types';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { t } from '../i18n';

const ORDER: Kind[] = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
const countKey: Record<Kind, keyof Stats> = {
  plugin: 'plugins', skill: 'skills', agent: 'agents', command: 'commands', hook: 'hooks', mcp: 'mcp',
};

export function StatsTile({ stats }: { stats: Stats }) {
  const nav = useNavigate();
  const shown = ORDER.filter((k) => stats[countKey[k]] > 0);
  if (!shown.length) return null;

  return (
    <section style={{ display: 'grid', gridTemplateColumns: `repeat(${shown.length}, 1fr)`, gap: 12, marginBottom: 40 }}>
      {shown.map((kind) => (
        <button
          key={kind}
          onClick={() => nav(routes.search({ kind: [kind] }))}
          className="card-hover"
          style={{
            textAlign: 'left', background: 'var(--bg-elev)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 16, cursor: 'pointer',
          }}
        >
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>{stats[countKey[kind]]}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{t.kindLabel[kind]}</div>
        </button>
      ))}
    </section>
  );
}
