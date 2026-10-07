import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Check,
  FileText,
  Lock,
} from 'lucide-react';

interface SessionDurationTimerProps {
  initialSeconds?: number;
  initialStartedAt?: string;
  initialEndedAt?: string;
  isSigned?: boolean;
  timerKey?: string;
  clientId: string;
  clientName: string;
  onUpdate: (data: {
    durationSeconds: number;
    durationMinutes: number;
    startedAt: string;
    endedAt: string;
  }) => void;
  onInsertStamp: (stampText: string) => void;
}

export const SessionDurationTimer: React.FC<SessionDurationTimerProps> = ({
  initialSeconds = 0,
  initialStartedAt = '',
  initialEndedAt = '',
  isSigned = false,
  timerKey,
  clientId,
  clientName,
  onUpdate,
  onInsertStamp,
}) => {
  // Storage key for active session recovery
  const storageKey = `mindledger_timer_${clientId}_${timerKey || 'default'}`;

  // Read cached session if available and not signed
  const getCachedState = () => {
    if (isSigned) return null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return null;
  };

  const cached = getCachedState();

  const [seconds, setSeconds] = useState<number>(() => {
    if (isSigned) return initialSeconds || 3000; // default 50 min if 0 for signed
    if (cached?.seconds !== undefined) return cached.seconds;
    return initialSeconds;
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    if (isSigned) return false;
    return Boolean(cached?.isRunning);
  });

  const [startedAt, setStartedAt] = useState<string>(() => {
    if (cached?.startedAt) return cached.startedAt;
    return initialStartedAt || '';
  });

  const [endedAt, setEndedAt] = useState<string>(() => {
    if (cached?.endedAt) return cached.endedAt;
    return initialEndedAt || '';
  });

  // Standard session target in minutes (e.g., 50 min standard clinical hour)
  const [targetMinutes, setTargetMinutes] = useState<number>(50);

  // Manual duration modal
  const [showManualEdit, setShowManualEdit] = useState<boolean>(false);
  const [manualMinutesInput, setManualMinutesInput] = useState<string>(
    String(Math.round((seconds || 0) / 60))
  );

  // Stamp inserted confirmation badge
  const [stampInserted, setStampInserted] = useState<boolean>(false);

  // Reference for accurate timestamp-based interval tracking
  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(seconds);

  // Update parent whenever duration changes happen
  useEffect(() => {
    const durationMinutes = Math.round(seconds / 60);
    onUpdate({
      durationSeconds: seconds,
      durationMinutes,
      startedAt,
      endedAt,
    });

    if (!isSigned) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            seconds,
            isRunning,
            startedAt,
            endedAt,
            lastSavedAt: Date.now(),
          })
        );
      } catch {
        // silent
      }
    }
  }, [seconds, isRunning, startedAt, endedAt, isSigned]);

  // Interval timer engine with drift correction
  useEffect(() => {
    if (!isRunning || isSigned) return;

    startTimeRef.current = Date.now();
    accumulatedSecondsRef.current = seconds;

    const interval = setInterval(() => {
      if (startTimeRef.current !== null) {
        const deltaSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setSeconds(accumulatedSecondsRef.current + deltaSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isSigned]);

  // Handle Start / Resume
  const handleTogglePlay = () => {
    if (isSigned) return;

    if (!isRunning) {
      // Starting or Resuming
      const nowFormatted = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      if (!startedAt) {
        setStartedAt(nowFormatted);
      }
      startTimeRef.current = Date.now();
      accumulatedSecondsRef.current = seconds;
      setIsRunning(true);
    } else {
      // Pausing
      const nowFormatted = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setEndedAt(nowFormatted);
      setIsRunning(false);
      startTimeRef.current = null;
    }
  };

  // Handle Stop / Finish
  const handleStopSession = () => {
    if (isSigned) return;
    setIsRunning(false);
    startTimeRef.current = null;
    const nowFormatted = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    setEndedAt(nowFormatted);
  };

  // Handle Reset
  const handleReset = () => {
    if (isSigned) return;
    setIsRunning(false);
    startTimeRef.current = null;
    accumulatedSecondsRef.current = 0;
    setSeconds(0);
    setStartedAt('');
    setEndedAt('');
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // silent
    }
  };

  // Quick preset adjustment
  const handlePreset = (minutes: number) => {
    if (isSigned) return;
    const newSec = minutes * 60;
    setSeconds(newSec);
    accumulatedSecondsRef.current = newSec;
    if (!startedAt) {
      setStartedAt(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
    }
  };

  // Nudge +/- 5 mins
  const handleNudge = (deltaMinutes: number) => {
    if (isSigned) return;
    const newSec = Math.max(0, seconds + deltaMinutes * 60);
    setSeconds(newSec);
    accumulatedSecondsRef.current = newSec;
  };

  // Apply manual edit
  const handleApplyManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualMinutesInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const newSec = parsed * 60;
      setSeconds(newSec);
      accumulatedSecondsRef.current = newSec;
      setShowManualEdit(false);
    }
  };

  // Format digital stopwatch display
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Format duration in minutes description
  const elapsedMinutes = Math.round(seconds / 60);
  const targetSeconds = targetMinutes * 60;
  const progressPct = Math.min(100, Math.round((seconds / targetSeconds) * 100));
  const isOvertime = seconds > targetSeconds;
  const overtimeMinutes = isOvertime ? Math.round((seconds - targetSeconds) / 60) : 0;

  // Insert clinical stamp into note
  const handleInsertStamp = () => {
    const timeRange = startedAt ? ` (${startedAt}${endedAt ? ` – ${endedAt}` : ' – in progress'})` : '';
    const overtimeText = isOvertime ? `, +${overtimeMinutes} min overtime` : '';
    const stampText = `\n[Session duration: ${elapsedMinutes} min (target ${targetMinutes} min${overtimeText})${timeRange}]`;
    onInsertStamp(stampText);
    setStampInserted(true);
    setTimeout(() => setStampInserted(false), 3000);
  };

  return (
    <div
      id="session-duration-timer-card"
      className="p-4 sm:p-5 rounded-2xl bg-[#f4f3fe]/50 border border-[#d4d0fb] shadow-xs space-y-4"
    >
      {/* Top row: Header, Status Pill, and Target selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5749e2] text-white flex items-center justify-center shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5749e2]">
                Session Duration Tracker
              </h3>
              {isSigned ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  Audit Locked
                </span>
              ) : isRunning ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf0f6] text-[#fd2a83] border border-[#f9b8d6] flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fd2a83]" />
                  Recording Active
                </span>
              ) : seconds > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Paused / Finished
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Track real-time clinical contact minutes to ensure accurate psychotherapy documentation & DPDP compliance records.
            </p>
          </div>
        </div>

        {/* Target duration selector */}
        {!isSigned && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/80 border border-slate-200 p-1 rounded-xl text-xs">
            <span className="text-[11px] font-medium text-slate-500 px-1">Target:</span>
            {[30, 45, 50, 60].map((m) => (
              <button
                key={m}
                id={`target-preset-${m}`}
                onClick={() => setTargetMinutes(m)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                  targetMinutes === m
                    ? 'bg-[#5749e2] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center Display: Stopwatch Readout & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
        {/* Stopwatch Main Numbers */}
        <div className="md:col-span-4 bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col items-center justify-center text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Clinical Elapsed Time
          </span>
          <div
            id="session-stopwatch-display"
            className={`font-mono text-3xl font-extrabold tracking-tight my-0.5 ${
              isOvertime
                ? 'text-[#fd2a83]'
                : isRunning
                ? 'text-[#5749e2]'
                : 'text-slate-800'
            }`}
          >
            {formatTime(seconds)}
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span>{elapsedMinutes} mins recorded</span>
            {isOvertime && (
              <span className="text-[10px] font-bold text-[#fd2a83] bg-[#fdf0f6] px-1.5 py-0.2 rounded border border-[#f9b8d6]">
                +{overtimeMinutes}m overtime
              </span>
            )}
          </div>
        </div>

        {/* Timer Controls & Quick presets */}
        <div className="md:col-span-5 space-y-2">
          {!isSigned ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  id="btn-toggle-timer"
                  onClick={handleTogglePlay}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-[#5749e2] hover:bg-[#4738cf] text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{seconds > 0 ? 'Resume Timer' : 'Start Session Timer'}</span>
                    </>
                  )}
                </button>

                {isRunning && (
                  <button
                    id="btn-finish-timer"
                    onClick={handleStopSession}
                    title="Conclude Session"
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                  >
                    Finish
                  </button>
                )}

                <button
                  id="btn-reset-timer"
                  onClick={handleReset}
                  title="Reset Timer"
                  disabled={seconds === 0 && !startedAt && !endedAt && !isRunning}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Presets & Fine-tuning */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
                {[30, 45, 50, 60].map((mins) => (
                  <button
                    key={mins}
                    id={`preset-${mins}`}
                    onClick={() => handlePreset(mins)}
                    className="px-2 py-1 bg-white hover:bg-[#e8e6fd] hover:text-[#5749e2] border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
                  >
                    {mins}m
                  </button>
                ))}

                <button
                  id="btn-nudge-minus5"
                  onClick={() => handleNudge(-5)}
                  disabled={seconds < 300}
                  className="px-1.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 disabled:opacity-40 transition-colors"
                  title="Subtract 5 minutes"
                >
                  -5m
                </button>
                <button
                  id="btn-nudge-plus5"
                  onClick={() => handleNudge(5)}
                  className="px-1.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 transition-colors"
                  title="Add 5 minutes"
                >
                  +5m
                </button>

                <button
                  id="btn-manual-time-edit"
                  onClick={() => {
                    setManualMinutesInput(String(elapsedMinutes));
                    setShowManualEdit(!showManualEdit);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-[#5749e2] hover:underline"
                >
                  Custom
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Session Duration Finalized & Locked</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Recorded contact time: <strong>{elapsedMinutes} minutes</strong>
                {startedAt && ` (${startedAt} – ${endedAt || 'End'})`}.
              </p>
            </div>
          )}
        </div>

        {/* Clinical Documentation & Note Stamping Panel */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Clinical Note Timing
            </span>
            <span className="text-[10px] font-bold text-[#5749e2] bg-[#f4f3fe] px-1.5 py-0.5 rounded border border-[#d4d0fb]">
              DPDP Record
            </span>
          </div>

          <div className="text-[11px] text-slate-600 leading-snug">
            {elapsedMinutes > 0 ? (
              <span>
                Actual length: <strong>{elapsedMinutes} min</strong>
                {isOvertime && (
                  <span className="text-[#fd2a83] font-semibold"> (+{overtimeMinutes}m overtime)</span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 italic">No time recorded yet</span>
            )}
          </div>

          {/* Action: Insert Timing into Note */}
          <div className="pt-0.5">
            <button
              id="btn-insert-note-stamp"
              onClick={handleInsertStamp}
              disabled={seconds < 10 && !isSigned}
              className="w-full py-2 px-3 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              {stampInserted ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Stamped into Note!</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Insert Timing into Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Time Input Popover */}
      {showManualEdit && !isSigned && (
        <form
          onSubmit={handleApplyManualEdit}
          className="p-3 bg-white rounded-xl border border-purple-200 shadow-sm flex flex-wrap items-center gap-3 animate-fade-in text-xs"
        >
          <span className="font-bold text-slate-700">Set Exact Session Minutes:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="1"
              max="300"
              value={manualMinutesInput}
              onChange={(e) => setManualMinutesInput(e.target.value)}
              className="w-20 px-2 py-1 rounded-lg border border-slate-300 font-bold text-center focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
            />
            <span className="text-slate-500 font-medium">mins</span>
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-[#5749e2] text-white font-semibold rounded-lg hover:bg-[#4738cf] transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowManualEdit(false)}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Progress towards Target Bar & Session Timing Detail */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Target: <strong>{targetMinutes} min clinical hour</strong>
            </span>
            {startedAt && (
              <span className="text-slate-400">
                &bull; Started at: <strong>{startedAt}</strong>
                {endedAt && ` &bull; Concluded: ${endedAt}`}
              </span>
            )}
          </div>
          <span className="font-semibold text-slate-700">
            {progressPct}% completed
          </span>
        </div>

        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOvertime
                ? 'bg-gradient-to-r from-[#5749e2] to-[#fd2a83]'
                : 'bg-[#5749e2]'
            }`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
