import type { Facets as FacetData } from '../search/facets';
import type { Kind } from '../types';
import type { SearchParams } from '../router/routes';
import { KindDot } from './KindBadge';
import { t } from '../i18n';

interface Props {
  facets: FacetData;
  active: Required<SearchParams>;
  onToggle: (type: 'kind' | 'keyword' | 'author', value: string) => void;
  onClear: () => void;
}

export function Facets({ facets, active, onToggle, onClear }: Props) {
  const isOn = (type: 'kind' | 'keyword' | 'author', v: string) => (active[type] as string[]).includes(v);

  return (
    <aside style={{ alignSelf: 'start', position: 'sticky', top: 82 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-faint)' }}>{t.search.filters}</span>
        <button onClick={onClear} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>{t.search.reset}</button>
      </div>

      <FacetGroup label={t.search.typeLabel}>
        {facets.kind.map((f) => (
          <button
            key={f.value}
            onClick={() => onToggle('kind', f.value)}
            className="card-hover"
            style={rowStyle(isOn('kind', f.value))}
          >
            <KindDot kind={f.value as Kind} />
            <span style={{ flex: 1, textTransform: 'capitalize', fontSize: 13 }}>{t.kindLabel[f.value as Kind]}</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{f.count}</span>
          </button>
        ))}
      </FacetGroup>

      {facets.keyword.length > 0 && (
        <FacetGroup label={t.search.keywords}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {facets.keyword.map((f) => {
              const on = isOn('keyword', f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => onToggle('keyword', f.value)}
                  className="mono"
                  style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    background: on ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'var(--bg-elev)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    color: on ? 'var(--accent)' : 'var(--text-dim)',
                  }}
                >{f.value}</button>
              );
            })}
          </div>
        </FacetGroup>
      )}

      {facets.author.length > 0 && (
        <FacetGroup label={t.search.author}>
          {facets.author.map((f) => (
            <button key={f.value} onClick={() => onToggle('author', f.value)} className="card-hover" style={rowStyle(isOn('author', f.value))}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, textAlign: 'left' }}>{f.value}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>{f.count}</span>
            </button>
          ))}
        </FacetGroup>
      )}
    </aside>
  );
}

function FacetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', margin: '0 0 8px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>
    </div>
  );
}

const rowStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 7,
  background: on ? 'var(--bg-hover)' : 'transparent', border: 'none', cursor: 'pointer',
  color: 'var(--text)', textAlign: 'left', width: '100%',
});
