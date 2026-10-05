/**
 * Secure Backend API Route for AI Adaptive Drill Synthesizer (Google Gemini API)
 * Supports:
 * - Next.js App Router (POST export)
 * - Next.js Pages Router & Node.js / Express (default handler export)
 *
 * Requirements:
 * - Environment variable: GEMINI_API_KEY
 */

import { handleAdaptiveDrill } from '../../server/classroomAdaptiveDrill';
import type { AdaptiveDrillRequest } from '../../server/classroom/types';

const FALLBACK_ERROR_MESSAGE = 'Unable to synthesize adaptive drill at this time.';

// ── Next.js App Router Handler (e.g. app/api/classroom/adaptive-drill/route.ts) ──
export async function POST(req: Request) {
  try {
    const body: AdaptiveDrillRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const drill = await handleAdaptiveDrill(body, apiKey);
    return new Response(JSON.stringify(drill), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Adaptive Drill API Error]:', errorMsg);
    return new Response(
      JSON.stringify({
        error: errorMsg,
        message: FALLBACK_ERROR_MESSAGE,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Next.js Pages Router / Node HTTP / Express Compatible Handler ──
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const body: AdaptiveDrillRequest =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const drill = await handleAdaptiveDrill(body, apiKey);
    return res.status(200).json(drill);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Adaptive Drill API Error]:', errorMsg);
    return res.status(500).json({
      error: errorMsg,
      message: FALLBACK_ERROR_MESSAGE,
    });
  }
}
