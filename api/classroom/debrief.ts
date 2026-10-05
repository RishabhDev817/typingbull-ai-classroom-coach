/**
 * Secure Backend API Route for AI Classroom Debrief (Google Gemini API)
 * Supports:
 * - Next.js App Router (POST export)
 * - Next.js Pages Router & Node.js / Express (default handler export)
 *
 * Requirements:
 * - Environment variable: GEMINI_API_KEY
 */

import { handleClassroomDebrief } from '../../server/classroomDebrief';
import type { ClassroomDebriefRequest } from '../../server/classroom/types';

const FALLBACK_ERROR_MESSAGE = 'Unable to generate classroom debrief report at this time.';

// ── Next.js App Router Handler (e.g. app/api/classroom/debrief/route.ts) ──
export async function POST(req: Request) {
  try {
    const body: ClassroomDebriefRequest = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[AI Classroom Debrief API] GEMINI_API_KEY is not set in environment.');
      return new Response(
        JSON.stringify({
          error: 'Missing GEMINI_API_KEY',
          message: FALLBACK_ERROR_MESSAGE,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const debrief = await handleClassroomDebrief(body, apiKey);
    return new Response(JSON.stringify(debrief), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI Classroom Debrief Error]:', errorMsg);
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
    const body: ClassroomDebriefRequest =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[AI Classroom Debrief API] GEMINI_API_KEY is not set in environment.');
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY',
        message: FALLBACK_ERROR_MESSAGE,
      });
    }

    const debrief = await handleClassroomDebrief(body, apiKey);
    return res.status(200).json(debrief);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI Classroom Debrief Error]:', errorMsg);
    return res.status(500).json({
      error: errorMsg,
      message: FALLBACK_ERROR_MESSAGE,
    });
  }
}
