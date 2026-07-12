## What changes

<!-- Briefly: new plugin / change to an existing plugin / catalog or docs change -->

## Checklist

- [ ] `claude plugin validate .` and `claude plugin validate ./plugins/<name>` are green locally
- [ ] `node scripts/validate-marketplace.mjs` passes
- [ ] `version` in `plugin.json` bumped per SemVer (if this is a plugin release)
- [ ] The plugin's `CHANGELOG.md` is updated
- [ ] No secrets and no absolute paths; paths go through `${CLAUDE_PLUGIN_ROOT}`
- [ ] For a **new** plugin: added an entry to `.claude-plugin/marketplace.json` and an owner in `CODEOWNERS`
- [ ] Dependency component references are namespaced (`plugin:skill`)

## Notes for reviewers

<!-- New permissions, external services, breaking changes, etc. -->
