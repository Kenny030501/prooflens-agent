import { z } from 'zod';

export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + 'T00:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'Invalid calendar date');
export const requestSchema = z
  .object({
    request_id: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z0-9_-]+$/),
    entity: z.enum(['AMZN', 'MRVL', 'NVDA']),
    as_of: date,
    language: z.enum(['en', 'zh']).default('en'),
    claims: z
      .array(
        z
          .object({
            claim_id: z.string().trim().min(1).max(40),
            text: z.string().trim().min(5).max(1000),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    source_ids: z.array(z.string().max(80)).max(12).optional(),
  })
  .strict()
  .refine(
    (r) => new Set(r.claims.map((c) => c.claim_id)).size === r.claims.length,
    'Claim IDs must be unique',
  );
export const factSchema = z.object({
  metric: z.string(),
  value: z.number().nullable(),
  currency: z.string().nullable(),
  unit: z.string().nullable(),
  period: z.string().nullable(),
  basis: z.enum(['GAAP', 'non-GAAP', 'not_applicable', 'unknown']),
  origin: z.enum([
    'reported_actual',
    'management_guidance',
    'market_consensus',
    'analyst_estimate',
    'derived',
    'unknown',
  ]),
});
export const judgmentSchema = z.object({
  claim_id: z.string(),
  status: z.enum(['supported', 'conflicted', 'insufficient']),
  reason: z.string().min(1),
  facts: z.array(factSchema),
  citations: z.array(
    z.object({ passage_id: z.string(), quote: z.string().min(20).max(1800) }),
  ),
  missing_fields: z.array(z.string()),
  derivation: z
    .object({
      operation: z.enum(['sum', 'difference', 'percent_change']),
      inputs: z.array(z.number()).min(2).max(2),
      result: z.number(),
      assumptions: z.array(z.string()),
    })
    .nullable(),
});
export const modelSchema = z.object({
  results: z.array(judgmentSchema).min(1).max(12),
});
export type AuditInput = z.infer<typeof requestSchema>;
export type Judgment = z.infer<typeof judgmentSchema>;
export class AuditError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 422,
    public retryable = false,
  ) {
    super(message);
  }
}
export function errorResponse(error: unknown) {
  const e =
    error instanceof AuditError
      ? error
      : new AuditError(
          'internal_error',
          'Audit unavailable. No claims were approved.',
          503,
          true,
        );
  return Response.json(
    {
      error: { code: e.code, message: e.message, retryable: e.retryable },
      gate: 'not_evaluated',
    },
    { status: e.status, headers: { 'Cache-Control': 'no-store' } },
  );
}
