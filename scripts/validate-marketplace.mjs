#!/usr/bin/env node
// Structural linter for the dev-digest-ai-marketplace catalog.
// Dependency-free (Node built-ins only). Covers cross-file consistency that
// `claude plugin validate` does not: source-path existence, name matching,
// CODEOWNERS coverage, and a secrets / absolute-path scan across plugin files.
// Exits non-zero on any error. Passes cleanly on an empty `plugins: []`.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const errors = [];
const err = (m) => errors.push(m);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Reserved marketplace names (official Anthropic use).
const RESERVED = new Set([
  'claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official',
  'claude-plugins-community', 'claude-community', 'anthropic-marketplace',
  'anthropic-plugins', 'agent-skills', 'anthropic-agent-skills',
  'knowledge-work-plugins', 'life-sciences', 'claude-for-legal',
  'claude-for-financial-services', 'financial-services-plugins',
  'first-party-plugins', 'healthcare',
]);

// ---------- 1. marketplace.json ----------
const mpPath = join(ROOT, '.claude-plugin', 'marketplace.json');
if (!existsSync(mpPath)) {
  err('.claude-plugin/marketplace.json is missing');
  finish();
}
let mp;
try {
  mp = JSON.parse(readFileSync(mpPath, 'utf8'));
} catch (e) {
  err(`.claude-plugin/marketplace.json is not valid JSON: ${e.message}`);
  finish();
}

if (typeof mp.name !== 'string') err('marketplace.json: "name" must be a string');
else {
  if (!KEBAB.test(mp.name)) err(`marketplace.json: "name" must be kebab-case (got "${mp.name}")`);
  if (RESERVED.has(mp.name)) err(`marketplace.json: "name" "${mp.name}" is reserved for Anthropic`);
}
if (!mp.owner || typeof mp.owner.name !== 'string' || !mp.owner.name.trim())
  err('marketplace.json: "owner.name" is required');
if (!Array.isArray(mp.plugins)) err('marketplace.json: "plugins" must be an array');

// ---------- 2. per-plugin entries ----------
const plugins = Array.isArray(mp.plugins) ? mp.plugins : [];
const seen = new Set();
for (const [i, p] of plugins.entries()) {
  const at = `plugins[${i}]`;
  if (!p || typeof p.name !== 'string') { err(`${at}: "name" required`); continue; }
  const name = p.name;
  if (!KEBAB.test(name)) err(`${at} "${name}": name must be kebab-case`);
  if (seen.has(name)) err(`${at} "${name}": duplicate plugin name`);
  seen.add(name);

  // Object sources (github / url / git-subdir / npm) point outside this repo
  // — e.g. a rollback pinned to a prior sha. Validate the type marker only;
  // local structure cannot be checked here.
  if (p.source && typeof p.source === 'object') {
    const kinds = new Set(['github', 'url', 'git-subdir', 'npm']);
    if (!kinds.has(p.source.source))
      err(`${at} "${name}": object source has unknown type "${p.source.source}"`);
    continue;
  }
  if (typeof p.source !== 'string') { err(`${at} "${name}": "source" must be a string or object`); continue; }
  if (!p.source.startsWith('./')) err(`${at} "${name}": source must start with "./" (got "${p.source}")`);
  if (p.source.includes('..')) err(`${at} "${name}": source must not contain ".."`);

  const dir = join(ROOT, p.source);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    err(`${at} "${name}": source directory "${p.source}" does not exist`);
    continue;
  }
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) { err(`${at} "${name}": missing .claude-plugin/plugin.json`); continue; }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    err(`${at} "${name}": plugin.json invalid JSON: ${e.message}`);
    continue;
  }
  if (manifest.name !== name)
    err(`${at} "${name}": plugin.json name "${manifest.name}" must match marketplace entry "${name}"`);
  if (typeof manifest.version !== 'string' || !manifest.version.trim())
    err(`${at} "${name}": plugin.json "version" (SemVer) is required`);
  if (typeof manifest.description !== 'string' || !manifest.description.trim())
    err(`${at} "${name}": plugin.json "description" is required`);
  if ('repository' in manifest && typeof manifest.repository !== 'string')
    err(`${at} "${name}": plugin.json "repository" must be a string URL, not an object`);
  if ('keywords' in manifest && !Array.isArray(manifest.keywords))
    err(`${at} "${name}": plugin.json "keywords" must be an array`);
}

// ---------- 3. CODEOWNERS coverage ----------
const coPath = ['CODEOWNERS', join('.github', 'CODEOWNERS'), join('docs', 'CODEOWNERS')]
  .map((p) => join(ROOT, p)).find(existsSync);
if (!coPath) {
  err('CODEOWNERS file is missing');
} else {
  const lines = readFileSync(coPath, 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const hasCatchAll = lines.some((l) => l.split(/\s+/)[0] === '*');
  if (!hasCatchAll) {
    for (const name of seen) {
      const covered = lines.some((l) => {
        const pat = l.split(/\s+/)[0];
        return pat.replace(/^\//, '').startsWith(`plugins/${name}`);
      });
      if (!covered) err(`CODEOWNERS: no owner covers plugins/${name}/`);
    }
  }
}

// ---------- 4. secrets / absolute-path scan (plugins/ only) ----------
const SECRET_RULES = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bghp_[A-Za-z0-9]{20,}\b/, 'GitHub token'],
  [/\b(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_\-\/+]{8,}/i, 'hardcoded credential'],
];
const PLACEHOLDER = /(\$\{?[A-Za-z_]|<[^>]+>|YOUR_|xxxx|example|placeholder|\.\.\.)/i;
const ABS_PATH = [/\/Users\//, /\/home\/[a-z]/, /[A-Za-z]:\\\\/];
const TEXT_EXT = new Set(['.md', '.json', '.js', '.mjs', '.ts', '.sh', '.yml', '.yaml', '.txt', '.py', '']);

const pluginsRoot = join(ROOT, 'plugins');
if (existsSync(pluginsRoot)) walk(pluginsRoot);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (entry.name === '.gitkeep') continue;
    const dot = entry.name.lastIndexOf('.');
    const ext = dot >= 0 ? entry.name.slice(dot) : '';
    if (!TEXT_EXT.has(ext)) continue;
    let content;
    try { content = readFileSync(full, 'utf8'); } catch { continue; }
    if (content.includes('\0')) continue; // binary (NUL byte)
    const rel = relative(ROOT, full);
    content.split('\n').forEach((line, n) => {
      for (const [re, label] of SECRET_RULES)
        if (re.test(line) && !PLACEHOLDER.test(line)) err(`${rel}:${n + 1}: possible ${label}`);
      for (const re of ABS_PATH)
        if (re.test(line)) err(`${rel}:${n + 1}: absolute path (use \${CLAUDE_PLUGIN_ROOT})`);
    });
  }
}

// ---------- 5. optional: version bump when plugin files change in a PR ----------
// Enable in CI by setting BASE_SHA to the PR base commit.
const baseSha = process.env.BASE_SHA;
if (baseSha && seen.size) {
  try {
    const changed = execSync(`git diff --name-only ${baseSha}...HEAD`, { encoding: 'utf8' })
      .split('\n').filter(Boolean);
    for (const name of seen) {
      const prefix = `plugins/${name}/`;
      const touched = changed.some((f) => f.startsWith(prefix) && !f.endsWith('CHANGELOG.md'));
      if (!touched) continue;
      const mfRel = `${prefix}.claude-plugin/plugin.json`;
      let baseVer = null;
      try { baseVer = JSON.parse(execSync(`git show ${baseSha}:${mfRel}`, { encoding: 'utf8' })).version; }
      catch { baseVer = null; } // new plugin — nothing to compare
      if (baseVer !== null) {
        const curVer = JSON.parse(readFileSync(join(ROOT, mfRel), 'utf8')).version;
        if (curVer === baseVer)
          err(`plugins/${name}: files changed but version not bumped (still ${curVer})`);
      }
    }
  } catch (e) {
    console.warn(`version-bump check skipped: ${e.message}`);
  }
}

finish();

function finish() {
  if (errors.length) {
    console.error(`✗ marketplace validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ marketplace structural checks passed (${seen.size} plugin(s))`);
  process.exit(0);
}
