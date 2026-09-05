import { runtimeStatus } from '@/lib/v2/runtime';
import { errorResponse } from '@/lib/v2/contracts';
export async function GET() {
  try {
    return Response.json(await runtimeStatus(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
