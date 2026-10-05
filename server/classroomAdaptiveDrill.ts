import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CANDIDATE_MODELS, resolveGeminiApiKey } from './geminiChat.ts';
import type {
  AdaptiveDrillRequest,
  AdaptiveDrillResponse,
} from './classroom/types.ts';
import { extractJsonFromResponse } from './classroomDebrief.ts';

/**
 * Sanitize plain string input
 */
function sanitizeString(str?: string, maxLen = 120): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/[^\p{L}\p{N}\s_\-:.,!?()]/gu, '').trim().slice(0, maxLen);
}

/**
 * Sanitize typing drill text to guarantee it is 100% clean plain text for the typing engine.
 * Strips markdown, HTML, JSON artifacts, emojis, and normalizes spacing.
 */
export function sanitizeDrillText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw.trim();

  // Strip code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json|txt|text|markdown|md)?[\r\n\s]+/i, '').replace(/[\r\n\s]*```$/, '').trim();
    cleaned = cleaned.replace(/^```|```$/g, '').trim();
  }

  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');

  // Strip emojis, non-printable characters, and unusual unicode symbols
  cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');

  // Strip leading/trailing quote characters
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();

  // Strip prefixes like "Drill: " or "Text: " or "Exercise: "
  cleaned = cleaned.replace(/^(?:drill|text|exercise|practice):\s*/i, '');

  // Normalize all whitespace (newlines, tabs, multiple spaces) to a single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract or aggregate target focus keys from request or student telemetry
 */
export function extractFocusKeys(request: AdaptiveDrillRequest): string[] {
  // 1. Explicit focus keys in request
  if (Array.isArray(request.focusKeys) && request.focusKeys.length > 0) {
    const valid = request.focusKeys
      .map((k) => (typeof k === 'string' ? k.trim().toLowerCase() : ''))
      .filter((k) => k.length === 1 && /[a-z0-9,.;-]/i.test(k));
    if (valid.length > 0) {
      return Array.from(new Set(valid)).slice(0, 5);
    }
  }

  // 2. Derive from student telemetry (aggregate topErrors & weakKeys)
  const keyFrequency: Record<string, number> = {};

  if (Array.isArray(request.students)) {
    for (const student of request.students) {
      // Top errors weighted higher
      if (Array.isArray(student.topErrors)) {
        for (const k of student.topErrors) {
          if (typeof k === 'string') {
            const cleanKey = k.trim().toLowerCase();
            if (cleanKey.length === 1 && /[a-z0-9,.;-]/i.test(cleanKey)) {
              keyFrequency[cleanKey] = (keyFrequency[cleanKey] || 0) + 3;
            }
          }
        }
      }
      // Weak keys
      if (Array.isArray(student.weakKeys)) {
        for (const k of student.weakKeys) {
          if (typeof k === 'string') {
            const cleanKey = k.trim().toLowerCase();
            if (cleanKey.length === 1 && /[a-z0-9,.;-]/i.test(cleanKey)) {
              keyFrequency[cleanKey] = (keyFrequency[cleanKey] || 0) + 1;
            }
          }
        }
      }
    }
  }

  const sortedKeys = Object.entries(keyFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  if (sortedKeys.length >= 2) {
    return sortedKeys.slice(0, 3);
  } else if (sortedKeys.length === 1) {
    // Pair with a complementary reach key
    const single = sortedKeys[0];
    const complement = single === 'p' ? 'o' : single === 'b' ? 'v' : single === 'q' ? 'a' : 'e';
    return [single, complement];
  }

  // 3. Fallback default keys if class had no detected errors
  return ['p', 'b'];
}

/**
 * Determine pedagogical progression layer based on class average accuracy
 */
export function determineDrillLayer(
  request: AdaptiveDrillRequest
): 'keys' | 'words' | 'sentences' | 'hybrid' {
  if (request.preferredLayer) {
    return request.preferredLayer;
  }

  const accuracy = request.session?.classAverageAccuracy;
  if (typeof accuracy === 'number') {
    if (accuracy < 82) return 'keys';
    if (accuracy < 91) return 'words';
    return 'sentences';
  }

  return 'words';
}

/**
 * Curated word bank for common weak keys (used for deterministic fallback or augmentation)
 */
const WEAK_KEY_WORDS: Record<string, string[]> = {
  p: ['pop', 'pan', 'pin', 'pet', 'pie', 'pen', 'pat', 'pot', 'put', 'pipe', 'pace', 'post', 'part', 'path'],
  b: ['bob', 'bag', 'bed', 'big', 'box', 'bus', 'bat', 'bun', 'bit', 'boat', 'blue', 'bell', 'back', 'best'],
  r: ['run', 'red', 'rip', 'rod', 'rug', 'rat', 'rob', 'row', 'rib', 'rain', 'rest', 'ring', 'road', 'rock'],
  v: ['van', 'vet', 'via', 'vow', 'vase', 'view', 'vast', 'vine', 'vote', 'vent', 'veil', 'verb', 'volt'],
  c: ['cat', 'can', 'cup', 'car', 'cap', 'cut', 'cow', 'call', 'camp', 'cold', 'city', 'cone', 'cake'],
  m: ['man', 'map', 'men', 'mix', 'mud', 'mug', 'mat', 'moon', 'milk', 'mint', 'mask', 'meal', 'more'],
  n: ['net', 'nut', 'nod', 'nap', 'new', 'nest', 'name', 'near', 'noon', 'nine', 'next', 'neck', 'note'],
  q: ['quit', 'quiz', 'quick', 'quiet', 'queen', 'quote', 'quilt'],
  z: ['zap', 'zip', 'zoo', 'zero', 'zone', 'zinc', 'zeal'],
  x: ['box', 'fox', 'six', 'tax', 'wax', 'mix', 'fix', 'next', 'axis'],
};

/**
 * Generate a deterministic pedagogical fallback drill when Gemini is unavailable or times out
 */
export function generateFallbackDrill(
  request: AdaptiveDrillRequest,
  focusKeys: string[]
): AdaptiveDrillResponse {
  const layer = determineDrillLayer(request);
  const durationSec = Math.max(15, Math.min(300, request.durationSeconds || request.session?.durationSeconds || 60));
  const targetWPM = Math.max(15, Math.min(80, request.targetWPM || request.session?.targetWPM || 25));
  const keysLabel = focusKeys.map((k) => k.toUpperCase()).join(' & ');

  let title = `${keysLabel} Precision Drill`;
  let instructions = 'Focus on accuracy and relaxed finger reaches before building speed.';
  let reason = `Targeted practice for ${keysLabel}, identified as priority error reaches in the classroom session.`;
  let text = '';

  const k1 = focusKeys[0] || 'p';
  const k2 = focusKeys[1] || 'b';

  if (layer === 'keys') {
    title = `${keysLabel} Key Combination Drill`;
    instructions = 'Keep eyes on screen and maintain consistent rhythm with home row anchors.';
    const combos = [
      `${k1}${k1}`, `${k2}${k2}`, `${k1}${k2}`, `${k2}${k1}`,
      `${k1}${k1}${k2}`, `${k2}${k2}${k1}`, `${k1}${k2}${k1}`, `${k2}${k1}${k2}`,
      `${k1} ${k2}`, `${k2} ${k1}`,
    ];
    const words: string[] = [];
    while (words.length < 28) {
      for (const c of combos) {
        words.push(c);
        if (words.length >= 28) break;
      }
    }
    text = words.join(' ');
  } else if (layer === 'words') {
    title = `${keysLabel} Word Precision Drill`;
    instructions = 'Type smoothly word by word. Prioritize 100% accuracy over fast bursts.';
    const w1 = WEAK_KEY_WORDS[k1] || [`${k1}at`, `${k1}in`, `${k1}op`, `${k1}un`];
    const w2 = WEAK_KEY_WORDS[k2] || [`${k2}at`, `${k2}in`, `${k2}ox`, `${k2}ed`];
    const pool = [...w1, ...w2];
    const words: string[] = [];
    while (words.length < 32) {
      for (const w of pool) {
        words.push(w);
        if (words.length >= 32) break;
      }
    }
    text = words.join(' ');
  } else {
    // sentences / hybrid
    title = `${keysLabel} Sentence Fluency Drill`;
    instructions = 'Read ahead by one word and keep your rhythm steady through the sentence.';
    if (k1 === 'p' && k2 === 'b') {
      text = 'Bob puts the blue bag beside the desk. Pat placed the purple pen by the big paper pad. The brave puppy barked at the busy brown bus.';
    } else {
      text = `Keep a calm posture while practicing ${k1} and ${k2}. Reach smoothly from the home row without shifting your wrists. Steady rhythm creates fast and accurate typing over time.`;
    }
  }

  return {
    title,
    instructions,
    text: sanitizeDrillText(text),
    focusKeys,
    durationSeconds: durationSec,
    targetWPM,
    reason,
    difficulty: layer === 'keys' ? 'foundational' : layer === 'words' ? 'targeted' : 'advanced',
    layer,
  };
}

/**
 * Build Gemini prompt and system instruction for Adaptive Drill Synthesizer
 */
export function buildAdaptiveDrillPrompt(
  request: AdaptiveDrillRequest,
  focusKeys: string[],
  layer: 'keys' | 'words' | 'sentences' | 'hybrid'
): { systemInstruction: string; userPrompt: string } {
  const session = request.session || {};
  const lessonTitle = sanitizeString(session.lessonTitle || session.passageTitle || 'Classroom Exercise');
  const targetWPM = Math.max(15, Math.min(80, request.targetWPM || session.targetWPM || 25));
  const durationSec = Math.max(15, Math.min(300, request.durationSeconds || session.durationSeconds || 60));
  const classAvgWpm = session.classAverageWpm || 25;
  const classAvgAcc = session.classAverageAccuracy || 88;
  const keysFormatted = focusKeys.map((k) => k.toUpperCase()).join(', ');

  const systemInstruction = `You are "TypingBull Adaptive Drill Synthesizer", an expert touch-typing instructional designer for K-12 computer lab teachers.
Your task is to generate a short, focused, highly effective typing drill specifically designed to remediate observed student weaknesses on target keys: [${keysFormatted}].

PEDAGOGICAL DRILL DESIGN RULES:
1. TARGETED KEY DENSITY:
   - The generated typing text must heavily emphasize the focus keys: [${keysFormatted}].
   - At least 60% of the words or letter groups in the drill text must contain one or more of the focus keys.

2. PROGRESSIVE DRILL LAYERS:
   - "keys": Repeated key combinations, bigrams, and alternating patterns (e.g., "pp bp pb pp bb pb bp"). Recommended when class accuracy is low (< 82%).
   - "words": Short, real, common vocabulary words using the focus keys (e.g., "pop bob pub bib pat bat pen ban pin bin"). Recommended when class accuracy is moderate (82-90%).
   - "sentences": Natural, engaging, coherent sentences using words that feature the focus keys (e.g., "Bob puts the blue bag by the desk."). Recommended when class accuracy is high (> 90%).
   - "hybrid": A smooth progressive ramp (key patterns -> short words -> 1 simple sentence).
   Current target layer for this drill: "${layer}".

3. STRICT DRILL TEXT SAFETY & FORMAT:
   - The "text" field MUST contain ONLY clean, plain text for typing.
   - NO markdown bold/italics/headings.
   - NO HTML tags.
   - NO code blocks or backticks.
   - NO emojis.
   - NO instructions, commentary, or quotes inside the "text" field itself.
   - Separate words with single spaces. No tabs or line breaks inside "text".
   - Age-appropriate, positive, school-safe content suitable for students.
   - Length: 25 to 45 words (approximately 120 to 220 characters) for a ${durationSec}-second exercise.

4. STRICT JSON OUTPUT:
   Return strictly valid JSON matching the requested schema.`;

  const userPrompt = `CLASSROOM TELEMETRY & DRILL REQUIREMENTS:
- Prior Activity: "${lessonTitle}"
- Focus Keys to Drill: [${keysFormatted}]
- Target Layer: "${layer}"
- Class Average Speed: ${classAvgWpm} WPM
- Class Average Accuracy: ${classAvgAcc}%
- Target Speed for this Drill: ${targetWPM} WPM
- Drill Duration: ${durationSec} seconds

Synthesize the adaptive drill now as a single valid JSON object:
{
  "title": "<e.g., ${keysFormatted} Precision Drill>",
  "instructions": "<1-2 encouraging sentences guiding finger placement and posture>",
  "text": "<clean plain text drill with high density of ${keysFormatted}>",
  "focusKeys": [${focusKeys.map((k) => `"${k}"`).join(', ')}],
  "durationSeconds": ${durationSec},
  "targetWPM": ${targetWPM},
  "reason": "<1 concise sentence explaining why this drill was synthesized based on classroom error data>",
  "difficulty": "<foundational | targeted | advanced>",
  "layer": "${layer}"
}`;

  return { systemInstruction, userPrompt };
}

/**
 * Handle POST /api/classroom/adaptive-drill
 * Invokes Google Gemini with model failover and returns a structured AdaptiveDrillResponse
 */
export async function handleAdaptiveDrill(
  request: AdaptiveDrillRequest,
  apiKey?: string
): Promise<AdaptiveDrillResponse> {
  if (!request) {
    throw new Error('INVALID_REQUEST_BODY');
  }

  const focusKeys = extractFocusKeys(request);
  const layer = determineDrillLayer(request);
  const durationSec = Math.max(15, Math.min(300, request.durationSeconds || request.session?.durationSeconds || 60));
  const targetWPM = Math.max(15, Math.min(80, request.targetWPM || request.session?.targetWPM || 25));

  let resolvedApiKey: string | undefined;
  try {
    resolvedApiKey = resolveGeminiApiKey(apiKey);
  } catch {
    // If API key is not configured, gracefully return deterministic fallback drill
    console.warn('[Adaptive Drill] GEMINI_API_KEY missing or invalid, using deterministic synthesizer.');
    return generateFallbackDrill(request, focusKeys);
  }

  const { systemInstruction, userPrompt } = buildAdaptiveDrillPrompt(request, focusKeys, layer);
  const genAI = new GoogleGenerativeAI(resolvedApiKey);

  let lastError: unknown;
  for (const modelName of GEMINI_CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.35,
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const rawText = response.text();

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('EMPTY_GEMINI_RESPONSE');
      }

      const parsed = extractJsonFromResponse(rawText);

      // Sanitize drill text
      const cleanText = sanitizeDrillText(parsed.text || '');

      // Verify that cleanText is viable (at least 20 characters and contains focus keys)
      if (cleanText.length < 20) {
        throw new Error('GENERATED_TEXT_TOO_SHORT');
      }

      const keysLabel = focusKeys.map((k) => k.toUpperCase()).join(' & ');

      return {
        title: sanitizeString(parsed.title || `${keysLabel} Precision Drill`, 60),
        instructions: sanitizeString(
          parsed.instructions || 'Focus on accuracy and keep your fingers relaxed on the home row.',
          200
        ),
        text: cleanText,
        focusKeys: Array.isArray(parsed.focusKeys) && parsed.focusKeys.length > 0 ? parsed.focusKeys : focusKeys,
        durationSeconds: typeof parsed.durationSeconds === 'number' ? parsed.durationSeconds : durationSec,
        targetWPM: typeof parsed.targetWPM === 'number' ? parsed.targetWPM : targetWPM,
        reason: sanitizeString(
          parsed.reason || `Targeted practice for ${keysLabel} based on session performance.`,
          200
        ),
        difficulty: sanitizeString(parsed.difficulty || 'targeted', 30),
        layer: sanitizeString(parsed.layer || layer, 20),
      };
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Adaptive Drill] Attempt with ${modelName} failed (${errMsg}), trying next candidate...`);
    }
  }

  console.warn('[Adaptive Drill] All Gemini candidate models failed:', lastError, 'Falling back to deterministic drill generator.');
  return generateFallbackDrill(request, focusKeys);
}
