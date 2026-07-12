# SECURITY — permissions, secrets, script checks

Plugins are installed by people who trust them with a repository, and sometimes a shell, credentials, and external services. So we treat changes like production code.

## Permissions (least privilege)

- Give agents and hooks **only the tools/permissions they actually need**. A read-only reviewer must not have write access.
- On update, the installer shows a **permissions diff**. Scope expansion (e.g. from read-only to network access) must not be accepted automatically — it is a deliberate reviewer decision.
- Document new permissions in the plugin's `CHANGELOG.md`.

## Secrets policy

- **No credentials in the repository** — not in `plugin.json`, not in `marketplace.json`, not in components.
- A manifest may *name* a secret slot (e.g. an expected env variable), but must **not** contain a value.
- Secrets are provided by the environment / a secret manager on the user's side, not through the plugin.

## Absolute paths

- Absolute paths (`/Users/...`, `/home/...`, `C:\...`) are forbidden — they are tied to the author's machine.
- Address scripts and resources through `${CLAUDE_PLUGIN_ROOT}` (the plugin's directory in the cache); state through `${CLAUDE_PLUGIN_DATA}`.
- Do not reach outside the plugin directory with `../`.

## Automated check (CI)

`scripts/validate-marketplace.mjs` scans plugin files on every PR and **fails the build** on findings:

- secret patterns: `-----BEGIN ... PRIVATE KEY-----`, `AKIA…` (AWS), GitHub tokens, `token=`/`secret=`/`password=` with a non-empty value, etc.;
- absolute paths: `/Users/`, `/home/`, `C:\`;
- reaching outside the directory: `..` in `source`.

Together with `claude plugin validate . --strict` (manifest shape), this is a required gate on every PR.

## Fork PRs

- The workflow runs on the `pull_request` event (not `pull_request_target`), so PRs from forks **have no access to repository secrets** — an outside contributor can neither exfiltrate a secret nor burn credits.
- Both CI checks are offline and require no API key.
