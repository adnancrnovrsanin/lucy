import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack, packageRootOf, describeStack, serializeStack } from '../scripts/lib/stack.mjs';

const fixture = (name) => fileURLToPath(new URL(`./fixtures/stacks/${name}`, import.meta.url));

test('shadcn on Radix with React Hook Form and Zod', () => {
  const s = detectStack(fixture('shadcn-radix'));
  assert.equal(s.ui, 'shadcn');
  assert.equal(s.base, 'radix');
  assert.equal(s.platform, 'web');
  assert.equal(s.formLib, 'react-hook-form');
  assert.equal(s.validation, 'zod');
  assert.equal(s.versions.zod, '^4.6.7');
  assert.equal(s.versions['@hookform/resolvers'], '^6.0.1');
  assert.deepEqual([...s.components].sort(), ['calendar', 'field', 'select']);
  assert.equal(s.hasDatePicker, true);
  assert.equal(s.hasSelect, true);
  assert.equal(s.vendorTools.shadcnCli, true);
});

test('shadcn on Base UI with TanStack Form', () => {
  const s = detectStack(fixture('shadcn-base'));
  assert.equal(s.ui, 'shadcn');
  assert.equal(s.base, 'base');
  assert.equal(s.formLib, '@tanstack/react-form');
  assert.deepEqual([...s.components], []);
});

test('HeroUI web with the MCP configured in the project', () => {
  const s = detectStack(fixture('heroui-web'));
  assert.equal(s.ui, 'heroui');
  assert.equal(s.uiPro, false);
  assert.equal(s.base, null);
  assert.equal(s.platform, 'web');
  assert.equal(s.versions['@internationalized/date'], '^3.12.4');
  assert.equal(s.vendorTools.herouiMcpInProject, true);
  assert.equal(s.hasDatePicker, true);
});

test('HeroUI Native with Pro', () => {
  const s = detectStack(fixture('heroui-native'));
  assert.equal(s.ui, 'heroui-native');
  assert.equal(s.uiPro, true);
  assert.equal(s.platform, 'native');
  assert.equal(s.hasDatePicker, true);
  assert.equal(s.hasSelect, true);
});

test('a project with no UI library', () => {
  const s = detectStack(fixture('plain'));
  assert.equal(s.ui, null);
  assert.equal(s.hasSelect, false);
  assert.equal(s.hasDatePicker, false);
  assert.equal(s.formLib, null);
});

test('packageRootOf walks up from a file or a directory', () => {
  const root = fixture('shadcn-radix');
  assert.equal(packageRootOf(join(root, 'components/ui/select.tsx')), root);
  assert.equal(packageRootOf(join(root, 'components/ui')), root);
});

test('describeStack prints one line per fact', () => {
  const text = describeStack(detectStack(fixture('shadcn-radix')));
  assert.match(text, /^ui: shadcn \(base: radix\)$/m);
  assert.match(text, /^platform: web$/m);
  assert.match(text, /^form library: react-hook-form \^7\.91\.0$/m);
  assert.match(text, /^validation: zod \^4\.6\.7$/m);
  assert.match(text, /^installed components: calendar, field, select$/m);
  assert.match(text, /^vendor tools: shadcn CLI/m);
  const none = describeStack(detectStack(fixture('plain')));
  assert.match(none, /^ui: none$/m);
});

test('serializeStack turns the component set into a sorted array', () => {
  const s = serializeStack(detectStack(fixture('shadcn-radix')));
  assert.deepEqual(s.components, ['calendar', 'field', 'select']);
});

test('shadcn with an unknown base reports it instead of radix', () => {
  const s = detectStack(fixture('shadcn-aria'));
  assert.equal(s.ui, 'shadcn');
  assert.equal(s.base, 'aria');
});
