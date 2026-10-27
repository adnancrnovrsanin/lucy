import { attr, has, str, descendants, inLibraryDir, isFormFile, importsFrom } from '../../lib/helpers.mjs';

const KEY_ROLES = new Set(['button', 'checkbox', 'radio', 'switch', 'option', 'tab', 'menuitem', 'link']);
const PLAIN_TAGS = new Set(['div', 'span', 'li', 'p', 'img', 'svg', 'section']);
const DND = /^(@dnd-kit\/|react-beautiful-dnd|@hello-pangea\/dnd|react-dnd|sortablejs|react-sortablejs)/;
const classOf = (el) => attr(el, 'className', 'class')?.value ?? '';
const TRIGGERS = new Set(['TooltipTrigger', 'Tooltip.Trigger']);

export default [
  {
    id: 'positive-tabindex',
    severity: 'warning',
    platform: 'web',
    why: 'A positive tabIndex reorders keyboard focus away from the visual order.',
    fix: 'Use tabIndex 0 or -1 and fix the order in the markup.',
    ref: 'WCAG 2.2 2.4.3 Focus Order',
    check: ({ source }) => source.elements
      .filter((el) => /^[1-9]\d*$/.test((attr(el, 'tabIndex', 'tabindex')?.value ?? '').trim()))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <div tabIndex={-1} />;' }],
    bad: [{ code: 'const a = <Input tabIndex={2} />;' }],
  },
  {
    id: 'div-onclick',
    severity: 'warning',
    platform: 'web',
    why: 'A div or span is clickable in a form, so keyboard and screen reader users cannot reach it.',
    fix: 'Use a button (type="button"), or the library choice component (RadioGroup, ToggleGroup, choice card).',
    ref: 'WCAG 2.2 2.1.1 Keyboard',
    check: ({ source }) => (isFormFile(source)
      ? source.elements.filter((el) => (el.tag === 'div' || el.tag === 'span') && has(el, 'onClick') && !has(el, 'role')).map((el) => ({ line: el.line }))
      : []),
    good: [{ code: 'const a = <form><Button type="button" onClick={choose}>Basic plan</Button></form>;' }],
    bad: [{ code: 'const a = <form><div onClick={choose}>Basic plan</div></form>;' }],
  },
  {
    id: 'role-without-keys',
    severity: 'warning',
    platform: 'web',
    why: 'An element has an interactive role but no keyboard handler.',
    fix: 'Use the native element (button, input) or the library component; if the role stays, add tabIndex and Enter and Space handling.',
    ref: 'WCAG 2.2 2.1.1 Keyboard',
    check: ({ source }) => source.elements
      .filter((el) => PLAIN_TAGS.has(el.tag) && KEY_ROLES.has(str(el, 'role') ?? '') && !has(el, 'onKeyDown', 'onKeyUp', 'onKeyPress'))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <div role="button" tabIndex={0} onClick={go} onKeyDown={onKey}>Go</div>;' }],
    bad: [{ code: 'const a = <div role="button" onClick={go}>Go</div>;' }],
  },
  {
    id: 'outline-none-no-focus-visible',
    severity: 'warning',
    platform: 'web',
    why: 'The focus outline is removed with no visible replacement.',
    fix: 'Add a focus-visible style (for example focus-visible:ring-2) wherever outline-none is set.',
    ref: 'WCAG 2.2 2.4.7 Focus Visible',
    check: ({ source, path }) => (inLibraryDir(path) ? [] : source.elements
      .filter((el) => /\boutline-(none|0)\b/.test(classOf(el)) && !/focus-visible:|focus:ring|focus:outline|focus-within:/.test(classOf(el)))
      .map((el) => ({ line: el.line }))),
    good: [{ code: 'const a = <button className="outline-none focus-visible:ring-2 rounded">Go</button>;' }],
    bad: [{ code: 'const a = <button className="outline-none rounded">Go</button>;' }],
  },
  {
    id: 'tooltip-on-disabled',
    severity: 'warning',
    platform: 'web',
    why: 'A tooltip explains a disabled control, but a natively disabled control never shows it.',
    fix: 'Use aria-disabled="true" with the click ignored in the handler, and put the reason in visible text near the control.',
    ref: 'better-accessibility semantics and aria',
    check: ({ source }) => source.elements
      .filter((el) => (TRIGGERS.has(el.tag) || (el.tag === 'Tooltip' && !descendants(el).some((d) => TRIGGERS.has(d.tag))))
        && descendants(el).some((d) => has(d, 'disabled', 'isDisabled')))
      .map((el) => ({ line: el.line })),
    good: [{ code: 'const a = <Tooltip><TooltipTrigger asChild><Button aria-disabled="true">Save</Button></TooltipTrigger><TooltipContent>Fill in the form first</TooltipContent></Tooltip>;' }],
    bad: [
      { code: 'const a = <Tooltip><TooltipTrigger asChild><Button disabled>Save</Button></TooltipTrigger><TooltipContent>Fill in the form first</TooltipContent></Tooltip>;' },
      { code: 'const a = <Tooltip><Tooltip.Trigger><Button isDisabled>Save</Button></Tooltip.Trigger><Tooltip.Content>Fill in the form first</Tooltip.Content></Tooltip>;' },
    ],
  },
  {
    id: 'drag-without-alternative',
    severity: 'warning',
    platform: 'all',
    why: 'Field-array rows can be reordered only by dragging.',
    fix: 'Add move up and move down buttons that call the field array\'s move.',
    ref: 'WCAG 2.2 2.5.7 Dragging Movements',
    check: ({ source }) => {
      const dnd = importsFrom(source, DND);
      if (!dnd.length || !/\buseFieldArray\s*\(|\.Field\b/.test(source.masked) || /\b(move|swap)\s*\(/.test(source.masked)) return [];
      return [{ line: dnd[0].line, message: `drag and drop from ${dnd[0].from} with no move or swap` }];
    },
    good: [{ code: 'import { DndContext } from "@dnd-kit/core";\nconst { fields, move } = useFieldArray({ name: "steps" });\nconst up = (i) => move(i, i - 1);' }],
    bad: [{ code: 'import { DndContext } from "@dnd-kit/core";\nconst { fields } = useFieldArray({ name: "steps" });' }],
  },
  {
    id: 'sticky-submit-no-scroll-padding',
    severity: 'info',
    platform: 'web',
    why: 'A sticky bottom bar can hide the field that has focus.',
    fix: 'Add scroll padding at least as tall as the bar (for example scroll-pb-24 on the scroller).',
    ref: 'better-accessibility focus and keyboard; marketingskills cro form reference',
    check: ({ source }) => {
      if (!isFormFile(source) || /scroll-padding|scroll-pb-|scrollPaddingBottom|scroll-py-|scroll-p-/.test(source.text)) return [];
      return source.elements.filter((el) => /\b(sticky|fixed)\b/.test(classOf(el)) && /\bbottom-0\b/.test(classOf(el))).map((el) => ({ line: el.line }));
    },
    good: [{ code: 'const a = <form className="scroll-pb-24"><div className="sticky bottom-0 border-t p-4"><Button type="submit">Save</Button></div></form>;' }],
    bad: [{ code: 'const a = <form><div className="sticky bottom-0 border-t p-4"><Button type="submit">Save</Button></div></form>;' }],
  },
];
