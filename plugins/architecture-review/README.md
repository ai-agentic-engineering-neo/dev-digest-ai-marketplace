# architecture-review

Generalized, read-only architecture reviewer for Claude Code. Audits a diff or file set against a
**structural contract you supply** — layering rules, dependency direction, DI discipline, module
I/O isolation, single-source-of-truth for shared contracts — and reports violations with severity
and evidence. Never edits.

## What this plugin provides

- **Agent:** `architecture-review:architecture-reviewer`
  - Tools: `Read`, `Glob`, `Grep` (read-only by design — write tools are deliberately omitted so
    findings stay findings, not silent patches)
  - Model: `sonnet`
  - Output: a structured report — audited files, contract source, per-finding table
    (file, line, severity, rule, evidence, recommendation), verdict counts, and a merge gate

## How it works: the contract is an input

This reviewer has **no built-in list of project rules**. Every audit runs against a structural
contract the caller passes in. You supply the contract in one of two shapes:

1. **Inline** — list the rules in prose in your invocation.
2. **By reference** — point the agent at one or more docs in your repo (e.g. `docs/architecture.md`,
   a module-scoped architecture note). The agent reads them and treats their prescriptive statements
   as the rule set.

If no contract is given, the agent asks for one before auditing — it will not invent rules and
score your code against them.

### Example invocations

Inline contract:

```
Use the architecture-review:architecture-reviewer agent on this diff.

Contract to enforce:
1. Onion layering: files under src/domain/** must not import from src/infra/** or any framework
   (fastify, drizzle, zod).
2. Only src/platform/container.ts may `new` a repository or adapter.
3. Route handlers under src/**/routes.ts must contain no DB queries or branching business logic.
```

Contract by reference:

```
Use the architecture-review:architecture-reviewer agent on the files in this PR.
Enforce the rules stated in docs/architecture.md and modules/reports/CLAUDE.md.
```

### Kinds of findings you'll get back

Each finding names the exact contract clause it violates, quotes the offending code verbatim, and
gets a severity:

- `critical` — breaks the invariant (e.g. inner layer imports a framework)
- `high`     — clear violation with maintenance/correctness impact (e.g. `new Adapter()` outside
                the composition root)
- `medium`   — real violation, limited practical impact today
- `low`      — borderline; reviewers should discuss
- `info`     — cannot verify, or out-of-scope observation recorded for transparency

The verdict includes a merge gate: **PASS** requires zero `critical` and zero `high` findings.

## Installation

```
/plugin marketplace add burnjohn/dev-digest-ai-marketplace
/plugin install architecture-review@dev-digest-ai-marketplace
```

## Namespacing

- Agent name: **`architecture-review:architecture-reviewer`**
- The plugin depends on **`engineering-paved-path ^1.0.0`** for the reusable engineering skills the
  agent references (namespaced as `engineering-paved-path:<skill>`):
  - `engineering-paved-path:onion-architecture` — illustrative inward-only dependency rule
  - `engineering-paved-path:frontend-architecture` — UI architecture boundaries
  - `engineering-paved-path:typescript-expert` — type-level contract enforcement
  - `engineering-paved-path:security` — detection only; security findings are out-of-scope for this
    reviewer and are surfaced in the verdict, not as findings

These skills inform *how* the agent interprets a contract clause; they are never the source of a
finding on their own. A finding is only emitted when it violates a rule the caller's supplied
contract asserts.

## Scope: what this agent does NOT do

To keep the review signal high, this agent explicitly does not cover:

- Style nits, naming conventions
- Runtime bugs, correctness of business logic
- Test quality or coverage
- Performance characteristics
- Security injection vectors (surfaced as out-of-scope notes, not findings)

Use a code review or security review agent for those.
