export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') ?? '1');
  const rows = [
    { id: 'i1', number: 'INV-001', status: 'PAID', amountMinor: 125000, currency: 'EUR', issuedOn: '2026-09-01', customer: { id: 'c1', name: 'Acme d.o.o.' }, createdAt: '2026-09-01T08:00:00Z' },
    { id: 'i2', number: 'INV-002', status: 'SENT', amountMinor: 48050, currency: 'USD', issuedOn: '2026-09-12', customer: { id: 'c2', name: 'Globex' }, createdAt: '2026-09-12T09:30:00Z' },
  ];
  return Response.json({ rows: page === 1 ? rows : [], total: rows.length });
}
