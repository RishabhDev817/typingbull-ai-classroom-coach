import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Users,
  Target,
  TrendingUp,
  Brain,
  ArrowRight,
  FileText,
  Rocket,
  Clock,
  Zap,
} from 'lucide-react';
import type {
  ClassroomResultsView,
  ClassroomRoomView,
  ClassroomDebriefResponse,
  AdaptiveDrillResponse,
} from '../../types/classroom';
import {
  buildClassroomDebriefRequest,
  generateClassroomDebrief,
  buildAdaptiveDrillRequest,
  generateAdaptiveDrill,
} from '../../utils/classroomDebriefApi';

interface Props {
  results: ClassroomResultsView;
  room?: ClassroomRoomView;
  onLaunchAdaptiveDrill?: (drill: AdaptiveDrillResponse) => void;
}

export const AIClassroomDebriefCard: React.FC<Props> = ({
  results,
  room,
  onLaunchAdaptiveDrill,
}) => {
  // Debrief states
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [debrief, setDebrief] = useState<ClassroomDebriefResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Adaptive Drill states
  const [drillStatus, setDrillStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adaptiveDrill, setAdaptiveDrill] = useState<AdaptiveDrillResponse | null>(null);
  const [drillErrorMessage, setDrillErrorMessage] = useState<string | null>(null);
  const [drillLaunched, setDrillLaunched] = useState<boolean>(false);

  const handleGenerateDebrief = async () => {
    setStatus('loading');
    setErrorMessage(null);

    const payload = buildClassroomDebriefRequest(results, room);

    try {
      const data = await generateClassroomDebrief(payload);
      setDebrief(data);
      setStatus('success');
    } catch (err: unknown) {
      console.error('[AI Classroom Debrief Error]:', err);
      setErrorMessage(
        "AI analysis couldn't be generated right now. Your classroom results are still available."
      );
      setStatus('error');
    }
  };

  const handleGenerateAdaptiveDrill = async () => {
    setDrillStatus('loading');
    setDrillErrorMessage(null);
    setDrillLaunched(false);

    // Pass focus keys from debrief if available, otherwise backend derives from telemetry
    const focusKeys =
      debrief?.recommendedFocusKeys && debrief.recommendedFocusKeys.length > 0
        ? debrief.recommendedFocusKeys
        : undefined;

    const payload = buildAdaptiveDrillRequest(results, focusKeys, room);

    try {
      const drill = await generateAdaptiveDrill(payload);
      setAdaptiveDrill(drill);
      setDrillStatus('success');
    } catch (err: unknown) {
      console.error('[AI Adaptive Drill Error]:', err);
      setDrillErrorMessage(
        "Adaptive drill couldn't be synthesized right now. Your classroom results remain active."
      );
      setDrillStatus('error');
    }
  };

  const handleLaunchDrill = () => {
    if (!adaptiveDrill) return;
    setDrillLaunched(true);
    if (onLaunchAdaptiveDrill) {
      onLaunchAdaptiveDrill(adaptiveDrill);
    }
  };

  const getHealthScoreDetails = (score: number) => {
    if (score >= 85) {
      return {
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        scoreColor: 'text-emerald-600 dark:text-emerald-400',
        label: 'Strong',
        description: 'Class exhibits confident speed and rhythm',
      };
    }
    if (score >= 70) {
      return {
        badgeBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-800',
        scoreColor: 'text-blue-600 dark:text-blue-400',
        label: 'Good',
        description: 'Solid performance with minor precision variances',
      };
    }
    if (score >= 40) {
      return {
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        scoreColor: 'text-amber-600 dark:text-amber-400',
        label: 'Developing',
        description: 'Foundational drills needed before increasing pace',
      };
    }
    return {
      badgeBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800',
      scoreColor: 'text-rose-600 dark:text-rose-400',
      label: 'Needs Attention',
      description: 'Focus on anchor keys and deliberate pacing',
    };
  };

  return (
    <section aria-label="AI Classroom Debrief and Adaptive Drill" className="w-full space-y-4">
      {/* ─── CASE 1: IDLE INVITATION BANNER ────────────────────── */}
      {status === 'idle' && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-blue-500/15 border-2 border-purple-400/40 dark:border-purple-500/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>AI Classroom Coach</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Powered by Google Gemini
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              AI Classroom Debrief
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Transform raw student scores into pedagogical insights: uncover class-wide weak key reaches, group learners into velocity cohorts, and synthesize tailored practice drills for the next round.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              id="generate-ai-debrief-btn"
              onClick={handleGenerateDebrief}
              aria-label="Generate AI Classroom Debrief"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>✨ Generate AI Debrief</span>
            </button>

            <button
              type="button"
              id="idle-generate-adaptive-drill-btn"
              onClick={handleGenerateAdaptiveDrill}
              aria-label="Generate Adaptive Drill"
              className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 font-black text-xs sm:text-sm border border-purple-200 dark:border-purple-800 shadow-sm flex items-center justify-center gap-2 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Target className="w-4 h-4 text-purple-500" />
              <span>Generate Adaptive Drill</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── CASE 2: DEBRIEF LOADING STATE ──────────────────────── */}
      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900 shadow-xl flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Brain className="w-7 h-7 animate-pulse" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-500/40 animate-ping opacity-25" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Analyzing classroom performance...
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md font-medium">
              Evaluating class speed distribution, keystroke errors, weak key clusters, and instructional groupings...
            </p>
          </div>

          <div className="w-48 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      {/* ─── CASE 3: DEBRIEF ERROR STATE ────────────────────────── */}
      {status === 'error' && (
        <div
          role="alert"
          className="p-6 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                AI Debrief Generation Paused
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 font-medium">
                {errorMessage || "AI analysis couldn't be generated right now. Your classroom results are still available."}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="retry-ai-debrief-btn"
            onClick={handleGenerateDebrief}
            aria-label="Try Again"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ─── CASE 4: SUCCESS DEBRIEF VIEW ───────────────────────── */}
      {status === 'success' && debrief && (
        <motion.div
          id="ai-classroom-debrief-container"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/80 shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    AI Classroom Debrief
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[9px] font-black uppercase">
                    Google Gemini
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Pedagogical evaluation for session: {results.passageTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="regenerate-ai-debrief-btn"
                onClick={handleGenerateDebrief}
                aria-label="Regenerate AI debrief"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                title="Regenerate debrief"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Top Stat Row: Health Score + Key Takeaway */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Class Health Score */}
              {(() => {
                const healthMeta = getHealthScoreDetails(debrief.classHealthScore);
                return (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between text-center md:text-left">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Class Health Score
                      </span>
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className={`font-mono text-4xl font-black ${healthMeta.scoreColor}`}>
                          {debrief.classHealthScore}
                        </span>
                        <span className="text-sm font-bold text-slate-400">/ 100</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row items-center md:items-start gap-1.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${healthMeta.badgeBg}`}
                      >
                        {healthMeta.label}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden lg:inline-block">
                        {healthMeta.description}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Key Takeaway Card */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-900/80 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Key Takeaway</span>
                </span>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                  &ldquo;{debrief.keyTakeaway}&rdquo;
                </p>
              </div>
            </div>

            {/* Class Summary */}
            {debrief.summary && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Class Summary
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {debrief.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Strengths & Priority Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Strengths</span>
                </span>
                <ul className="space-y-1.5">
                  {debrief.strengths.map((strength, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 font-medium"
                    >
                      <span className="text-emerald-500 font-bold mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Areas */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span>Priority Areas</span>
                </span>
                {debrief.priorityAreas.length > 0 ? (
                  <div className="space-y-2">
                    {debrief.priorityAreas.map((pa, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <strong className="font-extrabold text-slate-900 dark:text-white block truncate">
                            {pa.area}
                          </strong>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight block mt-0.5">
                            {pa.reason}
                          </span>
                        </div>
                        {pa.affectedStudents > 0 && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                            {pa.affectedStudents} {pa.affectedStudents === 1 ? 'student' : 'students'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No critical error clusters detected across the active session.
                  </p>
                )}
              </div>
            </div>

            {/* Learner Groups */}
            {debrief.studentGroups.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Learner Groups (Current Session Distribution)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Session cohorts for targeted practice
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {debrief.studentGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {group.group}
                          </span>
                          <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {group.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {group.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Next Step & Focus Keys */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200 dark:border-indigo-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 block flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Recommended Next Step</span>
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {debrief.recommendedNextStep}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                {debrief.recommendedFocusKeys && debrief.recommendedFocusKeys.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Focus:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {debrief.recommendedFocusKeys.map((key, idx) => (
                        <kbd
                          key={idx}
                          className="min-w-6 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black text-xs border border-slate-300 dark:border-slate-600 shadow-xs text-center uppercase"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                )}

                {drillStatus === 'idle' && (
                  <button
                    type="button"
                    id="generate-adaptive-drill-btn"
                    onClick={handleGenerateAdaptiveDrill}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shrink-0"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Generate Adaptive Drill</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── ADAPTIVE DRILL LOADING STATE ──────────────────────── */}
      {drillStatus === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Creating a targeted drill...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Synthesizing customized practice text with Google Gemini based on observed weak keys...
              </p>
            </div>
          </div>

          <div className="w-36 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}

      {/* ─── ADAPTIVE DRILL ERROR STATE ────────────────────────── */}
      {drillStatus === 'error' && (
        <div
          role="alert"
          className="p-5 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 dark:text-rose-200">
                Adaptive Drill Synthesis Paused
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mt-0.5">
                {drillErrorMessage || "Adaptive drill couldn't be synthesized right now."}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="retry-adaptive-drill-btn"
            onClick={handleGenerateAdaptiveDrill}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* ─── PART 2: ADAPTIVE DRILL PREVIEW CARD ────────────────── */}
      {drillStatus === 'success' && adaptiveDrill && (
        <motion.div
          id="adaptive-drill-preview-container"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-300 dark:border-indigo-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    AI Adaptive Drill
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-black uppercase">
                    Synthesized for Class
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Targeted practice based on observed error clusters
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="regenerate-adaptive-drill-btn"
                onClick={handleGenerateAdaptiveDrill}
                aria-label="Regenerate Drill Variation"
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                title="Synthesize new variation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Title & Pedagogical Rationale */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Synthesized Title
                </span>
                <h5 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {adaptiveDrill.title}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl">
                  <strong className="text-slate-900 dark:text-white">Why this drill?</strong>{' '}
                  {adaptiveDrill.reason}
                </p>
              </div>

              {/* Focus Keys Keycaps */}
              {adaptiveDrill.focusKeys && adaptiveDrill.focusKeys.length > 0 && (
                <div className="shrink-0 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-start md:items-end gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Focus Keys
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {adaptiveDrill.focusKeys.map((k, idx) => (
                      <kbd
                        key={idx}
                        className="min-w-7 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-black text-sm border-2 border-indigo-400 dark:border-indigo-600 shadow-sm text-center uppercase"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drill Specs Metadata Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Difficulty
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  {adaptiveDrill.difficulty}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  <span>Duration</span>
                </span>
                <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                  {adaptiveDrill.durationSeconds} seconds
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Target Speed</span>
                </span>
                <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                  {adaptiveDrill.targetWPM} WPM
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Progression Layer
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white capitalize">
                  {adaptiveDrill.layer || 'Words'}
                </span>
              </div>
            </div>

            {/* Student Instructions */}
            {adaptiveDrill.instructions && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold leading-relaxed">
                  <strong>Student Guidance:</strong> {adaptiveDrill.instructions}
                </p>
              </div>
            )}

            {/* Drill Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Drill Preview (Exact typing passage)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {adaptiveDrill.text.split(' ').length} words • {adaptiveDrill.text.length} chars
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed border-2 border-slate-800 select-text overflow-x-auto shadow-inner">
                {adaptiveDrill.text}
              </div>
            </div>

            {/* Launch to Class Footer */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                Launching will set this adaptive drill as the active round for all connected students.
              </span>

              <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="launch-adaptive-drill-btn"
                  onClick={handleLaunchDrill}
                  disabled={drillLaunched}
                  className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    drillLaunched
                      ? 'bg-emerald-600 text-white cursor-default focus:ring-emerald-500'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30 focus:ring-emerald-500'
                  }`}
                >
                  {drillLaunched ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Drill Active in Lobby!</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>🚀 Launch to Class</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
};
