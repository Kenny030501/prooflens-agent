'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowUpRight,
  Bot,
  Braces,
  Check,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileSearch,
  Gauge,
  GitBranch,
  Languages,
  LoaderCircle,
  PanelTop,
  Play,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  TriangleAlert,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  auditDraft,
  evidenceLibrary,
  sampleDrafts,
  type AuditRequest,
  type AuditResult,
  type ClaimAssessment,
  type Language,
  type Ticker,
  type Verdict,
} from '@/lib/prooflens';

type View = 'runs' | 'evidence' | 'evals' | 'tools' | 'case';

const verdictOrder: Verdict[] = ['supported', 'partial', 'conflicted', 'no_evidence', 'inference'];
const verdictIcons = {
  supported: Check,
  partial: TriangleAlert,
  conflicted: XCircle,
  no_evidence: CircleAlert,
  inference: GitBranch,
};

const copy = {
  en: {
    tagline: 'Evidence infrastructure for research agents',
    beta: 'Agent beta',
    navTitle: 'Workspace',
    runs: 'Live runs',
    evidence: 'Evidence library',
    evals: 'Evaluations',
    tools: 'Agent tools',
    case: 'Product case',
    api: 'API',
    headline: 'Audit before your agent answers.',
    intro: 'A claim-level verification layer that forces research agents to show evidence, uncertainty, and handoff decisions.',
    configure: 'Configure run',
    agentId: 'Agent identity',
    company: 'Evidence corpus',
    question: 'Research question',
    draft: 'Agent draft',
    preConfidence: 'Agent confidence before audit',
    run: 'Run evidence gate',
    running: 'Auditing claims…',
    reset: 'Load sample',
    incoming: 'Claim trace',
    gate: 'Publication gate',
    sourceCoverage: 'Evidence coverage',
    sourceCutoff: 'Source cutoff',
    evidenceFound: 'evidence match',
    evidenceFoundPlural: 'evidence matches',
    humanOverride: 'Human override',
    reason: 'Why this verdict',
    source: 'Primary evidence',
    noSource: 'No source met the minimum evidence threshold.',
    postConfidence: 'Reviewer confidence after audit',
    record: 'Record calibration',
    exportJson: 'Export audit JSON',
    openSource: 'Open SEC source',
    privacy: 'Raw drafts are not persisted',
    seedEngine: 'Deterministic seed engine',
    error: 'The audit could not be completed. Check the input and try again.',
  },
  zh: {
    tagline: '面向研究 Agent 的证据核验基础设施',
    beta: 'Agent 测试版',
    navTitle: '工作台',
    runs: '运行追踪',
    evidence: '证据库',
    evals: '评测体系',
    tools: 'Agent 工具',
    case: '产品案例',
    api: '接口',
    headline: '让 Agent 在回答前完成证据审计。',
    intro: '逐条核验研究结论，暴露证据、不确定性和人工接管决策。',
    configure: '配置运行',
    agentId: 'Agent 标识',
    company: '证据语料库',
    question: '研究问题',
    draft: 'Agent 草稿',
    preConfidence: '审计前 Agent 信心',
    run: '运行证据门禁',
    running: '正在核验主张…',
    reset: '载入示例',
    incoming: '主张追踪',
    gate: '发布门禁',
    sourceCoverage: '证据覆盖',
    sourceCutoff: '资料截止日',
    evidenceFound: '条证据',
    evidenceFoundPlural: '条证据',
    humanOverride: '人工复核',
    reason: '判断理由',
    source: '一手证据',
    noSource: '没有来源达到最低证据阈值。',
    postConfidence: '审计后复核者信心',
    record: '记录信心校准',
    exportJson: '导出审计 JSON',
    openSource: '打开 SEC 原文',
    privacy: '不持久化保存原始草稿',
    seedEngine: '确定性种子引擎',
    error: '审计未完成，请检查输入后重试。',
  },
};

const verdictLabels: Record<Language, Record<Verdict, string>> = {
  en: { supported: 'Supported', partial: 'Partial', conflicted: 'Conflicted', no_evidence: 'No evidence', inference: 'Inference' },
  zh: { supported: '已支持', partial: '部分支持', conflicted: '存在冲突', no_evidence: '未找到证据', inference: '分析推断' },
};

const claimTypeLabels = {
  en: { quantitative: 'Quantitative fact', management_statement: 'Management statement', causal: 'Causal claim', forward_looking: 'Forward-looking', general: 'General claim' },
  zh: { quantitative: '定量事实', management_statement: '管理层表述', causal: '因果判断', forward_looking: '前瞻判断', general: '一般主张' },
};

function createInitialResult() {
  return auditDraft({
    language: 'en',
    agentId: 'equity_research_agent',
    ticker: 'AMZN',
    question: sampleDrafts.AMZN.question,
    draftText: sampleDrafts.AMZN.draft,
    preConfidence: 82,
  });
}

export function ProofLensConsole() {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<View>('runs');
  const [ticker, setTicker] = useState<Ticker>('AMZN');
  const [agentId, setAgentId] = useState('equity_research_agent');
  const [question, setQuestion] = useState(sampleDrafts.AMZN.question);
  const [draft, setDraft] = useState(sampleDrafts.AMZN.draft);
  const [preConfidence, setPreConfidence] = useState(82);
  const [postConfidence, setPostConfidence] = useState(61);
  const [result, setResult] = useState<AuditResult>(createInitialResult);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const t = copy[language];

  const submitAudit = async (payload?: Partial<AuditRequest>) => {
    const body: AuditRequest = {
      language,
      agentId,
      ticker,
      question,
      draftText: draft,
      preConfidence,
      ...payload,
    };
    setRunning(true);
    setError('');
    void trackEvent('audit_started', undefined, body.agentId, body.ticker);
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`Audit failed: ${response.status}`);
      const next = await response.json() as AuditResult;
      setResult(next);
      setTicker(next.ticker);
      setQuestion(next.question);
      if (payload?.draftText) setDraft(payload.draftText);
      setPostConfidence(Math.max(20, Math.min(95, preConfidence - (next.gateDecision === 'block' ? 21 : 8))));
      void trackEvent('audit_completed', next.caseId, next.agentId, next.ticker, { gateDecision: next.gateDecision, claimCount: next.assessments.length });
      return next;
    } catch {
      setError(t.error);
      throw new Error(t.error);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool({
      name: 'audit_research_draft',
      title: 'Audit research draft',
      description: 'Audit an AMZN, MRVL, or NVDA research draft against the bounded primary-source corpus and return a publication gate.',
      inputSchema: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['en', 'zh'] },
          agentId: { type: 'string', minLength: 1 },
          ticker: { type: 'string', enum: ['AMZN', 'MRVL', 'NVDA'] },
          question: { type: 'string', minLength: 5 },
          draftText: { type: 'string', minLength: 12, maxLength: 12000 },
          preConfidence: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['language', 'agentId', 'ticker', 'question', 'draftText'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      async execute(input) {
        const response = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error(`ProofLens rejected the audit request (${response.status}).`);
        const next = await response.json() as AuditResult;
        setLanguage(next.language);
        setTicker(next.ticker);
        setAgentId(next.agentId);
        setQuestion(next.question);
        setDraft((input as AuditRequest).draftText);
        setResult(next);
        setView('runs');
        return { caseId: next.caseId, gateDecision: next.gateDecision, gateReason: next.gateReason, assessments: next.assessments };
      },
    }, { signal: lifecycle.signal });
    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const loadSample = (nextTicker = ticker) => {
    const sample = sampleDrafts[nextTicker];
    setTicker(nextTicker);
    setQuestion(sample.question);
    setDraft(sample.draft);
    setPreConfidence(82);
    setResult(auditDraft({ language, agentId, ticker: nextTicker, question: sample.question, draftText: sample.draft, preConfidence: 82 }));
    setError('');
  };

  const overrideVerdict = (claimId: string, verdict: Verdict) => {
    setResult((current) => {
      const assessments = current.assessments.map((claim) => claim.claimId === claimId
        ? { ...claim, verdict, requiresHumanReview: verdict !== 'supported' }
        : claim);
      const coverage = { supported: 0, partial: 0, conflicted: 0, no_evidence: 0, inference: 0 } as Record<Verdict, number>;
      for (const claim of assessments) coverage[claim.verdict] += 1;
      const hasBlocker = assessments.some((claim) => claim.importance === 'high' && (claim.verdict === 'conflicted' || claim.verdict === 'no_evidence'));
      const gateDecision = hasBlocker ? 'block' : assessments.some((claim) => claim.verdict !== 'supported') ? 'human_review' : 'pass';
      return { ...current, assessments, coverage, gateDecision, gateReason: language === 'zh' ? '已根据人工复核结果重新计算发布门禁。' : 'Publication gate recalculated from the human review.' };
    });
    void trackEvent('claim_overridden', result.caseId, result.agentId, result.ticker, { claimId, verdict });
  };

  const recordConfidence = () => {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'post_confidence_recorded', caseId: result.caseId, agentId: result.agentId, ticker: result.ticker, postConfidence }),
    });
  };

  const exportResult = () => {
    const blob = new Blob([JSON.stringify({ ...result, postConfidence }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${result.caseId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    void trackEvent('result_exported', result.caseId, result.agentId, result.ticker);
  };

  const copyCurl = async () => {
    await navigator.clipboard.writeText(curlExample);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const navItems: Array<{ id: View; label: string; icon: typeof Gauge }> = [
    { id: 'runs', label: t.runs, icon: Gauge },
    { id: 'evidence', label: t.evidence, icon: FileSearch },
    { id: 'evals', label: t.evals, icon: ScanSearch },
    { id: 'tools', label: t.tools, icon: Bot },
    { id: 'case', label: t.case, icon: PanelTop },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1580px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-3 text-left" onClick={() => setView('runs')} type="button">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_32px_rgba(247,184,93,.18)]"><ShieldCheck className="size-5" /></span>
            <span>
              <span className="flex items-center gap-2"><span className="text-[15px] font-semibold tracking-tight">ProofLens</span><span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{t.beta}</span></span>
              <span className="block text-[11px] text-muted-foreground">{t.tagline}</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button className="ui-button ui-button-ghost hidden sm:inline-flex" onClick={() => setView('tools')} type="button"><Braces /> {t.api}</button>
            <button className="ui-button ui-button-outline" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} type="button"><Languages /> {language === 'en' ? '中文' : 'EN'}</button>
          </div>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 lg:hidden">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`mobile-nav ${view === id ? 'mobile-nav-active' : ''}`} onClick={() => setView(id)} type="button"><Icon />{label}</button>)}
        </div>
      </header>

      <div className="mx-auto grid max-w-[1580px] grid-cols-1 lg:grid-cols-[218px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-64px)] border-r border-white/8 p-5 lg:block">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{t.navTitle}</p>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item w-full ${view === id ? 'nav-item-active' : ''}`} onClick={() => setView(id)} type="button"><Icon />{label}</button>)}
          </nav>
          <div className="mt-10 rounded-2xl border border-white/8 bg-white/[.025] p-4">
            <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Cost guardrail</span><span className="font-mono text-primary">$0.00</span></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[3%] bg-primary" /></div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Deterministic demo uses no paid model. Production cap: $2/day.</p>
          </div>
          <div className="mt-4 flex items-center gap-2 px-2 text-[10px] text-muted-foreground"><span className="status-dot" /> API healthy</div>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-8">
          {view === 'runs' && <RunView language={language} t={t} ticker={ticker} setTicker={setTicker} agentId={agentId} setAgentId={setAgentId} question={question} setQuestion={setQuestion} draft={draft} setDraft={setDraft} preConfidence={preConfidence} setPreConfidence={setPreConfidence} postConfidence={postConfidence} setPostConfidence={setPostConfidence} result={result} running={running} error={error} submitAudit={submitAudit} loadSample={loadSample} overrideVerdict={overrideVerdict} recordConfidence={recordConfidence} exportResult={exportResult} />}
          {view === 'evidence' && <EvidenceView language={language} />}
          {view === 'evals' && <EvaluationView language={language} />}
          {view === 'tools' && <ToolsView language={language} copied={copied} copyCurl={copyCurl} />}
          {view === 'case' && <CaseView language={language} setView={setView} />}
        </section>
      </div>
    </main>
  );
}

type RunViewProps = {
  language: Language;
  t: typeof copy.en;
  ticker: Ticker;
  setTicker: (value: Ticker) => void;
  agentId: string;
  setAgentId: (value: string) => void;
  question: string;
  setQuestion: (value: string) => void;
  draft: string;
  setDraft: (value: string) => void;
  preConfidence: number;
  setPreConfidence: (value: number) => void;
  postConfidence: number;
  setPostConfidence: (value: number) => void;
  result: AuditResult;
  running: boolean;
  error: string;
  submitAudit: () => Promise<AuditResult>;
  loadSample: (ticker?: Ticker) => void;
  overrideVerdict: (claimId: string, verdict: Verdict) => void;
  recordConfidence: () => void;
  exportResult: () => void;
};

function RunView(props: RunViewProps) {
  const { language, t, result } = props;
  const [selectedClaim, setSelectedClaim] = useState(result.assessments[0]?.claimId ?? '');
  const selected = result.assessments.find((claim) => claim.claimId === selectedClaim) ?? result.assessments[0];
  const uniqueSources = useMemo(() => new Map(result.assessments.flatMap((claim) => claim.evidence).map((evidence) => [evidence.sourceId, evidence])).values(), [result]);

  return (
    <div>
      <SectionHeading eyebrow={`TRACE · ${result.caseId.toUpperCase()}`} title={t.headline} description={t.intro} />
      <div className="grid gap-5 2xl:grid-cols-[310px_minmax(0,1fr)_330px]">
        <Card className="h-fit border-white/8 bg-card/75 ring-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">{t.configure}</p><button className="icon-button" onClick={() => props.loadSample()} title={t.reset} type="button"><RotateCcw /></button></div>
            <Field label={t.agentId}><input className="field-control" value={props.agentId} onChange={(event) => props.setAgentId(event.target.value)} /></Field>
            <Field label={t.company}>
              <div className="grid grid-cols-3 gap-1.5">{(['AMZN', 'MRVL', 'NVDA'] as Ticker[]).map((item) => <button key={item} className={`ticker-button ${props.ticker === item ? 'ticker-button-active' : ''}`} onClick={() => props.loadSample(item)} type="button">{item}</button>)}</div>
            </Field>
            <Field label={t.question}><textarea className="field-control min-h-20 resize-none" value={props.question} onChange={(event) => props.setQuestion(event.target.value)} /></Field>
            <Field label={t.draft}><textarea className="field-control min-h-40 resize-y" value={props.draft} onChange={(event) => props.setDraft(event.target.value)} /></Field>
            <Field label={t.preConfidence} value={`${props.preConfidence}%`}><input aria-label={t.preConfidence} className="confidence-range" type="range" min="0" max="100" value={props.preConfidence} onChange={(event) => props.setPreConfidence(Number(event.target.value))} /></Field>
            {props.error && <div className="rounded-xl border border-[#e67e80]/25 bg-[#e67e80]/8 p-3 text-xs leading-5 text-[#f0a3a5]">{props.error}</div>}
            <button className="ui-button ui-button-primary h-10 w-full" disabled={props.running || props.draft.length < 12 || props.question.length < 5} onClick={() => void props.submitAudit().catch(() => undefined)} type="button">
              {props.running ? <LoaderCircle className="animate-spin" /> : <Play className="fill-current" />}{props.running ? t.running : t.run}
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="size-3" />{t.privacy}</div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-white/8 bg-card/75 ring-0">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-medium">{t.incoming}</p><p className="mt-1 text-xs text-muted-foreground">{result.agentId} · {result.ticker} · {result.assessments.length} claims</p></div>
              <GateBadge decision={result.gateDecision} language={language} />
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              {result.assessments.map((claim) => <ClaimCard key={claim.claimId} claim={claim} language={language} active={claim.claimId === selected?.claimId} onSelect={() => setSelectedClaim(claim.claimId)} onOverride={props.overrideVerdict} />)}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-white/8 bg-card/75 ring-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">{t.sourceCoverage}</p><span className="font-mono text-xs text-primary">{Array.from(uniqueSources).length} sources</span></div>
              <div className="mt-4 grid grid-cols-5 gap-1.5">{verdictOrder.map((verdict) => <Metric key={verdict} value={String(result.coverage[verdict])} label={verdictLabels[language][verdict]} tone={verdict} />)}</div>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-xs"><span className="text-muted-foreground">{t.sourceCutoff}</span><span className="font-mono">{result.sourceCutoff}</span></div>
            </CardContent>
          </Card>

          <Card className={`ring-0 ${result.gateDecision === 'pass' ? 'border-[#67c49a]/20 bg-[#67c49a]/[.055]' : result.gateDecision === 'block' ? 'border-[#e67e80]/20 bg-[#e67e80]/[.055]' : 'border-[#f7b85d]/20 bg-[#f7b85d]/[.055]'}`}>
            <CardContent className="p-5">
              <div className="flex gap-3"><GateIcon decision={result.gateDecision} /><div><p className="text-sm font-medium">{t.gate}: {gateLabel(result.gateDecision, language)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{result.gateReason}</p></div></div>
            </CardContent>
          </Card>

          {selected && <Card className="border-white/8 bg-card/75 ring-0">
            <CardContent className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{t.source}</p>
              {selected.evidence.length ? <div className="mt-3 space-y-3">{selected.evidence.map((evidence) => <a className="source-card" href={evidence.url} key={evidence.sourceId} onClick={() => void trackEvent('evidence_opened', result.caseId, result.agentId, result.ticker, { sourceId: evidence.sourceId })} rel="noreferrer" target="_blank"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-[#e8edf4]">{evidence.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{evidence.period} · {evidence.section}</p></div><ExternalLink className="size-3.5 shrink-0 text-primary" /></div><p className="mt-3 line-clamp-4 text-[11px] leading-5 text-[#aeb9c8]">{evidence.excerpt}</p></a>)}</div> : <p className="mt-3 text-xs leading-5 text-muted-foreground">{t.noSource}</p>}
            </CardContent>
          </Card>}

          <Card className="border-white/8 bg-card/75 ring-0">
            <CardContent className="space-y-4 p-5">
              <Field label={t.postConfidence} value={`${props.postConfidence}%`}><input aria-label={t.postConfidence} className="confidence-range" type="range" min="0" max="100" value={props.postConfidence} onChange={(event) => props.setPostConfidence(Number(event.target.value))} /></Field>
              <div className="grid grid-cols-2 gap-2"><button className="ui-button ui-button-outline h-9" onClick={props.recordConfidence} type="button"><CheckCircle2 />{t.record}</button><button className="ui-button ui-button-outline h-9" onClick={props.exportResult} type="button"><Download />JSON</button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClaimCard({ claim, language, active, onSelect, onOverride }: { claim: ClaimAssessment; language: Language; active: boolean; onSelect: () => void; onOverride: (claimId: string, verdict: Verdict) => void }) {
  const Icon = verdictIcons[claim.verdict];
  return (
    <article className={`claim-row ${active ? 'claim-row-active' : ''}`}>
      <button aria-label={language === 'zh' ? '查看此主张的证据' : 'View evidence for this claim'} className={`claim-icon claim-${claim.verdict}`} onClick={onSelect} type="button"><Icon /></button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><span className={`claim-label label-${claim.verdict}`}>{verdictLabels[language][claim.verdict]}</span><span className="font-mono text-[10px] text-muted-foreground">{claim.claimId.toUpperCase()}</span><span className="text-[10px] text-muted-foreground">{claimTypeLabels[language][claim.claimType]}</span>{claim.importance === 'high' && <span className="text-[10px] font-semibold text-[#f0a3a5]">HIGH IMPACT</span>}</div>
        <button className="mt-2 block text-left text-[14px] leading-6 text-[#e9edf3]" onClick={onSelect} type="button">{claim.claimText}</button>
        <div className="mt-3 grid gap-3 border-t border-white/7 pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div><p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">{copy[language].reason}</p><p className="mt-1 text-[11px] leading-5 text-[#aeb9c8]">{claim.reason} {claim.riskNote}</p></div>
          <label className="text-[10px] text-muted-foreground">{copy[language].humanOverride}<select aria-label={copy[language].humanOverride} className="override-select" value={claim.verdict} onChange={(event) => onOverride(claim.claimId, event.target.value as Verdict)}>{verdictOrder.map((verdict) => <option key={verdict} value={verdict}>{verdictLabels[language][verdict]}</option>)}</select></label>
        </div>
      </div>
    </article>
  );
}

function EvidenceView({ language }: { language: Language }) {
  const [filter, setFilter] = useState<'ALL' | Ticker>('ALL');
  const sources = evidenceLibrary.filter((source) => filter === 'ALL' || source.ticker === filter);
  return <div><SectionHeading eyebrow="PRIMARY SOURCE CORPUS" title={language === 'zh' ? '限定证据库' : 'Bounded evidence library'} description={language === 'zh' ? '首期只使用十二份 SEC 一手资料，所有证据都保留报告期、提交日与原文链接。' : 'The first release uses twelve SEC primary-source records with period, filing date, and original link preserved.'} />
    <div className="mb-5 flex flex-wrap gap-2">{(['ALL', 'AMZN', 'MRVL', 'NVDA'] as const).map((item) => <button key={item} className={`ticker-button min-w-16 ${filter === item ? 'ticker-button-active' : ''}`} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-2">{sources.map((source) => <Card className="border-white/8 bg-card/75 ring-0" key={source.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="rounded-md border border-white/8 bg-white/[.04] px-2 py-1 font-mono text-[10px] text-primary">{source.form}</span><span className="text-[10px] text-muted-foreground">{source.ticker}</span></div><h3 className="mt-3 text-sm font-medium">{source.title}</h3><p className="mt-1 text-xs text-muted-foreground">{source.period} · filed {source.filedAt}</p></div><a className="icon-button" href={source.url} rel="noreferrer" target="_blank"><ArrowUpRight /></a></div><p className="mt-4 text-xs leading-6 text-[#aeb9c8]">{source.text}</p><div className="mt-4 flex flex-wrap gap-1.5">{source.tags.slice(0, 5).map((tag) => <span className="data-tag" key={tag}>{tag}</span>)}</div></CardContent></Card>)}</div>
  </div>;
}

function EvaluationView({ language }: { language: Language }) {
  const metrics = [
    { label: language === 'zh' ? '未支持主张召回率' : 'Unsupported-claim recall', target: '≥ 80%', actual: 'Pending' },
    { label: language === 'zh' ? '错误质疑率' : 'False challenge rate', target: '≤ 15%', actual: 'Pending' },
    { label: language === 'zh' ? '有效证据链接率' : 'Valid evidence-link rate', target: '≥ 95%', actual: '100% seed' },
    { label: language === 'zh' ? '用户任务耗时变化' : 'User task-time change', target: '≤ −25%', actual: 'Pending' },
  ];
  return <div><SectionHeading eyebrow="EVALUATION CONTRACT" title={language === 'zh' ? '先定义如何失败，再迭代模型。' : 'Define failure before iterating the model.'} description={language === 'zh' ? '产品严格区分种子回归测试、人工标注评测和真实用户实验，未采集的数据不会显示成成果。' : 'Seed regression, human-labeled evaluation, and user studies remain separate. Uncollected data is never presented as a result.'} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <Card className="border-white/8 bg-card/75 ring-0" key={metric.label}><CardContent className="p-5"><p className="text-xs text-muted-foreground">{metric.label}</p><div className="mt-4 flex items-end justify-between"><strong className="font-mono text-xl">{metric.target}</strong><span className={`text-[10px] ${metric.actual.includes('Pending') ? 'text-[#ffca7a]' : 'text-[#83d7ad]'}`}>{metric.actual}</span></div></CardContent></Card>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="border-white/8 bg-card/75 ring-0"><CardContent className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Benchmark readiness</p><p className="mt-1 text-xs text-muted-foreground">Honest status as of the current build</p></div><span className="font-mono text-sm text-primary">12 / 120</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[10%] bg-primary" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Readiness icon={Database} value="12" label="Seed evidence records" /><Readiness icon={FileCheck2} value="0" label="Human-labeled claims" /><Readiness icon={UserCheck} value="0" label="Usability sessions" /></div><div className="mt-5 rounded-xl border border-[#f7b85d]/18 bg-[#f7b85d]/[.05] p-4 text-xs leading-6 text-[#c9bba8]">{language === 'zh' ? '下一道门槛：两名标注者先复核 24 条主张，再扩展到 120 条；用户实验只报告描述性结果。' : 'Next gate: two annotators review the first 24 claims before expansion to 120. User-study results will remain descriptive.'}</div></CardContent></Card>
      <Card className="border-white/8 bg-card/75 ring-0"><CardContent className="p-5"><p className="text-sm font-medium">Three evaluation layers</p><div className="mt-4 space-y-3"><Layer index="01" title="Retrieval" text="Did the agent receive the right primary-source passage?" /><Layer index="02" title="Judgment" text="Did the verdict preserve period, unit, and accounting basis?" /><Layer index="03" title="Product impact" text="Did the gate help a user catch more errors with less time?" /></div></CardContent></Card>
    </div>
  </div>;
}

const curlExample = `curl -X POST https://your-prooflens-site/api/audit \\
  -H "Content-Type: application/json" \\
  -d '{
    "language": "en",
    "agentId": "equity_research_agent",
    "ticker": "NVDA",
    "question": "Verify Q1 FY2025 growth claims",
    "draftText": "NVIDIA revenue was $26.0 billion, up 262% year over year.",
    "preConfidence": 86
  }'`;

function ToolsView({ language, copied, copyCurl }: { language: Language; copied: boolean; copyCurl: () => void }) {
  return <div><SectionHeading eyebrow="AGENT INTERFACE" title={language === 'zh' ? '一个核验内核，三种 Agent 接入方式。' : 'One evidence gate, three agent surfaces.'} description={language === 'zh' ? 'REST API、stdio MCP 和浏览器 WebMCP 共用同一数据契约与发布门禁。' : 'REST, stdio MCP, and browser WebMCP share the same contract and publication gate.'} />
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="border-white/8 bg-card/75 ring-0"><CardContent className="p-0"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div className="flex items-center gap-2"><TerminalSquare className="size-4 text-primary" /><span className="text-sm font-medium">REST · POST /api/audit</span></div><button className="ui-button ui-button-outline" onClick={copyCurl} type="button">{copied ? <Check /> : <Clipboard />}{copied ? 'Copied' : 'Copy'}</button></div><pre className="code-block"><code>{curlExample}</code></pre></CardContent></Card>
      <div className="space-y-5"><ToolCard icon={Bot} title="MCP server" status="Runnable" text="audit_research_draft and list_evidence_sources are exposed through a local stdio server." command="npm run mcp" /><ToolCard icon={Sparkles} title="WebMCP" status="Progressive" text="Supported browsers can call the same audit action and update the visible trace console." command="audit_research_draft" /><ToolCard icon={ShieldCheck} title="Gate contract" status="Strict" text="Every run returns pass, human_review, or block—plus evidence and a dated source cutoff." command="gateDecision" /></div>
    </div>
    <Card className="mt-5 border-white/8 bg-card/75 ring-0"><CardContent className="p-5"><p className="text-sm font-medium">Machine contract</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Contract name="AuditRequest" fields="language · agentId · ticker · question · draftText · preConfidence" /><Contract name="ClaimAssessment" fields="type · verdict · importance · evidence[] · reason · riskNote" /><Contract name="AuditResult" fields="caseId · coverage · verifiedBrief · gateDecision · sourceCutoff" /></div></CardContent></Card>
  </div>;
}

function CaseView({ language, setView }: { language: Language; setView: (view: View) => void }) {
  const items = [
    { icon: FileSearch, title: language === 'zh' ? '东方证券：一手资料核验' : 'Primary-source verification', text: language === 'zh' ? '把 SEC、财报和产品路线的交叉核验转为可调用产品能力。' : 'Turns SEC, earnings, and product-roadmap verification into a callable product capability.' },
    { icon: Activity, title: language === 'zh' ? '行为科学：信任校准' : 'Behavioral science', text: language === 'zh' ? '记录审计前后信心，识别自动化偏误和过度信任。' : 'Measures confidence before and after review to expose automation bias and over-trust.' },
    { icon: ScanSearch, title: language === 'zh' ? '量化研究：评测纪律' : 'Evaluation discipline', text: language === 'zh' ? '用固定评测集、基线和失败类型约束迭代。' : 'Uses a fixed benchmark, baseline, and failure taxonomy to constrain iteration.' },
    { icon: Database, title: language === 'zh' ? '安永：数据与流程架构' : 'Data and workflow architecture', text: language === 'zh' ? '把 Agent、证据、门禁、人工接管和指标连接成完整流程。' : 'Connects agents, evidence, gates, human handoff, and metrics into one workflow.' },
  ];
  return <div><SectionHeading eyebrow="PRODUCT CASE" title={language === 'zh' ? '从投研核验流程，抽象出 To-Agent 产品。' : 'From research workflow to a To-Agent product.'} description={language === 'zh' ? 'ProofLens 不和研究 Agent 竞争，而是在它发布答案前提供可信度基础设施。' : 'ProofLens does not compete with research agents. It provides the reliability layer they call before publishing.'} />
    <div className="grid gap-4 md:grid-cols-2">{items.map(({ icon: Icon, title, text }) => <Card className="border-white/8 bg-card/75 ring-0" key={title}><CardContent className="p-5"><span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><h3 className="mt-4 text-sm font-medium">{title}</h3><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></CardContent></Card>)}</div>
    <Card className="mt-5 overflow-hidden border-primary/20 bg-primary/[.055] ring-0"><CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Core product decision</p><h3 className="mt-2 text-lg font-medium">80% agent interface · 20% human review console</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-[#b4bdca]">The machine contract is the product. The console makes failure visible, gives reviewers control, and creates the data needed for evaluation.</p></div><button className="ui-button ui-button-primary h-10 px-4" onClick={() => setView('runs')} type="button"><Play />Try the audit</button></CardContent></Card>
    <div className="mt-5 grid gap-4 md:grid-cols-4"><Phase number="01" name="Discover" detail="5 interviews" /><Phase number="02" name="Define" detail="PRD + gate" /><Phase number="03" name="Validate" detail="120 claims" /><Phase number="04" name="Iterate" detail="8 task tests" /></div>
  </div>;
}

function Field({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-[#b7c0ce]"><span>{label}</span>{value && <span className="font-mono text-primary">{value}</span>}</span>{children}</label>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-6"><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[.15em] text-primary"><span className="status-dot" />{eyebrow}</div><h1 className="text-2xl font-semibold tracking-[-.03em] sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

function Metric({ value, label, tone }: { value: string; label: string; tone: Verdict }) {
  return <div className={`metric metric-${tone}`} title={label}><strong>{value}</strong><span className="truncate">{label}</span></div>;
}

function GateBadge({ decision, language }: { decision: AuditResult['gateDecision']; language: Language }) {
  return <span className={`gate-badge gate-${decision}`}><GateIcon decision={decision} />{gateLabel(decision, language)}</span>;
}

function GateIcon({ decision }: { decision: AuditResult['gateDecision'] }) {
  const Icon = decision === 'pass' ? CheckCircle2 : decision === 'block' ? XCircle : UserCheck;
  return <Icon className={`size-4 ${decision === 'pass' ? 'text-[#83d7ad]' : decision === 'block' ? 'text-[#f0a3a5]' : 'text-[#ffca7a]'}`} />;
}

function gateLabel(decision: AuditResult['gateDecision'], language: Language) {
  const labels = { en: { pass: 'Pass', human_review: 'Human review', block: 'Block' }, zh: { pass: '允许发布', human_review: '人工复核', block: '阻止发布' } };
  return labels[language][decision];
}

function Readiness({ icon: Icon, value, label }: { icon: typeof Database; value: string; label: string }) {
  return <div className="rounded-xl border border-white/7 bg-black/10 p-3"><Icon className="size-4 text-primary" /><strong className="mt-3 block font-mono text-lg">{value}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{label}</span></div>;
}

function Layer({ index, title, text }: { index: string; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-white/7 bg-black/10 p-3"><span className="font-mono text-[10px] text-primary">{index}</span><div><p className="text-xs font-medium">{title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{text}</p></div></div>;
}

function ToolCard({ icon: Icon, title, status, text, command }: { icon: typeof Bot; title: string; status: string; text: string; command: string }) {
  return <Card className="border-white/8 bg-card/75 ring-0"><CardContent className="p-4"><div className="flex items-start gap-3"><span className="grid size-8 place-items-center rounded-lg bg-white/[.04] text-primary"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{title}</p><span className="text-[10px] text-[#83d7ad]">{status}</span></div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{text}</p><code className="mt-2 block truncate rounded-md bg-black/20 px-2 py-1.5 font-mono text-[10px] text-[#a8d8e1]">{command}</code></div></div></CardContent></Card>;
}

function Contract({ name, fields }: { name: string; fields: string }) {
  return <div className="rounded-xl border border-white/7 bg-black/10 p-4"><Code2 className="size-4 text-primary" /><p className="mt-3 font-mono text-xs text-[#e8edf4]">{name}</p><p className="mt-2 text-[10px] leading-5 text-muted-foreground">{fields}</p></div>;
}

function Phase({ number, name, detail }: { number: string; name: string; detail: string }) {
  return <div className="rounded-xl border border-white/8 bg-card/70 p-4"><span className="font-mono text-[10px] text-primary">{number}</span><p className="mt-4 text-sm font-medium">{name}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div>;
}

async function trackEvent(eventName: string, caseId?: string, agentId?: string, ticker?: Ticker, metadata?: Record<string, unknown>) {
  try {
    await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventName, caseId, agentId, ticker, metadata }) });
  } catch {
    return;
  }
}
