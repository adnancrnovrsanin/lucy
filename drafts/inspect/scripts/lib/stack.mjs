// Detects a project's UI stack from its package.json, shadcn's components.json, and its
// MCP configuration. One function, one answer per package root.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const FORM_LIBS = ['react-hook-form', '@tanstack/react-form', 'formik', '@conform-to/react'];
const VALIDATION_LIBS = ['zod', 'valibot', 'yup', 'arktype', 'joi'];
const NOTED = [
  '@heroui/react', '@heroui-pro/react', 'heroui-native', 'heroui-native-pro', 'react-native', 'expo',
  'radix-ui', '@base-ui/react', 'react-aria-components', '@react-stately/data', 'react-day-picker', 'date-fns',
  '@internationalized/date', '@hookform/resolvers', ...FORM_LIBS, ...VALIDATION_LIBS,
];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function packageRootOf(path) {
  const start = resolve(path);
  let dir = existsSync(start) && statSync(start).isDirectory() ? start : dirname(start);
  const first = dir;
  for (;;) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const up = dirname(dir);
    if (up === dir) return first;
    dir = up;
  }
}

export function detectStack(root) {
  const pkg = readJson(join(root, 'package.json')) ?? {};
  const deps = { ...(pkg.peerDependencies ?? {}), ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) };
  const has = (name) => Object.prototype.hasOwnProperty.call(deps, name);
  const versions = {};
  for (const name of NOTED) if (has(name)) versions[name] = deps[name];

  const shadcnConfig = readJson(join(root, 'components.json'));
  let ui = null;
  let uiPro = false;
  let base = null;
  let platform = has('react-native') || has('expo') ? 'native' : 'web';
  if (has('heroui-native') || has('heroui-native-pro')) {
    ui = 'heroui-native';
    uiPro = has('heroui-native-pro');
    platform = 'native';
  } else if (has('@heroui/react') || has('@heroui-pro/react')) {
    ui = 'heroui';
    uiPro = has('@heroui-pro/react');
  } else if (shadcnConfig) {
    ui = 'shadcn';
    base = shadcnBase(shadcnConfig, has);
  }

  return {
    root,
    ui,
    uiPro,
    base,
    platform,
    formLib: FORM_LIBS.find(has) ?? null,
    validation: VALIDATION_LIBS.find(has) ?? null,
    versions,
    components: ui === 'shadcn' ? shadcnComponents(root, shadcnConfig) : new Set(),
    hasDatePicker: ui === 'shadcn' || ui === 'heroui' || (ui === 'heroui-native' && uiPro),
    hasSelect: ui !== null,
    vendorTools: { shadcnCli: ui === 'shadcn', herouiMcpInProject: mcpMentions(root, 'heroui') },
  };
}

function shadcnBase(config, has) {
  if (config.base === 'base' || config.base === 'radix') return config.base;
  if (typeof config.base === 'string' && config.base) return config.base;
  if (typeof config.style === 'string' && config.style.startsWith('base-')) return 'base';
  if (has('@base-ui/react') || has('@base-ui-components/react')) return 'base';
  return 'radix';
}

function shadcnComponents(root, config) {
  const alias = config?.aliases?.ui ?? '@/components/ui';
  const relative = alias.replace(/^[@~]\//, '');
  const candidates = [join(root, relative), join(root, 'src', relative), join(root, 'components/ui'), join(root, 'src/components/ui')];
  for (const dir of candidates) {
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return new Set(readdirSync(dir).filter((f) => /\.[jt]sx?$/.test(f)).map((f) => f.replace(/\.[jt]sx?$/, '')));
    }
  }
  return new Set();
}

function mcpMentions(root, word) {
  for (const file of ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json', '.codex/config.toml']) {
    const path = join(root, file);
    if (existsSync(path) && readFileSync(path, 'utf8').toLowerCase().includes(word)) return true;
  }
  return false;
}

export function describeStack(s) {
  const v = (name) => (s.versions[name] ? ` ${s.versions[name]}` : '');
  let ui = 'none';
  if (s.ui === 'shadcn') ui = `shadcn (base: ${s.base})`;
  else if (s.ui) ui = `${s.ui}${s.uiPro ? ' with Pro' : ''}`;
  const lines = [
    `root: ${s.root}`,
    `ui: ${ui}`,
    `platform: ${s.platform}`,
    `form library: ${s.formLib ? s.formLib + v(s.formLib) : 'none'}`,
    `validation: ${s.validation ? s.validation + v(s.validation) : 'none'}`,
  ];
  if (s.ui === 'shadcn') lines.push(`installed components: ${[...s.components].sort().join(', ') || 'none'}`);
  for (const name of ['@internationalized/date', 'react-day-picker', 'date-fns']) {
    if (s.versions[name]) lines.push(`dates: ${name}${v(name)}`);
  }
  const tools = [];
  if (s.vendorTools.shadcnCli) tools.push('shadcn CLI (npx shadcn@latest info, npx shadcn@latest docs <component>)');
  if (s.vendorTools.herouiMcpInProject) tools.push('HeroUI MCP configured in the project');
  lines.push(`vendor tools: ${tools.join('; ') || 'none found in the project'}`);
  return `${lines.join('\n')}\n`;
}

export function serializeStack(s) {
  return { ...s, components: [...s.components].sort() };
}
