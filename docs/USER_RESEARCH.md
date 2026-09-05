# User research kit

> 历史 v0.1 文档：已由 [v0.3 实施说明](PRD_V0.3_IMPLEMENTED.md) 与 [v2 实测报告](EVALUATION_V2_REPORT.md) 取代。下文保留原始设计，不代表当前功能或已验证成果。

## Recruitment

Recruit 8–12 participants who have used an LLM for company, industry, or investment research. Aim for a mix of finance students, business/data students, and junior analysts. Five complete discovery interviews; eight complete task testing; overlap of three to five people is acceptable.

Do not collect employer-confidential research, client material, account credentials, or personal trading positions.

## Discovery interview — 25 minutes

1. Walk me through the last time you used an AI tool for company research.
2. Which parts of the output did you trust immediately? Why?
3. What did you verify manually, and where did you look?
4. Tell me about a confident-looking answer that turned out to be wrong or misleading.
5. How do period, unit, and GAAP/non-GAAP differences show up in your work?
6. When would you prefer the agent to stop and ask for review?
7. What evidence must be visible before you cite a claim?
8. What would make an automated evidence gate too annoying to use?

Do not show the product until the participant finishes describing the current workflow.

## Task-test protocol — 35 minutes

1. Obtain consent and assign a pseudonymous participant ID.
2. Present the baseline memo and ask the participant to mark statements that require correction.
3. Record start/end time, decisions, confidence, and sources opened.
4. Present the matched ProofLens task using a different company.
5. Ask the participant to think aloud while interpreting each verdict and gate.
6. Ask the participant to override one verdict and export the result.
7. Collect post-task confidence, SUS, and one improvement request.

Counterbalance task order across participants.

## Observation sheet

Record participant ID, task order, domain familiarity, correctly detected errors, false alarms, completion time, pre/post confidence, evidence opened, override success, gate comprehension, SUS, and notable quote. Keep quotations anonymous.

## Synthesis rule

Treat a behavior as a recurring problem when at least three participants exhibit or independently describe it. Prioritize changes by severity, frequency, and implementation effort. Preserve contradictory feedback rather than averaging it away.
