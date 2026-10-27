import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource, ReadError } from '../scripts/lib/jsx.mjs';

test('joins attributes split across lines and records their kinds', () => {
  const src = readSource([
    'export function F() {',
    '  return (',
    '    <Input',
    '      type="date"',
    '      {...register("startsAt")}',
    '      disabled',
    '      min={min}',
    '    />',
    '  );',
    '}',
  ].join('\n'));
  const input = src.elements.find((e) => e.tag === 'Input');
  assert.equal(input.line, 3);
  assert.deepEqual(input.attrs.get('type'), { kind: 'string', value: 'date', line: 4 });
  assert.equal(input.attrs.get('disabled').kind, 'bool');
  assert.deepEqual(input.attrs.get('min'), { kind: 'expr', value: 'min', line: 7 });
  assert.deepEqual(input.spreads, ['register("startsAt")']);
  assert.equal(input.selfClosing, true);
});

test('links elements inside attribute expressions to their owner', () => {
  const src = readSource('const x = <Controller name="status" render={({ field }) => (<Select value={field.value}><SelectItem value="a">A</SelectItem></Select>)} />;');
  const select = src.elements.find((e) => e.tag === 'Select');
  assert.equal(select.parent.tag, 'Controller');
  assert.equal(select.children[0].tag, 'SelectItem');
  assert.equal(select.children[0].text, 'A');
});

test('keeps apostrophes in JSX text out of string parsing', () => {
  const src = readSource("const x = <p>Don't stop <b>now</b> it's fine</p>;\nconst y = 'ok';");
  assert.equal(src.elements[0].text, "Don't stop  it's fine");
  assert.deepEqual(src.strings.map((s) => s.value), ['ok']);
});

test('records comments with their lines and blanks them in the masked text', () => {
  const src = readSource('// inspect-ignore raw-select: legacy\nconst a = 1; /* note */');
  assert.equal(src.comments.length, 2);
  assert.equal(src.comments[0].line, 1);
  assert.match(src.comments[0].text, /inspect-ignore raw-select: legacy/);
  assert.doesNotMatch(src.masked, /legacy|note/);
});

test('reads template literals with nested JSX and records their static text', () => {
  const src = readSource('const s = `a ${cond ? <b>x</b> : "y"} c`;');
  assert.equal(src.elements[0].tag, 'b');
  assert.ok(src.strings.some((s) => s.quote === '`' && s.value === 'a ${} c'));
});

test('treats comparisons, generic arrows, and regex literals as code', () => {
  const src = readSource([
    'const f = <T,>(x: T) => x;',
    'if (a < b && /<div>/.test(s)) {}',
    'const n = items.length < 3 ? 1 : 2;',
  ].join('\n'));
  assert.equal(src.elements.length, 0);
});

test('masks strings and JSX text but keeps code', () => {
  const src = readSource('const a = "secret"; const el = <p>hidden</p>;');
  assert.doesNotMatch(src.masked, /secret|hidden/);
  assert.match(src.masked, /const a = " +";/);
  assert.equal(src.masked.length, src.text.length);
});

test('collects imports, label targets, and ids', () => {
  const src = readSource([
    'import { Input } from "@/components/ui/input";',
    'import "./styles.css";',
    'const x = (<><label htmlFor="email">Email</label><input id="email" /></>);',
  ].join('\n'));
  assert.deepEqual(src.imports.map((i) => i.from).sort(), ['./styles.css', '@/components/ui/input']);
  assert.ok(src.labelTargets.has('email'));
  assert.ok(src.ids.has('email'));
});

test('does not read JSX in .ts mode', () => {
  const src = readSource('function id<T>(x: T): T { return x; }\nconst y = <string>value;', { jsx: false });
  assert.equal(src.elements.length, 0);
});

test('raises ReadError on unbalanced input', () => {
  assert.throws(() => readSource('const x = <div><span></div>;'), ReadError);
  assert.throws(() => readSource('function f() {'), ReadError);
  assert.throws(() => readSource('const s = "open'), ReadError);
  assert.throws(() => readSource('const x = <div>;'), /unclosed <div> \(line 1\)/);
});
