import { blocks, isDetailsFile } from '../../lib/helpers.mjs';
import { queryAtLeast } from '../../lib/stack.mjs';

// The index of the bracket that closes the one opened at `open`, on masked text.
function closeOf(m, open) {
  const pairs = { '(': ')', '[': ']', '{': '}' };
  const stack = [];
  for (let i = open; i < m.length; i++) {
    const c = m[i];
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === ')' || c === ']' || c === '}') {
      if (stack.pop() !== c) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

// The top-level text of an object literal body: nested brackets blanked so keys of inner objects never count.
function topLevel(body) {
  let depth = 0;
  let out = '';
  for (const c of body) {
    const opens = c === '(' || c === '[' || c === '{';
    const closes = c === ')' || c === ']' || c === '}';
    if (closes) depth--;
    out += depth === 0 || c === '\n' ? c : ' ';
    if (opens) depth++;
  }
  return out;
}

// Each `call({ ... })` whose first argument is an object literal: { index, body (top level), inner (whole) }.
function objectCalls(source, pattern) {
  const m = source.masked;
  const out = [];
  for (const hit of m.matchAll(pattern)) {
    const open = hit.index + hit[0].length - 1;
    const close = closeOf(m, open);
    if (close < 0) continue;
    const inner = m.slice(open + 1, close);
    out.push({ index: hit.index, open, close, inner, body: topLevel(inner) });
  }
  return out;
}

// The [start, end] ranges of every `name(` call, parens included.
function callRanges(source, pattern) {
  const m = source.masked;
  const out = [];
  for (const hit of m.matchAll(pattern)) {
    const open = hit.index + hit[0].length - 1;
    const close = closeOf(m, open);
    if (close > 0) out.push([hit.index, close]);
  }
  return out;
}

// Start of the expression chain that ends just before `index` (walking back over calls, members, and spaces).
function chainStart(m, index) {
  const closers = { ')': '(', ']': '[', '}': '{' };
  let i = index - 1;
  for (;;) {
    while (i >= 0 && /\s/.test(m[i])) i--;
    if (i < 0) return 0;
    const c = m[i];
    if (closers[c]) {
      let depth = 0;
      for (; i >= 0; i--) {
        if (m[i] === c) depth++;
        else if (m[i] === closers[c]) {
          depth--;
          if (depth === 0) break;
        }
      }
      i--;
      continue;
    }
    if (c === '.' || c === '?' || c === '!') { i--; continue; }
    if (/[\w$]/.test(c)) {
      const end = i;
      while (i >= 0 && /[\w$]/.test(m[i])) i--;
      const word = m.slice(i + 1, end + 1);
      if (word === 'await' || word === 'return') return end + 1 - word.length;
      if (word === 'new') continue;
      // Stop at a word that is not joined to the chain by a dot or call.
      let j = i;
      while (j >= 0 && /\s/.test(m[j])) j--;
      if (j >= 0 && (m[j] === '.' || m[j] === '?')) continue;
      return i + 1;
    }
    return i + 1;
  }
}

const QUERY_CLIENT = String.raw`(?:\b[\w$]*(?:[cC]lient|qc|QC)|\bgetQueryClient\(\s*\)|\buseQueryClient\(\s*\))\s*\.\s*`;
const DEPRECATED_PREFETCH = new RegExp(`${QUERY_CLIENT}(prefetchQuery|ensureQueryData|fetchQuery)\\s*\\(`, 'g');
const CLIENT_CALL_OBJECT = new RegExp(`${QUERY_CLIENT}(query|prefetchQuery|ensureQueryData|fetchQuery)\\s*\\(\\s*\\{`, 'g');
const RECORD_QUERY_OBJECT = /\b(?:useQuery|useSuspenseQuery|queryOptions)\s*\(\s*\{/g;
const NOOP_CATCH = /\.\s*catch\s*\(\s*(?:noop|\(\s*[\w$]*\s*\)\s*=>\s*(?:\{\s*\}|null|undefined|void\s+0|\(\s*\{\s*\}\s*\)|\[\s*\]|\{\s*return\s*(?:null|undefined)?\s*;?\s*\}))\s*\)/g;
const HANDLER = (name) => new RegExp(`\\b${name}\\s*(?::\\s*(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)\\s*=>\\s*|(?:async\\s*)?\\([^)]*\\)\\s*)\\{`, 'g');
const MUTATORS = '(?:push|pop|shift|unshift|splice|sort|reverse|fill|copyWithin)';

function escape(name) {
  return name.replace(/\$/g, '\\$');
}

// Names bound to the data of a query in render: `const { data } = useQuery(...)`, `{ data: order }`, `const q = useQuery(...)` as `q.data`.
function queryDataNames(source) {
  const names = [];
  for (const m of source.masked.matchAll(/\b(?:const|let)\s*\{([^}]*)\}\s*=\s*use(?:Suspense)?Query\s*\(/g)) {
    const d = /(?:^|,)\s*data\s*(?::\s*([\w$]+))?\s*(?:=[^,]*)?(?:,|$)/.exec(m[1]);
    if (d) names.push(d[1] ?? 'data');
  }
  for (const m of source.masked.matchAll(/\b(?:const|let)\s+([\w$]+)\s*=\s*use(?:Suspense)?Query\s*\(/g)) names.push(`${m[1]}\\s*\\??\\.\\s*data`);
  // A record hook named after its record returns it under that name: `const { order } = useOrder(id)` (Medusa).
  for (const m of source.masked.matchAll(/\b(?:const|let)\s*\{([^}]*)\}\s*=\s*use([A-Z][a-z]\w*)\s*\(/g)) {
    const noun = m[2][0].toLowerCase() + m[2].slice(1);
    if (/^(?:State|Reducer|Ref|Memo|Callback|Context|Form|Params|Search|Location|Navigate|Router|Transition|Optimistic|ActionState)/.test(m[2])) continue;
    const key = /^(?:GetOne|GetList|GetMany|One|Show|InfiniteQuery|SuspenseInfiniteQuery)$/.test(m[2]) ? 'data' : noun;
    const d = new RegExp(`(?:^|,)\\s*${key}\\s*(?::\\s*([\\w$]+))?\\s*(?:=[^,]*)?(?:,|$)`).exec(m[1]);
    if (d) names.push(d[1] ?? key);
  }
  return names;
}

function mutations(source, name) {
  const chain = `\\b${name}(?:\\s*\\??\\.\\s*[\\w$]+|\\s*\\[[^\\]\\n]*\\])*`;
  const out = [];
  for (const m of source.masked.matchAll(new RegExp(`${chain}\\s*\\??\\.\\s*${MUTATORS}\\s*\\(`, 'g'))) out.push(m.index);
  for (const m of source.masked.matchAll(new RegExp(`\\b${name}(?:\\s*\\??\\.\\s*[\\w$]+|\\s*\\[[^\\]\\n]*\\])+\\s*(?:[-+*/]?=(?!=)|\\+\\+|--)`, 'g'))) out.push(m.index);
  return out;
}

// Function bodies with a name: declarations, arrow consts, and useCallback consts.
function namedFunctions(source) {
  const out = [];
  const patterns = [
    /\bfunction\s+([\w$]+)\s*\([^)]*\)\s*(?::[^{]*)?\{/g,
    /\b(?:const|let)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*(?::[^=]*)?=>\s*\{/g,
    /\b(?:const|let)\s+([\w$]+)\s*=\s*useCallback\s*\(\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>\s*\{/g,
  ];
  for (const pattern of patterns) {
    for (const b of blocks(source, pattern)) {
      const name = new RegExp(pattern.source).exec(source.masked.slice(b.start, b.open + 1))?.[1];
      out.push({ name, start: b.open, end: b.end });
    }
  }
  return out;
}

const FILE_DETAILS = 'app/orders/[id]/page.tsx';
const ROUTE_DETAILS = 'src/routes/orders/$orderId.tsx';

export default [
  {
    id: 'deprecated-query-prefetch',
    severity: 'warning',
    platform: 'all',
    why: 'prefetchQuery, ensureQueryData and fetchQuery are deprecated in TanStack Query 5.105 in favour of queryClient.query().',
    fix: 'Call queryClient.query(options) with the shared queryOptions factory; add staleTime there when the cache should win.',
    ref: 'TanStack Query v5.105 QueryClient reference, query()',
    when: (stack) => queryAtLeast(stack, 5, 105),
    check: ({ source }) => [...source.masked.matchAll(DEPRECATED_PREFETCH)]
      .map((m) => ({ index: m.index, message: `queryClient.${m[1]} is deprecated; use queryClient.query` })),
    good: [
      { code: 'export const loader = ({ context, params }) => context.queryClient.query(orderQuery(params.orderId));', file: ROUTE_DETAILS },
      { code: 'export default async function Page({ params }) { const { id } = await params; const queryClient = getQueryClient(); void queryClient.query({ ...orderQuery(id), staleTime: 60_000 }); return <OrderView id={id} />; }', file: FILE_DETAILS },
      { code: 'const queryClient = getQueryClient(); await queryClient.prefetchQuery(orderQuery(id));', file: FILE_DETAILS, stack: { queryMinor: 90 } },
      { code: 'const result = await api.fetchQuery(sql);' },
    ],
    bad: [
      { code: 'export default async function Page({ params }) { const { id } = await params; const queryClient = getQueryClient(); void queryClient.prefetchQuery(orderQuery(id)); return <OrderView id={id} />; }', file: FILE_DETAILS },
      { code: 'export const Route = createFileRoute("/orders/$orderId")({ loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.orderId)) });', file: ROUTE_DETAILS },
      { code: 'const qc = useQueryClient(); const prefetch = () => qc.fetchQuery(orderQuery(id));' },
    ],
  },
  {
    id: 'query-suspense-flag',
    severity: 'warning',
    platform: 'all',
    why: 'TanStack Query v5 removed the suspense option, so useQuery({ suspense: true }) no longer suspends and the loading state is never handled.',
    fix: 'Use useSuspenseQuery with the shared queryOptions factory, inside a Suspense boundary and an error boundary.',
    ref: 'TanStack Query v5 migration guide, suspense',
    when: (stack) => stack.queryMajor !== null && stack.queryMajor >= 5,
    check: ({ source }) => objectCalls(source, /\buseQuery\s*\(\s*\{/g)
      .filter((c) => /\bsuspense\s*:\s*true\b/.test(c.body))
      .map((c) => ({ index: c.index, message: 'useQuery with suspense: true' })),
    good: [
      { code: 'const { data: order } = useSuspenseQuery(orderQuery(id));' },
      { code: 'const query = useQuery({ ...orderQuery(id), meta: { suspense: true } });' },
      { code: 'const query = useQuery({ queryKey: ["order", id], queryFn, suspense: true });', stack: { queryMajor: 4, queryMinor: 36 } },
    ],
    bad: [
      { code: 'const query = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id), suspense: true });' },
      { code: 'const { data } = useQuery({\n  ...orderQuery(id),\n  suspense: true,\n});' },
    ],
  },
  {
    id: 'inline-key-in-prefetch',
    severity: 'warning',
    platform: 'all',
    why: 'A prefetch or loader writes its own inline queryKey, so it drifts from the key the component reads and the cache misses.',
    fix: 'Define the record query once as a queryOptions factory and pass or spread it in the loader, prefetch and component.',
    ref: 'TanStack Query docs, query options; craft details research, report-engineering',
    check: ({ source }) => objectCalls(source, CLIENT_CALL_OBJECT)
      .filter((c) => /\bqueryKey\s*:\s*\[/.test(c.body))
      .map((c) => ({ index: c.index, message: 'inline queryKey in a prefetch; use the shared queryOptions factory' })),
    good: [
      { code: 'export const loader = ({ context, params }) => context.queryClient.query(orderQuery(params.orderId));', file: ROUTE_DETAILS },
      { code: 'void queryClient.query({ ...orderQuery(id), staleTime: "static" });', file: FILE_DETAILS },
      { code: 'export const orderQuery = (id) => queryOptions({ queryKey: ["orders", id], queryFn: () => getOrder(id) });', file: 'src/features/orders/queries.ts' },
      { code: 'const queryClient = getQueryClient(); void queryClient.prefetchQuery(productQueryOptions(id));', file: FILE_DETAILS, stack: { queryMinor: 90 } },
    ],
    bad: [
      { code: 'export const loader = ({ context, params }) => context.queryClient.query({ queryKey: ["order", params.orderId], queryFn: () => getOrder(params.orderId) });', file: ROUTE_DETAILS },
      { code: 'const onHover = () => queryClient.prefetchQuery({\n  queryKey: ["orders", row.id],\n  queryFn: () => getOrder(row.id),\n});' },
    ],
  },
  {
    id: 'retry-on-client-errors',
    severity: 'warning',
    platform: 'all',
    why: 'The record query retries every failure, so a 404 or 403 spins for seconds of backoff before the not-found or no-access state shows.',
    fix: 'Pass a retry function that returns false for 4xx statuses and retries only network and 5xx failures a few times.',
    ref: 'TanStack Query docs, query retries; craft details research, report-engineering',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      return objectCalls(source, RECORD_QUERY_OBJECT)
        .filter((c) => /\bretry\s*:\s*(?:true\b|[1-9]\d*\b)/.test(c.body))
        .map((c) => ({ index: c.index, message: 'record query retries without a status check' }));
    },
    good: [
      { code: 'export default function OrderPage() { const { id } = useParams(); const query = useQuery({ ...orderQuery(id), retry: (count, error) => error.status >= 500 && count < 3 }); return <OrderView query={query} />; }', file: FILE_DETAILS },
      { code: 'export default function OrderPage() { const { id } = useParams(); const query = useQuery({ ...orderQuery(id), retry: false }); return <OrderView query={query} />; }', file: FILE_DETAILS },
      { code: 'export default function OrderPage() { const { id } = useParams(); const { data } = useSuspenseQuery(orderQuery(id)); return <OrderView order={data} />; }', file: FILE_DETAILS },
      { code: 'const query = useQuery({ queryKey: ["orders", page], queryFn, retry: 3 });', file: 'app/orders/page.tsx' },
    ],
    bad: [
      { code: 'export default function OrderPage() { const { id } = useParams(); const query = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id), retry: 3 }); return <OrderView query={query} />; }', file: FILE_DETAILS },
      { code: 'export const orderQuery = (id) => queryOptions({ queryKey: ["order", id], queryFn: () => getOrder(id), retry: true });\nexport function OrderPage() { const { orderId } = Route.useParams(); const { data } = useSuspenseQuery(orderQuery(orderId)); }', file: ROUTE_DETAILS },
    ],
  },
  {
    id: 'record-loader-swallows-error',
    severity: 'warning',
    platform: 'all',
    why: 'The loader catches the record fetch with a no-op, so a missing or failed record renders as empty instead of reaching the not-found or error boundary.',
    fix: 'Let the record fetch throw (or throw notFound() on a 404); keep .catch(noop) only for a related-data prefetch that is not awaited.',
    ref: 'TanStack Router docs, data loading and not-found errors; craft details research, report-engineering',
    check: ({ source, path }) => {
      const inLoader = /\b(?:client)?[lL]oader\b/.test(source.masked) || /(^|[\\/])page\.[jt]sx?$/.test(path);
      if (!inLoader) return [];
      const m = source.masked;
      const out = [];
      for (const hit of m.matchAll(NOOP_CATCH)) {
        const start = chainStart(m, hit.index);
        const head = m.slice(Math.max(0, start - 40), start);
        const lead = m.slice(start, start + 6);
        if (/^(?:await|return)\b/.test(lead) || /(?:=>|\breturn|\bawait)\s*$/.test(head)) {
          out.push({ index: hit.index, message: 'record fetch caught with a no-op, so errors never reach a boundary' });
        }
      }
      return out;
    },
    good: [
      { code: 'export const Route = createFileRoute("/orders/$orderId")({ loader: async ({ context, params }) => { context.queryClient.query(orderEventsQuery(params.orderId)).catch(noop); return context.queryClient.query(orderQuery(params.orderId)); } });', file: ROUTE_DETAILS },
      { code: 'export async function loader({ params }) { const order = await getOrder(params.id); if (!order) throw new Response("Not found", { status: 404 }); return { order }; }', file: 'app/routes/orders.$id.tsx' },
      { code: 'export default async function Page({ params }) { const { id } = await params; const order = await getOrder(id); if (!order) notFound(); return <OrderView order={order} />; }', file: FILE_DETAILS },
    ],
    bad: [
      { code: 'export const Route = createFileRoute("/orders/$orderId")({ loader: ({ context, params }) => context.queryClient.query(orderQuery(params.orderId)).catch(noop) });', file: ROUTE_DETAILS },
      { code: 'export default async function Page({ params }) { const { id } = await params; const order = await getOrder(id).catch(() => null); return <OrderView order={order} />; }', file: FILE_DETAILS },
    ],
  },
  {
    id: 'optimistic-without-cancel',
    severity: 'warning',
    platform: 'all',
    why: 'onMutate writes the optimistic value without cancelling in-flight queries, so a refetch that lands later overwrites it with stale data.',
    fix: 'In onMutate, await cancelQueries for the key, snapshot getQueryData, set the new value, and return the snapshot for onError to roll back.',
    ref: 'TanStack Query docs, optimistic updates via the cache',
    check: ({ source }) => blocks(source, HANDLER('onMutate'))
      .filter((b) => /\bsetQuer(?:y|ies)Data\s*(?:<[^>]*>)?\s*\(/.test(b.body) && !/\bcancelQueries\s*\(/.test(b.body))
      .map((b) => ({ line: b.line, message: 'onMutate sets query data without cancelQueries' })),
    good: [
      { code: 'useMutation({ mutationFn: updateOrder, onMutate: async (next) => { await queryClient.cancelQueries({ queryKey: orderKey(id) }); const previous = queryClient.getQueryData(orderKey(id)); queryClient.setQueryData(orderKey(id), next); return { previous }; } });' },
      { code: 'useMutation({ mutationFn: updateOrder, onMutate: async (next, context) => { await context.client.cancelQueries({ queryKey: ["order", id] }); context.client.setQueryData(["order", id], next); } });' },
      { code: 'useMutation({ mutationFn: updateOrder, onMutate: () => { toast("Saving"); } });' },
    ],
    bad: [
      { code: 'useMutation({ mutationFn: updateOrder, onMutate: async (next) => { const previous = queryClient.getQueryData(["order", id]); queryClient.setQueryData(["order", id], next); return { previous }; } });' },
      { code: 'const options = { onMutate(next) {\n  qc.setQueryData(orderKey(id), (old) => ({ ...old, ...next }));\n} };' },
    ],
  },
  {
    id: 'invalidation-not-returned',
    severity: 'warning',
    platform: 'all',
    why: 'onSettled starts the invalidation without returning it, so the mutation stops pending before the record refetches and the old value flashes back.',
    fix: 'Return (or await) the invalidateQueries promise from onSettled, for example onSettled: () => queryClient.invalidateQueries({ queryKey }).',
    ref: 'TanStack Query docs, invalidations from mutations',
    check: ({ source }) => {
      const mutations = callRanges(source, /\b(?:useMutation|mutationOptions)\s*\(/g);
      const out = [];
      for (const b of blocks(source, HANDLER('onSettled'))) {
        if (!mutations.some(([s, e]) => b.start > s && b.start < e)) continue;
        for (const call of b.body.matchAll(/\binvalidateQueries\s*\(/g)) {
          const start = chainStart(b.body, call.index);
          const head = b.body.slice(Math.max(0, start - 30), start);
          const lead = b.body.slice(start, start + 6);
          if (/^(?:await|return)\b/.test(lead) || /(?:\breturn|\bawait|\bvoid|=)\s*$/.test(head)) continue;
          if (/[([,]\s*$/.test(head)) continue;
          out.push({ line: source.lineOf(b.open + 1 + call.index), message: 'invalidateQueries in onSettled is not returned' });
        }
      }
      return out;
    },
    good: [
      { code: 'useMutation({ mutationFn: updateOrder, onSettled: () => queryClient.invalidateQueries({ queryKey: orderKey(id) }) });' },
      { code: 'useMutation({ mutationFn: updateOrder, onSettled: async () => { await queryClient.invalidateQueries({ queryKey: orderKey(id) }); } });' },
      { code: 'useMutation({ mutationFn: updateOrder, onSettled: (data, error, vars, result, context) => { return Promise.all([context.client.invalidateQueries({ queryKey: ["order", id] }), context.client.invalidateQueries({ queryKey: ["orders"] })]); } });' },
      { code: 'mutate(vars, { onSettled: () => { queryClient.invalidateQueries({ queryKey: ["orders"] }); } });' },
    ],
    bad: [
      { code: 'useMutation({ mutationFn: updateOrder, onSettled: () => { queryClient.invalidateQueries({ queryKey: orderKey(id) }); } });' },
      { code: 'const options = mutationOptions({\n  mutationFn: updateOrder,\n  onSettled() {\n    qc.invalidateQueries({ queryKey: ["order", id] })\n  },\n});' },
    ],
  },
  {
    id: 'cache-mutated-in-place',
    severity: 'warning',
    platform: 'all',
    why: 'Cached query data is mutated in place, so structural sharing sees no change, other readers get a silently changed object, and renders go stale.',
    fix: 'Derive a copy (toSorted, spread, map) or move the transform into the query select option; never sort, push or assign on cached data.',
    ref: 'TanStack Query docs, immutability and select; craft details research, medusa D6',
    check: ({ source }) => {
      const out = [];
      const names = queryDataNames(source);
      for (const m of source.masked.matchAll(/\b(?:const|let)\s+([\w$]+)\s*=\s*[\w$.()]*\.\s*getQueryData\s*(?:<[^>]*>)?\s*\(/g)) names.push(escape(m[1]));
      for (const b of blocks(source, /\bsetQueryData\s*(?:<[^>]*>)?\s*\([^;]*?,\s*(?:\(\s*([\w$]+)[^)]*\)|([\w$]+))\s*=>\s*\{/g)) {
        const param = /=>\s*\{$/.test(source.masked.slice(b.start, b.open + 1)) && /,\s*(?:\(\s*([\w$]+)[^)]*\)|([\w$]+))\s*=>\s*\{$/.exec(source.masked.slice(b.start, b.open + 1));
        const name = param && (param[1] ?? param[2]);
        if (!name) continue;
        for (const index of mutations({ masked: b.body }, escape(name))) out.push({ index: b.open + 1 + index, message: 'setQueryData updater mutates the cached value' });
      }
      for (const m of source.masked.matchAll(/\bgetQueryData\s*(?:<[^>]*>)?\s*\(/g)) {
        const close = closeOf(source.masked, m.index + m[0].length - 1);
        if (close < 0) continue;
        const after = source.masked.slice(close + 1, close + 200);
        if (new RegExp(`^(?:\\s*\\??\\.\\s*[\\w$]+)*\\s*\\??\\.\\s*${MUTATORS}\\s*\\(`).test(after)) out.push({ index: m.index, message: 'getQueryData result mutated in place' });
      }
      for (const name of names) {
        for (const index of mutations(source, name)) out.push({ index, message: 'query data mutated in place' });
      }
      const seen = new Set();
      return out.filter((h) => {
        const line = source.lineOf(h.index);
        return !seen.has(line) && seen.add(line);
      });
    },
    good: [
      { code: 'const { data: order } = useSuspenseQuery(orderQuery(id));\nconst items = order.items.toSorted((a, b) => a.rank - b.rank);' },
      { code: 'const { data } = useQuery({ ...orderQuery(id), select: (order) => ({ ...order, items: [...order.items].sort(byRank) }) });' },
      { code: 'const { order } = useOrder(id);\nconst items = useMemo(() => [...order.items].sort(byCreated), [order.items]);' },
      { code: 'const { form } = useForm();\nform.values.name = "x";' },
      { code: 'queryClient.setQueryData(orderKey(id), (old) => { if (!old) return old; return { ...old, notes: [...old.notes, note] }; });' },
      { code: 'const { data } = useQuery(orderQuery(id));\nconst total = data.items.reduce((sum, item) => sum + item.total, 0);\nif (data.status === "paid") total.toFixed(2);' },
    ],
    bad: [
      { code: 'const { data: order } = useQuery(orderQuery(id));\nconst items = order.items.sort((a, b) => a.rank - b.rank);' },
      { code: 'const query = useSuspenseQuery(orderQuery(id));\nquery.data.customer.name = formatName(query.data.customer);' },
      { code: 'const previous = queryClient.getQueryData(orderKey(id));\nprevious.notes.push(note);' },
      { code: 'queryClient.setQueryData(orderKey(id), (old) => { old.notes.push(note); return old; });' },
      { code: 'const { order, isLoading } = useOrder(id, { fields });\nif (order) {\n  order.items = order.items.sort((a, b) => a.created_at - b.created_at);\n}' },
    ],
  },
  {
    id: 'optimistic-setter-outside-transition',
    severity: 'warning',
    platform: 'web',
    why: 'The useOptimistic setter runs outside a transition or action, so React warns and the optimistic value reverts at once.',
    fix: 'Call the setter inside startTransition or inside the function passed to a form action, formAction, or useActionState.',
    ref: 'React docs, useOptimistic',
    check: ({ source }) => {
      const m = source.masked;
      const setters = [...m.matchAll(/\[\s*[\w$]+\s*,\s*([\w$]+)\s*\]\s*=\s*(?:React\.)?useOptimistic\s*\(/g)].map((x) => ({ name: x[1], decl: x.index }));
      if (!setters.length) return [];
      const transitions = callRanges(source, /\b[\w$]*[sS]tartTransition\s*\(/g);
      const actionAttrs = blocks(source, /\b(?:action|formAction)\s*=\s*\{/g).map((b) => [b.open, b.end]);
      const functions = namedFunctions(source);
      const isAction = (name) => /Action$|^action$/.test(name)
        || new RegExp(`\\b(?:action|formAction)\\s*=\\s*\\{\\s*${escape(name)}\\s*\\}|\\buseActionState\\s*\\(\\s*${escape(name)}\\b|[sS]tartTransition\\s*\\(\\s*${escape(name)}\\b`).test(m);
      const out = [];
      for (const { name } of setters) {
        for (const call of m.matchAll(new RegExp(`(?<![\\w$.])${escape(name)}\\s*\\(`, 'g'))) {
          const at = call.index;
          if (transitions.some(([s, e]) => at > s && at < e)) continue;
          if (actionAttrs.some(([s, e]) => at > s && at < e)) continue;
          const enclosing = functions.filter((f) => at > f.start && at < f.end).sort((a, b) => (b.start - a.start))[0];
          if (enclosing && isAction(enclosing.name)) continue;
          out.push({ index: at, message: `${name} called outside a transition or action` });
        }
      }
      return out;
    },
    good: [
      { code: 'const [notes, addNote] = useOptimistic(order.notes, (list, note) => [...list, note]);\nasync function noteAction(formData) { addNote({ body: formData.get("body") }); await saveNote(formData); }\nreturn <form action={noteAction}><button>Add</button></form>;' },
      { code: 'const [status, setStatus] = useOptimistic(order.status);\nconst [, startTransition] = useTransition();\nconst onSelect = (next) => startTransition(async () => { setStatus(next); await updateStatus(id, next); });' },
      { code: 'const [notes, addNote] = useOptimistic(order.notes);\nreturn <form action={async (fd) => { addNote(fd.get("body")); await saveNote(fd); }}><button>Add</button></form>;' },
    ],
    bad: [
      { code: 'const [status, setStatus] = useOptimistic(order.status);\nconst onSelect = async (next) => { setStatus(next); await updateStatus(id, next); };' },
      { code: 'const [notes, addNote] = useOptimistic(order.notes);\nreturn <button onClick={() => addNote(draft)}>Add</button>;' },
    ],
  },
  {
    id: 'write-without-precondition',
    severity: 'warning',
    platform: 'all',
    why: 'The record is updated with PUT or PATCH and no version or If-Match, so a second editor silently overwrites the first one\'s changes.',
    fix: 'Send the version the edit was based on (an If-Match ETag or a version field) and handle a 412 or 409 by showing the newer record.',
    ref: 'RFC 9110 section 13.1.1, If-Match; craft details research, report-engineering',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      if (/If-Match|ifMatch|\betag\b|\bETag\b|\bversion\b|\bupdatedAt\b|\bupdated_at\b|\browVersion\b|\bexpectedVersion\b/i.test(source.text)) return [];
      const out = [];
      for (const m of source.text.matchAll(/\bmethod\s*:\s*['"`](PUT|PATCH)['"`]/gi)) {
        if (source.masked.slice(m.index, m.index + 6) === 'method') out.push({ index: m.index, message: `${m[1].toUpperCase()} without If-Match or a version` });
      }
      for (const m of source.masked.matchAll(/\b(?:axios|ky|http|[\w$]*[aA]pi)\s*\.\s*(put|patch)\s*\(/g)) out.push({ index: m.index, message: `${m[1].toUpperCase()} without If-Match or a version` });
      return out;
    },
    good: [
      { code: 'export default function OrderPage() { const { id } = useParams(); const { data } = useQuery(orderQuery(id)); const save = (patch) => fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "If-Match": data.etag }, body: JSON.stringify(patch) }); }', file: FILE_DETAILS },
      { code: 'export default function OrderPage() { const { id } = useParams(); const { data } = useQuery(orderQuery(id)); const save = (patch) => api.patch(`/orders/${id}`, { ...patch, version: data.version }); }', file: FILE_DETAILS },
      { code: 'export async function saveSettings(values) { return fetch("/api/settings", { method: "PUT", body: JSON.stringify(values) }); }', file: 'src/api/settings.ts' },
    ],
    bad: [
      { code: 'export default function OrderPage() { const { id } = useParams(); const { data } = useQuery(orderQuery(id)); const save = (patch) => fetch(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); }', file: FILE_DETAILS },
      { code: 'export function OrderPage() { const { orderId } = Route.useParams(); const { data } = useSuspenseQuery(orderQuery(orderId)); const save = (patch) => axios.put(`/orders/${orderId}`, patch); }', file: ROUTE_DETAILS },
    ],
  },
  {
    id: 'effect-sets-title',
    severity: 'warning',
    platform: 'web',
    why: 'The page title is set from an effect, so it is wrong on first paint and in server HTML, and a fast navigation can leave the previous record\'s title.',
    fix: 'Set the title with the framework\'s metadata API (generateMetadata, a route head or meta export) or render a React 19 <title> element.',
    ref: 'React docs, <title>; Next.js docs, generateMetadata',
    check: ({ source }) => blocks(source, /\buse(?:Layout)?Effect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g)
      .filter((b) => /\bdocument\s*\.\s*title\s*=(?!=)/.test(b.body))
      .map((b) => ({ index: b.open + 1 + b.body.search(/\bdocument\s*\.\s*title\s*=(?!=)/), message: 'document.title set in an effect' })),
    good: [
      { code: 'export async function generateMetadata({ params }) { const { id } = await params; const order = await getOrder(id); return { title: `Order ${order.number}` }; }', file: FILE_DETAILS },
      { code: 'export function OrderView({ order }) { return <><title>{`Order ${order.number}`}</title><h1>Order {order.number}</h1></>; }' },
      { code: 'useEffect(() => { if (document.title === "x") track(); }, []);' },
    ],
    bad: [
      { code: 'useEffect(() => { document.title = `Order ${order.number}`; }, [order.number]);' },
      { code: 'React.useLayoutEffect(() => {\n  if (order) document.title = order.number;\n}, [order]);' },
    ],
  },
];
