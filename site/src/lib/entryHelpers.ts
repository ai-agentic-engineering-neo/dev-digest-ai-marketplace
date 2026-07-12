import type { IndexEntry } from '../types';

export const displayNameOf = (e: IndexEntry) => e.displayName || e.name;

/** Install text a card/detail Copy button writes. Plugins copy their own install
 *  command; sub-artifacts copy the parent plugin's install command. */
export function installTextFor(e: IndexEntry, byId: Map<string, IndexEntry>): string {
  if (e.kind === 'plugin') return e.installCommand ?? '';
  const parent = byId.get(`plugin:${e.plugin}`);
  return parent?.installCommand ?? '';
}

/** Small footer meta line on cards, e.g. "react-tools · Kyiv Guild". */
export function metaLabelFor(e: IndexEntry, byId: Map<string, IndexEntry>): string {
  if (e.kind === 'plugin') return e.author?.name ? `${e.name} · ${e.author.name}` : e.name;
  const parent = byId.get(`plugin:${e.plugin}`);
  const author = parent?.author?.name;
  return author ? `${e.plugin} · ${author}` : e.plugin;
}

export const versionLabel = (e: IndexEntry) => (e.version ? `v${e.version}` : e.kind);
