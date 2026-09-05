import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('../eval/', import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const data = read('results-v2.1.json');
const cases = read('cases.json').cases;
if (
  data.results.length !== 120 ||
  new Set(data.results.map((r) => r.id)).size !== 120
)
  throw new Error('Evaluation incomplete');
const pct = (a, b) => (b ? (100 * a) / b : null);
function metrics(rows) {
  const supported = rows.filter((r) => r.expected === 'supported');
  const unsupported = rows.filter((r) => r.expected !== 'supported');
  return {
    n: rows.length,
    accuracy_pct: pct(rows.filter((r) => r.correct).length, rows.length),
    legacy_accuracy_pct: pct(
      rows.filter((r) => r.legacy_correct).length,
      rows.length,
    ),
    unsupported_recall_pct: pct(
      unsupported.filter(
        (r) => r.predicted === 'conflicted' || r.predicted === 'insufficient',
      ).length,
      unsupported.length,
    ),
    false_challenge_pct: pct(
      supported.filter(
        (r) => r.predicted === 'conflicted' || r.predicted === 'insufficient',
      ).length,
      supported.length,
    ),
    false_pass_count: unsupported.filter((r) => r.predicted === 'supported')
      .length,
    execution_failed: rows.filter((r) => r.predicted === 'execution_failed')
      .length,
  };
}
let seed = 20260904;
const random = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
};
const cluster = (r) => {
  const c = cases.find((c) => c.id === r.id);
  const oldDocs = [
    'AMZN-2024Q1',
    'AMZN-2024Q2',
    'MRVL-2025Q2',
    'MRVL-2025Q3',
    'NVDA-2025Q1',
    'NVDA-2025Q2',
  ];
  return c.source_ids.some((id) => oldDocs.includes(id))
    ? c.entity + '-paired-periods'
    : c.cluster;
};
function bootstrap(rows) {
  const ids = [...new Set(rows.map(cluster))];
  const estimates = [];
  for (let b = 0; b < 2000; b++) {
    const selected = Array.from(
      { length: ids.length },
      () => ids[Math.floor(random() * ids.length)],
    ).flatMap((id) => rows.filter((r) => cluster(r) === id));
    const m = metrics(selected);
    estimates.push(m.accuracy_pct);
  }
  estimates.sort((a, b) => a - b);
  return {
    method: 'cluster percentile bootstrap',
    resamples: 2000,
    seed: 20260904,
    independent_source_groups: ids.length,
    accuracy_interval_pct: [estimates[49], estimates[1949]],
    note: 'Resampling does not create new cases or users. Four heldout document groups and repeated mutation templates limit inference. Degenerate intervals do not imply zero risk.',
  };
}
const runs = readdirSync(new URL('runs-v2.1/', root))
  .filter((f) => f.endsWith('.json'))
  .map((f) => read('runs-v2.1/' + f));
let citations = 0,
  valid = 0;
const corpus = JSON.parse(
  readFileSync(new URL('../data/corpus.json', root), 'utf8'),
);
for (const run of runs)
  for (const r of run.response?.results ?? [])
    for (const e of r.evidence) {
      citations++;
      const p = corpus.passages.find((p) => p.id === e.passage_id);
      if (
        p &&
        p.text.includes(e.quote) &&
        p.url === e.url &&
        p.filedAt <= run.input.as_of
      )
        valid++;
    }
const summary = {
  all: metrics(data.results),
  development: metrics(data.results.filter((r) => r.split === 'development')),
  heldout: metrics(data.results.filter((r) => r.split === 'heldout')),
  bootstrap_heldout: bootstrap(
    data.results.filter((r) => r.split === 'heldout'),
  ),
  requests: runs.length,
  complete_requests: runs.filter((r) => !r.error).length,
  citation_integrity: {
    valid,
    total: citations,
    percent: pct(valid, citations),
    definition:
      'Known source + verbatim excerpt + eligible date; not independent semantic entailment.',
  },
  estimated_usd: data.estimated_usd,
  errors: data.results
    .filter((r) => !r.correct)
    .map((r) => ({ id: r.id, expected: r.expected, predicted: r.predicted })),
  real_human_users: 0,
};
writeFileSync(new URL('summary.json', root), JSON.stringify(summary, null, 2));
const s = summary;
const report = `# 120 条离线诊断评测\n\n范围：来源约束的合成财务核验题，不是 120 名用户或双人标注黄金集。模型 GLM-5.2；提示词、语料和样本哈希见 protocol-v2.1.json。\n\n| 集合 | 条数 | 标签一致率 | 旧规则基线一致率 | 未支持召回率 | 错误质疑率 | 错误放行 |\n|---|---:|---:|---:|---:|---:|---:|\n${[
  'all',
  'development',
  'heldout',
]
  .map((k) => {
    const m = s[k];
    return (
      '| ' +
      k +
      ' | ' +
      m.n +
      ' | ' +
      m.accuracy_pct.toFixed(2) +
      '% | ' +
      m.legacy_accuracy_pct.toFixed(2) +
      '% | ' +
      m.unsupported_recall_pct.toFixed(2) +
      '% | ' +
      m.false_challenge_pct.toFixed(2) +
      '% | ' +
      m.false_pass_count +
      ' |'
    );
  })
  .join(
    '\n',
  )}\n\n${s.complete_requests}/${s.requests} 个请求完整返回；失败请求仍计入分母。模型估算费用 $${s.estimated_usd.toFixed(5)}，真实账单未取得。\n\n引用完整性 ${s.citation_integrity.valid}/${s.citation_integrity.total}：检查来源 ID、逐字摘录和日期，不能代替人工语义审阅。\n\n## Bootstrap\n\n留出集 32 条、4 个不同文档组；固定随机种子，按文档组有放回抽样 2,000 次。标签一致率区间为 ${s.bootstrap_heldout.accuracy_interval_pct.map((x) => x.toFixed(2)).join('–')}%。样本数仍为 32，真人数仍为 0。若区间退化，表示观察到的组间差异不足，不能据此推断真实风险为零。\n\n## 解释边界\n\n- 基线为旧 v1 规则原型；语料较少、没有同等日期处理，因此只是版本回归比较，不能证明优于普通检索、直接读原文或竞品。\n- 36 个基础事实配对变异产生多个相关样本，另含 24 条早期跨期诊断；训练 / 测试标签由 Agent 编写，第二模型复核另存。\n- 12 条日期穿越题不调用模型；另报总体与留出结果，不把零费用路径冒充模型能力。\n- 早期 v2 测试执行了 30 条后发现“空 source_ids”让无证据题过于简单，保留原结果，修正范围后完整重跑 120 条。旧结果不合并计数。\n- 本轮不报告真人 SUS、信心校准改善、任务提速或市场需求成立。\n\n## 不一致案例\n\n${s.errors.length ? s.errors.map((e) => '- ' + e.id + '：预期 ' + e.expected + '，输出 ' + e.predicted).join('\n') : '本集合未观察到标签不一致；继续保持真实任务与外部留出验证。'}\n`;
writeFileSync(new URL('../docs/EVALUATION_V2_REPORT.md', root), report);
console.log(JSON.stringify(summary, null, 2));
