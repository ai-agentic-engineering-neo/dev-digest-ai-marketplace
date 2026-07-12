# Compatibility

- **Claude Code:** requires a version with plugin + subagent support and the `dependencies` field.
- **Dependencies:** `engineering-paved-path ^1.0.0` — the reviewer leans on its architecture/security/testing skills, referenced as `engineering-paved-path:<skill>`.
- **Provides:** one agent, `architecture-reviewer` (read-only).
- **Namespace:** addressable as `architecture-review:architecture-reviewer`.
- **Inputs:** the set of structural rules/contracts to enforce is passed in explicitly per invocation; nothing is bound to a specific repository layout.
