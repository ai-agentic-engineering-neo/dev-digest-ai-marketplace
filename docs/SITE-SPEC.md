# SITE-SPEC — catalog web app specification (GitHub Pages)

> Specification for the UI app that is published to GitHub Pages and lets the
> team search and browse the contents of this marketplace (plugins, skills,
> agents, commands, hooks, MCP). This document is the entry point for design and
> subsequent implementation.
>
> Status: **draft v1**. Date: 2026-07-12.
> Sources of catalog rules — [`PLUGIN-GUIDELINES.md`](./PLUGIN-GUIDELINES.md),
> [`temp/MARKETPLACE-RESEARCH.md`](./temp/MARKETPLACE-RESEARCH.md).

---

## 1. Goal and scope

**Goal.** Give the team a single entry point to *find* the artifact they need
("I need a skill for X"), *understand* what it does, and *install* it with one
copy-paste. The catalog grows — the UI must stay useful at 3 plugins and at 50.

**Audience.** Internal engineering team (dev-first). They expect fast
keyboard-driven search, precise descriptions, and working install commands.

**Non-goals for v1.** Ratings/likes, comments, download counters,
authentication, any server-side user persistence — all of this requires a
backend and is deliberately left out here. Editing content through the UI — also
no (the source of truth stays git + the PR flow).

---

## 2. Key constraint and its consequences

GitHub Pages serves **static assets only — no runtime backend**. This dictates
the architecture:

1. **Search is client-side.** The index is assembled in CI at build time and
   placed alongside as static JSON. In the browser it runs `fuzzy + keyword`
   (MiniSearch or Fuse.js). No requests to a server at runtime.
2. **"Smart" search ≠ LLM at runtime.** An API key must not be placed on public
   static hosting. v1 is deterministic fuzzy search over descriptions,
   frontmatter, and the markdown body. The index architecture leaves room from
   the start for *precomputed embeddings* (see §12), so that semantics can be
   added without rewriting the frontend.
3. **The repository is the source of truth.** The UI writes nothing. Everything
   it shows comes from files in `plugins/**` and `marketplace.json`, assembled
   at build time.

---

## 3. Architecture (overview)

```
                    GitHub Actions (on push to main / PR preview)
  repo files  ──▶   scripts/build-index.mjs  ──▶  site/public/index.json
  (plugins/**,       (parser manifest+frontmatter+md,                   │
   marketplace.json,  release aggregator, dependency graph)             │
   docs/**)                                                            ▼
                                              Vite build (React) ──▶ GitHub Pages
                                                    │
                        browser ◀── static: index.json + bundle + markdown bodies
                        (MiniSearch in memory, hash-routing, MD render)
```

- **Indexer** (`scripts/build-index.mjs`) — Node, built-in modules only
  (the tone is set by the existing `validate-marketplace.mjs`). Walks
  `plugins/**`, reads manifests and frontmatter, assembles `index.json`
  (+ derivatives: `graph.json`, `releases.json`). Runs both locally
  (`npm run build:index`) and in CI.
- **Frontend** — Vite + React, hash-routing (`#/...`) for compatibility with
  static hosting that has no rewrite rules.
- **CI/CD** — GitHub Actions: on every push to `main` it builds the index and
  the site and deploys to Pages. On a PR — a build-check (no deploy, or a
  separate preview environment).

---

## 4. Data model (index schema)

One index record = one searchable artifact. The type is set by the `kind` field.

### 4.1 General record `IndexEntry`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | stable unique key, e.g. `plugin:react-tools` or `skill:react-tools/refactor` |
| `kind` | enum | `plugin` \| `skill` \| `agent` \| `command` \| `hook` \| `mcp` |
| `name` | string | technical name (kebab-case) |
| `displayName` | string? | human-readable label for the UI (from manifest `displayName`, otherwise `name`) |
| `description` | string | short description (manifest / frontmatter) |
| `plugin` | string | name of the container plugin (for `plugin` = itself) |
| `keywords` | string[] | tags for facets and search |
| `bodyText` | string | README/SKILL.md body stripped of markdown markup — for full-text search |
| `bodyHtmlPath` | string? | path to the rendered/raw MD for detail-view (lazy-load) |
| `sourcePath` | string | path in the repo (for "View on GitHub") |
| `githubUrl` | string | full link to the file/folder on GitHub |

### 4.2 Extension for `kind: plugin`

| Field | Type | Description |
| --- | --- | --- |
| `version` | string | SemVer from `plugin.json` |
| `author` | {name, email?} | author |
| `installCommand` | string | `/plugin install <name>@dev-digest-ai-marketplace` |
| `components` | {skills, agents, commands, hooks, mcp: number} | counters for the card |
| `dependencies` | string[] | namespaced deps (e.g. `engineering-paved-path:react-best-practices`) |
| `compatibility` | string? | condensed from `COMPATIBILITY.md` (e.g. min. Claude Code version) |
| `changelog` | {version, date?, summary}[] | parsed `CHANGELOG.md` |
| `sourceType` | enum | `path` \| `github` \| `url` \| `git-subdir` \| `npm` (from `marketplace.json`) |

### 4.3 Extension for `kind: skill|agent|command`

| Field | Type | Description |
| --- | --- | --- |
| `tools` | string[]? | declared tools/permissions from frontmatter |
| `invocation` | string? | how to invoke (e.g. `/refactor`, `@react-analyzer`) |
| `model` | string? | if set in the agent's frontmatter |

### 4.4 Derived files

- `graph.json` — nodes (plugins) + edges (dependencies) for the "Dependency graph" feature.
- `releases.json` — merged changelogs of all plugins, sorted by version/date, for "What's new" and the JSON/RSS feed.
- `stats.json` (or a field in `index.json`) — aggregated counters for the stats tile.
- `collections.json` — **manually curated** config of sets (not auto-generated).

> **Empty state.** Right now `plugins: []`. The indexer must correctly emit an
> empty `index.json`, and the UI must show an empty-state (see §7.1), not crash.

---

## 5. Functionality (full scope)

A summary of what goes into v1 (all proposed features).

| # | Feature | Priority |
| --- | --- | --- |
| 1 | Search across all content, results as cards | P0 |
| 2 | Copy install on the card | P0 |
| 3 | Detail-view with deep-link | P0 |
| 4 | Browse + facets (type, keyword, author, plugin) | P1 |
| 5 | Command palette (Cmd/Ctrl+K) | P1 |
| 6 | What's new (release feed) | P1 |
| 7 | Stats tile | P1 |
| 8 | Onboarding "how to connect the marketplace" | P1 |
| 9 | Dependency graph | P2 |
| 10 | Collections (curated sets) | P2 |
| 11 | Compatibility / health badges | P2 |
| 12 | JSON / RSS feed of new plugins | P2 |

Priorities are for the order of implementation/design, not for cutting scope.

---

## 6. Information architecture and routes

Hash-routing (deep-linkable, works on static hosting):

| Route | Screen |
| --- | --- |
| `#/` | Home: search + stats + what's new + entry to browse |
| `#/search?q=&kind=&keyword=&author=` | Search/facet results (state in the URL — shareable) |
| `#/plugin/<name>` | Plugin detail |
| `#/artifact/<id>` | Detail of a skill/agent/command/hook/mcp |
| `#/collections`, `#/collections/<id>` | Sets |
| `#/graph` | Dependency graph |
| `#/whats-new` | Full release feed |
| `#/getting-started` | Onboarding |

Global elements on all screens: top bar (logo + global search input +
Cmd+K button + theme toggle), footer (link to the repo, catalog version, link to the feed).

---

## 7. Screens and UX (for design)

### 7.1 Home (`#/`)

Sections top to bottom:
1. **Hero + search.** A large input with a placeholder along the lines of
   "Describe what you need — e.g. \"a skill for refactoring React\"". Below it —
   quick chips of the most popular keywords.
2. **Stats tile** (feature 7): N plugins · N skills · N agents · N commands · N MCP.
   The numbers are clickable → they lead into browse with the corresponding facet.
3. **What's new** (feature 6): the 3–5 latest releases as cards (plugin, version, date, summary).
4. **Browse entry**: buttons/tabs by `kind` + link to Collections and Graph.

**Empty-state (zero plugins):** a friendly message + a CTA to
`#/getting-started` and `CONTRIBUTING.md` ("The catalog is empty — add the first plugin").

### 7.2 Search results (`#/search`)

- On the left (desktop) / in a drawer (mobile) — the **facet panel** (feature 4):
  `kind` (multi-select), `keyword`, `author`, `plugin`. Facet state and the query
  live in the URL query parameters (shareable, back/forward work).
- On the right — a **grid of cards**. Sorting: relevance (default), name, last updated.
- Empty result: "Nothing found" + suggestions (reset facets,
  nearest by keyword).

**Artifact card (the key component):**
```
┌─────────────────────────────────────────────┐
│ [kind-badge]  displayName            v1.2.0  │
│ ─────────────────────────────────────────── │
│ Short description over 2 lines with ellipsis… │
│                                               │
│ #keyword #keyword #keyword                    │
│ ─────────────────────────────────────────── │
│ plugin · author        [Copy install] [Open] │
└─────────────────────────────────────────────┘
```
- `kind-badge` — a colored type badge (plugin/skill/agent/command/hook/mcp).
- **[Copy install]** (feature 2) — on a plugin it copies the install command; on
  a sub-artifact it copies the install command of the parent plugin + shows the
  invocation (e.g. `/refactor`). "Copied ✓" state for 2 s.
- **[Open]** → detail-view.
- The match is highlighted in the name/description.

### 7.3 Plugin detail (`#/plugin/<name>`)

- **Header:** displayName, version-badge, kind, author, compatibility-badge
  (feature 11), the **Copy install** and **View on GitHub** buttons.
- **Plugin contents:** lists of skills/agents/commands/hooks/MCP — each item is
  clickable into its own `#/artifact/<id>`.
- **Dependencies** (feature 9, locally): dep chips with links; a "Show in graph" button.
- **README:** rendered markdown (lazy-loaded body).
- **Changelog:** an accordion from `releases.json` for this plugin.

### 7.4 Sub-artifact detail (`#/artifact/<id>`)

Header (type, name, invocation, tools/permissions as chips), a breadcrumb to the
plugin, a Copy install button for the parent plugin, the rendered body of SKILL.md/agent.md.

### 7.5 Command palette (feature 5)

Cmd/Ctrl+K — a modal with the same index: instant incremental search,
arrow-key navigation, Enter → detail. Gives a dev-first "quick jump" from anywhere.

### 7.6 Collections (feature 10)

Curated sets from `collections.json` (title, description, list of artifact `id`s).
List of sets → set page with cards. Example: "Starter pack for React".

### 7.7 Dependency graph (`#/graph`, feature 9)

Visualization of `graph.json` (plugin nodes, dependency edges). Click a node →
plugin detail. Legend, zoom/pan. The empty/single-node state is handled correctly.

### 7.8 What's new (`#/whats-new`, feature 6)

The full chronology of releases from `releases.json`. A "Subscribe" link → JSON/RSS feed (feature 12).

### 7.9 Getting started (`#/getting-started`, feature 8)

Renders the connection steps with copy buttons (aligned with `README.md`):
`/plugin marketplace add burnjohn/dev-digest-ai-marketplace`,
`/plugin install <name>@dev-digest-ai-marketplace`, the difference between
`marketplace update` vs `plugin update`.

---

## 8. Search behavior (v1: fuzzy + keyword)

- **Engine:** MiniSearch (or Fuse.js) in memory, the index is built from `index.json`
  once at load time.
- **Searched fields with weights:** `displayName`/`name` (highest) → `keywords` →
  `description` → `bodyText` (lowest).
- **Capabilities:** prefix match, fuzzy (1–2 errors), highlight of matches,
  boost of exact name matches.
- **Facets** are applied as a post-filter over the results (AND between different
  facets, OR within a single one).
- **Performance:** target `index.json` size — keep it ≲ a few hundred KB
  gzipped; shorten `bodyText` if needed. Bodies for rendering are separate, lazy.
- **State in the URL:** `q`, `kind`, `keyword`, `author` — so the result is shareable.

---

## 9. Tech stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | **React + Vite** | component-based, familiar to the team, easy to grow |
| Language | TypeScript | typed `IndexEntry`, fewer errors as the schema grows |
| Search | MiniSearch / Fuse.js | client-side fuzzy, small bundle |
| Routing | hash-router (light) | static hosting without rewrites |
| MD render | `markdown-it` / `marked` + sanitize | detail-view README/SKILL.md |
| Graph | a light graph-viz (e.g. `@xyflow`/`vis-network` — to be confirmed at design) | feature 9 |
| Indexer | Node, built-in modules | in the style of `validate-marketplace.mjs`, no dependencies |
| CI/CD | GitHub Actions → Pages | existing repo pattern |

> The exact MD-render and graph libraries are fixed at the design stage; the
> requirement is a minimal bundle and safe rendering (sanitize untrusted markdown).

---

## 10. Build and CI/CD

1. `npm run build:index` → generates `index.json`, `graph.json`, `releases.json`,
   `stats.json` in `site/public/`.
2. `npm run build` (Vite) → static assets in `site/dist/`.
3. GitHub Actions:
   - **PR:** run the indexer + `vite build` as a check (plus the existing
     `validate-marketplace.mjs`). Optionally — a deploy preview.
   - **push to `main`:** full build + deploy to GitHub Pages.
4. Set the Vite base path to `https://<owner>.github.io/dev-digest-ai-marketplace/`.

The indexer and the site live in their own subdirectory (e.g. `site/`) so as not
to mix with the plugin structure. The site's release cadence is independent of the
plugins (aligned with the repo principle of separate lifecycles).

---

## 11. Non-functional requirements

- **Performance:** static assets + a single JSON; the goal is a fast LCP, search
  without noticeable latency on hundreds of records. Lazy-load heavy bodies and the graph.
- **Accessibility:** full keyboard navigation (especially Cmd+K and facets),
  visible focus, ARIA for cards/modals, contrast for dark and light themes.
- **Responsiveness:** desktop (grid + side facet panel) and mobile (facets in a drawer).
- **Privacy:** no trackers and no external requests at runtime by default.
- **Resilience:** an empty catalog, a plugin without README/keywords, broken
  frontmatter — all degrade gracefully (the indexer skips with a warning, the UI does not crash).
- **i18n:** interface texts are in English, kept in a single locale file
  (`site/src/i18n/`); artifact content is shown as-is.

---

## 12. Future: semantic search (embeddings)

We prepare the architecture, we do not implement it in v1:
- In CI (where secrets are allowed), generate vectors for `description`+`bodyText`
  of each record and store them as a separate static `embeddings.json`.
- In the browser — cosine similarity of the query (the query also needs to be
  vectorized; for a fully offline variant — a light model in WASM or a hybrid:
  keyword pre-filter + vector re-rank).
- Abstract search behind a `SearchProvider` interface, so that `KeywordProvider`
  (v1) and a future `SemanticProvider` are interchangeable without UI changes.

---

## 13. Open questions (to settle at design)

1. Visual language: rely on the team's existing design system, or our own minimalism?
2. Graph library (bundle/capability balance).
3. The `collections.json` format and who curates it (a separate CODEOWNERS?).
4. PR-preview deploy — needed, or is a build-check enough?
5. Whether to move the site into a separate repo in the future, or keep it as the `site/` subdirectory.

---

## 14. v1 acceptance criteria

- Search over name/description/keywords/body returns relevant cards with highlight.
- Copy install copies the correct command for a plugin.
- Detail-view opens via a deep-link and renders README/SKILL.md.
- Facets filter and are preserved in the URL.
- Cmd+K opens the palette and leads to an artifact.
- The home screen shows stats and what's new; an empty catalog gives a correct empty-state.
- Collections, the dependency graph, compatibility-badges, and the JSON/RSS feed are present and populated from the index.
- The site builds in CI and deploys to GitHub Pages; the indexer works correctly
  on an empty `plugins/`.
