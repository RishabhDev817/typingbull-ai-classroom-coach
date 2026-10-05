import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CANDIDATE_MODELS, resolveGeminiApiKey } from './geminiChat.ts';
import type {
  ClassroomStudentCoachRequest,
  ClassroomStudentCoachResponse,
} from './classroom/types.ts';
import { extractJsonFromResponse } from './classroomDebrief.ts';

/**
 * Sanitize plain string input to remove HTML, control characters, and excess whitespace
 */
function sanitizeString(str?: string, maxLen = 220): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '')
    .replace(/[^\p{L}\p{N}\s_\-:.,!?()'"%]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Extract up to 3 valid focus keys from student telemetry (without inventing fake keys)
 */
export function extractStudentFocusKeys(request: ClassroomStudentCoachRequest): string[] {
  const student = request.student;
  if (!student) return [];

  const keyCount: Record<string, number> = {};

  if (Array.isArray(student.topErrors)) {
    for (const k of student.topErrors) {
      if (typeof k === 'string') {
        const clean = k.trim().toLowerCase();
        if (clean.length === 1 && /[a-z0-9,.;-]/i.test(clean)) {
          keyCount[clean] = (keyCount[clean] || 0) + 2;
        }
      }
    }
  }

  if (Array.isArray(student.weakKeys)) {
    for (const k of student.weakKeys) {
      if (typeof k === 'string') {
        const clean = k.trim().toLowerCase();
        if (clean.length === 1 && /[a-z0-9,.;-]/i.test(clean)) {
          keyCount[clean] = (keyCount[clean] || 0) + 1;
        }
      }
    }
  }

  return Object.entries(keyCount)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 3);
}

/**
 * Deterministic fallback coaching feedback generator.
 * Strictly adheres to objective metrics rules when Gemini is unreachable, offline, or rate-limited.
 */
export function generateFallbackStudentCoach(
  request: ClassroomStudentCoachRequest,
  focusKeys: string[]
): ClassroomStudentCoachResponse {
  const student = request.student || { wpm: 20, accuracy: 90 };
  const session = request.session || {};

  const wpm = Math.max(0, Math.round(student.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(student.accuracy ?? 100)));
  const targetWPM = Math.max(10, Math.round(session.targetWPM || 30));
  const keysLabel = focusKeys.map((k) => k.toUpperCase()).join(' & ');

  let headline = 'Great Effort!';
  let message = `You completed the exercise with ${wpm} WPM and ${accuracy}% accuracy.`;
  let strength = 'Steady Persistence';
  let nextAction = 'Continue practicing with comfortable posture and relaxed shoulders.';
  let encouragement = 'Consistency builds confidence — keep up the good momentum!';

  // Situation 1: High accuracy + low speed
  if (accuracy >= 90 && wpm < targetWPM * 0.85) {
    headline = 'Rock-Solid Accuracy!';
    strength = 'Keystroke Precision';
    if (focusKeys.length > 0) {
      message = `Your ${accuracy}% accuracy is a great foundation. Focus keys ${keysLabel} had a few pauses, but your fingers know the keys well.`;
      nextAction = `Try typing a little faster on familiar words while keeping your ${keysLabel} reaches relaxed.`;
    } else {
      message = `Your ${accuracy}% accuracy is a wonderful foundation. Now you can gently increase your typing speed while keeping mistakes low.`;
      nextAction = 'Try reading half a word ahead to build speed without sacrificing your high accuracy.';
    }
    encouragement = 'Speed comes naturally once your accuracy is established!';
  }
  // Situation 2: Low accuracy + high speed
  else if (accuracy < 85 && wpm >= targetWPM) {
    headline = 'Fast Fingers, Now Dial In Precision!';
    strength = 'Typing Velocity';
    if (focusKeys.length > 0) {
      message = `Impressive speed at ${wpm} WPM, but accuracy dipped to ${accuracy}%. Key reaches for ${keysLabel} caused most of the slips.`;
      nextAction = `Ease off your speed by 5 WPM on your next round to make sure your ${keysLabel} reaches land cleanly.`;
    } else {
      message = `You have great speed at ${wpm} WPM, but accuracy dipped to ${accuracy}%. Easing off slightly will help reduce errors.`;
      nextAction = 'Slow down your pace by just a little bit to prioritize clean, single-touch keystrokes.';
    }
    encouragement = 'Smooth is fast — steady rhythm beats frantic rushing every time.';
  }
  // Situation 3: Low accuracy + low speed
  else if (accuracy < 85 && wpm < targetWPM) {
    headline = 'Build the Foundation!';
    strength = 'Dedicated Practice';
    if (focusKeys.length > 0) {
      message = `Your results show that ${keysLabel} caused extra hesitation in this round. Clean repetition will help build muscle memory.`;
      nextAction = `Focus on slow, deliberate reaches for ${keysLabel} without worrying about the timer.`;
    } else {
      message = 'Focus on relaxed finger placement on the home row anchors (F and J). Speed will improve naturally with practice.';
      nextAction = 'Keep your eyes on the screen and tap each letter deliberately.';
    }
    encouragement = 'Every practice round trains your muscle memory. You are making real progress!';
  }
  // Situation 4: High accuracy + near/above target speed
  else if (accuracy >= 90 && wpm >= targetWPM * 0.85) {
    headline = 'Outstanding Balance!';
    strength = 'Balanced Flow & Speed';
    if (focusKeys.length > 0) {
      message = `Terrific performance! You achieved ${accuracy}% accuracy and ${wpm} WPM, with only minor hesitation on ${keysLabel}.`;
      nextAction = `Keep this balanced cadence going and take extra care when reaching for ${keysLabel}.`;
    } else {
      message = `Terrific balance of speed (${wpm} WPM) and accuracy (${accuracy}%). You are typing with confident touch-typing rhythm!`;
      nextAction = 'Maintain this smooth rhythm across longer sentences and varying word lengths.';
    }
    encouragement = 'Fantastic work — you are in the top tier of flow and control!';
  }
  // Situation 5: Moderate balanced (85-89%)
  else {
    headline = 'Solid Consistency!';
    strength = 'Steady Cadence';
    if (focusKeys.length > 0) {
      message = `Good steady rhythm at ${wpm} WPM and ${accuracy}% accuracy. Practicing ${keysLabel} will push you into the 90%+ precision zone.`;
      nextAction = `Give extra attention to ${keysLabel} reaches to turn those close misses into clean hits.`;
    } else {
      message = `Good steady rhythm at ${wpm} WPM and ${accuracy}% accuracy. You are very close to the 90% mastery benchmark.`;
      nextAction = 'Maintain a steady beat between keystrokes to minimize minor slips.';
    }
    encouragement = 'You are right on the edge of mastery — keep that focus!';
  }

  return {
    headline,
    message,
    strength,
    focusKeys,
    nextAction,
    encouragement,
  };
}

/**
 * Build prompt for Gemini Student AI Micro-Coach
 */
export function buildStudentCoachPrompt(
  request: ClassroomStudentCoachRequest,
  focusKeys: string[]
): { systemInstruction: string; userPrompt: string } {
  const student = request.student || { wpm: 20, accuracy: 90 };
  const session = request.session || {};

  const wpm = Math.max(0, Math.round(student.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(student.accuracy ?? 100)));
  const targetWPM = Math.max(10, Math.round(session.targetWPM || 30));
  const isCompleted = student.completed !== false;
  const timeSpent = typeof student.timeSpentSec === 'number' ? `${student.timeSpentSec}s` : 'Full round';
  const lessonTitle = sanitizeString(session.lessonTitle || session.passageTitle || 'Classroom Exercise', 60);
  const keysLabel = focusKeys.length > 0 ? focusKeys.map((k) => k.toUpperCase()).join(', ') : 'None';

  const systemInstruction = `You are "TypingBull Student AI Micro-Coach", an encouraging, expert touch-typing coach for K-12 students.
Your mission is to provide an empowering, concise, 2-3 sentence personalized micro-coaching insight immediately after a classroom typing round.

CORE COACHING PRINCIPLES:
1. Student-Friendly & Encouraging: Use clear, warm, positive language. Never use harsh, stigmatizing, or negative judgments (e.g. NEVER say "You are bad at P" or "You failed").
2. Metric-Grounded Guidance:
   - If accuracy >= 90% and speed < target: Praise precision, gently encourage gradually building speed without rushing.
   - If accuracy < 85% and speed >= target: Praise speed, advise easing off the pace slightly to prioritize clean keystrokes.
   - If accuracy < 85% and speed < target: Encourage building home-row foundation and deliberate finger placement. Speed will follow.
   - If accuracy >= 90% and speed >= target: Celebrate the outstanding balance of speed and control.
3. Weak Keys:
   - Target keys observed in telemetry: [${keysLabel}].
   - If focus keys exist, explain gently: "Your results show that ${keysLabel} caused a few more slips in this round. A short focused practice will help build consistency."
   - If focus keys is None, DO NOT invent fake error keys! Leave focusKeys empty [].
4. Strictly Anonymous & No Assumptions:
   - Do NOT assume student identity, age, or physical attributes.
   - Do NOT invent posture observations, medical conclusions, or hand positions.
   - Base feedback strictly on WPM, accuracy, completion status, and observed error keys.
5. Strict JSON Output:
   Return strictly valid JSON conforming to the schema below. Keep strings compact and punchy.`;

  const userPrompt = `STUDENT ROUND METRICS:
- Lesson/Activity: "${lessonTitle}"
- Student Speed: ${wpm} WPM (Target: ${targetWPM} WPM)
- Student Accuracy: ${accuracy}%
- Status: ${isCompleted ? 'Completed' : 'Time Expired before completion'} (${timeSpent})
- Observed Error Keys: [${keysLabel}]

Synthesize personalized micro-coach feedback as a single JSON object:
{
  "headline": "<3-5 words encouraging title, e.g. Rock-Solid Accuracy!>",
  "message": "<1-2 sentences personalized summary of their performance and speed/accuracy balance>",
  "strength": "<1 key observed strength, e.g. Keystroke Accuracy | Quick Velocity | Steady Cadence>",
  "focusKeys": [${focusKeys.map((k) => `"${k}"`).join(', ')}],
  "nextAction": "<1 specific, actionable instruction for their very next round>",
  "encouragement": "<1 short uplifting closing sentence>"
}`;

  return { systemInstruction, userPrompt };
}

/**
 * Handle POST /api/classroom/student-coach
 * Invokes Google Gemini with model failover and returns strict JSON ClassroomStudentCoachResponse.
 * If Gemini is unavailable, rate-limited, or fails, returns high quality deterministic fallback.
 */
export async function handleStudentCoach(
  request: ClassroomStudentCoachRequest,
  apiKey?: string
): Promise<ClassroomStudentCoachResponse> {
  if (!request || !request.student) {
    throw new Error('INVALID_REQUEST_BODY');
  }

  const focusKeys = extractStudentFocusKeys(request);

  let resolvedApiKey: string | undefined;
  try {
    resolvedApiKey = resolveGeminiApiKey(apiKey);
  } catch {
    console.warn('[Student AI Coach] GEMINI_API_KEY missing or invalid, using deterministic coach.');
    return generateFallbackStudentCoach(request, focusKeys);
  }

  const { systemInstruction, userPrompt } = buildStudentCoachPrompt(request, focusKeys);
  const genAI = new GoogleGenerativeAI(resolvedApiKey);

  let lastError: unknown;
  for (const modelName of GEMINI_CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const rawText = response.text();

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('EMPTY_GEMINI_RESPONSE');
      }

      const parsed = extractJsonFromResponse(rawText);

      // Validate and sanitize response fields
      const headline = sanitizeString(parsed.headline || 'Great Effort!', 60);
      const message = sanitizeString(parsed.message || 'Keep practicing with steady rhythm and relaxed shoulders.', 240);
      const strength = sanitizeString(parsed.strength || 'Steady Cadence', 40);
      const nextAction = sanitizeString(parsed.nextAction || 'Continue with deliberate keystrokes on the home row.', 180);
      const encouragement = sanitizeString(parsed.encouragement || 'Consistency builds speed over time!', 120);

      // Only allow focus keys that were either in parsed.focusKeys AND matched focusKeys or subset
      const sanitizedFocusKeys = Array.isArray(parsed.focusKeys)
        ? parsed.focusKeys
            .map((k: unknown) => (typeof k === 'string' ? k.trim().toLowerCase() : ''))
            .filter((k: string) => k.length === 1 && /[a-z0-9,.;-]/i.test(k))
            .slice(0, 3)
        : focusKeys;

      return {
        headline,
        message,
        strength,
        focusKeys: sanitizedFocusKeys,
        nextAction,
        encouragement,
      };
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Student AI Coach] Attempt with ${modelName} failed (${errMsg}), trying next candidate...`);
    }
  }

  console.warn('[Student AI Coach] All Gemini candidate models failed:', lastError, 'Falling back to deterministic coach.');
  return generateFallbackStudentCoach(request, focusKeys);
}
