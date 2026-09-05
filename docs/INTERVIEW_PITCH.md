# Interview pitch

> 历史 v0.1 文档：已由 [v0.3 实施说明](PRD_V0.3_IMPLEMENTED.md) 与 [v2 实测报告](EVALUATION_V2_REPORT.md) 取代。下文保留原始设计，不代表当前功能或已验证成果。

## 中文两分钟版本

在东方证券做 AI/TMT 研究时，很多时间花在核对 SEC 文件、财报口径和管理层表述。大模型能够快速生成研究草稿，不过它经常把已披露事实、公司指引和自己的推断写成同样确定的结论。

因此本项目设计并实现了 ProofLens。它不是另一个研究 Agent，而是一层供 Agent 在发布前调用的证据门禁。Agent 提交草稿后，系统拆分事实主张，从限定的 SEC 资料中寻找证据，并对每条主张返回已支持、部分支持、存在冲突、未找到证据或分析推断。高影响主张缺少证据时，接口直接返回 block，并在控制台交给人工复核。

产品设计结合了行为科学中的自动化偏误：控制台记录审计前后的信心，而不是只看模型准确率。同时借鉴量化研究方法，先固定评测集、错误类型和通过门槛，再迭代检索和判断逻辑。

当前完成了可运行网页、REST API、MCP 工具、十二条 SEC 种子证据和120条人工标注模板。尚未完成的用户实验全部标记为 Pending。下一步通过5次访谈、双人标注和8次反平衡任务测试，验证它是否真正提高错误发现率并减少核验时间。

## English two-minute version

While working on AI and TMT company research, I spent substantial time reconciling SEC filings, reporting periods, accounting bases, and management statements. Generative systems accelerate drafting, but often present reported facts, company guidance, and their own inference with the same certainty.

I designed and implemented ProofLens as a reliability layer that research agents call before publishing. It decomposes a draft into claims, checks a bounded SEC corpus, and returns supported, partial, conflicted, no-evidence, or inference verdicts. If a high-impact claim lacks support, the machine interface returns a block decision and routes the trace to a human reviewer.

The product also applies behavioral decision science by measuring confidence before and after review, rather than optimizing only model accuracy. My quantitative-research background shaped the fixed benchmark, failure taxonomy, and held-out validation gates.

The current MVP includes a working console, REST and MCP interfaces, twelve SEC seed records, and a 120-row human-annotation instrument. I deliberately mark interviews and outcome metrics as pending until they are collected. The next step is five discovery interviews, dual annotation, and eight counterbalanced task tests to measure error detection, verification time, and trust calibration.

## Résumé bullet template — use only after measurement

Designed and shipped ProofLens, a claim-level evidence gate for research agents; built REST/MCP interfaces and a dated SEC evaluation corpus, then conducted **[N]** user tests that changed unsupported-claim detection by **[X pp]** and median verification time by **[Y%]**.
