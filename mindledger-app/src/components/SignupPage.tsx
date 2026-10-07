import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { signUpClinic } from '../lib/api';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onSignupSuccess,
  onNavigateToLogin,
}) => {
  const [clinicName, setClinicName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clinicName.trim()) {
      setErrorMessage('Please enter your practice / clinic name.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Please enter the clinic owner\'s full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work or professional email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpClinic({
        clinic_name: clinicName,
        owner_name: ownerName,
        email,
        password,
      });
      onSignupSuccess();
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center mb-3">
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-[#5749e2] transition-colors"
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
              <div className="text-[10px] text-slate-400 font-medium">DPDP-Compliant Practice Cloud</div>
            </div>
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Register a Brand-New Clinic
        </h1>
        <p className="mt-1.5 text-center text-xs text-slate-500 max-w-sm mx-auto">
          Sole entry point for clinic founders. Your account will automatically be provisioned with the <span className="font-semibold text-slate-700">Clinic Owner</span> role.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 shadow-sm rounded-2xl space-y-6">
          {/* Owner Role Notice */}
          <div className="p-3.5 bg-[#f4f3fe] border border-[#d4d0fb] rounded-xl flex items-start gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#5749e2] shrink-0 mt-0.5" />
            <div className="text-slate-700 space-y-0.5">
              <span className="font-bold text-[#281e80] block">Owner Account Provisioning</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As the founding owner, you will have exclusive authority over staff management, reports, DPDP statutory parameters, and clinical rosters.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Clinic Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Clinic / Practice Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Lotus Mind & Cognitive Wellness"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Field 2: Owner's Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Owner&apos;s Full Legal Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Field 3: Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Owner Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rajesh@lotusminds.in"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Field 4: Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Minimum 6 characters with letters and numbers.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Registering Clinic...</span>
              ) : (
                <>
                  <span>Create Clinic & Owner Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Already registered your clinic?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-[#5749e2] hover:underline"
              >
                Log In to Existing Practice
              </button>
            </p>

            {/* Explanation regarding staff accounts */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-left text-[11px] text-amber-900 flex items-start gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Joining an existing clinic?</span> Staff accounts (Psychologists & Coordinators) are created directly by your Clinic Owner via <span className="font-semibold">Settings &gt; Staff Management</span>. Do not register a new clinic here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
