# Specification: the four plugins and how they fit together

> What we extract from `burnjohn/dev-digest` into this marketplace, and the shape each plugin takes.
> Grounded in steps 2–5 of the lesson and the **actual** contents of the source branch.
> Structure/manifest rules live in [`PLUGIN-GUIDELINES.md`](./PLUGIN-GUIDELINES.md), releases in [`RELEASES.md`](./RELEASES.md), the verification checklist in [`temp/MARKETPLACE-RESEARCH.md`](./temp/MARKETPLACE-RESEARCH.md).

**Content source:** `burnjohn/dev-digest`, branch `lesson-7-lab/multiagents-finish` (commit `af92aa88`), directory `.claude/` — that is where the agents, the `run-plan`/`workflow-retro` skills, evals, and docs live. (The starter's default branch has none of these — only skills.)

---

## 1. Overview

We extract **four** plugins. Three are reusable **dependencies** (each supplies one self-contained thing); the fourth is the **consumer** that assembles them into a Spec-Driven Development workflow:

| Plugin | Role | Provides |
| --- | --- | --- |
| `engineering-practices` | dependency | shared engineering skills (React, Next.js, Fastify, architecture, testing, security) |
| `research-tools` | dependency | the read-only `researcher` agent |
| `architecture-review` | dependency | a generalized `architecture-reviewer` agent |
| `sdd-engineering` | consumer | 4 agents + the `run-plan` and `workflow-retro` skills; depends on the three above at `^1.0.0` |

**Dependency graph** (a DAG, not a star — `architecture-review` also builds on `engineering-practices`):

```
sdd-engineering  ──depends^1.0.0──▶  engineering-practices ◀─┐
                 ──depends^1.0.0──▶  research-tools           │
                 ──depends^1.0.0──▶  architecture-review ──depends^1.0.0┘
```

Full visualization — [`DEPENDENCY-GRAPH.md`](./DEPENDENCY-GRAPH.md).

**What we do NOT port** (stays in the product repo):
- Product specs, secrets, cache, DevDigest-specific instructions.
- Components out of scope for the release: agents `doc-writer`, `test-writer`, `architecture-reviewer-lite`; skills `pr-self-review`, `engineering-insights`, `dependency-checker` (product review-pipeline and per-module LEARNINGS — bound to DevDigest).
- DevDigest catalog-site artifacts: `tile.json` files inside skill directories.

---

## 2. Dependency plugins

### 2.1 `engineering-practices`

The single canonical source for shared engineering skills — so we don't duplicate them in every plugin. These are the engineering skills from `.claude/skills/`, grouped by layer of the stack:

| Category (slide) | Skills |
| --- | --- |
| React | `react-best-practices` |
| Next.js | `next-best-practices` |
| Fastify | `fastify-best-practices` |
| testing | `react-testing-library` |
| security | `security` |
| architecture | `frontend-architecture`, `onion-architecture`, `mermaid-diagram` |
| full-stack foundations | `typescript-expert`, `zod`, `drizzle-orm-patterns`, `postgresql-table-design` |

```
plugins/engineering-practices/
├── .claude-plugin/plugin.json
├── skills/
│   ├── react-best-practices/SKILL.md
│   ├── next-best-practices/SKILL.md
│   ├── fastify-best-practices/SKILL.md
│   ├── react-testing-library/SKILL.md
│   ├── security/SKILL.md
│   ├── frontend-architecture/SKILL.md
│   ├── onion-architecture/SKILL.md
│   ├── mermaid-diagram/SKILL.md
│   ├── typescript-expert/SKILL.md
│   ├── zod/SKILL.md
│   ├── drizzle-orm-patterns/SKILL.md
│   └── postgresql-table-design/SKILL.md
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

- Skills are portable: each `SKILL.md` is Markdown + YAML frontmatter, compatible with multiple agents.
- Supporting scripts inside a skill are resolved via `${CLAUDE_SKILL_DIR}`, **not** a hardcoded `.claude/skills/` path.
- `tile.json` files (DevDigest catalog-site specific) are removed.

### 2.2 `research-tools`

Provides a single **read-only** `researcher` agent. In the source it is already clean — no DevDigest paths — so it ports almost as-is.

```
plugins/research-tools/
├── .claude-plugin/plugin.json
├── agents/researcher.md          # tools: Read, Glob, Grep, Bash, WebSearch, WebFetch — no Edit/Write
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

### 2.3 `architecture-review`

Provides a **generalized** `architecture-reviewer` agent. In the source, `architecture-reviewer` (and its `-lite` variant) are **tightly bound to DevDigest** (`server/`, `client/`, `reviewer-core/`, onion layering, `groundFindings()`, `process.env`-only-in-secrets, shared Zod contracts, `CLAUDE.md`). So this is **not** a copy-paste — it is a generalization pass:

- Drop the DevDigest-specific paths and invariants; replace them with explicit inputs/config (the set of structural rules is passed to the agent, not hardcoded).
- Keep the read-only guarantee and the output format (severity + traceability).

**Dependency:** the agent itself leans on architecture/security/testing best practices, so the plugin declares a dependency on `engineering-practices ^1.0.0` and references its skills namespaced.

```
plugins/architecture-review/
├── .claude-plugin/plugin.json        # dependencies: [engineering-practices ^1.0.0]
├── agents/architecture-reviewer.md   # tools: Read, Glob, Grep — read-only
├── README.md
├── CHANGELOG.md
└── COMPATIBILITY.md
```

---

## 3. Consumer plugin: `sdd-engineering`

The core of Spec-Driven Development. We port four agents, the `run-plan` and `workflow-retro` skills, evals, and docs. Note: `run-plan` and `workflow-retro` are **skills** (each with its own `SKILL.md`), not a separate "workflow" type.

```
plugins/sdd-engineering/
├── .claude-plugin/plugin.json        # declares three dependencies (see §4)
├── agents/
│   ├── spec-creator.md               # opus; writes specs only (EARS acceptance criteria)
│   ├── implementation-planner.md     # opus; spec → docs/plans/<feature>.md (read-only except the plan file)
│   ├── implementer.md                # sonnet; executes one plan task, writes code
│   └── plan-verifier.md              # sonnet; read-only gate (Read/Glob/Grep/Bash) — traceability + verdict
├── skills/
│   ├── run-plan/
│   │   ├── SKILL.md                  # orchestrates an APPROVED plan
│   │   └── README.md
│   └── workflow-retro/
│       ├── SKILL.md                  # analyzes a COMPLETED run
│       ├── README.md
│       └── scripts/analyze_journals.py
├── evals/                            # valid shape ≠ correct behavior
├── README.md                         # how the pieces work together (required)
├── CHANGELOG.md
└── COMPATIBILITY.md
```

**How the pieces work together (for the plugin README):**

```
spec-creator ─▶ implementation-planner ─▶ [human APPROVES the plan]
     ▲  research-tools:researcher                  │
     │  architecture-review:architecture-reviewer  ▼
     │            (during research / review)   skill: run-plan
     │                                              │
     │                          ┌───────────────────┼─────────────────────┐
     │                          ▼                    ▼                     ▼
     │                     implementer(s)   architecture-reviewer +   bounded
     │                     (per DAG)         plan-verifier (parallel)  fix loop
     │                                                                    │
     └────────────────────────────────────────────────────────  skill: workflow-retro
```

1. **spec-creator** produces the specification (`specs/YYYY-MM-DD-<slug>.md`, EARS acceptance criteria) — the "what" and "why", not the "how".
2. **implementation-planner** turns the spec into a step-by-step plan with a DAG; the human **approves** it.
3. **run-plan** (skill) starts **FROM the approved plan** (the `plan:<path>` argument is required; without it, it asks for the path and stops). It dispatches `implementer`(s) per the DAG (multi-agent by non-overlapping owned paths, or single-agent) → gates with `architecture-reviewer` + `plan-verifier` **in parallel** → runs a bounded fix loop (`max-fix: 3`). It never pushes or merges.
4. **workflow-retro** (skill) runs **AFTER** a completed run: it gathers cost/resource metrics + qualitative insights → recommendations; appends a row to a ledger.
5. **researcher** and **architecture-reviewer** are pulled in from the dependency plugins (namespaced) wherever research or an architecture review is needed.

> `run-plan` deliberately does **not** invoke `test-writer` and does **not** push (in DevDigest that is `pr-self-review`, which we don't port).

### Porting rules (step 4)

- **Remove DevDigest paths, replace with explicit inputs:**
  - `run-plan`: `docs/plans/<x>.md` and the git baseline `origin/main` → skill parameters.
  - `spec-creator`: `server/`/`client/`/`reviewer-core/`, `insights/gotchas.md`, `groundFindings()`/`wrapUntrusted()` → explicit inputs.
  - `architecture-reviewer`: see §2.3 (generalization).
- **Reference skills namespaced**: `engineering-practices:react-best-practices`, `research-tools:researcher`, `architecture-review:architecture-reviewer` — not bare names.
- **Supporting scripts via `${CLAUDE_SKILL_DIR}`.** Concretely: `workflow-retro/SKILL.md` in the source hardcodes `.claude/skills/workflow-retro/scripts/analyze_journals.py` — this must become `${CLAUDE_SKILL_DIR}/scripts/analyze_journals.py`. Scripts/hooks/MCP at the plugin level use `${CLAUDE_PLUGIN_ROOT}`. No `../` outside the plugin directory.
- **Port evals alongside** and update them whenever behavior changes.

---

## 4. Registration (step 5)

Add **four** entries to the root `.claude-plugin/marketplace.json`. Each entry has its own `name`, `version` (via its `plugin.json`), `owner`/`author`, and `source`.

```jsonc
// .claude-plugin/marketplace.json  (excerpt)
{
  "name": "dev-digest-ai-marketplace",
  "owner": { "name": "DevDigest AI Engineering" },
  "metadata": { "pluginRoot": "./plugins" },
  "plugins": [
    { "name": "engineering-practices", "source": "./plugins/engineering-practices" },
    { "name": "research-tools",         "source": "./plugins/research-tools" },
    { "name": "architecture-review",    "source": "./plugins/architecture-review" },
    { "name": "sdd-engineering",        "source": "./plugins/sdd-engineering" }
  ]
}
```

The `dependencies` field in `plugin.json` is an **array** (string entries or `{ "name", "version" }` objects), **not** an object map. `sdd-engineering` declares three, `architecture-review` declares one:

```jsonc
// plugins/sdd-engineering/.claude-plugin/plugin.json  (excerpt)
{
  "name": "sdd-engineering",
  "version": "1.0.0",
  "description": "Spec-Driven Development workflow: spec → plan → implement → verify → retro.",
  "author": { "name": "DevDigest AI Engineering" },
  "dependencies": [
    { "name": "engineering-practices", "version": "^1.0.0" },
    { "name": "research-tools",         "version": "^1.0.0" },
    { "name": "architecture-review",    "version": "^1.0.0" }
  ]
}

// plugins/architecture-review/.claude-plugin/plugin.json  (excerpt)
{
  "name": "architecture-review",
  "version": "1.0.0",
  "dependencies": [ { "name": "engineering-practices", "version": "^1.0.0" } ]
}
```

- Relative `source` values start with `./` and never escape the repo root. `metadata.pluginRoot` lets you shorten paths.
- **Release order:** the three dependencies first, then `sdd-engineering` (the consumer).
- **A commit or tag** of the marketplace pins the catalog state. Bumping a single plugin's version does **not** touch `marketplace.json` — you edit the catalog only when *adding a new* plugin.

---

## 5. Documentation and versions

- Each plugin has its own `README.md`, `CHANGELOG.md`, `COMPATIBILITY.md`.
- `sdd-engineering/README.md` must explain how the 4 agents + `run-plan` + `workflow-retro` compose into a single flow (diagram in §3).
- Versioning and releases (SemVer, tags, SHA, rollback) follow [`RELEASES.md`](./RELEASES.md); helpers `scripts/release.mjs` and `scripts/rollback.mjs`.

## 6. Decisions and open questions

- ✅ **Packaging of `run-plan`/`retro`:** both are skills (`skills/run-plan/`, `skills/workflow-retro/`). `retro` ships `scripts/analyze_journals.py`.
- ✅ **Content source:** branch `lesson-7-lab/multiagents-finish` (`af92aa88`), directory `.claude/`.
- ✅ **Shape of `dependencies`:** an array of `{ "name", "version" }` entries (docs: plugins-reference). An object map is wrong.
- ✅ **Cross-plugin dependency:** `architecture-review` → `engineering-practices ^1.0.0` (in addition to the three dependencies of `sdd-engineering`).
- ⚠️ **Generalizing `architecture-reviewer`** from the DevDigest version is its own body of work (§2.3), not a mechanical copy.
