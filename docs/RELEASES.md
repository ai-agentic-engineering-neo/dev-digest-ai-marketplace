# RELEASES — versioning, tags, update, rollback

## SemVer

Each plugin is versioned independently in its own `plugin.json`:

| Bump | When |
| --- | --- |
| **patch** (`1.0.0 → 1.0.1`) | bug fixes, no behavior change |
| **minor** (`1.0.0 → 1.1.0`) | new features, backward-compatible |
| **major** (`1.0.0 → 2.0.0`) | breaking changes |

`version` controls updates: users receive an update only when you change this field. If `version` is omitted, on a git host **every commit** counts as a new version (undesirable for stable plugins).

## Release process

1. Make the change in the plugin's components.
2. Update the plugin's `CHANGELOG.md`.
3. Bump `version` in `plugin.json` per SemVer.
4. (If present) add/update an eval for the new behavior and run old + new evals.
5. Create an **immutable git tag** and record the **commit SHA** in the release notes.

> SemVer describes the *nature* of a change but does not identify exact bytes — for that you need a SHA or digest.

With dependencies: release the dependencies first, then the consumer plugin.

### Helper: `scripts/release.mjs`

Automates steps 2–5 for one plugin:

```bash
node scripts/release.mjs <plugin-name> <patch|minor|major|X.Y.Z> [--tag] [--dry]
```

It bumps `version`, requires a matching `## <version>` entry in the plugin's `CHANGELOG.md`, runs the structural linter and `claude plugin validate <dir> --strict`, and — with `--tag` — creates an annotated tag `<plugin>-v<version>` at HEAD (commit first). `--dry` prints the plan without changing anything.

## Catalog vs installed plugin (two different things)

```bash
/plugin marketplace update                          # refresh the CATALOG (version list)
/plugin update <plugin>@dev-digest-ai-marketplace   # update an INSTALLED plugin
```

Editing the catalog is needed **only when adding a new** plugin. Bumping an existing plugin's version does not touch `marketplace.json`.

## Rollback

Plugins here use relative sources (`./plugins/<name>`), which always resolve to the current repo state and cannot be pinned to an old version. Two ways to roll back:

1. **Forward-fix (preferred for small issues):** `git revert` the bad change and bump the version.
2. **Re-pin to a known-good commit:** switch the plugin's catalog entry to a git source pinned at a prior `sha`/tag. A plugin `source` supports both `ref` and `sha` (when both are set, `sha` wins).

### Helper: `scripts/rollback.mjs`

```bash
# pin to an exact commit
node scripts/rollback.mjs <plugin-name> --repo burnjohn/dev-digest-ai-marketplace --sha <40-char-sha>
# pin to a tag/branch
node scripts/rollback.mjs <plugin-name> --repo burnjohn/dev-digest-ai-marketplace --ref <tag>
# reset back to the in-repo relative source
node scripts/rollback.mjs <plugin-name> --relative
```

It rewrites only the plugin's `source` in `marketplace.json` and re-runs the structural linter. Review the diff and commit; users pick it up after `/plugin marketplace update`.

## Name immutability

- Do **not** change a plugin's `name` after publication — users have it installed under that slug (renaming → `plugin-not-found`).
- To change the UI label → `displayName`.
- To actually rename/remove → the `renames` map in `marketplace.json` (Claude Code ≥ 2.1.193), so existing users migrate automatically.
