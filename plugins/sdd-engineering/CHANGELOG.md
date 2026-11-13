# Changelog

All notable changes to `sdd-engineering` are documented here. Versioning follows [SemVer](https://semver.org/).

## 1.0.1 — 2026-11-13

### Changed
- Dependency `engineering-paved-path` renamed to `engineering-practices`; namespaced skill references updated accordingly. No behavior change.

## 1.0.0 — 2026-07-12

### Added
- Initial release of the Spec-Driven Development workflow.
- **Agents:** `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`.
- **Skills:** `run-plan` (orchestrates an approved plan: implementer(s) per DAG, then `architecture-reviewer` + `plan-verifier` gates in parallel, then a bounded fix loop), `workflow-retro` (post-run retrospective with cost/quality analysis).
- Declares dependencies on `engineering-paved-path`, `research-tools`, and `architecture-review` (all `^1.0.0`); cross-plugin skills/agents are referenced namespaced.
- Removed all product-specific paths (plan/spec/retro locations, git baselines, module names); these are now explicit inputs. `workflow-retro` resolves its scripts via `${CLAUDE_SKILL_DIR}`.
