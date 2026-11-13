# engineering-practices

A curated set of 12 project-agnostic engineering skills for Claude Code — the "paved path" for building TypeScript-first full-stack applications. Skills cover React/Next.js frontend, Fastify/Drizzle/Postgres backend, cross-cutting concerns (TypeScript, Zod, security, onion architecture), and one shared diagramming skill. This plugin is the **shared foundation** that the other plugins in the `dev-digest-ai-marketplace` (`architecture-review`, `sdd-engineering`) depend on.

## Catalog

### Frontend
| Skill | Description |
|-------|-------------|
| `react-best-practices` | React anti-patterns, state management, hooks rules, rendering pitfalls |
| `next-best-practices` | Next.js App Router, RSC boundaries, data fetching, hydration, bundling |
| `react-testing-library` | General-purpose React Testing Library guide with Vitest |
| `frontend-architecture` | Folder structure, feature organization, component splitting, constants/utils placement, naming, Server/Client boundary |

### Backend
| Skill | Description |
|-------|-------------|
| `fastify-best-practices` | Fastify routes, plugins, JSON-schema validation, error handling |
| `drizzle-orm-patterns` | Drizzle schema, queries, relations, transactions, migrations |
| `postgresql-table-design` | Postgres schema design, data types, indexing, constraints |

### Full-stack
| Skill | Description |
|-------|-------------|
| `typescript-expert` | Type-level programming, performance, tooling, migrations |
| `zod` | Zod schema validation, parsing, error handling, type inference |
| `security` | OWASP Top 10:2025, auth, injection, uploads, secrets |
| `onion-architecture` | Four-layer inward-only dependency model for backend modules |

### Shared
| Skill | Description |
|-------|-------------|
| `mermaid-diagram` | Mermaid diagrams in markdown (flowcharts, sequence, ERD, class, state) |

## Install

```
/plugin marketplace add burnjohn/dev-digest-ai-marketplace
/plugin install engineering-practices@dev-digest-ai-marketplace
```

## How skills activate

Skills load **on-demand**: Claude Code inspects each skill's `SKILL.md` frontmatter (`description` + trigger hints) and pulls the relevant one in when your prompt or the current file matches. You don't need to remember the names — ask "how do I structure this Fastify route?" and `fastify-best-practices` engages automatically.

To invoke explicitly, reference the skill by its fully-qualified name:

```
Use the engineering-practices:onion-architecture skill to place this new module.
```

All skills in this plugin are addressable as `engineering-practices:<skill>`. That namespace matters when another plugin depends on this one — e.g. `architecture-review` and `sdd-engineering` reference these skills by their qualified names.

## Dependency role

This plugin has **no dependencies of its own** and is designed to be depended on. If you install one of the review/spec plugins from this marketplace, `engineering-practices` will be pulled in as a peer dependency.

## Per-skill docs

Each skill directory contains its own `SKILL.md` (the loaded skill body) and, where applicable, `README.md`, `examples.md`, `references.md`, and topical `rules/*.md` files. Browse `skills/<name>/` for the full reference material.
