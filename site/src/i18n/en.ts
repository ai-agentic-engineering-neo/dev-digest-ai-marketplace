// English locale — mirrors the Messages shape from uk.ts.
import type { Kind } from '../types';
import type { Messages } from './uk';

export const en: Messages = {
  locale: 'en-US',

  brand: { name: 'Catalog', tag: 'dev-digest' },

  header: {
    searchPlaceholder: 'Search the catalog…',
    github: 'GitHub ↗',
    toggleTheme: 'Toggle theme',
  },

  home: {
    eyebrow: 'Marketplace of plugins · skills · agents',
    title1: 'Find the artifact you need',
    title2: 'and install it with one copy-paste',
    subtitle:
      'Client-side fuzzy search over descriptions, frontmatter and markdown bodies. No backend — all static, built in CI.',
    heroPlaceholder: 'Describe what you need — e.g. "a skill for refactoring React"',
    whatsNew: "What's new",
    wholeFeed: 'Full feed →',
    browseByType: 'Browse by type',
  },

  empty: {
    title: 'The catalog is empty',
    body: 'No plugins yet. Add the first one — it will show up here right after the index is built in CI.',
    howTo: 'Getting started',
    contributing: 'CONTRIBUTING.md',
  },

  search: {
    filters: 'Filters',
    reset: 'Reset',
    resetFilters: 'Reset filters',
    typeLabel: 'Type',
    keywords: 'Keywords',
    author: 'Author',
    sortBy: 'Sort',
    sort: {
      relevance: 'By relevance',
      name: 'By name',
      updated: 'Recently updated',
    },
    headingAll: 'All artifacts',
    headingQuery: (q: string) => `Results for “${q}”`,
    resultCount: (n: number) => `${n} ${n === 1 ? 'result' : 'results'}`,
    nothingTitle: 'Nothing found',
    nothingBody: 'Try resetting the filters or changing the query.',
    open: 'Open',
  },

  card: {
    copy: 'Copy install',
    copied: 'Copied ✓',
  },

  plugin: {
    back: '← Back',
    composition: 'Plugin contents',
    dependencies: 'Dependencies',
    readme: 'README',
    changelog: 'Changelog',
    viewOnGithub: 'View on GitHub ↗',
    updatedAt: (d: string) => `updated ${d}`,
  },

  artifact: {
    catalog: 'Catalog',
    toolsPermissions: 'Tools / permissions',
    docs: 'Documentation',
  },

  whatsNew: {
    title: "What's new",
    backHome: '← Home',
  },

  gettingStarted: {
    backHome: '← Home',
    title: 'How to connect the marketplace',
    subtitle: 'Three steps. First add the marketplace as a source, then install individual plugins.',
    steps: [
      {
        title: 'Add the marketplace as a source',
        desc: 'Once per machine — registers the catalog in Claude Code.',
        cmd: '/plugin marketplace add burnjohn/dev-digest-ai-marketplace',
      },
      {
        title: 'Install a plugin',
        desc: 'Install any plugin from the catalog by its name.',
        cmd: '/plugin install <name>@dev-digest-ai-marketplace',
      },
      {
        title: 'Update when needed',
        desc: 'Refresh the source list or a specific installed plugin.',
        cmd: '/plugin marketplace update',
      },
    ],
    note: {
      strong: 'marketplace update vs plugin update.',
      body: ' The first refreshes the list of sources (where plugins come from); the second updates the code of a specific installed plugin.',
    },
  },

  palette: {
    placeholder: 'Jump to an artifact…',
    empty: 'Nothing found',
    esc: 'ESC',
  },

  toast: { copied: 'Copied to clipboard' },

  footer: {
    generatedAt: (d: string) => `Index built: ${d}`,
    repo: 'Repository',
  },

  kindLabel: {
    plugin: 'plugins',
    skill: 'skills',
    agent: 'agents',
    command: 'commands',
    hook: 'hooks',
    mcp: 'MCP',
  } as Record<Kind, string>,

  kindSingular: {
    plugin: 'plugin',
    skill: 'skill',
    agent: 'agent',
    command: 'command',
    hook: 'hook',
    mcp: 'MCP',
  } as Record<Kind, string>,
};
