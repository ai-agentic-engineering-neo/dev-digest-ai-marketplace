import type { IndexEntry, Kind } from '../types';
import type { SearchParams } from '../router/routes';

export interface FacetCount {
  value: string;
  count: number;
}
export interface Facets {
  kind: FacetCount[];
  keyword: FacetCount[];
  author: FacetCount[];
}

const byCountDesc = (a: FacetCount, b: FacetCount) => b.count - a.count || a.value.localeCompare(b.value);

/** Build facet counts over a set of entries. */
export function buildFacets(entries: IndexEntry[], keywordLimit = 24): Facets {
  const kind = new Map<string, number>();
  const keyword = new Map<string, number>();
  const author = new Map<string, number>();
  for (const e of entries) {
    kind.set(e.kind, (kind.get(e.kind) ?? 0) + 1);
    for (const k of e.keywords ?? []) keyword.set(k, (keyword.get(k) ?? 0) + 1);
    if (e.kind === 'plugin' && e.author?.name) author.set(e.author.name, (author.get(e.author.name) ?? 0) + 1);
  }
  const toArr = (m: Map<string, number>) =>
    [...m.entries()].map(([value, count]) => ({ value, count })).sort(byCountDesc);
  return {
    kind: toArr(kind),
    keyword: toArr(keyword).slice(0, keywordLimit),
    author: toArr(author),
  };
}

/** Post-filter: AND across facet types, OR within a single type (SITE-SPEC §8). */
export function applyFacets(entries: IndexEntry[], f: SearchParams): IndexEntry[] {
  return entries.filter((e) => {
    if (f.kind?.length && !f.kind.includes(e.kind as Kind)) return false;
    if (f.author?.length && !(e.kind === 'plugin' && e.author && f.author.includes(e.author.name))) return false;
    if (f.plugin?.length && !f.plugin.includes(e.plugin)) return false;
    if (f.keyword?.length && !(e.keywords ?? []).some((k) => f.keyword!.includes(k))) return false;
    return true;
  });
}
