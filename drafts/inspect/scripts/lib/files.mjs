// Chooses which files the scan reads: given paths, every file, or the files changed since
// the merge base with the default branch plus untracked files.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

export class UsageError extends Error {}

const EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js']);
// Dependencies and build output, plus every directory whose name starts with a dot
// (.git, .next, .claude worktrees, and the like).
const SKIP = new Set(['node_modules', 'dist', 'build', 'out', 'coverage']);

function wanted(file) {
  return EXTENSIONS.has(extname(file)) && !file.endsWith('.d.ts');
}

function walk(dir, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name) && !entry.name.startsWith('.')) walk(join(dir, entry.name), out);
    } else if (entry.isFile() && wanted(entry.name)) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function defaultBase(top) {
  try {
    return git(top, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']);
  } catch {
    for (const branch of ['main', 'master']) {
      try {
        git(top, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]);
        return branch;
      } catch {
        // try the next name
      }
    }
  }
  throw new UsageError('cannot find the default branch; pass --base <ref>');
}

function changedFiles(root, base) {
  let top;
  try {
    top = git(root, ['rev-parse', '--show-toplevel']);
  } catch {
    throw new UsageError('not a git repository; pass paths or --all');
  }
  const ref = base ?? defaultBase(top);
  let mergeBase;
  try {
    mergeBase = git(top, ['merge-base', 'HEAD', ref]);
  } catch {
    throw new UsageError(`cannot find the merge base with ${ref}`);
  }
  const listed = [
    ...git(top, ['diff', '--name-only', '--diff-filter=ACMR', mergeBase]).split('\n'),
    ...git(top, ['ls-files', '--others', '--exclude-standard']).split('\n'),
  ].filter(Boolean);
  const inside = realpathSync(resolve(root)) + sep;
  return [...new Set(listed.map((f) => resolve(top, f)))]
    .filter((f) => f.startsWith(inside) && wanted(f) && existsSync(f))
    .filter((f) => !f.slice(inside.length).split(sep).some((part) => SKIP.has(part) || part.startsWith('.')))
    .sort();
}

export function selectFiles({ root, paths = [], all = false, base = null }) {
  if (paths.length) {
    const out = [];
    for (const p of paths) {
      const full = resolve(root, p);
      if (!existsSync(full)) throw new UsageError(`no such file or directory: ${p}`);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (wanted(full)) out.push(full);
    }
    return [...new Set(out)].sort();
  }
  if (all) return walk(resolve(root), []).sort();
  return changedFiles(root, base);
}
