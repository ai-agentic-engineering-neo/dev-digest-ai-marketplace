import { useMemo, useState } from 'react';
import type { CatalogData } from '../data/useCatalog';
import type { Kind } from '../types';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { buildFacets } from '../search/facets';
import { EmptyState } from '../components/EmptyState';
import { StatsTile } from '../components/StatsTile';
import { WhatsNewList } from '../components/WhatsNewList';
import { KindDot } from '../components/KindBadge';
import { t } from '../i18n';

const BROWSE_KINDS: Kind[] = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
const countKey = { plugin: 'plugins', skill: 'skills', agent: 'agents', command: 'commands', hook: 'hooks', mcp: 'mcp' } as const;

export function Home({ data }: { data: CatalogData }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const empty = data.stats.total === 0;

  const heroChips = useMemo(() => buildFacets(data.index.entries).keyword.slice(0, 6), [data.index.entries]);

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 22px 80px' }}>
      <section style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 44px' }}>
        <div className="mono" style={{ fontSize: 12, color: 'var(--accent)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 14 }}>{t.home.eyebrow}</div>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-.025em', fontWeight: 700, margin: '0 0 14px' }}>
          {t.home.title1}<br />{t.home.title2}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-dim)', margin: '0 auto 26px', maxWidth: 560 }}>{t.home.subtitle}</p>
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nav(routes.search({ q: q.trim() || undefined }))}
            placeholder={t.home.heroPlaceholder}
            style={{
              width: '100%', height: 52, padding: '0 16px 0 44px', background: 'var(--bg-elev)',
              border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', outline: 'none',
              fontSize: 15, boxShadow: '0 4px 24px -12px rgba(0,0,0,.4)',
            }}
          />
        </div>
        {heroChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {heroChips.map((c) => (
              <button
                key={c.value}
                onClick={() => nav(routes.search({ keyword: [c.value] }))}
                className="mono"
                style={{ height: 28, padding: '0 12px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12 }}
              >#{c.value}</button>
            ))}
          </div>
        )}
      </section>

      {empty ? (
        <EmptyState />
      ) : (
        <>
          <StatsTile stats={data.stats} />

          {data.releases.length > 0 && (
            <section style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t.home.whatsNew}</h2>
                <a onClick={() => nav(routes.whatsNew())} style={{ cursor: 'pointer', fontSize: 12, color: 'var(--text-dim)' }}>{t.home.wholeFeed}</a>
              </div>
              <WhatsNewList releases={data.releases.slice(0, 5)} compact />
            </section>
          )}

          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 14px' }}>{t.home.browseByType}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {BROWSE_KINDS.filter((k) => data.stats[countKey[k]] > 0).map((kind) => (
                <button
                  key={kind}
                  onClick={() => nav(routes.search({ kind: [kind] }))}
                  className="card-hover"
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 11, cursor: 'pointer', color: 'var(--text)' }}
                >
                  <KindDot kind={kind} />
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{t.kindLabel[kind]}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{data.stats[countKey[kind]]}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
