import fs from 'node:fs';
import crypto from 'node:crypto';
import { audit, PROMPT_VERSION } from '../lib/v2/engine.ts';
import { corpus, candidates } from '../lib/v2/retrieval.ts';

const directory = new URL('../eval/release-v0.3/', import.meta.url);
fs.mkdirSync(directory, { recursive: true });
const read = name => JSON.parse(fs.readFileSync(new URL(name, directory), 'utf8'));
const write = (name, value) => fs.writeFileSync(new URL(name, directory), JSON.stringify(value, null, 2));
const cases = JSON.parse(fs.readFileSync(new URL('../eval/release-cases.json', import.meta.url), 'utf8'));
const hash = relative => crypto.createHash('sha256').update(fs.readFileSync(new URL(relative, import.meta.url))).digest('hex');
const hashes = Object.fromEntries(['../eval/release-cases.json', '../data/corpus.json', '../lib/v2/engine.ts', '../lib/v2/provider.ts', '../lib/v2/contracts.ts', '../lib/v2/retrieval.ts', '../lib/v2/calculation.ts', './run-release-eval.mjs'].map(name => [name, hash(name)]));
if (fs.existsSync(new URL('protocol.json', directory))) {
  if (JSON.stringify(read('protocol.json').hashes) !== JSON.stringify(hashes)) throw new Error('Frozen release test changed; create a new version.');
} else write('protocol.json', { created_at: new Date().toISOString(), hashes, prompt: PROMPT_VERSION, model: 'glm-5.2', budget_usd: 0.16,
  tasks: 5, claims: 20, regression_claims: 8, fresh_claims: 12,
  distinction: 'New claim wording, same primary-source families; not unseen documents or independent human gold. No tuning after reading fresh outputs.',
  metrics: 'All failures remain in denominator. Label agreement and verbatim citations are reported separately from semantic support. Fixed source checks are not general entailment proof.' });
if (process.argv.includes('--freeze-only')) { console.log('Release cases and code frozen; no paid calls.'); process.exit(0); }
const credentials = fs.readFileSync(process.argv[2] ?? '/Users/kenny/TradingAgents/.env', 'utf8');
const line = credentials.split(/\r?\n/).find(s => /^\s*ZHIPU_API_KEY\s*=/.test(s));
const key = line?.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
if (!key) throw new Error('Missing configured model credential');
const ledger = fs.existsSync(new URL('ledger.json', directory)) ? read('ledger.json') : [];
const results = fs.existsSync(new URL('results.json', directory)) ? read('results.json') : [];
const nativeFetch = globalThis.fetch;
let active = '';
globalThis.fetch = async (url, options) => {
  if (url !== 'https://api.z.ai/api/paas/v4/chat/completions') throw new Error('Unexpected provider endpoint');
  const body = JSON.parse(options.body);
  const reserved = ((Buffer.byteLength(options.body) + 512) * 1.4 + body.max_tokens * 4.4) / 1e6;
  if (ledger.reduce((s, r) => s + r.accounted_usd, 0) + reserved > 0.16) throw new Error('Study budget reservation denied');
  const entry = { task: active, id: ledger.length + 1, started_at: new Date().toISOString(), accounted_usd: reserved, status: 'sent_usage_pending' };
  ledger.push(entry); write('ledger.json', ledger); write('request-' + entry.id + '.json', body);
  const start = performance.now();
  try {
    const response = await nativeFetch(url, options);
    const raw = await response.clone().json();
    write('response-' + entry.id + '.json', raw);
    if (raw.usage?.prompt_tokens !== undefined && raw.usage?.completion_tokens !== undefined) {
      entry.input_tokens = raw.usage.prompt_tokens; entry.output_tokens = raw.usage.completion_tokens;
      entry.estimated_usd = (entry.input_tokens * 1.4 + entry.output_tokens * 4.4) / 1e6;
      entry.accounted_usd = entry.estimated_usd; entry.status = 'usage_returned'; entry.provider_request_id = raw.id;
    } else entry.status = 'usage_unknown_reservation_retained';
    return response;
  } catch { entry.status = 'transport_error_reservation_retained'; throw new Error('Provider error; reservation retained'); }
  finally { entry.elapsed_ms = performance.now() - start; write('ledger.json', ledger); }
};
for (const task of cases) {
  if (results.some(r => r.id === task.id)) continue;
  active = task.id;
  const input = { request_id: 'release_' + task.id, entity: task.entity, as_of: task.as_of, language: 'zh',
    claims: task.claims.map(({ claim_id, text }) => ({ claim_id, text })), ...(task.source_ids ? { source_ids: task.source_ids } : {}) };
  const record = { id: task.id, split: task.split, input, retrieved_passage_ids: candidates(input).map(p => p.id) };
  try { record.output = await audit(input, { provider: 'glm', key }); record.status = 'completed'; }
  catch (e) { record.status = 'failed'; record.error = e.code ?? 'workflow_error'; }
  record.scoring = task.claims.map(c => {
    const r = record.output?.results.find(r => r.claim_id === c.claim_id);
    return { claim_id: c.claim_id, expected: c.expected, predicted: r?.status ?? null, correct: r?.status === c.expected,
      required_source_found: !c.required_source || Boolean(r?.evidence.some(e => e.passage_id === c.required_source)),
      verbatim: Boolean(r) && r.evidence.every(e => corpus.passages.some(p => p.id === e.passage_id && p.text.includes(e.quote))) };
  });
  results.push(record); write('results.json', results);
  console.log(JSON.stringify({ task: task.id, status: record.status, correct: record.scoring.filter(r => r.correct).length, claims: task.claims.length,
    total_estimated_or_reserved_usd: ledger.reduce((s, r) => s + r.accounted_usd, 0) }));
}
write('summary.json', { completed_at: new Date().toISOString(), prompt: PROMPT_VERSION, results: ['regression','fresh_claims_same_source_family'].map(split => {
  const selected = results.filter(r => r.split === split), scores = selected.flatMap(r => r.scoring);
  return { split, tasks: selected.length, completed: selected.filter(r => r.status === 'completed').length, claims: scores.length,
    labels_correct: scores.filter(r => r.correct).length, minimum_evidence_checks_passed: scores.filter(r => r.correct && r.required_source_found && r.verbatim).length };
}), calls: ledger.length, total_estimated_or_reserved_usd: ledger.reduce((s, r) => s + r.accounted_usd, 0), billed_usd: null });
console.log(JSON.stringify(read('summary.json')));
