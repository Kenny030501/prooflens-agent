import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['--import', 'tsx', 'mcp/server.ts'],
  cwd: process.cwd(),
  stderr: 'pipe',
});
const client = new Client({ name: 'prooflens-test-client', version: '0.1.0' });

try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), ['audit_research_draft', 'list_evidence_sources']);
  const response = await client.callTool({
    name: 'audit_research_draft',
    arguments: {
      language: 'en',
      agentId: 'mcp_test_agent',
      ticker: 'NVDA',
      question: 'Verify reported growth.',
      draftText: 'NVIDIA Data Center revenue was $22.6 billion, up 427%.',
      preConfidence: 80,
    },
  });
  const structured = response.structuredContent as { gateDecision: string; assessments: unknown[] };
  assert.equal(structured.gateDecision, 'pass');
  assert.equal(structured.assessments.length, 1);
  console.log('mcp.test.ts: tool discovery and invocation passed');
} finally {
  await client.close();
}
