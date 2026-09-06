import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Pass the reviewed versioned corpus JSON path. No network crawling is performed.');
const target = new URL('../data/corpus.json', import.meta.url);
const original = JSON.parse(fs.readFileSync(target, 'utf8'));
const extra = JSON.parse(fs.readFileSync(source, 'utf8'));
const known = new Set(original.documents.map(d => d.id));
const urls = new Set(original.documents.map(d => d.url));
for (const d of extra.documents) {
  if (known.has(d.id)) continue;
  if (urls.has(d.url)) throw new Error('Duplicate source URL requires explicit review');
  if (!/^[a-f0-9]{64}$/.test(d.sha256)) throw new Error('Missing source hash');
  const selected = extra.passages.filter(p => p.document_id === d.id);
  original.documents.push({ ...d, full_text_chars: fs.readFileSync(path.join(path.dirname(source), 'sources', d.id + '.html'), 'utf8').length,
    selected_text_chars: selected.reduce((s, p) => s + p.text.length, 0), selected_passages: selected.length, anchorHits: [] });
  original.passages.push(...selected);
  known.add(d.id);
  urls.add(d.url);
}
original.version = 'prooflens-corpus-2.2';
fs.writeFileSync(target, JSON.stringify(original, null, 2));
console.log(JSON.stringify({ documents: original.documents.length, passages: original.passages.length, version: original.version }));
