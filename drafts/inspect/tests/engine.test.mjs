import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanSource, suppressionsOf, validateRule, selfTest } from '../scripts/lib/engine.mjs';
import { readSource } from '../scripts/lib/jsx.mjs';
import { fixtureStack } from '../scripts/lib/fixture-stack.mjs';

const probe = {
  id: 'probe',
  severity: 'error',
  platform: 'web',
  why: 'probe fired',
  fix: 'remove the probe',
  ref: 'test',
  check: ({ source }) => source.elements.filter((e) => e.tag === 'probe').map((e) => ({ line: e.line })),
  good: [{ code: 'const a = <div />;' }],
  bad: [{ code: 'const a = <probe />;' }],
};
const scan = (text, { path = 'a.tsx', stack = fixtureStack('web'), rules = [probe] } = {}) => scanSource({ path, text, stack, rules });

test('reports a finding with the rule metadata', () => {
  assert.deepEqual(scan('const x = <probe />;').findings, [
    { rule: 'probe', severity: 'error', path: 'a.tsx', line: 1, message: 'probe fired', fix: 'remove the probe', ref: 'test' },
  ]);
});

test('skips rules for another platform and rules whose guard rejects the stack', () => {
  assert.deepEqual(scan('const x = <probe />;', { stack: fixtureStack('native') }).findings, []);
  const guarded = { ...probe, when: (s) => s.ui === 'heroui' };
  assert.deepEqual(scan('const x = <probe />;', { rules: [guarded] }).findings, []);
  assert.equal(scan('const x = <probe />;', { rules: [guarded], stack: fixtureStack('web', { ui: 'heroui' }) }).findings.length, 1);
});

test('a suppression with a reason on the line above moves the finding to suppressed', () => {
  const text = ['const x = (', '  // inspect-ignore probe: kept for the legacy widget', '  <probe />', ');'].join('\n');
  const result = scan(text);
  assert.deepEqual(result.findings, []);
  assert.equal(result.suppressed[0].reason, 'kept for the legacy widget');
  assert.equal(result.suppressed[0].line, 3);
});

test('a JSX block comment on the same line suppresses too', () => {
  const result = scan('const x = <div>{/* inspect-ignore probe: demo only */}<probe /></div>;');
  assert.deepEqual(result.findings, []);
  assert.equal(result.suppressed.length, 1);
});

test('a suppression without a reason is an error and suppresses nothing', () => {
  const result = scan('const x = <probe />; // inspect-ignore probe');
  assert.deepEqual(result.findings.map((f) => f.rule).sort(), ['probe', 'suppression-without-reason']);
  assert.equal(result.findings.find((f) => f.rule === 'suppression-without-reason').severity, 'error');
});

test('an unreadable file is reported, not scanned', () => {
  const result = scan('const x = <div>;');
  assert.match(result.unreadable, /unclosed <div> \(line 1\)/);
  assert.deepEqual(result.findings, []);
});

test('.ts files are read without JSX', () => {
  assert.deepEqual(scan('const n = a <probe> b;', { path: 'a.ts' }).findings, []);
});

test('suppressionsOf reads line and block comments', () => {
  const src = readSource('// inspect-ignore a-rule: one\n/* inspect-ignore b-rule */\nconst x = 1;');
  assert.deepEqual(suppressionsOf(src), [
    { rule: 'a-rule', reason: 'one', line: 1, endLine: 1 },
    { rule: 'b-rule', reason: '', line: 2, endLine: 2 },
  ]);
});

test('validateRule lists every problem', () => {
  assert.deepEqual(validateRule({ id: 'Bad Id' }), [
    'id must be kebab-case',
    'severity must be error, warning, or info',
    'platform must be web, native, or all',
    'why must be a non-empty string',
    'fix must be a non-empty string',
    'ref must be a non-empty string',
    'check must be a function',
    'good must list at least one { code } example',
    'bad must list at least one { code } example',
  ]);
});

test('selfTest passes a sound rule and catches a broken one', () => {
  assert.deepEqual(selfTest([probe]), []);
  const broken = { ...probe, id: 'broken', bad: [{ code: 'const a = <div />;' }] };
  assert.equal(selfTest([broken])[0].problem, 'bad example did not trigger');
});

test('the old craft-scan-ignore comment no longer suppresses', () => {
  const result = scan('const x = <probe />; // craft-scan-ignore probe: old name');
  assert.deepEqual(result.findings.map((f) => f.rule), ['probe']);
  assert.deepEqual(result.suppressed, []);
});
