import demo from '@/data/demo.json';
export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get('ticker') ?? 'AMZN';
  if (!(ticker in demo)) return Response.json({ error: 'Unknown company' }, { status: 422 });
  return Response.json({ ...demo[ticker as keyof typeof demo], mode: 'recorded_real_call', current_call_cost_usd: 0 }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
