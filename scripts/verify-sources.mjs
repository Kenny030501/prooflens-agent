import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const corpus = JSON.parse(
  readFileSync(new URL('../data/corpus.json', import.meta.url), 'utf8'),
);
const records = [];
for (const d of corpus.documents) {
  const r = await fetch(d.url, {
    signal: AbortSignal.timeout(20000),
    headers: {
      'User-Agent': 'ProofLens source integrity check contact@example.com',
    },
  });
  const html = await r.text();
  const hash = createHash('sha256').update(html).digest('hex');
  records.push({
    id: d.id,
    url: d.url,
    status: r.status,
    hash_matches: hash === d.sha256,
    checked_at: new Date().toISOString(),
  });
  console.log(JSON.stringify(records.at(-1)));
}
writeFileSync(
  new URL('../eval/source-integrity.json', import.meta.url),
  JSON.stringify(records, null, 2),
);
if (records.some((r) => r.status !== 200 || !r.hash_matches))
  process.exitCode = 1;
