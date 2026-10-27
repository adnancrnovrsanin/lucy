import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSource } from '../scripts/lib/jsx.mjs';
import { fieldName, hasAccessibleName, catchBlocks, errorCallbacks, isSubmitButton, str, isTrue, optionsOf, isStatic } from '../scripts/lib/helpers.mjs';

test('fieldName reads name, register spreads, owning controllers, then id', () => {
  const src = readSource('const a = <><Input name="title" /><Input {...register("email")} /><Controller name="status" render={({ field }) => <Select {...field} />} /><Input id="phone" /></>;');
  const names = src.elements.filter((e) => e.tag === 'Input' || e.tag === 'Select').map(fieldName);
  assert.deepEqual(names, ['title', 'email', 'status', 'phone']);
});

test('hasAccessibleName accepts labels, aria names, and React Aria fields', () => {
  const src = readSource([
    'const a = (<>',
    '<label htmlFor="e">Email</label><input id="e" />',
    '<label><input type="checkbox" /> Agree</label>',
    '<Input aria-label="Search" />',
    '<TextField><Label>Name</Label><Input /></TextField>',
    '<Input placeholder="Nope" />',
    '</>);',
  ].join('\n'));
  const controls = src.elements.filter((e) => e.tag === 'input' || e.tag === 'Input');
  assert.deepEqual(controls.map((c) => hasAccessibleName(c, src)), [true, true, true, true, false]);
});

test('catchBlocks and errorCallbacks return block bodies', () => {
  const src = readSource('try { a(); } catch (e) { console.error(e); }\ntry {} catch { reset(); }\nuseMutation({ onError: (e) => { toast.error("x"); } });');
  assert.deepEqual(catchBlocks(src).map((b) => b.body.trim()), ['console.error(e);', 'reset();']);
  assert.equal(errorCallbacks(src).length, 1);
  assert.match(errorCallbacks(src)[0].raw, /toast\.error\("x"\)/);
});

test('isSubmitButton recognises explicit and implicit submit buttons', () => {
  const src = readSource('const a = <form><button>Go</button><button type="button">No</button><Button type="submit">Save</Button></form>;');
  const buttons = src.elements.filter((e) => e.tag === 'button' || e.tag === 'Button');
  assert.deepEqual(buttons.map(isSubmitButton), [true, false, true]);
});

test('str reads string attributes and simple quoted expressions; isTrue reads flags', () => {
  const src = readSource('const a = <Input type={"email"} required checked={true} other={x} />;');
  const el = src.elements[0];
  assert.equal(str(el, 'type'), 'email');
  assert.equal(str(el, 'other'), undefined);
  assert.equal(isTrue(el, 'required'), true);
  assert.equal(isTrue(el, 'checked'), true);
  assert.equal(isTrue(el, 'other'), false);
});

test('optionsOf counts option descendants and isStatic spots mapped lists', () => {
  const src = readSource('const a = <><Select><SelectItem value="a">A</SelectItem><SelectItem value="b">B</SelectItem></Select><Select>{items.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</Select></>;');
  const [first, second] = src.elements.filter((e) => e.tag === 'Select');
  assert.equal(optionsOf(first).length, 2);
  assert.equal(isStatic(first, src), true);
  assert.equal(isStatic(second, src), false);
});
