# Compatibility

- **Claude Code:** requires a version with plugin + skills support (`skills/` auto-discovery).
- **Dependencies:** none. This plugin is the shared foundation others depend on.
- **Provides:** skills only (no agents, hooks, or MCP servers).
- **Namespace:** installed skills are addressable as `engineering-paved-path:<skill>` (e.g. `engineering-paved-path:react-best-practices`).
- **Portability:** each `SKILL.md` is plain Markdown + YAML frontmatter and contains no project-specific paths, so it is safe to load in any repository.
