import { evidenceLibrary } from '@/lib/prooflens';

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get('ticker');
  const sources = ticker ? evidenceLibrary.filter((source) => source.ticker === ticker) : evidenceLibrary;
  return Response.json({
    count: sources.length,
    sourceCutoff: sources.reduce((latest, source) => source.filedAt > latest ? source.filedAt : latest, ''),
    sources,
  });
}
