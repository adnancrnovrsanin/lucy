import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { detectStack, describeStack, installedMajor } from '../scripts/lib/stack.mjs';

const fixture = (name) => fileURLToPath(new URL(`./fixtures/stacks/${name}`, import.meta.url));

test('TanStack Table with Query, nuqs, and Virtual', () => {
  const s = detectStack(fixture('tables-tanstack'));
  assert.equal(s.tableEngine, 'tanstack');
  assert.equal(s.tableEnginePackage, '@tanstack/react-table');
  assert.equal(s.tableEngineMajor, 9);
  assert.equal(s.agGridEdition, null);
  assert.equal(s.dataLayer, '@tanstack/react-query');
  assert.equal(s.urlState, 'nuqs');
  assert.equal(s.virtualizer, '@tanstack/react-virtual');
});

test('AG Grid wins over TanStack and reports its edition', () => {
  const s = detectStack(fixture('tables-ag-grid'));
  assert.equal(s.tableEngine, 'ag-grid');
  assert.equal(s.tableEnginePackage, 'ag-grid-react');
  assert.equal(s.tableEngineMajor, 36);
  assert.equal(s.agGridEdition, 'enterprise');
  assert.equal(s.dataLayer, 'swr');
  assert.equal(s.urlState, null);
});

test('HeroUI without a table engine renders with its own Table', () => {
  const s = detectStack(fixture('heroui-web'));
  assert.equal(s.tableEngine, 'heroui');
  assert.equal(s.tableEngineMajor, 3);
});

test('a project with no table engine', () => {
  const s = detectStack(fixture('plain'));
  assert.equal(s.tableEngine, null);
  assert.equal(s.tableEngineMajor, null);
  assert.equal(s.dataLayer, null);
  assert.equal(s.virtualizer, null);
});

test('installedMajor prefers node_modules over the declared range', () => {
  const dir = mkdtempSync(join(tmpdir(), 'inspect-stack-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@tanstack/react-table': '^8.20.0' } }));
  mkdirSync(join(dir, 'node_modules', '@tanstack', 'react-table'), { recursive: true });
  writeFileSync(join(dir, 'node_modules', '@tanstack', 'react-table', 'package.json'), JSON.stringify({ version: '9.3.1' }));
  assert.equal(installedMajor(dir, '@tanstack/react-table', '^8.20.0'), 9);
  assert.equal(detectStack(dir).tableEngineMajor, 9);
  assert.equal(installedMajor(dir, 'missing', 'workspace:*'), null);
  assert.equal(installedMajor(dir, 'missing', '~8.20.1'), 8);
  rmSync(dir, { recursive: true, force: true });
});

test('describeStack prints the table facts', () => {
  const text = describeStack(detectStack(fixture('tables-tanstack')));
  assert.match(text, /^table engine: tanstack, major 9 \(@tanstack\/react-table \^9\.2\.4\)$/m);
  assert.match(text, /^data layer: @tanstack\/react-query \^5\.90\.0, version 5\.90$/m);
  assert.match(text, /^url state: nuqs \^2\.7\.0$/m);
  assert.match(text, /^virtualizer: @tanstack\/react-virtual \^3\.13\.0$/m);
  const grid = describeStack(detectStack(fixture('tables-ag-grid')));
  assert.match(grid, /^table engine: ag-grid, major 36, enterprise \(ag-grid-react \^36\.2\.0\)$/m);
  const none = describeStack(detectStack(fixture('plain')));
  assert.match(none, /^table engine: none$/m);
  assert.match(none, /^url state: none$/m);
});
