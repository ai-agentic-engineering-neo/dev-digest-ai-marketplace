# Contributing to the marketplace

This document explains not only *how to install* a plugin, but **how to change the catalog safely**. Every PR runs an automated check — but you should know the rules below before running it.

## General rules

- **Naming:** all `name` fields (marketplace and plugins) are `kebab-case`, no spaces. A plugin's `name` is public and **effectively immutable** after publication (renaming breaks users' installs). Use `displayName` for the UI label; use the `renames` map in the catalog to rename/remove.
- **No secrets and no absolute paths** in manifests or components. A manifest may *name* a secret slot, but must not contain a credential. Absolute paths (`/Users/...`, `/home/...`) are forbidden — use `${CLAUDE_PLUGIN_ROOT}`.
- **Do not reach outside the plugin directory** with `../` — on install the plugin is copied into a cache, and such files won't be copied.

## Required plugin structure

Details are in [`docs/PLUGIN-GUIDELINES.md`](./docs/PLUGIN-GUIDELINES.md). Minimum:

```
plugins/<name>/
└── .claude-plugin/plugin.json      # name, version, description (+ author, repository)
```

Required `plugin.json` fields: `name`, `version` (SemVer), `description`. `repository`, if present, is a **string URL**, not an object.

## Dependencies

- Shared skills/agents have a single canonical source; pin dependency versions with constraints.
- Reference components from dependency plugins with a **namespace** (`engineering-practices:react-best-practices`, not bare `react-best-practices`).

## Contribution steps

1. **Validate scope** — confirm with maintainers (platform) that a new plugin fits the catalog.
2. **Create the plugin directory** following the structure in `docs/PLUGIN-GUIDELINES.md`.
3. **Add an entry** to `.claude-plugin/marketplace.json`: `{ "name": "...", "source": "./plugins/..." }`.
   - ⚠️ Touch the catalog **only when adding a new** plugin. Bumping an existing plugin's version/description happens in its `plugin.json` and does **not** require editing `marketplace.json`.
4. **Add an owner** in [`CODEOWNERS`](./CODEOWNERS): a line `/plugins/<name>/ @team-or-user`.
5. **Update the plugin's `CHANGELOG.md`** (see [`docs/RELEASES.md`](./docs/RELEASES.md)).
6. **Local checks** before the PR:
   ```bash
   claude plugin validate ./plugins/<name>
   claude plugin validate .
   node scripts/validate-marketplace.mjs
   ```
7. **Open the PR.** CI (`.github/workflows/validate.yml`) must be green.

## Review and release

- A plugin's owner (from `CODEOWNERS`) reviews changes to that plugin; adding a new plugin to the catalog is approved by the repo maintainers.
- Release flow (SemVer, tags, rollback) and the `release.mjs` / `rollback.mjs` helpers: [`docs/RELEASES.md`](./docs/RELEASES.md).
- Permissions/secrets policy: [`docs/SECURITY.md`](./docs/SECURITY.md).
