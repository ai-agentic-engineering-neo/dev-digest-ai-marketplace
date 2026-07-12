import type { IndexEntry } from '../types';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { KindBadge } from '../components/KindBadge';
import { CopyButton } from '../components/CopyButton';
import { Markdown } from '../components/Markdown';
import { displayNameOf, installTextFor } from '../lib/entryHelpers';
import { t } from '../i18n';

interface Props {
  id: string;
  byId: Map<string, IndexEntry>;
}

export function ArtifactDetail({ id, byId }: Props) {
  const nav = useNavigate();
  const art = byId.get(id);
  if (!art) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🔍</div>
        <h1>404</h1>
        <button onClick={() => nav(routes.home())} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>{t.whatsNew.backHome}</button>
      </main>
    );
  }

  const parent = byId.get(`plugin:${art.plugin}`);
  const install = installTextFor(art, byId);

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '26px 22px 80px' }}>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 18 }}>
        <a onClick={() => nav(routes.search())} style={{ cursor: 'pointer' }}>{t.artifact.catalog}</a>
        <span style={{ color: 'var(--text-faint)' }}> / </span>
        <a onClick={() => nav(routes.plugin(art.plugin))} style={{ cursor: 'pointer' }}>{parent ? displayNameOf(parent) : art.plugin}</a>
        <span style={{ color: 'var(--text-faint)' }}> / {art.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <KindBadge kind={art.kind} />
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>{displayNameOf(art)}</h1>
        {art.invocation && (
          <span className="mono" style={{ fontSize: 13, color: 'var(--accent)', background: 'color-mix(in oklab, var(--accent) 12%, transparent)', padding: '3px 9px', borderRadius: 6 }}>{art.invocation}</span>
        )}
        {art.model && (
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{art.model}</span>
        )}
      </div>
      <p style={{ color: 'var(--text-dim)', margin: '8px 0 0', maxWidth: 600 }}>{art.description}</p>

      {art.tools && art.tools.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{t.artifact.toolsPermissions}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {art.tools.map((tool) => (
              <span key={tool} className="mono" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 7, background: 'var(--bg-elev)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>{tool}</span>
            ))}
          </div>
        </div>
      )}

      {install && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, margin: '22px 0 30px', flexWrap: 'wrap' }}>
          <div className="mono" style={{ flex: 1, minWidth: 260, display: 'flex', alignItems: 'center', gap: 10, background: '#000', border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px', fontSize: 13, color: '#cfe', height: 44 }}>
            <span style={{ color: 'var(--text-faint)' }}>$</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{install}</span>
          </div>
          <CopyButton text={install} style={{ height: 44, padding: '0 18px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 10, fontWeight: 600 }} />
        </div>
      )}

      {(art.bodyHtmlPath || art.bodyText) && (
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>{t.artifact.docs}</h2>
          <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 13, padding: '22px 24px' }}>
            <Markdown bodyHtmlPath={art.bodyHtmlPath} fallbackText={art.bodyText} />
          </div>
        </section>
      )}
    </main>
  );
}
