# ProofLens 最终案例、面试稿与简历表述

## 中文案例

ProofLens 是面向研究 Agent 的财务证据核验服务。项目来自本人历史投研中的跨 Agent 口径复核、原始来源追问和季度桥接任务。12 条核验过的请求来自 8 个任务，代表一个使用者的实际工作，不代表市场规模；私人对话不公开。

直接用户是调用工具的 Agent。接口返回主张、报告期、会计口径、原文位置、不确定性和补查动作，网页承担演示及复核。项目不输出一个总分，因为期间错配、推导错误和缺证需要不同的行动。实时交易、任意网页抓取与订阅不在 MVP 范围。

1024 份模型角色问卷只用来提出假设。随后执行的同模型、同资料配对实验没有显示核心质量提升：双方均 5/6 证据合格，额外核验更慢、更贵。项目保留这个负面发现，将优先级转向数字牵引的检索缺口和减法契约错误。

迭代加入双通道检索、财务短语特征及命名操作数的程序计算，旧失败相关回归达到 8/8。12 条新增主张为 10/12，剩余错误保留。交付代码、API / MCP、网页、案例、回执和复现说明；不把它包装成已验证的商业产品。

本人主导产品问题、范围、取舍和结果解释，编码与实验有 AI 协助。没有实际管理跨职能团队、真人效果、付费或留存数据。

## English case study

ProofLens is a financial-evidence service for research agents. It grew from recurring requests to reconcile another agent's accounting definitions, trace primary sources and compare quarterly figures. Twelve verified requests across eight tasks document one user's workflow, not a market-size estimate. Private transcripts are excluded.

The direct user is a tool-using agent. REST and MCP return claim-level decisions, reporting periods, accounting bases, source locations and recovery actions. The browser supports demonstrations and review. An aggregate confidence score would hide materially different failures, so it was excluded along with trading, arbitrary crawling and subscriptions.

The project used 1,024 model-role questionnaires only to generate hypotheses. A subsequent same-model, same-evidence comparison found no core quality gain: both workflows completed five of six evidence-qualified tasks, while the added verification chain cost more and took longer. The negative finding redirected development toward retrieval misses and inconsistent arithmetic contracts.

The iteration added a value-deemphasized query, financial-phrase features and server-side arithmetic from named fact operands. Eight regression claims matched expected labels; ten of twelve fresh claims matched, with the remaining failures retained. The deliverable includes runnable code, interfaces, source snapshots and reproducible receipts.

Hongru Da led product framing, scope decisions and interpretation, with AI-assisted implementation and experiments. Human outcomes, revenue, retention and robust superiority over ordinary retrieval remain unproven.

## 中文两分钟面试稿

这个项目来自我在投研中反复遇到的一类工作：让一个 Agent 核对另一个 Agent 给出的财务结论。数字看上去合理，却可能把季度写成年份、把 Non-GAAP 写成 GAAP，或者找到了文件但没有找到支持结论的段落。

我将直接用户定义为研究 Agent，交付了 ProofLens。调用方提交公司、截止日期和主张，服务检索一手资料，返回判断、口径、原文和补查动作。网页用于演示和复核，核心是 REST 与 MCP。我没有用单一可信度总分，因为不同错误需要不同处理。

最有价值的发现来自一次负面实验。同模型、同资料条件下，六个配对任务接入前后都是五个证据合格任务，新增核验却增加了耗时和成本。我没有把模型问卷的积极反馈当成有效性证据，而是查看失败记录，发现季度证据漏检和减法输入顺序不一致。

于是迭代了检索，并让程序根据命名操作数计算。旧失败相关八条回归判断全部一致，十二条新增主张中十条一致，剩余问题仍公开保留。代码、接口、回执和双语案例都能复现。

这个项目希望证明的是：能把金融与行为研究经验转成产品问题，定义可检验假设，并根据不理想的数据做取舍。目前仍是研究型 MVP，没有真人效果、留存或付费数据，我不会把这些写成成果。

## English interview pitch

ProofLens grew from a recurring task: asking one research agent to verify financial claims produced by another. A plausible number can refer to the wrong quarter, accounting basis or forecast type. A document link alone does not establish support.

I defined the direct user as a research agent and built a bounded evidence service. It accepts a company, an as-of date and explicit claims, then returns quotations, reporting definitions, judgments and recovery actions through REST and MCP. The browser supports review. I avoided an aggregate trust score because different failures require different actions.

The most important finding was negative. In six paired tasks with the same model and evidence, both workflows completed five evidence-qualified tasks, while adding ProofLens increased latency and cost. I kept that finding and investigated failures instead of treating favorable model-questionnaire responses as validation.

The iteration added retrieval less dependent on the claimed number and arithmetic computed from named fact operands. Eight regression claims matched their labels; ten of twelve fresh claims matched, with remaining failures retained. Code and experiment receipts are reproducible.

The project demonstrates problem definition, evaluation and evidence-led prioritization. It remains a research MVP without measured human outcomes, retention or revenue.

## 简历可用句

设计并交付面向研究 Agent 的财务证据核验 MVP，提供 REST / MCP 与可定位的一手资料；建立合成诊断和同条件工作流实验，根据检索遗漏与算术契约失败完成一轮迭代，保留负面结果、逐题回执和验证边界。

英文：Designed and delivered a financial-evidence MVP for research agents with REST/MCP interfaces; ran source-grounded diagnostics and a controlled workflow comparison, then iterated on retrieval and arithmetic-contract failures while preserving negative results and reproducible receipts.

## 常见追问

- **为什么 to-agent？** 执行核验与消费接口的是 Agent；人承担授权与必要复核，采购方和商业模式尚未验证。
- **为什么不是一段提示词？** 强提示词基线已经可以完成不少工作，因此工具必须在检索、来源、结构化恢复或集成成本上提供额外价值。
- **为什么没有用 Python 写所有逻辑？** 网页、服务端和 MCP 共用 TypeScript 契约，降低双语言维护；实验辅助仍可用 Python，不认为 Python 不适合 AI。
- **为什么不用总分？** 一个平均分会隐藏证据缺失、期间错配和不确定性，难以告诉调用 Agent 下一步做什么。
- **1024 份问卷能证明什么？** 模型角色下的偏好和假设，不是真人使用或付费证据。
- **六个任务够吗？** 可以暴露具体失败，不能证明普遍增益或显著性。
- **下一步做什么？** 修复缺证补检索、规范标签边界，再观察陌生调用方是否自主采用并测完整成本。
