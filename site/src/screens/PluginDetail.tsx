import type { IndexEntry, Kind } from '../types';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { CopyButton } from '../components/CopyButton';
import { KindDot } from '../components/KindBadge';
import { Markdown } from '../components/Markdown';
import { displayNameOf } from '../lib/entryHelpers';
import { t } from '../i18n';

interface Props {
  name: string;
  byId: Map<string, IndexEntry>;
  entries: IndexEntry[];
}

const GROUP_ORDER: Kind[] = ['skill', 'agent', 'command', 'hook', 'mcp'];

export function PluginDetail({ name, byId, entries }: Props) {
  const nav = useNavigate();
  const plugin = byId.get(`plugin:${name}`);
  if (!plugin) return <NotFound />;

  const children = entries.filter((e) => e.plugin === name && e.kind !== 'plugin');
  const groups = GROUP_ORDER
    .map((kind) => ({ kind, items: children.filter((c) => c.kind === kind) }))
    .filter((g) => g.items.length);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button onClick={() => history.length > 1 ? history.back() : nav(routes.home())} style={backStyle}>{t.plugin.back}</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: 'color-mix(in oklab, var(--kind-plugin) 16%, var(--bg-elev))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>◆</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>{displayNameOf(plugin)}</h1>
            {plugin.version && <Tag color="plugin">v{plugin.version}</Tag>}
            {plugin.compatibility && <Tag color="skill">✓ {plugin.compatibility}</Tag>}
          </div>
          <p style={{ color: 'var(--text-dim)', margin: '8px 0 0', maxWidth: 600 }}>{plugin.description}</p>
          {plugin.author?.name && (
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
              {plugin.author.name}
              {plugin.changelog?.[0]?.date ? ` · ${t.plugin.updatedAt(plugin.changelog[0].date)}` : ''}
            </div>
          )}
        </div>
      </div>

      {plugin.installCommand && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, margin: '22px 0 30px', flexWrap: 'wrap' }}>
          <div className="mono" style={termStyle}>
            <span style={{ color: 'var(--text-faint)' }}>$</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plugin.installCommand}</span>
          </div>
          <CopyButton text={plugin.installCommand} style={{ height: 44, padding: '0 18px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, fontWeight: 600 }} />
          <a href={plugin.githubUrl} target="_blank" rel="noreferrer" style={{ height: 44, padding: '0 16px', display: 'inline-flex', alignItems: 'center', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontWeight: 500 }}>{t.plugin.viewOnGithub}</a>
        </div>
      )}

      {groups.length > 0 && (
        <Section title={t.plugin.composition}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groups.map((g) => (
              <div key={g.kind}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <KindDot kind={g.kind} />
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-dim)' }}>{t.kindLabel[g.kind]}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{g.items.length}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 8 }}>
                  {g.items.map((it) => (
                    <button key={it.id} onClick={() => nav(routes.artifact(it.id))} className="card-hover" style={{ textAlign: 'left', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px', cursor: 'pointer', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{displayNameOf(it)}</span>
                        {it.invocation && <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{it.invocation}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {plugin.dependencies && plugin.dependencies.length > 0 && (
        <Section title={t.plugin.dependencies}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {plugin.dependencies.map((d) => {
              const depPlugin = d.split(':')[0];
              const exists = byId.has(`plugin:${depPlugin}`);
              return (
                <button
                  key={d}
                  onClick={() => exists && nav(routes.plugin(depPlugin))}
                  className="mono card-hover"
                  style={{ fontSize: 12, padding: '6px 12px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: exists ? 'pointer' : 'default' }}
                >{d}{exists ? ' ↗' : ''}</button>
              );
            })}
          </div>
        </Section>
      )}

      {(plugin.bodyHtmlPath || plugin.bodyText) && (
        <Section title={t.plugin.readme}>
          <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 13, padding: '22px 24px' }}>
            <Markdown bodyHtmlPath={plugin.bodyHtmlPath} fallbackText={plugin.bodyText} />
          </div>
        </Section>
      )}

      {plugin.changelog && plugin.changelog.length > 0 && (
        <Section title={t.plugin.changelog}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plugin.changelog.map((c) => (
              <div key={c.version} style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--kind-plugin)' }}>v{c.version}</span>
                  {c.date && <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{c.date}</span>}
                </div>
                {c.summary && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 5 }}>{c.summary}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: Kind }) {
  return (
    <span className="mono" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, color: `var(--kind-${color})`, background: `color-mix(in oklab, var(--kind-${color}) 15%, transparent)` }}>{children}</span>
  );
}

function NotFound() {
  const nav = useNavigate();
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 22px', textAlign: 'center' }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
      <h1>404</h1>
      <button onClick={() => nav(routes.home())} style={backStyle}>{t.whatsNew.backHome}</button>
    </main>
  );
}

const backStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 20 };
const termStyle: React.CSSProperties = { flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 10, background: '#000', border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px', fontSize: 13, color: '#cfe', height: 44 };
