export async function POST() {
  return Response.json(
    {
      error: {
        code: 'legacy_engine_retired',
        message: 'Use POST /api/v2/evidence-audits with explicit claims.',
      },
      gate: 'not_evaluated',
    },
    { status: 410 },
  );
}
