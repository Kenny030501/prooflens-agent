import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { readJson } from '@/lib/v2/runtime';
import { AuditError, errorResponse } from '@/lib/v2/contracts';
const event = z
  .object({
    event_name: z.enum([
      'audit_started',
      'audit_completed',
      'evidence_opened',
      'result_exported',
    ]),
    duration_ms: z.number().int().min(0).max(3600000).optional(),
    entity: z.enum(['AMZN', 'MRVL', 'NVDA']),
    session_id: z.uuid(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    const parsed = event.safeParse(await readJson(request));
    if (!parsed.success)
      throw new AuditError(
        'invalid_event',
        'Only anonymous event, session, entity and duration fields accepted.',
      );
    const p = parsed.data;
    await (env.DB as D1Database)
      .prepare(
        'INSERT INTO behavior_events (id,case_id,event_name,ticker,metadata_json,created_at) VALUES (?,?,?,?,?,?)',
      )
      .bind(
        crypto.randomUUID(),
        p.session_id,
        p.event_name,
        p.entity,
        JSON.stringify({ duration_ms: p.duration_ms ?? null }),
        new Date().toISOString(),
      )
      .run();
    return Response.json({ accepted: true, persisted: true });
  } catch (e) {
    return errorResponse(e);
  }
}
