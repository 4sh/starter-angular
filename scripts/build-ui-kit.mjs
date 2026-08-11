#!/usr/bin/env node
/**
 * build-ui-kit.mjs — builds the `ui-kit` Angular package in dependency order,
 * one topological level at a time, to work around an ng-packagr race.
 *
 * Known issue: ng-packagr (tested 22.0.2 and 22.1.1, via the
 * `@angular/build:ng-packagr` builder) intermittently fails to detect
 * cross-entry-point dependencies (e.g. `ui-kit/ui-button` importing
 * `ui-kit/ui-icon`) when building every entry point of a multi-entry package
 * in one shot — "Cannot find module 'ui-kit/...'" — even from a fully clean
 * `dist/` + `.angular/cache`. Measured ~20-30% failure rate per attempt, and
 * NOT independent across retries (5 consecutive failures observed), so a
 * plain retry loop isn't safe.
 *
 * Root cause looks like a race in ng-packagr's own entry-point dependency
 * graph analysis (`node.dependents` / `depGraph.overallOrder()` in
 * ng-packagr's package.transform.js): it needs to resolve an entry's `ui-kit/*`
 * imports to discover the graph edge, but that resolution needs dist/ to
 * already contain the dependency — a chicken-and-egg race when several
 * entries build in the same invocation.
 *
 * Workaround: build our OWN dependency graph (static regex scan of `from
 * 'ui-kit(/...)?'` imports per entry), then invoke `ng build ui-kit` once per
 * topological level, temporarily hiding (renaming) the `ng-package.json` of
 * every entry not yet due — so each invocation only ever resolves
 * dependencies that were fully built (written to disk) by a STRICTLY EARLIER,
 * separate process invocation. No two interdependent entries are ever
 * compiled in the same ng-packagr run, which removes the race entirely.
 *
 * Note: this staged approach requires `"deleteDestPath": false` in
 * projects/ui-kit/ng-package.json — otherwise each per-level ng-packagr
 * invocation would wipe dist/ and destroy the levels built before it. This
 * script clears dist/ui-kit itself, once, before the first level.
 *
 * Revisit this workaround when bumping ng-packagr — remove it once a version
 * fixes the race upstream, replacing this script with a plain
 * `ng build ui-kit` in package.json's `ui-kit:build` (and restoring
 * `deleteDestPath` to its default).
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UI_KIT_DIR = join(ROOT, 'projects/ui-kit');
const HIDDEN_SUFFIX = '.hidden-for-staged-build';

/** Secondary entry point names = subdirectories with their own ng-package.json. */
function discoverEntries() {
  return readdirSync(UI_KIT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(UI_KIT_DIR, name, 'ng-package.json')));
}

/** All .ts files under a directory (recursive), skipping the .hidden ng-package.json trick's noise. */
function walkTsFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(full, out);
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/**
 * Entry names this entry statically imports via `ui-kit` / `ui-kit/<name>`.
 *
 * Only scans `<entry>/src/` — the code ng-packagr actually compiles. The
 * co-located `*.stories.ts` / `*.mdx` sit OUTSIDE src/ (Storybook-only, never
 * packaged) and import their own entry point by its public name, which would
 * otherwise register as a bogus self-dependency / cycle.
 */
function dependenciesOf(entryName, entryDir, allEntries) {
  const deps = new Set();
  const srcDir = join(entryDir, 'src');
  if (!existsSync(srcDir)) return deps;
  const pattern = /from\s+['"]ui-kit(?:\/([\w-]+))?['"]/g;
  for (const file of walkTsFiles(srcDir)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(pattern)) {
      const dep = match[1];
      if (dep && dep !== entryName && allEntries.includes(dep)) deps.add(dep);
    }
  }
  return deps;
}

/** Kahn's algorithm → array of levels (each level: entry names buildable together). */
function computeLevels(entries) {
  const deps = new Map(entries.map((e) => [e, dependenciesOf(e, join(UI_KIT_DIR, e), entries)]));
  const remaining = new Set(entries);
  const levels = [];
  while (remaining.size) {
    const ready = [...remaining].filter((e) => [...deps.get(e)].every((d) => !remaining.has(d)));
    if (!ready.length) {
      throw new Error(`[build-ui-kit] Circular ui-kit/* dependency among: ${[...remaining].join(', ')}`);
    }
    levels.push(ready);
    ready.forEach((e) => remaining.delete(e));
  }
  return levels;
}

function ngPackageJsonPath(entry) {
  return join(UI_KIT_DIR, entry, 'ng-package.json');
}

function hide(entry) {
  renameSync(ngPackageJsonPath(entry), ngPackageJsonPath(entry) + HIDDEN_SUFFIX);
}

function reveal(entry) {
  renameSync(ngPackageJsonPath(entry) + HIDDEN_SUFFIX, ngPackageJsonPath(entry));
}

function runNgBuild() {
  return spawnSync('npx', ['ng', 'build', 'ui-kit'], { stdio: 'inherit', cwd: ROOT }).status === 0;
}

const entries = discoverEntries();
const levels = computeLevels(entries);
console.log(`[build-ui-kit] Dependency levels: ${levels.map((l) => `[${l.join(', ')}]`).join(' -> ')}`);

rmSync(join(ROOT, 'dist/ui-kit'), { recursive: true, force: true });

// Hide every secondary entry up front; each level reveals its own before building.
entries.forEach(hide);

try {
  for (const [i, level] of levels.entries()) {
    level.forEach(reveal);
    console.log(`[build-ui-kit] Building level ${i + 1}/${levels.length}: ${level.join(', ')}`);
    // Each level only ever depends on entries built in a strictly earlier,
    // separate invocation (already on disk) — no retry should be needed, but
    // keep one as cheap insurance against unrelated transient failures.
    if (!runNgBuild() && !runNgBuild()) {
      throw new Error(`[build-ui-kit] Failed building level ${i + 1} (${level.join(', ')}) twice.`);
    }
  }
} finally {
  // Always restore every ng-package.json, even on failure.
  for (const entry of entries) {
    if (existsSync(ngPackageJsonPath(entry) + HIDDEN_SUFFIX)) reveal(entry);
  }
}

console.log('[build-ui-kit] Done.');
