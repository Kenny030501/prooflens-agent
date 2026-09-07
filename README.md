# ProofLens for Agents

让研究 Agent 的财务结论有据可查：提交公司、截止日期和主张，返回逐条判断、一手文件原文、会计口径和补查动作。

[![两分钟演示视频](public/og.png)](public/demo.mp4)

▶️ [两分钟演示视频](public/demo.mp4) · [在线演示](https://prooflens-agent.yaowenhu1215.chatgpt.site)（需所有者登录）· [项目 Notion](https://app.notion.com/p/3d2c4b789bd681a9bad0c88a14a8b3fa)

## 解决什么问题

Agent 生成的财务结论数字看上去合理，却常有三类错误：报告期错配（把季度写成年度）、口径混淆（把 Non-GAAP 当 GAAP）、有文件但没有支持结论的段落。人工逐条回查一手文件慢且贵。

ProofLens 把这个复核动作变成一次结构化调用。判断只分 supported / conflicted / insufficient 三档并给出补查动作，不输出可信度总分——期间错配、推导错误和缺证需要不同的处理，一个总分会把它们混在一起。每条判断绑定 SEC 原文引用和文档哈希，可回溯到具体段落。

## 给谁用

直接用户是执行投研任务的工具型 Agent，通过 REST 或 MCP 调用；受益者是用 Agent 做研究的分析师和个人投资者，网页控制台供人工演示与复核。需求来自真实投研工作流中反复出现的任务：让一个 Agent 核对另一个 Agent 给出的财务结论（8 个任务中的 12 条核验请求）。

当前为研究型 MVP：覆盖三家公司、18 份一手文件 / 690 个选定片段，真实 GLM 推理、双通道 TF-IDF 检索、命名操作数计算。

## 怎么用

```sh
curl http://localhost:3000/api/v2/evidence-audits \
  -H 'Content-Type: application/json' \
  -d '{"request_id":"example-001","entity":"AMZN","as_of":"2025-05-31","language":"zh","claims":[{"claim_id":"C1","text":"Amazon reported net income of $17.1 billion in Q1 2025."}]}'
```

每条主张返回判断、理由、结构化事实与原文证据（节选自仓库内录制的真实回执）：

```json
{
  "claim_id": "C1",
  "status": "supported",
  "reason": "证据明确指出2025年第一季度净利润增至171亿美元，与声明一致。",
  "facts": [{"metric": "net income", "value": 17.1, "unit": "billion", "period": "Q1 2025", "basis": "GAAP"}],
  "evidence": [{
    "url": "https://www.sec.gov/Archives/edgar/data/1018724/000101872425000034/amzn-20250331xex991.htm",
    "quote": "Net income increased to $17.1 billion in the first quarter, or $1.59 per diluted share..."
  }]
}
```

- `POST /api/mcp`：MCP 工具 `list_evidence_sources`、`verify_financial_claims`（Streamable HTTP，另支持本地 stdio 接入），契约见 [API / MCP 文档](docs/API_V2.md)
- `GET /api/demo?ticker=AMZN`：录制的真实调用回放，零成本体验
- `GET /api/evidence?ticker=AMZN`：当前文档目录

## 快速运行

```sh
npm ci
npm run db:local
node scripts/dev-with-key.mjs /ABSOLUTE/PATH/your-existing.env
```

环境文件需含服务端 ZHIPU_API_KEY。辅助程序生成被 Git 忽略的 .dev.vars，权限 600。本地使用 http://localhost:3000。托管版需项目所有者登录；它与 localhost 是不同运行环境。

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

联通测试需本地服务，使用无可用历史证据的日期，不产生模型费用。v1 测试仅作为历史记录保留，结果不反映 v2 质量。

## 实测结果与边界

120 条合成诊断题 115/120 标签一致；32 条文档留出题 30/32。未观察到错误放行，但这不证明真实错误率为零。第二模型复核 24 条，23 条与预设标签一致，1 条边界分歧。

同条件配对实验双方均 5/6 证据合格，额外核验更慢、更贵，未证明核心质量增益，该负面结果保留。随后一轮迭代旧失败回归 8/8，新增同来源家族主张 10/12。

五种模拟角色 × 两模型共 10 次任务，全部调用了工具，其中 4 次最终回答满足严格 JSON 解析及发布选择要求。模拟角色不能替代真人用户，Bootstrap 2,000 次重采样也不增加真实样本。

没有真人 SUS、信心校准改善、留存或付费数据。旧规则基线性能较低，不能据此声称优于普通检索或竞品。失败分母、来源分组和费用口径见[评测报告](docs/EVALUATION_V2_REPORT.md)。

## 防护与已知限制

覆盖三家公司、固定公共来源。拒绝未知来源、空输入、超长输入与重复 ID 冲突；模型输出漏项、引用伪造、算术错误或上游失败不放行。不保存草稿正文，不输出可信度总分，不生成交易建议。托管服务设每日 $2 和 50 次调用上限。

已知限制：模型仍可能误判支持关系；ISO 财务期间和逐输入推导绑定尚需增强。

## 深入阅读

- [最终结项报告与路线图](docs/FINAL_REPORT.md)
- [中英文案例、面试稿与简历表述](docs/FINAL_PORTFOLIO.md)
- [10 份 JD 与竞品矩阵](docs/ROLE_AND_COMPETITOR_MATRIX.md)
- [实施 PRD 与设计差异](docs/PRD_V0.3_IMPLEMENTED.md)
- [任务旅程与原型验证](docs/JOURNEY_AND_PROTOTYPE.md)
- [120 条评测报告](docs/EVALUATION_V2_REPORT.md)
- [模拟行为、标签分歧和迭代](docs/SIMULATION_AND_ITERATION.md)
- [运行与验收说明](docs/TEST_AND_RUNBOOK.md)
- [v0.3 逐题回执与冻结协议](eval/release-v0.3/)、[测试样本](eval/cases.json)、[全部逐题结果](eval/results-v2.1.json)、[模型调用原始回执](eval/runs-v2.1/)

旧 v0.1 文档、规则引擎与早期测试作为历史记录保留，不代表当前服务。
