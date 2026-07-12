#!/usr/bin/env node
// Build the static search index for the catalog site (site/public/*.json).
// Dependency-free (Node built-ins only), in the style of validate-marketplace.mjs.
// Walks plugins/**, parses manifests + Markdown frontmatter + CHANGELOG, strips
// Markdown to plain text for full-text search, and emits:
//   site/public/index.json     — { generatedAt, entries: IndexEntry[] }
//   site/public/releases.json  — merged changelog feed (What's new)
//   site/public/stats.json     — aggregate counts for the stats tile
//   site/public/bodies/<id>.md — raw Markdown body per entry (lazy detail view)
// Runs cleanly on an empty `plugins: []` (emits valid empty files, exit 0).
// Broken frontmatter / JSON degrade to a warning + skip — never aborts the build.

import { readFileSync, existsSync, statSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths from the script location, not cwd, so output always lands in
// site/public/ regardless of the directory the script is invoked from.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site', 'public');
const BODIES = join(OUT, 'bodies');

const REPO_SLUG = 'burnjohn/dev-digest-ai-marketplace';
const GH_BASE = `https://github.com/${REPO_SLUG}`;

const warnings = [];
const warn = (m) => warnings.push(m);

const BODY_CAP = 4096; // keep index.json small; SITE-SPEC §8

// ---------- helpers ----------

/** Minimal YAML frontmatter parser: `key: value`, `[a, b]` inline arrays,
 *  and `- item` block lists. Returns { data, body }. Broken block → warn + all body. */
function parseFrontmatter(raw, label) {
  if (!raw.startsWith('---')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    warn(`${label}: unterminated frontmatter — treated whole file as body`);
    return { data: {}, body: raw };
  }
  const head = raw.slice(3, end).replace(/^\n/, '');
  const body = raw.slice(raw.indexOf('\n', end + 1) + 1);
  const data = {};
  const lines = head.split('\n');
  let curKey = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && curKey) {
      (data[curKey] = data[curKey] || []).push(unquote(listItem[1].trim()));
      continue;
    }
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (val === '') { curKey = key; data[key] = data[key] || []; continue; }
    curKey = null;
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      data[key] = unquote(val);
    }
  }
  return { data, body };
}
const unquote = (s) => s.replace(/^["']|["']$/g, '');

/** Strip Markdown to plain searchable text, capped. */
function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')        // fenced code
    .replace(/`[^`]*`/g, ' ')               // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')  // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')// links → text
    .replace(/^#{1,6}\s+/gm, '')            // headings
    .replace(/[*_>#~`]/g, ' ')              // emphasis / quote marks
    .replace(/<[^>]+>/g, ' ')               // html tags
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, BODY_CAP);
}

/** Parse CHANGELOG.md `## <version>` sections → [{version, date?, summary}]. */
function parseChangelog(md) {
  const out = [];
  const re = /^##\s*\[?v?(\d+\.\d+\.\d+)\]?\s*(?:[-–—]\s*)?(\d{4}-\d{2}-\d{2})?/gm;
  const matches = [...md.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const next = i + 1 < matches.length ? matches[i + 1].index : md.length;
    const summary = md.slice(start, next).split('\n').map((l) => l.trim())
      .filter(Boolean).map((l) => l.replace(/^[-*]\s*/, ''))[0] || '';
    out.push({ version: m[1], date: m[2] || undefined, summary });
  }
  return out;
}

const firstLine = (md) =>
  md.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#')) || '';

const slugId = (id) => id.replace(/[:/]/g, '-');

function writeBody(id, raw) {
  writeFileSync(join(BODIES, `${slugId(id)}.md`), raw);
  return `bodies/${slugId(id)}.md`;
}

function readText(path) {
  try {
    const c = readFileSync(path, 'utf8');
    return c.includes('\0') ? null : c;
  } catch { return null; }
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => join(dir, e.name));
}

// ---------- main ----------

const entries = [];
const releases = [];
const stats = { plugins: 0, skills: 0, agents: 0, commands: 0, hooks: 0, mcp: 0, total: 0 };

let mp;
try {
  mp = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
} catch (e) {
  console.error(`✗ cannot read marketplace.json: ${e.message}`);
  process.exit(1);
}
const marketName = typeof mp.name === 'string' ? mp.name : 'dev-digest-ai-marketplace';
const installOf = (name) => `/plugin install ${name}@${marketName}`;

// Reset output dir (bodies are regenerated each run to avoid stale files).
mkdirSync(OUT, { recursive: true });
rmSync(BODIES, { recursive: true, force: true });
mkdirSync(BODIES, { recursive: true });

const plugins = Array.isArray(mp.plugins) ? mp.plugins : [];
for (const [i, p] of plugins.entries()) {
  const at = `plugins[${i}]`;
  if (!p || typeof p.name !== 'string') { warn(`${at}: missing name — skipped`); continue; }
  const name = p.name;

  // Object sources (github/url/npm/git-subdir) live outside the repo — emit a
  // minimal entry from marketplace metadata only, matching the validator's skip.
  if (p.source && typeof p.source === 'object') {
    entries.push({
      id: `plugin:${name}`, kind: 'plugin', name, displayName: name,
      description: p.description || '', plugin: name, keywords: p.keywords || [],
      bodyText: '', sourcePath: '', githubUrl: GH_BASE,
      installCommand: installOf(name), sourceType: p.source.source,
      components: { skills: 0, agents: 0, commands: 0, hooks: 0, mcp: 0 },
    });
    stats.plugins++;
    warn(`${name}: object source (${p.source.source}) — indexed from metadata only`);
    continue;
  }
  if (typeof p.source !== 'string') { warn(`${at} "${name}": bad source — skipped`); continue; }

  const dir = join(ROOT, p.source);
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    warn(`${name}: plugin.json invalid or missing (${e.message}) — skipped`);
    continue;
  }

  const relDir = relative(ROOT, dir);
  const treeUrl = (sub = '') => `${GH_BASE}/tree/main/${relDir}${sub ? '/' + sub : ''}`;
  const blobUrl = (file) => `${GH_BASE}/blob/main/${relDir}/${file}`;

  const deps = manifest.dependencies && typeof manifest.dependencies === 'object'
    ? Object.keys(manifest.dependencies) : [];

  const components = { skills: 0, agents: 0, commands: 0, hooks: 0, mcp: 0 };

  // Plugin README → body + bodyText.
  const readme = readText(join(dir, 'README.md')) || '';
  const changelog = (() => {
    const cl = readText(join(dir, 'CHANGELOG.md'));
    return cl ? parseChangelog(cl) : [];
  })();
  const compatText = readText(join(dir, 'COMPATIBILITY.md'));

  const pluginId = `plugin:${name}`;
  const pluginEntry = {
    id: pluginId, kind: 'plugin', name,
    displayName: manifest.displayName || name,
    description: manifest.description || '',
    plugin: name,
    keywords: Array.isArray(manifest.keywords) ? manifest.keywords : [],
    bodyText: stripMarkdown(readme),
    bodyHtmlPath: readme ? writeBody(pluginId, readme) : undefined,
    sourcePath: relDir,
    githubUrl: treeUrl(),
    version: typeof manifest.version === 'string' ? manifest.version : undefined,
    author: manifest.author || undefined,
    installCommand: installOf(name),
    dependencies: deps,
    compatibility: compatText ? firstLine(compatText) : undefined,
    changelog,
    sourceType: 'path',
    components, // filled below
  };

  // Sub-artifacts ------------------------------------------------------------
  const pushArtifact = (kind, artName, file, raw) => {
    const { data, body } = parseFrontmatter(raw, `${name}/${file}`);
    const id = `${kind}:${name}/${artName}`;
    const tools = Array.isArray(data.tools) ? data.tools
      : Array.isArray(data['allowed-tools']) ? data['allowed-tools'] : undefined;
    entries.push({
      id, kind, name: artName,
      displayName: data.displayName || data.name || artName,
      description: data.description || '',
      plugin: name,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      bodyText: stripMarkdown(body),
      bodyHtmlPath: body.trim() ? writeBody(id, body) : undefined,
      sourcePath: `${relDir}/${file}`,
      githubUrl: blobUrl(file),
      tools,
      invocation: data.invocation || undefined,
      model: data.model || undefined,
    });
  };

  // skills/<skill>/SKILL.md
  const skillsDir = join(dir, 'skills');
  if (existsSync(skillsDir)) {
    for (const e of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const raw = readText(join(skillsDir, e.name, 'SKILL.md'));
      if (raw == null) continue;
      pushArtifact('skill', e.name, `skills/${e.name}/SKILL.md`, raw);
      components.skills++; stats.skills++;
    }
  }
  // agents/*.md, commands/*.md
  for (const [kind, sub, key] of [['agent', 'agents', 'agents'], ['command', 'commands', 'commands']]) {
    for (const file of listFiles(join(dir, sub), '.md')) {
      const raw = readText(file);
      if (raw == null) continue;
      const artName = file.slice(file.lastIndexOf('/') + 1, -3);
      pushArtifact(kind, artName, `${sub}/${artName}.md`, raw);
      components[key]++; stats[key]++;
    }
  }
  // hooks/hooks.json → one entry per event handler
  const hooksRaw = readText(join(dir, 'hooks', 'hooks.json'));
  if (hooksRaw != null) {
    try {
      const parsed = JSON.parse(hooksRaw);
      const events = parsed && parsed.hooks && typeof parsed.hooks === 'object' ? parsed.hooks : parsed;
      const keys = events && typeof events === 'object' && !Array.isArray(events) ? Object.keys(events) : [];
      for (const ev of keys) {
        const id = `hook:${name}/${ev}`;
        const handlers = Array.isArray(events[ev]) ? events[ev].length : 1;
        entries.push({
          id, kind: 'hook', name: ev, displayName: ev,
          description: `${handlers} handler(s) on ${ev}`, plugin: name,
          keywords: ['hook'], bodyText: '', sourcePath: `${relDir}/hooks/hooks.json`,
          githubUrl: blobUrl('hooks/hooks.json'),
        });
        components.hooks++; stats.hooks++;
      }
    } catch (e) { warn(`${name}: hooks.json invalid JSON (${e.message}) — skipped`); }
  }
  // .mcp.json → one entry per server
  const mcpRaw = readText(join(dir, '.mcp.json'));
  if (mcpRaw != null) {
    try {
      const parsed = JSON.parse(mcpRaw);
      const servers = parsed && parsed.mcpServers && typeof parsed.mcpServers === 'object' ? parsed.mcpServers : {};
      for (const srv of Object.keys(servers)) {
        const id = `mcp:${name}/${srv}`;
        const cfg = servers[srv] || {};
        entries.push({
          id, kind: 'mcp', name: srv, displayName: srv,
          description: cfg.description || `MCP server: ${srv}`, plugin: name,
          keywords: ['mcp'], bodyText: '', sourcePath: `${relDir}/.mcp.json`,
          githubUrl: blobUrl('.mcp.json'),
          tools: Array.isArray(cfg.tools) ? cfg.tools : undefined,
        });
        components.mcp++; stats.mcp++;
      }
    } catch (e) { warn(`${name}: .mcp.json invalid JSON (${e.message}) — skipped`); }
  }

  entries.push(pluginEntry);
  stats.plugins++;

  // Merge changelog into the release feed.
  for (const c of changelog) {
    releases.push({ plugin: name, displayName: pluginEntry.displayName, ...c });
  }
}

stats.total = entries.length;

// Sort releases: newest date first, then higher semver.
const semverCmp = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  return (pb[0] - pa[0]) || (pb[1] - pa[1]) || (pb[2] - pa[2]);
};
releases.sort((a, b) => (b.date || '').localeCompare(a.date || '') || semverCmp(a.version, b.version));

const generatedAt = new Date().toISOString();
const writeJson = (file, obj) => writeFileSync(join(OUT, file), JSON.stringify(obj, null, 2) + '\n');
writeJson('index.json', { generatedAt, entries });
writeJson('releases.json', releases);
writeJson('stats.json', stats);

for (const w of warnings) console.warn(`⚠ ${w}`);
console.log(`✓ index built (${stats.plugins} plugin(s), ${stats.total} entr${stats.total === 1 ? 'y' : 'ies'}, ${warnings.length} warning(s))`);
