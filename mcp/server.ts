#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { auditDraft, evidenceLibrary } from '../lib/prooflens';

const server = new McpServer({ name: 'prooflens', version: '0.1.0' });

server.registerTool('audit_research_draft', {
  title: 'Audit research draft',
  description: 'Check a research-agent draft against a bounded primary-source corpus. Use before publishing claims about AMZN, MRVL, or NVDA. Returns claim-level evidence and a pass, human_review, or block gate.',
  inputSchema: {
    language: z.enum(['en', 'zh']).default('en'),
    agentId: z.string().min(1).default('research_agent'),
    ticker: z.enum(['AMZN', 'MRVL', 'NVDA']),
    question: z.string().min(5),
    draftText: z.string().min(12).max(12_000),
    preConfidence: z.number().min(0).max(100).optional(),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
  },
}, async (input) => {
  const result = auditDraft(input);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    structuredContent: result as unknown as Record<string, unknown>,
  };
});

server.registerTool('list_evidence_sources', {
  title: 'List evidence sources',
  description: 'List the SEC primary sources currently available to ProofLens for a supported ticker.',
  inputSchema: { ticker: z.enum(['AMZN', 'MRVL', 'NVDA']) },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ ticker }) => {
  const sources = evidenceLibrary.filter((source) => source.ticker === ticker);
  const payload = { ticker, count: sources.length, sources };
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
});

await server.connect(new StdioServerTransport());
