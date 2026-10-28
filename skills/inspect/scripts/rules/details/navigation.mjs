import { has, str, expr, attr, ancestors, descendants, inLibraryDir, classOf, innerSource, importsFrom, blocks, isDetailsFile } from '../../lib/helpers.mjs';

// Where a statement that starts at `from` ends in the masked text: a ";" at depth zero, a
// closing bracket that leaves the statement, or a line break at depth zero that is not a continuation.
function statementEnd(m, from) {
  let depth = 0;
  for (let i = from; i < m.length; i++) {
    const c = m[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) return i;
      depth--;
    } else if (depth === 0 && c === ';') return i;
    else if (depth === 0 && c === '\n') {
      const before = m.slice(from, i).trimEnd();
      const after = m.slice(i + 1).trimStart();
      if (!/[=(,?:|&+\-*]$/.test(before) && !/^[.?:|&+\-*]/.test(after) && before.length > 0) return i;
    }
  }
  return m.length;
}

// Every const/let/var declaration: the names it binds and its initialiser, raw and masked.
function declarations(source) {
  const m = source.masked;
  const out = [];
  for (const hit of m.matchAll(/\b(?:const|let|var)\s+(\{[^=;]*?\}|\[[^=;]*?\]|[A-Za-z_$][\w$]*)\s*(?::\s*[^=;]+?)?=(?![=>])/g)) {
    const start = hit.index + hit[0].length;
    const end = statementEnd(m, start);
    const pattern = hit[1];
    const names = pattern.startsWith('{')
      ? [...pattern.slice(1, -1).split(',')].map((part) => part.split(':').pop().split('=')[0].replace(/\.\.\./, '').trim()).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n))
      : [...pattern.matchAll(/[A-Za-z_$][\w$]*/g)].map((x) => x[0]);
    out.push({ names, pattern, rhs: source.text.slice(start, end), masked: m.slice(start, end), index: hit.index });
  }
  return out;
}

// The first argument of an argument list: text up to the first comma outside brackets and template literals.
function firstArg(args) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) return args.slice(0, i);
  }
  return args;
}

const STRINGS = /(['"])(?:\\.|(?!\1)[^\\\n])*\1/g;
const noStrings = (code) => code.replace(STRINGS, '""');
const word = (name) => new RegExp(`(^|[^\\w$.])${name.replace(/\$/g, '\\$')}(?![\\w$])`);

// Names whose value is read from the URL, directly or through other such names.
const URL_READ = /\b(useSearchParams|searchParams|useSearch|useParams|useLocalSearchParams|useGlobalSearchParams|useMatch|useQueryState|useQueryStates|router\.query|params)\b|\blocation\.(search|hash|pathname)\b/;
function urlNames(source, read = URL_READ) {
  const decls = declarations(source);
  const names = new Set();
  for (let pass = 0; pass < 4; pass++) {
    const before = names.size;
    for (const d of decls) {
      if (/\blocation\??\.state\b/.test(d.masked)) continue;
      if (read.test(d.masked) || [...names].some((n) => word(n).test(d.masked))) d.names.forEach((n) => names.add(n));
    }
    if (names.size === before) break;
  }
  return names;
}
const mentionsUrl = (code, names) => URL_READ.test(noStrings(code)) || [...names].some((n) => word(n).test(noStrings(code)));

// The raw text of the arguments of the call whose "(" sits at `open` in the masked text.
function callArgs(source, open) {
  const m = source.masked;
  let depth = 0;
  for (let i = open; i < m.length; i++) {
    if (m[i] === '(') depth++;
    else if (m[i] === ')' && --depth === 0) return source.text.slice(open + 1, i);
  }
  return source.text.slice(open + 1);
}
function calls(source, pattern) {
  return [...source.masked.matchAll(pattern)].map((hit) => ({ index: hit.index, args: callArgs(source, hit.index + hit[0].length - 1) }));
}

// The body of an event handler: the inline function, or the named function or const it refers to.
function handlerBody(source, code) {
  if (!code) return '';
  const name = code.trim();
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return code;
  const esc = name.replace(/\$/g, '\\$');
  const found = [
    ...blocks(source, new RegExp(`\\b(?:const|let|var)\\s+${esc}\\s*=\\s*(?:useCallback\\(\\s*)?(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)\\s*(?::[^=]+)?=>\\s*\\{`, 'g')),
    ...blocks(source, new RegExp(`\\bfunction\\s+${esc}\\s*\\([^)]*\\)\\s*(?::[^{]+)?\\{`, 'g')),
  ];
  if (found.length) return found.map((b) => b.raw).join('\n');
  const decl = declarations(source).find((d) => d.names.length === 1 && d.names[0] === name && /=>/.test(d.masked));
  return decl ? decl.rhs : '';
}

const TABS_ROOT = /^(Tabs|Tabs\.Root|TabsRoot|TabGroup|Tab\.Group)$/;
const TAB_TRIGGER = /^(TabsTrigger|Tab|Tabs\.Tab|Tabs\.Trigger|TabsTab)$/;
const TAB_LIST = /^(TabsList|TabList|Tabs\.List|Tab\.List)$/;
const BACK_ICON = /^(?:Lucide|Icon|Lu|Fi|Hi\d?|Md|Io\w?|Tb|Ri)?(?:Arrow(?:Left|Back)|Chevron(?:Left|Back)|ArrowBackIos)\w*$|^Back\w*Icon$/;
const HISTORY_BACK = /\brouter\.back\s*\(\s*\)|\bnavigate\s*\(\s*-1\s*\)|\bhistory\.(back\s*\(\s*\)|go\s*\(\s*-1\s*\))/;
const OVERLAY_ANCESTOR = /(Dialog|Sheet|Drawer|Modal|Popover|AlertDialog)/;
const CONTROLS = new Set(['button', 'Button', 'IconButton', 'a', 'Link', 'NextLink', 'RouterLink', 'ActionIcon']);

const isBackish = (source, el) => {
  if (/\bback\b/i.test(str(el, 'aria-label', 'title') ?? expr(el, 'aria-label') ?? '')) return true;
  const first = el.children[0];
  if (first && BACK_ICON.test(first.tag) && first.selfClosing) return true;
  const inner = innerSource(source, el).replace(/<[^>]*>/g, ' ');
  return /\bback\b/i.test(inner);
};
const backGuard = (source, path) => isDetailsFile(source, path) || /back[-_]?(button|link)/i.test(path);

const DETAILS_FILE = 'app/orders/[id]/page.tsx';
const ROUTE_FILE = 'src/routes/orders/$orderId.tsx';

export default [
  {
    id: 'tab-default-from-url',
    severity: 'warning',
    platform: 'web',
    why: 'The tab is read from the URL once as an uncontrolled default, so Back and Forward change the URL but not the open tab.',
    fix: 'Control the tabs from the URL: value from the parsed tab param and onValueChange writing it back with replace.',
    ref: 'craft details research, report-implementations D15; Radix Tabs controlled value',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const names = urlNames(source);
      return source.elements
        .filter((el) => TABS_ROOT.test(el.tag) && !has(el, 'value', 'selectedKey', 'selectedIndex') && !(expr(el, 'key') && expr(el, 'key') === expr(el, 'defaultValue', 'defaultSelectedKey', 'defaultIndex')))
        .filter((el) => { const v = expr(el, 'defaultValue', 'defaultSelectedKey', 'defaultIndex'); return v !== undefined && mentionsUrl(v, names); })
        .map((el) => ({ line: el.line, message: `<${el.tag} defaultValue> read from the URL` }));
    },
    good: [
      { file: DETAILS_FILE, code: ['"use client";', 'import { useQueryState, parseAsStringLiteral } from "nuqs";', 'const TABS = ["overview", "activity", "invoices"] as const;', 'export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview"));', '  return <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof TABS)[number])}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger></TabsList></Tabs>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export default function Page({ params }) {', '  const { id } = use(params);', '  return <Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger></TabsList></Tabs>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function Sections({ initial, params }) {', '  const { data } = useQuery(orderQuery(params.id));', '  return <Tabs defaultValue={initial}><TabsList /></Tabs>;', '}'].join('\n') },
      { file: 'components/settings-tabs.tsx', code: 'const a = <Tabs defaultValue={searchParams.get("tab") ?? "general"} />;' },
      { file: 'src/contacts/ContactShow.tsx', code: ['export const ContactShow = () => <ShowBase><ContactShowContentMobile /></ShowBase>;', 'const ContactShowContentMobile = () => {', '  const [searchParams] = useSearchParams();', '  const requestedTab = searchParams.get("tab");', '  const initialTab = requestedTab && TABS.includes(requestedTab) ? requestedTab : "notes";', '  return <Tabs key={initialTab} defaultValue={initialTab} />;', '};'].join('\n') },
    ],
    bad: [
      { file: 'src/companies/CompanyShow.tsx', code: ['export const CompanyShow = () => <ShowBase><CompanyShowContent /></ShowBase>;', 'const CompanyShowContent = () => {', '  const { record } = useShowContext();', '  const tabMatch = useMatch("/companies/:id/show/:tab");', '  const currentTab = tabMatch?.params?.tab || "activity";', '  return <Tabs defaultValue={currentTab} onValueChange={handleTabChange}><TabsList /></Tabs>;', '};'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderView({ id }) {', '  const searchParams = useSearchParams();', '  const { data } = useQuery(orderQuery(id));', '  return <Tabs defaultValue={searchParams.get("tab") ?? "overview"}><TabsList /></Tabs>;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  const { tab } = Route.useSearch();', '  return <Tabs defaultValue={tab}><TabsList /></Tabs>;', '}'].join('\n') },
    ],
  },
  {
    id: 'tab-param-unvalidated',
    severity: 'warning',
    platform: 'web',
    why: 'The tab param is read from the URL and used as is, so a stale or hand-edited link opens a tab that does not exist and shows a blank panel.',
    fix: 'Parse the tab param against the list of tabs (a literal parser, validateSearch with an enum, or an allow-list check) and fall back to the default tab.',
    ref: 'nuqs parseAsStringLiteral; TanStack Router validateSearch; craft details research, report-implementations T16',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      if (/\b(parseAsStringLiteral|parseAsStringEnum|validateSearch|z\.enum|v\.picklist|\.safeParse\s*\(|\.parse\s*\()/.test(source.masked)) return [];
      const out = [];
      const decls = declarations(source);
      const checked = (name) => new RegExp(`\\.(includes|has)\\(\\s*${name}\\b|\\b${name}\\s*(===|!==|==|!=)|(===|!==)\\s*${name}\\b|\\bswitch\\s*\\(\\s*${name}\\b|\\b${name}\\s+in\\s+|\\bis\\w*Tab\\w*\\(\\s*${name}\\b`).test(source.masked);
      for (const m of source.text.matchAll(/\.get\(\s*(['"])tab\1\s*\)|\bsearchParams\??\.tab\b/g)) {
        if (source.masked[m.index] !== '.' && source.masked.slice(m.index, m.index + 12) !== source.text.slice(m.index, m.index + 12)) continue;
        const before = source.masked.slice(Math.max(0, m.index - 80), m.index);
        if (/\.(includes|has)\(\s*[^)]*$|\bis\w*Tab\w*\(\s*[^)]*$/.test(before)) continue;
        const decl = decls.filter((d) => d.index <= m.index && d.rhs.includes(m[0].trim())).pop();
        if (decl && decl.names.some(checked)) continue;
        out.push({ index: m.index, message: 'tab param used without checking it against the tab list' });
      }
      for (const d of decls) {
        if (d.pattern.startsWith('{') && d.names.includes('tab') && /^\s*(await\s+)?(props\.)?searchParams\b/.test(d.masked) && !checked('tab')) out.push({ index: d.index, message: 'tab param used without checking it against the tab list' });
      }
      return out;
    },
    good: [
      { file: DETAILS_FILE, code: ['"use client";', 'const TABS = ["overview", "activity"] as const;', 'export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview"));', '  return <Tabs value={tab} onValueChange={setTab} />;', '}'].join('\n') },
      { file: 'src/contacts/ContactShow.tsx', code: ['const MOBILE_TABS = ["notes", "tasks", "details"];', 'const ContactShowContentMobile = () => {', '  const [searchParams] = useSearchParams();', '  const requestedTab = searchParams.get("tab");', '  const initialTab = requestedTab && MOBILE_TABS.includes(requestedTab) ? requestedTab : "notes";', '  const { record } = useShowContext();', '  return <Tabs value={initialTab} />;', '};'].join('\n') },
      { file: ROUTE_FILE, code: ['export const Route = createFileRoute("/orders/$orderId")({', '  validateSearch: z.object({ tab: z.enum(["overview", "activity"]).catch("overview") }),', '});', 'function OrderPage() { const { orderId } = Route.useParams(); const { tab } = Route.useSearch(); return <Tabs value={tab} />; }'].join('\n') },
      { file: DETAILS_FILE, code: ['export default async function Page({ params, searchParams }) {', '  const { id } = await params;', '  const order = await getOrder(id);', '  const { tab } = await searchParams;', '  const active = TABS.includes(tab) ? tab : "overview";', '  return <OrderTabs id={id} tab={active} />;', '}'].join('\n') },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderView({ id }) {', '  const searchParams = useSearchParams();', '  const { data } = useQuery(orderQuery(id));', '  const tab = searchParams.get("tab") ?? "overview";', '  return <Tabs value={tab} onValueChange={select} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export default async function Page({ params, searchParams }) {', '  const { id } = await params;', '  const order = await getOrder(id);', '  const { tab } = await searchParams;', '  return <OrderTabs id={id} tab={tab ?? "overview"} />;', '}'].join('\n') },
    ],
  },
  {
    id: 'tab-state-pushes-history',
    severity: 'warning',
    platform: 'web',
    why: 'Switching tabs pushes a history entry, so Back steps through tabs instead of returning to the list.',
    fix: 'Write the tab to the URL with replace (nuqs history "replace", router.replace, navigate with replace: true).',
    ref: 'nuqs history option; craft details research, report-engineering (tab uses replace)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const out = [];
      const pushes = (code) => /\brouter\.push\s*\(/.test(code)
        || [...code.matchAll(/\b(navigate|setSearchParams|setSearch)\s*\(/g)].some((m) => !/replace\s*:\s*true/.test(code.slice(m.index, m.index + 300)));
      for (const d of declarations(source)) {
        if (/^\s*useQueryStates?\s*\(\s*(['"`])tab\1/.test(d.rhs) && /history\s*:\s*(['"`])push\1/.test(d.rhs)) out.push({ index: d.index, message: 'tab query state with history: "push"' });
      }
      for (const m of source.text.matchAll(/\brouter\.push\s*\(\s*[`'"][^`'"]*[?&]tab=/g)) out.push({ index: m.index, message: 'router.push for a tab change' });
      for (const c of calls(source, /\bnavigate\s*\(\s*\{/g)) {
        if (/\bsearch\s*:[^]*\btab\b/.test(c.args) && !/replace\s*:\s*true/.test(c.args)) out.push({ index: c.index, message: 'navigate for a tab change without replace' });
      }
      for (const el of source.elements.filter((e) => TABS_ROOT.test(e.tag))) {
        const body = handlerBody(source, expr(el, 'onValueChange', 'onSelectionChange', 'onChange'));
        if (body && pushes(body)) out.push({ line: el.line, message: `<${el.tag}> change handler pushes a history entry` });
      }
      const seen = new Set();
      return out.filter((h) => { const k = h.line ?? source.lineOf(h.index); if (seen.has(k)) return false; seen.add(k); return true; });
    },
    good: [
      { file: DETAILS_FILE, code: ['"use client";', 'export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview"));', '  return <Tabs value={tab} onValueChange={(v) => setTab(v)} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const router = useRouter();', '  const onChange = (v) => router.replace(`?tab=${v}`, { scroll: false });', '  return <Tabs value={tab} onValueChange={onChange} />;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  const navigate = useNavigate();', '  return <Tabs value={tab} onValueChange={(tab) => navigate({ search: (s) => ({ ...s, tab }), replace: true })} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview").withOptions({ history: "replace" }));', '  return <Tabs value={tab} onValueChange={setTab} />;', '}'].join('\n') },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("overview").withOptions({ history: "push" }));', '  return <Tabs value={tab} onValueChange={setTab} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Tabs value={tab} onValueChange={(v) => router.push(`?tab=${v}`)} />;', '}'].join('\n') },
      { file: 'src/companies/CompanyShow.tsx', code: ['export const CompanyShow = () => <ShowBase><CompanyShowContent /></ShowBase>;', 'const CompanyShowContent = () => {', '  const { record } = useShowContext();', '  const navigate = useNavigate();', '  const handleTabChange = (value) => {', '    if (value === currentTab) return;', '    navigate(`/companies/${record?.id}/show/${value}`);', '  };', '  return <Tabs value={currentTab} onValueChange={handleTabChange} />;', '};'].join('\n') },
    ],
  },
  {
    id: 'tab-path-by-index',
    severity: 'warning',
    platform: 'web',
    why: 'Tab paths or values are built from the tab position, so reordering or hiding a tab breaks every shared link to it.',
    fix: 'Give each tab a stable slug and use it as the path and value.',
    ref: 'craft details research, report-implementations D16 (react-admin TabbedShowLayoutTabs)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path) && !/TabbedShowLayout/.test(source.masked)) return [];
      const IDX = '(?:index|idx|i|tabIndex|position)';
      const asString = new RegExp(`^\\s*(?:[\\w$.?]+\\s*(?:\\?\\?|\\|\\|)\\s*)?(?:String\\(\\s*${IDX}\\s*\\)|${IDX}\\.toString\\(\\s*\\)|\`\\$\\{${IDX}\\}\`|${IDX}\\s*\\+\\s*["']{2})\\s*$`);
      const bare = new RegExp(`^\\s*${IDX}\\s*$`);
      return source.elements
        .filter((el) => /Tab|Route/.test(el.tag))
        .filter((el) => { const p = expr(el, 'path', 'to', 'href'); const v = expr(el, 'value'); return (p && (asString.test(p) || bare.test(p))) || (v && asString.test(v)); })
        .map((el) => ({ line: el.line, message: `<${el.tag}> keyed by its index` }));
    },
    good: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList>{TABS.map((t) => <TabsTrigger key={t.slug} value={t.slug}>{t.label}</TabsTrigger>)}</TabsList>;', '}'].join('\n') },
      { file: 'src/posts/PostShow.tsx', code: 'export const PostShow = () => <Show><TabbedShowLayout><TabbedShowLayout.Tab label="Summary" path="summary" /><TabbedShowLayout.Tab label="Comments" path="comments" /></TabbedShowLayout></Show>;' },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Tabs value={index} onChange={(_, i) => setIndex(i)}>{items.map((t, i) => <Tab key={t.id} label={t.label} />)}</Tabs>;', '}'].join('\n') },
    ],
    bad: [
      { file: 'src/posts/PostShow.tsx', code: 'export const PostShow = () => <Show><TabbedShowLayout>{tabs.map((tab, index) => <TabbedShowLayout.Tab key={index} label={tab.label} path={String(index)} />)}</TabbedShowLayout></Show>;' },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList>{sections.map((s, i) => <TabsTrigger key={s.id} value={i.toString()}>{s.label}</TabsTrigger>)}</TabsList>;', '}'].join('\n') },
    ],
  },
  {
    id: 'too-many-tabs',
    severity: 'warning',
    platform: 'web',
    why: 'More than seven tabs overflow on narrow screens and hide where content lives.',
    fix: 'Keep at most seven tabs: merge related ones, move rare ones into sections on an existing tab, or link out to sub-pages.',
    ref: 'Cloudscape tabs, at most seven tabs',
    check: ({ source, path }) => (!isDetailsFile(source, path) ? [] : source.elements
      .filter((el) => TAB_LIST.test(el.tag))
      .map((el) => ({ el, count: descendants(el).filter((d) => TAB_TRIGGER.test(d.tag) && ancestors(d).find((a) => TAB_LIST.test(a.tag)) === el).length }))
      .filter(({ count }) => count > 7)
      .map(({ el, count }) => ({ line: el.line, message: `${count} tabs in one tab list` }))),
    good: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="items">Items</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList>{TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>;', '}'].join('\n') },
      { file: 'components/docs-tabs.tsx', code: `const a = <TabsList>${Array.from({ length: 9 }, (_, i) => `<TabsTrigger value="t${i}">T${i}</TabsTrigger>`).join('')}</TabsList>;` },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', `  return <TabsList>${['overview', 'items', 'payments', 'shipping', 'returns', 'notes', 'files', 'activity'].map((t) => `<TabsTrigger value="${t}">${t}</TabsTrigger>`).join('')}</TabsList>;`, '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', `  return <Tabs><TabList>${Array.from({ length: 9 }, (_, i) => `<Tab id="t${i}">T${i}</Tab>`).join('')}</TabList></Tabs>;`, '}'].join('\n') },
    ],
  },
  {
    id: 'disabled-tab',
    severity: 'warning',
    platform: 'web',
    why: 'A disabled tab hides why its content is unavailable and cannot be focused to learn more.',
    fix: 'Keep the tab enabled and show an empty state inside it that says why there is nothing and what unlocks it.',
    ref: 'Cloudscape tabs, disabled tabs',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      return source.elements
        .filter((el) => (TAB_TRIGGER.test(el.tag) && (has(el, 'disabled', 'isDisabled') && (attr(el, 'disabled', 'isDisabled').value !== 'false'))) || (TABS_ROOT.test(el.tag) && has(el, 'disabledKeys')))
        .map((el) => ({ line: el.line, message: `disabled <${el.tag}>` }));
    },
    good: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Tabs value={tab}><TabsList><TabsTrigger value="invoices">Invoices</TabsTrigger></TabsList><TabsContent value="invoices">{data.invoices.length ? <Invoices /> : <Empty title="No invoices yet" description="Invoices appear once the order ships." />}</TabsContent></Tabs>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList><TabsTrigger value="a" disabled={false}>A</TabsTrigger><Button disabled={!data}>Edit</Button></TabsList>;', '}'].join('\n') },
      { file: 'components/wizard.tsx', code: 'const a = <TabsList><TabsTrigger value="step2" disabled={!step1Done}>Step 2</TabsTrigger></TabsList>;' },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderTabs({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <TabsList><TabsTrigger value="invoices" disabled={!data.invoices.length}>Invoices</TabsTrigger></TabsList>;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  return <Tabs disabledKeys={["returns"]}><TabList><Tab id="returns" isDisabled>Returns</Tab></TabList></Tabs>;', '}'].join('\n') },
    ],
  },
  {
    id: 'back-link-history-back',
    severity: 'warning',
    platform: 'web',
    why: 'Back calls history.back, so a page opened from a link or a new tab leaves the app, and the control cannot be opened in a new tab.',
    fix: 'Render Back as a real link to the list URL, carrying the list query (from a from param or saved list state).',
    ref: 'craft details research, report-engineering (back link as a real anchor)',
    check: ({ source, path }) => {
      if (!backGuard(source, path) || /(^|[\\/])@modal[\\/]/.test(path)) return [];
      return source.elements
        .filter((el) => CONTROLS.has(el.tag) && isBackish(source, el))
        .filter((el) => !ancestors(el).some((a) => OVERLAY_ANCESTOR.test(a.tag)))
        .filter((el) => HISTORY_BACK.test(handlerBody(source, expr(el, 'onClick', 'onPress'))))
        .map((el) => ({ line: el.line, message: `<${el.tag}> Back calls history.back` }));
    },
    good: [
      { file: DETAILS_FILE, code: ['export default async function Page({ params, searchParams }) {', '  const { id } = await params;', '  const order = await getOrder(id);', '  const from = safeListHref(await searchParams);', '  return <Button asChild variant="ghost"><Link href={from ?? "/orders"}><ArrowLeft />Back to orders</Link></Button>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <DialogContent><Button onClick={() => router.back()}><ArrowLeft />Back</Button></DialogContent>;', '}'].join('\n') },
      { file: 'app/@modal/(.)orders/[id]/page.tsx', code: ['export default function Peek({ params }) {', '  const { id } = use(params);', '  return <Button aria-label="Back" onClick={() => router.back()}><X /></Button>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderForm({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Button variant="outline" onClick={() => router.back()}>Cancel</Button>;', '}'].join('\n') },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Button variant="ghost" size="icon" aria-label="Back to orders" onClick={() => router.back()}><ArrowLeft /></Button>;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  const goBack = () => navigate(-1);', '  return <button onClick={goBack}><ChevronLeft /> Back</button>;', '}'].join('\n') },
      { file: 'src/components/back-button.tsx', code: 'export const BackButton = () => <Button onClick={() => window.history.back()}><ArrowLeft />Back</Button>;' },
    ],
  },
  {
    id: 'list-link-drops-query',
    severity: 'warning',
    platform: 'web',
    why: 'Back links to the bare list path, so the filters, sort, and page the user came from are lost.',
    fix: 'Carry the list query back: a from param validated as a same-origin path, or list state restored from the URL serializer.',
    ref: 'craft details research, report-implementations D10',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      if (importsFrom(source, /^(ra-core|react-admin|ra-ui-materialui)$/).length) return [];
      const BARE = /^\/[\w-]+(\/[\w-]+)*\/?$/;
      const out = [];
      for (const el of source.elements) {
        const target = str(el, 'href', 'to');
        const backish = isBackish(source, el) || (el.parent && has(el.parent, 'asChild') && isBackish(source, el.parent));
        if (target && BARE.test(target) && backish && !has(el, 'search', 'query', 'state') && ['a', 'Link', 'NextLink', 'RouterLink', 'Button'].includes(el.tag)) out.push({ line: el.line, message: `Back links to "${target}" without the list query` });
        else if (CONTROLS.has(el.tag) && isBackish(source, el)) {
          const body = handlerBody(source, expr(el, 'onClick'));
          const m = /\b(?:navigate|router\.push|router\.replace)\s*\(\s*(['"])(\/[\w/-]*)\1\s*\)/.exec(body);
          if (m && BARE.test(m[2])) out.push({ line: el.line, message: `Back navigates to "${m[2]}" without the list query` });
        }
      }
      return out;
    },
    good: [
      { file: DETAILS_FILE, code: ['export default async function Page({ params, searchParams }) {', '  const { id } = await params;', '  const order = await getOrder(id);', '  const back = listHref(await searchParams);', '  return <Button asChild variant="ghost"><Link href={back}><ArrowLeft />Back to orders</Link></Button>;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  return <Link to="/orders" search={(prev) => prev}><ChevronLeft />Back</Link>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>;', '}'].join('\n') },
      { file: 'src/posts/PostShow.tsx', code: ['import { useShowController } from "ra-core";', 'export const PostShow = () => { const { record } = useShowController(); return <Link to="/posts"><ArrowLeft />Back</Link>; };'].join('\n') },
    ],
    bad: [
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <Button asChild variant="ghost"><Link href="/orders"><ArrowLeft />Back to orders</Link></Button>;', '}'].join('\n') },
      { file: ROUTE_FILE, code: ['function OrderPage() {', '  const { orderId } = Route.useParams();', '  return <Button aria-label="Back" onClick={() => navigate("/orders")}><ChevronLeft /></Button>;', '}'].join('\n') },
    ],
  },
  {
    id: 'open-redirect-from-param',
    severity: 'error',
    platform: 'all',
    why: 'A redirect target is taken from the URL without checking it, so a crafted link can send users to another site after they act.',
    fix: 'Accept only same-origin relative paths: starts with "/" and not "//" or "/\\", or resolve with new URL against the origin and compare origins; otherwise use the default page.',
    ref: 'OWASP Unvalidated Redirects and Forwards Cheat Sheet; CWE-601',
    check: ({ source }) => {
      const text = source.text;
      if (/startsWith\(\s*(['"`])\/\/\1|startsWith\(\s*(['"`])\/\\\\\2|\(\?!\[?\\?\/|\.origin\s*(===|!==)|(===|!==)\s*[\w$.]*\.origin\b|\b(safeRedirect|isSafeRedirect|sanitizeRedirect|getSafeRedirect|isSafeUrl|isRelativeUrl|validateRedirect|isValidRedirect|safeReturnTo|safeFrom)\w*\s*\(/.test(text)) return [];
      const KEYS = '(?:from|returnTo|return_to|returnUrl|return_url|returnPath|return_path|redirect|redirectTo|redirect_to|redirectUrl|redirect_uri|redirectUri|next|nextPath|next_path|nextUrl|next_url|callbackUrl|callback_url|continue|goto)';
      const directGet = new RegExp(`\\b[\\w$.]*(?:search|params|query|url|URLSearchParams)[\\w$.()]*\\??\\.get\\(\\s*(['"\`])${KEYS}\\1\\s*\\)`, 'i');
      const directMember = new RegExp(`\\b(?:searchParams|router\\.query|search)\\??\\.${KEYS}\\b`);
      const SANITIZER = /\b\w*(safe|Safe|sanitiz|Sanitiz|valid|Valid|isRelative|isInternal|isLocal|SameOrigin)\w*\s*\(/;
      const tainted = new Set();
      const decls = declarations(source);
      for (const d of decls) {
        const rhs = d.rhs;
        if (new RegExp(`^\\s*useQueryState\\s*\\(\\s*(['"\`])${KEYS}\\1`).test(rhs)) { tainted.add(d.names[0]); continue; }
        if (d.pattern.startsWith('{') && /^\s*(await\s+)?(props\.)?(searchParams|useSearch\s*\(|Route\.useSearch\s*\(|useLocalSearchParams\s*[<(]|useGlobalSearchParams\s*[<(]|router\.query|search\b)/.test(rhs)) {
          d.names.filter((n) => new RegExp(`^${KEYS}$`).test(n)).forEach((n) => tainted.add(n));
        }
      }
      for (let pass = 0; pass < 4; pass++) {
        for (const d of decls) {
          if (SANITIZER.test(d.masked)) continue;
          if (d.names.some((n) => tainted.has(n)) && !d.pattern.startsWith('{')) continue;
          const code = noStrings(d.rhs);
          if (directGet.test(d.rhs) || directMember.test(code) || [...tainted].some((n) => word(n).test(code))) {
            if (d.pattern.startsWith('{') || d.pattern.startsWith('[')) continue;
            d.names.forEach((n) => tainted.add(n));
          }
        }
      }
      const VALIDATOR = '\\b(?:is\\w*(?:Valid|Safe|Relative|Internal|Local|SameOrigin)\\w*|(?:safe|validate|sanitiz|assertSafe|check)\\w*)\\s*\\(\\s*';
      for (const n of [...tainted]) if (new RegExp(`${VALIDATOR}${n.replace(/\$/g, '\\$')}\\b`, 'i').test(source.masked)) tainted.delete(n);
      const leads = (code) => directGet.test(code) || directMember.test(noStrings(code)) || [...tainted].some((n) => word(n).test(noStrings(code)));
      // Unsafe when the URL value starts the target; a fixed prefix (a path or an origin) keeps the host fixed.
      const unsafe = (arg) => {
        if (!arg) return false;
        const a = firstArg(arg).trim().replace(/^await\s+/, '').replace(/^(?:decodeURIComponent|decodeURI|String)\s*\(/, '');
        if (SANITIZER.test(noStrings(a))) return false;
        if (a.startsWith('{')) { const m = /\b(?:to|pathname|href|url)\s*:\s*([^,}]+)/.exec(a); return m ? unsafe(m[1]) : false; }
        if (a.startsWith('`')) { const m = /^`\$\{([^}]*)\}/.exec(a); return m ? leads(m[1]) : false; }
        if (/^['"]/.test(a)) return false;
        return leads(a);
      };
      const out = [];
      for (const c of calls(source, /\b(?:router\.(?:push|replace)|permanentRedirect|redirect|navigate|location\.(?:assign|replace)|window\.open)\s*\(/g)) {
        if (unsafe(c.args)) out.push({ index: c.index, message: 'redirect target taken from the URL without a same-origin check' });
      }
      for (const m of source.masked.matchAll(/\b(?:window\.|document\.)?location(?:\.href)?\s*=(?![=>])/g)) {
        const start = m.index + m[0].length;
        if (unsafe(text.slice(start, statementEnd(source.masked, start)))) out.push({ index: m.index, message: 'location set from the URL without a same-origin check' });
      }
      for (const el of source.elements) {
        if (!/^(a|Link|NextLink|Navigate|Redirect|RouterLink)$/.test(el.tag)) continue;
        const target = expr(el, 'href', 'to');
        if (unsafe(target)) out.push({ line: el.line, message: `<${el.tag}> target taken from the URL without a same-origin check` });
      }
      return out;
    },
    good: [
      { file: 'app/login/page.tsx', code: ['"use client";', 'function safeFrom(value) { return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\\\") ? value : "/orders"; }', 'export function LoginForm() {', '  const searchParams = useSearchParams();', '  const from = safeFrom(searchParams.get("from"));', '  const onDone = () => router.push(from);', '}'].join('\n') },
      { file: 'src/routes/login.tsx', code: ['export function Login() {', '  const { redirect } = Route.useSearch();', '  const url = new URL(redirect ?? "/", window.location.origin);', '  const target = url.origin === window.location.origin ? url.pathname + url.search : "/";', '  return <Button onClick={() => navigate({ to: target })}>Continue</Button>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const searchParams = useSearchParams();', '  const tab = searchParams.get("tab");', '  return <Link href={`/orders/${id}/edit?from=${encodeURIComponent(searchParams.toString())}`}>Edit</Link>;', '}'].join('\n') },
      { file: 'hooks/oauth.tsx', code: ['export const useOAuth = () => {', '  const searchParams = useSearchParams();', '  const next_path = searchParams.get("next_path");', '  const start = () => window.location.assign(`${API_BASE_URL}/auth/google/${next_path ? `?next_path=${next_path}` : ``}`);', '};'].join('\n') },
      { file: 'app/page.tsx', code: ['export default function Home() {', '  const searchParams = useSearchParams();', '  const nextPath = searchParams.get("next_path");', '  useEffect(() => { if (nextPath && isValidNextPath(nextPath)) router.replace(nextPath); }, [nextPath]);', '}'].join('\n') },
      { file: 'src/pages/login.tsx', code: ['export function Login() {', '  const location = useLocation();', '  const from = location.state?.from?.pathname || "/";', '  const done = () => navigate(from, { replace: true });', '}'].join('\n') },
    ],
    bad: [
      { file: 'app/login/page.tsx', code: ['"use client";', 'export function LoginForm() {', '  const searchParams = useSearchParams();', '  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";', '  const onDone = () => router.push(callbackUrl);', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderHeader({ id }) {', '  const [from] = useQueryState("from");', '  return <Link href={from ?? "/orders"}>Back</Link>;', '}'].join('\n') },
      { file: 'src/routes/login.tsx', code: ['export function Login() {', '  const { redirect } = Route.useSearch();', '  const done = () => { window.location.href = redirect; };', '}'].join('\n') },
      { file: 'app/(auth)/login.tsx', stack: { platform: 'native' }, code: ['export default function Login() {', '  const { next } = useLocalSearchParams<{ next?: string }>();', '  const done = () => router.replace(next ?? "/");', '}'].join('\n') },
    ],
  },
  {
    id: 'peek-in-component-state',
    severity: 'warning',
    platform: 'web',
    why: 'The record peek opens from component state, so it cannot be linked, survives no reload, and Back does not close it.',
    fix: 'Keep the peeked record id in the URL (a peek query param, or an intercepted route) and open the sheet from that.',
    ref: 'craft details research, report-implementations D13',
    check: ({ source }) => {
      if (/\buseQueryState\s*\(\s*(['"`])(peek|preview|selected|record|id)\w*\1/.test(source.text) || /searchParams\.get\(\s*(['"`])(peek|preview)\1/.test(source.text)) return [];
      const STATE = /^(selected|peek|preview|active|current|viewing|open|focused)\w*(Id|Record|Row|Item|Order|Customer|Contact|Issue|Deal|Ticket|Product|User)?$|^(peek|preview)$/i;
      const states = declarations(source)
        .filter((d) => d.pattern.startsWith('[') && /^\s*(React\.)?useState\s*[<(]/.test(d.rhs) && !/useState\s*(<\s*boolean\s*>)?\(\s*(true|false)\s*\)/.test(d.rhs) && STATE.test(d.names[0] ?? ''))
        .map((d) => d.names[0]);
      if (!states.length) return [];
      const RECORD_VIEW = /(Detail|Details|Show|Peek|Preview|View|Overview|Profile|Record|Panel)$/;
      const NOT_VIEW = /(Edit|Form|Delete|Confirm|Create|New|Picker|Select)/;
      return source.elements
        .filter((el) => /^(Sheet|Drawer|Dialog|Modal|SidePanel|Flyout)$/.test(el.tag))
        .filter((el) => { const o = expr(el, 'open', 'isOpen', 'opened'); return o && states.some((s) => word(s).test(o)) && !/^\s*[\w$]*(is)?open\w*\s*$/i.test(o); })
        .filter((el) => descendants(el).some((d) => RECORD_VIEW.test(d.tag) && !NOT_VIEW.test(d.tag)))
        .map((el) => ({ line: el.line, message: `<${el.tag}> peek opened from component state` }));
    },
    good: [
      { file: 'app/orders/page.tsx', code: ['"use client";', 'export function Orders() {', '  const [peek, setPeek] = useQueryState("peek");', '  return <Sheet open={peek !== null} onOpenChange={(o) => !o && setPeek(null)}><SheetContent><OrderDetails id={peek} /></SheetContent></Sheet>;', '}'].join('\n') },
      { file: 'app/orders/page.tsx', code: ['export function Orders() {', '  const [editing, setEditing] = useState<Order | null>(null);', '  return <Sheet open={!!editing}><SheetContent><OrderEditForm order={editing} /></SheetContent></Sheet>;', '}'].join('\n') },
      { file: 'app/orders/page.tsx', code: ['export function Orders() {', '  const [selectedId, setSelectedId] = useState<string | null>(null);', '  return <Dialog open={!!selectedId}><DialogContent><DeleteOrderConfirm id={selectedId} /></DialogContent></Dialog>;', '}'].join('\n') },
      { file: 'app/orders/page.tsx', code: ['export function Orders() {', '  const [open, setOpen] = useState(false);', '  return <Sheet open={open} onOpenChange={setOpen}><SheetContent><FiltersPanel /></SheetContent></Sheet>;', '}'].join('\n') },
    ],
    bad: [
      { file: 'app/orders/page.tsx', code: ['export function Orders() {', '  const [selectedId, setSelectedId] = useState<string | null>(null);', '  return <Sheet open={!!selectedId} onOpenChange={() => setSelectedId(null)}><SheetContent><OrderDetails id={selectedId} /></SheetContent></Sheet>;', '}'].join('\n') },
      { file: 'src/issues/list.tsx', code: ['export function Issues() {', '  const [peekIssue, setPeekIssue] = React.useState(null);', '  return <Drawer open={peekIssue !== null}><IssuePeekView issue={peekIssue} /></Drawer>;', '}'].join('\n') },
    ],
  },
  {
    id: 'overlay-without-dialog-semantics',
    severity: 'warning',
    platform: 'web',
    why: 'A hand-built overlay panel has no dialog role, so screen readers do not announce it, focus is not trapped, and Escape does not close it.',
    fix: 'Use the library Sheet or Dialog, or give the panel role="dialog", aria-modal, a label, focus management, and Escape to close.',
    ref: 'WAI-ARIA APG Dialog (Modal) pattern; WCAG 4.1.2',
    check: ({ source, path }) => {
      if (inLibraryDir(path)) return [];
      if (!isDetailsFile(source, path) && !/(peek|Peek|preview|Preview|sidePanel|SidePanel|drawer|Drawer)/.test(source.masked)) return [];
      const INTERACTIVE = /^(button|Button|a|Link|input|select|textarea|Input|IconButton)$/;
      const PASSIVE = /(Spinner|Loader|Loading|Skeleton|Icon|Progress|Backdrop|Overlay)$/;
      const decls = declarations(source);
      const portal = /\bcreatePortal\s*\(/.test(source.masked);
      // The class text: the literal, or for className={name} the initialiser of that name.
      const classText = (el) => {
        const c = classOf(el);
        const name = expr(el, 'className', 'class');
        const d = name && /^\s*[A-Za-z_$][\w$]*\s*$/.test(name) ? decls.find((x) => x.names.length === 1 && x.names[0] === name.trim()) : null;
        return d ? `${c} ${d.rhs}` : c;
      };
      const holdsContent = (el) => descendants(el).some((d) => INTERACTIVE.test(d.tag)
        || (/^[A-Z]/.test(d.tag) && !PASSIVE.test(d.tag) && [...d.attrs.keys()].some((k) => k !== 'className' && k !== 'key')));
      return source.elements
        .filter((el) => /^(div|aside|section|nav)$/.test(el.tag) && !has(el, 'aria-modal') && !/^(dialog|alertdialog)$/.test(str(el, 'role') ?? ''))
        .filter((el) => {
          const c = classText(el);
          const style = expr(el, 'style') ?? '';
          const fixed = /(^|[\s"'`])fixed([\s"'`]|$)/.test(c) || /position\s*:\s*['"]fixed['"]/.test(style) || (portal && /(^|[\s"'`])absolute([\s"'`]|$)/.test(c));
          if (!fixed) return false;
          const full = /\binset-0\b/.test(c) || /\binset\s*:\s*0\b/.test(style);
          const side = (/\b(right|left|end|start)-0\b/.test(c) && (/\binset-y-0\b/.test(c) || (/\btop-0\b/.test(c) && /\bbottom-0\b/.test(c)) || /\bh-(full|screen|dvh|svh)\b/.test(c)));
          return ((full || side) && /\bz-(\d+|\[)/.test(c)) || (/position\s*:\s*['"]fixed['"]/.test(style) && /zIndex/.test(style) && /(right|inset)\s*:\s*0/.test(style));
        })
        .filter(holdsContent)
        .filter((el) => !ancestors(el).some((a) => /^[A-Z]/.test(a.tag) && OVERLAY_ANCESTOR.test(a.tag)))
        .map((el) => ({ line: el.line, message: `positioned <${el.tag}> overlay without dialog semantics` }));
    },
    good: [
      { file: 'app/issues/page.tsx', code: ['export function IssuePeek({ id }) {', '  return <Sheet open onOpenChange={close}><SheetContent side="right"><SheetTitle>Issue {id}</SheetTitle><Button onClick={close}>Close</Button></SheetContent></Sheet>;', '}'].join('\n') },
      { file: 'app/issues/peek.tsx', code: ['export function IssuePeek({ id }) {', '  return <div role="dialog" aria-modal="true" aria-labelledby="peek-title" className="fixed inset-y-0 right-0 z-40 w-[480px]"><h2 id="peek-title">Issue</h2><button onClick={close}>Close</button></div>;', '}'].join('\n') },
      { file: 'app/issues/peek.tsx', code: ['export function PeekLoading() {', '  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"><Spinner /></div>;', '}'].join('\n') },
      { file: 'app/orders/[id]/page.tsx', code: ['export function OrderHeader({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <header className="fixed top-0 inset-x-0 z-30 border-b"><Button>Edit</Button></header>;', '}'].join('\n') },
    ],
    bad: [
      { file: 'app/issues/peek.tsx', code: ['export function IssuePeek({ id }) {', '  return <div className="fixed inset-y-0 right-0 z-40 w-[480px] border-l bg-background"><h2>Issue</h2><button onClick={close}>Close</button></div>;', '}'].join('\n') },
      { file: 'components/issues/peek-overview/view.tsx', code: ['export function IssueView({ issueId, peekMode }) {', '  const cls = cn("absolute z-[25] flex flex-col bg-surface-1", { "top-0 right-0 bottom-0 w-full md:w-[50%]": peekMode === "side-peek" });', '  return createPortal(<div className={cls}><IssuePeekOverviewHeader peekMode={peekMode} /></div>, container);', '}'].join('\n') },
      { file: 'app/orders/[id]/page.tsx', code: ['export function OrderPreview({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <div className="fixed inset-0 z-50 bg-background p-6"><OrderBody order={data} /><Button onClick={close}>Close</Button></div>;', '}'].join('\n') },
    ],
  },
  {
    id: 'mobile-tree-swap',
    severity: 'warning',
    platform: 'web',
    why: 'The page renders a separate mobile component tree, so fixes and features land in one version and drift from the other.',
    fix: 'Render one tree and adapt it with responsive classes or container queries; branch only small parts on the viewport.',
    ref: 'craft details research, report-implementations D25 (atomic-crm CompanyShow)',
    check: ({ source, path }) => {
      if (!isDetailsFile(source, path)) return [];
      const names = declarations(source).filter((d) => /^\s*use(IsMobile|Mobile|MediaQuery|IsDesktop|Breakpoint)\w*\s*\(/.test(d.rhs)).flatMap((d) => d.names);
      if (!names.length) return [];
      const m = source.masked;
      const out = [];
      const TREE = /(Mobile|Desktop)/;
      for (const n of names) {
        const e = n.replace(/\$/g, '\\$');
        for (const hit of m.matchAll(new RegExp(`\\b${e}\\s*\\?\\s*\\(?\\s*<\\s*([A-Z][\\w.]*)[^<>]*\\/>\\s*\\)?\\s*:\\s*\\(?\\s*<\\s*([A-Z][\\w.]*)[^<>]*\\/>`, 'g'))) {
          if (hit[1] !== hit[2] && (TREE.test(hit[1]) || TREE.test(hit[2]))) out.push({ index: hit.index, message: `${n} swaps <${hit[1]}> for <${hit[2]}>` });
        }
        for (const hit of m.matchAll(new RegExp(`\\bif\\s*\\(\\s*!?${e}\\s*\\)\\s*\\{?\\s*return\\s*\\(?\\s*<\\s*([A-Z][\\w.]*)`, 'g'))) {
          if (TREE.test(hit[1])) out.push({ index: hit.index, message: `${n} returns a separate <${hit[1]}> tree` });
        }
      }
      return out;
    },
    good: [
      { file: DETAILS_FILE, code: ['export function OrderView({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]"><OrderMain order={data} /><OrderAside order={data} /></div>;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderView({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const isMobile = useIsMobile();', '  return <OrderHeader order={data} compact={isMobile} />;', '}'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderActions({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const isDesktop = useMediaQuery("(min-width: 768px)");', '  return isDesktop ? <Dialog open={open} /> : <Drawer open={open} />;', '}'].join('\n') },
    ],
    bad: [
      { file: 'src/companies/CompanyShow.tsx', code: ['export const CompanyShow = () => {', '  const isMobile = useIsMobile();', '  return <ShowBase>{isMobile ? <CompanyShowContentMobile /> : <CompanyShowContent />}</ShowBase>;', '};'].join('\n') },
      { file: DETAILS_FILE, code: ['export function OrderView({ id }) {', '  const { data } = useQuery(orderQuery(id));', '  const isMobile = useIsMobile();', '  if (isMobile) return <MobileOrderView order={data} />;', '  return <OrderLayout order={data} />;', '}'].join('\n') },
    ],
  },
];
