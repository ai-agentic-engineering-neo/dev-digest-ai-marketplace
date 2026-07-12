# dev-digest-ai-marketplace

A private team **Claude Code plugin marketplace** — a catalog the team installs and updates shared plugins from (skills, agents, hooks, MCP servers).

The catalog lives separately from any product: different users, owners, and release cadence. A product release must not force a plugin release, and vice versa.

## Usage

Add the marketplace (once):

```
/plugin marketplace add burnjohn/dev-digest-ai-marketplace
```

Install a plugin:

```
/plugin install <plugin-name>@dev-digest-ai-marketplace
```

`<plugin-name>` is the `name` of an entry in `.claude-plugin/marketplace.json`; `dev-digest-ai-marketplace` is the catalog name.

## Updating (two different things)

| Command | What it does |
| --- | --- |
| `/plugin marketplace update` | Refreshes the **catalog** — pulls the list of available plugins/versions |
| `/plugin update <plugin>@dev-digest-ai-marketplace` | Updates an already **installed plugin** to a new version |

Refreshing the catalog does not update installed plugins by itself.

## Repository layout

```
.claude-plugin/marketplace.json   # the catalog (plugin registry)
plugins/                          # each plugin in its own subdirectory
docs/PLUGIN-GUIDELINES.md         # plugin anatomy (manifest, dependencies)
docs/SECURITY.md                  # permissions, secrets policy
docs/RELEASES.md                  # SemVer, tags, update, rollback
scripts/validate-marketplace.mjs  # structural linter (runs in CI)
scripts/release.mjs               # version bump + validate + optional tag
scripts/rollback.mjs              # re-pin a plugin source to a prior sha/ref
.github/workflows/validate.yml    # CI on every pull request
CODEOWNERS · CONTRIBUTING.md
```

## Contributing

Before opening a PR, read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`docs/PLUGIN-GUIDELINES.md`](./docs/PLUGIN-GUIDELINES.md). Every PR runs an automated check (`.github/workflows/validate.yml`): the structural linter plus `claude plugin validate`.

> **Maintainer recommendation:** make the `Validate marketplace` job a **required status check** in branch protection on `main`, so a PR cannot merge without a green check, regardless of approvals.

## Principles

- **Explore first, standardise later** — don't over-engineer governance before 2–3 real plugins exist.
- **Pin versions, don't auto-update** external dependencies; update deliberately.
- **Portability:** keep `SKILL.md` compatible (Markdown + YAML frontmatter) with other agents.
