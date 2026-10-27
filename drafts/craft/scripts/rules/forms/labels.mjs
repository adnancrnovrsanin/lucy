import { has, str, attr, inputType, hasAccessibleName, descendants, inLibraryDir, LABEL_TAGS, TEXT_CONTROL_TAGS } from '../../lib/helpers.mjs';

const NAMELESS_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const RAW = new Set(['input', 'select', 'textarea']);

export default [
  {
    id: 'placeholder-as-label',
    severity: 'error',
    platform: 'all',
    why: 'A control relies on its placeholder as its label; the placeholder disappears on input and is not a reliable accessible name.',
    fix: 'Give the control a visible label (FieldLabel, Label, or label htmlFor) and use the hint for examples.',
    ref: 'WCAG 2.2 3.3.2 Labels or Instructions; GOV.UK Design System, text input',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => TEXT_CONTROL_TAGS.has(el.tag) && has(el, 'placeholder') && !NAMELESS_TYPES.has(inputType(el)) && !hasAccessibleName(el, source))
      .map((el) => ({ line: el.line, message: `<${el.tag}> labelled only by its placeholder` }))),
    good: [
      { code: 'const a = <><Label htmlFor="email">Email</Label><Input id="email" placeholder="name@example.com" /></>;' },
      { code: 'const a = <Input aria-label="Search orders" placeholder="Order number" />;' },
    ],
    bad: [
      { code: 'const a = <Input placeholder="Email" name="email" />;' },
      { code: 'const a = <TextInput placeholder="Your name" value={name} onChangeText={setName} />;' },
    ],
  },
  {
    id: 'unlabeled-control',
    severity: 'error',
    platform: 'web',
    why: 'A form control has no accessible name.',
    fix: 'Associate a label (label htmlFor, FieldLabel, or a wrapping label) or add aria-label when no visible label fits.',
    ref: 'WCAG 2.2 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => RAW.has(el.tag) && !NAMELESS_TYPES.has(inputType(el)) && !has(el, 'placeholder') && !hasAccessibleName(el, source))
      .map((el) => ({ line: el.line, message: `<${el.tag}> has no accessible name` }))),
    good: [
      { code: 'export const Textarea = (props) => <textarea data-slot="textarea" {...props} />;', file: 'components/ui/textarea.tsx' },
      { code: 'const a = <label><input type="checkbox" name="agree" /> I agree</label>;' },
      { code: 'const a = <><label htmlFor="q">Search</label><input id="q" name="q" /></>;' },
    ],
    bad: [
      { code: 'const a = <input type="checkbox" name="agree" />;' },
      { code: 'const a = <select name="size"><option>S</option></select>;' },
    ],
  },
  {
    id: 'orphan-label',
    severity: 'warning',
    platform: 'web',
    why: 'A label points at an id that no element in the file has, or a label has no control.',
    fix: 'Give the control the id the label names, or wrap the control in the label.',
    ref: 'WCAG 2.2 1.3.1 Info and Relationships',
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        if (!LABEL_TAGS.has(el.tag)) continue;
        const target = attr(el, 'htmlFor', 'for');
        if (target) {
          if (target.kind === 'string' && !source.ids.has(target.value)) out.push({ line: el.line, message: `label for "${target.value}" has no element with that id` });
          continue;
        }
        if (el.tag === 'label' && !descendants(el).some((d) => RAW.has(d.tag) || /^[A-Z]/.test(d.tag))) {
          out.push({ line: el.line, message: 'label has no associated control' });
        }
      }
      return out;
    },
    good: [{ code: 'const a = <><label htmlFor="email">Email</label><input id="email" /></>;' }],
    bad: [
      { code: 'const a = <><label htmlFor="email">Email</label><input id="mail" /></>;' },
      { code: 'const a = <><label>Email</label><input name="email" /></>;' },
    ],
  },
  {
    id: 'aria-ref-missing-id',
    severity: 'warning',
    platform: 'web',
    why: 'aria-describedby or aria-labelledby names an id that no element in the file has.',
    fix: 'Give the description or label element that id, or point the reference at the element that exists.',
    ref: 'WCAG 2.2 1.3.1 Info and Relationships',
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        for (const name of ['aria-describedby', 'aria-labelledby']) {
          const value = str(el, name);
          if (!value) continue;
          for (const id of value.split(/\s+/).filter(Boolean)) {
            if (!source.ids.has(id)) out.push({ line: el.line, message: `${name} "${id}" has no matching element` });
          }
        }
      }
      return out;
    },
    good: [{ code: 'const a = <><Input id="email" aria-describedby="email-hint" /><p id="email-hint">We send the receipt here</p></>;' }],
    bad: [{ code: 'const a = <><Input id="email" aria-describedby="email-hint email-error" /><p id="email-hint">Hint</p></>;' }],
  },
  {
    id: 'label-not-in-name',
    severity: 'warning',
    platform: 'all',
    why: 'An aria-label does not contain the visible text, so voice users cannot say what they see.',
    fix: 'Start the aria-label with the visible text, or drop the aria-label and let the text name the control.',
    ref: 'WCAG 2.2 2.5.3 Label in Name',
    check: ({ source }) => source.elements
      .filter((el) => {
        const label = str(el, 'aria-label');
        const text = el.text.replace(/\s+/g, ' ').trim();
        return label && /\w/.test(text) && !label.toLowerCase().includes(text.toLowerCase());
      })
      .map((el) => ({ line: el.line, message: `aria-label "${str(el, 'aria-label')}" does not contain "${el.text.trim()}"` })),
    good: [{ code: 'const a = <Button aria-label="Close dialog">Close</Button>;' }],
    bad: [{ code: 'const a = <button aria-label="Dismiss">Close</button>;' }],
  },
  {
    id: 'required-marker-announced',
    severity: 'info',
    platform: 'web',
    why: 'A required marker is read aloud as "star", or "required" is announced twice.',
    fix: 'Hide the asterisk with aria-hidden and let required or isRequired announce it; prefer "(optional)" on the minority of fields.',
    ref: 'GOV.UK Design System, question pages; better-accessibility forms',
    check: ({ source }) => {
      const out = source.elements
        .filter((el) => LABEL_TAGS.has(el.tag) && el.text.includes('*'))
        .map((el) => ({ line: el.line, message: 'asterisk in a label without aria-hidden' }));
      const announcesRequired = source.elements.some((el) => has(el, 'required', 'isRequired', 'aria-required'));
      if (announcesRequired) {
        for (const el of source.elements) {
          if (/\bsr-only\b/.test(str(el, 'className') ?? '') && /required/i.test(el.text)) out.push({ line: el.line, message: 'hidden "(required)" next to a required control' });
        }
      }
      return out;
    },
    good: [{ code: 'const a = <><Label htmlFor="email">Email <span aria-hidden="true">*</span></Label><Input id="email" required /></>;' }],
    bad: [
      { code: 'const a = <><Label htmlFor="email">Email *</Label><Input id="email" required /></>;' },
      { code: 'const a = <><Label htmlFor="email">Email <span className="sr-only">(required)</span></Label><Input id="email" required /></>;' },
    ],
  },
  {
    id: 'manual-aria-in-library-field',
    severity: 'warning',
    platform: 'web',
    when: (s) => s.components.has('form'),
    why: 'ARIA attributes are set by hand on a FormControl child, overriding what the legacy shadcn form component wires.',
    fix: 'Remove the hand-written aria-describedby and aria-invalid; FormControl sets them. Better, move the form to Field and FieldError.',
    ref: 'shadcn/ui form component (legacy Form API)',
    check: ({ source }) => source.elements
      .filter((el) => el.parent?.tag === 'FormControl' && has(el, 'aria-describedby', 'aria-invalid'))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <FormControl><Input {...field} /></FormControl>;', stack: { components: ['form', 'input'] } }],
    bad: [{ code: 'const a = <FormControl><Input aria-invalid={!!error} {...field} /></FormControl>;', stack: { components: ['form', 'input'] } }],
  },
];
