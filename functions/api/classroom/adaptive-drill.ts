import { handleAdaptiveDrill } from '../../../server/classroomAdaptiveDrill';
import type { AdaptiveDrillRequest } from '../../../server/classroom/types';

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
    const body: AdaptiveDrillRequest = await context.request.json();
    const apiKey =
      context.env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    const drill = await handleAdaptiveDrill(body, apiKey);
    return new Response(JSON.stringify(drill), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Cloudflare Pages Adaptive Drill Error]:', errorMsg);
    return new Response(
      JSON.stringify({
        error: errorMsg,
        message: 'Failed to synthesize adaptive drill.',
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
