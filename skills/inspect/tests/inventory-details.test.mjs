import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SCAN = fileURLToPath(new URL('../scripts/scan.mjs', import.meta.url));
const run = (cwd, ...args) => spawnSync(process.execPath, [SCAN, ...args], { cwd, encoding: 'utf8' });

function project(pkg, files) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'inspect-details-')));
  for (const [name, body] of Object.entries({ 'package.json': JSON.stringify({ dependencies: pkg }), ...files })) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  return dir;
}

const listed = (dir) => JSON.parse(run(dir, '--inventory', 'details', '--all', '--json').stdout).files;

test('Next: record pages under a dynamic segment, not edit or new routes', () => {
  const dir = project({ next: '^16.4.0' }, {
    'app/orders/[id]/page.tsx': 'export default async function Page({ params }) { const { id } = await params; const order = await getOrder(id); return <h1>{order.number}</h1>; }',
    'app/orders/[id]/edit/page.tsx': 'export default function Edit() { const form = useForm(); return <form />; }',
    'app/orders/new/page.tsx': 'export default function New() { return <form />; }',
    'app/orders/page.tsx': 'export default function List() { return <p>Orders</p>; }',
    'components/ui/sheet.tsx': 'export const Sheet = (p) => <div {...p} />;',
  });
  assert.deepEqual(listed(dir), ['app/orders/[id]/page.tsx']);
  rmSync(dir, { recursive: true, force: true });
});

test('TanStack Router: $param route files that load one record', () => {
  const dir = project({ '@tanstack/react-router': '^1.170.0' }, {
    'src/routes/customers/$customerId.tsx': 'export const Route = createFileRoute("/customers/$customerId")({ loader: ({ params }) => queryClient.query(customerQuery(params.customerId)) });',
    'src/routes/customers/index.tsx': 'export const Route = createFileRoute("/customers/")({ component: List });',
  });
  assert.deepEqual(listed(dir), ['src/routes/customers/$customerId.tsx']);
  rmSync(dir, { recursive: true, force: true });
});

test('React Router: a component that reads a param and loads one record', () => {
  const dir = project({ 'react-router': '^8.5.0' }, {
    'src/pages/invoice.tsx': 'export function Invoice() { const { invoiceId } = useParams(); const q = useQuery(invoiceQuery(invoiceId)); return <h1>{q.data?.number}</h1>; }',
    'src/pages/invoices.tsx': 'export function Invoices() { const q = useQuery(invoicesQuery()); return <p />; }',
  });
  assert.deepEqual(listed(dir), ['src/pages/invoice.tsx']);
  rmSync(dir, { recursive: true, force: true });
});

test('Expo Router, react-admin markers, peek params, and the details shell', () => {
  const dir = project({ expo: '^58.0.0', 'expo-router': '^58.0.27', 'react-native': '^0.88.1' }, {
    'app/orders/[id].tsx': 'export default function Order() { const { id } = useLocalSearchParams(); const q = useQuery(orderQuery(id)); return null; }',
    'src/companies/CompanyShow.tsx': 'export const CompanyShow = () => <ShowBase><CompanyShowContent /></ShowBase>;',
    'src/orders/orders-peek.tsx': 'export function OrdersPeek() { const [peek] = useQueryState("peek"); return null; }',
    'src/components/details/details-header.tsx': 'export const DetailsHeader = ({ title }) => <h1>{title}</h1>;',
    'src/orders/list.tsx': 'export const List = () => <p />;',
  });
  assert.deepEqual(listed(dir).sort(), ['app/orders/[id].tsx', 'src/companies/CompanyShow.tsx', 'src/components/details/details-header.tsx', 'src/orders/orders-peek.tsx']);
  rmSync(dir, { recursive: true, force: true });
});
