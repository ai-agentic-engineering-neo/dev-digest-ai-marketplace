import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { CopyButton } from '../components/CopyButton';
import { t } from '../i18n';

export function GettingStarted() {
  const nav = useNavigate();
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button onClick={() => nav(routes.home())} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 18 }}>{t.gettingStarted.backHome}</button>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-.02em' }}>{t.gettingStarted.title}</h1>
      <p style={{ color: 'var(--text-dim)', margin: '0 0 32px', maxWidth: 560 }}>{t.gettingStarted.subtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {t.gettingStarted.steps.map((st, i) => (
          <div key={i} style={{ display: 'flex', gap: 16 }}>
            <div className="mono" style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'color-mix(in oklab, var(--accent) 16%, var(--bg-elev))', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 4px' }}>{st.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 10px' }}>{st.desc}</p>
              <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#000', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#cfe' }}>
                <span style={{ color: 'var(--text-faint)' }}>$</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.cmd}</span>
                <CopyButton text={st.cmd} label="copy" style={{ height: 24, padding: '0 8px', background: 'none', border: 'none', color: 'var(--text-dim)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30, padding: '16px 18px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text-dim)' }}>
        <strong style={{ color: 'var(--text)' }}>{t.gettingStarted.note.strong}</strong>
        {t.gettingStarted.note.body}
      </div>
    </main>
  );
}
