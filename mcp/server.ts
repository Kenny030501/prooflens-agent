#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { makeServer } from './shared';
const origin = process.env.PROOFLENS_URL ?? 'http://localhost:3000';
const server = makeServer(async (input) => {
  const response = await fetch(origin + '/api/v2/evidence-audits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(75000),
  });
  const value = (await response.json()) as { error?: { message?: string } };
  if (!response.ok)
    throw new Error(value.error?.message ?? 'Audit unavailable');
  return value;
});
await server.connect(new StdioServerTransport());
