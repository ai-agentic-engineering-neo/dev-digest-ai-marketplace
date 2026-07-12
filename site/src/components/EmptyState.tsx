import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { t } from '../i18n';

const CONTRIBUTING = 'https://github.com/burnjohn/dev-digest-ai-marketplace/blob/main/CONTRIBUTING.md';

export function EmptyState() {
  const nav = useNavigate();
  return (
    <section
      style={{
        textAlign: 'center', border: '1px dashed var(--border-strong)', borderRadius: 16,
        padding: '54px 24px', background: 'var(--bg-elev)',
      }}
    >
      <div style={{ fontSize: 34, marginBottom: 10 }}>📦</div>
      <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>{t.empty.title}</h2>
      <p style={{ color: 'var(--text-dim)', margin: '0 auto 20px', maxWidth: 420 }}>{t.empty.body}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => nav(routes.gettingStarted())}
          style={{ height: 38, padding: '0 18px', background: 'var(--accent)', border: 'none', borderRadius: 9, color: 'var(--accent-fg)', fontWeight: 600, cursor: 'pointer' }}
        >{t.empty.howTo}</button>
        <a
          href={CONTRIBUTING} target="_blank" rel="noreferrer"
          style={{ height: 38, padding: '0 18px', display: 'inline-flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontWeight: 500 }}
        >{t.empty.contributing}</a>
      </div>
    </section>
  );
}
