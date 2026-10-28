import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { has, str, expr, attr, isTrue, ancestors, descendants, classOf, importsFrom, DYNAMIC_SEGMENT } from '../../lib/helpers.mjs';
import { installedVersion } from '../../lib/stack.mjs';

// An Expo Router screen file with a dynamic segment: app/orders/[id].tsx, not a layout, special file, or API route.
const isRecordRoute = (path) => /(^|[\\/])app[\\/]/.test(path) && DYNAMIC_SEGMENT.test(path)
  && !/(^|[\\/])(_layout|\+[\w-]+)\.[jt]sx?$/.test(path) && !/\+api\.[jt]sx?$/.test(path);
const READS_PARAMS = /\buse(?:Local|Global)SearchParams\s*[<(]/;
const LOADS = /\buse(?:Suspense)?(?:Infinite)?Query\s*\(|\buse[A-Z]\w*\(\s*\{\s*variables\b|\buseSWR\s*\(|\bfetch\s*\(|\buseLiveQuery\s*\(/;
const IN_APP = /(^|[\\/])app[\\/]/;
// A screen that shows one record: a dynamic route, or a screen component outside app/ (features/orders/order-screen.tsx)
// that reads route params and loads data.
const isRecordScreen = (source, path) => isRecordRoute(path)
  || (!IN_APP.test(path) && /(screen|detail|details|page)\.[jt]sx?$|[\\/]screens?[\\/]/i.test(path) && READS_PARAMS.test(source.masked) && LOADS.test(source.masked));

// The _layout files that wrap a route, nearest first, up to the app directory, each with the directory route names
// are relative to. A shared group directory such as (home,search) also takes the layouts of (home) and (search).
// Empty when the route file itself is not on disk (rule examples), so examples never read the scanned project.
function layoutsOf(path) {
  const out = [];
  if (!existsSync(resolve(path))) return out;
  const add = (dir, base) => {
    for (const ext of ['tsx', 'ts', 'jsx', 'js']) {
      const file = join(dir, `_layout.${ext}`);
      if (existsSync(file)) {
        try { out.push({ file, dir: base, text: readFileSync(file, 'utf8') }); } catch { /* unreadable layout */ }
      }
    }
  };
  let dir = dirname(resolve(path));
  for (let i = 0; i < 12; i++) {
    add(dir, dir);
    const shared = /^\((.+,.+)\)$/.exec(basename(dir));
    if (shared) for (const group of shared[1].split(',')) add(join(dirname(dir), `(${group.trim()})`), dir);
    if (basename(dir) === 'app' || dirname(dir) === dir) break;
    dir = dirname(dir);
  }
  return out;
}

// The source of the <Stack.Screen> element in a layout that names `segment`, or ''.
function screenEntry(text, segment) {
  const i = text.search(new RegExp(`name\\s*=\\s*\\{?\\s*['"\`]${segment.replace(/[[\]$.()]/g, '\\$&')}['"\`]`));
  if (i < 0) return '';
  const start = Math.max(text.lastIndexOf('<Stack.Screen', i), text.lastIndexOf('<Tabs.Screen', i), 0);
  const next = text.slice(i).search(/<(Stack|Tabs)\.Screen\b|<\/(Stack|Tabs)>/);
  return text.slice(start, next < 0 ? text.length : i + next);
}

// The argument text of every call matching `pattern` (whose match ends at "("), from the raw text.
function calls(source, pattern) {
  const m = source.masked;
  const out = [];
  for (const hit of m.matchAll(pattern)) {
    const open = hit.index + hit[0].length - 1;
    let depth = 0;
    let end = m.length;
    for (let i = open; i < m.length; i++) {
      if (m[i] === '(') depth++;
      else if (m[i] === ')' && --depth === 0) { end = i; break; }
    }
    out.push({ index: hit.index, args: source.text.slice(open + 1, end), masked: m.slice(open + 1, end) });
  }
  return out;
}

// The object literal around position `at`, found by brace depth on the masked text.
function enclosingObject(text, masked, at) {
  let start = -1;
  for (let i = at, depth = 0; i >= 0; i--) {
    if (masked[i] === '}') depth++;
    else if (masked[i] === '{' && depth-- === 0) { start = i; break; }
  }
  if (start < 0) return '';
  for (let i = start, depth = 0; i < masked.length; i++) {
    if (masked[i] === '{') depth++;
    else if (masked[i] === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

const HEADING_IN_CONTENT = /\b(Typography|Text)\.Heading\b|accessibilityRole\s*=\s*\{?\s*['"]header['"]|\brole\s*=\s*\{?\s*['"](heading|header)['"]/;
const PRESSABLE = /^(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button|Link|RectButton|BorderlessButton|ListGroup\.Item)$|\.(Trigger|Item|Action)$/;

const flashCache = new Map();
function flashListMajor(stack) {
  const name = '@shopify/flash-list';
  if (stack.versions?.[name]) return installedVersion(stack.root, name, stack.versions[name]).major;
  if (!flashCache.has(stack.root)) {
    let range = null;
    try {
      const pkg = JSON.parse(readFileSync(join(stack.root, 'package.json'), 'utf8'));
      range = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? null;
    } catch { /* no package.json */ }
    flashCache.set(stack.root, range ? installedVersion(stack.root, name, range).major : null);
  }
  return flashCache.get(stack.root);
}

const ROUTE = 'app/orders/[id].tsx';
const SCREEN = (body, head = []) => [
  'import { Stack, useLocalSearchParams } from "expo-router";',
  ...head,
  'export default function OrderScreen() {',
  '  const { id } = useLocalSearchParams<{ id: string }>();',
  '  const q = useQuery(orderQuery(id));',
  ...body,
  '}',
].join('\n');
const GOOD_SCREEN = SCREEN([
  '  if (q.isPending) return <><Stack.Screen options={{ title: "Order" }} /><OrderSkeleton /></>;',
  '  if (q.isError) return <RecordError status={q.error.status} onRetry={q.refetch} />;',
  '  return <><Stack.Screen options={{ title: q.data.number }} /><OrderBody order={q.data} /></>;',
]) + '\nexport function ErrorBoundary({ error, retry }) { return <ErrorView error={error} onRetry={retry} />; }';

export default [
  {
    id: 'native-global-params-in-record',
    severity: 'warning',
    platform: 'native',
    why: 'useGlobalSearchParams re-renders this screen on every URL change, including while it sits in the background of the stack.',
    fix: 'Read the record id with useLocalSearchParams, which only updates for this screen.',
    ref: 'Expo Router docs, URL parameters (local versus global)',
    check: ({ source, path }) => (!isRecordScreen(source, path) ? [] : [...source.masked.matchAll(/\buseGlobalSearchParams\s*[<(]/g)]
      .map((m) => ({ index: m.index, message: 'useGlobalSearchParams in a record screen' }))),
    good: [
      { file: ROUTE, code: GOOD_SCREEN },
      { file: 'app/_layout.tsx', code: 'export default function Layout() { const { lang } = useGlobalSearchParams(); return <Stack />; }' },
      { file: 'features/orders/order-screen.tsx', code: 'export function OrderScreen() { const { id } = useLocalSearchParams<{ id: string }>(); const q = useQuery(orderQuery(id)); return <OrderBody order={q.data} />; }' },
    ],
    bad: [
      { file: ROUTE, code: 'export default function OrderScreen() { const { id } = useGlobalSearchParams<{ id: string }>(); const q = useQuery(orderQuery(id)); return <OrderBody order={q.data} />; }' },
      { file: 'features/orders/order-screen.tsx', code: 'export function OrderScreen() { const params = useGlobalSearchParams(); const q = useQuery(orderQuery(String(params.id))); return <OrderBody order={q.data} />; }' },
    ],
  },
  {
    id: 'native-params-untyped',
    severity: 'warning',
    platform: 'native',
    why: 'Route params are read without a type, so the id is string | string[] and the screen passes it on unchecked.',
    fix: 'Type the params with a generic, useLocalSearchParams<{ id: string }>(), or the typed route path.',
    ref: 'Expo Router docs, URL parameters and typed routes',
    check: ({ source, path }) => {
      if (!/\.tsx?$/.test(path) || !isRecordScreen(source, path)) return [];
      return [...source.masked.matchAll(/\buse(?:Local|Global)SearchParams\s*\(\s*\)/g)]
        .filter((m) => !/^\s*as\b/.test(source.masked.slice(m.index + m[0].length, m.index + m[0].length + 20)))
        .map((m) => ({ index: m.index, message: 'route params read without a type' }));
    },
    good: [
      { file: ROUTE, code: GOOD_SCREEN },
      { file: ROUTE, code: 'export default function OrderScreen() { const { id } = useLocalSearchParams<"/orders/[id]">(); const q = useQuery(orderQuery(id)); return null; }' },
      { file: 'app/orders/[id].jsx', code: 'export default function OrderScreen() { const { id } = useLocalSearchParams(); const q = useQuery(orderQuery(id)); return null; }' },
    ],
    bad: [
      { file: ROUTE, code: 'export default function OrderScreen() { const { id } = useLocalSearchParams(); const q = useQuery(orderQuery(id as string)); return null; }' },
      { file: 'features/orders/order-screen.tsx', code: 'export function OrderScreen() { const params = useLocalSearchParams(); const q = useQuery(orderQuery(String(params.id))); return null; }' },
    ],
  },
  {
    id: 'native-record-no-error-boundary',
    severity: 'warning',
    platform: 'native',
    why: 'The record route exports no ErrorBoundary and no layout above it does, so a render error crashes the app with no message and no retry.',
    fix: 'Export ErrorBoundary({ error, retry }) from the route (or its layout) with a message and a Retry button; keep query errors as in-screen states.',
    ref: 'Expo Router docs, error handling (route ErrorBoundary export)',
    check: ({ source, path }) => {
      if (!isRecordRoute(path)) return [];
      if (!/\bexport\s+default\b|\bas\s+default\b/.test(source.masked)) return [];
      if (/\bexport\s+(?:async\s+)?(?:function|const|let|class)\s+ErrorBoundary\b|\bexport\s*\{[^}]*\bErrorBoundary\b/.test(source.masked)) return [];
      if (layoutsOf(path).some((l) => /\bErrorBoundary\b|\bscreenErrorBoundary\b/.test(l.text))) return [];
      const m = /\bexport\s+default\b|\bas\s+default\b/.exec(source.masked);
      return [{ index: m.index, message: 'record route without an ErrorBoundary export' }];
    },
    good: [
      { file: ROUTE, code: GOOD_SCREEN },
      { file: ROUTE, code: ['export { ErrorBoundary } from "expo-router";', 'export default function OrderScreen() { const { id } = useLocalSearchParams<{ id: string }>(); return <OrderBody id={id} />; }'].join('\n') },
      { file: 'app/orders/index.tsx', code: 'export default function Orders() { const q = useQuery(ordersQuery()); return <OrderList data={q.data} />; }' },
      { file: 'app/orders/[id]/_layout.tsx', code: 'export default function Layout() { return <Stack />; }' },
    ],
    bad: [
      { file: ROUTE, code: SCREEN(['  return <><Stack.Screen options={{ title: q.data?.number ?? "Order" }} /><OrderBody order={q.data} /></>;']) },
      { file: 'src/app/feed/[id].tsx', code: "export { PostDetailScreen as default } from '@/features/feed/post-detail-screen';" },
    ],
  },
  {
    id: 'native-record-no-title',
    severity: 'warning',
    platform: 'native',
    why: 'The record screen sets no header title, so the header shows the route name and VoiceOver announces no screen title.',
    fix: 'Set the title with <Stack.Screen options={{ title }} /> (a type-only title while loading, the record name once loaded).',
    ref: 'Expo Router docs, Stack screen options; craft details research, report-native',
    check: ({ source, path }) => {
      if (!isRecordScreen(source, path) || !LOADS.test(source.masked)) return [];
      if (/\b(title|headerTitle)\s*:|\bStack\.Title\b|\bheaderShown\s*:\s*false\b|\bsetOptions\s*\(/.test(source.masked)) return [];
      if (!source.elements.length) return [];
      if (isRecordRoute(path)) {
        const name = basename(path).replace(/\.[jt]sx?$/, '');
        for (const l of layoutsOf(path)) {
          const parts = relative(l.dir, resolve(dirname(path))).split(/[\\/]/).filter(Boolean);
          const segments = [parts.concat(name).join('/'), ...(name === 'index' && parts.length ? [parts.join('/')] : [])];
          if (segments.some((seg) => /\b(title|headerTitle)\s*:|headerShown\s*:\s*false/.test(screenEntry(l.text, seg)))) return [];
        }
      }
      const m = LOADS.exec(source.masked);
      return [{ index: m.index, message: 'record screen without a header title' }];
    },
    good: [
      { file: ROUTE, code: GOOD_SCREEN },
      { file: ROUTE, code: SCREEN(['  return <><Stack.Title>{q.data?.number ?? "Order"}</Stack.Title><OrderBody order={q.data} /></>;']) },
      { file: ROUTE, code: SCREEN(['  const navigation = useNavigation();', '  useEffect(() => { navigation.setOptions({ title: q.data?.number ?? "Order" }); }, [q.data]);', '  return <OrderBody order={q.data} />;']) },
      { file: 'app/orders/index.tsx', code: 'export default function Orders() { const q = useQuery(ordersQuery()); return <OrderList data={q.data} />; }' },
    ],
    bad: [
      { file: ROUTE, code: SCREEN(['  return <ScrollView><OrderBody order={q.data} /></ScrollView>;']) },
      { file: 'features/orders/order-screen.tsx', code: 'export function OrderScreen() { const { id } = useLocalSearchParams<{ id: string }>(); const q = useQuery(orderQuery(id)); return <View><Text>{q.data?.number}</Text></View>; }' },
    ],
  },
  {
    id: 'native-alert-destructive-ok',
    severity: 'warning',
    platform: 'native',
    why: 'The destructive Alert button says OK or Yes, and Android ignores the destructive style, so nothing tells the user what will be lost.',
    fix: 'Label the destructive button with the verb and object, such as "Delete order", next to a Cancel button with style "cancel".',
    ref: 'React Native docs, Alert (button style is iOS only); Apple HIG, alerts',
    check: ({ source }) => calls(source, /\bAlert\.alert\s*\(/g).flatMap((c) => [...c.args.matchAll(/\bstyle\s*:\s*['"]destructive['"]/g)]
      .filter((m) => /\btext\s*:\s*['"](OK|Ok|Okay|Yes|Confirm|Sure|Continue|Proceed|Accept|Done)['"]/.test(enclosingObject(c.args, c.masked, m.index)))
      .map(() => ({ index: c.index, message: 'destructive Alert button labelled with a generic word' }))),
    good: [
      { code: 'Alert.alert("Delete order 1042?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "Delete order", style: "destructive", onPress: remove }]);' },
      { code: 'Alert.alert("Saved", "Your changes are saved.", [{ text: "OK" }]);' },
      { code: 'Alert.alert(t("orders.delete.title"), undefined, [{ text: t("common.cancel"), style: "cancel" }, { text: t("orders.delete.confirm"), style: "destructive", onPress: remove }]);' },
    ],
    bad: [
      { code: 'Alert.alert("Delete order?", "This cannot be undone.", [{ text: "Cancel", style: "cancel" }, { text: "OK", style: "destructive", onPress: remove }]);' },
      { code: 'Alert.alert("Are you sure?", "", [{ text: "No", style: "cancel" }, { style: "destructive", text: "Yes", onPress: () => archive(id) }]);' },
      { code: 'Alert.alert("Remove member?", undefined, [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: async () => { await remove(id); router.back(); }, style: "destructive" }]);' },
    ],
  },
  {
    id: 'native-chevron-without-press',
    severity: 'warning',
    platform: 'native',
    why: 'A ListGroup item shows the default chevron but does nothing on press, so the row promises navigation it does not have.',
    fix: 'Give the item onPress (or wrap it in Link asChild), or pass non-chevron content to ItemSuffix, or use a plain View row for read-only values.',
    ref: 'HeroUI Native ListGroup (ItemSuffix renders a chevron by default)',
    check: ({ source }) => source.elements
      .filter((el) => el.tag === 'ListGroup.Item' && el.spreads.length === 0 && !has(el, 'onPress', 'onLongPress', 'href'))
      .filter((el) => !ancestors(el).some((a) => (a.tag === 'Link' && has(a, 'asChild')) || /^(Pressable|Touchable\w*)$/.test(a.tag)))
      .filter((el) => descendants(el).some((d) => d.tag === 'ListGroup.ItemSuffix' && d.selfClosing && !has(d, 'children')))
      .map((el) => ({ line: el.line, message: 'ListGroup.Item with a chevron and no onPress' })),
    good: [
      { code: 'const a = <ListGroup><ListGroup.Item onPress={() => router.push(`/orders/${id}/customer`)}><ListGroup.ItemContent><ListGroup.ItemTitle>Customer</ListGroup.ItemTitle></ListGroup.ItemContent><ListGroup.ItemSuffix /></ListGroup.Item></ListGroup>;' },
      { code: 'const a = <Link href={`/orders/${id}/items`} asChild><ListGroup.Item><ListGroup.ItemContent><ListGroup.ItemTitle>Items</ListGroup.ItemTitle></ListGroup.ItemContent><ListGroup.ItemSuffix /></ListGroup.Item></Link>;' },
      { code: 'const a = <ListGroup.Item><ListGroup.ItemContent><ListGroup.ItemTitle>Status</ListGroup.ItemTitle></ListGroup.ItemContent><ListGroup.ItemSuffix><Chip>{status}</Chip></ListGroup.ItemSuffix></ListGroup.Item>;' },
    ],
    bad: [
      { code: 'const a = <ListGroup><ListGroup.Item><ListGroup.ItemContent><ListGroup.ItemTitle>Status</ListGroup.ItemTitle><ListGroup.ItemDescription>{order.status}</ListGroup.ItemDescription></ListGroup.ItemContent><ListGroup.ItemSuffix /></ListGroup.Item></ListGroup>;' },
      { code: 'const a = <ListGroup.Item className="py-3"><ListGroup.ItemTitle>Total</ListGroup.ItemTitle><ListGroup.ItemSuffix iconProps={{ size: 18 }} /></ListGroup.Item>;' },
    ],
  },
  {
    id: 'native-heading-without-role',
    severity: 'warning',
    platform: 'native',
    why: 'Text is styled as a heading but has no header role, so screen-reader users cannot jump between sections with the headings rotor.',
    fix: 'Use Typography.Heading, or add accessibilityRole="header" to the heading Text.',
    ref: 'React Native docs, accessibilityRole header; HeroUI Native Typography.Heading',
    check: ({ source }) => {
      const heroText = importsFrom(source, /^heroui-native(-pro)?$/).some((i) => /\bText\b/.test(i.names));
      const ROLE = (el) => has(el, 'accessibilityRole', 'role');
      return source.elements
        .filter((el) => !ROLE(el) && !ancestors(el).some((a) => PRESSABLE.test(a.tag)))
        .filter((el) => {
          if ((el.tag === 'Typography' || (el.tag === 'Text' && heroText)) && /^h[1-6]$/.test(str(el, 'type', 'variant') ?? '')) return true;
          if (el.tag !== 'Text') return false;
          const literal = el.children.length === 0 && el.text.trim().length >= 2 && el.text.trim().length <= 60 && !/[{]/.test(el.text) && !/\d/.test(el.text);
          if (!literal || el.selfClosing) return false;
          const inner = source.text.slice(el.end, source.text.indexOf('</', el.end));
          if (/[{}]/.test(inner)) return false;
          const c = classOf(el);
          const style = expr(el, 'style') ?? '';
          const big = /\btext-(xl|[2-9]xl)\b/.test(c) || /fontSize\s*:\s*(2\d|[3-9]\d)\b/.test(style);
          const bold = /\bfont-(semibold|bold|extrabold|black)\b/.test(c) || /fontWeight\s*:\s*['"]?(bold|[6-9]00)['"]?/.test(style);
          return big && bold;
        })
        .map((el) => ({ line: el.line, message: `heading-styled <${el.tag}> without a header role` }));
    },
    good: [
      { code: ['import { Typography } from "heroui-native";', 'const a = <Typography.Heading type="h2">Shipping</Typography.Heading>;'].join('\n') },
      { code: 'const a = <Text accessibilityRole="header" className="text-xl font-semibold">Shipping</Text>;' },
      { code: 'const a = <Text className="text-2xl font-bold">{formatMoney(order.total)}</Text>;' },
      { code: 'const a = <Pressable onPress={save}><Text className="text-xl font-semibold">Save</Text></Pressable>;' },
    ],
    bad: [
      { code: ['import { Typography } from "heroui-native";', 'const a = <Typography type="h2">Shipping</Typography>;'].join('\n') },
      { code: 'const a = <View><Text className="text-xl font-semibold">Shipping address</Text><AddressRows /></View>;' },
      { code: 'const a = <Text style={{ fontSize: 22, fontWeight: "700" }}>Line items</Text>;' },
    ],
  },
  {
    id: 'native-set-accessibility-focus',
    severity: 'warning',
    platform: 'native',
    why: 'AccessibilityInfo.setAccessibilityFocus is deprecated and unreliable on recent React Native versions.',
    fix: 'Move focus with AccessibilityInfo.sendAccessibilityEvent(ref, "focus") on an accessible target.',
    ref: 'React Native docs, AccessibilityInfo (setAccessibilityFocus deprecated)',
    check: ({ source }) => [...source.masked.matchAll(/\bAccessibilityInfo\.setAccessibilityFocus\s*\(/g)].map((m) => ({ index: m.index, message: 'setAccessibilityFocus is deprecated' })),
    good: [
      { code: 'useEffect(() => { if (q.isSuccess && titleRef.current) AccessibilityInfo.sendAccessibilityEvent(titleRef.current, "focus"); }, [q.isSuccess]);' },
      { code: 'AccessibilityInfo.announceForAccessibility("Order deleted");' },
      { code: '// AccessibilityInfo.setAccessibilityFocus(tag) was replaced\nAccessibilityInfo.sendAccessibilityEvent(ref.current, "focus");' },
    ],
    bad: [
      { code: 'const tag = findNodeHandle(ref.current); if (tag) AccessibilityInfo.setAccessibilityFocus(tag);' },
      { code: 'useEffect(() => { AccessibilityInfo.setAccessibilityFocus(findNodeHandle(headerRef.current)); }, []);' },
    ],
  },
  {
    id: 'native-font-scaling-off',
    severity: 'warning',
    platform: 'native',
    why: 'Font scaling is turned off or capped at 1, so text ignores the user\'s Dynamic Type or font size setting.',
    fix: 'Leave font scaling on; if a layout breaks at large sizes, cap with maxFontSizeMultiplier above 1 (such as 1.5) and let rows stack.',
    ref: 'React Native docs, Text allowFontScaling and maxFontSizeMultiplier; WCAG 1.4.4 Resize Text',
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        const a = attr(el, 'allowFontScaling');
        if (a && a.value === 'false') out.push({ line: el.line, message: `allowFontScaling={false} on <${el.tag}>` });
        const m = attr(el, 'maxFontSizeMultiplier');
        if (m && /^\s*(0(\.\d+)?|1(\.0+)?)\s*$/.test(m.value)) out.push({ line: el.line, message: `maxFontSizeMultiplier={${m.value}} on <${el.tag}>` });
      }
      for (const m of source.masked.matchAll(/\ballowFontScaling\s*(?::|=(?!=))\s*false\b|\bmaxFontSizeMultiplier\s*:\s*(?:0(?:\.\d+)?|1(?:\.0+)?)(?![\d.])/g)) {
        out.push({ index: m.index, message: 'font scaling turned off in shared text props' });
      }
      return out;
    },
    good: [
      { code: 'const a = <Text maxFontSizeMultiplier={1.5} numberOfLines={2}>{order.customer.name}</Text>;' },
      { code: 'const a = <HeroUINativeProvider config={{ textProps: { maxFontSizeMultiplier: 1.6 } }}><App /></HeroUINativeProvider>;' },
      { code: 'const a = <Text allowFontScaling>{label}</Text>;' },
    ],
    bad: [
      { code: 'const a = <Text allowFontScaling={false} className="text-xs">{order.status}</Text>;' },
      { code: 'const a = <Text maxFontSizeMultiplier={1}>{total}</Text>;' },
      { code: 'const a = <HeroUINativeProvider config={{ textProps: { allowFontScaling: false } }}><App /></HeroUINativeProvider>;' },
      { code: 'Text.defaultProps.allowFontScaling = false;' },
    ],
  },
  {
    id: 'native-focus-effect-without-callback',
    severity: 'warning',
    platform: 'native',
    why: 'useFocusEffect receives a new function on every render, so the effect and its cleanup run on every render while the screen is focused.',
    fix: 'Wrap the effect in useCallback with its dependencies: useFocusEffect(useCallback(() => { ... }, [deps])).',
    ref: 'React Navigation 7 docs, useFocusEffect',
    check: ({ source }) => {
      const memo = (name) => new RegExp(`\\b(?:const|let)\\s+${name}\\s*=\\s*(?:React\\.)?useCallback\\s*\\(`).test(source.masked);
      return calls(source, /\buseFocusEffect\s*\(/g)
        .filter((c) => {
          const a = c.masked.trim();
          if (/^(React\.)?useCallback\s*\(/.test(a)) return false;
          const id = /^([A-Za-z_$][\w$]*)\s*$/.exec(a);
          if (id) return !memo(id[1]) && new RegExp(`\\b(?:const|let)\\s+${id[1]}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)\\s*=>|\\bfunction\\s+${id[1]}\\b`).test(source.masked);
          return /^(async\s*)?(\([^)]*\)|[\w$]+)\s*=>|^(async\s+)?function\b/.test(a);
        })
        .map((c) => ({ index: c.index, message: 'useFocusEffect without useCallback' }));
    },
    good: [
      { code: 'useFocusEffect(useCallback(() => { refetch(); }, [refetch]));' },
      { code: 'useFocusEffect(React.useCallback(() => { const sub = AppState.addEventListener("change", onChange); return () => sub.remove(); }, []));' },
      { code: 'const onFocus = useCallback(() => { refetch(); }, [refetch]);\nuseFocusEffect(onFocus);' },
    ],
    bad: [
      { code: 'useFocusEffect(() => { refetch(); });' },
      { code: 'useFocusEffect(function onFocus() { queryClient.invalidateQueries({ queryKey: ["orders", id] }); });' },
      { code: 'const onFocus = () => { refetch(); };\nuseFocusEffect(onFocus);' },
    ],
  },
  {
    id: 'native-undo-toast-short',
    severity: 'warning',
    platform: 'native',
    why: 'An undo toast uses the default duration of about four seconds, too short to read the message and reach the Undo button.',
    fix: 'Give undo toasts a longer duration (8000 ms or "persistent") and announce the change for screen readers.',
    ref: 'HeroUI Native Toast (duration default 4000); WCAG 2.2.1 Timing Adjustable',
    check: ({ source }) => calls(source, /\b(?:toast(?:\.\w+)?|Toast\.show)\s*\(/g)
      .filter((c) => /\b(actionLabel|label|text)\s*:\s*[^,}]*undo/i.test(c.args) || /['"`]undo['"`]/i.test(c.args))
      .filter((c) => { const d = /\bduration\s*:\s*([^,}\s]+)/.exec(c.args); return !d || (/^\d+$/.test(d[1]) && Number(d[1]) < 6000); })
      .map((c) => ({ index: c.index, message: 'undo toast with a short duration' })),
    good: [
      { code: 'toast.show({ label: "Order archived", actionLabel: "Undo", onActionPress: ({ hide }) => { restore(); hide(); }, duration: 8000 });' },
      { code: 'toast.show({ label: "Link copied", variant: "success" });' },
      { code: 'toast.show({ label: "Order archived", actionLabel: t("common.undo"), onActionPress: restore, duration: "persistent" });' },
    ],
    bad: [
      { code: 'toast.show({ label: "Order archived", actionLabel: "Undo", onActionPress: ({ hide }) => { restore(); hide(); } });' },
      { code: 'toast.show({ label: "Item removed", actionLabel: "Undo", onActionPress: restore, duration: 3000 });' },
    ],
  },
  {
    id: 'native-menu-presentation-mismatch',
    severity: 'warning',
    platform: 'native',
    why: 'The root and its Content use different presentation modes, which HeroUI Native rejects at runtime.',
    fix: 'Set the same presentation on the root (Menu, Popover, Select) and its Content.',
    ref: 'HeroUI Native Menu and Popover docs (presentation must match the root)',
    check: ({ source }) => {
      const out = [];
      for (const root of source.elements.filter((el) => /^(Menu|Popover|Select)$/.test(el.tag))) {
        const content = descendants(root).find((d) => d.tag === `${root.tag}.Content`);
        if (!content) continue;
        const value = (el) => (str(el, 'presentation') ?? (has(el, 'presentation') ? null : 'popover'));
        const a = value(root);
        const b = value(content);
        if (a !== null && b !== null && a !== b) out.push({ line: content.line, message: `<${root.tag}> presentation "${a}" but <${content.tag}> "${b}"` });
      }
      return out;
    },
    good: [
      { code: 'const a = <Menu presentation="bottom-sheet"><Menu.Trigger><Button>More</Button></Menu.Trigger><Menu.Portal><Menu.Overlay /><Menu.Content presentation="bottom-sheet"><Menu.Item variant="danger">Delete order</Menu.Item></Menu.Content></Menu.Portal></Menu>;' },
      { code: 'const a = <Menu><Menu.Trigger><Button>More</Button></Menu.Trigger><Menu.Portal><Menu.Content presentation="popover" width={220}><Menu.Item>Copy ID</Menu.Item></Menu.Content></Menu.Portal></Menu>;' },
      { code: 'const a = <Popover presentation={mode}><Popover.Content presentation={mode} /></Popover>;' },
    ],
    bad: [
      { code: 'const a = <Menu><Menu.Trigger><Button>More</Button></Menu.Trigger><Menu.Portal><Menu.Content presentation="bottom-sheet"><Menu.Item>Copy ID</Menu.Item></Menu.Content></Menu.Portal></Menu>;' },
      { code: 'const a = <Popover presentation="bottom-sheet"><Popover.Trigger /><Popover.Portal><Popover.Content presentation="popover" /></Popover.Portal></Popover>;' },
    ],
  },
  {
    id: 'native-divider-import',
    severity: 'error',
    platform: 'native',
    why: 'heroui-native has no Divider export (it was renamed Separator), so this import is undefined and the screen fails to render.',
    fix: 'Import Separator from heroui-native instead of Divider.',
    ref: 'HeroUI Native changelog, Divider renamed to Separator',
    check: ({ source }) => importsFrom(source, /^heroui-native$/)
      .filter((i) => (/\{([^}]*)\}/.exec(i.names)?.[1] ?? '').split(',').some((n) => n.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '') === 'Divider'))
      .map((i) => ({ line: i.line, message: 'Divider imported from heroui-native' })),
    good: [
      { code: 'import { Card, Separator } from "heroui-native";\nconst a = <Card><Separator /></Card>;' },
      { code: 'import { Divider } from "@/components/divider";\nconst a = <Divider />;' },
      { code: 'import { ListGroup, Separator as Divider } from "heroui-native";\nconst a = <Divider />;' },
    ],
    bad: [
      { code: 'import { Card, Divider } from "heroui-native";\nconst a = <Card><Divider /></Card>;' },
      { code: 'import { Divider } from "heroui-native";\nconst a = <Divider className="my-2" />;' },
    ],
  },
  {
    id: 'native-flashlist-estimate',
    severity: 'warning',
    platform: 'native',
    when: (stack) => (flashListMajor(stack) ?? 0) >= 2,
    why: 'FlashList 2 measures items itself and ignores estimatedItemSize, so the prop is dead code left from version 1.',
    fix: 'Remove estimatedItemSize (and estimatedListSize) when on FlashList 2.',
    ref: 'FlashList v2 changes (estimatedItemSize deprecated)',
    check: ({ source }) => source.elements
      .filter((el) => /FlashList$/.test(el.tag) && has(el, 'estimatedItemSize'))
      .map((el) => ({ line: el.line, message: 'estimatedItemSize on FlashList 2' })),
    good: [
      { stack: { versions: { '@shopify/flash-list': '^2.3.3' } }, code: 'const a = <FlashList data={events} renderItem={renderEvent} keyExtractor={(e) => e.id} />;' },
      { stack: { versions: { '@shopify/flash-list': '^1.7.6' } }, code: 'const a = <FlashList data={events} renderItem={renderEvent} estimatedItemSize={72} />;' },
      { code: 'const a = <FlashList data={events} renderItem={renderEvent} estimatedItemSize={72} />;' },
    ],
    bad: [
      { stack: { versions: { '@shopify/flash-list': '^2.3.3' } }, code: 'const a = <FlashList data={events} renderItem={renderEvent} estimatedItemSize={72} />;' },
      { stack: { versions: { '@shopify/flash-list': '2.0.2' } }, code: 'const a = <Animated.FlashList data={rows} renderItem={renderRow} estimatedItemSize={56} />;' },
    ],
  },
  {
    id: 'native-list-in-scrollview',
    severity: 'warning',
    platform: 'native',
    why: 'A virtualized list sits inside a ScrollView with the same orientation, so virtualization is off and every row renders at once.',
    fix: 'Make the whole screen one list (header and properties in ListHeaderComponent), or render a few rows inline with a "See all" link.',
    ref: 'React Native docs, VirtualizedList nested in ScrollView warning',
    check: ({ source }) => source.elements
      .filter((el) => /^(FlatList|FlashList|SectionList|LegendList|Animated\.FlatList|Animated\.FlashList)$/.test(el.tag) && attr(el, 'scrollEnabled')?.value !== 'false')
      .filter((el) => {
        const scroller = ancestors(el).find((a) => /(^|\.)(ScrollView|KeyboardAwareScrollView|ParallaxScrollView)$/.test(a.tag));
        return scroller && isTrue(scroller, 'horizontal') === isTrue(el, 'horizontal');
      })
      .map((el) => ({ line: el.line, message: `<${el.tag}> inside a ScrollView with the same orientation` })),
    good: [
      { code: 'const a = <FlashList data={events} renderItem={renderEvent} ListHeaderComponent={<OrderHeader order={order} />} />;' },
      { code: 'const a = <ScrollView><OrderHeader /><FlatList horizontal data={photos} renderItem={renderPhoto} /></ScrollView>;' },
      { code: 'const a = <ScrollView><OrderHeader /><FlatList scrollEnabled={false} data={events.slice(0, 5)} renderItem={renderEvent} /><Link href={`/orders/${id}/activity`}>See all</Link></ScrollView>;' },
    ],
    bad: [
      { code: 'const a = <ScrollView><OrderHeader /><FlatList data={events} renderItem={renderEvent} /></ScrollView>;' },
      { code: 'const a = <KeyboardAwareScrollView><View><FlashList data={rows} renderItem={renderRow} /></View></KeyboardAwareScrollView>;' },
    ],
  },
  {
    id: 'native-formsheet-header-android',
    severity: 'warning',
    platform: 'native',
    why: 'The formSheet sets its title and header buttons in screen options, which Android drops for sheets, so on Android the sheet has no title.',
    fix: 'Render the title as a heading inside the sheet content (Typography.Heading) and put its actions in the content too.',
    ref: 'Expo Router docs, modals (formSheet header on Android); craft details research, report-native',
    check: ({ source, path }) => {
      const HEADER_OPTS = /\b(title|headerTitle|headerRight|headerLeft)\s*:/;
      const out = [];
      const sheetScreens = source.elements.filter((el) => el.tag === 'Stack.Screen' && /presentation\s*:\s*['"]formSheet['"]/.test(expr(el, 'options') ?? '') && HEADER_OPTS.test(expr(el, 'options') ?? ''));
      for (const el of sheetScreens) {
        if (/(^|[\\/])_layout\.[jt]sx?$/.test(path)) {
          const name = str(el, 'name');
          if (!name) continue;
          const base = join(dirname(resolve(path)), name);
          const file = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.jsx'].map((ext) => base + ext).find((f) => existsSync(f));
          if (!file) continue;
          let text = '';
          try { text = readFileSync(file, 'utf8'); } catch { continue; }
          if (!HEADING_IN_CONTENT.test(text) && !/\bPlatform\.(OS|select)\b/.test(text)) out.push({ line: el.line, message: `formSheet "${name}" titled only in screen options` });
        } else if (!HEADING_IN_CONTENT.test(source.text) && !/\bPlatform\.(OS|select)\b/.test(source.masked)) {
          out.push({ line: el.line, message: 'formSheet titled only in screen options' });
        }
      }
      return out;
    },
    good: [
      { file: 'app/orders/[id]/peek.tsx', code: ['import { Typography } from "heroui-native";', 'export default function OrderPeek() {', '  const { id } = useLocalSearchParams<{ id: string }>();', '  return <View><Stack.Screen options={{ presentation: "formSheet", sheetAllowedDetents: [0.5, 1], title: "Order" }} /><Typography.Heading type="h2">Order {id}</Typography.Heading></View>;', '}'].join('\n') },
      { file: 'app/orders/[id]/peek.tsx', code: ['export default function OrderPeek() {', '  return <View><Stack.Screen options={{ presentation: "formSheet", headerShown: false }} /><OrderSummary /></View>;', '}'].join('\n') },
      { file: 'app/orders/_layout.tsx', code: 'export default function Layout() { return <Stack><Stack.Screen name="[id]/peek" options={{ presentation: "formSheet", title: "Order" }} /></Stack>; }' },
    ],
    bad: [
      { file: 'app/orders/[id]/peek.tsx', code: ['export default function OrderPeek() {', '  const { id } = useLocalSearchParams<{ id: string }>();', '  return <View><Stack.Screen options={{ presentation: "formSheet", sheetAllowedDetents: [0.5, 1], title: "Order", headerRight: () => <ShareButton /> }} /><OrderSummary id={id} /></View>;', '}'].join('\n') },
      { file: 'app/notes/[id].tsx', code: ['export default function NotePeek() {', '  return <><Stack.Screen options={{ presentation: "formSheet", headerTitle: "Note" }} /><Text className="text-base">{note.body}</Text></>;', '}'].join('\n') },
    ],
  },
];
