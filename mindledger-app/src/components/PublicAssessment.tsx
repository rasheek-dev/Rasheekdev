import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronRight, ChevronLeft, Sparkles, HeartHandshake, AlertCircle } from 'lucide-react';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';
import { AssessmentDefinition, AssessmentType } from '../types';
import { getPublicAssessment, submitPublicAssessment } from '../lib/api';

interface PublicAssessmentProps {
  token: string;
}

export const PublicAssessment: React.FC<PublicAssessmentProps> = ({ token }) => {
  const [definition, setDefinition] = useState<AssessmentDefinition>(ASSESSMENT_DEFINITIONS.PHQ9);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('PHQ9');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getPublicAssessment(token)
      .then((data) => {
        setDefinition(data.definition);
        setAssessmentType(data.type);
        setClientFirstName(data.clientName);
        setClinicName(data.clinicName);
      })
      .catch((err) =>
        setUnavailable(
          ['unavailable', 'expired'].includes(err.code)
            ? err.message
            : 'This questionnaire could not be opened. Please check your internet connection or ask your psychologist for a new link.'
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  const currentQuestion = definition.questions[currentIdx];
  const currentAnswer = responses[currentQuestion?.id];
  const totalQuestions = definition.questions.length;
  const progressPercent = Math.round(((currentIdx + 1) / totalQuestions) * 100);

  const handleSelectOption = (val: number) => {
    setResponses((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitPublicAssessment(token, responses);
      setIsCompleted(true);
    } catch (err) {
      setSubmitError((err as Error).message || 'Your answers could not be submitted. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#5749e2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading secure clinical questionnaire...</p>
        </div>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm max-w-md space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Questionnaire unavailable</h1>
          <p className="text-xs text-slate-600 leading-relaxed">{unavailable}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5749e2] flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{clinicName || 'Clinical Assessment'}</div>
              <div className="text-[10px] text-slate-400">Confidential questionnaire</div>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5749e2]" />
            <span>Confidential</span>
          </span>
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        {isCompleted ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Thank you{clientFirstName ? `, ${clientFirstName}` : ''}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              Your responses for the <strong>{definition.fullName}</strong> have been sent to your psychologist. They will review them with you at your next session. You can close this page now.
            </p>
            <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
              Under DPDP healthcare privacy regulations, these diagnostic responses are tied strictly to your clinical profile and are not shared with third parties.
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Title & Progress */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5749e2]">
                  {definition.fullName} ({definition.title})
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">{definition.description}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900">
                  Question {currentIdx + 1} of {totalQuestions}
                </span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#5749e2] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Question text */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {currentQuestion.id}. {currentQuestion.question}
              </h2>
            </div>

            {/* Options list */}
            <div className="space-y-3">
              {definition.options.map((opt) => {
                const isSelected = currentAnswer === opt.value;
                return (
                  <label
                    key={opt.value}
                    onClick={() => handleSelectOption(opt.value)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#5749e2] bg-[#f4f3fe]/50 shadow-sm ring-1 ring-[#5749e2]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-[#281e80] font-bold' : 'text-slate-700'}`}>
                      {opt.label}
                    </span>
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectOption(opt.value)}
                      className="w-4 h-4 text-[#5749e2] focus:ring-[#5749e2]"
                    />
                  </label>
                );
              })}
            </div>

            {submitError && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">{submitError}</div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 text-xs font-medium flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentAnswer === undefined || isSubmitting}
                className="px-6 py-2.5 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>
                  {currentIdx === totalQuestions - 1 ? (isSubmitting ? 'Submitting...' : 'Complete & Submit') : 'Next Question'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span>{clinicName || 'MindLedger'} &bull; Clinical Assessment</span>
          <span>If you are in crisis, call Tele-MANAS: 14416</span>
        </div>
      </footer>
    </div>
  );
};
