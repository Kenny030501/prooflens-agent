# 运行与验收

## 本地启动

Node >=22.13，首次执行 `npm ci`。不应把密钥加入源码或 Git。

```sh
npm run db:local
node scripts/dev-with-key.mjs /ABSOLUTE/PATH/your-existing.env
```

该文件需含 `ZHIPU_API_KEY`。启动辅助程序只将这一服务端密钥写入忽略的 `.dev.vars`（权限 600），同时将本地预算上限设为 $3。服务默认访问 `http://localhost:3000`。使用者另行创建的数据库或部署须重新核对总预算，不能靠重复复制项目绕过额度。

## 免费验证

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
```

联通测试需本地服务运行，但使用 2020 截止日，因此不调用付费模型。覆盖 REST、空输入、额外隐私字段、幂等缓存、旧接口停用、HTTP MCP 和 stdio MCP。

## 付费研究脚本

```sh
npx tsx scripts/run-eval.mjs /ABSOLUTE/PATH/your-existing.env
npx tsx scripts/agent-validation.mjs /ABSOLUTE/PATH/your-existing.env
node scripts/summarize-eval.mjs
```

现有评测结果已完成；重跑前复制研究结果到独立运行目录并明确新的预算，不覆盖已冻结实验。脚本按现有结果断点跳过；其预算是单次研究保护，不能替代供应商账户总账。角色模拟还会调用本地核验 API，其费用记入本机配额。

## 隐私与失败

持久化表：`source_documents`、`execution_receipts`、`behavior_events`。旧版表保留供迁移兼容。数据库没有草稿、主张或证据文本列；选定公共证据位于版本化 `data/corpus.json`。研究脚本只保存公开资料与合成任务，不包含历史私人日志。

预算预留与请求 ID 在模型调用前持久化。成功按 token 估算结算；失败保守保留预留额，避免超时后低估费用。需要释放时先核对供应商账单，不自动清零。人工重试用新 ID 且承担新的调用预算。

## 生产与回滚

托管版保留 owner-only 访问。服务端 GLM 密钥由 Sites secret 管理。MVP 不开放公共匿名付费调用。数据库变更由新增 Drizzle 迁移发布；不能改写已应用迁移。回滚应用版本时保留已有表，不删匿名回执以重置预算。

## 观察到的验证结果

- 类型检查、静态检查、构建需要全部成功后发布。
- 16 项单元检查和 18 项 REST / MCP 联通检查已执行；付费回归和 120 条评测另存原始回执。
- 网页空白输入提示、真实核验、原文展开、语言切换已在浏览器执行；514 像素宽度无横向溢出。自动化点击在小视口下使用 DOM 点击验证，未冒充真人操作。
- 未做规模压测、多租户权限、安全审计或生产 SLA 验证。
