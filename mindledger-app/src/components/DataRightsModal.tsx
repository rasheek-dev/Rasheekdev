import React, { useState } from 'react';
import { ShieldCheck, X, Download, Trash2, Mail, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { Client, Clinic } from '../types';
import { createDpdpRequest } from '../lib/api';

interface DataRightsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  clinic?: Clinic;
  clients?: Client[];
  onSuccess?: () => void;
}

export const DataRightsModal: React.FC<DataRightsModalProps> = ({
  isOpen = true,
  onClose,
  clinic,
  clients = [],
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'export' | 'erasure'>('info');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isOpen === false) return null;

  const handleSubmit = async (type: 'export' | 'erasure') => {
    if (!contact.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createDpdpRequest({ client_name: name.trim(), client_contact: contact, type, notes }, clients);
      setSubmitted(true);
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        id="dpdp-rights-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f4f3fe] border border-[#d4d0fb] flex items-center justify-center text-[#5749e2]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Your Data Rights</h2>
              <p className="text-xs text-slate-500">Digital Personal Data Protection (DPDP) Act, 2023</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('info'); setSubmitted(false); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-[#5749e2] text-[#5749e2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Grievance
          </button>
          <button
            onClick={() => { setActiveTab('export'); setSubmitted(false); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-[#5749e2] text-[#5749e2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request Data Export
          </button>
          <button
            onClick={() => { setActiveTab('erasure'); setSubmitted(false); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'erasure'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Request Erasure
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">{error}</div>}
          {submitted ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Request Registered Successfully</h3>
              <p className="mt-1.5 text-xs text-slate-600 max-w-md mx-auto">
                The request has been recorded for the clinic owner, who will process it and contact the client. Open requests are listed under Settings.
              </p>
              <button
                onClick={() => { setSubmitted(false); onClose(); }}
                className="mt-5 px-4 py-2 bg-[#5749e2] text-white text-xs font-medium rounded-lg hover:bg-[#4738cf] transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : activeTab === 'info' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                We respect your privacy and protect your sensitive psychological health records under the <strong>Digital Personal Data Protection Act, 2023</strong> of India. Session notes and assessments are only accessible to the treating psychologist and the clinic owner.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
                    <Download className="w-4 h-4 text-[#5749e2]" />
                    <span>Right to Access & Portability</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Obtain a complete machine-readable copy of your personal data, session history and assessments.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-1">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>Right to Correction & Erasure</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Request deletion of your contact information. Clinical session records are pseudonymized in accordance with clinical record retention laws.
                  </p>
                </div>
              </div>

              {/* Grievance Officer block */}
              <div className="p-4 bg-[#f4f3fe]/70 border border-[#d4d0fb]/80 rounded-xl">
                <h4 className="text-xs font-semibold text-[#281e80] uppercase tracking-wider mb-2">
                  DPDP Grievance Redressal Officer
                </h4>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#5749e2] font-medium">Designated Officer:</span>{' '}
                    <span className="font-semibold text-slate-800">{clinic?.dpdp_officer_name || clinic?.consent_officer_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-[#5749e2]" />
                    <a href={`mailto:${clinic?.dpdp_officer_email || clinic?.consent_officer_email}`} className="hover:underline text-[#392cb3]">
                      {clinic?.dpdp_officer_email || clinic?.consent_officer_email}
                    </a>
                  </div>
                  {clinic?.consent_officer_phone && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-[#5749e2]" />
                      <span>{clinic.consent_officer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setActiveTab('export')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Request My Data
                </button>
                <button
                  onClick={() => setActiveTab('erasure')}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Request Erasure
                </button>
              </div>
            </div>
          ) : activeTab === 'export' ? (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                Records a request for a complete copy of the client's profile, consent history, session notes and assessment scores. The owner can download it from the client's file (DPDP Data Export).
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Client's full name"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registered Mobile Phone or Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or email"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify particular dates or records if needed"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
                />
              </div>
              <button
                onClick={() => handleSubmit('export')}
                disabled={submitting || !contact.trim()}
                className="w-full py-2.5 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{submitting ? 'Processing...' : 'Submit Data Export Request'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Under Section 12(3) of DPDP, personal contact data will be permanently purged. Clinical session notes are anonymized rather than deleted to fulfill statutory medical retention regulations.
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Client's full name"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registered Mobile Phone or Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210 or email"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Erasure</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Therapy concluded, moving away, or revoking all consent"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={() => handleSubmit('erasure')}
                disabled={submitting || !contact.trim()}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit Erasure Request'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
