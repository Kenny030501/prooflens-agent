import { AuditError, modelSchema } from './contracts';

export type ProviderConfig = { provider: 'glm' | 'claude'; key: string };
export const models = { glm: 'glm-5.2', claude: 'claude-sonnet-5' };
export const rates = {
  glm: { input: 1.4, output: 4.4 },
  claude: { input: 2, output: 10 },
};
type ProviderResponse = {
  id?: string;
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  content?: { type: string; text?: string }[];
  stop_reason?: string;
  usage?: {
    prompt_tokens?: number;
    input_tokens?: number;
    completion_tokens?: number;
    output_tokens?: number;
  };
};
export async function complete(
  config: ProviderConfig,
  system: string,
  user: string,
) {
  if (!config.key)
    throw new AuditError(
      'model_not_configured',
      'A server-side model key is required.',
      503,
    );
  const schema = {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            claim_id: { type: 'string' },
            status: {
              type: 'string',
              enum: ['supported', 'conflicted', 'insufficient'],
            },
            reason: { type: 'string' },
            facts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  value: { type: ['number', 'null'] },
                  currency: { type: ['string', 'null'] },
                  unit: { type: ['string', 'null'] },
                  period: { type: ['string', 'null'] },
                  basis: {
                    type: 'string',
                    enum: ['GAAP', 'non-GAAP', 'not_applicable', 'unknown'],
                  },
                  origin: {
                    type: 'string',
                    enum: [
                      'reported_actual',
                      'management_guidance',
                      'market_consensus',
                      'analyst_estimate',
                      'derived',
                      'unknown',
                    ],
                  },
                },
                required: [
                  'metric',
                  'value',
                  'currency',
                  'unit',
                  'period',
                  'basis',
                  'origin',
                ],
                additionalProperties: false,
              },
            },
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  passage_id: { type: 'string' },
                  quote: { type: 'string' },
                },
                required: ['passage_id', 'quote'],
                additionalProperties: false,
              },
            },
            missing_fields: { type: 'array', items: { type: 'string' } },
            derivation: {
              anyOf: [
                { type: 'null' },
                {
                  type: 'object',
                  properties: {
                    operation: {
                      type: 'string',
                      enum: ['sum', 'difference', 'percent_change'],
                    },
                    inputs: { type: 'array', items: { type: 'number' } },
                    result: { type: 'number' },
                    assumptions: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['operation', 'inputs', 'result', 'assumptions'],
                  additionalProperties: false,
                },
              ],
            },
          },
          required: [
            'claim_id',
            'status',
            'reason',
            'facts',
            'citations',
            'missing_fields',
            'derivation',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['results'],
    additionalProperties: false,
  };
  let response: Response;
  try {
    response = await fetch(
      config.provider === 'glm'
        ? 'https://api.z.ai/api/paas/v4/chat/completions'
        : 'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        signal: AbortSignal.timeout(60000),
        headers:
          config.provider === 'glm'
            ? {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.key}`,
              }
            : {
                'Content-Type': 'application/json',
                'x-api-key': config.key,
                'anthropic-version': '2023-06-01',
              },
        body: JSON.stringify(
          config.provider === 'glm'
            ? {
                model: models.glm,
                temperature: 0,
                thinking: { type: 'disabled' },
                max_tokens: 8192,
                response_format: { type: 'json_object' },
                messages: [
                  {
                    role: 'system',
                    content:
                      system +
                      '\nReturn JSON matching this schema: ' +
                      JSON.stringify(schema),
                  },
                  { role: 'user', content: user },
                ],
              }
            : {
                model: models.claude,
                max_tokens: 8192,
                thinking: { type: 'disabled' },
                system,
                messages: [{ role: 'user', content: user }],
                output_config: { format: { type: 'json_schema', schema } },
              },
        ),
      },
    );
  } catch {
    throw new AuditError(
      'provider_timeout',
      'Model call failed or timed out. No automatic paid retry.',
      504,
      true,
    );
  }
  if (!response.ok)
    throw new AuditError(
      'provider_unavailable',
      `Model provider returned HTTP ${response.status}.`,
      502,
      response.status >= 429,
    );
  const body = (await response.json()) as ProviderResponse;
  const raw =
    config.provider === 'glm'
      ? body.choices?.[0]?.message?.content
      : body.content
          ?.filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('');
  const finish =
    config.provider === 'glm'
      ? body.choices?.[0]?.finish_reason
      : body.stop_reason;
  const input = body.usage?.prompt_tokens ?? body.usage?.input_tokens ?? 0;
  const output =
    body.usage?.completion_tokens ?? body.usage?.output_tokens ?? 0;
  const usage = {
    input_tokens: input,
    output_tokens: output,
    estimated_usd:
      (input * rates[config.provider].input +
        output * rates[config.provider].output) /
      1e6,
    provider_request_id: String(body.id ?? ''),
    model: models[config.provider],
  };
  if (finish === 'length' || finish === 'max_tokens')
    throw new AuditError(
      'model_truncated',
      'Model output exceeded its limit. Submit fewer claims.',
      502,
      true,
    );
  try {
    return { data: modelSchema.parse(JSON.parse(raw ?? '')), usage };
  } catch {
    throw new AuditError(
      'model_schema_error',
      'Model returned an invalid evidence contract. No claims approved.',
      502,
      true,
    );
  }
}
