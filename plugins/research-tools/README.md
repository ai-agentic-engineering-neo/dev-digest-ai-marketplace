# research-tools

A dependency plugin that provides one **read-only research agent**, `researcher` — a focused investigator that finds information (in your codebase or on the public web) and reports it back in a strict, structured, cited format. It never edits, creates, or deletes anything.

It is reusable on its own, and is a declared dependency of `sdd-engineering` (used by `spec-creator` and `implementation-planner` during discovery).

## What it provides

| Component | Type | Tools | Notes |
| --- | --- | --- | --- |
| `researcher` | agent | Read, Glob, Grep, Bash, WebSearch, WebFetch | No Edit/Write/NotebookEdit — read-only by construction |

## Install

```
/plugin marketplace add burnjohn/dev-digest-ai-marketplace
/plugin install research-tools@dev-digest-ai-marketplace
```

## Use

Delegate any locate / gather / fact-check task to the agent — Claude routes to it automatically, or you can call it explicitly:

- "Use **research-tools:researcher** to find where rate limiting is configured."
- "Research how Next.js 15 handles streaming metadata — cite sources."

### How it behaves

- **Read-only.** It has no write tools and will never modify files or claim it did.
- **Two modes.** Project research (code/docs/config) and internet research (`WebSearch` + `WebFetch`, bounded query count). It does not invoke any deep-research harness.
- **Clarifies first.** If the request has no clear question, is ambiguous about project-vs-internet, or is missing parameters that would change the answer, it returns a short *Clarification needed* block (1–4 sharp questions, each with a best-guess default) instead of guessing.
- **Cites everything.** Every project claim points to `path:line`; every internet claim points to a source URL. Gaps are reported honestly under "Not found / gaps" rather than invented.

## Capabilities & limits

- ✅ Locating code, config, and docs; gathering facts; fact-checking claims; light competitive/API research.
- ✅ Structured output suitable for feeding into a planner or another agent.
- ❌ No edits, no refactors, no recommendations unless you explicitly ask it to research a recommendation.
- ❌ Not a deep, multi-hour research harness — it is bounded and fast.

## Namespace

Once installed, the agent is addressable as `research-tools:researcher`.
