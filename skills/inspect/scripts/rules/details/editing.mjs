import { ancestors, descendants, classOf, expr, str, innerSource, isSubmitButton, isDetailsFile } from '../../lib/helpers.mjs';

// Editing on a details page: one save button per page, never disabled for being pristine or invalid.

const BUTTON = /^(?:button|Button|[\w.]*Button)$/;
const SAVE_TAG = /^(?:SaveButton|[\w.]*SaveButton)$/;
const SAVE_TEXT = /^\s*save\b/i;
const I18N_KEY = /\b(?:t|translate|i18n\.t|formatMessage)\s*\(\s*['"`]([\w.:-]+)['"`]|\bi18nKey\s*=\s*['"]([\w.:-]+)['"]/g;
// Submit buttons whose label names another action are not saves of the record.
const OTHER_ACTION = /^\s*(?:add|send|post|search|create|creating|comment|reply|upload|invite|delete|remove|archive|confirm|continue|next|back|cancel|log|login|sign|register|join|skip|finish|start|apply|filter|go|subscribe|copy|generate|run|import|export|share|attach|assign|approve|reject|mark|pay|refund|capture|ship|fulfil+|verify|resend|request|retry|test|connect|install|enable|disable)\b/i;
const MODAL = /^(?:[\w.]*(?:Dialog|Modal|Drawer|Sheet)[\w.]*)$/;
const POPOVER = /^(?:[\w.]*Popover[\w.]*)$/;
const RESPONSIVE_HIDE = /\b(?:sm|md|lg|xl|2xl):hidden\b|\bhidden\s+(?:[\w:-]+\s+)*(?:sm|md|lg|xl|2xl):(?:flex|block|inline-flex|inline-block|grid)\b/;
const PRISTINE = /\b(?:isDirty|dirty|isValid|valid|canSave|canSubmit|pristine|isPristine|hasChanges|hasChanged|changed|isChanged|modified|isModified|dirtyFields|unchanged|noChanges)\b/;
const FORMS_VALIDITY = /\b(?:isValid|isDirty|canSubmit|isInvalid)\b/; // forms rule disabled-until-valid reports these on submit buttons

// The button's words: its text, a string label prop, the last segment of its i18n keys
// (t("common.save") reads as "save"), or the strings in its label expression.
function wordsOf(source, el) {
  const text = [el.text, ...descendants(el).map((d) => d.text)].join(' ').replace(/\s+/g, ' ').trim();
  if (text) return [text];
  const own = str(el, 'label', 'text', 'children');
  if (own) return [own];
  const code = `${innerSource(source, el)} ${expr(el, 'label') ?? ''}`;
  const keys = [...code.matchAll(I18N_KEY)].map((k) => (k[1] ?? k[2]).split(/[.:]/).pop().replace(/[_-]+/g, ' '));
  // label={isSubmitting ? "Saving" : "Save changes"}: the string literals of the label expression.
  const literals = [...(expr(el, 'label') ?? '').matchAll(/(['"`])([^'"`$]+)\1/g)].map((x) => x[2]);
  return [...keys, ...literals];
}

function isSave(source, el) {
  if (SAVE_TAG.test(el.tag)) return true;
  if (!BUTTON.test(el.tag)) return false;
  const words = wordsOf(source, el);
  if (words.some((w) => SAVE_TEXT.test(w))) return true;
  // An explicit submit button counts unless its words name another action; an implicit one only when it says Save.
  return str(el, 'type') === 'submit' && !words.some((w) => OTHER_ACTION.test(w));
}

const within = (el, test) => [el, ...ancestors(el)].some((a) => test(a));
const formOf = (el) => ancestors(el).find((a) => a.tag === 'form' || /^(?:Form|\w+Form)$/.test(a.tag) && a.tag !== 'Form') ?? ancestors(el).find((a) => a.tag === 'Form') ?? null;
const popoverOf = (el) => ancestors(el).find((a) => POPOVER.test(a.tag)) ?? null;

// Two buttons in different arms of one ternary render one at a time: between them the code
// climbs out of the first arm and meets the ternary ":" at the lowest bracket depth.
function alternatives(source, a, b) {
  const m = source.masked;
  let depth = 0;
  let min = 0;
  let colonAtMin = false;
  for (let i = a.close; i < b.start; i++) {
    const c = m[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      depth--;
      if (depth < min) { min = depth; colonAtMin = false; }
    } else if (c === ':' && depth === min && m[i - 1] !== ':' && m[i + 1] !== ':') colonAtMin = true;
  }
  return colonAtMin;
}

// The expression container that renders `el` conditionally ({cond && ...} or {cond ? ... : ...}),
// as the index of its "{", or -1 when nothing between the element and the enclosing statement is a condition.
function conditionalContainer(source, el) {
  const m = source.masked;
  let depth = 0;
  let sawCondition = false;
  for (let i = el.start - 1; i >= 0; i--) {
    const c = m[i];
    if (c === ')' || c === ']' || c === '}') depth++;
    else if (c === '(' || c === '[' || c === '{') {
      if (depth > 0) { depth--; continue; }
      if (c === '{') return sawCondition ? i : -1;
    } else if (depth === 0 && c === ';') return -1;
    else if (depth === 0 && ((c === '&' && m[i - 1] === '&') || (c === '|' && m[i - 1] === '|') || (c === '?' && m[i + 1] !== '.') || c === ':')) sawCondition = true;
  }
  return -1;
}

// Two conditionally rendered buttons under different conditions may never show together.
const separatelyConditional = (source, a, b) => {
  const ca = conditionalContainer(source, a);
  const cb = conditionalContainer(source, b);
  return ca >= 0 && cb >= 0 && ca !== cb;
};

const disabledExpr = (el) => [expr(el, 'disabled'), expr(el, 'isDisabled'), expr(el, 'aria-disabled')].filter(Boolean).join(' ');

export default [
  {
    id: 'multiple-save-buttons',
    severity: 'warning',
    platform: 'web',
    why: 'The page has more than one save button for the record, so users cannot tell which edits each one commits.',
    fix: 'Keep one save button per page; commit single-property pickers on select with undo, and move larger edits to one section editor or an edit route.',
    ref: 'Primer, saving patterns',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const saves = source.elements
        .filter((el) => isSave(source, el) && !within(el, (a) => MODAL.test(a.tag)) && !within(el, (a) => RESPONSIVE_HIDE.test(classOf(a))));
      const out = [];
      const report = (el, why) => { if (!out.some((o) => o.line === el.line)) out.push({ line: el.line, message: why }); };
      for (let i = 0; i < saves.length; i++) {
        for (let j = i + 1; j < saves.length; j++) {
          const [a, b] = [saves[i], saves[j]];
          if (alternatives(source, a, b) || separatelyConditional(source, a, b)) continue;
          if (formOf(a) === formOf(b)) report(b, `second save button for the same ${formOf(a) ? 'form' : 'page'} (first on line ${a.line})`);
          else if (popoverOf(a) !== popoverOf(b)) report(b, `inline editor save beside the page save (line ${a.line})`);
        }
      }
      return out;
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return (<form onSubmit={onSubmit}>',
          '    <h1>{order.number}</h1>',
          '    <Field><FieldLabel htmlFor="note">Note</FieldLabel><Textarea id="note" /></Field>',
          '    <Button variant="outline" onClick={reset}>Cancel</Button>',
          '    <Button type="submit">Save order</Button>',
          '  </form>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/invoices/[id]/page.tsx',
        code: [
          'export default function InvoicePage({ params }) {',
          '  const { data: invoice } = useSuspenseQuery(invoiceQuery(params.id));',
          '  return (<>',
          '    <form onSubmit={save}><Button type="submit">Save invoice</Button></form>',
          '    <AlertDialog><AlertDialogContent><AlertDialogAction>Delete invoice</AlertDialogAction></AlertDialogContent></AlertDialog>',
          '    <Dialog><DialogContent><form onSubmit={saveAddress}><Button type="submit">Save address</Button></form></DialogContent></Dialog>',
          '    <form onSubmit={addNote}><Button type="submit">Add note</Button></form>',
          '  </>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/customers/$customerId.tsx',
        code: [
          'function CustomerPage() {',
          '  const { customerId } = Route.useParams();',
          '  const { data } = useSuspenseQuery(customerQuery(customerId));',
          '  return (<form onSubmit={onSubmit}>',
          '    <h1>{data.name}</h1>',
          '    {mutation.isPending ? <Button type="submit" aria-disabled="true"><Spinner /> Save</Button> : <Button type="submit">Save</Button>}',
          '  </form>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/stores/store-details.tsx',
        code: [
          'export const StoreDetails = ({ action }) => (<form onSubmit={onSubmit}>',
          '  {action === "create" && (<><ListButton>Cancel</ListButton><SaveButton>Save</SaveButton></>)}',
          '  {action === "edit" && (isLocked ? <Button onClick={unlock}>Edit</Button> : (<><Button onClick={lock}>Cancel</Button><SaveButton>Save</SaveButton></>))}',
          '</form>);',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return (<form onSubmit={onSubmit}>',
          '    <header><h1>{order.number}</h1><Button type="submit">Save</Button></header>',
          '    <OrderFields />',
          '    <footer><Button type="submit">Save changes</Button></footer>',
          '  </form>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/contacts/[id]/page.tsx',
        code: [
          'export default function ContactPage({ params }) {',
          '  const { data: contact } = useSuspenseQuery(contactQuery(params.id));',
          '  return (<div>',
          '    <Popover><PopoverTrigger>Edit email</PopoverTrigger><PopoverContent><Input defaultValue={contact.email} /><Button onClick={saveEmail}>Save</Button></PopoverContent></Popover>',
          '    <form onSubmit={saveContact}><Button type="submit">Save contact</Button></form>',
          '  </div>);',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'save-button-disabled-when-pristine',
    severity: 'warning',
    platform: 'web',
    why: 'Save is disabled until something changes or validates, so users get no feedback on why it does nothing.',
    fix: 'Keep save enabled: with no changes, saving is a no-op that says so; with invalid input, show the errors. Disable only while the request runs.',
    ref: 'Primer, saving patterns (never disable the save button)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      return source.elements
        .filter((el) => isSave(source, el) && PRISTINE.test(disabledExpr(el)) && !(isSubmitButton(el) && FORMS_VALIDITY.test(disabledExpr(el))))
        .map((el) => ({ line: el.line, message: `save disabled by "${disabledExpr(el)}"` }));
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return (<form onSubmit={onSubmit}><h1>{order.number}</h1>',
          '    <Button type="submit" disabled={form.formState.isSubmitting}>Save order</Button>',
          '  </form>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return (<div><h1>{order.number}</h1>',
          '    <Button variant="ghost" onClick={() => form.reset()} disabled={!form.formState.isDirty}>Discard changes</Button>',
          '    <Button onClick={save} isPending={mutation.isPending}>Save order</Button>',
          '  </div>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/customers/$customerId.tsx',
        code: [
          'function CustomerPage() {',
          '  const { customerId } = Route.useParams();',
          '  const { data } = useSuspenseQuery(customerQuery(customerId));',
          '  return <Button onClick={save} aria-disabled={mutation.isPending}>Save {data.name}</Button>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return <Button onClick={save} disabled={!hasChanges}>Save</Button>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return <form onSubmit={onSubmit}><Button type="submit" disabled={!canSave || mutation.isPending}>Save order</Button></form>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useSuspenseQuery(orderQuery(params.id));',
          '  return <Button onClick={form.handleSubmit(save)} disabled={!form.formState.isDirty} label={isSubmitting ? "Saving" : "Save changes"} />;',
          '}',
        ].join('\n'),
      },
    ],
  },
];
