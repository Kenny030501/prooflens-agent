import data from '../../data/corpus.json';
import { AuditError, type AuditInput } from './contracts';

export const corpus = data;
export type Passage = (typeof data.passages)[number];
const aliases: Record<string, string> = {
  营收: 'revenue sales',
  收入: 'revenue sales income',
  利润: 'income profit',
  营业: 'operating',
  净: 'net',
  增长: 'increased growth',
  下降: 'decreased',
  指引: 'guidance outlook expected',
  推理: 'inference',
  数据中心: 'data center',
  亚马逊: 'amazon',
  英伟达: 'nvidia',
  毛利率: 'gross margin',
  第一季度: 'first quarter q1',
  第二季度: 'second quarter q2',
  第三季度: 'third quarter q3',
  第四季度: 'fourth quarter q4',
};
export function tokenize(s: string) {
  let text = s.toLowerCase();
  for (const [a, b] of Object.entries(aliases))
    text = text.replaceAll(a, ' ' + b + ' ');
  return text.match(/[a-z]+|\d+(?:\.\d+)?|[\u4e00-\u9fff]/g) ?? [];
}
export function scope(input: AuditInput) {
  if (
    input.source_ids?.some(
      (id) =>
        !data.documents.some((d) => d.id === id && d.ticker === input.entity),
    )
  )
    throw new AuditError(
      'invalid_source',
      'Unknown source or wrong company. List sources first.',
    );
  return data.passages.filter(
    (p) =>
      p.ticker === input.entity &&
      p.filedAt <= input.as_of &&
      (!input.source_ids || input.source_ids.includes(p.document_id)),
  );
}
export function retrieve(query: string, passages: Passage[], limit = 6) {
  if (!passages.length) return [];
  const vectors = passages.map((p) => tokenize(p.text + ' ' + p.period));
  const df = new Map<string, number>();
  for (const tokens of vectors)
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) =>
    Math.log((1 + passages.length) / (1 + (df.get(t) ?? 0))) + 1;
  const vector = (tokens: string[]) => {
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    return new Map(
      [...counts].map(([t, n]) => [t, (1 + Math.log(n)) * idf(t)]),
    );
  };
  const q = vector(tokenize(query));
  const norm = (v: Map<string, number>) =>
    Math.sqrt([...v.values()].reduce((s, n) => s + n * n, 0));
  const qn = norm(q);
  return passages
    .map((p, i) => {
      const v = vector(vectors[i]);
      const dot = [...q].reduce((s, [t, n]) => s + n * (v.get(t) ?? 0), 0);
      return { ...p, score: dot / (qn * norm(v) || 1) };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}
export function candidates(input: AuditInput) {
  const available = scope(input);
  const perClaim = input.claims.map((c) => retrieve(c.text, available));
  const chosen = new Map<string, Passage>();
  for (let rank = 0; rank < 6; rank++)
    for (const list of perClaim) {
      const p = list[rank];
      if (p && chosen.size < 24) chosen.set(p.id, p);
    }
  return [...chosen.values()];
}
