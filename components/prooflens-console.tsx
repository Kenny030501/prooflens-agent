'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Download,
  Code2,
  Database,
  Activity,
  LoaderCircle,
  Check,
  CircleAlert,
  CircleHelp,
} from 'lucide-react';
import type { AuditOutput } from '@/lib/v2/engine';
import type { runtimeStatus } from '@/lib/v2/runtime';
import type { corpus } from '@/lib/v2/retrieval';
type Health = Partial<Awaited<ReturnType<typeof runtimeStatus>>>;
type Source = (typeof corpus.documents)[number];

type Entity = 'AMZN' | 'MRVL' | 'NVDA';
const examples: Record<Entity, string> = {
  AMZN: 'AWS sales increased 17% year over year in Q1 2024.\nAmazon operating income rose from $4.8 billion in Q1 2023 to $15.3 billion in Q1 2024.\nAWS sales decreased 17% year over year in Q1 2024.\nTrainium held 70% of global inference market share in June 2024.',
  MRVL: 'Marvell Q2 FY2025 revenue was $1.273 billion.\nMarvell Q2 FY2025 GAAP net income was $266.2 million.\nMarvell guided Q3 FY2025 revenue to $1.450 billion plus or minus 5%.',
  NVDA: 'NVIDIA Q2 FY2025 revenue was $30.0 billion.\nNVIDIA Q2 FY2025 Data Center revenue was $26.3 billion.\nBlackwell was already in full volume production in Q2 FY2025.',
};
const dates: Record<Entity, string> = {
  AMZN: '2024-08-02',
  MRVL: '2024-08-29',
  NVDA: '2024-08-28',
};
export function ProofLensConsole() {
  const [zh, setZh] = useState(true);
  const [entity, setEntity] = useState<Entity>('AMZN');
  const [asOf, setAsOf] = useState(dates.AMZN);
  const [draft, setDraft] = useState(examples.AMZN);
  const [tab, setTab] = useState('audit');
  const [result, setResult] = useState<AuditOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState<Health | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [telemetry, setTelemetry] = useState('');
  const session = useRef('');
  const t = (cn: string, en: string) => (zh ? cn : en);
  const refresh = () =>
    fetch('/api/health')
      .then((r) => r.json())
      .then((v) => setHealth(v as Health))
      .catch(() => setHealth({ status: 'unavailable' }));
  useEffect(() => {
    session.current = crypto.randomUUID();
    void refresh();
  }, []);
  useEffect(() => {
    fetch('/api/evidence?ticker=' + entity)
      .then((r) => r.json())
      .then((v) => setSources((v as { documents: Source[] }).documents ?? []))
      .catch(() => setSources([]));
  }, [entity]);
  const event = async (event_name: string, duration_ms?: number) => {
    try {
      const r = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name,
          entity,
          session_id: session.current,
          duration_ms,
        }),
      });
      if (!r.ok)
        setTelemetry(
          t('匿名事件记录暂不可用', 'Anonymous event recording unavailable'),
        );
    } catch {
      setTelemetry(
        t('匿名事件记录暂不可用', 'Anonymous event recording unavailable'),
      );
    }
  };
  const requestBody = () => ({
    request_id: 'run_' + crypto.randomUUID(),
    entity,
    as_of: asOf,
    language: zh ? 'zh' : 'en',
    claims: draft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text, i) => ({ claim_id: 'C' + (i + 1), text })),
  });
  async function run() {
    const input = requestBody();
    if (
      !input.claims.length ||
      input.claims.length > 12 ||
      input.claims.some((c) => c.text.length < 5 || c.text.length > 1000)
    ) {
      setError(
        t(
          '请输入 1–12 条主张，每行一条，每条 5–1,000 字符。',
          'Enter 1–12 claims, one per line, 5–1,000 characters each.',
        ),
      );
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    const start = Date.now();
    void event('audit_started');
    try {
      const response = await fetch('/api/v2/evidence-audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(75000),
      });
      const value = (await response.json()) as AuditOutput & {
        error?: { code: string; message: string };
      };
      if (!response.ok)
        throw new Error(value.error?.code + ': ' + value.error?.message);
      setResult(value);
      void event('audit_completed', Date.now() - start);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit unavailable');
    } finally {
      setBusy(false);
      void refresh();
    }
  }
  function choose(e: Entity) {
    setEntity(e);
    setAsOf(dates[e]);
    setDraft(examples[e]);
    setResult(null);
    setError('');
  }
  function download() {
    if (!result) return;
    const u = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = u;
    a.download = 'prooflens-' + result.request_id + '.json';
    a.click();
    URL.revokeObjectURL(u);
    void event('result_exported');
  }
  const statusLabel = (s: string) =>
    s === 'supported'
      ? t('已支持', 'Supported')
      : s === 'conflicted'
        ? t('存在冲突', 'Conflicted')
        : t('证据不足', 'Insufficient');
  const icon = (s: string) =>
    s === 'supported' ? (
      <Check size={18} />
    ) : s === 'conflicted' ? (
      <CircleAlert size={18} />
    ) : (
      <CircleHelp size={18} />
    );
  return (
    <div className="pl2" translate="no">
      <header className="pl2-header">
        <div className="pl2-brand">
          <span className="pl2-logo">
            <ShieldCheck size={27} />
          </span>
          <div>
            <strong>
              ProofLens <small>AGENT MVP</small>
            </strong>
            <p>
              {t(
                '研究 Agent 的证据核验工具',
                'Evidence tools for research agents',
              )}
            </p>
          </div>
        </div>
        <button onClick={() => setZh(!zh)}>{zh ? 'English' : '中文'}</button>
      </header>
      <div className="pl2-layout">
        <aside className="pl2-sidebar">
          <p className="pl2-eyebrow">WORKSPACE</p>
          {[
            ['audit', Activity, t('核验工作台', 'Audit workspace')],
            ['sources', Database, t('证据库', 'Evidence library')],
            ['api', Code2, t('Agent 接入', 'Agent integration')],
          ].map(([id, Icon, label]) => {
            const I = Icon as typeof Activity;
            return (
              <button
                key={id as string}
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id as string)}
              >
                <I size={19} />
                {label as string}
              </button>
            );
          })}
          <div className="pl2-budget">
            <strong>{t('调用护栏', 'Cost guardrail')}</strong>
            <p>{health?.model ?? '—'}</p>
            <p>
              {t('今日估算', 'Today estimated')}: $
              {health?.budget?.estimated_daily_usd?.toFixed(4) ?? '—'} / $2
            </p>
            <p>
              {t(
                '项目预算：托管 $12、本机 $3、研究 $5。失败调用保守保留预算。',
                'Project allocation: hosted $12, local $3, research $5. Failed calls retain a conservative reservation.',
              )}
            </p>
            <span>{health?.status ?? 'loading'}</span>
          </div>
        </aside>
        <main className="pl2-main">
          <p className="pl2-eyebrow">EVIDENCE BEFORE ANSWERS · V0.2</p>
          <h1>
            {t(
              '让每条主张，经得起追溯。',
              'Evidence before your agent answers.',
            )}
          </h1>
          <p className="pl2-lead">
            {t(
              '逐条核对事实、期间与计量口径。把证据和下一步动作交还给 Agent。',
              'Check facts, reporting periods and accounting basis. Return evidence and next actions to your agent.',
            )}
          </p>
          <div className="pl2-notice">
            {t(
              '范围：12 份历史 SEC 文件的选定段落，不提供实时行情或买卖建议。未找到证据不代表主张一定错误。',
              'Scope: selected passages from 12 historical SEC filings. No live market data or trading advice. Missing evidence is not proof of falsity.',
            )}
          </div>
          {tab === 'audit' && (
            <div className="pl2-grid">
              <section className="pl2-panel pl2-input">
                <h2>{t('配置核验', 'Configure audit')}</h2>
                <label>
                  {t('公司 / 证据集合', 'Company / evidence corpus')}
                </label>
                <div className="pl2-entities">
                  {(['AMZN', 'MRVL', 'NVDA'] as Entity[]).map((e) => (
                    <button
                      aria-pressed={entity === e}
                      className={entity === e ? 'active' : ''}
                      onClick={() => choose(e)}
                      key={e}
                      disabled={busy}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <label htmlFor="asof">
                  {t('资料截至日期', 'Evidence as of')}
                </label>
                <input
                  id="asof"
                  type="date"
                  value={asOf}
                  onChange={(e) => {
                    setAsOf(e.target.value);
                    setResult(null);
                  }}
                  disabled={busy}
                />
                <label htmlFor="claims">
                  {t('待核验主张 · 每行一条', 'Claims · one per line')}
                </label>
                <textarea
                  id="claims"
                  rows={13}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setResult(null);
                  }}
                  disabled={busy}
                  maxLength={12000}
                />
                <p className="pl2-muted">
                  {t(
                    '1–12 条，每条 5–1,000 字符。原文仅用于本次服务端推理及最长 10 分钟内存缓存，不写入数据库。模型提供商可能按其政策留存请求；请勿输入机密。',
                    '1–12 claims; 5–1,000 characters each. Text is used for server inference and a 10-minute memory cache, not stored in the database. Provider retention policies may apply. No confidential inputs.',
                  )}
                </p>
                <button className="pl2-primary" onClick={run} disabled={busy}>
                  {busy ? (
                    <LoaderCircle className="pl2-spin" size={18} />
                  ) : (
                    <ShieldCheck size={18} />
                  )}{' '}
                  {busy
                    ? t('正在检索与核验…', 'Retrieving and verifying…')
                    : t('开始核验', 'Run verification')}
                </button>
                <p className="pl2-muted">
                  {t(
                    '每次提交可能产生少量 API 费用；不会自动重试付费调用。',
                    'A small API charge may apply. Paid calls are never retried automatically.',
                  )}
                </p>
              </section>
              <section className="pl2-results" aria-live="polite">
                {error && (
                  <div role="alert" className="pl2-error">
                    <strong>
                      {t(
                        '未完成核验；未放行任何主张。',
                        'Audit incomplete; no claims approved.',
                      )}
                    </strong>
                    <p>{error}</p>
                  </div>
                )}
                {!result && !busy && !error && (
                  <div className="pl2-empty">
                    <ShieldCheck size={48} />
                    <h2>
                      {t('从一份研究草稿开始', 'Start with a research draft')}
                    </h2>
                    <p>
                      {t(
                        '左侧已提供包含正确、错误和缺少证据主张的示例。运行后查看逐条判断、原文证据和可执行动作。',
                        'The example includes accurate, incorrect and unsupported claims. Run it to inspect verdicts, source quotes and recovery actions.',
                      )}
                    </p>
                  </div>
                )}
                {busy && (
                  <div className="pl2-empty">
                    <LoaderCircle className="pl2-spin" size={40} />
                    <h2>{t('正在调用真实模型', 'Calling the model')}</h2>
                    <p>
                      {t(
                        '通常需要 10–60 秒。期间、单位、事实与指引会分别核对。',
                        'Typically 10–60 seconds. Periods, units, facts and guidance are checked separately.',
                      )}
                    </p>
                  </div>
                )}
                {result && (
                  <>
                    <div className="pl2-panel">
                      <div className="pl2-resulthead">
                        <h2>{t('核验结果', 'Audit results')}</h2>
                        <button onClick={download}>
                          <Download size={17} />
                          {t('导出 JSON', 'Export JSON')}
                        </button>
                      </div>
                      <p>{result.request_id}</p>
                      <div className="pl2-counts">
                        {Object.entries(result.coverage).map(([s, n]) => (
                          <span className={'pl2-status ' + s} key={s}>
                            {icon(s)} {statusLabel(s)} {n}
                          </span>
                        ))}
                      </div>
                      <p>
                        {t('后续动作', 'Gate')}:{' '}
                        {result.gate === 'evidence_ready'
                          ? t(
                              '证据已就绪，引用时保留来源',
                              'Evidence ready; preserve citations',
                            )
                          : t(
                              '暂停引用未支持内容，按下方动作补查',
                              'Hold unsupported content; follow recovery actions',
                            )}
                      </p>
                      <p className="pl2-muted">
                        {result.usage.model} ·{' '}
                        {(result.usage.elapsed_ms / 1000).toFixed(1)}s · $
                        {result.usage.estimated_usd.toFixed(5)} ·{' '}
                        {t('资料截至', 'Source cutoff')}{' '}
                        {result.source_cutoff ?? '—'}
                      </p>
                    </div>
                    {result.results.map((r) => (
                      <article
                        className={'pl2-panel pl2-claim ' + r.status}
                        key={r.claim_id}
                      >
                        <span className={'pl2-status ' + r.status}>
                          {icon(r.status)}
                          {statusLabel(r.status)} · {r.claim_id}
                        </span>
                        <h3>{r.claim}</h3>
                        <p>{r.reason}</p>
                        <div className="pl2-action">
                          {t('下一步', 'Next action')}:{' '}
                          <code>{r.next_action}</code>
                        </div>
                        {r.missing_fields.length > 0 && (
                          <p>
                            {t('缺少 / 风险', 'Missing / risk')}:{' '}
                            {r.missing_fields.join(', ')}
                          </p>
                        )}
                        {r.facts.length > 0 && (
                          <details>
                            <summary>
                              {t('查看计量口径', 'Inspect reporting basis')}
                            </summary>
                            {r.facts.map((f, i) => (
                              <p key={i}>
                                {f.metric}: {f.value ?? '—'} {f.currency}{' '}
                                {f.unit} · {f.period ?? 'unknown'} · {f.basis} ·{' '}
                                {f.origin}
                              </p>
                            ))}
                          </details>
                        )}
                        {r.evidence.map((e, i) => (
                          <details
                            key={e.passage_id + '-' + i}
                            onToggle={(ev) => {
                              if (ev.currentTarget.open)
                                void event('evidence_opened');
                            }}
                          >
                            <summary>
                              {t('查看原文证据', 'Open source evidence')} ·{' '}
                              {e.source_id}
                            </summary>
                            <blockquote>{e.quote}</blockquote>
                            <p className="pl2-muted">
                              {e.locator} · {e.filed_at}
                            </p>
                            <a href={e.url} target="_blank" rel="noreferrer">
                              {t('打开 SEC 原文件', 'Open SEC filing')}{' '}
                              <ExternalLink size={14} />
                            </a>
                            <p className="pl2-hash">
                              SHA256: {e.document_sha256}
                            </p>
                          </details>
                        ))}
                      </article>
                    ))}
                    <section className="pl2-panel">
                      <h2>{t('仅保留已支持事实', 'Supported facts only')}</h2>
                      {result.verified_summary.length ? (
                        result.verified_summary.map((c) => (
                          <p key={c.claim_id}>
                            {c.text} <small>[{c.citations.join(', ')}]</small>
                          </p>
                        ))
                      ) : (
                        <p>
                          {t(
                            '本次没有可纳入摘要的已支持事实。',
                            'No supported facts available for this summary.',
                          )}
                        </p>
                      )}
                    </section>
                  </>
                )}
              </section>
            </div>
          )}
          {tab === 'sources' && (
            <section className="pl2-panel">
              <h2>
                {t(
                  '证据库 · 可追溯的历史快照',
                  'Evidence library · versioned snapshots',
                )}
              </h2>
              <div className="pl2-entities">
                {(['AMZN', 'MRVL', 'NVDA'] as Entity[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => choose(e)}
                    aria-pressed={entity === e}
                  >
                    {e}
                  </button>
                ))}
              </div>
              {sources.map((d) => (
                <article key={d.id} className="pl2-source">
                  <h3>
                    {d.id} · {d.form}
                  </h3>
                  <p>
                    {d.period} · {t('提交日期', 'Filed')} {d.filedAt} ·{' '}
                    {d.selected_passages} {t('段', 'passages')}
                  </p>
                  <a href={d.url} target="_blank" rel="noreferrer">
                    {t('打开 SEC 原文件', 'Open SEC filing')}{' '}
                    <ExternalLink size={15} />
                  </a>
                  <p className="pl2-hash">{d.sha256}</p>
                </article>
              ))}
            </section>
          )}
          {tab === 'api' && (
            <section className="pl2-panel">
              <h2>{t('直接给 Agent 的接口', 'Interfaces for agents')}</h2>
              <p>
                REST: <code>POST /api/v2/evidence-audits</code>
              </p>
              <p>
                MCP: <code>POST /api/mcp</code> · Streamable HTTP ·{' '}
                <code>verify_financial_claims</code>
              </p>
              <p>
                {t(
                  '先调用 list_evidence_sources，确认公司、日期与覆盖范围。受保护的部署仍需平台授权；本地接口默认仅在本机使用。',
                  'Call list_evidence_sources first. Protected deployments require platform authorization; local access is intended for your machine.',
                )}
              </p>
              <pre>
                {JSON.stringify(
                  {
                    request_id: 'example-001',
                    entity: 'AMZN',
                    as_of: '2024-08-02',
                    language: 'en',
                    claims: [
                      {
                        claim_id: 'C1',
                        text: 'AWS sales increased 17% year over year in Q1 2024.',
                      },
                    ],
                  },
                  null,
                  2,
                )}
              </pre>
              <p>
                422 invalid_request · 409 request_already_executed · 429
                budget_or_duplicate · 502 model_schema_error · 503
                model_not_configured
              </p>
              <p>
                {t(
                  '相同 ID、相同请求可在进程内缓存期重用；重启后只保留匿名回执，重复 ID 不会再次计费执行。',
                  'Identical requests reuse a short-lived in-process cache. After restart only anonymous receipts remain; duplicate IDs are not billed again.',
                )}
              </p>
            </section>
          )}
          {telemetry && <output>{telemetry}</output>}
          <footer className="pl2-footer">
            {t(
              'MVP / 研究用途 · 模型仍可能误判 · 无可信度总分 · 不保存草稿正文',
              'Research MVP · Models can be wrong · No aggregate trust score · No draft database retention',
            )}
          </footer>
        </main>
      </div>
    </div>
  );
}
