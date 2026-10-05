import type {
  ClassroomDebriefRequest,
  ClassroomDebriefResponse,
  AdaptiveDrillRequest,
  AdaptiveDrillResponse,
  ClassroomStudentCoachRequest,
  ClassroomStudentCoachResponse,
  ClassroomResultsView,
  ClassroomRoomView,
} from '../types/classroom';

/**
 * Builds a sanitized ClassroomDebriefRequest from classroom session results.
 * Only sends performance metrics, completion status, and aggregated weak keys/errors.
 * Never includes tokens, room credentials, IP addresses, or keystroke timestamps.
 */
export function buildClassroomDebriefRequest(
  results: ClassroomResultsView,
  room?: ClassroomRoomView
): ClassroomDebriefRequest {
  return {
    session: {
      passageTitle: results.passageTitle || room?.settings.passageTitle || 'Classroom Exercise',
      lessonTitle: results.passageTitle || room?.settings.passageTitle || 'Classroom Exercise',
      targetWPM: 30,
      durationSeconds: results.durationSeconds || room?.settings.durationSeconds || 60,
      studentCount: results.totalStudents,
      classAverageWpm: results.classAverageWpm,
      classAverageAccuracy: results.classAverageAccuracy,
    },
    students: results.results.map((r) => ({
      name: r.name,
      wpm: r.wpm,
      accuracy: r.accuracy,
      completed: r.finished,
      timeSpentSec: r.timeSpentSec,
      weakKeys: r.weakKeys,
      topErrors: r.topErrors,
    })),
  };
}

/**
 * Sends debrief request to backend API (POST /api/classroom/debrief)
 * Backend securely handles Google Gemini analysis and student name anonymization.
 */
export async function generateClassroomDebrief(
  payload: ClassroomDebriefRequest
): Promise<ClassroomDebriefResponse> {
  const response = await fetch('/api/classroom/debrief', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errJson.error || '';
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  const debrief: ClassroomDebriefResponse = await response.json();
  return debrief;
}

/**
 * Builds a sanitized AdaptiveDrillRequest from classroom session results and debrief focus keys.
 */
export function buildAdaptiveDrillRequest(
  results: ClassroomResultsView,
  focusKeys?: string[],
  room?: ClassroomRoomView
): AdaptiveDrillRequest {
  return {
    session: {
      passageTitle: results.passageTitle || room?.settings.passageTitle || 'Classroom Exercise',
      lessonTitle: results.passageTitle || room?.settings.passageTitle || 'Classroom Exercise',
      targetWPM: 30,
      durationSeconds: results.durationSeconds || room?.settings.durationSeconds || 60,
      studentCount: results.totalStudents,
      classAverageWpm: results.classAverageWpm,
      classAverageAccuracy: results.classAverageAccuracy,
    },
    students: results.results.map((r) => ({
      name: r.name,
      wpm: r.wpm,
      accuracy: r.accuracy,
      completed: r.finished,
      timeSpentSec: r.timeSpentSec,
      weakKeys: r.weakKeys,
      topErrors: r.topErrors,
    })),
    focusKeys,
    durationSeconds: results.durationSeconds || room?.settings.durationSeconds || 60,
  };
}

/**
 * Sends request to backend API (POST /api/classroom/adaptive-drill)
 * Synthesizes a targeted typing drill using Google Gemini.
 */
export async function generateAdaptiveDrill(
  payload: AdaptiveDrillRequest
): Promise<AdaptiveDrillResponse> {
  const response = await fetch('/api/classroom/adaptive-drill', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errJson.error || '';
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage || `Adaptive drill generation failed with status ${response.status}`);
  }

  const drill: AdaptiveDrillResponse = await response.json();
  return drill;
}

/**
 * Sends request to backend API (POST /api/classroom/student-coach)
 * Fetches personalized micro-coaching advice for an individual student.
 */
export async function fetchStudentCoachFeedback(
  payload: ClassroomStudentCoachRequest
): Promise<ClassroomStudentCoachResponse> {
  const response = await fetch('/api/classroom/student-coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errJson = await response.json();
      errorMessage = errJson.message || errJson.error || '';
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage || `Student coach request failed with status ${response.status}`);
  }

  const coach: ClassroomStudentCoachResponse = await response.json();
  return coach;
}


