import { corpus } from '@/lib/v2/retrieval';
export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get('ticker');
  return Response.json({
    version: corpus.version,
    scope: 'Selected passages, not full-document coverage.',
    documents: corpus.documents.filter((d) => !ticker || d.ticker === ticker),
  });
}
