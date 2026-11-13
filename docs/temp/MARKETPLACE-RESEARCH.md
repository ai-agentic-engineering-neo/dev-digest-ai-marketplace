# Research: how to correctly create a marketplace repository for Claude Code

> The goal of this document is to capture requirements and good practices from primary sources, so that **after** the repository is ready we can go through a checklist and verify everything was done correctly.
>
> Research date: 2026-07-12. Sources — the official Claude Code documentation + public best-practices articles (see the "Sources" section).
>
> Note: there are no separate instructions online under the name "CodeCoda" — CodeCoda is the course provider; the authoritative source of the rules = the official Claude Code documentation, which lesson L08 relies on.

---

## 1. What kind of repository this is

A marketplace for Claude Code is an ordinary git repository with one mandatory catalog file, `.claude-plugin/marketplace.json`. There is no need to publish to npm or host it separately: Claude Code reads the catalog directly from GitHub/GitLab/a git host. Each plugin lives in its own subdirectory with its own `plugin.json`.

## 2. Official repository structure

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # catalog (MANDATORY, at the repo root)
├── plugins/
│   ├── my-plugin/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json        # plugin manifest (MANDATORY)
│   │   ├── commands/              # slash commands (optional)
│   │   ├── agents/                # agents (optional)
│   │   ├── skills/                # skills (optional)
│   │   │   └── skill-name/
│   │   │       └── SKILL.md
│   │   ├── hooks/                 # event handlers (optional)
│   │   ├── .mcp.json              # MCP server config (optional)
│   │   ├── README.md
│   │   ├── CHANGELOG.md
│   │   └── COMPATIBILITY.md
│   └── another-plugin/
│       └── ...
├── CODEOWNERS
├── CONTRIBUTING.md
└── README.md
```

## 3. Mandatory fields

### `marketplace.json`
- `name` — string, kebab-case, no spaces. **Public**: users see it in `/plugin install foo@your-marketplace`. One marketplace per name per user (adding a second one with the same name replaces the first).
- `owner` — object; the `name` field is mandatory (`email` optional).
- `plugins` — array; each entry has at minimum `name` + `source`.

Minimal example:
```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "team-ai-marketplace",
  "owner": { "name": "AI Engineering", "email": "team@org.com" },
  "plugins": [
    { "name": "my-plugin", "source": "./plugins/my-plugin", "description": "...", "category": "development" }
  ]
}
```
> `$schema` provides autocomplete/validation in the editor; Claude Code ignores this field during loading.

### `plugin.json` (`plugins/<name>/.claude-plugin/plugin.json`)
- Minimum: `name`, `version`, `description`.
- `author` — object (`name` mandatory, `email` optional).
- `repository` — **string URL**, NOT an object (`{"type":"git",...}` will cause a validation error).

## 4. Nuances and pitfalls (from the official docs)

- **`version` controls updates.** If set — an update will only arrive when you change this field (bump it on every release). If `version` is omitted on a git host — **every commit counts as a new version**. For exact pinning — `sha` (full 40-character commit).
- **`name` is effectively immutable.** Users have the plugin under this slug; renaming breaks installation (`plugin-not-found`).
  - For the label in the UI — `displayName` (spaces/casing allowed; ≥ 2.1.143).
  - For an actual rename/removal — the `renames` map (≥ 2.1.193).
- **Relative paths** are resolved relative to the **repo root** (the directory containing `.claude-plugin/`), not `.claude-plugin/` itself. They must start with `./`. Do not use `../` outside the root.
  - ⚠️ Relative paths **do not work when served via a direct URL** to `marketplace.json` (only the file itself is downloaded). For URL distribution — a `github`/`git url`/`npm` source.
  - Optionally, `metadata.pluginRoot: "./plugins"` lets you write `"source": "formatter"` instead of `"./plugins/formatter"`.
- **Marketplace source ≠ plugin source** — they are pinned independently; a plugin can live in a different repo.
  - Marketplace source: supports `ref` (branch/tag), **not** `sha`.
  - Plugin source: supports both `ref` and `sha`. If both are set — `sha` is the effective pin.
- **Plugin source types:** relative path, `github` (`repo`,`ref?`,`sha?`), `url` (`url`,`ref?`,`sha?`), `git-subdir` (`url`,`path`,`ref?`,`sha?` — sparse clone for monorepos), `npm` (`package`,`version?`,`registry?`).
- **Plugins are copied into a cache** (`~/.claude/plugins/cache`) — you cannot reference files outside the plugin directory via `../`. For scripts/hooks/MCP — `${CLAUDE_PLUGIN_ROOT}`; for state that survives updates — `${CLAUDE_PLUGIN_DATA}`; for shared files — a symlink.
- **Reserved names** (not for third parties): `claude-code-marketplace`, `claude-code-plugins`, `claude-plugins-official`, `claude-plugins-community`, `agent-skills`, `anthropic-*`, and so on, and anything that imitates official sources. Otherwise the marketplace will stop loading.
- **`strict` (default `true`)** — `plugin.json` is the source of truth for components. With `strict: false`, the marketplace entry describes everything itself, and a separate `plugin.json` is not required.
- **No secrets and no absolute paths** in manifests. A manifest may name a secret slot, but must not contain the credential.

## 5. Validation and local testing commands

```bash
# check structure/JSON
claude plugin validate ./plugins/my-plugin
claude plugin validate .

# run locally without installing into user scope
claude --plugin-dir ./plugins/my-plugin

# add a marketplace from a local directory for testing
/plugin marketplace add ./path/to/marketplace

# the published flow
/plugin marketplace add owner/repo
/plugin install plugin-name@marketplace-name
/plugin marketplace update      # update the CATALOG (list of releases)
/plugin update plugin@marketplace # update an INSTALLED plugin
```
> Schema validation proves that the manifest has the correct shape. Evals check behavior. One does not replace the other.

## 6. Good practices for an organizational marketplace (from the web)

The main source is the AutoScout24 write-up (16 plugins, several teams):

- **A repository separate from the product** — different users, owners, and release cadence.
- **Two-tier governance:** "autonomy on updates, governance on additions". Any team opens a PR against another's plugin (reviewed by the owning team); adding a new plugin is approved by the platform team.
- **CODEOWNERS per plugin** + a catch-all by default:
  ```
  * @org/platform-engineering
  /plugins/jira/ @org/jira-team
  ```
  Ownership = responsibility for review/support, not exclusivity.
- **SemVer:** patch — bug fixes, minor — new features, major — breaking changes.
- **Decouple the version bump from the registry:** a team changes the `version`/`description` of its plugin **without touching** `marketplace.json`. Editing the catalog is only required when *adding a new* plugin. This is the foundation of the governance model.
- **A mandatory CI linter** (a required check on every PR): validates plugin structure, registry consistency, skill conventions, CODEOWNERS entries, and version bumps. A PR is not merged without a green linter, regardless of approvals.
- **`CONTRIBUTING.md` from the very start:** naming, the mandatory directory structure, `plugin.json` fields, dependency rules, the ban on secrets/absolute paths, the mandatory checks before a release, CHANGELOG rules, who reviews and who releases.
- **Research first, then standardize** — don't over-engineer before real skills appear.
- **Pin versions, don't auto-update** external skills; update the catalog and the installed plugin separately.
- **Portability:** keep `SKILL.md` (Markdown + YAML frontmatter) compatible with multiple agents.
- **Dependency graph:** shared skills/agents have a single canonical source; version constraints are fixed; skills/agents from dependent plugins are used with a namespace (`engineering-practices:react-best-practices`, not the bare `react-best-practices`).

---

## 7. Checklist for verifying the FINISHED repository

### Structure
- [ ] `.claude-plugin/marketplace.json` exists at the repo root
- [ ] Each plugin under `plugins/<name>/` has its own `.claude-plugin/plugin.json`
- [ ] There are `README.md`, `CONTRIBUTING.md`, `CODEOWNERS`
- [ ] No personal shortcuts/experiments/local rules that leaked in from the home `.claude/`

### `marketplace.json`
- [ ] `name` — kebab-case, no spaces, NOT from the reserved list
- [ ] `owner.name` is set
- [ ] Each `plugins[]` entry has `name` + `source`
- [ ] Relative `source` values start with `./` and don't go outside the root
- [ ] (If URL distribution) the source is not relative, but `github`/`git`/`npm`

### `plugin.json` (for each plugin)
- [ ] `name`, `version`, `description` are present
- [ ] `name` matches the slug in the marketplace and has not changed since publication
- [ ] `repository` is a string URL, not an object
- [ ] `version` is bumped on every release (SemVer)
- [ ] No secrets and no absolute paths; scripts via `${CLAUDE_PLUGIN_ROOT}`
- [ ] No `../` references outside the plugin directory
- [ ] Skill/agent references use the plugin namespace where there are dependencies

### Governance
- [ ] `CODEOWNERS`: catch-all + per-plugin paths
- [ ] `CONTRIBUTING.md` describes the structure, checks, review and release process
- [ ] CI linter as a required check (structure, registry, CODEOWNERS, version bumps)
- [ ] The marketplace lives in a repo separate from the product

### Validation/behavior
- [ ] `claude plugin validate .` — green
- [ ] `claude plugin validate ./plugins/<name>` — green for each one
- [ ] A local run with `--plugin-dir` works
- [ ] Evals: activation on a relevant scenario, namespace without missing-skill warnings, no activation on an irrelevant request
- [ ] Installation into another existing project succeeds; the installer shows the dependency graph before confirmation
- [ ] The trace shows the correct plugin version and the resolved versions of dependencies
- [ ] `marketplace update` vs `plugin update` are separated and documented

---

## 8. Sources

- [Create and distribute a plugin marketplace — Claude Code Docs](https://code.claude.com/docs/en/plugin-marketplaces) — the primary source of rules
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) — the official example catalog
- [ivan-magda/claude-code-plugin-template](https://github.com/ivan-magda/claude-code-plugin-template) — a ready-made GitHub template
- [AutoScout24 — Designing a Coding Agent Skills Marketplace](https://tech.autoscout24.com/blog/posts/designing-a-coding-agent-skills-marketplace/) — organizational best practices
- [Build Your Own Claude Code Marketplace (dev.to / nagell)](https://dev.to/nagell/build-your-own-claude-code-marketplace-scaffold-structure-and-auto-updates-4n3f) — a practical walkthrough
- [Dominic Böttger — Private Claude Code Plugin Marketplace](https://dominic-boettger.com/blog/claude-code-private-plugin-marketplace-guide/) — a private team marketplace
- [JFrog — Agent Skills are the New Packages of AI](https://jfrog.com/blog/agent-skills-new-ai-packages/) — security/versioning
- [Chris Ayers — Agent Skills, Plugins and Marketplace: The Complete Guide](https://chris-ayers.com/posts/agent-skills-plugins-marketplace/) — a complete guide
