// Typed hash builders — the one place that knows the URL shape (SITE-SPEC §6).
import type { Kind } from '../types';

export interface SearchParams {
  q?: string;
  kind?: Kind[];
  keyword?: string[];
  author?: string[];
  plugin?: string[];
  sort?: 'relevance' | 'name' | 'updated';
}

export const routes = {
  home: () => '#/',
  gettingStarted: () => '#/getting-started',
  whatsNew: () => '#/whats-new',
  plugin: (name: string) => `#/plugin/${encodeURIComponent(name)}`,
  artifact: (id: string) => `#/artifact/${encodeURIComponent(id)}`,
  search: (p: SearchParams = {}) => {
    const q = new URLSearchParams();
    if (p.q) q.set('q', p.q);
    for (const k of p.kind ?? []) q.append('kind', k);
    for (const k of p.keyword ?? []) q.append('keyword', k);
    for (const a of p.author ?? []) q.append('author', a);
    for (const pl of p.plugin ?? []) q.append('plugin', pl);
    if (p.sort && p.sort !== 'relevance') q.set('sort', p.sort);
    const s = q.toString();
    return s ? `#/search?${s}` : '#/search';
  },
};

export function parseSearchParams(query: URLSearchParams): Required<SearchParams> {
  const sort = query.get('sort');
  return {
    q: query.get('q') ?? '',
    kind: query.getAll('kind') as Kind[],
    keyword: query.getAll('keyword'),
    author: query.getAll('author'),
    plugin: query.getAll('plugin'),
    sort: sort === 'name' || sort === 'updated' ? sort : 'relevance',
  };
}
