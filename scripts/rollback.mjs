#!/usr/bin/env node
// Rollback helper. Re-pins a plugin's `source` in .claude-plugin/marketplace.json
// to a previous immutable point, per docs/RELEASES.md. Because plugins in this
// repo use relative sources (`./plugins/<name>`), a relative source always
// resolves to the current repo state and cannot be pinned to an old version.
// To roll back without reverting files, switch the entry to a git source pinned
// at a known-good sha/tag. Dependency-free (Node built-ins only).
//
// Usage:
//   node scripts/rollback.mjs <plugin-name> --repo <owner/repo> --sha <40-char-sha>
//   node scripts/rollback.mjs <plugin-name> --repo <owner/repo> --ref <tag-or-branch>
//   node scripts/rollback.mjs <plugin-name> --relative        # reset to ./plugins/<name>
//
// Edits only marketplace.json. Review and commit the change yourself.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const name = args[0];
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const has = (k) => args.includes(k);
const die = (m) => { console.error(`✗ ${m}`); process.exit(1); };

if (!name || name.startsWith('--'))
  die('usage: node scripts/rollback.mjs <plugin-name> (--repo <owner/repo> --sha <sha>|--ref <ref> | --relative)');

const ROOT = process.cwd();
const mpPath = join(ROOT, '.claude-plugin', 'marketplace.json');
if (!existsSync(mpPath)) die('.claude-plugin/marketplace.json not found');
const mp = JSON.parse(readFileSync(mpPath, 'utf8'));
const entry = (mp.plugins || []).find((p) => p.name === name);
if (!entry) die(`plugin "${name}" is not listed in marketplace.json`);

let source;
if (has('--relative')) {
  source = `./plugins/${name}`;
} else {
  const repo = flag('--repo');
  const sha = flag('--sha');
  const ref = flag('--ref');
  if (!repo) die('--repo <owner/repo> is required (unless --relative)');
  if (!sha && !ref) die('provide --sha <sha> or --ref <tag-or-branch>');
  if (sha && !/^[0-9a-f]{40}$/i.test(sha)) die('--sha must be a full 40-character commit SHA');
  source = { source: 'github', repo, ...(sha ? { sha } : {}), ...(ref ? { ref } : {}) };
}

const before = JSON.stringify(entry.source);
entry.source = source;
writeFileSync(mpPath, JSON.stringify(mp, null, 2) + '\n');
console.log(`✓ re-pinned "${name}" source`);
console.log(`  before: ${before}`);
console.log(`  after:  ${JSON.stringify(source)}`);

// Re-validate the catalog structure.
try {
  execFileSync(process.execPath, [join(ROOT, 'scripts', 'validate-marketplace.mjs')], { stdio: 'inherit' });
} catch { die('structural validation failed after rollback — review marketplace.json'); }

console.log('Review the diff and commit. Users pick up the change after `/plugin marketplace update`.');
