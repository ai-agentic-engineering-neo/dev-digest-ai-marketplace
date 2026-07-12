// Search abstraction so a future SemanticProvider (precomputed embeddings,
// SITE-SPEC §12) can replace KeywordProvider without any UI change.
import type { IndexEntry } from '../types';

export interface SearchResult {
  id: string;
  score: number;
  matchTerms: string[];
}

export interface SearchProvider {
  index(entries: IndexEntry[]): void;
  /** Ranked results for a query. Empty query → [] (caller shows browse-all). */
  search(query: string): SearchResult[];
}
