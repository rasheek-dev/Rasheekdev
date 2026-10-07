import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Client, User } from '../types';
import { createClient } from '../lib/api';

interface NewClientModalProps {
  clinicians: User[];
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  clinicians,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [assignedClinicianId, setAssignedClinicianId] = useState(clinicians[0]?.id || '');
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 ');
  const [consentGranted, setConsentGranted] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!assignedClinicianId) {
      setError('Add a psychologist in Settings before creating client files.');
      return;
    }
    setSaving(true);
    try {
      const emergencyPhoneClean = emergencyPhone.trim() === '+91' ? '' : emergencyPhone.trim();
      const client = await createClient({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date_of_birth: dob,
        assigned_clinician_id: assignedClinicianId,
        is_minor: isMinor,
        guardian_name: isMinor ? guardianName.trim() : undefined,
        guardian_contact: isMinor ? guardianContact.trim() : undefined,
        emergency_contact_name: emergencyName.trim() || 'Not provided',
        emergency_contact_phone: emergencyPhoneClean || 'Not provided',
        consent_status: consentGranted ? 'granted' : 'pending',
      });
      onSuccess(client);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Add New Client File</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Krishnan"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number (WhatsApp)</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Clinician</label>
              <select
                value={assignedClinicianId}
                onChange={(e) => setAssignedClinicianId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
              >
                {clinicians.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Minor Toggle & Guardian Fields */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Is client under 18 (Minor)?</span>
                <p className="text-[11px] text-slate-500">
                  DPDP Act requires verifiable parental/guardian consent for minors.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isMinor}
                onChange={(e) => setIsMinor(e.target.checked)}
                className="w-4 h-4 accent-[#5749e2] rounded"
              />
            </div>

            {isMinor && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                    Parent/Guardian Name
                  </label>
                  <input
                    type="text"
                    required={isMinor}
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Parent's Name"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                    Parent/Guardian Contact
                  </label>
                  <input
                    type="text"
                    required={isMinor}
                    value={guardianContact}
                    onChange={(e) => setGuardianContact(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. Ramesh Krishnan (Spouse)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* DPDP Consent */}
          <div className="p-3 bg-[#f4f3fe]/70 border border-[#d4d0fb] rounded-xl flex items-start gap-2">
            <input
              type="checkbox"
              id="dpdpConsent"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#5749e2] rounded"
            />
            <label htmlFor="dpdpConsent" className="text-[11px] text-[#281e80] leading-relaxed">
              Client has granted informed DPDP consent (Version DPDP-V1.2-2024) for clinical care, record keeping and psychometric assessments.
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              {saving ? 'Creating...' : 'Create Client File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
