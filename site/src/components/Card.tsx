import type { IndexEntry } from '../types';
import { KindBadge } from './KindBadge';
import { Highlight } from './Highlight';
import { CopyButton } from './CopyButton';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { displayNameOf, installTextFor, metaLabelFor, versionLabel } from '../lib/entryHelpers';
import { t } from '../i18n';

interface Props {
  entry: IndexEntry;
  byId: Map<string, IndexEntry>;
  terms?: string[];
}

export function Card({ entry, byId, terms = [] }: Props) {
  const nav = useNavigate();
  const open = () => nav(entry.kind === 'plugin' ? routes.plugin(entry.name) : routes.artifact(entry.id));
  const install = installTextFor(entry, byId);

  return (
    <div
      className="card-hover"
      style={{
        display: 'flex', flexDirection: 'column', background: 'var(--bg-elev)',
        border: '1px solid var(--border)', borderRadius: 13, overflow: 'hidden',
      }}
    >
      <div style={{ padding: '15px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 }}>
          <KindBadge kind={entry.kind} />
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>{versionLabel(entry)}</span>
        </div>
        <div
          onClick={open}
          style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '-.01em' }}
        >
          <Highlight text={displayNameOf(entry)} terms={terms} />
        </div>
        <p
          style={{
            fontSize: 13, color: 'var(--text-dim)', margin: '5px 0 0',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', minHeight: 38,
          }}
        >
          <Highlight text={entry.description} terms={terms} />
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 11 }}>
          {(entry.keywords ?? []).slice(0, 4).map((kw) => (
            <span key={kw} className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>#{kw}</span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '10px 16px', borderTop: '1px solid var(--border)',
          background: 'color-mix(in oklab, var(--bg-elev2) 60%, var(--bg))',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {metaLabelFor(entry, byId)}
        </span>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {install && <CopyButton text={install} />}
          <button
            onClick={open}
            style={{
              height: 28, padding: '0 12px', background: 'var(--accent)', border: 'none',
              borderRadius: 7, color: 'var(--accent-fg)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            {t.search.open}
          </button>
        </div>
      </div>
    </div>
  );
}
