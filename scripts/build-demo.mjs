import fs from 'node:fs';
const results = JSON.parse(fs.readFileSync(new URL('../eval/release-v0.3/results.json', import.meta.url), 'utf8'));
const demo = {};
for (const record of results.filter(r => r.split === 'fresh_claims_same_source_family')) {
  if (!record.output) throw new Error('A real completed call is required for every example');
  demo[record.input.entity] = { input: record.input, output: record.output, source: 'eval/release-v0.3/results.json',
    limits: 'Recorded unedited output, including failures; no new model call. Not a live verification of new text.' };
}
if (Object.keys(demo).length !== 3) throw new Error('Three recorded company examples required');
fs.writeFileSync(new URL('../data/demo.json', import.meta.url), JSON.stringify(demo, null, 2));
console.log('Built three explicitly labeled recorded real-call examples.');
