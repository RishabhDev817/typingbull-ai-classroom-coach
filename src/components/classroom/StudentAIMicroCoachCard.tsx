import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';
import type {
  ClassroomResultItem,
  ClassroomResultsView,
  ClassroomStudentCoachResponse,
  ClassroomStudentCoachRequest,
} from '../../types/classroom';
import { fetchStudentCoachFeedback } from '../../utils/classroomDebriefApi';

interface Props {
  studentResult?: ClassroomResultItem;
  results: ClassroomResultsView;
}

export const StudentAIMicroCoachCard: React.FC<Props> = ({ studentResult, results }) => {
  const [coach, setCoach] = useState<ClassroomStudentCoachResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fetchedFingerprintRef = useRef<string | null>(null);

  const fetchFeedback = React.useCallback(async () => {
    if (!studentResult) return;

    setStatus('loading');

    const requestPayload: ClassroomStudentCoachRequest = {
      student: {
        wpm: studentResult.wpm,
        accuracy: studentResult.accuracy,
        completed: studentResult.finished,
        weakKeys: studentResult.weakKeys || [],
        topErrors: studentResult.topErrors || [],
        timeSpentSec: studentResult.timeSpentSec,
      },
      session: {
        passageTitle: results.passageTitle || 'Classroom Exercise',
        lessonTitle: results.passageTitle || 'Classroom Exercise',
        targetWPM: 30,
        durationSeconds: results.durationSeconds || 60,
        classAverageWpm: results.classAverageWpm,
        classAverageAccuracy: results.classAverageAccuracy,
      },
    };

    try {
      const data = await fetchStudentCoachFeedback(requestPayload);
      setCoach(data);
      setStatus('success');
    } catch (err: unknown) {
      console.warn('[Student AI Coach] Network error, fallback generated:', err);
      // Even if network fails, provide positive fallback guidance
      setCoach({
        headline: studentResult.accuracy >= 90 ? 'Rock-Solid Accuracy!' : 'Great Effort!',
        message:
          studentResult.accuracy >= 90
            ? 'Your accuracy is strong. Focus on maintaining this steady rhythm as you build pace.'
            : 'Keep your fingers relaxed on the home row anchors (F and J). Speed grows naturally with practice.',
        strength: studentResult.accuracy >= 90 ? 'Keystroke Precision' : 'Active Practice',
        focusKeys: (studentResult.topErrors || studentResult.weakKeys || []).slice(0, 3),
        nextAction: 'Keep your eyes on the screen and tap each letter deliberately.',
        encouragement: 'Every practice round builds muscle memory — you are making real progress!',
      });
      setStatus('success');
    }
  }, [studentResult, results]);

  useEffect(() => {
    if (!studentResult) return;

    const fingerprint = `${studentResult.playerId}-${studentResult.wpm}-${studentResult.accuracy}-${results.passageTitle}`;
    if (fetchedFingerprintRef.current === fingerprint) return;

    fetchedFingerprintRef.current = fingerprint;
    fetchFeedback();
  }, [studentResult, results.passageTitle, fetchFeedback]);

  if (!studentResult) return null;

  return (
    <section
      aria-label="Personalized AI Coach"
      className="w-full rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-blue-50/70 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800/80 p-4 sm:p-5 shadow-sm space-y-3"
    >
      {/* ─── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
              Your AI Coach
            </span>
            <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">
              Personalized for this round
            </span>
          </div>
        </div>

        {status === 'success' && (
          <button
            type="button"
            id="refresh-student-ai-coach-btn"
            onClick={fetchFeedback}
            aria-label="Refresh coach feedback"
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 transition cursor-pointer"
            title="Refresh feedback"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ─── Loading State ──────────────────────────────────── */}
      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/60 flex items-center gap-3 text-left"
        >
          <Brain className="w-5 h-5 text-purple-500 animate-pulse shrink-0" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              AI Coach is preparing your feedback...
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Evaluating your keystroke precision and rhythm.
            </p>
          </div>
        </div>
      )}

      {/* ─── Success Feedback Card ─────────────────────────── */}
      {status === 'success' && coach && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Headline & Core Message */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-purple-950 dark:text-purple-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{coach.headline}</span>
              </h4>
              {coach.strength && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 text-[10px] font-bold">
                  {coach.strength}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {coach.message}
            </p>
          </div>

          {/* Focus Keys (Only rendered when keys exist) */}
          {coach.focusKeys && coach.focusKeys.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your focus keys:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {coach.focusKeys.map((key, idx) => (
                  <kbd
                    key={idx}
                    className="min-w-6 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-black text-xs border border-purple-300 dark:border-purple-700 shadow-2xs text-center uppercase"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Next Step */}
          {coach.nextAction && (
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/80 border border-purple-200/80 dark:border-purple-900/60 flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-snug">
                <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
                  Next Step:
                </strong>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {coach.nextAction}
                </span>
              </div>
            </div>
          )}

          {/* Uplifting Encouragement */}
          {coach.encouragement && (
            <p className="text-[11px] text-purple-800 dark:text-purple-300 italic font-semibold pt-0.5">
              &ldquo;{coach.encouragement}&rdquo;
            </p>
          )}
        </motion.div>
      )}
    </section>
  );
};
