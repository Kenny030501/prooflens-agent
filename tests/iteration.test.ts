import assert from 'node:assert/strict';
import { calculate } from '../lib/v2/calculation';
import { candidates, corpus } from '../lib/v2/retrieval';
import { validateJudgment } from '../lib/v2/engine';
import { requestSchema, type Judgment } from '../lib/v2/contracts';

let checks = 0;
const check = (name: string, fn: () => void) => { fn(); checks++; console.log('PASS ' + name); };
const p = corpus.passages.find(p => p.id === 'MRVL-2026Q1-new-P04')!;
const facts: Judgment['facts'] = [177.9, 540].map((value, i) => ({ metric: 'net_income', value, currency: 'USD', unit: 'million', period: 'Q1 FY2026', basis: i === 0 ? 'GAAP' : 'non-GAAP', origin: 'reported_actual', evidence_passage_id: p.id }));
const named: NonNullable<Judgment['derivation']> = { operation: 'difference', minuend_fact_index: 1, subtrahend_fact_index: 0, assumptions: ['Non-GAAP minus GAAP within the same quarter; derived gap.'] };
const judgment: Judgment = { claim_id: 'C1', status: 'supported', reason: 'Source-bound test', facts, citations: [{ passage_id: p.id, quote: p.text }], missing_fields: [], derivation: named };
check('server computes non-GAAP minus GAAP gap', () => assert.equal(calculate(named, facts).value, 362.1));
check('named roles preserve negative difference', () => assert.equal(calculate({ ...named, minuend_fact_index: 0, subtrahend_fact_index: 1 }, facts).value, -362.1));
check('sum uses referenced values', () => assert.equal(calculate({ operation: 'sum', term_fact_indices: [0, 1], assumptions: [] }, facts).value, 717.9));
check('percent uses explicit baseline/current', () => assert.equal(calculate({ operation: 'percent_change', baseline_fact_index: 0, current_fact_index: 1, assumptions: [] }, [{ ...facts[0], value: 100 }, { ...facts[1], value: 125 }]).value, 25));
check('out-of-range operand fails', () => assert.equal(calculate({ ...named, minuend_fact_index: 9 }, facts).valid, false));
check('same operand index fails', () => assert.equal(calculate({ ...named, minuend_fact_index: 0 }, facts).valid, false));
check('zero baseline fails', () => assert.equal(calculate({ operation: 'percent_change', baseline_fact_index: 0, current_fact_index: 1, assumptions: [] }, [{ ...facts[0], value: 0 }, facts[1]]).valid, false));
check('mixed units fail rather than auto-convert', () => assert.equal(calculate(named, [{ ...facts[0], unit: 'billion' }, facts[1]]).valid, false));
check('mixed currencies fail', () => assert.equal(calculate(named, [{ ...facts[0], currency: 'EUR' }, facts[1]]).valid, false));
check('unknown origin fails', () => assert.equal(calculate(named, [{ ...facts[0], origin: 'unknown' }, facts[1]]).valid, false));
check('valid numeric operands retain supported', () => assert.equal(validateJudgment(judgment, [p]).status, 'supported'));
check('unquoted operand cannot pass', () => assert.equal(validateJudgment({ ...judgment, facts: [{ ...facts[0], evidence_passage_id: 'invented' }, facts[1]] }, [p]).status, 'insufficient'));
check('invented operand value cannot pass', () => assert.equal(validateJudgment({ ...judgment, facts: [{ ...facts[0], value: 987654 }, facts[1]] }, [p]).status, 'insufficient'));
check('computed output binds operand IDs', () => assert.deepEqual(validateJudgment(judgment, [p]).derivation?.input_evidence_ids, [p.id, p.id]));
check('legacy malformed result still fails closed', () => assert.equal(calculate({ operation: 'difference', inputs: [187.8, 155.7], result: -32.1, assumptions: [] }, []).valid, false));
const request = requestSchema.parse({ request_id: 'iteration', entity: 'AMZN', as_of: '2025-05-31', language: 'en', source_ids: ['AMZN-2024Q4-new', 'AMZN-2025Q1-new'], claims: [
  { claim_id: 'A2a', text: 'Amazon reported full-year 2024 operating income of $68.6 billion and Q4 2024 operating income of $21.2 billion; these are different reporting periods.' },
  { claim_id: 'A2b', text: 'Amazon net sales declined sequentially from $187.8 billion in Q4 2024 to $155.7 billion in Q1 2025.' },
  { claim_id: 'A2c', text: 'Amazon reported net income of $59.2 billion in Q4 2024.' },
  { claim_id: 'A2d', text: 'Amazon disclosed AWS standalone free cash flow of $8.0 billion for Q1 2025.' },
] });
check('counterfactual retrieval recovers omitted quarterly actual', () => assert(candidates(request).some(p => p.id === 'AMZN-2024Q4-new-P06')));
check('evidence packet remains bounded', () => assert(candidates(request).length <= 24));
check('new sources respect as-of cutoff', () => assert(candidates({ ...request, as_of: '2025-01-01' }).length === 0));
check('18 sources and 690 passages remain unique', () => { assert.equal(corpus.documents.length, 18); assert.equal(corpus.passages.length, 690); assert.equal(new Set(corpus.passages.map(p => p.id)).size, 690); });
console.log(JSON.stringify({ checks, passed: checks, paid_calls: 0 }));
