import React, { useMemo, useState } from 'react';
import { X, Search, UserCheck, ArrowLeft, FileText, Lock, ClipboardCheck, CalendarClock } from 'lucide-react';
import { Assessment, Client, SessionNote, User, WebSession } from '../types';
import { createClient, assignClient } from '../lib/api';
import { SessionDraft, SessionFields, findConflict, newSessionDraft, submitSession, todayKey } from './BookSessionModal';
import { formatSessionDate } from './SessionNoteEditor';

interface NewClientModalProps {
  clinicians: User[];
  clients: Client[];
  notes: SessionNote[];
  assessments: Assessment[];
  sessions: WebSession[];
  canSeeReports: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
}

/** "Book a session now" switch with the date/time fields underneath. */
function SessionSection({
  title,
  bookNow,
  setBookNow,
  children,
}: {
  title: string;
  bookNow: boolean;
  setBookNow: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-xl border border-[#d4d0fb] bg-[#f4f3fe]/50 space-y-3 text-xs">
      <label className="flex items-center justify-between gap-2 cursor-pointer">
        <span className="font-bold text-[#281e80] flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          {title}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-600">
          Book now
          <input type="checkbox" checked={bookNow} onChange={(e) => setBookNow(e.target.checked)} className="w-4 h-4 accent-[#5749e2]" />
        </span>
      </label>
      {bookNow && children}
    </div>
  );
}

const digitsOf = (s: string) => s.replace(/\D/g, '');
const last10 = (s: string) => digitsOf(s).slice(-10);

function matchesPhone(client: Client, query: string): boolean {
  const q = digitsOf(query);
  if (q.length < 4 || client.anonymized) return false;
  const phone = digitsOf(client.phone || '');
  return phone.includes(q.length > 10 ? q.slice(-10) : q);
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  clinicians,
  clients,
  notes,
  assessments,
  sessions,
  canSeeReports,
  onClose,
  onSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [existing, setExisting] = useState<Client | null>(null);
  // Set when a new client was saved but the session could not be booked (e.g. the slot was just taken).
  const [carryOver, setCarryOver] = useState<{ draft: SessionDraft; error: string } | null>(null);
  const searchResults = useMemo(() => clients.filter((c) => matchesPhone(c, search)).slice(0, 6), [clients, search]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [draft, setDraft] = useState<SessionDraft>(() => newSessionDraft(clinicians[0]?.id || ''));
  const [bookNow, setBookNow] = useState(true);
  const assignedClinicianId = draft.clinicianId;
  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianContact, setGuardianContact] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 ');
  const [consentGranted, setConsentGranted] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = last10(phone).length === 10 ? clients.find((c) => !c.anonymized && last10(c.phone || '') === last10(phone)) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!assignedClinicianId) {
      setError('Add a psychologist in Settings before creating client files.');
      return;
    }
    if (bookNow && (draft.date < todayKey() || findConflict(sessions, draft))) {
      setError('The chosen session time is not available. Please pick another date or time.');
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
      if (bookNow) {
        try {
          await submitSession(client.id, draft);
        } catch (err) {
          setCarryOver({ draft, error: `Client file created, but the session was not booked: ${(err as Error).message}` });
          setExisting(client);
          return;
        }
      }
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
          <h3 className="text-base font-bold text-slate-900">{existing ? 'Returning Client' : 'Add Client'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {existing ? (
          <ReturningClient
            client={existing}
            clinicians={clinicians}
            notes={notes}
            assessments={assessments}
            sessions={sessions}
            clients={clients}
            initialDraft={carryOver?.draft}
            initialError={carryOver?.error}
            canSeeReports={canSeeReports}
            onBack={() => {
              setExisting(null);
              setCarryOver(null);
            }}
            onDone={onSuccess}
          />
        ) : (
        <>
        <div className="p-3 bg-[#f4f3fe]/60 border border-[#d4d0fb] rounded-xl space-y-2 text-xs">
          <label className="font-semibold text-[#281e80] flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Returning client? Search by phone number
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type at least 4 digits, e.g. 98765"
            className="w-full px-3 py-2 rounded-xl border border-[#d4d0fb] bg-white focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
          />
          {digitsOf(search).length >= 4 && searchResults.length === 0 && (
            <p className="text-[11px] text-slate-500">No existing client with that number. Fill in the form below to register them.</p>
          )}
          {searchResults.length > 0 && (
            <div className="space-y-1.5">
              {searchResults.map((c) => {
                const psych = clinicians.find((u) => u.id === c.assigned_clinician_id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setExisting(c)}
                    className="w-full text-left p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#5749e2] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{c.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {c.phone} &bull; {psych?.name || 'Unassigned'} &bull; {c.reports_count ?? 0} report{(c.reports_count ?? 0) === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#5749e2] shrink-0 inline-flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
          <span className="flex-1 border-t border-slate-200" />
          or register a new client
          <span className="flex-1 border-t border-slate-200" />
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
              {duplicate && (
                <button
                  type="button"
                  onClick={() => setExisting(duplicate)}
                  className="mt-1 w-full text-left text-[11px] p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900"
                >
                  This number belongs to <strong>{duplicate.name}</strong>. Tap to open their existing file instead.
                </button>
              )}
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
              <label className="block font-semibold text-slate-700 mb-1">Psychologist</label>
              <select
                value={assignedClinicianId}
                onChange={(e) => setDraft({ ...draft, clinicianId: e.target.value })}
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

          <SessionSection title="First session" bookNow={bookNow} setBookNow={setBookNow}>
            <SessionFields draft={draft} onChange={setDraft} clinicians={clinicians} sessions={sessions} clients={clients} showClinician={false} />
          </SessionSection>

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
              {saving ? 'Saving...' : bookNow ? 'Create Client & Book Session' : 'Create Client File'}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
};

function ReturningClient({
  client,
  clinicians,
  notes,
  assessments,
  sessions,
  clients,
  initialDraft,
  initialError,
  canSeeReports,
  onBack,
  onDone,
}: {
  client: Client;
  clinicians: User[];
  notes: SessionNote[];
  assessments: Assessment[];
  sessions: WebSession[];
  clients: Client[];
  initialDraft?: SessionDraft;
  initialError?: string;
  canSeeReports: boolean;
  onBack: () => void;
  onDone: (client: Client) => void;
}) {
  const [draft, setDraft] = useState<SessionDraft>(
    () =>
      initialDraft ||
      newSessionDraft(
        clinicians.some((c) => c.id === client.assigned_clinician_id) ? client.assigned_clinician_id : clinicians[0]?.id || ''
      )
  );
  const [bookNow, setBookNow] = useState(true);
  const clinicianId = draft.clinicianId;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const upcoming = sessions
    .filter((s) => s.client_id === client.id && s.status === 'confirmed' && s.date >= todayKey())
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const current = clinicians.find((c) => c.id === client.assigned_clinician_id);
  const reports = notes
    .filter((n) => n.client_id === client.id)
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const scores = assessments
    .filter((a) => a.client_id === client.id && a.status === 'completed')
    .sort((a, b) => (b.completed_at_iso || '').localeCompare(a.completed_at_iso || ''));
  const reportCount = canSeeReports ? reports.length : client.reports_count ?? 0;

  const handleAssign = async () => {
    setError(null);
    if (bookNow && (draft.date < todayKey() || findConflict(sessions, draft))) {
      setError('The chosen session time is not available. Please pick another date or time.');
      return;
    }
    setSaving(true);
    try {
      onDone(bookNow ? (await submitSession(client.id, draft)).client : await assignClient(client, clinicianId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <button type="button" onClick={onBack} className="font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to search
      </button>

      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
        <div className="text-sm font-bold text-slate-900">{client.name}</div>
        <div className="text-slate-500">
          {client.phone}
          {client.email ? ` \u2022 ${client.email}` : ''}
          {client.date_of_birth ? ` \u2022 DOB ${client.date_of_birth}` : ''}
        </div>
        <div className="text-slate-600">
          First visit {client.created_at} &bull; Last psychologist: <strong>{current?.name || 'Unassigned'}</strong>
        </div>
        {upcoming.length > 0 && (
          <div className="text-emerald-700 font-semibold">
            Already booked: {upcoming.map((s) => `${formatSessionDate(s.date)} ${s.start_time}`).join(', ')}
          </div>
        )}
      </div>

      <SessionSection title="Follow-up session" bookNow={bookNow} setBookNow={setBookNow}>
        <SessionFields draft={draft} onChange={setDraft} clinicians={clinicians} sessions={sessions} clients={clients} />
      </SessionSection>
      {!bookNow && (
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Assign to psychologist for this visit</label>
          <select
            value={clinicianId}
            onChange={(e) => setDraft({ ...draft, clinicianId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#5749e2] focus:outline-none"
          >
            {clinicians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.id === client.assigned_clinician_id ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      {clinicianId !== client.assigned_clinician_id && (
        <p className="text-[11px] text-slate-500">
          The client file and all earlier reports move to {clinicians.find((c) => c.id === clinicianId)?.name || 'this psychologist'}.
        </p>
      )}

      <div className="space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#5749e2]" />
          Previous reports ({reportCount})
        </h4>
        {!canSeeReports ? (
          <p className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Report contents are visible only to the psychologist and the clinic owner. The psychologist you choose for this visit will
              see all {reportCount} earlier report{reportCount === 1 ? '' : 's'} in the client file.
            </span>
          </p>
        ) : reports.length === 0 ? (
          <p className="text-slate-400">No reports yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {reports.map((n) => (
              <div key={n.id} className="p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {(n.signed_at || n.created_at?.split('T')[0]) ?? ''} &bull; {n.template_type}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      n.status === 'signed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {n.status === 'signed' ? 'Signed' : 'Draft'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{n.clinician_name || clinicians.find((c) => c.id === n.clinician_id)?.name || ''}</div>
                <p className="text-slate-600 line-clamp-2 mt-0.5">
                  {n.content?.assessment || n.content?.text || n.content?.subjective || n.content?.data || 'No text'}
                </p>
              </div>
            ))}
          </div>
        )}
        {canSeeReports && scores.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scores.slice(0, 4).map((a) => (
              <span key={a.id} className="px-2 py-0.5 rounded-full bg-[#f4f3fe] text-[#392cb3] border border-[#d4d0fb] text-[10px] font-semibold inline-flex items-center gap-1">
                <ClipboardCheck className="w-3 h-3" />
                {a.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'} {a.score} ({a.severity_band}) &bull; {a.completed_at}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onBack} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 rounded-xl">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleAssign}
          disabled={saving || !clinicianId}
          className="px-5 py-2 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm"
        >
          {saving ? 'Saving...' : bookNow ? 'Book Session & Open File' : 'Assign & Open File'}
        </button>
      </div>
    </div>
  );
}
