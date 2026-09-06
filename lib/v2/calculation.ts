import type { Judgment } from './contracts';

export function calculate(d: NonNullable<Judgment['derivation']>, facts: Judgment['facts']) {
  if ('inputs' in d) {
    const [a, b] = d.inputs;
    const value = d.operation === 'sum' ? a + b : d.operation === 'difference' ? a - b : a === 0 ? NaN : ((b - a) / Math.abs(a)) * 100;
    return { valid: Number.isFinite(value) && Math.abs(value - d.result) <= Math.max(0.02, Math.abs(value) * 0.001), value, inputs: d.inputs, fact_indices: [] as number[], method: 'legacy_result_checked' };
  }
  const indices = d.operation === 'difference' ? [d.minuend_fact_index, d.subtrahend_fact_index] : d.operation === 'sum' ? d.term_fact_indices : [d.baseline_fact_index, d.current_fact_index];
  const pair = indices.map(i => facts[i]);
  if (new Set(indices).size !== 2 || pair.some(f => !f || f.value === null || !f.period || !f.unit || f.origin === 'unknown'))
    return { valid: false, value: NaN, inputs: [] as number[], fact_indices: indices, method: 'invalid_operands' };
  const [left, right] = pair;
  if (left.unit !== right.unit || left.currency !== right.currency)
    return { valid: false, value: NaN, inputs: [] as number[], fact_indices: indices, method: 'incompatible_units' };
  const [a, b] = pair.map(f => f.value!);
  const value = d.operation === 'sum' ? a + b : d.operation === 'difference' ? a - b : a === 0 ? NaN : ((b - a) / Math.abs(a)) * 100;
  return { valid: Number.isFinite(value), value: Number.isFinite(value) ? Number(value.toPrecision(12)) : NaN, inputs: [a, b], fact_indices: indices, method: 'server_computed_from_named_facts' };
}

export function quoteContainsValue(quote: string, value: number) {
  const numbers = quote.replaceAll(',', '').match(/-?\d+(?:\.\d+)?/g) ?? [];
  return numbers.some(n => Math.abs(Number(n) - Math.abs(value)) < 1e-8 || Math.abs(Number(n) - value) < 1e-8);
}
