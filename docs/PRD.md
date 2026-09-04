# ProofLens for Agents — PRD v0.1

## 1. Problem

Research agents can produce fluent company analysis while collapsing reported facts, management estimates, forward-looking guidance, and the agent's own inference into one answer. A downstream user or agent has no consistent gate for deciding which claims may be published.

## 2. Target customer and job

**Primary user:** developers and operators of company-research agents.

**Human reviewer:** finance students and junior analysts responsible for the final research output.

**Job to be done:** Before my agent publishes a company-research answer, identify unsupported or mis-scoped high-impact claims, show the best primary evidence, and return an action the workflow can enforce.

## 3. Product promise

ProofLens converts an unstructured draft into an auditable set of claims. Each claim receives a type, evidence, verdict, reason, and review requirement. The run ends in a deterministic publication gate:

- `pass`: every claim is supported by the bounded primary-source corpus.
- `human_review`: one or more claims require narrower wording or judgment.
- `block`: a high-impact claim conflicts with or lacks primary evidence.

ProofLens does not issue investment advice or pretend that evidence coverage equals objective truth.

## 4. MVP scope

### P0

- Accept English or Chinese draft text through REST, MCP, WebMCP, and the visible console.
- Support AMZN, MRVL, and NVDA.
- Split up to twelve claims per request.
- Distinguish quantitative facts, management statements, causal claims, forward-looking claims, and general claims.
- Return supported, partial, conflicted, no-evidence, or inference verdicts.
- Preserve form, period, filing date, section, source URL, and excerpt.
- Block high-impact unsupported/conflicting claims.
- Allow human overrides and export the revised trace.
- Record confidence before and after review without storing the raw draft.

### P1 after validation

- Upload a customer-owned evidence corpus.
- Hybrid lexical and semantic retrieval.
- Model-assisted claim decomposition using a structured schema.
- Versioned evaluation datasets and prompt/model comparison.
- Team review queues and policy configuration.

### Non-goals

Real-time market data, broker integration, buy/sell recommendations, open-web crawling, billing, model fine-tuning, and autonomous publication.

## 5. Functional requirements

1. Invalid request bodies return a structured 400 or 422 error.
2. No-evidence results contain no fabricated citations.
3. Every cited result includes a source cutoff.
4. Period, unit, GAAP/non-GAAP basis, and fact/guidance scope must influence the verdict.
5. Telemetry failure must not prevent an audit.
6. Color is never the only status signal; every verdict includes text and an icon.
7. The public deployment does not persist raw user drafts.

## 6. Interfaces

### AuditRequest

`language`, `agentId`, `ticker`, `question`, `draftText`, optional `preConfidence`.

### ClaimAssessment

`claimId`, `claimText`, `claimType`, `verdict`, `importance`, `evidence[]`, `reason`, `riskNote`, `requiresHumanReview`.

### AuditResult

`caseId`, `agentId`, `ticker`, `question`, `createdAt`, `sourceCutoff`, `assessments[]`, `coverage`, `verifiedBrief`, `gateDecision`, `gateReason`.

## 7. Metrics

### Offline quality

- Unsupported-claim recall ≥80%.
- False challenge rate ≤15%.
- Valid evidence-link rate ≥95%.

### Product impact

- Seeded-error detection improves by at least 25 percentage points.
- Median verification time falls by at least 25%.
- Absolute confidence–accuracy gap falls by at least 20%.
- SUS reaches 75 or higher.

Targets remain targets until independent labeling and user testing are complete.

## 8. Launch gates

- Gate A: twelve source links pass automated validation.
- Gate B: two annotators independently review the first 24 claims.
- Gate C: unsupported-claim recall and false challenge rate meet thresholds on the held-out set.
- Gate D: eight users complete counterbalanced baseline and ProofLens tasks.
- Gate E: documentation reports failures and descriptive results without unsupported causal claims.
