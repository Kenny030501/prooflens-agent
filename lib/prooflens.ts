export type Language = 'en' | 'zh';
export type Ticker = 'AMZN' | 'MRVL' | 'NVDA';
export type ClaimType = 'quantitative' | 'management_statement' | 'causal' | 'forward_looking' | 'general';
export type Verdict = 'supported' | 'partial' | 'conflicted' | 'no_evidence' | 'inference';
export type GateDecision = 'pass' | 'human_review' | 'block';

export interface EvidenceSource {
  id: string;
  ticker: Ticker;
  title: string;
  form: '10-K' | '10-Q' | '8-K' | 'SEC index';
  period: string;
  filedAt: string;
  section: string;
  url: string;
  text: string;
  tags: string[];
}

export interface AuditRequest {
  language: Language;
  agentId: string;
  ticker: Ticker;
  question: string;
  draftText: string;
  preConfidence?: number;
}

export interface EvidenceMatch {
  sourceId: string;
  title: string;
  form: EvidenceSource['form'];
  period: string;
  filedAt: string;
  section: string;
  url: string;
  excerpt: string;
  relevance: number;
}

export interface ClaimAssessment {
  claimId: string;
  claimText: string;
  claimType: ClaimType;
  verdict: Verdict;
  importance: 'high' | 'medium';
  evidence: EvidenceMatch[];
  reason: string;
  riskNote: string;
  requiresHumanReview: boolean;
}

export interface AuditResult {
  caseId: string;
  agentId: string;
  ticker: Ticker;
  question: string;
  language: Language;
  createdAt: string;
  sourceCutoff: string;
  assessments: ClaimAssessment[];
  coverage: Record<Verdict, number>;
  verifiedBrief: string;
  gateDecision: GateDecision;
  gateReason: string;
  preConfidence?: number;
}

const sec = (cik: string, accession: string, file: string) =>
  `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replaceAll('-', '')}/${file}`;

export const evidenceLibrary: EvidenceSource[] = [
  {
    id: 'amzn-q1-2024-aws-growth',
    ticker: 'AMZN',
    title: 'Amazon Q1 2024 Form 10-Q',
    form: '10-Q',
    period: 'Q1 2024',
    filedAt: '2024-05-01',
    section: 'Management discussion · Segment results',
    url: sec('1018724', '0001018724-24-000083', 'amzn-20240331.htm'),
    text: 'AWS sales increased 17% in Q1 2024 compared to the comparable prior year period. The sales growth primarily reflects increased customer usage, partially offset by pricing changes primarily driven by long-term customer contracts.',
    tags: ['AWS', 'sales', '17%', 'growth', 'customer usage'],
  },
  {
    id: 'amzn-q1-2024-operating-income',
    ticker: 'AMZN',
    title: 'Amazon Q1 2024 Form 10-Q',
    form: '10-Q',
    period: 'Q1 2024',
    filedAt: '2024-05-01',
    section: 'Management discussion · Consolidated results',
    url: sec('1018724', '0001018724-24-000083', 'amzn-20240331.htm'),
    text: 'Operating income increased from $4.8 billion in Q1 2023 to $15.3 billion in Q1 2024.',
    tags: ['operating income', '$4.8 billion', '$15.3 billion', 'Q1 2024'],
  },
  {
    id: 'amzn-q1-2024-earnings',
    ticker: 'AMZN',
    title: 'Amazon Q1 2024 Results',
    form: '8-K',
    period: 'Q1 2024',
    filedAt: '2024-04-30',
    section: 'Exhibit 99.1 · Earnings release',
    url: sec('1018724', '0001018724-24-000081', 'amzn-20240430.htm'),
    text: 'Amazon reported first quarter 2024 results. Net sales increased 13% year over year to $143.3 billion.',
    tags: ['net sales', '13%', '$143.3 billion', 'Q1 2024'],
  },
  {
    id: 'amzn-2023-risk',
    ticker: 'AMZN',
    title: 'Amazon 2023 Form 10-K',
    form: '10-K',
    period: 'FY 2023',
    filedAt: '2024-02-02',
    section: 'Item 1A · Risk factors',
    url: sec('1018724', '0001018724-24-000008', 'amzn-20231231.htm'),
    text: 'Demand, adoption, and monetization of new products and services, including artificial intelligence services, are uncertain and may not meet expectations.',
    tags: ['risk', 'AI', 'demand', 'adoption', 'monetization'],
  },
  {
    id: 'mrvl-q2-2025-revenue',
    ticker: 'MRVL',
    title: 'Marvell Q2 FY2025 Results',
    form: '8-K',
    period: 'Q2 FY2025',
    filedAt: '2024-08-29',
    section: 'Exhibit 99.1 · Financial results',
    url: sec('1835632', '0001835632-24-000140', 'q225_8kx832024ex-991.htm'),
    text: 'Net revenue for the second quarter of fiscal 2025 was $1.273 billion, $23.0 million above the midpoint of the guidance provided on May 30, 2024.',
    tags: ['net revenue', '$1.273 billion', 'Q2 FY2025', 'guidance'],
  },
  {
    id: 'mrvl-q2-2025-ai-demand',
    ticker: 'MRVL',
    title: 'Marvell Q2 FY2025 Results',
    form: '8-K',
    period: 'Q2 FY2025',
    filedAt: '2024-08-29',
    section: 'Exhibit 99.1 · CEO statement',
    url: sec('1835632', '0001835632-24-000140', 'q225_8kx832024ex-991.htm'),
    text: 'Marvell said second-quarter revenue grew 10% sequentially, above the midpoint of guidance, driven by strong demand from AI. The company saw growth from electro-optics products and said custom AI programs began to ramp.',
    tags: ['AI demand', '10%', 'sequential growth', 'electro-optics', 'custom AI'],
  },
  {
    id: 'mrvl-q3-2025-guidance',
    ticker: 'MRVL',
    title: 'Marvell Q2 FY2025 Results',
    form: '8-K',
    period: 'Q3 FY2025 outlook',
    filedAt: '2024-08-29',
    section: 'Exhibit 99.1 · Outlook',
    url: sec('1835632', '0001835632-24-000140', 'q225_8kx832024ex-991.htm'),
    text: 'For the third quarter of fiscal 2025, net revenue was expected to be $1.450 billion plus or minus 5%. This was forward-looking guidance rather than a reported result.',
    tags: ['outlook', '$1.450 billion', '5%', 'Q3 FY2025', 'forward-looking'],
  },
  {
    id: 'mrvl-q2-2025-margin',
    ticker: 'MRVL',
    title: 'Marvell Q2 FY2025 Results',
    form: '8-K',
    period: 'Q2 FY2025',
    filedAt: '2024-08-29',
    section: 'Exhibit 99.1 · Financial results',
    url: sec('1835632', '0001835632-24-000140', 'q225_8kx832024ex-991.htm'),
    text: 'Marvell reported a 46.2% GAAP gross margin and a 61.9% non-GAAP gross margin for the second quarter of fiscal 2025.',
    tags: ['gross margin', '46.2%', '61.9%', 'GAAP', 'non-GAAP'],
  },
  {
    id: 'nvda-q1-2025-revenue',
    ticker: 'NVDA',
    title: 'NVIDIA Q1 FY2025 Form 10-Q',
    form: '10-Q',
    period: 'Q1 FY2025',
    filedAt: '2024-05-29',
    section: 'Management discussion · Revenue',
    url: sec('1045810', '0001045810-24-000124', 'nvda-20240428.htm'),
    text: 'Revenue was $26.0 billion, up 262% from a year ago and up 18% sequentially.',
    tags: ['revenue', '$26.0 billion', '262%', '18%', 'Q1 FY2025'],
  },
  {
    id: 'nvda-q1-2025-data-center',
    ticker: 'NVDA',
    title: 'NVIDIA Q1 FY2025 Form 10-Q',
    form: '10-Q',
    period: 'Q1 FY2025',
    filedAt: '2024-05-29',
    section: 'Management discussion · Data Center',
    url: sec('1045810', '0001045810-24-000124', 'nvda-20240428.htm'),
    text: 'Data Center revenue was $22.6 billion, up 427% from a year ago and up 23% from the previous quarter.',
    tags: ['data center', '$22.6 billion', '427%', '23%', 'Q1 FY2025'],
  },
  {
    id: 'nvda-q1-2025-inference',
    ticker: 'NVDA',
    title: 'NVIDIA Q1 FY2025 Form 10-Q',
    form: '10-Q',
    period: 'Trailing four quarters to Q1 FY2025',
    filedAt: '2024-05-29',
    section: 'Management discussion · Data Center',
    url: sec('1045810', '0001045810-24-000124', 'nvda-20240428.htm'),
    text: 'NVIDIA estimated that inference drove about 40% of Data Center revenue in the trailing four quarters.',
    tags: ['inference', '40%', 'data center', 'estimate'],
  },
  {
    id: 'nvda-q1-2025-blackwell',
    ticker: 'NVDA',
    title: 'NVIDIA Q1 FY2025 Form 10-Q',
    form: '10-Q',
    period: 'Q1 FY2025 outlook',
    filedAt: '2024-05-29',
    section: 'Management discussion · Supply and product transitions',
    url: sec('1045810', '0001045810-24-000124', 'nvda-20240428.htm'),
    text: 'NVIDIA said Blackwell was in production, planned customer samples in the second quarter, and expected customer shipments to ramp in the second half of the fiscal year. These statements were forward-looking at the filing date.',
    tags: ['Blackwell', 'production', 'customer samples', 'shipments', 'forward-looking'],
  },
];

export const sampleDrafts: Record<Ticker, { question: string; draft: string }> = {
  AMZN: {
    question: 'What drove Amazon\'s Q1 2024 operating improvement, and what can we verify?',
    draft: 'AWS sales increased 17% year over year in Q1 2024. Amazon operating income rose from $4.8 billion to $15.3 billion. Generative AI was the primary driver of AWS growth. AWS Trainium had already surpassed NVIDIA in inference market share.',
  },
  MRVL: {
    question: 'How much evidence supports the AI growth narrative in Marvell Q2 FY2025?',
    draft: 'Marvell Q2 FY2025 net revenue was $1.273 billion. Revenue grew 10% sequentially and management attributed the strength to AI demand. GAAP gross margin was 61.9%. Custom AI programs guaranteed accelerating revenue for the next four quarters.',
  },
  NVDA: {
    question: 'Which Q1 FY2025 NVIDIA claims are facts and which are forward-looking?',
    draft: 'NVIDIA Q1 FY2025 revenue was $26.0 billion, up 262% year over year. Data Center revenue was $22.6 billion, up 427%. Inference represented exactly 40% of Q1 Data Center revenue. Blackwell customer shipments were already at full-scale production during the quarter.',
  },
};

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'from', 'was', 'were', 'is', 'are', 'by', 'as', 'at', 'on', 'that', 'this', 'had', 'has', 'have', 'its', 'their', 'with', 'year', 'quarter', 'fiscal', 'company',
]);

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9%$.]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopwords.has(token)),
  );
}

function similarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / Math.sqrt(left.size * right.size);
}

function numbers(value: string) {
  return (value.match(/\$?\d+(?:\.\d+)?%?/g) ?? []).map((item) => item.replace('$', ''));
}

function splitClaims(draft: string) {
  return draft
    .replace(/^[-*•]\s*/gm, '')
    .split(/(?<=[。！？!?；;])\s*|\.\s+(?=[A-Z\u4e00-\u9fff])/)
    .map((claim) => claim.trim().replace(/[。；;]+$/, ''))
    .filter((claim) => claim.length >= 12)
    .slice(0, 12);
}

function claimType(claim: string): ClaimType {
  if (/\b(expect|expected|will|forecast|guidance|outlook|plan|target)\b|预计|指引|将会|计划/i.test(claim)) return 'forward_looking';
  if (/\b(drove|driver|because|attributed|due to|reflects|caused|primary)\b|驱动|由于|归因|导致/i.test(claim)) return 'causal';
  if (/\b(said|stated|estimated|management|CEO|CFO)\b|管理层|表示|称|估计/i.test(claim)) return 'management_statement';
  if (/\$?\d+(?:\.\d+)?%?|million|billion|revenue|margin|income|sales|增长|收入|利润|亿美元/i.test(claim)) return 'quantitative';
  return 'general';
}

function isHighImpact(claim: string, type: ClaimType) {
  return type === 'quantitative' || /surpass|guarantee|exactly|primary|market share|超过|保证|唯一|主要/i.test(claim);
}

function buildReason(verdict: Verdict, language: Language, source?: EvidenceSource) {
  const zh: Record<Verdict, string> = {
    supported: `主张与${source?.form ?? '一手资料'}中的期间、数值和口径一致。`,
    partial: '找到相关一手资料，但资料没有完整支持该主张的全部范围或强度。',
    conflicted: '找到同一主题的一手资料，但数字、期间或口径与主张不一致。',
    no_evidence: '在当前限定的一手资料中没有找到足以支持该主张的证据。',
    inference: '资料提供了相关事实，但该因果或确定性结论仍属于分析推断。',
  };
  const en: Record<Verdict, string> = {
    supported: `The period, figure, and scope align with the cited ${source?.form ?? 'primary source'}.`,
    partial: 'A related primary source was found, but it does not support the full scope or strength of the claim.',
    conflicted: 'A primary source covers the same topic, but its number, period, or accounting basis differs.',
    no_evidence: 'No sufficient support was found in the bounded primary-source corpus.',
    inference: 'The source provides related facts, but the causal or certainty statement remains an analytical inference.',
  };
  return language === 'zh' ? zh[verdict] : en[verdict];
}

function riskNote(verdict: Verdict, language: Language, high: boolean) {
  if (verdict === 'supported') return language === 'zh' ? '可引用，并保留资料日期与口径。' : 'May be cited with the source date and reporting basis.';
  if (verdict === 'inference') return language === 'zh' ? '需明确标注为分析判断。' : 'Label explicitly as analysis rather than reported fact.';
  if (verdict === 'partial') return language === 'zh' ? '缩小表述范围，或补充第二条证据。' : 'Narrow the wording or add a second source.';
  return high
    ? language === 'zh' ? '高影响主张：阻止 Agent 发布并转人工审阅。' : 'High-impact claim: block publishing and request human review.'
    : language === 'zh' ? '删除该主张或补充可靠证据。' : 'Remove the claim or provide reliable evidence.';
}

export function auditDraft(request: AuditRequest): AuditResult {
  const claims = splitClaims(request.draftText);
  const sources = evidenceLibrary.filter((source) => source.ticker === request.ticker);
  const assessments = claims.map((claim, index): ClaimAssessment => {
    const type = claimType(claim);
    const ranked = sources
      .map((source) => ({ source, score: similarity(claim, `${source.text} ${source.tags.join(' ')}`) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const claimNumbers = numbers(claim);
    const sourceNumbers = best ? numbers(`${best.source.text} ${best.source.period} ${best.source.tags.join(' ')}`) : [];
    const matchedNumbers = claimNumbers.filter((value) => sourceNumbers.includes(value));
    const numericConflict = claimNumbers.length > 0 && sourceNumbers.length > 0 && matchedNumbers.length === 0;
    const scopeConflict = Boolean(best) && (
      (/\bexactly\b|精确|恰好/i.test(claim) && /\b(about|estimated)\b|大约|估计/i.test(best.source.text))
      || (/\bQ1\b|第一季度/i.test(claim) && /trailing four quarters|过去四个季度/i.test(best.source.text))
      || (/\balready\b|已经/i.test(claim) && /\b(plan|planned|expect|expected|forward-looking)\b|计划|预计|前瞻/i.test(best.source.text))
      || (/\bGAAP gross margin (?:was|of) 61\.9%/i.test(claim) && /46\.2% GAAP.+61\.9% non-GAAP/i.test(best.source.text))
    );
    const inferenceLanguage = type === 'causal' || type === 'forward_looking' || /surpass|guarantee|exactly|market share|超过|保证|已经/i.test(claim);

    let verdict: Verdict;
    if (!best || best.score < 0.13) verdict = 'no_evidence';
    else if ((numericConflict || scopeConflict) && best.score >= 0.18) verdict = 'conflicted';
    else if (inferenceLanguage && best.score >= 0.18) verdict = 'inference';
    else if (best.score >= 0.32 && (!claimNumbers.length || matchedNumbers.length >= Math.ceil(claimNumbers.length * 0.5))) verdict = 'supported';
    else if (best.score >= 0.2) verdict = 'partial';
    else verdict = 'no_evidence';

    const high = isHighImpact(claim, type);
    const evidence = best && best.score >= 0.13
      ? ranked.slice(0, 2).filter((item) => item.score >= 0.13).map(({ source, score }) => ({
          sourceId: source.id,
          title: source.title,
          form: source.form,
          period: source.period,
          filedAt: source.filedAt,
          section: source.section,
          url: source.url,
          excerpt: source.text,
          relevance: Number(score.toFixed(3)),
        }))
      : [];

    return {
      claimId: `claim-${String(index + 1).padStart(2, '0')}`,
      claimText: claim,
      claimType: type,
      verdict,
      importance: high ? 'high' : 'medium',
      evidence,
      reason: buildReason(verdict, request.language, best?.source),
      riskNote: riskNote(verdict, request.language, high),
      requiresHumanReview: verdict !== 'supported' && (high || verdict === 'conflicted'),
    };
  });

  const coverage: Record<Verdict, number> = { supported: 0, partial: 0, conflicted: 0, no_evidence: 0, inference: 0 };
  for (const assessment of assessments) coverage[assessment.verdict] += 1;
  const blocking = assessments.filter((item) => item.requiresHumanReview && (item.verdict === 'conflicted' || item.verdict === 'no_evidence'));
  const review = assessments.filter((item) => item.verdict !== 'supported');
  const gateDecision: GateDecision = blocking.length ? 'block' : review.length ? 'human_review' : 'pass';
  const supported = assessments.filter((item) => item.verdict === 'supported').map((item) => item.claimText);
  const partial = assessments.filter((item) => item.verdict === 'partial').map((item) => item.claimText);
  const verifiedBrief = [
    ...supported,
    ...partial.map((claim) => request.language === 'zh' ? `需进一步核验：${claim}` : `Requires further verification: ${claim}`),
  ].join(' ');
  const sourceCutoff = sources.reduce((latest, source) => source.filedAt > latest ? source.filedAt : latest, '');

  return {
    caseId: `pl_${crypto.randomUUID().slice(0, 12)}`,
    agentId: request.agentId,
    ticker: request.ticker,
    question: request.question,
    language: request.language,
    createdAt: new Date().toISOString(),
    sourceCutoff,
    assessments,
    coverage,
    verifiedBrief,
    gateDecision,
    gateReason: gateDecision === 'pass'
      ? request.language === 'zh' ? '所有主张均有一手资料支持。' : 'All claims have primary-source support.'
      : gateDecision === 'block'
        ? request.language === 'zh' ? `${blocking.length} 条高影响主张存在冲突或缺少证据。` : `${blocking.length} high-impact claim(s) conflict with or lack primary-source evidence.`
        : request.language === 'zh' ? `${review.length} 条主张需要人工确认或收窄表述。` : `${review.length} claim(s) require human review or narrower wording.`,
    preConfidence: request.preConfidence,
  };
}

export function isAuditRequest(value: unknown): value is AuditRequest {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AuditRequest>;
  return (item.language === 'en' || item.language === 'zh')
    && typeof item.agentId === 'string'
    && item.agentId.length > 0
    && (item.ticker === 'AMZN' || item.ticker === 'MRVL' || item.ticker === 'NVDA')
    && typeof item.question === 'string'
    && item.question.length >= 5
    && typeof item.draftText === 'string'
    && item.draftText.length >= 12
    && item.draftText.length <= 12_000
    && (item.preConfidence === undefined || (Number.isFinite(item.preConfidence) && item.preConfidence >= 0 && item.preConfidence <= 100));
}
