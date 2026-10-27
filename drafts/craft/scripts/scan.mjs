#!/usr/bin/env node
// The craft scan: checks changed form code against the playbooks' rule tables.

import { readFileSync, realpathSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStack, describeStack, packageRootOf, serializeStack } from './lib/stack.mjs';
import { selectFiles, UsageError } from './lib/files.mjs';
import { scanSource, selfTest } from './lib/engine.mjs';
import { summarize, formatText, formatJson, exitCode } from './lib/report.mjs';
import formsRules from './rules/forms/index.mjs';

export const RULES = [...formsRules];

const USAGE = `usage: node scan.mjs [--stack] [--base <ref>] [--all] [--json] [--self-test] [paths...]
  --stack       print the detected stack of the current project and exit
  --base <ref>  compare against this ref instead of the default branch
  --all         scan every file under the current directory
  --json        print machine-readable output
  --self-test   check every rule against its own good and bad examples
With no paths and no --all, scans the files changed since the merge base plus untracked files.
Exit 0 with no error findings, 1 with error findings, 2 on usage errors or unreadable files.
`;

export function parseArgs(argv) {
  const options = { stack: false, base: null, all: false, json: false, selfTest: false, help: false, paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--stack') options.stack = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--self-test') options.selfTest = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--base') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) throw new UsageError('--base needs a ref');
      options.base = value;
    } else if (arg.startsWith('-')) {
      throw new UsageError(`unknown option ${arg}`);
    } else {
      options.paths.push(arg);
    }
  }
  if (options.all && options.paths.length) throw new UsageError('pass either --all or paths, not both');
  return options;
}

function fail(error) {
  if (!(error instanceof UsageError)) throw error;
  process.stderr.write(`craft scan: ${error.message}\n${USAGE}`);
  return 2;
}

export function main(argv, cwd = realpathSync(process.cwd())) {
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    return fail(error);
  }
  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (options.selfTest) {
    const failures = selfTest(RULES);
    for (const f of failures) process.stdout.write(`FAIL ${f.rule}: ${f.problem}${f.code ? `\n${f.code}` : ''}\n`);
    process.stdout.write(`${RULES.length} rules, ${failures.length} failures\n`);
    return failures.length ? 1 : 0;
  }
  if (options.stack) {
    const stack = detectStack(packageRootOf(cwd));
    process.stdout.write(options.json ? `${JSON.stringify(serializeStack(stack), null, 2)}\n` : describeStack(stack));
    return 0;
  }
  let files;
  try {
    files = selectFiles({ root: cwd, paths: options.paths, all: options.all, base: options.base });
  } catch (error) {
    return fail(error);
  }
  const stacks = new Map();
  const stackFor = (file) => {
    const root = packageRootOf(file);
    if (!stacks.has(root)) stacks.set(root, detectStack(root));
    return stacks.get(root);
  };
  const results = files.map((file) => scanSource({
    path: relative(cwd, file) || file,
    text: readFileSync(file, 'utf8'),
    stack: stackFor(file),
    rules: RULES,
  }));
  const report = summarize(results, [...stacks.values()]);
  process.stdout.write(options.json ? formatJson(report) : formatText(report));
  return exitCode(report);
}

// Compare real paths: Node resolves the symlinks under ~/.claude/skills for import.meta.url
// but not for process.argv[1].
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`craft scan: internal error: ${error.stack ?? error}\n`);
    process.exitCode = 2;
  }
}
