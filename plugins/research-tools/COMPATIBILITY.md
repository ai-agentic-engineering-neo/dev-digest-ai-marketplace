# Compatibility

- **Claude Code:** requires a version with plugin + subagent support (`agents/` auto-discovery).
- **Dependencies:** none.
- **Provides:** one agent, `researcher` (read-only).
- **Namespace:** addressable as `research-tools:researcher`.
- **Safety:** the agent has no `Edit`, `Write`, or `NotebookEdit` tools and is instructed never to create, modify, or delete files.
