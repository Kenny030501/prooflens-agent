import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const corpus = JSON.parse(
  readFileSync(new URL('../data/corpus.json', import.meta.url), 'utf8'),
);
const prior = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const heldout = ['AMZN-2023FY', 'AMZN-2024Q3', 'MRVL-2025Q1', 'NVDA-2025Q3'];
const rows = [];
for (const task of prior.tasks)
  for (const c of task.claims)
    rows.push({
      id: 'legacy-' + c.id,
      entity: task.ticker,
      as_of: task.as_of,
      source_ids: c.evidence_ids.length
        ? [...new Set(c.evidence_ids.map((id) => id.replace(/-P\d+$/, '')))]
        : corpus.documents
            .filter(
              (d) =>
                d.ticker === task.ticker &&
                d.filedAt <= task.as_of &&
                !heldout.includes(d.id),
            )
            .map((d) => d.id),
      cluster: task.ticker + '-paired-periods',
      split: 'development',
      text: c.text,
      expected: c.expected,
      evidence_ids: c.evidence_ids,
      failure_mode: c.failure_mode,
    });
const specs = {
  'AMZN-2024Q1': [
    [
      'P471',
      'AWS sales increased 17% year over year in Q1 2024.',
      '17%',
      '71%',
    ],
    [
      'P482',
      'Amazon operating income was $15.3 billion in Q1 2024.',
      '15.3',
      '4.8',
    ],
    [
      'P482',
      'Amazon operating income increased from Q1 2023 to Q1 2024.',
      'increased',
      'decreased',
    ],
  ],
  'AMZN-2024Q2': [
    [
      'P470',
      'AWS sales increased 19% year over year in Q2 2024.',
      '19%',
      '18%',
    ],
    [
      'P481',
      'Amazon operating income was $30.0 billion for the six months ended June 30, 2024.',
      'six months',
      'three months',
    ],
    [
      'P481',
      'Amazon Q2 2024 operating income was $14.7 billion.',
      'billion',
      'million',
    ],
  ],
  'MRVL-2025Q2': [
    ['P010', 'Marvell Q2 FY2025 revenue was $1.273 billion.', '1.273', '2.273'],
    [
      'P010',
      'Marvell Q2 FY2025 non-GAAP net income was $266.2 million.',
      'non-GAAP',
      'GAAP',
    ],
    [
      'P013',
      'Marvell expected Q3 FY2025 net revenue of $1.450 billion plus or minus 5%.',
      '1.450',
      '1.800',
    ],
  ],
  'MRVL-2025Q3': [
    ['P010', 'Marvell Q3 FY2025 revenue was $1.516 billion.', '1.516', '1.273'],
    [
      'P010',
      'Marvell Q3 FY2025 non-GAAP net income was $373.0 million.',
      'non-GAAP',
      'GAAP',
    ],
    [
      'P013',
      'Marvell expected Q4 FY2025 net revenue of $1.800 billion plus or minus 5%.',
      '1.800',
      '1.450',
    ],
  ],
  'NVDA-2025Q1': [
    ['P443', 'NVIDIA Q1 FY2025 revenue was $26.0 billion.', '26.0', '30.0'],
    [
      'P451',
      'NVIDIA Q1 FY2025 Data Center revenue was $22.6 billion.',
      'billion',
      'million',
    ],
    [
      'P443',
      'NVIDIA Q1 FY2025 revenue was up 262% from a year ago.',
      'up',
      'down',
    ],
  ],
  'NVDA-2025Q2': [
    ['P444', 'NVIDIA Q2 FY2025 revenue was $30.0 billion.', '30.0', '26.0'],
    [
      'P455',
      'NVIDIA Q2 FY2025 Data Center revenue was $26.3 billion.',
      '26.3',
      '22.6',
    ],
    [
      'P444',
      'NVIDIA Q2 FY2025 revenue was up 122% year over year.',
      'year over year',
      'sequentially',
    ],
  ],
  'AMZN-2023FY': [
    [
      'P421',
      'AWS sales increased 13% in 2023 compared to the prior year.',
      '13%',
      '31%',
    ],
    [
      'P426',
      'Amazon operating income was $36.9 billion in 2023.',
      '36.9',
      '12.2',
    ],
    [
      'P426',
      'Amazon operating income was $12.2 billion in 2022.',
      'billion',
      'million',
    ],
  ],
  'AMZN-2024Q3': [
    [
      'P479',
      'AWS sales increased 19% in Q3 2024 year over year.',
      '19%',
      '18%',
    ],
    [
      'P490',
      'Amazon Q3 2024 operating income was $17.4 billion.',
      '17.4',
      '11.2',
    ],
    [
      'P490',
      'Amazon operating income was $47.4 billion for the nine months ended September 30, 2024.',
      'nine months',
      'three months',
    ],
  ],
  'MRVL-2024FY': [
    [
      'P623',
      'Marvell fiscal 2024 net revenue was about $5.5 billion.',
      '5.5',
      '9.5',
    ],
    [
      'P623',
      'Marvell fiscal 2024 net revenue was 7.0% lower than fiscal 2023.',
      'lower',
      'higher',
    ],
    [
      'P623',
      'Marvell fiscal 2024 data center sales decreased 8% compared to fiscal 2023.',
      'decreased',
      'increased',
    ],
  ],
  'MRVL-2025Q1': [
    [
      'P544',
      'Marvell net revenue for the three months ended May 4, 2024 decreased by $160.8 million year over year.',
      '160.8',
      '260.8',
    ],
    [
      'P544',
      'Marvell data center sales increased 87% year over year in the three months ended May 4, 2024.',
      'increased',
      'decreased',
    ],
    [
      'P558',
      'Marvell gross margin increased by 3.3 percentage points year over year for the three months ended May 4, 2024.',
      '3.3',
      '13.3',
    ],
  ],
  'NVDA-2024FY': [
    [
      'P585',
      'NVIDIA fiscal 2024 Data Center revenue was $47.5 billion.',
      '47.5',
      '60.9',
    ],
    [
      'P586',
      'NVIDIA fiscal 2024 Gaming revenue was $10.4 billion.',
      'billion',
      'million',
    ],
    [
      'P585',
      'NVIDIA fiscal 2024 Data Center revenue was up 217% from fiscal 2023.',
      'up',
      'down',
    ],
  ],
  'NVDA-2025Q3': [
    ['P500', 'NVIDIA gross margin was 74.6% for Q3 FY2025.', '74.6%', '75.8%'],
    [
      'P445',
      'NVIDIA Q3 FY2025 Data Center compute revenue was $27.6 billion.',
      '27.6',
      '3.1',
    ],
    [
      'P445',
      'NVIDIA Q3 FY2025 networking revenue was down 15% sequentially.',
      'down',
      'up',
    ],
  ],
};
for (const doc of corpus.documents) {
  const base = {
    entity: doc.ticker,
    as_of: doc.filedAt,
    source_ids: [doc.id],
    cluster: doc.id,
    split: heldout.includes(doc.id) ? 'heldout' : 'development',
  };
  for (const [i, [p, text, from, to]] of specs[doc.id].entries()) {
    const evidence_id = doc.id + '-' + p;
    if (!corpus.passages.some((p) => p.id === evidence_id))
      throw new Error('Missing evidence: ' + evidence_id);
    rows.push({
      ...base,
      id: doc.id + '-S' + i,
      text,
      expected: 'supported',
      evidence_ids: [evidence_id],
      failure_mode: 'source_grounded_fact',
    });
    rows.push({
      ...base,
      id: doc.id + '-C' + i,
      text: text.replace(from, to),
      expected: 'conflicted',
      evidence_ids: [evidence_id],
      failure_mode: 'controlled_scope_or_number_mutation',
    });
  }
  rows.push({
    ...base,
    id: doc.id + '-U',
    text:
      doc.ticker +
      ' management proved that all future revenue growth will be caused exclusively by generative AI and is guaranteed.',
    expected: 'insufficient',
    evidence_ids: [],
    failure_mode: 'unsupported_causal_forecast',
  });
  rows.push({
    ...base,
    id: doc.id + '-T',
    as_of: '2020-01-01',
    text: specs[doc.id][0][1],
    expected: 'insufficient',
    evidence_ids: [],
    failure_mode: 'future_information_leakage',
  });
}
if (rows.length !== 120)
  throw new Error('Expected 120 cases, got ' + rows.length);
mkdirSync(new URL('../eval/', import.meta.url), { recursive: true });
const result = {
  version: 'eval-2.0',
  label_origin:
    'Agent-authored source-grounded synthetic diagnostics; not human annotations or user survey samples.',
  split_rule:
    'Disjoint heldout source documents. Cross-period legacy cases are development only.',
  independent_users: 0,
  heldout_documents: heldout,
  cases: rows,
};
writeFileSync(
  new URL('../eval/cases.json', import.meta.url),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    cases: rows.length,
    heldout: rows.filter((r) => r.split === 'heldout').length,
    sha256: createHash('sha256').update(JSON.stringify(result)).digest('hex'),
  }),
);
