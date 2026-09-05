# 岗位能力与竞品矩阵

核验日期：2026-09-04（纽约）。本表用于确定作品集应证明的能力，不是投递推荐或岗位资格确认。北京岗位、资深岗位与用户优先城市和经验可能不符；工时、毕业窗口、签证条件未由本表核验。

## 10 份官方 JD

| 岗位与来源 | 类型 / 约束 | 核心能力 | ProofLens 对应证据 |
|---|---|---|---|
| [百度 AI 产品经理 J100665](https://talent.baidu.com/jobs/detail/GRADUATE/423c0fa3-a0f3-4def-a882-7466d3685b79) | 校招，北京 | 需求定义、功能规划、跨团队落地、数据迭代 | 历史任务证据、PRD、运行 MVP、失败复盘 |
| [AI 产品实习生（AI Agent 方向）J103280](https://talent.baidu.com/jobs/detail/INTERN/d896e43f-94b7-4eb5-93af-d99a24896997) | 实习，北京；每周 5 天、至少 6 个月 | 行为观察、Agent 流程、模型边界、原型 | Agent 模拟任务、异常流程、证据界面；未声称有真人访谈 |
| [AI 开放平台产品经理实习生 J103342](https://talent.baidu.com/jobs/detail/INTERN/93b3c7ae-15ca-421c-b5ec-71492ea86561) | 实习，北京 | API / CLI / Skill 接入、文档与治理 | REST、HTTP MCP、stdio MCP、匿名回执 |
| [大模型推理产品经理 J100511](https://talent.baidu.com/jobs/detail/INTERN/4a1a40ba-31e6-4eaf-8b2f-543e25ba529a) | 实习，北京 | 推理 API、配额、计费流程、调用指标 | 实际 token、预算预留、失败封闭、幂等请求 |
| [搜索产品经理实习生 J104378](https://talent.baidu.com/jobs/detail/INTERN/373e44aa-c4f8-4364-9130-5fac8cb6f116) | 实习，北京；每周 5 天、至少 5 个月 | 搜索体验、样本准备、评测执行与复盘 | TF-IDF、120 条诊断题、检索覆盖与错误归因 |
| [大模型应用平台产品经理 J85776](https://talent.baidu.com/jobs/detail/SOCIAL/aa3be39c-798a-4d92-a5af-1c84fa63b049) | 社招，3 年以上；能力参照 | Agent 框架、RAG、复杂需求抽象 | 证据服务边界、接口契约与架构取舍 |
| [大模型产品经理 J95988](https://talent.baidu.com/jobs/detail/SOCIAL/7aee42e3-9970-445e-a84d-376b1295dd49) | 社招；能力参照 | 自动评估工具、反馈分析、模型效果优化 | 固定 schema、错误样本、回归测试 |
| [大模型评估产品经理 J82456](https://talent.baidu.com/jobs/detail/SOCIAL/c9bb90bd-df09-4534-b88c-c44f00530e27) | 社招；能力参照 | 评估标准、用户行为研究、商业分析 | 标签规则、Bootstrap 边界、真实任务与模拟行为区分 |
| [AgentFlow 产品经理 J103447](https://talent.baidu.com/jobs/detail/SOCIAL/f44cdb84-67f5-41ea-a2a6-417a4ff334c0) | 社招，3 年以上；能力参照 | 工作流、知识接入、效果机制、能力封装 | 同一引擎供网页 / REST / MCP 使用 |
| [OpenAI Safety Measurement PM](https://openai.com/careers/product-manager-safety-measurement-san-francisco/) | 资深岗位，6 年以上；能力参照 | 测量策略、成功标准、跨职能决策 | 指标树、误放行护栏、失败计入分母 |

两个先前收集的实习详情页本次仅返回登录页，未纳入上述 10 份完整 JD。没有用岗位列表摘要替代失效详情。

### 与个人经历的连接

- 投研核验经历：提供利润口径、期间错配、预期与实际混淆等具体问题。
- 行为与决策科学：帮助定义自动化偏误、证据使用和信心校准；当前 Agent 测试不套用真人心理测量结论。
- 量化研究：样本划分、标签质量、失败分母、重采样不确定性。
- 咨询与数据架构：将业务流程拆成输入、处理、输出、指标和交付物。

本项目不证明真实团队管理经验，也不把 AI 协作开发写成管理算法和工程团队。

## 四类替代方案

| 方案 | 官方文档可确认能力 | 与本项目关系 | 本项目选择 |
|---|---|---|---|
| [Tavily Search](https://docs.tavily.com/documentation/api-reference/endpoint/search) | 搜索、域名与日期过滤、可返回解析后的正文 | 适合上游资料发现；与逐项财务口径校验相邻 | MVP 固定 SEC 集合，暂不加入全网检索 |
| [Exa Contents](https://exa.ai/docs/reference/contents-api-guide) | 从 URL 获取内容，可使用文本或相关摘录 | 解决资料获取和上下文选择 | 本项目保存来源哈希和规范化段落位置 |
| [Parallel Basis](https://parallel.ai/blog/introducing-basis-with-calibrated-confidences) | 输出引用、摘录、推理依据及校准置信信息 | 更广泛的机器研究与可验证输出，直接相邻 | 聚焦财务期间、GAAP、实际 / 指引区分；尚未证明更优 |
| [Patronus Evaluate](https://docs.patronus.ai/docs/api_ref/evaluations/evaluate_v1_evaluate_post) | 对模型输入、输出、上下文执行评估 | 适合 RAG 质量检测和外部评估 | 保留逐主张证据与恢复动作，未来可接独立评审器 |

以上是文档级能力比较，没有实际采购或对竞品做同预算性能测试。“垂直财务口径”是定位选择，尚不是已证实的技术壁垒。
