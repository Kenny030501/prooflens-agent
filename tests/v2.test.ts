import assert from 'node:assert/strict';
import { requestSchema, type Judgment } from '../lib/v2/contracts';
import { candidates, corpus, retrieve, scope } from '../lib/v2/retrieval';
import { audit, validateJudgment } from '../lib/v2/engine';
const request = {
  request_id: 'test',
  entity: 'AMZN' as const,
  as_of: '2024-08-02',
  language: 'en' as const,
  claims: [
    {
      claim_id: 'C1',
      text: 'AWS sales increased 17% year over year in Q1 2024.',
    },
  ],
};
let checks = 0;
function check(name: string, fn: () => void) {
  fn();
  checks++;
  console.log('PASS ' + name);
}
check('reject whitespace', () =>
  assert.equal(
    requestSchema.safeParse({
      ...request,
      claims: [{ claim_id: 'C1', text: '            ' }],
    }).success,
    false,
  ),
);
check('reject empty claims', () =>
  assert.equal(
    requestSchema.safeParse({ ...request, claims: [] }).success,
    false,
  ),
);
check('reject duplicate IDs', () =>
  assert.equal(
    requestSchema.safeParse({
      ...request,
      claims: [...request.claims, ...request.claims],
    }).success,
    false,
  ),
);
check('reject 13 claims rather than silently truncate', () =>
  assert.equal(
    requestSchema.safeParse({
      ...request,
      claims: Array.from({ length: 13 }, (_, i) => ({
        claim_id: String(i),
        text: 'test claim',
      })),
    }).success,
    false,
  ),
);
check('reject invalid dates', () =>
  assert.equal(
    requestSchema.safeParse({ ...request, as_of: '2024-02-30' }).success,
    false,
  ),
);
check('reject unknown fields', () =>
  assert.equal(
    requestSchema.safeParse({ ...request, private_data: 'secret' }).success,
    false,
  ),
);
check('no future-source leakage', () =>
  assert.equal(scope({ ...request, as_of: '2020-01-01' }).length, 0),
);
check('reject cross-entity source', () =>
  assert.throws(() => scope({ ...request, source_ids: ['NVDA-2025Q1'] })),
);
check('18 unique documents with hashes', () => {
  assert.equal(corpus.documents.length, 18);
  for (const d of corpus.documents) assert.match(d.sha256, /^[a-f0-9]{64}$/);
});
check('TF-IDF finds exact supporting passage', () =>
  assert.equal(
    retrieve(request.claims[0].text, scope(request), 1)[0].id,
    'AMZN-2024Q1-P471',
  ),
);
const passages = candidates(request);
const p = passages[0];
const j: Judgment = {
  claim_id: 'C1',
  status: 'supported',
  reason: 'Matched',
  facts: [],
  citations: [{ passage_id: p.id, quote: p.text }],
  missing_fields: [],
  derivation: null,
};
check('unknown source cannot pass', () =>
  assert.equal(
    validateJudgment(
      { ...j, citations: [{ passage_id: 'fake', quote: p.text }] },
      passages,
    ).status,
    'insufficient',
  ),
);
check('fabricated quote cannot pass', () =>
  assert.equal(
    validateJudgment(
      {
        ...j,
        citations: [
          { passage_id: p.id, quote: 'This quote was entirely invented.' },
        ],
      },
      passages,
    ).status,
    'insufficient',
  ),
);
check('wrong arithmetic cannot pass', () =>
  assert.equal(
    validateJudgment(
      {
        ...j,
        derivation: {
          operation: 'sum',
          inputs: [1, 2],
          result: 9,
          assumptions: [],
        },
      },
      passages,
    ).status,
    'insufficient',
  ),
);
check('zero division cannot pass', () =>
  assert.equal(
    validateJudgment(
      {
        ...j,
        derivation: {
          operation: 'percent_change',
          inputs: [0, 2],
          result: 200,
          assumptions: [],
        },
      },
      passages,
    ).status,
    'insufficient',
  ),
);
const noEvidence = await audit(
  { ...request, as_of: '2020-01-01' },
  { provider: 'glm', key: '' },
);
check('empty evidence never passes', () => {
  assert.equal(noEvidence.gate, 'hold');
  assert.equal(noEvidence.results.length, 1);
  assert.equal(noEvidence.usage.model, 'not_called');
});
await assert.rejects(
  () =>
    audit(request, { provider: 'glm', key: 'fake' }, async () => ({
      data: { results: [] },
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        estimated_usd: 0,
        model: 'mock',
        provider_request_id: '',
      },
    })),
  /omitted/,
);
checks++;
console.log(JSON.stringify({ checks, passed: checks, paid_calls: 0 }));
