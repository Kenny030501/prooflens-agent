import { getDb } from '@/db';
import { auditRuns } from '@/db/schema';
import { auditDraft, isAuditRequest } from '@/lib/prooflens';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: { code: 'invalid_json', message: 'Request body must be valid JSON.' } }, { status: 400 });
  }

  if (!isAuditRequest(payload)) {
    return Response.json({
      error: {
        code: 'invalid_request',
        message: 'Required: language, agentId, ticker, question, and draftText (12–12,000 characters).',
      },
    }, { status: 422 });
  }

  const result = auditDraft(payload);
  try {
    await getDb().insert(auditRuns).values({
      id: result.caseId,
      agentId: result.agentId,
      ticker: result.ticker,
      claimCount: result.assessments.length,
      supportedCount: result.coverage.supported,
      flaggedCount: result.assessments.length - result.coverage.supported,
      gateDecision: result.gateDecision,
      preConfidence: result.preConfidence,
      createdAt: result.createdAt,
    });
  } catch {
  }

  return Response.json(result, {
    headers: {
      'Cache-Control': 'no-store',
      'X-ProofLens-Source-Cutoff': result.sourceCutoff,
    },
  });
}
