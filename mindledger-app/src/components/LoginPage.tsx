import React, { useState } from 'react';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signIn } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      await signIn(email, password);
      onLoginSuccess();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setErrorMessage(null);
    setInfoMessage(
      'Ask your clinic owner to set a new password for you in Clinic Settings. Clinic owners: see "Forgotten owner password" in the setup guide.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#5749e2] flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                MindLedger
                <span className="text-[9px] uppercase font-bold text-[#fd2a83] bg-[#fdf0f6] px-1.5 py-0.2 rounded border border-[#f9b8d6]">
                  India
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Practice Management Portal</div>
            </div>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Practice
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500 max-w-sm mx-auto">
          Single entry point for all clinic team members (Clinic Owner, Psychologists, and Client Coordinators).
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 shadow-sm rounded-2xl space-y-6">
          {infoMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-semibold text-[#5749e2] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Enter Practice Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5749e2] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-semibold text-slate-800">Role-based access:</span> Psychologists only see their own
                caseload; Client Coordinators handle client intake; Clinic Owners manage staff, reports and settings.
                Staff accounts are created by the clinic owner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
