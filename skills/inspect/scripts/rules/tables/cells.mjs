import { has, str, attr, ancestors, classOf, innerSource, isTableFile, inCell, CELL_TAGS, HEADER_CELL_TAGS } from '../../lib/helpers.mjs';

const NUMBER_FORMAT = /Intl\.NumberFormat|\.toLocaleString\(|\bformat(?:Currency|Money|Price|Amount|Number|Percent)\s*\(|\.toFixed\(/;
const MONEY_NAME = /\b(amount|price|total|subtotal|cost|balance|fee|revenue|salary)\w*\b/i;
const RIGHT = /\btext-right\b|\btext-end\b|\bjustify-end\b|\bml-auto\b|textAlign\s*:\s*['"`](right|end)/;
const TABULAR = /\btabular-nums\b|fontVariantNumeric/;
const own = (el) => classOf(el) + ' ' + (attr(el, 'style')?.value ?? '') + ' ' + (str(el, 'align') ?? '');
const withAncestors = (el, depth = 3) => [el, ...ancestors(el).slice(0, depth)].map(own).join(' ');

export default [
  {
    id: 'numeric-cell-alignment',
    severity: 'warning',
    platform: 'web',
    why: 'A formatted number is not right-aligned with tabular figures, so digits do not line up for comparison.',
    fix: 'Right-align numeric and money cells and their headers, and give them tabular-nums.',
    ref: 'GOV.UK table, numeric cells; Primer DataTable alignment; Vercel Web Interface Guidelines',
    check: ({ source }) => source.elements
        .filter((el) => el.tag && NUMBER_FORMAT.test(innerSource(source, el)) && !el.children.some((c) => NUMBER_FORMAT.test(innerSource(source, c))))
        .filter((el) => CELL_TAGS.has(el.tag) || inCell(source, el))
        .filter((el) => { const cls = withAncestors(el); return !RIGHT.test(cls) || !TABULAR.test(cls); })
        .map((el) => ({ line: el.line, message: 'formatted number without right alignment and tabular-nums' })),
    good: [{ code: 'const a = <TableCell className="text-right tabular-nums">{formatMoney(row.amountMinor, currency)}</TableCell>;' }],
    bad: [
      { code: 'const a = <TableCell>{formatMoney(row.amountMinor, currency)}</TableCell>;' },
      { code: ['import type { ColumnDef } from "@tanstack/react-table";', 'export const columns = [{ accessorKey: "total", cell: ({ row }) => <div className="text-right">{new Intl.NumberFormat(locale).format(row.original.total)}</div> }];'].join('\n') },
    ],
  },
  {
    id: 'money-raw-or-tofixed',
    severity: 'warning',
    platform: 'all',
    why: 'A money value is shown raw, rounded with toFixed, or parsed as a float, so it loses its currency, locale, and precision.',
    fix: 'Keep money as minor units or a decimal string and show it with Intl.NumberFormat in currency style, using the app locale and the record currency.',
    ref: 'craft tables research, money kind; shadcn data table docs money example',
    check: ({ source }) => {
      if (!isTableFile(source) && !source.elements.some((e) => CELL_TAGS.has(e.tag))) return [];
      const out = [];
      for (const m of source.text.matchAll(/\bparse(?:Float|Int)\s*\(\s*row\.getValue\(|\bNumber\s*\(\s*row\.getValue\(|\.toFixed\(\s*2\s*\)/g)) out.push({ index: m.index, message: 'money parsed as a float or rounded with toFixed' });
      for (const el of source.elements) {
        if (!CELL_TAGS.has(el.tag)) continue;
        const inner = innerSource(source, el).trim();
        const m = /^\{\s*([\w$.?]+)\s*\}$/.exec(inner);
        if (m && MONEY_NAME.test(m[1].split('.').pop())) out.push({ line: el.line, message: `money rendered raw: {${m[1]}}` });
      }
      return out;
    },
    good: [{ code: 'const a = <TableCell className="text-right tabular-nums">{formatMoney(row.amountMinor, row.currency)}</TableCell>;' }],
    bad: [
      { code: 'const a = <TableCell>{row.original.amount}</TableCell>;' },
      { code: ['import type { ColumnDef } from "@tanstack/react-table";', 'const cell = ({ row }) => { const amount = parseFloat(row.getValue("amount")); return amount; };'].join('\n') },
    ],
  },
  {
    id: 'hardcoded-number-locale',
    severity: 'warning',
    platform: 'all',
    why: 'A number, money, or date formatter hardcodes a locale or currency, so the table ignores the app locale and the record currency.',
    fix: 'Take the locale from the app (its i18n setup or the user setting) and the currency from the record or the app; create formatters once per kind.',
    ref: 'craft tables research, value rules',
    check: ({ source, path }) => {
      if (!isTableFile(source) && !/format/i.test(path)) return [];
      return [...source.text.matchAll(/Intl\.(?:NumberFormat|DateTimeFormat)\s*\(\s*['"`][a-z]{2}(?:-[A-Z]{2})?['"`]|\.toLocale(?:String|DateString)\(\s*['"`][a-z]{2}(?:-[A-Z]{2})?['"`]|\bcurrency\s*:\s*['"`][A-Z]{3}['"`]/g)]
        .map((m) => ({ index: m.index, message: 'hardcoded locale or currency' }));
    },
    good: [{ code: 'export const formatMoney = (minor, currency, locale) => new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);', file: 'lib/format.ts' }],
    bad: [{ code: 'export const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);', file: 'lib/format.ts' }],
  },
  {
    id: 'placeholder-cell-glyph',
    severity: 'warning',
    platform: 'all',
    why: 'An empty value is shown as a dash, N/A, or x, which reads as data and is announced as "dash".',
    fix: 'Leave an empty cell blank, or say in words what is missing when that matters.',
    ref: 'Primer DataTable, empty cells; Adnan decision 7',
    check: ({ source }) => (isTableFile(source) || source.elements.some((e) => CELL_TAGS.has(e.tag))
      ? [...source.text.matchAll(/(\?\?|\|\||\?[^:?]{1,80}:)\s*['"`](-|—|–|N\/A|n\/a|x)['"`]/g)].map((m) => ({ index: m.index, message: 'placeholder glyph for an empty value' }))
      : []),
    good: [{ code: 'const a = <TableCell>{row.original.note ?? null}</TableCell>;' }],
    bad: [
      { code: 'const a = <TableCell>{row.original.note ?? "-"}</TableCell>;' },
      { code: 'const a = <TableCell>{row.original.note ? row.original.note : "N/A"}</TableCell>;' },
    ],
  },
  {
    id: 'centered-data-cell',
    severity: 'warning',
    platform: 'web',
    why: 'A data cell is centered, which breaks the scan line for text and the digit alignment for numbers.',
    fix: 'Left-align text and dates, right-align numbers and money; never center data cells.',
    ref: 'Polaris DataTable alignment; Primer DataTable',
    check: ({ source }) => source.elements
      .filter((el) => (CELL_TAGS.has(el.tag) || HEADER_CELL_TAGS.has(el.tag)) && !has(el, 'colSpan'))
      .filter((el) => /\btext-center\b/.test(classOf(el)) || str(el, 'align') === 'center')
      .map((el) => ({ line: el.line, message: `centered <${el.tag}>` })),
    good: [
      { code: 'const a = <TableCell className="text-right tabular-nums">{qty}</TableCell>;' },
      { code: 'const a = <TableCell colSpan={columns.length} className="h-24 text-center">No invoices match these filters.</TableCell>;' },
    ],
    bad: [{ code: 'const a = <TableCell className="text-center">{status}</TableCell>;' }],
  },
  {
    id: 'truncate-without-full-value',
    severity: 'warning',
    platform: 'web',
    why: 'Cell text is truncated with no way to read the full value by keyboard.',
    fix: 'Wrap by default; truncate only in a fixed-width column and give the full value through a tooltip on a focusable trigger, the peek, or the detail page.',
    ref: 'Primer DataTable truncation; Carbon data table',
    check: ({ source }) => source.elements
      .filter((el) => /\btruncate\b|\bline-clamp-\d|\btext-ellipsis\b/.test(classOf(el)) && inCell(source, el))
      .filter((el) => ![el, ...ancestors(el)].some((a) => /Tooltip|HoverCard/.test(a.tag)))
      .map((el) => ({ line: el.line, message: 'truncated text without a full-value tooltip' })),
    good: [{ code: 'const a = <TableCell><Tooltip><TooltipTrigger asChild><button type="button" className="truncate">{name}</button></TooltipTrigger><TooltipContent>{name}</TooltipContent></Tooltip></TableCell>;' }],
    bad: [{ code: 'const a = <TableCell><span className="truncate">{name}</span></TableCell>;' }],
  },
];
