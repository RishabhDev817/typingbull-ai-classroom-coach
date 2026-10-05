import { handleClassroomDebrief } from '../../../server/classroomDebrief';
import type { ClassroomDebriefRequest } from '../../../server/classroom/types';

interface Env {
  GEMINI_API_KEY?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: ClassroomDebriefRequest = await context.request.json();
    const apiKey =
      context.env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!apiKey) {
      console.warn('[Cloudflare Pages Debrief] GEMINI_API_KEY is not configured.');
      return new Response(
        JSON.stringify({
          error: 'Missing GEMINI_API_KEY',
          message: 'Gemini API key is not configured for Classroom Debrief.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          },
        }
      );
    }

    const debrief = await handleClassroomDebrief(body, apiKey);
    return new Response(JSON.stringify(debrief), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Cloudflare Pages Debrief Error]:', errorMsg);
    return new Response(
      JSON.stringify({
        error: errorMsg,
        message: 'Failed to generate classroom debrief report.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      }
    );
  }
}
