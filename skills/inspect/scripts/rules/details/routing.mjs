import { blocks, importedName, importsFrom } from '../../lib/helpers.mjs';
import { routerAtLeast } from '../../lib/stack.mjs';

const NEXT_NAV = /^next\/navigation$/;
const INTERRUPTS = ['notFound', 'redirect', 'permanentRedirect', 'forbidden', 'unauthorized'];
const ERROR_FILE = /(^|[\\/])(global-)?error\.[jt]sx?$/;
const SEGMENT_FILE = /(^|[\\/])(page|layout|default|template)\.[jt]sx?$/;

// Next's navigation interrupts this file imports from next/navigation.
function nextInterrupts(source, names = INTERRUPTS) {
  return names.filter((name) => importedName(source, name, NEXT_NAV));
}

// The catch block that follows a try block ending at `end`, or null when the try has only finally.
function catchAfter(source, end) {
  const rest = source.masked.slice(end + 1);
  const m = /^\s*catch\s*(?:\(\s*([\w$]+)?[^)]*\))?\s*\{/.exec(rest);
  if (!m) return null;
  const open = end + 1 + m[0].length - 1;
  let depth = 0;
  let i = open;
  for (; i < source.masked.length; i++) {
    if (source.masked[i] === '{') depth++;
    else if (source.masked[i] === '}' && --depth === 0) break;
  }
  return { param: m[1] ?? null, body: source.masked.slice(open + 1, i) };
}

const ROUTER_8 = { router: 'react-router', routerPackage: 'react-router', routerMajor: 8 };
const ROUTER_7 = { router: 'react-router', routerPackage: 'react-router', routerMajor: 7 };
const TSR = { router: 'tanstack-router', routerPackage: '@tanstack/react-router', routerMajor: 1 };

export default [
  {
    id: 'next-reset-as-retry',
    severity: 'warning',
    platform: 'all',
    why: 'Since Next 16.3 the error boundary\'s retry prop refetches and re-renders the segment; reset only clears the boundary state, so the same error returns.',
    fix: 'Destructure retry in error.tsx and call it from the Try again button.',
    ref: 'Next.js docs, error.js file convention',
    when: (stack) => routerAtLeast(stack, 'next', 16, 3),
    check: ({ source, path }) => {
      if (!ERROR_FILE.test(path)) return [];
      const m = source.masked;
      const destructured = /\(\s*\{[^}]*\breset\b[^}]*\}/.exec(m);
      if (/\(\s*\{[^}]*\bretry\b[^}]*\}|\bprops\s*\.\s*retry\b/.test(m)) return [];
      if (!destructured || !/\breset\s*\(|=\s*\{\s*reset\s*\}/.test(m)) return [];
      return [{ index: destructured.index, message: 'reset used as the retry; use retry' }];
    },
    good: [
      { code: '"use client";\nexport default function Error({ error, retry }) { return <div role="alert"><p>Could not load this order.</p><button onClick={() => retry()}>Try again</button></div>; }', file: 'app/orders/[id]/error.tsx' },
      { code: '"use client";\nexport default function Error({ error, reset }) { return <button onClick={() => reset()}>Try again</button>; }', file: 'app/orders/[id]/error.tsx', stack: { routerMajor: 15 } },
      { code: '"use client";\nexport default function Error({ error, reset }) { return <button onClick={() => reset()}>Try again</button>; }', file: 'app/orders/[id]/error.tsx', stack: { routerMinor: 2 } },
      { code: 'export function ResetForm({ reset }) { return <button onClick={() => reset()}>Clear</button>; }', file: 'app/orders/[id]/reset-form.tsx' },
    ],
    bad: [
      { code: '"use client";\nexport default function Error({ error, reset }) { return <button onClick={() => reset()}>Try again</button>; }', file: 'app/orders/[id]/error.tsx' },
      { code: '"use client";\nexport default function OrderError({ error, reset }) {\n  const router = useRouter();\n  const retry = () => startTransition(() => { router.refresh(); reset(); });\n  return <button onClick={retry}>Try again</button>;\n}', file: 'app/orders/[id]/error.tsx' },
      { code: '"use client";\nexport default function GlobalError({\n  error,\n  reset,\n}) {\n  return <html><body><button onClick={reset}>Try again</button></body></html>;\n}', file: 'app/global-error.tsx' },
    ],
  },
  {
    id: 'return-not-found',
    severity: 'warning',
    platform: 'all',
    why: 'notFound(), forbidden() and unauthorized() throw; writing return in front suggests they return a value and hides that code after them never runs.',
    fix: 'Call notFound() (or forbidden() or unauthorized()) as a statement without return.',
    ref: 'Next.js docs, notFound function',
    when: (stack) => stack.router === 'next',
    check: ({ source }) => {
      const names = nextInterrupts(source, ['notFound', 'forbidden', 'unauthorized']);
      if (!names.length) return [];
      return [...source.masked.matchAll(new RegExp(`\\breturn\\s+(${names.join('|')})\\s*\\(\\s*\\)`, 'g'))]
        .map((m) => ({ index: m.index, message: `return ${m[1]}(): it throws, call it without return` }));
    },
    good: [
      { code: 'import { notFound } from "next/navigation";\nexport default async function Page({ params }) { const { id } = await params; const order = await getOrder(id); if (!order) notFound(); return <OrderView order={order} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'import { notFound } from "@tanstack/react-router";\nexport const loader = async () => { const order = await getOrder(); if (!order) throw notFound(); return order; };', file: 'src/routes/orders/$orderId.tsx' },
      { code: 'import { notFound } from "next/navigation";\nexport default async function Page({ params }) { if (!order) return notFound(); }', file: 'src/routes/orders/$orderId.tsx', stack: TSR },
    ],
    bad: [
      { code: 'import { notFound } from "next/navigation";\nexport default async function Page({ params }) { const { id } = await params; const order = await getOrder(id); if (!order) return notFound(); return <OrderView order={order} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'import { forbidden, notFound } from "next/navigation";\nexport default async function Page() { const session = await auth(); if (!session.canView) return forbidden(); }', file: 'app/orders/[id]/page.tsx' },
    ],
  },
  {
    id: 'not-found-in-try',
    severity: 'error',
    platform: 'all',
    why: 'notFound(), redirect() and forbidden() work by throwing; inside a try block the catch swallows the throw, so the redirect or not-found page never happens.',
    fix: 'Call it after the try/catch, or call unstable_rethrow(error) first in the catch (or rethrow the caught error).',
    ref: 'Next.js docs, unstable_rethrow and redirect',
    when: (stack) => stack.router === 'next',
    check: ({ source }) => {
      const names = nextInterrupts(source);
      if (!names.length) return [];
      const call = new RegExp(`\\b(${names.join('|')})\\s*\\(`);
      const out = [];
      for (const b of blocks(source, /\btry\s*\{/g)) {
        const hit = call.exec(b.body);
        if (!hit) continue;
        const handler = catchAfter(source, b.end);
        if (!handler) continue;
        if (/\bunstable_rethrow\s*\(/.test(handler.body)) continue;
        if (handler.param && new RegExp(`\\bthrow\\s+${handler.param.replace(/\$/g, '\\$')}\\b`).test(handler.body)) continue;
        out.push({ index: b.open + 1 + hit.index, message: `${hit[1]}() inside try; the catch swallows it` });
      }
      return out;
    },
    good: [
      { code: 'import { notFound } from "next/navigation";\nexport default async function Page({ params }) { const { id } = await params; let order; try { order = await getOrder(id); } catch (error) { logger.error(error); throw error; } if (!order) notFound(); return <OrderView order={order} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'import { redirect, unstable_rethrow } from "next/navigation";\nexport async function archiveOrder(id) { try { await archive(id); redirect(`/orders/${id}`); } catch (error) { unstable_rethrow(error); return { error: "Could not archive" }; } }', file: 'app/orders/[id]/actions.ts' },
      { code: 'import { redirect } from "next/navigation";\nexport async function archiveOrder(id) { try { await archive(id); redirect("/orders"); } finally { done(); } }', file: 'app/orders/[id]/actions.ts' },
      { code: 'import { redirect } from "react-router";\nexport async function action() { try { await save(); return redirect("/orders"); } catch { return { error: true }; } }', file: 'app/routes/orders.$id.tsx' },
    ],
    bad: [
      { code: 'import { notFound } from "next/navigation";\nexport default async function Page({ params }) { const { id } = await params; try { const order = await getOrder(id); if (!order) notFound(); return <OrderView order={order} />; } catch (error) { return <ErrorState error={error} />; } }', file: 'app/orders/[id]/page.tsx' },
      { code: 'import { redirect } from "next/navigation";\nexport async function archiveOrder(id) {\n  try {\n    await archive(id);\n    redirect(`/orders/${id}`);\n  } catch (error) {\n    return { error: "Could not archive" };\n  }\n}', file: 'app/orders/[id]/actions.ts' },
    ],
  },
  {
    id: 'sync-params-next',
    severity: 'warning',
    platform: 'all',
    why: 'Since Next 15 params is a promise; reading params.id synchronously breaks on Next 16 and warns on 15.',
    fix: 'Await params in a server component or generateMetadata (const { id } = await params), or unwrap it with use(params) in a client component.',
    ref: 'Next.js docs, dynamic route segments and the version 15 upgrade guide',
    when: (stack) => routerAtLeast(stack, 'next', 15),
    check: ({ source, path }) => {
      if (!SEGMENT_FILE.test(path)) return [];
      // React Router framework mode also names files page.tsx and layout.tsx; its params are plain objects.
      if (importsFrom(source, /^react-router|[\\/]\+types[\\/]/).length) return [];
      const m = source.masked;
      if (/\bawait\s+(?:[\w$]+\.)?params\b|\buse\s*\(\s*(?:[\w$]+\.)?params\s*\)|\buseParams\s*(?:<[^>]*>)?\s*\(|\bparams\s*\.\s*then\s*\(/.test(m)) return [];
      const hit = /(?<![\w$.])(?:props\s*\.\s*)?params\s*(?:\??\.\s*[\w$]+|\[)|\}\s*=\s*(?:props\s*\.\s*)?params\b/.exec(m);
      if (!hit) return [];
      // Only the route's params count: `props.params`, or `params` destructured from the signature. A local
      // `const params = useSearchParams()` or `new URLSearchParams()` is not the route's params.
      const viaProps = /\bprops\s*\.\s*params\b/.test(hit[0]);
      const fromSignature = /\(\s*\{[^()]*\bparams\b[^()]*\}/.test(m) && !/\b(?:const|let|var)\s+params\b/.test(m);
      if (!viaProps && !fromSignature) return [];
      return [{ index: hit.index, message: 'params read synchronously; await it' }];
    },
    good: [
      { code: 'export default async function Page({ params }) { const { id } = await params; const order = await getOrder(id); return <OrderView order={order} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: '"use client";\nimport { use } from "react";\nexport default function Page({ params }) { const { id } = use(params); return <OrderView id={id} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'export async function generateMetadata(props) { const params = await props.params; return { title: `Order ${params.id}` }; }', file: 'app/orders/[id]/layout.tsx' },
      { code: 'export default function Page({ params }) { return <OrderView id={params.id} />; }', file: 'app/orders/[id]/page.tsx', stack: { routerMajor: 14 } },
      { code: 'import { useSearchParams } from "next/navigation";\nexport default function Page() { const params = useSearchParams(); const tab = params.get("tab"); return <Tabs value={tab} />; }', file: 'app/orders/page.tsx' },
      { code: 'export default function Page() { const params = new URLSearchParams(); params.set("tab", "x"); return <Tabs value={params.get("tab")} />; }', file: 'app/orders/page.tsx' },
      { code: '"use client";\nimport { useParams } from "next/navigation";\nexport default function Page() { const params = useParams<{ id: string }>(); return <OrderView id={params.id} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'import type { Route } from "./+types/page";\nexport default function Page({ params }: Route.ComponentProps) { const { orderId } = params; return <OrderView id={orderId} />; }', file: 'app/orders/[orderId]/page.tsx' },
    ],
    bad: [
      { code: 'export default async function Page({ params }) { const order = await getOrder(params.id); return <OrderView order={order} />; }', file: 'app/orders/[id]/page.tsx' },
      { code: 'export async function generateMetadata({ params }) {\n  const { id } = params;\n  return { title: `Order ${id}` };\n}', file: 'app/orders/[id]/layout.tsx' },
    ],
  },
  {
    id: 'react-router-dom-import',
    severity: 'error',
    platform: 'all',
    why: 'React Router 8 removed the react-router-dom package; everything now imports from react-router.',
    fix: 'Import from react-router (and react-router/dom for RouterProvider in the DOM) and remove react-router-dom from package.json.',
    ref: 'React Router v8 upgrade guide',
    when: (stack) => routerAtLeast(stack, 'react-router', 8),
    check: ({ source }) => importsFrom(source, /^react-router-dom$/).map((i) => ({ line: i.line, message: 'import from react-router-dom' })),
    good: [
      { code: 'import { Link, useParams } from "react-router";', stack: ROUTER_8 },
      { code: 'import { RouterProvider } from "react-router/dom";', stack: ROUTER_8 },
      { code: 'import { Link } from "react-router-dom";', stack: ROUTER_7 },
    ],
    bad: [
      { code: 'import { Link, useParams } from "react-router-dom";', stack: ROUTER_8 },
      { code: 'import "./styles.css";\nimport { useNavigate } from "react-router-dom";\nexport function Back() { const navigate = useNavigate(); }', stack: ROUTER_8 },
    ],
  },
  {
    id: 'background-location-modal',
    severity: 'warning',
    platform: 'all',
    why: 'The v6 backgroundLocation modal recipe breaks on reload and deep links; React Router 7 ships route masking for the same job.',
    fix: 'Render the record as a real route and open it over the list with <Link mask>, so the URL stays shareable and reload shows the full page.',
    ref: 'React Router docs, route masking',
    when: (stack) => routerAtLeast(stack, 'react-router', 7),
    check: ({ source }) => {
      const m = /\bbackgroundLocation\b/.exec(source.masked);
      return m ? [{ index: m.index, message: 'backgroundLocation modal recipe' }] : [];
    },
    good: [
      { code: 'import { Link } from "react-router";\n<Link to={`/orders/${order.id}`} mask="/orders">{order.number}</Link>', stack: ROUTER_7 },
      { code: 'import { Link } from "react-router";\n<Link to={`/orders/${order.id}`}>{order.number}</Link>', stack: ROUTER_8 },
      { code: 'const background = location.state?.backgroundLocation;', stack: { router: 'react-router', routerPackage: 'react-router-dom', routerMajor: 6 } },
    ],
    bad: [
      { code: 'import { Link, useLocation } from "react-router";\nconst location = useLocation();\n<Link to={`/orders/${order.id}`} state={{ backgroundLocation: location }}>{order.number}</Link>', stack: ROUTER_7 },
      { code: 'const state = location.state;\nreturn <Routes location={state?.backgroundLocation || location} />;', stack: ROUTER_8 },
    ],
  },
  {
    id: 'deprecated-rr-view-transition',
    severity: 'warning',
    platform: 'all',
    why: 'React Router 8 deprecates its own view-transition props and hooks in favour of React\'s <ViewTransition> component.',
    fix: 'Wrap the shared element in React\'s <ViewTransition> and drop viewTransition, useViewTransitionState and isTransitioning.',
    ref: 'React Router v8 changelog, view transitions; React docs, ViewTransition',
    when: (stack) => routerAtLeast(stack, 'react-router', 8),
    check: ({ source }) => {
      const out = [];
      for (const el of source.elements) {
        if ((el.tag === 'Link' || el.tag === 'NavLink') && el.attrs.has('viewTransition')) out.push({ line: el.line, message: `viewTransition on <${el.tag}>` });
      }
      if (importsFrom(source, /^react-router/).length) {
        for (const m of source.masked.matchAll(/\buseViewTransitionState\s*\(|\bisTransitioning\b/g)) out.push({ index: m.index, message: `${m[0].replace(/\W+$/, '')} is deprecated` });
      }
      return out;
    },
    good: [
      { code: 'import { ViewTransition } from "react";\nimport { Link } from "react-router";\n<Link to={`/orders/${order.id}`}><ViewTransition name={`order-${order.id}`}><img src={order.image} alt="" /></ViewTransition></Link>', stack: ROUTER_8 },
      { code: 'import { NavLink } from "react-router";\n<NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>Orders</NavLink>', stack: ROUTER_8 },
      { code: 'import { Link } from "react-router";\n<Link to="/orders/1" viewTransition>Order</Link>', stack: ROUTER_7 },
    ],
    bad: [
      { code: 'import { Link } from "react-router";\n<Link to={`/orders/${order.id}`} viewTransition>{order.number}</Link>', stack: ROUTER_8 },
      { code: 'import { NavLink, useViewTransitionState } from "react-router";\nconst isTransitioning = useViewTransitionState(to);', stack: ROUTER_8 },
      { code: 'import { NavLink } from "react-router";\n<NavLink to="/orders">{({ isTransitioning }) => <span className={isTransitioning ? "fade" : ""}>Orders</span>}</NavLink>', stack: ROUTER_8 },
    ],
  },
  {
    id: 'manual-start-view-transition',
    severity: 'warning',
    platform: 'web',
    why: 'Calling document.startViewTransition by hand races the router\'s own transition, so the snapshot can capture the wrong page.',
    fix: 'Use React\'s <ViewTransition> component, which the router drives on navigation.',
    ref: 'React docs, ViewTransition; Next.js docs, viewTransition',
    when: (stack) => routerAtLeast(stack, 'next', 16) || routerAtLeast(stack, 'react-router', 8),
    check: ({ source }) => {
      if (!/\b(?:router\s*\.\s*(?:push|replace|back|navigate)|navigate)\s*\(/.test(source.masked)) return [];
      return [...source.masked.matchAll(/\bdocument\s*\.\s*startViewTransition\s*\(/g)]
        .map((m) => ({ index: m.index, message: 'manual document.startViewTransition around a navigation' }));
    },
    good: [
      { code: 'import { ViewTransition } from "react";\n<ViewTransition name={`order-${id}`}><OrderHeader order={order} /></ViewTransition>' },
      { code: 'if ("startViewTransition" in document) track("vt");' },
      { code: 'const go = () => document.startViewTransition(() => router.push("/orders"));', stack: { routerMajor: 15 } },
      { code: 'export function toggleTheme(apply) { document.startViewTransition(apply); }', file: 'src/lib/theme-transition.ts' },
    ],
    bad: [
      { code: 'const open = (id) => document.startViewTransition(() => router.push(`/orders/${id}`));' },
      { code: 'import { useNavigate } from "react-router";\nconst go = () => { document.startViewTransition(() => navigate("/orders/1")); };', stack: ROUTER_8 },
    ],
  },
  {
    id: 'tanstack-scroll-restoration-component',
    severity: 'warning',
    platform: 'all',
    why: 'TanStack Router deprecated the <ScrollRestoration> component; scroll restoration is now a router option.',
    fix: 'Remove <ScrollRestoration /> and pass scrollRestoration: true to createRouter.',
    ref: 'TanStack Router docs, scroll restoration',
    when: (stack) => stack.router === 'tanstack-router',
    check: ({ source }) => {
      if (!importedName(source, 'ScrollRestoration', /^@tanstack\/react-router$/)) return [];
      return source.elements.filter((el) => el.tag === 'ScrollRestoration').map((el) => ({ line: el.line, message: '<ScrollRestoration> from @tanstack/react-router' }));
    },
    good: [
      { code: 'import { createRouter } from "@tanstack/react-router";\nexport const router = createRouter({ routeTree, scrollRestoration: true });', stack: TSR },
      { code: 'import { ScrollRestoration } from "react-router";\n<ScrollRestoration />', stack: TSR },
      { code: 'import { ScrollRestoration } from "@tanstack/react-router";\n<ScrollRestoration />' },
    ],
    bad: [
      { code: 'import { Outlet, ScrollRestoration } from "@tanstack/react-router";\nexport function Root() { return <><ScrollRestoration /><Outlet /></>; }', stack: TSR },
      { code: 'import { ScrollRestoration } from "@tanstack/react-router";\n<ScrollRestoration getKey={(location) => location.pathname} />', stack: TSR },
    ],
  },
];
