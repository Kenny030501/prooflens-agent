# ProofLens: an evidence gate research agents call before answering

> 历史 v0.1 文档：已由 [v0.3 实施说明](PRD_V0.3_IMPLEMENTED.md) 与 [v2 实测报告](EVALUATION_V2_REPORT.md) 取代。下文保留原始设计，不代表当前功能或已验证成果。

## Summary

ProofLens is a reliability layer for company-research agents. Before publishing, an agent submits its draft to ProofLens. The product turns prose into claims, checks a bounded primary-source corpus, and returns claim-level evidence plus a `pass`, `human_review`, or `block` gate.

The current MVP includes a working review console, REST API, local MCP server, progressive WebMCP surface, twelve SEC evidence records, an anonymous event model, and a 120-row annotation template.

## Problem insight

Company research often requires repeated checks across SEC filings, earnings materials, accounting bases, product roadmaps, and management language. Generative systems make synthesis faster, but they can present reported facts, company estimates, and analytical inference with the same confidence. The missing product layer is an enforceable claim–evidence–action chain before publication.

## Product decisions

ProofLens is designed as 80% machine interface and 20% human review console.

- Agents receive a stable contract, claim verdicts, and an enforceable gate.
- Reviewers see failure reasons, open the source, override a verdict, and record confidence changes.
- The product avoids a single trust score because heterogeneous errors should not collapse into false precision.
- Insufficient evidence produces `no_evidence`; the system never invents a citation.

## Founder–problem fit

- AI/TMT equity research informs the primary-source hierarchy and failure taxonomy.
- Behavioral decision science informs automation-bias and confidence-calibration measures.
- Quantitative research informs fixed benchmarks, baselines, and held-out evaluation.
- Enterprise architecture and data modeling inform the agent, evidence, gate, review, and metric workflow.

## Evidence boundary

This is an implementation-ready MVP, not a completed user study. The twelve records are seed evidence. The 120-row file is an annotation instrument awaiting two human reviewers. Interviews, usability sessions, and outcome metrics remain explicitly marked pending and must not be represented as achieved résumé results.

## Next validation gate

Complete five discovery interviews and dual-annotator review of the first 24 claims. After rubric adjudication, expand to 120 claims and run eight counterbalanced user tasks. Replace résumé metric placeholders only with observed results.
