// Resolves fix-by pointers (`<skill>/<path>.md#<heading-slug>`) against the skills directory.
// Works from drafts/inspect/tests, while craft is still under skills/, and from skills/inspect/tests.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SKILLS_DIR = [join(here, '..', '..'), join(here, '..', '..', '..', 'skills')]
  .find((dir) => existsSync(join(dir, 'craft', 'SKILL.md')));

export const slug = (heading) => heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

export function pointerProblem(pointer) {
  const m = /^([a-z-]+\/[\w./-]+\.md)#([a-z0-9-]+)$/.exec(pointer ?? '');
  if (!m) return `not a <skill>/<file>.md#<heading> pointer: ${pointer}`;
  const file = join(SKILLS_DIR, m[1]);
  if (!existsSync(file)) return `missing file: ${m[1]}`;
  const slugs = readFileSync(file, 'utf8').split('\n')
    .filter((line) => /^#{1,6} /.test(line))
    .map((line) => slug(line.replace(/^#+ /, '')));
  return slugs.includes(m[2]) ? null : `no heading "${m[2]}" in ${m[1]}`;
}
