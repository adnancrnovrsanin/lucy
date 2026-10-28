import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SKILLS_DIR } from './pointers.mjs';

test('craft runs the stack command through the sibling inspect directory', () => {
  const skill = readFileSync(join(SKILLS_DIR, 'craft', 'SKILL.md'), 'utf8');
  assert.match(skill, /<this skill's directory>\/\.\.\/inspect\/scripts\/scan\.mjs --stack/);
  assert.ok(existsSync(join(SKILLS_DIR, 'craft', '..', 'inspect', 'scripts', 'scan.mjs')));
});

test('craft keeps no scan, tests, or checklist of its own', () => {
  for (const path of ['scripts', 'tests', 'forms/checklist.md']) {
    assert.equal(existsSync(join(SKILLS_DIR, 'craft', path)), false, `craft/${path} still exists`);
  }
});

test('craft proves through inspect', () => {
  const forms = readFileSync(join(SKILLS_DIR, 'craft', 'forms.md'), 'utf8');
  assert.match(forms, /Invoke `inspect` through the host's skill mechanism/);
  assert.doesNotMatch(forms, /craft-scan-ignore|scripts\/scan\.mjs|forms\/checklist\.md/);
});

test('craft tables proves through inspect', () => {
  const tables = readFileSync(join(SKILLS_DIR, 'craft', 'tables.md'), 'utf8');
  assert.match(tables, /Invoke `inspect` through the host's skill mechanism/);
  assert.doesNotMatch(tables, /scripts\/scan\.mjs|tables\/checklist\.md/);
  const core = readFileSync(join(SKILLS_DIR, 'craft', 'SKILL.md'), 'utf8');
  assert.match(core, /\[tables\.md\]\(tables\.md\)/);
});
