# Changelog

All notable changes to `research-tools` are documented here. Versioning follows [SemVer](https://semver.org/).

## 1.0.1 — 2026-07-12

### Changed
- Clarified the `researcher` agent's "Cite everything" rule to prefer stable, canonical URLs over transient search-result links. Documentation-only; no behavior contract change.

## 1.0.0 — 2026-07-12

### Added
- Initial release. Read-only `researcher` agent (tools: Read, Glob, Grep, Bash, WebSearch, WebFetch — no Edit/Write).
- Returns findings in a strict, structured format with citations; never modifies files.
