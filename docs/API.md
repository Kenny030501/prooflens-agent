# Agent API contract

> 历史 v0.1 文档：已由 [v0.3 实施说明](PRD_V0.3_IMPLEMENTED.md) 与 [v2 实测报告](EVALUATION_V2_REPORT.md) 取代。下文保留原始设计，不代表当前功能或已验证成果。

## POST `/api/audit`

### Request

```json
{
  "language": "en",
  "agentId": "equity_research_agent",
  "ticker": "NVDA",
  "question": "Verify Q1 FY2025 growth claims",
  "draftText": "NVIDIA Data Center revenue was $22.6 billion, up 427%.",
  "preConfidence": 86
}
```

`ticker` must be `AMZN`, `MRVL`, or `NVDA`. Draft length is 12–12,000 characters. Confidence is optional and bounded to 0–100.

### Response behavior

- `200`: audit completed, including claim verdicts and publication gate.
- `400`: malformed JSON.
- `422`: missing, unsupported, or out-of-range field.

### Gate semantics

- `pass`: every claim is supported.
- `human_review`: at least one claim needs narrower wording or a judgment call.
- `block`: at least one high-impact claim conflicts with or lacks evidence.

## GET `/api/evidence?ticker=NVDA`

Returns the bounded evidence corpus and current source cutoff. Omit `ticker` to list all sources.

## POST `/api/events`

Accepts only: `audit_started`, `audit_completed`, `evidence_opened`, `claim_overridden`, `result_exported`, and `post_confidence_recorded`. Raw research drafts are not accepted by the event endpoint.

Telemetry is best-effort. A database failure returns `persisted: false` and never prevents the primary audit.

## MCP

The local stdio server exposes:

- `audit_research_draft`
- `list_evidence_sources`

Both tools are read-only from the calling agent's perspective. The audit tool returns the same structured contract as the REST endpoint.
