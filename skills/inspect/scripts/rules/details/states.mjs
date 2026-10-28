import { blocks, catchBlocks, str, expr, innerSource, isDetailsFile, DYNAMIC_SEGMENT } from '../../lib/helpers.mjs';

// The record states rules: loading, not found, no access, and error each get their own branch,
// in that order, and none of them is a blank page or an endless skeleton.

const LOADING_FLAG = /\b(?:\w*Loading|\w*Pending|loading|pending|isFetching)\b/;
const LOADING_TAG = /^(?:[\w.]*(?:Loading|Skeleton|Spinner|Loader)\w*|Spin|CircularProgress)$/;
// A loading view: a loading component, or an element whose own words start with "Loading".
const isLoadingView = (el) => LOADING_TAG.test(el.tag) || /^\s*Loading\b/i.test(el.text);
// Error tokens inside one condition: a query flag or error object, a failed response, an error-named variable.
const ERROR_IN_COND = /\b(?:isError|error|err|[a-z]\w*Error|failureReason)\b|!\s*[\w$.?]+\.ok\b|\bstatus\s*===?\s*['"]error['"]/;
// Any error handling in the file: a branch, a boundary, a framework error slot, or a suspense query that throws.
const ERROR_BRANCH = /\b(?:isError|error|err|[a-z]\w*Error|ErrorBoundary|\w*ErrorComponent|errorComponent|errorElement|catchError|throwOnError|useSuspenseQuery|failureReason)\b(\s*\()?/g;
const NOT_ERROR = new Set(['onError', 'setError', 'clearErrors']);
// A condition that already looks at the status: a 404 check or a not-found helper or class.
const STATUS_CHECK = /\b404\b|\bisNotFound\w*\s*\(|\bNotFound\w*\b|\bNOT_FOUND\b|\bnotFound\b|\bnot_found\b|\bP2025\b|\bPGRST116\b/;
// A branch that itself inspects a status or error code before rendering.
const THEN_STATUS = /\b404\b|\b403\b|\bisNotFound\w*\s*\(|\binstanceof\s+\w*NotFound|\bNOT_FOUND\b|\bFORBIDDEN\b|\.status(?:Code)?\b|\.code\b/;
const NOT_FOUND_VIEW = /<\s*[\w.]*(?:NotFound|PageNotFound|Missing\w*|Error404|NoMatch)\w*\b/;
const NOT_FOUND_TEXT = /not[\s_-]?found|doesn['’]?t exist|does not exist|no longer exists/i;
const ACCESS = /\b(?:403|forbidden|Forbidden|FORBIDDEN|unauthori[sz]ed|Unauthori[sz]ed|UNAUTHORI[SZ]ED|AccessDenied|accessDenied|ACCESS_DENIED|NotAuthori[sz]ed\w*|notAuthori[sz]ed\w*|NoAccess|noAccess|PermissionDenied|permissionDenied|canAccess\w*|canView\w*|canRead\w*|hasAccess\w*)\b/;
const STATUS_MAP = /\bcase\s+404\b|\b(?:status|statusCode|code)\s*[!=]==?\s*404\b|\b404\s*[!=]==?\s*[\w$.?]*(?:status|code)\b|\bisNotFound\w*\s*\(|\binstanceof\s+\w*NotFound\w*|\bNOT_FOUND\b/;
const FLAG_NAME = /^(?:is[A-Z]\w*|error|status|fetchStatus|refetch\w*|fetch\w*|failure\w*|has[A-Z]\w*|\w*Error|mutate\w*|dataUpdatedAt|errorUpdatedAt|promise|isError)$/;
const RECORD_HOOK = /^use(?:Show\w*|\w*Query|GetOne|One|GetRecord\w*|SWR)$/;
// Hooks that load the viewer, not the record.
const VIEWER_HOOK = /^use(?:GetIdentity|Identity|Session|User|CurrentUser|Me|Auth\w*|Permissions|CanAccess|RecordContext)$/;

// Index of the bracket that closes the one at `open`, on the masked text.
function closeOf(m, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const want = pairs[m[open]];
  let depth = 0;
  for (let i = open; i < m.length; i++) {
    if (m[i] === m[open]) depth++;
    else if (m[i] === want && --depth === 0) return i;
  }
  return m.length;
}

// True when the "{" at `open` starts a function body: after "=>", or after a parameter list
// (with an optional return type) that does not belong to if, for, while, switch, or catch.
function opensFunction(m, open) {
  let j = open - 1;
  while (j >= 0 && /\s/.test(m[j])) j--;
  if (m[j] === '>' && m[j - 1] === '=') return true;
  let k = j;
  if (m[k] !== ')') {
    const close = m.lastIndexOf(')', k);
    const colon = m.lastIndexOf(':', k);
    if (close < 0 || colon < close || !/^\s*$/.test(m.slice(close + 1, colon)) || !/^[\s\w$.<>[\]|,]*$/.test(m.slice(colon + 1, k + 1))) return false;
    k = close;
  }
  let depth = 0;
  let p = k;
  for (; p >= 0; p--) {
    if (m[p] === ')') depth++;
    else if (m[p] === '(' && --depth === 0) break;
  }
  if (p < 0) return false;
  return !/\b(?:if|for|while|switch|catch|with)\s*$/.test(m.slice(Math.max(0, p - 12), p));
}

// Per-source caches, kept off the shared source object.
const cache = (fn) => { const map = new WeakMap(); return (source) => { if (!map.has(source)) map.set(source, fn(source)); return map.get(source); }; };

const functionBodies = cache((source) => {
  const m = source.masked;
  const out = [];
  const stack = [];
  for (let i = 0; i < m.length; i++) {
    if (m[i] === '{') stack.push(i);
    else if (m[i] === '}') {
      const open = stack.pop();
      if (open !== undefined && opensFunction(m, open)) out.push({ start: open, end: i });
    }
  }
  return out;
});

// The innermost function body around `index`, or the whole file.
function enclosing(source, index) {
  let best = { start: 0, end: source.masked.length };
  for (const b of functionBodies(source)) if (b.start < index && b.end > index && b.start >= best.start) best = b;
  return best;
}

const isComponent = (source, body) => source.elements.some((e) => e.start > body.start && e.start < body.end);

// Names bound to the record inside the function around `index`: destructured from a query-shaped
// hook or result, awaited, or taken from `.data`. Also the loading flags that belong to viewer hooks
// (identity, permissions), which are not record guards.
function bindings(source, index) {
  const body = enclosing(source, index);
  const m = source.masked.slice(body.start, body.end);
  const names = new Set();
  const viewerFlags = new Set();
  for (const d of m.matchAll(/\b(?:const|let)\s*\{([^{}]*)\}\s*(?::[^=]+)?=\s*(?:await\s+)?([\w$.]+)\s*(?:<[^>]*>)?\s*(\()?/g)) {
    const [, list, callee, call] = d;
    const hook = callee.split('.').pop();
    const entries = list.split(',').map((s) => s.trim()).filter(Boolean);
    const viewer = VIEWER_HOOK.test(hook);
    const shaped = entries.some((e) => /^(?:isLoading|isPending|isError|error|status|isFetching|isSuccess|refetch)\b/.test(e));
    const fromQuery = call ? RECORD_HOOK.test(hook) : /query|result|Query|Result/.test(hook);
    for (const e of entries) {
      const pair = /^([\w$]+)\s*:\s*([\w$]+)/.exec(e);
      const key = pair ? pair[1] : /^[\w$]+/.exec(e)?.[0];
      const name = pair ? pair[2] : key;
      if (!key) continue;
      if (viewer) { viewerFlags.add(name); continue; }
      if (FLAG_NAME.test(key)) continue;
      if (key === 'data' || key === 'record' || shaped || fromQuery) names.add(name);
    }
  }
  for (const d of m.matchAll(/\b(?:const|let)\s+([\w$]+)\s*(?::[^=]+)?=\s*(?:\(\s*)?await\s+[\w$.]+\s*\(/g)) names.add(d[1]);
  for (const d of m.matchAll(/\b(?:const|let)\s+([\w$]+)\s*=\s*[\w$]+\??\.data\b/g)) names.add(d[1]);
  return { names, viewerFlags };
}

// True when the condition tests a loading flag that does not belong to a viewer hook.
function testsLoading(cond, viewerFlags) {
  return [...cond.matchAll(new RegExp(LOADING_FLAG.source, 'g'))].some((x) => cond[x.index - 1] === '.' || !viewerFlags.has(x[0]));
}

const escape = (s) => s.replace(/\$/g, '\\$');

function negatesRecord(cond, names) {
  if (/!\s*[\w$]+\??\.data\b(?!\s*\??\.\s*(?:length|some|every)\b)/.test(cond)) return true;
  for (const n of names) {
    const e = escape(n);
    if (new RegExp(`!\\s*${e}\\b(?!\\s*\\()`).test(cond) || new RegExp(`\\b${e}\\s*===?\\s*(?:null|undefined)\\b`).test(cond)) return true;
  }
  return false;
}

// Top-level "||" parts of a condition.
function disjuncts(cond) {
  const out = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < cond.length; i++) {
    const c = cond[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (depth === 0 && c === '|' && cond[i + 1] === '|') { out.push(cond.slice(from, i)); from = i + 2; i++; }
  }
  out.push(cond.slice(from));
  return out;
}

// True when the condition still holds after loading ends without data (the error state):
// a top-level "||" part negates the record and does not also require a loading flag.
const trueOnError = (cond, names) => disjuncts(cond).some((d) => negatesRecord(d, names) && !LOADING_FLAG.test(d));

const isRecordExpr = (cond, names) => {
  const c = cond.trim().replace(/^\(|\)$/g, '').trim();
  if (/^[\w$]+\??\.data\b/.test(c)) return true;
  const head = /^[\w$]+/.exec(c)?.[0];
  return Boolean(head && names.has(head));
};

// Every `if (cond)` whose branch returns, throws, or calls, with the branch text.
const guards = cache((source) => {
  const m = source.masked;
  const t = source.text;
  const out = [];
  for (const g of m.matchAll(/\bif\s*\(/g)) {
    const open = g.index + g[0].length - 1;
    const close = closeOf(m, open);
    let i = close + 1;
    while (/\s/.test(m[i] ?? '')) i++;
    let end;
    if (m[i] === '{') end = closeOf(m, i) + 1;
    else if (/^return\s*\(/.test(m.slice(i, i + 40))) end = closeOf(m, m.indexOf('(', i)) + 1;
    else if (/^return\s*</.test(m.slice(i, i + 40))) {
      const at = m.indexOf('<', i);
      const el = source.elements.find((e) => e.start === at);
      end = el ? el.close : at + 1;
    } else {
      const semi = m.slice(i).search(/[;\n]/);
      end = semi < 0 ? m.length : i + semi;
    }
    out.push({
      index: g.index, cond: t.slice(open + 1, close), condMasked: m.slice(open + 1, close),
      thenStart: i, thenEnd: end, then: t.slice(i, end), thenMasked: m.slice(i, end),
    });
  }
  return out;
});

const bare = (s) => s.trim().replace(/^\{\s*/, '').replace(/\s*\}$/, '').trim();

// Positions inside [from, to) where code branches on an error.
function errorChecks(source, from, to) {
  const out = [];
  for (const g of guards(source)) if (g.index >= from && g.index < to && ERROR_IN_COND.test(g.cond)) out.push(g.index);
  const m = source.masked.slice(from, to);
  for (const x of m.matchAll(/\b(?:isError|error|[a-z]\w*Error)\s*(?:\?(?![.?])|&&)/g)) out.push(from + x.index);
  for (const x of m.matchAll(/\bthrow\s+(?:[\w$.]*error|err)\b/gi)) out.push(from + x.index);
  return out.sort((a, b) => a - b);
}

function loadingChecks(source, from, to) {
  return guards(source).filter((g) => g.index >= from && g.index < to && LOADING_FLAG.test(g.condMasked)).map((g) => g.index);
}

// Walks back from a "?" to the start of its condition.
function condBefore(m, q) {
  let depth = 0;
  let j = q - 1;
  for (; j >= 0; j--) {
    const c = m[j];
    if (c === ')' || c === ']' || c === '}') depth++;
    else if (c === '(' || c === '[' || c === '{') {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0) {
      if (c === ';' || c === ',' || c === ':' || c === '?') break;
      if (c === '=' && !/[=!<>]/.test(m[j - 1]) && !/[=>]/.test(m[j + 1])) break;
    }
  }
  return m.slice(j + 1, q).replace(/^\s*return\b/, '').trim();
}

// Walks back from a ternary ":" to its "?".
function questionBefore(m, colon) {
  let depth = 0;
  for (let j = colon - 1; j >= 0; j--) {
    const c = m[j];
    if (c === ')' || c === ']' || c === '}') depth++;
    else if (c === '(' || c === '[' || c === '{') {
      if (depth === 0) return -1;
      depth--;
    } else if (depth === 0) {
      if (c === ';') return -1;
      if (c === '?' && m[j + 1] !== '.' && m[j + 1] !== '?' && m[j - 1] !== '?') return j;
    }
  }
  return -1;
}

function hasErrorBranch(source) {
  // toast.error(...) and console.error(...) are calls, not branches.
  return [...source.masked.matchAll(ERROR_BRANCH)].some((x) => !NOT_ERROR.has(x[0].replace(/\s*\($/, '')) && !(x[1] && /^err(?:or)?\s*\($/.test(x[0])));
}

const isErrorFile = (path) => /(^|[\\/])(?:error|global-error)\.[jt]sx?$/.test(path);
const isBoundaryFile = (source, path) => isErrorFile(path) || /error-?boundary/i.test(path)
  || /\b(?:useRouteError|isRouteErrorResponse|errorComponent|ErrorBoundary)\b/.test(source.masked);

export default [
  {
    id: 'record-guard-returns-null',
    severity: 'error',
    platform: 'all',
    why: 'The record guard returns null, so the page is blank while loading and stays blank when the fetch fails or the record is missing.',
    fix: 'Give each state its own branch: a layout-shaped skeleton while loading, an error with retry, and a not-found view when the record is absent.',
    ref: 'craft details research, report-implementations D1 (shadcn-admin-kit show.tsx, atomic-crm CompanyShow.tsx)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const suspense = /\buseSuspenseQuery\b/.test(source.masked);
      const out = [];
      for (const g of guards(source)) {
        if (!/^return\s*(?:null|\(\s*null\s*\)|<>\s*<\/>)?\s*;?$/.test(bare(g.thenMasked))) continue;
        const { names, viewerFlags } = bindings(source, g.index);
        const loading = testsLoading(g.condMasked, viewerFlags);
        const missing = negatesRecord(g.condMasked, names);
        if (!loading && !missing) continue;
        const body = enclosing(source, g.index);
        if (!isComponent(source, body)) continue;
        if (!loading) {
          if (suspense) continue;
          const handled = loadingChecks(source, body.start, g.index).length > 0 && errorChecks(source, body.start, g.index).length > 0;
          if (handled) continue;
        }
        out.push({ index: g.index, message: `record guard "${g.cond.trim()}" returns null` });
      }
      return out;
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default async function OrderPage({ params }) {',
          '  const { id } = await params;',
          '  const order = await getOrder(id);',
          '  if (!order) notFound();',
          '  return <h1>Order {order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/order-detail/order-detail.tsx',
        code: [
          'export const OrderDetail = () => {',
          '  const { id } = useParams();',
          '  const { data: order, isPending, isError, error } = useQuery(orderQuery(id));',
          '  if (isPending) return <TwoColumnPageSkeleton mainSections={4} />;',
          '  if (isError) return <RecordError error={error} />;',
          '  if (!order) return null;',
          '  return <h1>{order.display_id}</h1>;',
          '};',
        ].join('\n'),
      },
      {
        file: 'src/companies/CompanyNotes.tsx',
        code: [
          'export const CompanyNotes = () => {',
          '  const record = useRecordContext();',
          '  if (!record) return null;',
          '  return <NotesIterator reference={record.id} />;',
          '};',
        ].join('\n'),
      },
      {
        file: 'src/comments/CommentShow.tsx',
        code: [
          'const PostOption = () => {',
          '  const record = useRecordContext();',
          '  if (!record) return null;',
          '  return <span>{record.title}</span>;',
          '};',
          'export const CommentShow = () => {',
          '  const { isPending: checking, canAccess } = useCanAccess({ action: "show", resource: "comments" });',
          '  const { record, isPending, error } = useShowController();',
          '  if (checking) return null;',
          '  if (isPending) return <CommentSkeleton />;',
          '  if (error) return <RecordError />;',
          '  return <h1>{record.title}</h1>;',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/products/[id]/product-view.tsx',
        code: [
          'export function ProductView({ id }) {',
          '  const { data } = useSuspenseQuery(productByIdOptions(id));',
          '  if (!data) return null;',
          '  return <h1>{data.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'src/companies/CompanyShow.tsx',
        code: [
          'const CompanyShowContent = () => {',
          '  const { record, isPending } = useShowContext();',
          '  if (isPending || !record) return null;',
          '  return <h1>{record.name}</h1>;',
          '};',
          'export const CompanyShow = () => <ShowBase><CompanyShowContent /></ShowBase>;',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data } = useQuery({ queryKey: ["order", params.id], queryFn: () => getOrder(params.id) });',
          '  if (!data) return null;',
          '  return <h1>{data.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/invoices/$invoiceId.tsx',
        code: [
          'function InvoicePage() {',
          '  const { invoiceId } = Route.useParams();',
          '  const query = useQuery(invoiceQuery(invoiceId));',
          '  if (query.isLoading) { return null; }',
          '  return <h1>{query.data.number}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'loading-as-only-fallback',
    severity: 'error',
    platform: 'all',
    why: 'The only fallback for a missing record is the loading view and the file has no error branch, so a failed fetch loads forever.',
    fix: 'Branch on the query status: skeleton while pending, an error with retry when it failed, the not-found view when the record is absent.',
    ref: 'craft details research, report-implementations D2 (refine-ui posts/show.tsx)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path) || hasErrorBranch(source)) return [];
      const m = source.masked;
      const names = (i) => bindings(source, i).names;
      const out = [];
      for (const el of source.elements.filter((e) => isLoadingView(e))) {
        const before = m.slice(Math.max(0, el.start - 40), el.start);
        if (/:\s*\(?\s*$/.test(before)) {
          const colon = el.start - before.length + before.search(/:\s*\(?\s*$/);
          const q = questionBefore(m, colon);
          if (q >= 0 && isRecordExpr(condBefore(m, q), names(q))) out.push({ index: q, message: 'record ? content : loading, with no error branch' });
        } else if (/\?\s*\(?\s*$/.test(before)) {
          const q = el.start - before.length + before.search(/\?\s*\(?\s*$/);
          const cond = condBefore(m, q);
          if (/^!/.test(cond) && negatesRecord(cond, names(q))) out.push({ index: q, message: '!record ? loading : content, with no error branch' });
        }
      }
      for (const g of guards(source)) {
        const view = source.elements.some((e) => e.start >= g.thenStart && e.start < g.thenEnd && isLoadingView(e));
        if (/^return\s*\(?\s*</.test(bare(g.thenMasked)) && view && trueOnError(g.condMasked, names(g.index))) {
          out.push({ index: g.index, message: 'missing record returns the loading view, with no error branch' });
        }
      }
      return out;
    },
    good: [
      {
        file: 'src/pages/posts/show.tsx',
        code: [
          'export const PostShow = () => {',
          '  const { id } = useParams();',
          '  const { data, isError, refetch } = useQuery(postQuery(id));',
          '  if (isError) return <RecordError onRetry={refetch} />;',
          '  return data ? <PostBody post={data} /> : <PostSkeleton />;',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/products/[id]/page.tsx',
        code: [
          'export default function ProductPage({ params }) {',
          '  const { data } = useSuspenseQuery(productQuery(params.id));',
          '  return data ? <ProductBody product={data} /> : <Skeleton />;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order, status } = useQuery(orderQuery(params.id));',
          '  if (status === "pending") return <OrderSkeleton />;',
          '  if (status === "error") return <RecordError />;',
          '  return <h1>{order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useQuery(orderQuery(params.id));',
          '  const save = useMutation({ mutationFn: saveOrder });',
          '  return <h1>{order?.number}{save.isPending ? <Spinner /> : null}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'src/pages/posts/show.tsx',
        code: [
          'export default function ShowPost() {',
          '  const { query } = useShow();',
          '  const post = query.data?.data;',
          '  return (<ShowView><LoadingOverlay loading={query.isFetching}>',
          '    {post ? (<Card><h1>{post.title}</h1></Card>) : (<div>Loading...</div>)}',
          '  </LoadingOverlay></ShowView>);',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order } = useQuery(orderQuery(params.id));',
          '  return !order ? <Spinner /> : <h1>{order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/customers/$customerId.tsx',
        code: [
          'function CustomerPage() {',
          '  const { customerId } = Route.useParams();',
          '  const { data: customer } = useQuery(customerQuery(customerId));',
          '  if (!customer) return (<div className="grid place-items-center"><LogoSpinner /></div>);',
          '  return <h1>{customer.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'error-checked-after-missing-data',
    severity: 'error',
    platform: 'all',
    why: 'The guard on missing data returns before the error check runs, so a failed fetch with no data shows the skeleton forever.',
    fix: 'Check the error before the missing-data guard: pending, then error, then not found, then the page.',
    ref: 'craft details research, report-implementations D3 (medusa order-detail.tsx)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const out = [];
      for (const g of guards(source)) {
        // Only a guard that renders a view (the skeleton) hides the error; record-guard-returns-null reports null.
        if (ERROR_IN_COND.test(g.cond) || !/^return\s*\(?\s*<\s*[\w.]/.test(bare(g.thenMasked))) continue;
        if (!trueOnError(g.condMasked, bindings(source, g.index).names)) continue;
        const body = enclosing(source, g.index);
        if (!isComponent(source, body)) continue;
        const checks = errorChecks(source, body.start, body.end);
        if (checks.length && checks[0] > g.index) out.push({ index: g.index, message: `"${g.cond.trim()}" returns before the error check on line ${source.lineOf(checks[0])}` });
      }
      return out;
    },
    good: [
      {
        file: 'src/routes/orders/order-detail/order-detail.tsx',
        code: [
          'export const OrderDetail = () => {',
          '  const { id } = useParams();',
          '  const { order, isLoading, isError, error } = useOrder(id);',
          '  if (isError) throw error;',
          '  if (isLoading || !order) return <TwoColumnPageSkeleton mainSections={4} />;',
          '  return <h1>{order.display_id}</h1>;',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order, isPending, isError, refetch } = useQuery(orderQuery(params.id));',
          '  if (isPending) return <OrderSkeleton />;',
          '  if (isError) return <RecordError onRetry={refetch} />;',
          '  if (!order) return <OrderNotFound />;',
          '  return <h1>{order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/pages/[pageId]/page.tsx',
        code: [
          'function PageDetails({ params }) {',
          '  const { pageId } = params;',
          '  const { data: page, error } = useSWR(pageId, fetchPage);',
          '  if (!page && !error) return <LogoSpinner />;',
          '  if (error) return <PageError />;',
          '  return <h1>{page.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'src/routes/orders/order-detail/order-detail.tsx',
        code: [
          'export const OrderDetail = () => {',
          '  const { id } = useParams();',
          '  const { order, isLoading, isError, error } = useOrder(id, { fields: DEFAULT_FIELDS });',
          '  if (isLoading || !order) {',
          '    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={2} />;',
          '  }',
          '  if (isError) { throw error; }',
          '  return <h1>{order.display_id}</h1>;',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/customers/[id]/page.tsx',
        code: [
          'export default function CustomerPage({ params }) {',
          '  const { data, isPending, error } = useQuery(customerQuery(params.id));',
          '  if (isPending || !data) return <CustomerSkeleton />;',
          '  if (error) return <RecordError error={error} />;',
          '  return <h1>{data.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'not-found-from-any-error',
    severity: 'error',
    platform: 'all',
    why: 'Every error becomes "not found", so an outage or an expired session tells the user the record does not exist.',
    fix: 'Show not found only for a 404 (error.status === 404, isNotFound(error), or a NotFoundError); send every other error to the error state with retry.',
    ref: 'craft details research, report-implementations D4 (react-admin useShowController.ts, plane page.tsx, Kiranism product-view-page.tsx)',
    check: ({ source, path }) => {
      const errorRoute = isErrorFile(path) && DYNAMIC_SEGMENT.test(path);
      if (!isDetailsFile(source, path) && !errorRoute) return [];
      // Not-found copy counts only inside rendered JSX; a notFound() call or a NotFound view counts anywhere.
      const shows = (text, masked) => /\bnotFound\s*\(/.test(masked) || NOT_FOUND_VIEW.test(masked)
        || (/^\{?\s*return\s*\(?\s*</.test(masked.trim()) && NOT_FOUND_TEXT.test(text));
      const out = [];
      for (const g of guards(source)) {
        if (THEN_STATUS.test(g.then)) continue; // the branch looks at the status itself
        if (ERROR_IN_COND.test(g.cond) && !STATUS_CHECK.test(g.cond) && shows(g.then, g.thenMasked)) {
          out.push({ index: g.index, message: `"${g.cond.trim()}" leads to not found without a 404 check` });
        }
      }
      const m = source.masked;
      for (const x of m.matchAll(/\?\s*\(?\s*<\s*[\w.]*(?:NotFound|PageNotFound|Error404)\w*\b/g)) {
        const cond = condBefore(m, x.index);
        if (ERROR_IN_COND.test(cond) && !STATUS_CHECK.test(cond)) out.push({ index: x.index, message: `"${cond}" renders not found without a 404 check` });
      }
      for (const c of catchBlocks(source)) {
        if ((/\bnotFound\s*\(/.test(c.body) || NOT_FOUND_VIEW.test(c.body)) && !THEN_STATUS.test(c.raw) && !STATUS_CHECK.test(c.raw.replace(/\bnotFound\s*\(\s*\)|<\s*[\w.]*NotFound\w*/g, ''))) {
          out.push({ line: c.line, message: 'catch turns every error into not found' });
        }
      }
      if (errorRoute && !out.length && (NOT_FOUND_VIEW.test(m) || /\bnotFound\s*\(/.test(m)) && !/\b404\b|\bdigest\b|\bstatus\b|\bisNotFound/.test(m)) {
        const at = m.search(/<\s*[\w.]*(?:NotFound|PageNotFound|Error404)\w*\b|\bnotFound\s*\(/);
        out.push({ index: at, message: 'the error route renders not found for every error' });
      }
      return out;
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default async function OrderPage({ params }) {',
          '  const { id } = await params;',
          '  const order = await getOrder(id);',
          '  if (!order) notFound();',
          '  return <h1>Order {order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/$orderId.tsx',
        code: [
          'function OrderPage() {',
          '  const { orderId } = Route.useParams();',
          '  const { data, isPending, isError, error, refetch } = useQuery(orderQuery(orderId));',
          '  if (isPending) return <OrderSkeleton />;',
          '  if (isError && error.status === 404) return <OrderNotFound />;',
          '  if (isError) return <RecordError onRetry={refetch} />;',
          '  return <h1>{data.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/products/[id]/page.tsx',
        code: [
          'export default async function ProductPage({ params }) {',
          '  const { id } = await params;',
          '  let product;',
          '  try { product = await getProduct(id); } catch (error) { if (error instanceof NotFoundError) notFound(); throw error; }',
          '  return <h1>{product.name}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/invoices/[id]/page.tsx',
        code: [
          'export default function InvoicePage({ params }) {',
          '  const { data, error } = useQuery(invoiceQuery(params.id));',
          '  if (isNotFound(error)) return <InvoiceNotFound />;',
          '  if (error) return <RecordError />;',
          '  return <h1>{data?.number}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'app/products/[id]/page.tsx',
        code: [
          'export default async function ProductPage({ params }) {',
          '  const { id } = await params;',
          '  const { product, error } = await fetchProduct(id);',
          '  if (error || !product) notFound();',
          '  return <h1>{product.name}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/$orderId.tsx',
        code: [
          'function OrderPage() {',
          '  const { orderId } = Route.useParams();',
          '  const { data, isError } = useQuery(orderQuery(orderId));',
          '  if (isError) return <NotFound />;',
          '  return <h1>{data?.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/pages/[pageId]/page.tsx',
        code: [
          'function PageDetails({ params }) {',
          '  const { data: page, error: pageDetailsError } = useSWR(params.pageId, fetchPage);',
          '  if (pageDetailsError) return (<div><h3>Page not found</h3></div>);',
          '  return <h1>{page?.name}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/items/[id]/page.tsx',
        code: [
          'export default async function ItemPage({ params }) {',
          '  const res = await fetch(`/api/items/${params.id}`);',
          '  if (!res.ok) return <ItemNotFound />;',
          '  return <h1>{(await res.json()).name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'no-access-branch-missing',
    severity: 'warning',
    platform: 'all',
    why: 'The code maps error statuses and handles 404 but never 403, so a permission failure falls into the generic error or a misleading message.',
    fix: 'Handle 403 explicitly: route it to the not-found view by default, or to "You don\'t have access to this <type>" when the viewer already knows the record exists.',
    ref: 'craft details research, report-implementations D7 (medusa error-boundary.tsx); PatternFly UnauthorizedAccess',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path) && !isBoundaryFile(source, path)) return [];
      const at = source.masked.search(STATUS_MAP);
      if (at < 0 || ACCESS.test(source.text)) return [];
      return [{ index: at, message: '404 is handled, 403 is not' }];
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default async function OrderPage({ params }) {',
          '  const { id } = await params;',
          '  const order = await getOrderForViewer(id);',
          '  if (!order) notFound();',
          '  return <h1>Order {order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/components/error-boundary.tsx',
        code: [
          'export const ErrorBoundary = () => {',
          '  const error = useRouteError();',
          '  const code = isFetchError(error) ? error.status : 500;',
          '  switch (code) {',
          '    case 403: case 404: return <NotFoundView />;',
          '    default: return <ErrorView />;',
          '  }',
          '};',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/$orderId.tsx',
        code: [
          'function OrderPage() {',
          '  const { orderId } = Route.useParams();',
          '  const { data, error } = useQuery(orderQuery(orderId));',
          '  if (error?.status === 404 || error?.status === 403) return <OrderNotFound />;',
          '  if (error) return <RecordError />;',
          '  return <h1>{data?.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/invoices/[id]/page.tsx',
        code: [
          'export default async function InvoicePage({ params }) {',
          '  const { id } = await params;',
          '  const result = await getInvoice(id);',
          '  if (result.status === 404) notFound();',
          '  if (result.status === 403) forbidden();',
          '  return <h1>{result.invoice.number}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'src/components/utilities/error-boundary/error-boundary.tsx',
        code: [
          'export const ErrorBoundary = () => {',
          '  const error = useRouteError();',
          '  const code = isFetchError(error) ? error.status : 500;',
          '  switch (code) {',
          '    case 400: return <ErrorView title="Bad request" />;',
          '    case 404: return <ErrorView title="Not found" />;',
          '    default: return <ErrorView title="Something went wrong" />;',
          '  }',
          '};',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/$orderId.tsx',
        code: [
          'function OrderPage() {',
          '  const { orderId } = Route.useParams();',
          '  const { data, error } = useQuery(orderQuery(orderId));',
          '  if (error?.status === 404) return <OrderNotFound />;',
          '  if (error) return <RecordError />;',
          '  return <h1>{data?.number}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'effect-fetch-record',
    severity: 'warning',
    platform: 'web',
    why: 'The page fetches inside useEffect, so it renders empty first, races on fast navigation, and has no cache, retry, or error state.',
    fix: 'Load the record with the data layer: a route loader, a server component, or a query hook with a shared queryOptions factory.',
    ref: 'React docs, You Might Not Need an Effect (fetching data); TanStack Query, does this replace client state',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      // fetch(), axios, or an api client read (api.get, api.orders.retrieve); not api.on() of a carousel.
      const FETCH = /\bfetch\s*\(|\baxios(?:\.\w+)?\s*\(|\bapi(?:Client)?\.(?:\w+\.)*(?:get|fetch|load|retrieve|find|list|request|read|query)\w*\s*\(/;
      const fetchers = new Set();
      for (const b of blocks(source, /\b(?:async\s+function\s+([\w$]+)\s*\([^)]*\)|(?:const|let)\s+([\w$]+)\s*=\s*async\s*\([^)]*\)\s*=>)\s*\{/g)) {
        const name = /function\s+([\w$]+)|(?:const|let)\s+([\w$]+)/.exec(source.masked.slice(b.start, b.open));
        if (name && FETCH.test(b.body)) fetchers.add(name[1] ?? name[2]);
      }
      const calls = fetchers.size ? new RegExp(`\\b(?:${[...fetchers].map(escape).join('|')})\\s*\\(`) : null;
      return blocks(source, /\buseEffect\s*\(\s*(?:async\s*)?(?:\(\s*\)\s*=>|function\s*[\w$]*\s*\(\s*\))\s*\{/g)
        .filter((b) => FETCH.test(b.body) || (calls && calls.test(b.body)))
        .map((b) => ({ line: b.line, message: 'record fetched in useEffect' }));
    },
    good: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default async function OrderPage({ params }) {',
          '  const { id } = await params;',
          '  const order = await getOrder(id);',
          '  if (!order) notFound();',
          '  return <h1>Order {order.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'app/products/[id]/page.tsx',
        code: [
          'export default async function ProductPage({ params }) {',
          '  const { id } = await params;',
          '  const queryClient = getQueryClient();',
          '  void queryClient.prefetchQuery(productByIdOptions(Number(id)));',
          '  return <HydrationBoundary state={dehydrate(queryClient)}><ProductView id={id} /></HydrationBoundary>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/orders/$orderId.tsx',
        code: [
          'function OrderPage() {',
          '  const { orderId } = Route.useParams();',
          '  const { data } = useSuspenseQuery(orderQuery(orderId));',
          '  useEffect(() => { document.getElementById("main")?.focus(); }, [orderId]);',
          '  useEffect(() => { refetch(); }, [orderId]);',
          '  return <h1>{data.number}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          '"use client";',
          'export default function OrderPage({ params }) {',
          '  const [order, setOrder] = useState(null);',
          '  useEffect(() => {',
          '    fetch(`/api/orders/${params.id}`).then((r) => r.json()).then(setOrder);',
          '  }, [params.id]);',
          '  return <h1>{order?.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/pages/customers/[id].tsx',
        code: [
          'export default function CustomerPage() {',
          '  const { id } = useParams();',
          '  const [customer, setCustomer] = useState();',
          '  const load = async () => { const res = await axios.get(`/customers/${id}`); setCustomer(res.data); };',
          '  useEffect(() => { load(); }, [id]);',
          '  return <h1>{customer?.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
  },
  {
    id: 'header-before-record',
    severity: 'warning',
    platform: 'all',
    why: 'The page heading renders before the record is known, so it flashes empty or wrong and then changes to "not found" or an error.',
    fix: 'Render the header only in the ready branch, after the loading, not-found, and error branches have returned.',
    ref: 'Elastic EUI page template, loading and empty states; craft details research, MODEL states',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const m = source.masked;
      const isH1 = (e) => e.tag === 'h1' || str(e, 'as', 'level') === 'h1' || /^1$/.test(str(e, 'level') ?? expr(e, 'level') ?? '');
      const out = [];
      // A heading inside the loading branch.
      for (const g of guards(source)) {
        if (!LOADING_FLAG.test(g.condMasked) || !/^return\s*\(?\s*</.test(bare(g.thenMasked))) continue;
        const h = source.elements.find((e) => e.start >= g.thenStart && e.start < g.thenEnd && isH1(e));
        if (h) out.push({ line: h.line, message: 'h1 rendered in the loading branch' });
      }
      // A heading that reads the record through optional chaining with nothing checking the record first.
      for (const h of source.elements.filter(isH1)) {
        const inner = innerSource(source, h);
        const { names } = bindings(source, h.start);
        const name = [...names].find((n) => new RegExp(`\\b${escape(n)}\\?\\.`).test(inner)) ?? /\b([\w$]+)\.data\?\./.exec(inner)?.[1];
        if (!name) continue;
        const body = enclosing(source, h.start);
        const e = escape(name);
        const before = m.slice(body.start, h.start);
        const checked = new RegExp(`!\\s*${e}\\b|\\b${e}\\s*(?:&&|\\?(?![.?])|===?\\s*(?:null|undefined))`).test(before)
          || guards(source).some((g) => g.index > body.start && g.index < h.start && LOADING_FLAG.test(g.condMasked) && /^(?:return|throw)\b/.test(bare(g.thenMasked)));
        if (!checked) out.push({ line: h.line, message: `h1 reads ${name}?. before the record is checked` });
      }
      return out;
    },
    good: [
      {
        file: 'src/routes/orders/order-detail/order-detail.tsx',
        code: [
          'export const OrderDetail = () => {',
          '  const { id } = useParams();',
          '  const { order, isLoading, isError, error } = useOrder(id);',
          '  if (isError) throw error;',
          '  if (isLoading || !order) return <TwoColumnPageSkeleton mainSections={4} />;',
          '  return (<Container><Heading level="h1">{order.display_id}</Heading><StatusBadge>{order.status}</StatusBadge></Container>);',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default async function OrderPage({ params }) {',
          '  const { id } = await params;',
          '  const order = await getOrder(id);',
          '  if (!order) notFound();',
          '  return <h1>Order {order?.number}</h1>;',
          '}',
        ].join('\n'),
      },
      {
        file: 'src/routes/customers/$customerId.tsx',
        code: [
          'function CustomerPage() {',
          '  const { customerId } = Route.useParams();',
          '  const { data, isPending, isError } = useQuery(customerQuery(customerId));',
          '  if (isPending) return <div aria-busy="true"><Skeleton className="h-8 w-48" /><DetailsSkeleton /></div>;',
          '  if (isError) return <RecordError />;',
          '  return <h1>{data?.name}</h1>;',
          '}',
        ].join('\n'),
      },
    ],
    bad: [
      {
        file: 'src/pages/blog-posts/show.tsx',
        code: [
          'export const BlogPostShow = () => {',
          '  const { query: queryResult } = useShow();',
          '  const { data } = queryResult;',
          '  const record = data?.data;',
          '  return (<div><div className="flex"><Button onClick={() => list("blog_posts")}><ChevronLeft /></Button><h1 className="text-2xl font-bold">{record?.title}</h1></div><Body record={record} /></div>);',
          '};',
        ].join('\n'),
      },
      {
        file: 'app/orders/[id]/page.tsx',
        code: [
          'export default function OrderPage({ params }) {',
          '  const { data: order, isPending } = useQuery(orderQuery(params.id));',
          '  if (isPending) return (<main><h1>Order</h1><OrderSkeleton /></main>);',
          '  return <main><h1>Order {order.number}</h1></main>;',
          '}',
        ].join('\n'),
      },
    ],
  },
];
