# Evaluation plan

> 历史 v0.1 文档：已由 [v0.3 实施说明](PRD_V0.3_IMPLEMENTED.md) 与 [v2 实测报告](EVALUATION_V2_REPORT.md) 取代。下文保留原始设计，不代表当前功能或已验证成果。

## Principle

Evaluation has three layers. Retrieval asks whether the correct source passage was surfaced. Judgment asks whether the verdict preserves the source's period, unit, accounting basis, and certainty. Product impact asks whether the gate helps a human catch errors with less time and better-calibrated confidence.

## Benchmark construction

Use `evals/gold_set_template.csv` as the controlled annotation ledger.

1. Populate 40 claims per company across five claim types.
2. Balance supported, partial, conflicted, no-evidence, and inference cases.
3. Include hard negatives involving nearby periods, percentage versus percentage-point changes, GAAP/non-GAAP swaps, management estimates treated as facts, and forward-looking statements rewritten as completed outcomes.
4. Two annotators label at least the first 24 claims independently.
5. Resolve disagreements with an adjudicated verdict and written rule.
6. Freeze 80% for development and 20% for held-out testing.

Seed expectations are regression fixtures, not human-labeled truth.

## Metric definitions

- **Unsupported-claim recall:** unsupported or conflicted claims correctly prevented from passing divided by all unsupported or conflicted claims.
- **False challenge rate:** supported claims incorrectly routed to review/block divided by all supported claims.
- **Evidence-link validity:** accessible cited links that contain the referenced passage divided by all cited links.
- **Calibration gap:** absolute difference between confidence on a 0–100 scale and task accuracy on the same scale.

## User experiment

Recruit eight finance, business analytics, or data students. Each participant reviews two matched memos containing five seeded errors. Half use the ordinary workflow first; half use ProofLens first. Use different companies across conditions to reduce recall effects.

Capture task completion, errors correctly found, false alarms, time, pre/post confidence, SUS, and one open-ended explanation. Report medians, ranges, and individual changes. Do not claim statistical significance with this sample.

## Failure taxonomy

- Retrieval miss
- Wrong company or period
- Numeric or unit conflict
- GAAP/non-GAAP mismatch
- Guidance treated as reported fact
- Causal inference stated as fact
- Unsupported market-share or superlative claim
- Fabricated or inaccessible citation
- Prompt injection inside source material
- Overlong or malformed agent request

## Acceptance

The MVP is evaluation-ready when deterministic tests pass, all twelve source links resolve, the 120-row sheet is structurally complete, and no user-study target is displayed as achieved before collection.
