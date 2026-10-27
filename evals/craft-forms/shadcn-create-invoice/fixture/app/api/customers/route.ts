export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  return Response.json([{ id: 'c1', name: 'Acme d.o.o.' }, { id: 'c2', name: 'Globex' }].filter((c) => c.name.toLowerCase().includes(q.toLowerCase())));
}
