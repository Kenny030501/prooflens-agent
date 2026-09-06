import { env } from 'cloudflare:workers';
import { AuditError, requestSchema } from './contracts';
import { audit, type AuditOutput } from './engine';
import { corpus, scope } from './retrieval';
import { models } from './provider';
type Bindings = {
  DB: D1Database;
  ZHIPU_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  PROOFLENS_PROVIDER?: string;
  PROOFLENS_SERVICE_CAP_USD?: string;
};
const bindings = () => env as unknown as Bindings;
const serviceCap = (b: Bindings) =>
  b.PROOFLENS_SERVICE_CAP_USD === '3' ? 3 : 12;
const cache = new Map<
  string,
  { hash: string; result: AuditOutput; expires: number }
>();
let indexed: Promise<void> | undefined;
async function initialize(db: D1Database) {
  if (!indexed)
    indexed = db
      .batch(
        corpus.documents.map((d) =>
          db
            .prepare(
              'INSERT INTO source_documents (id,ticker,filed_at,url,sha256,corpus_version) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET sha256=excluded.sha256,corpus_version=excluded.corpus_version',
            )
            .bind(d.id, d.ticker, d.filedAt, d.url, d.sha256, corpus.version),
        ),
      )
      .then(() => undefined)
      .catch((e) => {
        indexed = undefined;
        throw e;
      });
  await indexed;
}
async function digest(text: string) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export async function runtimeStatus() {
  const b = bindings();
  const provider = b.PROOFLENS_PROVIDER === 'claude' ? 'claude' : 'glm';
  const configured = Boolean(
    provider === 'glm' ? b.ZHIPU_API_KEY : b.ANTHROPIC_API_KEY,
  );
  const today = new Date().toISOString().slice(0, 10);
  const totals = await b.DB.prepare(
    'SELECT COALESCE(SUM(charged_micros),0) total, COALESCE(SUM(CASE WHEN day=? THEN charged_micros ELSE 0 END),0) daily, COUNT(*) calls FROM execution_receipts',
  )
    .bind(today)
    .first<{ total: number; daily: number; calls: number }>();
  return {
    status: configured ? 'ready' : 'model_not_configured',
    model: models[provider],
    version: '0.3.0',
    engine: 'llm_tfidf_v2',
    source_documents: corpus.documents.length,
    source_passages: corpus.passages.length,
    source_scope: 'selected passages',
    raw_input_retention: false,
    budget: {
      estimated_total_usd: (totals?.total ?? 0) / 1e6,
      estimated_daily_usd: (totals?.daily ?? 0) / 1e6,
      total_cap_usd: serviceCap(b),
      daily_cap_usd: 2,
      daily_call_cap: 50,
      research_allowance_usd: 5,
      local_allowance_usd: 3,
      hosted_allowance_usd: 12,
      total_project_cap_usd: 20,
      billing: 'Conservative estimated ledger, not a provider invoice.',
    },
  };
}
export async function execute(value: unknown) {
  const parsed = requestSchema.safeParse(value);
  if (!parsed.success)
    throw new AuditError(
      'invalid_request',
      parsed.error.issues
        .map((x) => x.path.join('.') + ': ' + x.message)
        .join('; '),
    );
  const input = parsed.data;
  scope(input);
  const b = bindings();
  const provider = b.PROOFLENS_PROVIDER === 'claude' ? 'claude' : 'glm';
  const key =
    (provider === 'glm' ? b.ZHIPU_API_KEY : b.ANTHROPIC_API_KEY) ?? '';
  const hash = await digest(
    JSON.stringify({ ...input, request_id: undefined }),
  );
  const id = await digest(input.request_id);
  const cached = cache.get(id);
  if (cached && cached.expires > Date.now()) {
    if (cached.hash !== hash)
      throw new AuditError(
        'idempotency_conflict',
        'Request ID already used with different input.',
        409,
      );
    return { ...cached.result, cached: true };
  }
  if (!key && scope(input).length)
    throw new AuditError(
      'model_not_configured',
      'Configure a server-side model key. No deterministic approval fallback.',
      503,
    );
  await initialize(b.DB);
  if (
    await b.DB.prepare('SELECT id FROM execution_receipts WHERE id=?')
      .bind(id)
      .first()
  )
    throw new AuditError(
      'request_already_executed',
      'This request ID has a receipt; response cache expired. Use a new ID for an intentional new call.',
      409,
    );
  const reservation = scope(input).length
    ? provider === 'glm'
      ? 200000
      : 350000
    : 0;
  const day = new Date().toISOString().slice(0, 10);
  const sql =
    "INSERT INTO execution_receipts(id,request_hash,day,state,reserved_micros,charged_micros,model,claim_count,created_at) SELECT ?,?,?,'reserved',?,?,?,?,? WHERE (SELECT COALESCE(SUM(charged_micros),0) FROM execution_receipts)+? <= ? AND (SELECT COALESCE(SUM(charged_micros),0) FROM execution_receipts WHERE day=?)+? <= 2000000 AND (SELECT COUNT(*) FROM execution_receipts WHERE day=?) < 50 ON CONFLICT(id) DO NOTHING";
  const inserted = await b.DB.prepare(sql)
    .bind(
      id,
      hash,
      day,
      reservation,
      reservation,
      models[provider],
      input.claims.length,
      new Date().toISOString(),
      reservation,
      serviceCap(b) * 1e6,
      day,
      reservation,
      day,
    )
    .run();
  if (!inserted.meta.changes)
    throw new AuditError(
      'budget_or_duplicate',
      'Daily/total quota reached or request already running. No model called.',
      429,
      true,
    );
  try {
    const result = await audit(input, { provider, key });
    const cost = Math.ceil(result.usage.estimated_usd * 1e6);
    await b.DB.prepare(
      'UPDATE execution_receipts SET state=?,charged_micros=?,status_counts=?,provider_receipt=? WHERE id=?',
    )
      .bind(
        'completed',
        cost,
        JSON.stringify(result.coverage),
        result.usage.provider_request_id,
        id,
      )
      .run();
    for (const [k, v] of cache) if (v.expires <= Date.now()) cache.delete(k);
    if (cache.size >= 30) cache.delete(cache.keys().next().value!);
    cache.set(id, { hash, result, expires: Date.now() + 600000 });
    return { ...result, cached: false };
  } catch (e) {
    await b.DB.prepare(
      "UPDATE execution_receipts SET state='failed_reserved' WHERE id=?",
    )
      .bind(id)
      .run();
    throw e;
  }
}
export async function readJson(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new AuditError(
      'origin_forbidden',
      'Cross-origin browser calls are disabled.',
      403,
    );
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new AuditError('invalid_content_type', 'Use application/json.', 415);
  const bytes = await request.text();
  if (bytes.length > 16000)
    throw new AuditError(
      'input_too_large',
      'Request exceeds 16,000 characters.',
      413,
    );
  try {
    return JSON.parse(bytes);
  } catch {
    throw new AuditError('invalid_json', 'Malformed JSON.', 400);
  }
}
