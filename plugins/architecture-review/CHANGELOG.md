# Changelog

All notable changes to `architecture-review` are documented here. Versioning follows [SemVer](https://semver.org/).

## 1.0.0 — 2026-07-12

### Added
- Initial release. Generalized read-only `architecture-reviewer` agent (tools: Read, Glob, Grep).
- Audits a diff or file set against **configurable** structural contracts (layering, dependency direction, DI discipline, module isolation) supplied as explicit inputs — no project-specific rules hardcoded.
- Reports violations by severity with traceability; never edits.
