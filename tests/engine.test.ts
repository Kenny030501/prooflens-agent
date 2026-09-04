import assert from 'node:assert/strict';
import { auditDraft, evidenceLibrary, sampleDrafts } from '../lib/prooflens';

assert.equal(evidenceLibrary.length, 12);
assert.deepEqual(new Set(evidenceLibrary.map((source) => source.ticker)), new Set(['AMZN', 'MRVL', 'NVDA']));
assert.ok(evidenceLibrary.every((source) => source.url.startsWith('https://www.sec.gov/')));

const amazon = auditDraft({
  language: 'en',
  agentId: 'test_agent',
  ticker: 'AMZN',
  question: sampleDrafts.AMZN.question,
  draftText: sampleDrafts.AMZN.draft,
  preConfidence: 82,
});
assert.equal(amazon.assessments.length, 4);
assert.equal(amazon.assessments[0].verdict, 'supported');
assert.equal(amazon.assessments[1].verdict, 'supported');
assert.equal(amazon.gateDecision, 'block');
assert.ok(amazon.assessments.some((claim) => claim.verdict === 'no_evidence'));

const marvellConflict = auditDraft({
  language: 'en',
  agentId: 'test_agent',
  ticker: 'MRVL',
  question: 'Verify the reported gross margin.',
  draftText: 'Marvell GAAP gross margin was 61.9% in Q2 FY2025.',
});
assert.equal(marvellConflict.assessments[0].verdict, 'conflicted');
assert.equal(marvellConflict.gateDecision, 'block');

const nvidiaScope = auditDraft({
  language: 'zh',
  agentId: 'test_agent',
  ticker: 'NVDA',
  question: 'Verify the inference contribution.',
  draftText: 'Inference represented exactly 40% of Q1 Data Center revenue.',
});
assert.equal(nvidiaScope.assessments[0].verdict, 'conflicted');

const invalidSourceDates = evidenceLibrary.filter((source) => Number.isNaN(Date.parse(source.filedAt)));
assert.equal(invalidSourceDates.length, 0);

console.log('engine.test.ts: all assertions passed');
