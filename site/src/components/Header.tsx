import { useEffect, useState } from 'react';
import { useNavigate, useRoute } from '../router/hashRouter';
import { routes } from '../router/routes';
import { useTheme } from '../theme/ThemeProvider';
import { t } from '../i18n';

const REPO = 'https://github.com/burnjohn/dev-digest-ai-marketplace';

export function Header({ onOpenPalette }: { onOpenPalette: () => void }) {
  const nav = useNavigate();
  const route = useRoute();
  const { theme, toggle } = useTheme();
  const [q, setQ] = useState('');

  // Keep the input in sync with the URL query when on the search screen.
  useEffect(() => {
    if (route.path === '/search') setQ(route.query.get('q') ?? '');
  }, [route]);

  const submit = () => nav(routes.search({ q: q.trim() || undefined }));

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', gap: 14,
        height: 58, padding: '0 22px',
        background: 'color-mix(in oklab, var(--bg-elev) 88%, transparent)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        onClick={() => nav(routes.home())}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}
      >
        <div
          className="mono"
          style={{
            width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontWeight: 700, fontSize: 14,
          }}
        >◆</div>
        <span style={{ fontWeight: 600, letterSpacing: '-.01em' }}>{t.brand.name}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 5 }}>
          {t.brand.tag}
        </span>
      </div>

      <div style={{ position: 'relative', flex: 1, maxWidth: 520 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 13 }}>⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t.header.searchPlaceholder}
          aria-label={t.header.searchPlaceholder}
          style={{
            width: '100%', height: 36, padding: '0 12px 0 32px', background: 'var(--bg)',
            border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', outline: 'none', fontSize: 13,
          }}
        />
      </div>

      <button
        onClick={onOpenPalette}
        className="mono"
        aria-label="Command palette"
        style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12,
        }}
      >⌘K</button>

      <button
        onClick={toggle}
        aria-label={t.header.toggleTheme}
        style={{
          width: 34, height: 34, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
          color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14,
        }}
      >{theme === 'dark' ? '☾' : '☀'}</button>

      <a href={REPO} target="_blank" rel="noreferrer" style={{ color: 'var(--text-dim)', fontSize: 12, padding: '0 4px' }}>
        {t.header.github}
      </a>
    </header>
  );
}
