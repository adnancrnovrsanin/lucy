export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get('page') ?? '1');
  const rows = [
    { id: 'p1', name: 'Desk lamp', value: 4500, stock: 12 },
    { id: 'p2', name: 'Notebook', value: 3, stock: 240 },
  ];
  return Response.json({ rows: page === 1 ? rows : [], total: rows.length });
}
