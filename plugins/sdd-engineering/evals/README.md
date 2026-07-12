# evals

Behavioral evals for the `sdd-engineering` plugin.

Schema validation (e.g. `plugin.json` conforms to the manifest schema, agent frontmatter parses,
skill `SKILL.md` files have the required fields) proves the plugin's **shape**. Evals go one level
deeper — they prove **behavior**: given a realistic prompt, does the right agent or skill
actually activate, and does it stay off when it should?

## What lives here

Each agent and skill in this plugin should get at least one eval file covering:

1. **Activation on a relevant scenario** — a prompt that clearly matches the agent/skill's
   `description` (its trigger rule) should route to it and produce the expected artifact
   (spec file, plan file, orchestrated run, retro report, etc.).
2. **Non-activation on an off-target scenario** — a prompt outside its scope should NOT
   route to it. For example, `spec-creator` must not fire on a general refactor request that
   has no spec to author; `/run-plan` must not fire when no approved plan exists; `workflow-retro`
   must never activate automatically (it is manual-only by design).

## Targets to cover

| Target | Positive scenario (should activate) | Negative scenario (should NOT activate) |
|---|---|---|
| `spec-creator` | "Spec this new feature from the attached Figma + notes." | "Rename this variable across the file." |
| `implementation-planner` | "Turn this approved spec into a phased plan." | "Please write the spec for X." (that's spec-creator) |
| `implementer` | Dispatched with one concrete task block (owned paths + acceptance). | A vague "improve the code" request with no task. |
| `plan-verifier` | "Verify this feature is fully implemented against the plan." | "Please review the architecture of this diff." (that's `architecture-review:architecture-reviewer`) |
| `/run-plan` | "Run the plan at `<plan-path>`." | "Write me a spec." / "Push the branch." |
| `/workflow-retro` | Explicit "retro this run" after a multi-agent workflow. | Any `Stop` / `SubagentStop` hook — must never auto-trigger. |

## Format

Evals in this directory are lightweight scenario descriptions (prompt + expected routing +
expected artifact side-effects). Keep them small and human-readable; each file targets one
agent or skill and lists its positive and negative cases.

The scaffold ships with this README only; individual eval files can be added incrementally as
scenarios stabilise. New evals should follow the same activation / non-activation split above so
regressions in the `description` trigger rules are caught early.
