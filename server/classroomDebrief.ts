import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CANDIDATE_MODELS, resolveGeminiApiKey } from './geminiChat.ts';
import type {
  ClassroomDebriefRequest,
  ClassroomDebriefResponse,
  ClassroomPriorityArea,
  ClassroomStudentGroup,
} from './classroom/types.ts';

/**
 * Sanitize text to remove HTML tags and control characters
 */
function sanitizeString(str?: string, maxLen = 120): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/[^\p{L}\p{N}\s_\-:.,!?()]/gu, '').trim().slice(0, maxLen);
}

/**
 * Extract JSON object safely from raw Gemini output (including markdown code fences)
 */
export function extractJsonFromResponse(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip leading/trailing markdown code blocks if model included them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Find first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Validate and sanitize parsed debrief response ensuring complete schema adherence
 */
function validateAndSanitizeDebrief(parsed: any, totalStudents: number): ClassroomDebriefResponse {
  const classHealthScore =
    typeof parsed.classHealthScore === 'number' && !isNaN(parsed.classHealthScore)
      ? Math.max(0, Math.min(100, Math.round(parsed.classHealthScore)))
      : 80;

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : 'Classroom typing drill concluded with solid overall student engagement.';

  const keyTakeaway =
    typeof parsed.keyTakeaway === 'string' && parsed.keyTakeaway.trim().length > 0
      ? parsed.keyTakeaway.trim()
      : 'Maintain focus on rhythm and home row anchor fingers before increasing speed.';

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0).slice(0, 5)
    : ['High student participation throughout the active session.'];

  const priorityAreas: ClassroomPriorityArea[] = Array.isArray(parsed.priorityAreas)
    ? parsed.priorityAreas
        .filter((p: any) => p && typeof p.area === 'string' && typeof p.reason === 'string')
        .slice(0, 5)
        .map((p: any) => ({
          area: String(p.area).trim(),
          reason: String(p.reason).trim(),
          affectedStudents:
            typeof p.affectedStudents === 'number' && !isNaN(p.affectedStudents)
              ? Math.max(0, Math.min(totalStudents, Math.round(p.affectedStudents)))
              : 0,
        }))
    : [];

  const studentGroups: ClassroomStudentGroup[] = Array.isArray(parsed.studentGroups)
    ? parsed.studentGroups
        .filter((g: any) => g && typeof g.group === 'string' && typeof g.description === 'string')
        .slice(0, 6)
        .map((g: any) => ({
          group: String(g.group).trim(),
          description: String(g.description).trim(),
          count:
            typeof g.count === 'number' && !isNaN(g.count)
              ? Math.max(0, Math.round(g.count))
              : 0,
        }))
    : [];

  const recommendedNextStep =
    typeof parsed.recommendedNextStep === 'string' && parsed.recommendedNextStep.trim().length > 0
      ? parsed.recommendedNextStep.trim()
      : 'Conduct a 2-minute accuracy drill reinforcing home-row finger anchors.';

  const recommendedFocusKeys: string[] = Array.isArray(parsed.recommendedFocusKeys)
    ? parsed.recommendedFocusKeys
        .filter((k: unknown) => typeof k === 'string' && k.trim().length > 0)
        .map((k: string) => k.trim().toLowerCase().slice(0, 2))
        .slice(0, 8)
    : [];

  return {
    classHealthScore,
    summary,
    keyTakeaway,
    strengths,
    priorityAreas,
    studentGroups,
    recommendedNextStep,
    recommendedFocusKeys,
  };
}

/**
 * Build the system instruction and prompt for the AI Classroom Debrief
 */
export function buildClassroomDebriefPrompt(request: ClassroomDebriefRequest): {
  systemInstruction: string;
  userPrompt: string;
  totalStudents: number;
} {
  const session = request.session || {};
  const passageTitle = sanitizeString(session.lessonTitle || session.passageTitle || 'Classroom Exercise');
  const targetWPM = typeof session.targetWPM === 'number' ? Math.max(10, Math.round(session.targetWPM)) : 30;
  const durationSec = typeof session.durationSeconds === 'number' ? Math.max(10, Math.round(session.durationSeconds)) : 60;

  // Cap student count at 35 to prevent prompt explosion and adhere to computer lab capacities
  const rawStudents = Array.isArray(request.students) ? request.students.slice(0, 35) : [];
  const totalStudents = rawStudents.length;

  // Compute empirical aggregates
  const completedCount = rawStudents.filter((s) => s.completed !== false).length;
  const totalWpm = rawStudents.reduce((sum, s) => sum + (typeof s.wpm === 'number' ? s.wpm : 0), 0);
  const totalAcc = rawStudents.reduce((sum, s) => sum + (typeof s.accuracy === 'number' ? s.accuracy : 100), 0);
  const avgWpm = totalStudents > 0 ? Math.round(totalWpm / totalStudents) : 0;
  const avgAcc = totalStudents > 0 ? Math.round((totalAcc / totalStudents) * 10) / 10 : 100;

  // Build anonymous student roster lines (strip any personal identifiers)
  const studentDataLines = rawStudents.map((s, index) => {
    const weakList = (s.weakKeys || []).slice(0, 5).join(', ') || 'None';
    const errorList = (s.topErrors || []).slice(0, 5).join(', ') || 'None';
    const isCompleted = s.completed !== false;
    const timeSpent = typeof s.timeSpentSec === 'number' ? `${s.timeSpentSec}s` : 'N/A';

    return `Student ${index + 1}: Speed=${Math.round(s.wpm)} WPM, Accuracy=${Math.round(s.accuracy)}%, Status=${isCompleted ? 'Completed' : 'Incomplete'}, TimeSpent=${timeSpent}, Weak Keys=[${weakList}], Top Error Keys=[${errorList}]`;
  });

  const systemInstruction = `You are "TypingBull AI Classroom Coach", an expert pedagogical assistant for touch-typing educators and computer lab teachers.
Your mission is to analyze classroom-wide typing telemetry data, detect empirical learning cohorts, and produce a concise, actionable debrief that helps the teacher decide what to drill next.

CORE PEDAGOGICAL & GROUNDING GUIDELINES:
1. Grounding in Observed Data: Ground every observation strictly in the provided student telemetry numbers. Do not invent arbitrary facts, backgrounds, or student attributes.
2. Distinguish Observation vs. Recommendation: Explicitly separate what happened in the data (e.g., "4 of 10 students had high error rates on 'p'") from instructional suggestions (e.g., "Recommend a 60-second top-row pinky reach drill").
3. Constructive Learning Cohorts: Group students into meaningful instructional categories based solely on their metrics:
   - "Velocity Masters": Fast typists exceeding target WPM with solid accuracy.
   - "Precision Anchors": High accuracy (>= 94%), steady pace, prioritizing correct finger placement.
   - "Developing Typists": Approaching target metrics with moderate pacing.
   - "Needs Support": Typists with accuracy under 85% or high error rates on specific key reaches.
   Ensure every student is counted into one of these cohorts, and the sum of counts equals ${totalStudents}.
4. Class Health Score: Calculate a fair, holistic score (0 to 100) reflecting overall classroom readiness based on accuracy vs 90% benchmark, speed vs target WPM (${targetWPM} WPM), and completion rate.
5. Strict JSON Output: Output strictly valid JSON conforming to the requested schema. No markdown explanations outside the JSON.`;

  const userPrompt = `CLASSROOM SESSION CONTEXT:
- Activity / Lesson: "${passageTitle}"
- Target WPM: ${targetWPM} WPM
- Session Duration: ${durationSec} seconds
- Total Enrolled Students: ${totalStudents}
- Students Completed: ${completedCount}/${totalStudents} (${totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0}%)
- Class Average Speed: ${avgWpm} WPM
- Class Average Accuracy: ${avgAcc}%

ANONYMIZED STUDENT TELEMETRY:
${studentDataLines.length > 0 ? studentDataLines.join('\n') : 'No active student telemetry.'}

Provide your complete AI Classroom Debrief as a single valid JSON object with the following keys:
{
  "classHealthScore": <number 0-100>,
  "summary": "<2-3 sentence overview of class performance>",
  "keyTakeaway": "<1 impactful sentence summarizing the most important pedagogical insight>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "priorityAreas": [
    {
      "area": "<e.g., Top Row Reaches (P, O)>",
      "reason": "<observed evidence from student telemetry>",
      "affectedStudents": <count of students experiencing this>
    }
  ],
  "studentGroups": [
    {
      "group": "<Velocity Masters | Precision Anchors | Developing Typists | Needs Support>",
      "description": "<brief description of this cohort>",
      "count": <number of students in this group>
    }
  ],
  "recommendedNextStep": "<specific, actionable instructional exercise for the teacher to run next>",
  "recommendedFocusKeys": ["<key1>", "<key2>"]
}`;

  return { systemInstruction, userPrompt, totalStudents };
}

/**
 * Handle POST /api/classroom/debrief
 * Invokes Google Gemini with model failover and returns strict JSON debrief
 */
export async function handleClassroomDebrief(
  request: ClassroomDebriefRequest,
  apiKey?: string
): Promise<ClassroomDebriefResponse> {
  const resolvedApiKey = resolveGeminiApiKey(apiKey);

  if (!request || !request.session) {
    throw new Error('INVALID_REQUEST_BODY');
  }

  const { systemInstruction, userPrompt, totalStudents } = buildClassroomDebriefPrompt(request);
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
      const sanitized = validateAndSanitizeDebrief(parsed, totalStudents);

      return sanitized;
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Classroom Debrief] Attempt with ${modelName} failed (${errMsg}), trying next candidate...`);
    }
  }

  throw lastError || new Error('FAILED_ALL_MODELS');
}
