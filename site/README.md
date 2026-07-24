# site/ — marketplace catalog (React + Vite)

The catalog web app: search, detail view, command palette (⌘K), what's new, stats,
getting-started, dark/light theme. It lives in its own directory so it doesn't mix
with the plugin layout (`plugins/`, `docs/`, `scripts/`). It implements `docs/SITE-SPEC.md`.

## How it works

**Static index + client-side search.** GitHub Pages serves static files only, so:

1. `scripts/build-index.mjs` (zero-dep Node) walks `plugins/**` at build time,
   parses manifests + frontmatter + CHANGELOG, and generates into `public/`:
   `index.json`, `releases.json`, `stats.json`, `bodies/<id>.md`.
2. The browser loads the prebuilt `index.json` and searches client-side (MiniSearch, fuzzy).

**Reindexing is automatic** — on every push to `main` touching `plugins/**`, the
`pages.yml` workflow rebuilds the index and redeploys. Manually: `npm run build:index`.

Generated files (`public/*.json`, `public/bodies/`, `dist/`) are git-ignored — they
are never committed; they exist only as build artifacts.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server at http://localhost:5173/ (builds the index first). |
| `npm run build` | Type-check + `build:index` + `vite build` → `dist/`. |
| `npm run preview` | Preview the production build locally (base-path check). |
| `npm run build:index` | Only rebuild `public/*.json` from `plugins/**`. |

## Stack

React 18 + TypeScript + Vite. Search — MiniSearch (behind a `SearchProvider`
interface, so semantic search can be added later). Routing — a small custom hash
router (deep links work on static hosting). Markdown detail — `marked` + `DOMPurify`
(sanitized), in a lazy chunk. All UI copy lives in `src/i18n/` (never hardcoded in
components).

## Hosting (GitHub Pages)

Deployment is automatic via `.github/workflows/pages.yml` (build → `dist/` → Pages).
Pull requests are checked by a separate workflow, `.github/workflows/site-build.yml`
(build, no deploy).

**One-time setup:** Settings → Pages → Source: **GitHub Actions**.
URL: `https://burnjohn.github.io/dev-digest-ai-marketplace/`

Design source: <https://claude.ai/design/p/f70daf28-7cac-42fb-a15f-9d364d9d2186>
