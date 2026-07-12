import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { ToastProvider } from './components/Toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CommandPalette } from './components/CommandPalette';
import { Home } from './screens/Home';
import { Search } from './screens/Search';
import { PluginDetail } from './screens/PluginDetail';
import { ArtifactDetail } from './screens/ArtifactDetail';
import { WhatsNew } from './screens/WhatsNew';
import { GettingStarted } from './screens/GettingStarted';
import { useCatalog, type CatalogData } from './data/useCatalog';
import { useRoute } from './router/hashRouter';
import { useProvider } from './search/useSearch';
import type { IndexEntry } from './types';
import { t } from './i18n';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </ThemeProvider>
  );
}

function Shell() {
  const { theme } = useTheme();
  const state = useCatalog();

  return (
    <div className="app" data-theme={theme}>
      {state.status === 'loading' && <Centered>{t.app.loading}</Centered>}
      {state.status === 'error' && <Centered>{t.app.loadError(state.error)}</Centered>}
      {state.status === 'ready' && <Ready data={state.data} />}
    </div>
  );
}

function Ready({ data }: { data: CatalogData }) {
  const route = useRoute();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const entries = data.index.entries;
  const byId = useMemo(() => new Map<string, IndexEntry>(entries.map((e) => [e.id, e])), [entries]);
  const provider = useProvider(entries);

  // Global Cmd/Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const seg = route.path.split('/').filter(Boolean); // e.g. ['plugin','name']
  let screen;
  if (route.path === '/' || seg.length === 0) screen = <Home data={data} />;
  else if (seg[0] === 'search') screen = <Search data={data} provider={provider} byId={byId} />;
  else if (seg[0] === 'plugin' && seg[1]) screen = <PluginDetail name={decodeURIComponent(seg.slice(1).join('/'))} byId={byId} entries={entries} />;
  else if (seg[0] === 'artifact' && seg[1]) screen = <ArtifactDetail id={decodeURIComponent(seg.slice(1).join('/'))} byId={byId} />;
  else if (seg[0] === 'whats-new') screen = <WhatsNew data={data} />;
  else if (seg[0] === 'getting-started') screen = <GettingStarted />;
  else screen = <Home data={data} />;

  return (
    <>
      <Header onOpenPalette={() => setPaletteOpen(true)} />
      {screen}
      <Footer generatedAt={data.index.generatedAt} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} provider={provider} entries={entries} byId={byId} />
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>{children}</div>;
}
