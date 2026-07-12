// Mirrors the shape emitted by scripts/build-index.mjs (SITE-SPEC §4).

export type Kind = 'plugin' | 'skill' | 'agent' | 'command' | 'hook' | 'mcp';

export interface Author {
  name: string;
  email?: string;
}

export interface ChangelogItem {
  version: string;
  date?: string;
  summary: string;
}

export interface IndexEntry {
  // §4.1 — common
  id: string;
  kind: Kind;
  name: string;
  displayName?: string;
  description: string;
  plugin: string;
  keywords: string[];
  bodyText: string;
  bodyHtmlPath?: string;
  sourcePath: string;
  githubUrl: string;

  // §4.2 — plugin only
  version?: string;
  author?: Author;
  installCommand?: string;
  components?: { skills: number; agents: number; commands: number; hooks: number; mcp: number };
  dependencies?: string[];
  compatibility?: string;
  changelog?: ChangelogItem[];
  sourceType?: 'path' | 'github' | 'url' | 'git-subdir' | 'npm';

  // §4.3 — skill/agent/command only
  tools?: string[];
  invocation?: string;
  model?: string;
}

export interface CatalogIndex {
  generatedAt: string;
  entries: IndexEntry[];
}

export interface Release extends ChangelogItem {
  plugin: string;
  displayName: string;
}

export interface Stats {
  plugins: number;
  skills: number;
  agents: number;
  commands: number;
  hooks: number;
  mcp: number;
  total: number;
}
