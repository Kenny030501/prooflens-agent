import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { requestSchema } from '../lib/v2/contracts';
import { corpus } from '../lib/v2/retrieval';
export function makeServer(run: (input: unknown) => Promise<unknown>) {
  const server = new McpServer({ name: 'prooflens', version: '0.2.0' });
  server.registerTool(
    'verify_financial_claims',
    {
      description:
        'Verify AMZN/MRVL/NVDA claims against dated SEC evidence. Costs a bounded model call; logs anonymous metadata. Never trading advice. Use explicit as_of and 1–12 claims; insufficient requires more evidence.',
      inputSchema: requestSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (input) => {
      try {
        const result = (await run(input)) as Record<string, unknown>;
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
          structuredContent: result,
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                error instanceof Error
                  ? error.message
                  : 'Audit unavailable; no claims approved.',
            },
          ],
        };
      }
    },
  );
  server.registerTool(
    'list_evidence_sources',
    {
      description:
        'List bounded primary-source coverage before selecting as_of or source_ids.',
      inputSchema: { ticker: z.enum(['AMZN', 'MRVL', 'NVDA']) },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ ticker }) => {
      const result = {
        version: corpus.version,
        scope: 'selected passages',
        documents: corpus.documents.filter((d) => d.ticker === ticker),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );
  return server;
}
