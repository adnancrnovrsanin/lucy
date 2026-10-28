import { catchBlocks, isTableFile } from '../../lib/helpers.mjs';

export default [
  {
    id: 'spinner-instead-of-table',
    severity: 'warning',
    platform: 'web',
    why: 'The whole table is replaced by a spinner while loading, so the layout jumps and refetches blank the data.',
    fix: 'Show skeleton rows inside the real table frame on first load, and keep the previous rows with a slim progress indicator on refetch.',
    ref: 'Carbon data table, skeleton loading; Primer DataTable',
    check: ({ source }) => {
      if (!isTableFile(source)) return [];
      const SPIN = '(?:Spinner|Loader\\w*|CircularProgress|Spin)';
      const TABLE_EL = /^\s*\(?\s*<\s*(?:Table|DataTable|DataGrid|table)\b/;
      const rendersTable = /<\s*(?:Table|DataTable|DataGrid|table)\b/.test(source.masked);
      const out = [];
      for (const m of source.masked.matchAll(new RegExp(`\\bis(?:Loading|Pending)\\s*\\?\\s*\\(?\\s*<\\s*${SPIN}\\b`, 'g'))) {
        const after = source.masked.slice(m.index + m[0].length, m.index + m[0].length + 300);
        const colon = after.search(/:\s*\(?\s*(?:<|null)/);
        if (colon >= 0 && TABLE_EL.test(after.slice(colon + 1))) out.push({ index: m.index, message: 'spinner in place of the table' });
      }
      if (rendersTable) {
        for (const m of source.masked.matchAll(new RegExp(`\\bis(?:Loading|Pending)\\s*\\)\\s*return\\s*\\(?\\s*<\\s*${SPIN}\\b`, 'g'))) {
          out.push({ index: m.index, message: 'spinner in place of the table' });
        }
      }
      return out;
    },
    good: [
      { code: ['import { useTable } from "@tanstack/react-table";', '{query.isFetching ? <Spinner /> : null}'].join('\n') },
      { code: ['import { useTable } from "@tanstack/react-table";', '{mutation.isPending ? <Loader2 className="animate-spin" /> : <Download />}'].join('\n') },
      { code: ['import { useTable } from "@tanstack/react-table";', 'const body = query.isPending ? <SkeletonRows columns={columns.length} /> : <Rows rows={rows} />;'].join('\n') },
    ],
    bad: [
      { code: ['import { useTable } from "@tanstack/react-table";', 'const view = query.isLoading ? <Spinner /> : <DataTable table={table} />;'].join('\n') },
      { code: ['import { useTable } from "@tanstack/react-table";', 'function T() { if (query.isPending) return <Loader2 className="animate-spin" />; return <DataTable table={table} />; }'].join('\n') },
    ],
  },
  {
    id: 'error-as-empty-rows',
    severity: 'warning',
    platform: 'all',
    why: 'A failed query is caught and returned as empty data, so the table shows "No results" instead of an error.',
    fix: 'Let the error reach the table and render the error state with Retry; never turn a failure into an empty result.',
    ref: 'craft tables research, tablecn queries.ts defect',
    check: ({ source }) => catchBlocks(source)
      .filter((b) => /\breturn\s*(?:\[\s*\]|\{[^}]*\b(?:data|rows|items|records)\s*:\s*\[\s*\])/.test(b.body))
      .map((b) => ({ line: b.line, message: 'catch returns empty rows' })),
    good: [{ code: 'export async function getInvoices(q) { try { return await db.query(q); } catch (error) { logger.error(error); throw error; } }', file: 'app/invoices/queries.ts' }],
    bad: [{ code: 'export async function getInvoices(q) { try { return await db.query(q); } catch { return { data: [], pageCount: 0 }; } }', file: 'app/invoices/queries.ts' }],
  },
  {
    id: 'query-without-error-branch',
    severity: 'warning',
    platform: 'web',
    why: 'The table loads data with a query but never renders its error, so a failure looks like an empty or endless table.',
    fix: 'Render the error state from the query (isError or error) with a message and Retry, or let an error boundary handle a suspense query.',
    ref: 'craft tables research, five states',
    check: ({ source }) => {
      if (!isTableFile(source)) return [];
      const m = /\buse(?:Infinite)?Query\s*\(|\buseSWR(?:Infinite)?\s*\(/.exec(source.masked);
      if (!m || /\b(isError|error|failureReason|ErrorBoundary)\b/.test(source.masked)) return [];
      return [{ index: m.index, message: 'query without an error branch' }];
    },
    good: [{ code: ['import { useTable } from "@tanstack/react-table";', 'const query = useQuery({ queryKey: ["invoices", page], queryFn });', 'const view = query.isError ? <TableError onRetry={query.refetch} /> : <DataTable />;'].join('\n') }],
    bad: [{ code: ['import { useTable } from "@tanstack/react-table";', 'const query = useQuery({ queryKey: ["invoices", page], queryFn });', 'const view = <DataTable data={query.data} />;'].join('\n') }],
  },
];
