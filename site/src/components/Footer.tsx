import { t } from '../i18n';

const REPO = 'https://github.com/burnjohn/dev-digest-ai-marketplace';

export function Footer({ generatedAt }: { generatedAt?: string }) {
  const date = generatedAt ? new Date(generatedAt).toLocaleString(t.locale) : '';
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)', padding: '20px 22px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        color: 'var(--text-faint)', fontSize: 12, maxWidth: 1180, margin: '40px auto 0',
      }}
    >
      <a href={REPO} target="_blank" rel="noreferrer" style={{ color: 'var(--text-dim)' }}>{t.footer.repo} ↗</a>
      {date && <span className="mono">{t.footer.generatedAt(date)}</span>}
    </footer>
  );
}
