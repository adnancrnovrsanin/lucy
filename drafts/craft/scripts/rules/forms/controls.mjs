import { inputType } from '../../lib/helpers.mjs';

const DATE_TYPES = new Set(['date', 'datetime-local', 'month', 'week', 'time']);
const DATE_INPUT_TAGS = new Set(['input', 'Input', 'InputGroupInput']);

export default [
  {
    id: 'raw-date-input',
    severity: 'error',
    platform: 'web',
    when: (s) => s.hasDatePicker,
    why: 'A native date or time input is used where the UI library has a date picker.',
    fix: 'Use the library date picker for near-term dates, and three day, month, and year inputs (shadcn) or the segmented DateField (HeroUI) for memorable dates; see forms/field-map.md. shadcn has no time field, so its time recipe keeps Input type="time".',
    ref: 'craft forms brief, failure 2',
    check: ({ source, stack }) => source.elements
      .filter((el) => DATE_INPUT_TAGS.has(el.tag) && DATE_TYPES.has(inputType(el)) && !(inputType(el) === 'time' && stack.ui === 'shadcn'))
      .map((el) => ({ line: el.line, message: `<${el.tag} type="${inputType(el)}"> where the library has a date picker` })),
    good: [
      { code: 'const a = <Calendar mode="single" selected={date} onSelect={setDate} />;' },
      { code: 'const a = <input type="date" name="due" />;', stack: { ui: null, hasDatePicker: false } },
      { code: 'const a = <Input type="time" step="1" name="startsAt" />;' },
    ],
    bad: [
      { code: 'const a = <input type="date" name="dueDate" />;' },
      { code: ['const a = (', '  <Input', '    type="datetime-local"', '    {...register("startsAt")}', '  />', ');'].join('\n') },
    ],
  },
];
