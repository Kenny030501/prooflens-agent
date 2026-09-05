# ProofLens v2 API

Start the local server; then use the same engine through REST or MCP.

```sh
curl http://localhost:3000/api/v2/evidence-audits \
  -H 'Content-Type: application/json' \
  -d '{"request_id":"example-001","entity":"AMZN","as_of":"2024-08-02","language":"en","claims":[{"claim_id":"C1","text":"AWS sales increased 17% year over year in Q1 2024."}]}'
```

`GET /api/evidence?ticker=AMZN`: current document catalog. `GET /api/health`: configured engine and anonymous estimated budget. Status does not imply provider availability until a real call succeeds.

`POST /mcp`: stateless Streamable HTTP, tested with the official MCP SDK. Tools: `list_evidence_sources` and `verify_financial_claims`. The latter is non-destructive but can incur cost and record anonymous metadata. It does not publish or trade.

Local stdio configuration:

```json
{"mcpServers":{"prooflens":{"command":"npx","args":["tsx","/ABSOLUTE/PATH/项目源码/mcp/server.ts"],"env":{"PROOFLENS_URL":"http://localhost:3000"}}}}
```

Replace the absolute path; keep the local server running. Hosted access remains owner-private and subject to Sites authentication. A tested HTTP endpoint does not imply that an OAuth connector has been registered in every agent platform. No unsupported platform MCP capability is fabricated in the hosting manifest.

Do not automatically retry uncertain provider failures. Duplicate request IDs never trigger a second paid audit. A short-lived in-process cache can return the original response; after it expires use a new ID only for an intentional new call.
