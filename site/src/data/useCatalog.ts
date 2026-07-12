import { useEffect, useState } from 'react';
import type { CatalogIndex, Release, Stats } from '../types';

const BASE = import.meta.env.BASE_URL; // '/' in dev, '/dev-digest-ai-marketplace/' in build

export interface CatalogData {
  index: CatalogIndex;
  releases: Release[];
  stats: Stats;
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: CatalogData };

const EMPTY_STATS: Stats = { plugins: 0, skills: 0, agents: 0, commands: 0, hooks: 0, mcp: 0, total: 0 };

export function useCatalog(): CatalogState {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${BASE}index.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`index.json ${r.status}`)))),
      fetch(`${BASE}releases.json`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${BASE}stats.json`).then((r) => (r.ok ? r.json() : EMPTY_STATS)),
    ])
      .then(([index, releases, stats]: [CatalogIndex, Release[], Stats]) => {
        if (alive) setState({ status: 'ready', data: { index, releases, stats } });
      })
      .catch((e: Error) => {
        if (alive) setState({ status: 'error', error: e.message });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
