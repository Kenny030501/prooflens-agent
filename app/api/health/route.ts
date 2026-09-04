export async function GET() {
  return Response.json({
    status: 'ok',
    product: 'ProofLens for Agents',
    version: '0.1.0',
    engine: 'deterministic-demo',
    rawInputRetention: false,
  });
}
