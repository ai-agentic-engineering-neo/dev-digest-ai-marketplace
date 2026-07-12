import type { Kind } from '../types';
import { t } from '../i18n';

export function KindBadge({ kind }: { kind: Kind }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize',
        color: `var(--kind-${kind})`,
        background: `color-mix(in oklab, var(--kind-${kind}) 15%, transparent)`,
      }}
    >
      {t.kindSingular[kind]}
    </span>
  );
}

export function KindDot({ kind }: { kind: Kind }) {
  return (
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: `var(--kind-${kind})`, flexShrink: 0 }} />
  );
}
