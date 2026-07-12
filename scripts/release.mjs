#!/usr/bin/env node
// Release helper for a single plugin. Automates the steps in docs/RELEASES.md:
// bump the plugin's version, verify the CHANGELOG has a matching entry, run the
// structural linter + `claude plugin validate <dir> --strict`, and optionally
// create an annotated git tag. Dependency-free (Node built-ins only).
//
// Usage:
//   node scripts/release.mjs <plugin-name> <patch|minor|major|X.Y.Z> [--tag] [--dry]
//
// Notes:
//   --tag  creates an annotated tag `<plugin>-v<version>` at HEAD (git write).
//          Commit your changes first; the tag points at the current HEAD.
//   --dry  edits nothing; prints what would happen.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const [, , name, bump, ...flags] = process.argv;
const DRY = flags.includes('--dry');
const TAG = flags.includes('--tag');
const die = (m) => { console.error(`✗ ${m}`); process.exit(1); };

if (!name || !bump)
  die('usage: node scripts/release.mjs <plugin-name> <patch|minor|major|X.Y.Z> [--tag] [--dry]');

const ROOT = process.cwd();
const dir = join(ROOT, 'plugins', name);
const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
if (!existsSync(manifestPath)) die(`plugin not found: plugins/${name}/.claude-plugin/plugin.json`);

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cur = manifest.version;
if (!/^\d+\.\d+\.\d+$/.test(cur || ''))
  die(`current version "${cur}" is not a plain SemVer X.Y.Z — bump manually`);

let next;
if (/^\d+\.\d+\.\d+$/.test(bump)) {
  next = bump;
} else {
  const [maj, min, pat] = cur.split('.').map(Number);
  if (bump === 'major') next = `${maj + 1}.0.0`;
  else if (bump === 'minor') next = `${maj}.${min + 1}.0`;
  else if (bump === 'patch') next = `${maj}.${min}.${pat + 1}`;
  else die(`unknown bump "${bump}" (use patch|minor|major|X.Y.Z)`);
}
if (next === cur) die(`new version equals current (${cur})`);

// CHANGELOG must document the new version.
const changelogPath = join(dir, 'CHANGELOG.md');
if (!existsSync(changelogPath)) die(`missing CHANGELOG.md for plugin "${name}"`);
const changelog = readFileSync(changelogPath, 'utf8');
const hasEntry = new RegExp(`^##\\s*\\[?${next.replace(/\./g, '\\.')}\\]?`, 'm').test(changelog);
if (!hasEntry) die(`CHANGELOG.md has no "## ${next}" entry — add release notes first`);

console.log(`Release plugin "${name}": ${cur} → ${next}`);
if (DRY) { console.log('(dry run — no files changed, no validation run)'); process.exit(0); }

// Bump version.
manifest.version = next;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✓ bumped version in ${manifestPath}`);

// Validate.
const run = (cmd, args) => {
  try { execFileSync(cmd, args, { stdio: 'inherit' }); }
  catch { die(`validation failed: ${cmd} ${args.join(' ')}`); }
};
run(process.execPath, [join(ROOT, 'scripts', 'validate-marketplace.mjs')]);
run('claude', ['plugin', 'validate', dir, '--strict']);

if (TAG) {
  const tag = `${name}-v${next}`;
  try {
    execFileSync('git', ['tag', '-a', tag, '-m', `${name} ${next}`], { stdio: 'inherit' });
    const sha = execFileSync('git', ['rev-list', '-n', '1', tag], { encoding: 'utf8' }).trim();
    console.log(`✓ created tag ${tag} at ${sha}`);
    console.log(`  next: git push origin ${tag}`);
  } catch { die(`could not create tag ${tag} (commit your changes first)`); }
} else {
  console.log('Next steps:');
  console.log(`  1. commit the version bump`);
  console.log(`  2. node scripts/release.mjs ${name} ${next} --tag   # or tag manually`);
  console.log(`  3. git push && git push --tags`);
}
