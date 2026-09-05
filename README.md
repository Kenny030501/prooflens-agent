# ProofLens for Agents

面向研究 Agent 的历史财务主张证据服务。当前为可运行的研究型 MVP：真实 GLM 推理、TF-IDF、12 份 SEC 文件 / 585 个选定片段、REST 与两种 MCP 接口。

[私有在线演示](https://prooflens-agent.yaowenhu1215.chatgpt.site) · [项目 Notion](https://app.notion.com/p/3d2c4b789bd681a9bad0c88a14a8b3fa)

## 当前完成范围

产品流程推进至第六步“开发 MVP”。岗位矩阵、真实历史任务证据、产品定义、模拟原型测试、评测设计与代码已交付。真实市场采用、严格外部对照、长期效果和公开作品集发布属于后续工作。

原型升级后不再提供旧规则引擎的默认 pass，不保存草稿正文，不输出可信度总分，不生成交易建议。

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

联通测试需本地服务，使用无可用历史证据的日期，不产生模型费用。不要运行已废弃的 v1 测试来证明 v2 质量。

## 交付导航

- [10 份 JD 与竞品矩阵](docs/ROLE_AND_COMPETITOR_MATRIX.md)
- [实施 PRD 与设计差异](docs/PRD_V0.3_IMPLEMENTED.md)
- [任务旅程与原型验证](docs/JOURNEY_AND_PROTOTYPE.md)
- [API / MCP 契约](docs/API_V2.md)
- [120 条评测报告](docs/EVALUATION_V2_REPORT.md)
- [模拟行为、标签分歧和迭代](docs/SIMULATION_AND_ITERATION.md)
- [运行与验收说明](docs/TEST_AND_RUNBOOK.md)
- [测试样本](eval/cases.json)、[全部逐题结果](eval/results-v2.1.json)、[模型调用原始回执](eval/runs-v2.1/)

旧 v0.1 文档、规则引擎与早期测试作为历史记录保留，不代表当前服务。

## 实测结果与边界

120 条合成诊断题：115/120 标签一致；32 条文档留出题：30/32。未观察到错误放行，但这不证明真实错误率为零。第二模型复核24条，23条与预设标签一致，存在1条边界分歧。

五种模拟角色 × 两模型 = 10 次任务；全部调用了工具，只有4次最终回答满足严格JSON解析及发布选择要求。模拟角色不能当真人用户；Bootstrap 2,000 次重采样也不增加真实样本。

没有真人 SUS、信心校准改善、留存或付费数据。旧规则基线性能较低，不能据此声称优于普通检索或竞品。具体失败分母、来源分组和费用口径见报告。

## 安全与成本

三家公司、固定公共来源；拒绝未知来源、空输入、超长输入与重复ID冲突。模型输出漏项、引用伪造、算术错误或上游失败不放行。模型仍可能误判支持关系；ISO财务期间和逐输入推导绑定尚需增强。

预算分配：研究$5、本地$3、托管$12。服务每日$2和50次限制；金额为保守估算，供应商账单未知。禁止把密钥、私人历史对话、账户信息或机密材料提交到仓库。
