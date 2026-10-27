// Turns per-file results into the scan's report, its text and JSON forms, and its exit code.

import { serializeStack } from './stack.mjs';

const ORDER = { error: 0, warning: 1, info: 2 };

export function summarize(results, stacks = []) {
  const findings = results.flatMap((r) => r.findings);
  const suppressed = results.flatMap((r) => r.suppressed ?? []);
  const unreadable = results.filter((r) => r.unreadable).map((r) => ({ path: r.path, reason: r.unreadable }));
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of findings) counts[f.severity]++;
  return { files: results.length, findings, suppressed, unreadable, counts, stacks };
}

export function exitCode(report) {
  if (report.unreadable.length) return 2;
  return report.counts.error > 0 ? 1 : 0;
}

export function formatText(report) {
  const lines = [];
  if (report.files === 0) lines.push('no files to scan');
  const groups = new Map();
  for (const f of report.findings) {
    if (!groups.has(f.rule)) groups.set(f.rule, []);
    groups.get(f.rule).push(f);
  }
  const sorted = [...groups.entries()].sort((a, b) => ORDER[a[1][0].severity] - ORDER[b[1][0].severity] || a[0].localeCompare(b[0]));
  for (const [rule, list] of sorted) {
    lines.push(`${list[0].severity} ${rule} (${list.length})`);
    for (const f of list) lines.push(`  ${f.path}:${f.line}  ${f.message}`);
    lines.push(`  fix: ${list[0].fix}`);
    lines.push(`  ref: ${list[0].ref}`);
  }
  if (report.suppressed.length) {
    lines.push('suppressed');
    for (const s of report.suppressed) lines.push(`  ${s.rule} ${s.path}:${s.line}  reason: ${s.reason}`);
  }
  if (report.unreadable.length) {
    lines.push('not scanned');
    for (const u of report.unreadable) lines.push(`  ${u.path}  ${u.reason}`);
  }
  const c = report.counts;
  const notScanned = report.unreadable.length ? `, not scanned ${report.unreadable.length}` : '';
  lines.push(`errors ${c.error}, warnings ${c.warning}, info ${c.info}, suppressed ${report.suppressed.length}, files ${report.files}${notScanned}`);
  return `${lines.join('\n')}\n`;
}

export function formatJson(report) {
  return `${JSON.stringify({ ...report, stacks: report.stacks.map(serializeStack) }, null, 2)}\n`;
}
