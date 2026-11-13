# Compatibility

- **Claude Code:** requires a version with plugin support for agents + skills and the `dependencies` field.
- **Dependencies (all `^1.0.0`):**
  - `engineering-practices` — best-practice skills used by `implementer` and the gates.
  - `research-tools` — `researcher` used by `spec-creator` / `implementation-planner`.
  - `architecture-review` — `architecture-reviewer` used as a gate inside `run-plan`.
- **Provides:** 4 agents + 2 skills (`run-plan`, `workflow-retro`).
- **Cross-plugin references** are namespaced (`engineering-practices:<skill>`, `research-tools:researcher`, `architecture-review:architecture-reviewer`).
- **Inputs, not conventions:** plan path, spec directory, git baseline, and module layout are passed in explicitly per run — nothing is bound to a specific repository.
