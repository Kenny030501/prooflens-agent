import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { audit, PROMPT_VERSION } from '../lib/v2/engine';
import { corpus, candidates } from '../lib/v2/retrieval';
import { auditDraft } from '../lib/prooflens';
const root = new URL('../', import.meta.url);
const data = JSON.parse(readFileSync(new URL('eval/cases.json', root), 'utf8'));
const secrets = readFileSync(process.argv[2], 'utf8');
const key =
  secrets
    .split('\n')
    .find((l) => l.startsWith('ZHIPU_API_KEY='))
    ?.split('=')
    .slice(1)
    .join('=')
    .trim()
    .replace(/^['"]|['"]$/g, '') ?? '';
const out = new URL('eval/results-v2.1.json', root);
const results = existsSync(out)
  ? JSON.parse(readFileSync(out, 'utf8')).results
  : [];
const groups = new Map();
for (const c of data.cases) {
  const k = c.entity + '|' + c.as_of + '|' + c.source_ids.join(',');
  const g = groups.get(k) ?? [];
  g.push(c);
  groups.set(k, g);
}
const batches = [...groups.values()].flatMap((g) =>
  Array.from({ length: Math.ceil(g.length / 6) }, (_, i) =>
    g.slice(i * 6, (i + 1) * 6),
  ),
);
const frozen = {
  prompt_version: PROMPT_VERSION,
  corpus_hash: createHash('sha256')
    .update(JSON.stringify(corpus))
    .digest('hex'),
  cases_hash: createHash('sha256').update(JSON.stringify(data)).digest('hex'),
  model: 'glm-5.2',
  started_at: new Date().toISOString(),
  scope: 'synthetic diagnostic, no real-user results',
};
mkdirSync(new URL('eval/runs-v2.1/', root), { recursive: true });
writeFileSync(
  new URL('eval/protocol-v2.1.json', root),
  JSON.stringify(frozen, null, 2),
);
let estimated = results.reduce((s, r) => s + (r.allocated_usd ?? 0), 0);
for (const [index, batch] of batches.entries()) {
  if (batch.every((c) => results.some((r) => r.id === c.id))) continue;
  if (estimated + 0.2 > 2)
    throw new Error('Evaluation $2 cap reached; no further calls.');
  const first = batch[0];
  const input = {
    request_id: 'eval-' + index,
    entity: first.entity,
    as_of: first.as_of,
    language: 'en',
    source_ids: first.source_ids,
    claims: batch.map((c) => ({ claim_id: c.id, text: c.text })),
  };
  let response,
    error = null;
  const started = Date.now();
  try {
    response = await audit(input, { provider: 'glm', key });
  } catch (e) {
    error = e instanceof Error ? e.message : 'unknown error';
  }
  const charged = response?.usage?.estimated_usd ?? 0.2;
  estimated += charged;
  writeFileSync(
    new URL('eval/runs-v2.1/batch-' + index + '.json', root),
    JSON.stringify(
      { input, response, error, elapsed_ms: Date.now() - started },
      null,
      2,
    ),
  );
  for (const c of batch) {
    const verdict = response?.results.find((r) => r.claim_id === c.id);
    const old = auditDraft({
      language: 'en',
      agentId: 'eval',
      ticker: c.entity,
      question: 'Verify the supplied financial claim.',
      draftText: c.text,
    });
    const oldVerdict = old.assessments[0]?.verdict;
    const legacy =
      oldVerdict === 'supported'
        ? 'supported'
        : oldVerdict === 'conflicted'
          ? 'conflicted'
          : 'insufficient';
    results.push({
      id: c.id,
      split: c.split,
      cluster: c.cluster,
      expected: c.expected,
      predicted: verdict?.status ?? 'execution_failed',
      correct: verdict?.status === c.expected,
      legacy_predicted: legacy,
      legacy_correct: legacy === c.expected,
      valid_evidence: verdict?.evidence.length ?? 0,
      candidate_ids: candidates(input).map((p) => p.id),
      allocated_usd: charged / batch.length,
      error,
    });
  }
  writeFileSync(
    out,
    JSON.stringify(
      { protocol: frozen, estimated_usd: estimated, results },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({
      batch: index + 1,
      total_batches: batches.length,
      completed: results.length,
      error,
      estimated_usd: estimated,
    }),
  );
}
