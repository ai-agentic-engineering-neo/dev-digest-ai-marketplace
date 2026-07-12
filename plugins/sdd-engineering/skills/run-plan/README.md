# Run Plan Skill

Implementation Plan executor. One command takes an **already-approved** plan and drives it to
reviewed code — dispatching the implementer/reviewer agents, keeping its own context lean (only
short agent reports), and resolving review comments in a bounded fix loop.

Spec authoring (`spec-creator`) and planning (`implementation-planner`) are run **separately and
manually** beforehand. This command starts from the plan.

## What it does

Runs in the main session as the **orchestrator**. It never implements or reviews itself — it spawns
the agents, runs independent ones concurrently, and resolves architecture-review + traceability
comments through a bounded fix loop. It never pushes or merges.

```
args: plan:<path>  [base-ref:<ref>]  [mode:multi|single]  [max-fix:N]
  └─ read plan (tasks · DAG · owned paths · execution mode)
       └─ implementer ×N   (multi-agent by DAG / non-overlapping owned paths, or single-agent)
            └─ architecture-review:architecture-reviewer ‖ plan-verifier   (parallel, read-only, Sonnet)
                 └─ fix loop ×≤max-fix   (implementer fixes crit/high + missing/partial → re-review changed files)
                      └─ final report  +  "run your project's pre-push review/checks before pushing"
```

## When to invoke

- `/run-plan plan:<plan-path>` (optionally `mode:single`, `max-fix:2`, `base-ref:main`)
- Phrases: "run the plan", "execute the plan", "implement <plan-path>".

## Inputs

| Token | Meaning | Default |
|-------|---------|---------|
| `plan:<path>` | Approved Implementation Plan. **Required.** | — |
| `base-ref:<ref>` | Git base ref for the changed-file diff | `origin/main` |
| free-text prose | Notes/constraints for this run | — |
| `mode:multi` / `mode:single` | Override the plan's Execution mode | read from plan |
| `max-fix:<n>` | Cap on the fix loop | `3` |

## Agents orchestrated

| Stage | Agent | Model | Role |
|-------|-------|-------|------|
| Build | `implementer` ×N | sonnet | One task each; parallel by non-overlapping owned paths; self-verifies |
| Review | `architecture-review:architecture-reviewer` | sonnet | Structural contracts (read-only) |
| Review | `plan-verifier` | sonnet | Requirement traceability / completeness (read-only) |
| Fix | `implementer` ×N | sonnet | Resolve critical/high + missing/partial findings |

**Not invoked here:** `spec-creator`, `implementation-planner` (run manually beforehand), and any
dedicated test-authoring agent (that stage is intentionally disabled to save tokens — coverage comes
from each implementer's self-verification).

## Guardrails

- Starts from a plan — never authors a spec or a plan.
- Never `git push`, merge, or open a PR — ends with a recommendation to run your project's
  pre-push review/checks.
- Fix loop is bounded by `max-fix`; remaining findings are reported for a human, never looped forever.
- Concurrent implementers must own non-overlapping paths.
- Orchestrator keeps only short agent reports in context — heavy work stays isolated per agent.

## File structure

```
run-plan/
├── SKILL.md     ← orchestrator — phased execution algorithm + bounded fix loop
└── README.md    ← this file
```

## Relationship to your project's pre-push review

`run-plan` builds and reviews a feature **before** push (deep structural + traceability gate via
the dedicated agents). It is deliberately not a pre-push gate — after `run-plan` finishes, run
whatever pre-push review/checks your project uses (security scan, dependency audit, contract
sync, broader test coverage, framework-specific lint) before pushing.
