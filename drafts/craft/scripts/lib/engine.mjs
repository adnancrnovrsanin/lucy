// Applies rules to one file and checks rules against their own examples.

import { readSource, ReadError } from './jsx.mjs';
import { fixtureStack } from './fixture-stack.mjs';

const SEVERITIES = new Set(['error', 'warning', 'info']);
const PLATFORMS = new Set(['web', 'native', 'all']);

export function suppressionsOf(source) {
  const out = [];
  for (const comment of source.comments) {
    const m = /craft-scan-ignore\s+([a-z0-9-]+)\s*(?::\s*([\s\S]*))?$/.exec(comment.text.trim());
    if (m) out.push({ rule: m[1], reason: (m[2] ?? '').trim(), line: comment.line, endLine: comment.endLine });
  }
  return out;
}

export function scanSource({ path, text, stack, rules }) {
  let source;
  try {
    source = readSource(text, { jsx: !/\.ts$/.test(path) });
  } catch (error) {
    if (error instanceof ReadError) return { path, unreadable: error.message, findings: [], suppressed: [] };
    throw error;
  }
  const suppressions = suppressionsOf(source);
  const findings = [];
  const suppressed = [];
  for (const rule of rules) {
    if (rule.platform !== 'all' && rule.platform !== stack.platform) continue;
    if (rule.when && !rule.when(stack)) continue;
    for (const hit of rule.check({ source, stack, path })) {
      const line = hit.line ?? source.lineOf(hit.index ?? 0);
      const finding = { rule: rule.id, severity: rule.severity, path, line, message: hit.message ?? rule.why, fix: rule.fix, ref: rule.ref };
      const match = suppressions.find((s) => s.rule === rule.id && s.reason && (s.endLine === line || s.endLine === line - 1));
      if (match) suppressed.push({ ...finding, reason: match.reason });
      else findings.push(finding);
    }
  }
  for (const s of suppressions) {
    if (!s.reason) {
      findings.push({
        rule: 'suppression-without-reason', severity: 'error', path, line: s.line,
        message: `craft-scan-ignore ${s.rule} has no reason`,
        fix: 'Write the reason after a colon: craft-scan-ignore <rule-id>: <reason>.',
        ref: 'craft forms playbook, prove step',
      });
    }
  }
  return { path, findings, suppressed };
}

export function validateRule(rule) {
  const problems = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rule.id ?? '')) problems.push('id must be kebab-case');
  if (!SEVERITIES.has(rule.severity)) problems.push('severity must be error, warning, or info');
  if (!PLATFORMS.has(rule.platform)) problems.push('platform must be web, native, or all');
  for (const key of ['why', 'fix', 'ref']) {
    if (typeof rule[key] !== 'string' || rule[key].length === 0) problems.push(`${key} must be a non-empty string`);
  }
  if (typeof rule.check !== 'function') problems.push('check must be a function');
  if (rule.when !== undefined && typeof rule.when !== 'function') problems.push('when must be a function');
  for (const key of ['good', 'bad']) {
    const list = rule[key];
    if (!Array.isArray(list) || list.length === 0 || list.some((x) => typeof x?.code !== 'string')) {
      problems.push(`${key} must list at least one { code } example`);
    }
  }
  return problems;
}

export function runExample(rule, example) {
  return scanSource({ path: example.file ?? 'fixture.tsx', text: example.code, stack: fixtureStack(rule.platform, example.stack), rules: [rule] });
}

export function selfTest(rules) {
  const failures = [];
  const seen = new Set();
  for (const rule of rules) {
    if (seen.has(rule.id)) failures.push({ rule: rule.id, problem: 'duplicate id' });
    seen.add(rule.id);
    const problems = validateRule(rule);
    for (const problem of problems) failures.push({ rule: rule.id, problem });
    if (problems.length) continue;
    for (const example of rule.bad) {
      const result = runExample(rule, example);
      if (result.unreadable) failures.push({ rule: rule.id, problem: `bad example is unreadable: ${result.unreadable}`, code: example.code });
      else if (!result.findings.some((f) => f.rule === rule.id)) failures.push({ rule: rule.id, problem: 'bad example did not trigger', code: example.code });
    }
    for (const example of rule.good) {
      const result = runExample(rule, example);
      if (result.unreadable) failures.push({ rule: rule.id, problem: `good example is unreadable: ${result.unreadable}`, code: example.code });
      else if (result.findings.some((f) => f.rule === rule.id)) failures.push({ rule: rule.id, problem: 'good example triggered', code: example.code });
    }
  }
  return failures;
}
