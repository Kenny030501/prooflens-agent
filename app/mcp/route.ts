import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { makeServer } from '@/mcp/shared';
import { execute, readJson } from '@/lib/v2/runtime';
import { errorResponse } from '@/lib/v2/contracts';
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const transport = new WebStandardStreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    const server = makeServer(execute);
    await server.connect(transport);
    const response = await transport.handleRequest(
      new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body),
      }),
    );
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
export function GET() {
  return new Response('Stateless MCP: POST only', {
    status: 405,
    headers: { Allow: 'POST' },
  });
}
export const DELETE = GET;
