import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const previous = process.argv[2];
if (!previous)
  throw new Error(
    'Usage: node scripts/build-corpus.mjs PATH_TO_PREVIOUS_CORPUS',
  );
const corpus = JSON.parse(readFileSync(previous, 'utf8'));
const base = 'https://www.sec.gov/Archives/edgar/data/';
const specs = [
  [
    'AMZN-2023FY',
    'AMZN',
    'FY2023',
    '2024-02-02',
    '10-K',
    '1018724/000101872424000008/amzn-20231231.htm',
  ],
  [
    'AMZN-2024Q3',
    'AMZN',
    'Q3 2024 and nine months 2024',
    '2024-11-01',
    '10-Q',
    '1018724/000101872424000161/amzn-20240930.htm',
  ],
  [
    'MRVL-2024FY',
    'MRVL',
    'FY2024 ended February 3 2024',
    '2024-03-13',
    '10-K',
    '1835632/000183563224000009/mrvl-20240203.htm',
  ],
  [
    'MRVL-2025Q1',
    'MRVL',
    'Q1 FY2025 ended May 4 2024',
    '2024-05-31',
    '10-Q',
    '1835632/000183563224000063/mrvl-20240504.htm',
  ],
  [
    'NVDA-2024FY',
    'NVDA',
    'FY2024 ended January 28 2024',
    '2024-02-21',
    '10-K',
    '1045810/000104581024000029/nvda-20240128.htm',
  ],
  [
    'NVDA-2025Q3',
    'NVDA',
    'Q3 FY2025 ended October 27 2024',
    '2024-11-20',
    '10-Q',
    '1045810/000104581024000316/nvda-20241027.htm',
  ],
];
mkdirSync(root + '/data', { recursive: true });
mkdirSync(root + '/outputs/source-cache', { recursive: true });
for (const [id, ticker, period, filedAt, form, path] of specs) {
  const url = base + path;
  const local = root + '/outputs/source-cache/' + id + '.html';
  let html;
  if (existsSync(local)) html = readFileSync(local, 'utf8');
  else {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ProofLens academic research contact@example.com',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(id + ' HTTP ' + res.status);
    html = await res.text();
    writeFileSync(local, html);
  }
  const plain = execFileSync('pandoc', ['-f', 'html', '-t', 'plain'], {
    input: html,
    encoding: 'utf8',
    maxBuffer: 20000000,
  });
  writeFileSync(root + '/outputs/source-cache/' + id + '.txt', plain);
  let offset = 0;
  const paragraphs = plain.split(/\n\s*\n/).map((block, index) => {
    const start = plain.indexOf(block, offset);
    offset = start + block.length;
    const line = plain.slice(0, start).split('\n').length;
    return {
      ordinal: index + 1,
      line_start: line,
      line_end: line + block.split('\n').length - 1,
      text: block.replace(/\s+/g, ' ').trim(),
    };
  });
  const selected = paragraphs
    .filter(
      (p) =>
        p.text.length >= 80 &&
        p.text.length <= 1800 &&
        !/xbrli:|iso4217:|http:/.test(p.text) &&
        /revenue|sales|operating income|gross margin|Blackwell|inference|GAAP|net loss|net income/i.test(
          p.text,
        ),
    )
    .slice(-80);
  for (const p of selected)
    corpus.passages.push({
      id: `${id}-P${String(p.ordinal).padStart(3, '0')}`,
      document_id: id,
      ticker,
      period,
      filedAt,
      form,
      url,
      ...p,
    });
  corpus.documents.push({
    id,
    ticker,
    period,
    filedAt,
    form,
    url,
    fetched_at: new Date().toISOString(),
    sha256: createHash('sha256').update(html).digest('hex'),
    full_text_chars: plain.length,
    selected_text_chars: selected.reduce((s, p) => s + p.text.length, 0),
    selected_passages: selected.length,
    scope:
      'Selected financial and product passages. Full filing downloadable from SEC.',
  });
  console.log(JSON.stringify({ id, selected: selected.length }));
}
corpus.version = 'prooflens-corpus-2.0';
writeFileSync(
  root + '/data/corpus.json',
  JSON.stringify(corpus, null, 2) + '\n',
);
