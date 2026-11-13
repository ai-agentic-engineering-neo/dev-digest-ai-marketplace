# Changelog

All notable changes to `engineering-practices` (formerly `engineering-paved-path`) are documented here. Versioning follows [SemVer](https://semver.org/).

## 1.0.1 — 2026-11-13

### Changed
- Renamed from `engineering-paved-path` to `engineering-practices`. Skills are now addressed as `engineering-practices:<skill>`; their content is unchanged.
- `marketplace.json` maps the old name via `renames`, so existing installs migrate automatically. Users of a git-hosted marketplace run `/plugin install engineering-practices@dev-digest-ai-marketplace` once.

## 1.0.0 — 2026-07-12

### Added
- Initial release. Twelve shared engineering skills, project-agnostic:
  - **Frontend:** `react-best-practices`, `next-best-practices`, `react-testing-library`, `frontend-architecture`
  - **Backend:** `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design`
  - **Full-stack:** `typescript-expert`, `zod`, `security`, `onion-architecture`
  - **Shared:** `mermaid-diagram`
- Removed all product-specific paths and repository references; skills reference supporting scripts via `${CLAUDE_SKILL_DIR}`.
