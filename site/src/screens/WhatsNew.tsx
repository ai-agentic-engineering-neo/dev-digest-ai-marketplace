import type { CatalogData } from '../data/useCatalog';
import { useNavigate } from '../router/hashRouter';
import { routes } from '../router/routes';
import { WhatsNewList } from '../components/WhatsNewList';
import { t } from '../i18n';

export function WhatsNew({ data }: { data: CatalogData }) {
  const nav = useNavigate();
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '26px 22px 80px' }}>
      <button onClick={() => nav(routes.home())} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 18 }}>{t.whatsNew.backHome}</button>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 22px', letterSpacing: '-.02em' }}>{t.whatsNew.title}</h1>
      <WhatsNewList releases={data.releases} />
    </main>
  );
}
