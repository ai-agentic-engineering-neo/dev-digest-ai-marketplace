import { useMemo } from 'react';
import type { IndexEntry } from '../types';
import { KeywordProvider } from './KeywordProvider';
import type { SearchResult } from './SearchProvider';
import { applyFacets } from './facets';
import { parseSearchParams } from '../router/routes';

export interface RankedEntry {
  entry: IndexEntry;
  matchTerms: string[];
}

/** Build the provider once per entries set. */
export function useProvider(entries: IndexEntry[]) {
  return useMemo(() => {
    const p = new KeywordProvider();
    p.index(entries);
    return p;
  }, [entries]);
}

/** Full search-screen computation: query → facets → sort. */
export function computeResults(
  entries: IndexEntry[],
  byId: Map<string, IndexEntry>,
  provider: { search: (q: string) => SearchResult[] },
  params: ReturnType<typeof parseSearchParams>,
): RankedEntry[] {
  const q = params.q.trim();

  let ranked: RankedEntry[];
  if (q) {
    ranked = provider
      .search(q)
      .map((r) => ({ entry: byId.get(r.id)!, matchTerms: r.matchTerms }))
      .filter((r) => r.entry);
  } else {
    ranked = entries.map((entry) => ({ entry, matchTerms: [] as string[] }));
  }

  // Facet post-filter.
  const kept = new Set(applyFacets(ranked.map((r) => r.entry), params).map((e) => e.id));
  ranked = ranked.filter((r) => kept.has(r.entry.id));

  // Sort. Relevance keeps provider order for queries; for browse it falls back to name.
  if (params.sort === 'name' || (!q && params.sort === 'relevance')) {
    ranked.sort((a, b) => label(a.entry).localeCompare(label(b.entry)));
  } else if (params.sort === 'updated') {
    ranked.sort((a, b) => updatedAt(b.entry).localeCompare(updatedAt(a.entry)));
  }
  return ranked;
}

const label = (e: IndexEntry) => (e.displayName || e.name).toLowerCase();
const updatedAt = (e: IndexEntry) => e.changelog?.[0]?.date ?? '';
