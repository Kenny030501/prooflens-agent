import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditRuns, behaviorEvents } from '@/db/schema';

const allowedEvents = new Set(['audit_started', 'audit_completed', 'evidence_opened', 'claim_overridden', 'result_exported', 'post_confidence_recorded']);

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as null | Record<string, unknown>;
  if (!payload || typeof payload.eventName !== 'string' || !allowedEvents.has(payload.eventName)) {
    return Response.json({ error: { code: 'invalid_event', message: 'Unsupported eventName.' } }, { status: 422 });
  }

  const createdAt = new Date().toISOString();
  try {
    const db = getDb();
    await db.insert(behaviorEvents).values({
      id: `evt_${crypto.randomUUID().slice(0, 14)}`,
      caseId: typeof payload.caseId === 'string' ? payload.caseId : null,
      eventName: payload.eventName,
      agentId: typeof payload.agentId === 'string' ? payload.agentId : null,
      ticker: typeof payload.ticker === 'string' ? payload.ticker : null,
      metadataJson: JSON.stringify(payload.metadata ?? {}),
      createdAt,
    });
    if (payload.eventName === 'post_confidence_recorded' && typeof payload.caseId === 'string' && typeof payload.postConfidence === 'number') {
      await db.update(auditRuns).set({ postConfidence: Math.max(0, Math.min(100, Math.round(payload.postConfidence))) }).where(eq(auditRuns.id, payload.caseId));
    }
  } catch {
    return Response.json({ accepted: true, persisted: false, createdAt });
  }
  return Response.json({ accepted: true, persisted: true, createdAt });
}
