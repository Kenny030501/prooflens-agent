import { mkdirSync, writeFileSync } from 'node:fs';

const header = ['case_id', 'ticker', 'claim_text', 'claim_type', 'expected_verdict', 'source_ids', 'annotator_1', 'annotator_2', 'adjudicated_verdict', 'notes', 'status'];
const seeds = [
  ['gold-001', 'AMZN', 'AWS sales increased 17% year over year in Q1 2024.', 'quantitative', 'supported', 'amzn-q1-2024-aws-growth'],
  ['gold-002', 'AMZN', 'Amazon operating income rose from $4.8 billion to $15.3 billion in Q1 2024.', 'quantitative', 'supported', 'amzn-q1-2024-operating-income'],
  ['gold-003', 'AMZN', 'Generative AI was the primary driver of AWS growth.', 'causal', 'no_evidence', ''],
  ['gold-004', 'AMZN', 'AWS Trainium had surpassed NVIDIA in inference market share.', 'general', 'no_evidence', ''],
  ['gold-005', 'MRVL', 'Marvell Q2 FY2025 net revenue was $1.273 billion.', 'quantitative', 'supported', 'mrvl-q2-2025-revenue'],
  ['gold-006', 'MRVL', 'Management attributed sequential growth to strong AI demand.', 'management_statement', 'supported', 'mrvl-q2-2025-ai-demand'],
  ['gold-007', 'MRVL', 'Marvell GAAP gross margin was 61.9%.', 'quantitative', 'conflicted', 'mrvl-q2-2025-margin'],
  ['gold-008', 'MRVL', 'Custom AI programs guaranteed four quarters of acceleration.', 'forward_looking', 'no_evidence', ''],
  ['gold-009', 'NVDA', 'NVIDIA Q1 FY2025 revenue was $26.0 billion.', 'quantitative', 'supported', 'nvda-q1-2025-revenue'],
  ['gold-010', 'NVDA', 'Data Center revenue was $22.6 billion, up 427%.', 'quantitative', 'supported', 'nvda-q1-2025-data-center'],
  ['gold-011', 'NVDA', 'Inference was exactly 40% of Q1 Data Center revenue.', 'quantitative', 'conflicted', 'nvda-q1-2025-inference'],
  ['gold-012', 'NVDA', 'Blackwell shipments were already at full scale in Q1 FY2025.', 'forward_looking', 'conflicted', 'nvda-q1-2025-blackwell'],
];

const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
const rows = [header.map(escape).join(',')];
for (let index = 1; index <= 120; index += 1) {
  const seed = seeds[index - 1];
  const ticker = ['AMZN', 'MRVL', 'NVDA'][(index - 1) % 3];
  const values = seed
    ? [...seed, '', '', '', 'Seed expectation; requires independent human review.', 'seed-not-human-labeled']
    : [`gold-${String(index).padStart(3, '0')}`, ticker, '', '', '', '', '', '', '', '', 'pending-human-label'];
  rows.push(values.map(escape).join(','));
}

mkdirSync('evals', { recursive: true });
writeFileSync('evals/gold_set_template.csv', `${rows.join('\n')}\n`);
console.log('Created evals/gold_set_template.csv with 120 annotation slots.');
