import assert from 'node:assert/strict';
import { evidenceLibrary } from '../lib/prooflens';

const urls = [...new Set(evidenceLibrary.map((source) => source.url))];
for (const url of urls) {
  const response = await fetch(url, { headers: { 'User-Agent': 'ProofLens prototype contact@example.com' } });
  assert.equal(response.ok, true, `${response.status} for ${url}`);
  const text = await response.text();
  assert.ok(text.length > 5_000, `Unexpectedly short SEC document: ${url}`);
}

console.log(`source-links.test.ts: ${urls.length} unique SEC documents resolved`);
