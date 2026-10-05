/**
 * Classroom Real-Time In-Memory Types & WebSocket Protocols
 * Phase 1: Pure in-memory state with zero persistent database.
 */

export type ClassroomStatus = 'WAITING' | 'STARTING' | 'ACTIVE' | 'FINISHED' | 'ENDED';

export type StudentStatus = 'NOT_READY' | 'READY' | 'TYPING' | 'FINISHED' | 'DISCONNECTED';

export type ClassroomActivityType = 'practice' | 'lesson' | 'game';
export type ClassroomSessionType = 'passage' | 'curriculum' | 'game';

export interface ClassroomSettings {
  activityType: ClassroomActivityType;
  session_type?: ClassroomSessionType;
  lesson_id?: number | string;
  activeAssignmentId?: string;
  passageId: string;
  passageTitle: string;
  targetText: string;
  durationSeconds: number; // e.g. 60, 180, 300
  minStudents: number;
  maxStudents: number;
  lessonId?: string;
  gameId?: 'lilypad-leap' | 'neon-velocity';
  assignmentCategory?: string;
  targetKeys?: string[];
  assignmentId?: string;
  assignedAt?: number;
  teacherNote?: string;
  previousAssignments?: Array<{
    assignmentId: string;
    lessonId: number | string;
    title: string;
    assignedAt: number;
  }>;
  assignments?: ClassroomAssignment[];
}

export interface ClassroomAssignment {
  assignmentId: string;
  lessonId: number;
  title: string;
  chapterTitle?: string;
  chapterId?: string;
  description?: string;
  order: number;
  assignedAt: number;
  targetKeys?: string[];
  passingAccuracy?: number;
  targetText?: string;
  durationSeconds?: number;
}

export interface ClassroomStudent {
  id: string;
  sessionToken: string;
  name: string;
  avatarEmoji: string;
  isReady: boolean;
  status: StudentStatus;
  progress: number; // 0 to 1
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  finishedAt?: number;
  rank?: number;
  disconnectedAt?: number;
  currentAssignmentIndex?: number;
  completedLessonIds?: number[];
  weakKeys?: string[];
  topErrors?: string[];
  assignmentProgress?: Record<string, {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number;
    wpm: number;
    accuracy: number;
    completedAt?: number;
  }>;
}

export interface StudentProgressUpdate {
  progress: number;
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  lessonId?: number;
  assignmentId?: string;
}

export interface StudentFinishPayload {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  timeSpentSec: number;
  lessonId?: number;
  assignmentId?: string;
  isCompleted?: boolean;
  weakKeys?: string[];
  topErrors?: string[];
}

export interface ClassroomResultItem {
  playerId: string;
  name: string;
  avatarEmoji: string;
  rank: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  timeSpentSec: number;
  weakKeys?: string[];
  topErrors?: string[];
}

export interface ClassroomResultsView {
  results: ClassroomResultItem[];
  classAverageWpm: number;
  classAverageAccuracy: number;
  totalStudents: number;
  completedCount: number;
  durationSeconds: number;
  passageTitle: string;
}

export interface ClassroomRoom {
  code: string; // 6-character room code (e.g. A7K9P2)
  roomId: string;
  teacherToken: string;
  teacherId: string;
  teacherName: string;
  status: ClassroomStatus;
  settings: ClassroomSettings;
  students: Record<string, ClassroomStudent>;
  countdownStartAt: number | null;
  sessionStartAt: number | null;
  sessionEndAt: number | null;
  createdAt: number;
  lastActivityAt: number;
  teacherDisconnectedAt?: number;
  results: ClassroomResultItem[];
}

/** Sanitized room view sent to clients (hides teacherToken) */
export interface ClassroomRoomView {
  code: string;
  teacherName: string;
  isTeacherConnected: boolean;
  status: ClassroomStatus;
  settings: ClassroomSettings;
  students: ClassroomStudentView[];
  studentCount: number;
  readyCount: number;
  countdownStartAt: number | null;
  sessionStartAt: number | null;
  sessionEndAt: number | null;
  createdAt: number;
}

export interface ClassroomStudentView {
  id: string;
  name: string;
  avatarEmoji: string;
  isReady: boolean;
  status: StudentStatus;
  progress: number;
  wpm: number;
  accuracy: number;
  rank?: number;
  finishedAt?: number;
  currentAssignmentIndex?: number;
  completedLessonIds?: number[];
  weakKeys?: string[];
  topErrors?: string[];
  assignmentProgress?: Record<string, {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number;
    wpm: number;
    accuracy: number;
    completedAt?: number;
  }>;
}

// ─── WebSocket Client Messages (Client -> Server) ───
export type ClientMessage =
  | { type: 'CREATE_CLASSROOM'; payload: { teacherName?: string; initialAssignments?: ClassroomAssignment[]; initialSettings?: Partial<ClassroomSettings> } }
  | { type: 'JOIN_CLASSROOM'; payload: { code: string; studentName: string; avatarEmoji?: string; sessionToken?: string } }
  | { type: 'STUDENT_READY'; payload: { isReady: boolean } }
  | { type: 'UPDATE_SETTINGS'; payload: { teacherToken: string; settings: Partial<ClassroomSettings> } }
  | { type: 'START_SESSION'; payload: { teacherToken: string } }
  | { type: 'STUDENT_PROGRESS'; payload: StudentProgressUpdate & { lessonId?: number; assignmentId?: string } }
  | { type: 'STUDENT_FINISH'; payload: StudentFinishPayload & { lessonId?: number; assignmentId?: string } }
  | { type: 'END_CLASSROOM'; payload: { teacherToken: string } }
  | { type: 'RECONNECT'; payload: { sessionToken: string; code: string; role: 'teacher' | 'student' } }
  | { type: 'LEAVE_CLASSROOM'; payload?: Record<string, never> }
  | { type: 'PING'; payload?: { timestamp?: number } };

// ─── WebSocket Server Messages (Server -> Client) ───
export type ServerMessage =
  | { type: 'CONNECTED'; payload: { sessionToken: string } }
  | { type: 'CLASSROOM_CREATED'; payload: { code: string; teacherToken: string; room: ClassroomRoomView } }
  | { type: 'CLASSROOM_JOINED'; payload: { studentId: string; sessionToken: string; room: ClassroomRoomView } }
  | { type: 'ROOM_UPDATED'; payload: { room: ClassroomRoomView } }
  | { type: 'STUDENT_LIST_UPDATED'; payload: { students: ClassroomStudentView[]; studentCount: number; readyCount: number } }
  | { type: 'SESSION_START_SCHEDULED'; payload: { countdownStartAt: number; sessionStartAt: number; sessionEndAt: number; settings: ClassroomSettings } }
  | { type: 'SESSION_STARTED'; payload: { sessionStartAt: number; sessionEndAt: number } }
  | { type: 'STUDENT_PROGRESS_BROADCAST'; payload: { studentId: string; progress: number; wpm: number; accuracy: number; finished: boolean } }
  | { type: 'STUDENT_FINISHED_BROADCAST'; payload: { studentId: string; studentName: string; rank: number; wpm: number; accuracy: number; weakKeys?: string[]; topErrors?: string[] } }
  | { type: 'SESSION_FINISHED'; payload: { results: ClassroomResultsView } }
  | { type: 'CLASSROOM_ENDED'; payload: { reason: string } }
  | { type: 'RECONNECT_SUCCESS'; payload: { role: 'teacher' | 'student'; studentId?: string; room: ClassroomRoomView } }
  | { type: 'ERROR'; payload: { code: string; message: string } }
  | { type: 'PONG'; payload?: { timestamp?: number } };

// ─── AI Classroom Debrief Types ───
export interface ClassroomDebriefStudentInput {
  name?: string;
  wpm: number;
  accuracy: number;
  completed?: boolean;
  timeSpentSec?: number;
  weakKeys?: string[];
  topErrors?: string[];
}

export interface ClassroomDebriefRequest {
  session: {
    passageTitle?: string;
    lessonTitle?: string;
    targetWPM?: number;
    durationSeconds?: number;
    studentCount?: number;
    classAverageWpm?: number;
    classAverageAccuracy?: number;
  };
  students: ClassroomDebriefStudentInput[];
}

export interface ClassroomPriorityArea {
  area: string;
  reason: string;
  affectedStudents: number;
}

export interface ClassroomStudentGroup {
  group: 'Velocity Masters' | 'Precision Anchors' | 'Developing Typists' | 'Needs Support' | string;
  description: string;
  count: number;
}

export interface ClassroomDebriefResponse {
  classHealthScore: number;
  summary: string;
  keyTakeaway: string;
  strengths: string[];
  priorityAreas: ClassroomPriorityArea[];
  studentGroups: ClassroomStudentGroup[];
  recommendedNextStep: string;
  recommendedFocusKeys: string[];
}

// ─── Adaptive Drill Synthesizer Types ───
export interface AdaptiveDrillStudentInput {
  name?: string;
  wpm?: number;
  accuracy?: number;
  completed?: boolean;
  timeSpentSec?: number;
  weakKeys?: string[];
  topErrors?: string[];
}

export interface AdaptiveDrillSessionContext {
  passageTitle?: string;
  lessonTitle?: string;
  targetWPM?: number;
  durationSeconds?: number;
  classAverageWpm?: number;
  classAverageAccuracy?: number;
  studentCount?: number;
}

export interface AdaptiveDrillRequest {
  session?: AdaptiveDrillSessionContext;
  students?: AdaptiveDrillStudentInput[];
  focusKeys?: string[];
  durationSeconds?: number;
  targetWPM?: number;
  preferredLayer?: 'keys' | 'words' | 'sentences' | 'hybrid';
}

export interface AdaptiveDrillResponse {
  title: string;
  instructions: string;
  text: string;
  focusKeys: string[];
  durationSeconds: number;
  targetWPM: number;
  reason: string;
  difficulty: 'foundational' | 'targeted' | 'advanced' | string;
  layer?: 'keys' | 'words' | 'sentences' | 'hybrid' | string;
}

// ─── Student AI Micro-Coach Types ───
export interface ClassroomStudentCoachStudentInput {
  wpm: number;
  accuracy: number;
  completed?: boolean;
  weakKeys?: string[];
  topErrors?: string[];
  timeSpentSec?: number;
}

export interface ClassroomStudentCoachSessionInput {
  lessonTitle?: string;
  passageTitle?: string;
  targetWPM?: number;
  durationSeconds?: number;
  classAverageWpm?: number;
  classAverageAccuracy?: number;
}

export interface ClassroomStudentCoachRequest {
  student: ClassroomStudentCoachStudentInput;
  session?: ClassroomStudentCoachSessionInput;
}

export interface ClassroomStudentCoachResponse {
  headline: string;
  message: string;
  strength: string;
  focusKeys: string[];
  nextAction: string;
  encouragement: string;
}


