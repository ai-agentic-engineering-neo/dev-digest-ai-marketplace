import MiniSearch from 'minisearch';
import type { IndexEntry } from '../types';
import type { SearchProvider, SearchResult } from './SearchProvider';

// Field weights per SITE-SPEC §8: name/displayName highest → bodyText lowest.
export class KeywordProvider implements SearchProvider {
  private ms: MiniSearch<IndexEntry & { keywordsText: string }>;

  constructor() {
    this.ms = new MiniSearch({
      fields: ['displayName', 'name', 'keywordsText', 'description', 'bodyText'],
      storeFields: ['id'],
      searchOptions: {
        boost: { displayName: 5, name: 5, keywordsText: 3, description: 2, bodyText: 1 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: 'AND',
      },
    });
  }

  index(entries: IndexEntry[]): void {
    this.ms.removeAll();
    this.ms.addAll(
      entries.map((e) => ({ ...e, keywordsText: (e.keywords ?? []).join(' ') })),
    );
  }

  search(query: string): SearchResult[] {
    const q = query.trim();
    if (!q) return [];
    return this.ms.search(q).map((r) => ({
      id: r.id as string,
      score: r.score,
      matchTerms: r.terms,
    }));
  }
}
