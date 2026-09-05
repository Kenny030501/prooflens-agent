import { execute, readJson } from '@/lib/v2/runtime';
import { errorResponse } from '@/lib/v2/contracts';
export async function POST(request: Request) {
  try {
    return Response.json(await execute(await readJson(request)), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
