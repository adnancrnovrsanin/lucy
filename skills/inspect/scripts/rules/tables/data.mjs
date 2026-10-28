import { hits, lineText, isTableFile } from '../../lib/helpers.mjs';

const LIT = String.raw`(?:'[^']*'|"[^"]*"|`+'`[^`$]*`'+String.raw`)`;
const LITERAL_ARG = new RegExp(`^\\s*(?:${LIT}|[\\w$.]+\\s*(?:===?|!==?)\\s*${LIT}\\s*\\?\\s*${LIT}\\s*:\\s*${LIT})\\s*$`);
const isLiteralSql = (arg) => LITERAL_ARG.test(arg);

// The source of the first argument of the call whose "(" sits at `open`. Brackets are counted on
// the masked text, where string and template contents are blank, so a ")" inside a literal such
// as "count(*)" never ends the argument.
function firstArg(source, open) {
  const m = source.masked;
  let depth = 0;
  let i = open + 1;
  for (; i < m.length; i++) {
    const c = m[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) break;
      depth--;
    } else if (c === ',' && depth === 0) break;
  }
  return source.text.slice(open + 1, i);
}

const RAW_CALL = /(\bsql\.raw|\$(?:query|execute)RawUnsafe|\.(?:raw|whereRaw|orderByRaw))\s*\(/g;
const TAG_KEYWORDS = new Set(['return', 'typeof', 'await', 'yield', 'case', 'in', 'of', 'else', 'void', 'delete', 'throw', 'new', 'instanceof', 'do']);

// True when the template literal starting at `start` is tagged, as in sql`...` or db.sql`...`.
function isTagged(source, start) {
  const m = /([\w$][\w$.]*)\s*$/.exec(source.masked.slice(Math.max(0, start - 80), start));
  return Boolean(m) && !TAG_KEYWORDS.has(m[1]);
}

// Words that put a file in filter or query territory for dynamic-code-in-filter.
const FILTER_CONTEXT = /\b(?:filters?|where|operators?|query)\b/;

export default [
  {
    id: 'raw-sql-filter-field',
    severity: 'error',
    platform: 'all',
    why: 'A raw SQL fragment is built from a variable, so a filter or sort field from the client can inject SQL.',
    fix: 'Map every field through the server column registry (an allow-list) to a column object, take operators from a server switch, and bind values as parameters.',
    ref: 'react-querybuilder server usage; OWASP SQL injection',
    check: ({ source }) => [...source.masked.matchAll(RAW_CALL)]
      .filter((m) => {
        const arg = firstArg(source, m.index + m[0].length - 1);
        if (m[1].startsWith('.')) return /^\s*`/.test(arg) && arg.includes('${');
        return !isLiteralSql(arg);
      })
      .map((m) => ({ index: m.index, message: 'raw SQL built from a variable' })),
    good: [
      { code: 'const where = and(...filters.map((f) => toCondition(COLUMNS[f.field], f)));', file: 'app/invoices/queries.ts' },
      { code: 'const dir = sql.raw("ASC");', file: 'app/invoices/queries.ts' },
      { code: 'const dir = sql.raw(`ASC`);', file: 'app/invoices/queries.ts' },
      { code: 'const dir = sql.raw(order === "desc" ? "DESC" : "ASC");', file: 'app/invoices/queries.ts' },
      { code: 'const rows = await prisma.$queryRawUnsafe("SELECT 1");', file: 'app/invoices/queries.ts' },
      { code: 'const total = sql.raw("count(*)");', file: 'app/invoices/queries.ts' },
      { code: 'const rows = await prisma.$queryRawUnsafe("SELECT count(*) FROM t");', file: 'app/invoices/queries.ts' },
    ],
    bad: [
      { code: 'const order = sql.raw(`${sortField} ${dir}`);', file: 'app/invoices/queries.ts' },
      { code: 'const rows = await prisma.$queryRawUnsafe(`SELECT * FROM invoices ORDER BY ${field}`);', file: 'app/invoices/queries.ts' },
    ],
  },
  {
    id: 'like-pattern-unescaped',
    severity: 'warning',
    platform: 'all',
    why: 'A LIKE pattern wraps the user value in % without escaping % and _, so a search for "50%" or "a_b" matches the wrong rows.',
    fix: 'Escape \\, %, and _ in the value before wrapping it, and pass it as a bound parameter.',
    ref: 'craft tables research, tablecn filter-columns defect',
    check: ({ source }) => [...source.text.matchAll(/\b(?:i?like|notI?Like)\s*\(\s*[\w$.]+\s*,\s*`%\$\{\s*(?!escape)[\w$.]+\s*\}%?`/g)]
      .map((m) => ({ index: m.index, message: 'LIKE pattern without escaping' })),
    good: [{ code: 'const c = ilike(invoices.number, `%${escapeLike(value)}%`);', file: 'app/invoices/queries.ts' }],
    bad: [{ code: 'const c = ilike(invoices.number, `%${value}%`);', file: 'app/invoices/queries.ts' }],
  },
  {
    id: 'search-params-json-unvalidated',
    severity: 'warning',
    platform: 'all',
    why: 'Filter state is parsed from the URL with JSON.parse and used without a schema, so any shape reaches the table and the server.',
    fix: 'Parse URL state with a schema (nuqs parseAsJson with a schema, or schema.parse) and drop unknown fields and operators.',
    ref: 'nuqs parsers; react-querybuilder server usage',
    check: ({ source }) => hits(source, /\bJSON\.parse\s*\(\s*(?:[\w$]+\.)?searchParams(?:\.get\s*\(|\[)/g, source.text)
      .filter((h) => !/\b(?:safeParse|parse)\s*\(\s*JSON\.parse/.test(lineText(source, source.lineOf(h.index))))
      .map((h) => ({ index: h.index, message: 'JSON.parse of search params without a schema' })),
    good: [{ code: 'const filters = filterSchema.parse(JSON.parse(searchParams.get("filters") ?? "{}"));' }],
    bad: [{ code: 'const filters = JSON.parse(searchParams.get("filters") ?? "{}");' }],
  },
  {
    id: 'order-by-interpolated',
    severity: 'error',
    platform: 'all',
    why: 'An ORDER BY clause interpolates a variable, so a sort field from the client can inject SQL.',
    fix: 'Look the sort id up in the server column registry and order by the column object; reject unknown ids.',
    ref: 'secondsky tanstack-table server patterns; OWASP SQL injection',
    check: ({ source }) => source.strings
      .filter((s) => s.quote === '`' && /ORDER\s+BY\s+((?:(?!\b(?:LIMIT|OFFSET)\b)[^`'"])*)\$\{/i.test(s.value) && !isTagged(source, s.start))
      .map((s) => ({ index: s.start, message: 'ORDER BY with an interpolated value' })),
    good: [
      { code: 'const rows = await db.select().from(invoices).orderBy(desc(SORTABLE[sort.id]), asc(invoices.id));', file: 'app/invoices/queries.ts' },
      { code: 'const text = `SELECT * FROM invoices ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;', file: 'app/invoices/queries.ts' },
      { code: 'const q = sql`SELECT * FROM invoices ORDER BY ${SORTABLE[sort.id]} DESC, ${invoices.id}`;', file: 'app/invoices/queries.ts' },
    ],
    bad: [{ code: 'const text = `SELECT * FROM invoices ORDER BY ${sort.id} ${sort.desc ? "DESC" : "ASC"}`;', file: 'app/invoices/queries.ts' }],
  },
  {
    id: 'dynamic-code-in-filter',
    severity: 'error',
    platform: 'all',
    why: 'Code is built at runtime with new Function or eval, which runs whatever a filter or query string contains and fails under a strict CSP.',
    fix: 'Evaluate filters by walking the filter tree with a switch over known operators.',
    ref: 'craft tables research, liqe hydrateAst',
    check: ({ source }) => (isTableFile(source) || FILTER_CONTEXT.test(source.masked)
      ? hits(source, /\bnew\s+Function\s*\(|(?<![\w$.])eval\s*\(/g).map((h) => ({ index: h.index, message: 'runtime code generation' }))
      : []),
    good: [
      { code: 'const matches = (row, c) => (c.op === "eq" ? row[c.field] === c.value : false);' },
      { code: 'const globalObject = new Function("return this")();', file: 'scripts/build.js' },
    ],
    bad: [
      { code: 'const toPredicate = (filter) => new Function("row", `return row.${filter.field}`);' },
      { code: ['import { useReactTable } from "@tanstack/react-table";', 'const getValue = new Function("row", `return row.${path}`);'].join('\n') },
    ],
  },
  {
    id: 'query-data-copied-to-state',
    severity: 'warning',
    platform: 'all',
    why: 'Query results are copied into component state in an effect, so the table renders stale rows and an extra pass.',
    fix: 'Pass query data straight to the table, with a module-level empty array as the fallback.',
    ref: 'TanStack Table with TanStack Query guide',
    check: ({ source }) => (/\buse(?:Infinite|Suspense)?Query\s*\(|\buseSWR\s*\(/.test(source.masked)
      ? hits(source, /\buseEffect\s*\(\s*\(\)\s*=>\s*\{?\s*(?:if\s*\([^)]*\)\s*)?set[A-Z]\w*\s*\(\s*(?:[\w$]+\.)?data\b/g).map((h) => ({ index: h.index, message: 'query data copied into state' }))
      : []),
    good: [{ code: ['const emptyRows = [];', 'const query = useQuery({ queryKey: ["invoices", page], queryFn });', 'const data = query.data?.rows ?? emptyRows;'].join('\n') }],
    bad: [{ code: ['const query = useQuery({ queryKey: ["invoices"], queryFn });', 'useEffect(() => { setRows(query.data); }, [query.data]);'].join('\n') }],
  },
  {
    id: 'constant-query-key-with-table-state',
    severity: 'warning',
    platform: 'all',
    why: 'The query key holds only constants while the table pages, sorts, or filters on the server, so state changes never refetch.',
    fix: 'Put every server-owned value (pagination, sorting, filters) in the query key.',
    ref: 'TanStack Table with TanStack Query guide; client-side vs server-side checklist',
    check: ({ source }) => (/\bmanual(?:Pagination|Sorting|Filtering)\b/.test(source.masked)
      ? hits(source, /\bqueryKey\s*:\s*\[(?:\s*(['"`])\s*\1\s*,?)*\s*\]/g).map((h) => ({ index: h.index, message: 'constant query key with server table state' }))
      : []),
    good: [{ code: ['const query = useQuery({ queryKey: ["invoices", pagination, sorting, filters], queryFn });', 'const table = useTable({ features, columns, data, manualPagination: true, rowCount });'].join('\n') }],
    bad: [{ code: ['const query = useQuery({ queryKey: ["invoices"], queryFn });', 'const table = useTable({ features, columns, data, manualPagination: true, rowCount });'].join('\n') }],
  },
];
