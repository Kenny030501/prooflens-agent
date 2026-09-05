import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const origin = process.env.PROOFLENS_URL ?? 'http://localhost:3000';
const send = (value, headers = {}) =>
  fetch(origin + '/api/v2/evidence-audits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(value),
  });
const input = {
  request_id: 'integration-' + Date.now(),
  entity: 'AMZN',
  as_of: '2020-01-01',
  claims: [{ claim_id: 'C1', text: 'AWS sales increased 17% in Q1 2024.' }],
};
assert.equal(
  (await send({ ...input, claims: [{ claim_id: 'C1', text: '            ' }] }))
    .status,
  422,
);
assert.equal(
  (await send(input, { Origin: 'https://untrusted.example' })).status,
  403,
);
const first = await send(input);
assert.equal(first.status, 200);
const a = await first.json();
assert.equal(a.gate, 'hold');
assert.equal(a.usage.model, 'not_called');
const repeat = await send(input);
assert.equal(repeat.status, 200);
assert.equal((await repeat.json()).cached, true);
assert.equal((await send({ ...input, as_of: '2024-08-02' })).status, 409);
assert.equal(
  (await fetch(origin + '/api/audit', { method: 'POST' })).status,
  410,
);
assert.equal(
  (
    await fetch(origin + '/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'audit_started',
        entity: 'AMZN',
        session_id: crypto.randomUUID(),
        raw_draft: 'private',
      }),
    })
  ).status,
  422,
);
const event = await fetch(origin + '/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_name: 'audit_started',
    entity: 'AMZN',
    session_id: crypto.randomUUID(),
  }),
});
assert.equal(event.status, 200);
assert.equal((await event.json()).persisted, true);
for (const mode of ['http', 'stdio']) {
  const client = new Client({ name: 'prooflens-integration', version: '1.0' });
  const transport =
    mode === 'http'
      ? new StreamableHTTPClientTransport(new URL(origin + '/mcp'))
      : new StdioClientTransport({
          command: 'node',
          args: ['--import', 'tsx', 'mcp/server.ts'],
          env: { ...process.env, PROOFLENS_URL: origin },
        });
  await client.connect(transport);
  const list = await client.listTools();
  assert(list.tools.some((t) => t.name === 'verify_financial_claims'));
  const source = await client.callTool({
    name: 'list_evidence_sources',
    arguments: { ticker: 'AMZN' },
  });
  assert.equal(source.structuredContent.documents.length, 4);
  const result = await client.callTool({
    name: 'verify_financial_claims',
    arguments: { ...input, request_id: 'mcp-' + mode + '-' + Date.now() },
  });
  assert.equal(result.structuredContent.gate, 'hold');
  await client.close();
  console.log('PASS ' + mode + ' MCP discovery + invocation');
}
console.log(
  JSON.stringify({ integration_checks: 18, passed: 18, paid_calls: 0 }),
);
