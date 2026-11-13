# sdd-engineering

**Flagship Spec-Driven Development (SDD) workflow for Claude Code.**
Turn a request into a spec, a spec into a plan, a plan into reviewed code — with clean handoffs,
parallel gates, a bounded fix loop, and an optional retrospective. Every stage is a small
single-responsibility agent or skill; the orchestrator (`run-plan`) keeps its own context lean by
holding only the short final report from each agent.

## What "Spec-Driven Development" means here

SDD splits the work three ways:

1. **What & why** — the **spec** captures required behaviour, acceptance criteria (EARS), edge
   cases, cross-module interactions, and contract shapes. No implementation detail.
2. **How** — the **plan** decomposes the work into concrete, file-specific tasks with a dependency
   DAG, non-overlapping owned paths (for parallel execution), per-task skill assignments, and
   measurable acceptance.
3. **Code** — one or more **implementers** execute the plan; two independent gates
   (**architecture reviewer** + **plan verifier**) check the result in parallel; a bounded fix
   loop resolves their findings.

A human approves the spec and the plan before any code is written. The orchestrator never pushes,
merges, or opens a PR.

## Agents & skills

| Kind | Name | Role | Model |
|---|---|---|---|
| Agent | `spec-creator` | Read-only-except-specs author. Turns a request + design sources into a single spec (EARS ACs, edge cases, contracts). Writes only under a `specs/` directory. | opus |
| Agent | `implementation-planner` | Read-only architect. Verifies requirements, recommends alternatives, asks execution mode, writes a phased plan with DAG + owned paths + acceptance. Writes only the plan file. | opus |
| Agent | `implementer` | Executes exactly one task from the plan (backend or UI). Stays in its `Owned paths`, self-verifies with the module's existing tests + typecheck. Safe to run in parallel. | sonnet |
| Agent | `plan-verifier` | Read-only completeness/traceability check against the plan. Produces a traceability matrix + gate verdict. No code review. | sonnet |
| Skill | `run-plan` | Orchestrator. Takes an approved plan and drives it to reviewed code: dispatch implementers per the DAG → run the two review gates in parallel → bounded fix loop. Never pushes. | — |
| Skill | `workflow-retro` | Post-mortem for a multi-agent run. Tokens, cache efficiency, parallelism, what was hard/wasted, actionable recommendations; appends one trend row to a ledger. Manual only. | — |

## End-to-end flow

```
     ┌────────────────────────────────────────────────────────────────────────────┐
     │                      Spec-Driven Development flow                          │
     └────────────────────────────────────────────────────────────────────────────┘

  request + design sources
        │
        ▼
  ┌──────────────┐        (may fan out research-tools:researcher in parallel)
  │ spec-creator │ ──────► spec file under specs/  (EARS acceptance criteria)
  └──────────────┘
        │  human reviews the spec
        ▼
  ┌────────────────────────┐   (may fan out research-tools:researcher)
  │ implementation-planner │ ─► plan file  (DAG · owned paths · per-task skills · acceptance)
  └────────────────────────┘
        │  human approves the plan
        ▼
  ┌────────────────────────── /run-plan (orchestrator) ─────────────────────────┐
  │                                                                             │
  │   implementer ×N   (multi-agent by DAG / owned paths, or single-agent)      │
  │        │                                                                    │
  │        ▼                                                                    │
  │   architecture-review:architecture-reviewer  ‖  plan-verifier               │
  │        │                                                                    │
  │        ▼                                                                    │
  │   fix loop ×≤max-fix   (implementers resolve crit/high + missing/partial)   │
  │                                                                             │
  └───────────────────────────────┬─────────────────────────────────────────────┘
                                  ▼
                    final report + "run your project's
                     pre-push review/checks before pushing"

               (optional) /workflow-retro  ─► trend row → ledger file
```

`research-tools:researcher` assists during spec authoring and planning; the two gate agents run
in parallel — `architecture-review:architecture-reviewer` (from the `architecture-review` plugin)
and `plan-verifier` (internal to this plugin).

## Dependencies (namespaced)

This plugin composes three sibling plugins from the same marketplace:

- **`engineering-practices`** — best-practice skills preloaded into the agents' `skills:`
  frontmatter (e.g. `engineering-practices:onion-architecture`,
  `engineering-practices:react-best-practices`, `engineering-practices:zod`,
  `engineering-practices:security`, `engineering-practices:typescript-expert`,
  `engineering-practices:mermaid-diagram`, …). Skills that don't apply to a task's stack are
  harmless — the agent ignores them.
- **`research-tools`** — the `research-tools:researcher` agent, invoked by `spec-creator` and
  `implementation-planner` for read-only discovery so raw exploration stays out of their context.
- **`architecture-review`** — the `architecture-review:architecture-reviewer` agent, run in
  parallel with the internal `plan-verifier` inside `/run-plan`'s review gate.

## Install

```
/plugin marketplace add burnjohn/dev-digest-ai-marketplace
/plugin install sdd-engineering@dev-digest-ai-marketplace
```

Installing this plugin also brings in its three dependencies above.

## Run it

The full loop is three explicit human touchpoints — you invoke each stage and review before moving
on:

```
# 1. Author a spec from a request + design sources.
#    spec-creator picks the location automatically (per-module specs/ or top-level specs/).
> please spec: "<feature request + any Figma links / screenshots / notes>"

# 2. Turn the approved spec into an Implementation Plan.
#    The planner will verify requirements, ask 1-4 clarifying questions,
#    and ask for execution mode (multi-agent parallel vs single-agent).
> plan the feature described in specs/<your-spec>.md

# 3. Execute the approved plan.
/run-plan plan:<path-to-plan>
# optional: mode:single | mode:multi | max-fix:2 | base-ref:main

# 4. (optional) Post-mortem for the run.
/workflow-retro
```

## Configurable inputs

Nothing in this plugin is hard-wired to a specific project layout. The defaults below are sensible
starting points — override them per invocation:

| Input | Default | Configurable via |
|---|---|---|
| Plan file directory | `docs/plans/` | `plan-dir:<path>` on the planner |
| Spec file directory | per-module `<module>/specs/`, top-level `specs/` when cross-module | `spec-dir:<path>` on the spec creator |
| Git base ref (changed-file diff) | `origin/main` | `base-ref:<ref>` on `/run-plan` |
| Execution mode | read from the plan's `Execution mode` field | `mode:multi` / `mode:single` on `/run-plan` |
| Fix-loop cap | `3` | `max-fix:<n>` on `/run-plan` |
| Retro ledger file | `docs/retros/ledger.md` | `ledger:<path>` on `/workflow-retro` |

## What the plugin deliberately does not do

- **Never pushes, merges, or opens a PR.** `/run-plan` ends at a review-clean working tree; run
  your project's pre-push review/checks (security scan, dependency audit, contract sync, broader
  test coverage, framework-specific lint) as a separate step before pushing.
- **No dedicated test-authoring pass** during `/run-plan`. Coverage comes from each implementer's
  self-verification against the module's existing suite + typecheck; the plan's `Acceptance` names
  any new tests the task must add.
- **No spec authoring inside the planner or the orchestrator.** If requirements are thin, the
  planner surfaces clarifying questions and stops — it does not invent a spec.

## File structure

```
sdd-engineering/
├── .claude-plugin/plugin.json
├── agents/
│   ├── spec-creator.md
│   ├── implementation-planner.md
│   ├── implementer.md
│   └── plan-verifier.md
├── skills/
│   ├── run-plan/            (SKILL.md + README.md)
│   └── workflow-retro/      (SKILL.md + README.md + scripts/analyze_journals.py)
├── evals/                   (behavioral evals — see evals/README.md)
├── CHANGELOG.md
├── COMPATIBILITY.md
└── README.md                (this file)
```
