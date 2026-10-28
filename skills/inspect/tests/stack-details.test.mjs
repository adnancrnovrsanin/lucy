import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { detectStack, describeStack, installedVersion, routerAtLeast, queryAtLeast } from '../scripts/lib/stack.mjs';
import { fixtureStack } from '../scripts/lib/fixture-stack.mjs';

const fixture = (name) => fileURLToPath(new URL(`./fixtures/stacks/${name}`, import.meta.url));

test('Next with TanStack Query reports the router major and the Query minor', () => {
  const s = detectStack(fixture('next-query'));
  assert.equal(s.router, 'next');
  assert.equal(s.routerPackage, 'next');
  assert.equal(s.routerMajor, 16);
  assert.equal(s.routerMinor, 4);
  assert.equal(s.queryMajor, 5);
  assert.equal(s.queryMinor, 105);
  assert.match(describeStack(s), /^router: next, major 16 \(next \^16\.4\.0\)$/m);
  assert.match(describeStack(s), /^data layer: @tanstack\/react-query \^5\.105\.0, version 5\.105$/m);
});

test('TanStack Router and React Router 8 are told apart', () => {
  const t = detectStack(fixture('tanstack-router'));
  assert.equal(t.router, 'tanstack-router');
  assert.equal(t.routerMajor, 1);
  assert.equal(t.queryMinor, 90);
  const r = detectStack(fixture('react-router-8'));
  assert.equal(r.router, 'react-router');
  assert.equal(r.routerMajor, 8);
  assert.equal(r.queryMajor, 5);
  assert.equal(r.queryMinor, null);
});

test('Expo Router wins over the React Navigation it sits on', () => {
  const s = detectStack(fixture('expo-router'));
  assert.equal(s.router, 'expo-router');
  assert.equal(s.routerMajor, 58);
  assert.equal(s.platform, 'native');
});

test('a project with no router', () => {
  const s = detectStack(fixture('plain'));
  assert.equal(s.router, null);
  assert.equal(s.routerMajor, null);
  assert.equal(s.queryMajor, null);
  assert.match(describeStack(s), /^router: none$/m);
});

test('installedVersion prefers node_modules and reads the minor', () => {
  const dir = mkdtempSync(join(tmpdir(), 'inspect-stack-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@tanstack/react-query': '^5.90.0' } }));
  mkdirSync(join(dir, 'node_modules', '@tanstack', 'react-query'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', '@tanstack', 'react-query', 'package.json'), JSON.stringify({ version: '5.105.0' }));
  assert.deepEqual(installedVersion(dir, '@tanstack/react-query', '^5.90.0'), { major: 5, minor: 105 });
  assert.deepEqual(installedVersion(dir, 'missing', '^5'), { major: 5, minor: null });
  assert.deepEqual(installedVersion(dir, 'missing', 'workspace:*'), { major: null, minor: null });
  rmSync(dir, { recursive: true, force: true });
});

test('routerAtLeast and queryAtLeast gate on known versions only', () => {
  const s = fixtureStack('web');
  assert.equal(routerAtLeast(s, 'next', 16), true);
  assert.equal(routerAtLeast(s, 'next', 17), false);
  assert.equal(routerAtLeast(s, 'react-router', 8), false);
  assert.equal(queryAtLeast(s, 5, 105), true);
  assert.equal(queryAtLeast({ ...s, queryMinor: 90 }, 5, 105), false);
  assert.equal(queryAtLeast({ ...s, queryMajor: 6, queryMinor: 0 }, 5, 105), true);
  assert.equal(queryAtLeast({ ...s, queryMinor: null }, 5, 105), false);
  assert.equal(queryAtLeast({ ...s, queryMajor: null, queryMinor: null }, 5, 105), false);
});

test('routerAtLeast gates on the router minor, and an unknown minor stays silent', () => {
  const s = fixtureStack('web');
  assert.equal(routerAtLeast({ ...s, routerMinor: 4 }, 'next', 16, 3), true);
  assert.equal(routerAtLeast({ ...s, routerMinor: 2 }, 'next', 16, 3), false);
  assert.equal(routerAtLeast({ ...s, routerMajor: 17, routerMinor: 0 }, 'next', 16, 3), true);
  assert.equal(routerAtLeast({ ...s, routerMinor: null }, 'next', 16, 3), false);
  assert.equal(routerAtLeast({ ...s, routerMinor: null }, 'next', 16), true);
});
