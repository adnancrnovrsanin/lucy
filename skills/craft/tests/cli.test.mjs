import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SCAN = fileURLToPath(new URL('../scripts/scan.mjs', import.meta.url));
const run = (cwd, ...args) => spawnSync(process.execPath, [SCAN, ...args], { cwd, encoding: 'utf8' });
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.email=craft@example.com', '-c', 'user.name=craft', '-c', 'init.defaultBranch=main', ...args], { cwd, stdio: 'pipe' });

function project(files) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'craft-scan-')));
  const all = {
    'package.json': JSON.stringify({ dependencies: { 'radix-ui': '^1.4.0', 'react-hook-form': '^7.91.0', zod: '^4.6.7' } }),
    'components.json': JSON.stringify({ style: 'new-york', aliases: { ui: '@/components/ui' } }),
    ...files,
  };
  for (const [name, body] of Object.entries(all)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

const CLEAN = 'export const A = () => <p>Hello</p>;';
const DATE = 'export const B = () => <input type="date" name="due" aria-label="Due date" />;';

test('a clean file exits 0 with a zero summary', () => {
  const dir = project({ 'app/a.tsx': CLEAN });
  const r = run(dir, 'app/a.tsx');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^errors 0, warnings 0, info 0, suppressed 0, files 1$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('an error finding exits 1 and names the rule, location, and fix', () => {
  const dir = project({ 'app/b.tsx': DATE });
  const r = run(dir, 'app');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^error raw-date-input \(1\)$/m);
  assert.match(r.stdout, /^ {2}app\/b\.tsx:1 {2}<input type="date">/m);
  assert.match(r.stdout, /^ {2}fix: /m);
  rmSync(dir, { recursive: true, force: true });
});

test('--json prints the report as JSON', () => {
  const dir = project({ 'app/b.tsx': DATE });
  const r = run(dir, '--json', 'app/b.tsx');
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.ok(out.counts.error >= 1);
  assert.ok(out.findings.some((f) => f.rule === 'raw-date-input' && f.path === 'app/b.tsx' && f.line === 1));
  assert.ok(Array.isArray(out.stacks[0].components));
  rmSync(dir, { recursive: true, force: true });
});

test('an unreadable file exits 2 and is listed as not scanned', () => {
  const dir = project({ 'app/c.tsx': 'export const C = () => <div>;' });
  const r = run(dir, 'app/c.tsx');
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^not scanned$/m);
  assert.match(r.stdout, /not scanned 1$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('a suppression with a reason exits 0 and is listed', () => {
  const dir = project({
    'app/d.tsx': [
      'export const D = () => (',
      '  // craft-scan-ignore raw-date-input: the kiosk browser needs the native picker',
      '  <input type="date" name="due" aria-label="Due date" />',
      ');',
    ].join('\n'),
  });
  const r = run(dir, 'app/d.tsx');
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /^ {2}raw-date-input app\/d\.tsx:3 {2}reason: the kiosk browser needs the native picker$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('a suppression without a reason exits 1', () => {
  const dir = project({ 'app/e.tsx': `${DATE} // craft-scan-ignore raw-date-input` });
  const r = run(dir, 'app/e.tsx');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^error suppression-without-reason \(1\)$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('usage errors exit 2', () => {
  const dir = project({ 'app/a.tsx': CLEAN });
  const unknown = run(dir, '--nope');
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /unknown option --nope/);
  const noRepo = run(dir);
  assert.equal(noRepo.status, 2);
  assert.match(noRepo.stderr, /not a git repository/);
  const missing = run(dir, 'app/missing.tsx');
  assert.equal(missing.status, 2);
  rmSync(dir, { recursive: true, force: true });
});

test('by default it scans files changed since the merge base plus untracked files', () => {
  const dir = project({ 'app/a.tsx': 'export const A = () => <input type="date" name="old" aria-label="Old" />;' });
  git(dir, 'init', '-q');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'base');
  git(dir, 'checkout', '-qb', 'feature');
  writeFileSync(join(dir, 'app/b.tsx'), DATE);
  const r = run(dir, '--base', 'main');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /app\/b\.tsx:1/);
  assert.doesNotMatch(r.stdout, /app\/a\.tsx/);
  const auto = run(dir);
  assert.equal(auto.status, 1, auto.stdout + auto.stderr);
  rmSync(dir, { recursive: true, force: true });
});

test('--all scans every file under the current directory except dependencies and hidden directories', () => {
  const dir = project({ 'app/a.tsx': CLEAN, 'app/b.tsx': DATE, 'node_modules/x/index.js': DATE, '.claude/worktrees/w/app/b.tsx': DATE });
  const r = run(dir, '--all');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /files 2$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('--stack prints the stack of the current project', () => {
  const dir = project({});
  const r = run(dir, '--stack');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^ui: shadcn \(base: radix\)$/m);
  rmSync(dir, { recursive: true, force: true });
});

test('--self-test passes for the shipped rules', () => {
  const r = run(process.cwd(), '--self-test');
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, / rules, 0 failures$/m);
});
