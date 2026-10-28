// Detects a project's UI stack from its package.json, shadcn's components.json, and its
// MCP configuration. One function, one answer per package root.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const FORM_LIBS = ['react-hook-form', '@tanstack/react-form', 'formik', '@conform-to/react'];
const VALIDATION_LIBS = ['zod', 'valibot', 'yup', 'arktype', 'joi'];
// Table engines in precedence order: a wrapper or grid wins over the headless engine it may sit beside.
const TABLE_ENGINES = [
  ['ag-grid', ['ag-grid-react', 'ag-grid-community', 'ag-grid-enterprise']],
  ['mui-x', ['@mui/x-data-grid', '@mui/x-data-grid-pro', '@mui/x-data-grid-premium']],
  ['mrt', ['material-react-table', 'mantine-react-table']],
  ['react-data-grid', ['react-data-grid']],
  ['tanstack', ['@tanstack/react-table']],
];
const DATA_LAYERS = ['@tanstack/react-query', 'swr'];
const URL_STATE_LIBS = ['nuqs'];
const VIRTUALIZERS = ['@tanstack/react-virtual', 'react-virtuoso', 'react-window'];
// Routers in precedence order: a framework router wins over a library router it may sit beside.
const ROUTERS = [
  ['expo-router', 'expo-router'],
  ['next', 'next'],
  ['tanstack-router', '@tanstack/react-router'],
  ['react-router', 'react-router'],
  ['react-router', 'react-router-dom'],
];
const NOTED = [
  '@heroui/react', '@heroui-pro/react', 'heroui-native', 'heroui-native-pro', 'react-native', 'expo',
  'radix-ui', '@base-ui/react', 'react-aria-components', '@react-stately/data', 'react-day-picker', 'date-fns',
  '@internationalized/date', '@hookform/resolvers', ...FORM_LIBS, ...VALIDATION_LIBS,
  ...TABLE_ENGINES.flatMap(([, pkgs]) => pkgs), ...DATA_LAYERS, ...URL_STATE_LIBS, ...VIRTUALIZERS,
  ...ROUTERS.map(([, pkg]) => pkg),
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

// The installed major and minor of a package: node_modules first, walking up for hoisted
// installs, then the first version in the declared range. Nulls when neither gives one;
// a range with only a major ("^5") gives a null minor.
export function installedVersion(root, name, range) {
  for (let dir = root; ; dir = dirname(dir)) {
    const version = readJson(join(dir, 'node_modules', name, 'package.json'))?.version;
    const m = typeof version === 'string' ? /^(\d+)\.(\d+)/.exec(version) : null;
    if (m) return { major: Number(m[1]), minor: Number(m[2]) };
    if (dirname(dir) === dir) break;
  }
  const m = /(\d+)(?:\.(\d+))?/.exec(typeof range === 'string' && !range.startsWith('workspace:') ? range : '');
  return m ? { major: Number(m[1]), minor: m[2] === undefined ? null : Number(m[2]) } : { major: null, minor: null };
}

export function installedMajor(root, name, range) {
  return installedVersion(root, name, range).major;
}

function routerOf(root, has, deps) {
  for (const [router, pkg] of ROUTERS) {
    if (has(pkg)) {
      const v = installedVersion(root, pkg, deps[pkg]);
      return { router, pkg, major: v.major, minor: v.minor };
    }
  }
  return { router: null, pkg: null, major: null, minor: null };
}

function tableEngineOf(root, has, deps, ui) {
  for (const [engine, pkgs] of TABLE_ENGINES) {
    const pkg = pkgs.find(has);
    if (pkg) return { engine, pkg, major: installedMajor(root, pkg, deps[pkg]) };
  }
  if (ui === 'heroui') return { engine: 'heroui', pkg: '@heroui/react', major: installedMajor(root, '@heroui/react', deps['@heroui/react']) };
  if (has('react-aria-components')) return { engine: 'react-aria', pkg: 'react-aria-components', major: installedMajor(root, 'react-aria-components', deps['react-aria-components']) };
  return { engine: null, pkg: null, major: null };
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

  const table = tableEngineOf(root, has, deps, ui);
  const router = routerOf(root, has, deps);
  const query = has('@tanstack/react-query') ? installedVersion(root, '@tanstack/react-query', deps['@tanstack/react-query']) : { major: null, minor: null };

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
    tableEngine: table.engine,
    tableEnginePackage: table.pkg,
    tableEngineMajor: table.major,
    agGridEdition: table.engine === 'ag-grid' ? (has('ag-grid-enterprise') ? 'enterprise' : 'community') : null,
    dataLayer: DATA_LAYERS.find(has) ?? null,
    urlState: URL_STATE_LIBS.find(has) ?? null,
    virtualizer: VIRTUALIZERS.find(has) ?? null,
    router: router.router,
    routerPackage: router.pkg,
    routerMajor: router.major,
    routerMinor: router.minor,
    queryMajor: query.major,
    queryMinor: query.minor,
  };
}

// True when the stack's router is `name` at major.minor or later. With a minor above 0, an
// unknown minor is false: unknown stays silent. A greater major passes whatever the minor.
export function routerAtLeast(stack, name, major, minor = 0) {
  if (stack.router !== name || stack.routerMajor === null || stack.routerMajor === undefined) return false;
  if (stack.routerMajor !== major) return stack.routerMajor > major;
  if (minor === 0) return true;
  return stack.routerMinor !== null && stack.routerMinor !== undefined && stack.routerMinor >= minor;
}

// True when TanStack Query is installed at major.minor or later; false when the version is unknown.
export function queryAtLeast(stack, major, minor) {
  if (stack.queryMajor === null || stack.queryMajor === undefined) return false;
  if (stack.queryMajor !== major) return stack.queryMajor > major;
  return stack.queryMinor !== null && stack.queryMinor >= minor;
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
  lines.push(`router: ${s.router ? `${s.router}${s.routerMajor !== null ? `, major ${s.routerMajor}` : ''} (${s.routerPackage}${v(s.routerPackage)})` : 'none'}`);
  lines.push(`table engine: ${describeEngine(s)}`);
  for (const [label, name] of [['data layer', s.dataLayer], ['url state', s.urlState], ['virtualizer', s.virtualizer]]) {
    const resolved = name === '@tanstack/react-query' && s.queryMajor !== null ? `, version ${s.queryMajor}${s.queryMinor !== null ? `.${s.queryMinor}` : ''}` : '';
    lines.push(`${label}: ${name ? name + v(name) + resolved : 'none'}`);
  }
  const tools = [];
  if (s.vendorTools.shadcnCli) tools.push('shadcn CLI (npx shadcn@latest info, npx shadcn@latest docs <component>)');
  if (s.vendorTools.herouiMcpInProject) tools.push('HeroUI MCP configured in the project');
  lines.push(`vendor tools: ${tools.join('; ') || 'none found in the project'}`);
  return `${lines.join('\n')}\n`;
}

function describeEngine(s) {
  if (!s.tableEngine) return 'none';
  const parts = [s.tableEngine];
  if (s.tableEngineMajor !== null) parts.push(`major ${s.tableEngineMajor}`);
  if (s.agGridEdition) parts.push(s.agGridEdition);
  const range = s.versions[s.tableEnginePackage];
  return `${parts.join(', ')} (${s.tableEnginePackage}${range ? ` ${range}` : ''})`;
}

export function serializeStack(s) {
  return { ...s, components: [...s.components].sort() };
}
