import React, { useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { Client, User, WebSession } from '../types';
import { bookSession } from '../lib/api';

export interface SessionDraft {
  clinicianId: string;
  date: string;
  time: string;
  duration: number;
  mode: 'in_person' | 'online' | 'phone';
  notes: string;
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextSlot(): string {
  const d = new Date();
  const minutes = Math.min(21 * 60, Math.max(9 * 60, Math.ceil((d.getHours() * 60 + d.getMinutes() + 1) / 30) * 30));
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function newSessionDraft(clinicianId: string): SessionDraft {
  return { clinicianId, date: todayKey(), time: nextSlot(), duration: 50, mode: 'in_person', notes: '' };
}

const TIMES = Array.from({ length: (22 - 7) * 4 + 1 }, (_, i) => {
  const m = 7 * 60 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
});
const DURATIONS = [30, 45, 50, 60, 75, 90, 120];

export function endTimeOf(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** An existing booking of the same psychologist that overlaps the draft, if any. */
export function findConflict(sessions: WebSession[], draft: SessionDraft, ignoreClientId?: string): WebSession | undefined {
  const end = endTimeOf(draft.time, draft.duration);
  return sessions.find(
    (s) =>
      s.clinician_id === draft.clinicianId &&
      s.date === draft.date &&
      s.status !== 'cancelled' &&
      s.client_id !== ignoreClientId &&
      draft.time < s.end_time &&
      end > s.start_time
  );
}

function to12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Day view of a psychologist's existing bookings, so the front desk can see free times. */
function DaySchedule({ sessions, clients, clinicianId, date }: { sessions: WebSession[]; clients: Client[]; clinicianId: string; date: string }) {
  const booked = sessions
    .filter((s) => s.clinician_id === clinicianId && s.date === date && s.status !== 'cancelled')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  if (booked.length === 0) {
    return <p className="text-[11px] text-emerald-700">No other sessions booked for this psychologist on this day.</p>;
  }
  return (
    <div className="text-[11px] text-slate-600 space-y-0.5">
      <span className="font-semibold text-slate-700">Already booked this day:</span>
      {booked.map((s) => (
        <div key={s.id}>
          {s.start_time}&ndash;{s.end_time} &bull; {clients.find((c) => c.id === s.client_id)?.name || 'Client'}
        </div>
      ))}
    </div>
  );
}

export function SessionFields({
  draft,
  onChange,
  clinicians,
  sessions,
  clients,
  lockClinician,
  showClinician = true,
}: {
  draft: SessionDraft;
  onChange: (d: SessionDraft) => void;
  clinicians: User[];
  sessions: WebSession[];
  clients: Client[];
  lockClinician?: boolean;
  showClinician?: boolean;
}) {
  const set = (patch: Partial<SessionDraft>) => onChange({ ...draft, ...patch });
  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#5749e2] focus:outline-none';
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      {showClinician && (
        <div className="col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">Psychologist</label>
          <select value={draft.clinicianId} disabled={lockClinician} onChange={(e) => set({ clinicianId: e.target.value })} className={field}>
            {clinicians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Date</label>
        <input type="date" required value={draft.date} min={todayKey()} onChange={(e) => set({ date: e.target.value })} className={field} />
      </div>
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Start time</label>
        <select value={draft.time} onChange={(e) => set({ time: e.target.value })} className={field}>
          {TIMES.map((t) => (
            <option key={t} value={t}>
              {to12h(t)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Length</label>
        <select value={draft.duration} onChange={(e) => set({ duration: Number(e.target.value) })} className={field}>
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} minutes
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold text-slate-700 mb-1">Mode</label>
        <select value={draft.mode} onChange={(e) => set({ mode: e.target.value as SessionDraft['mode'] })} className={field}>
          <option value="in_person">In person</option>
          <option value="online">Online</option>
          <option value="phone">Phone</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="block font-semibold text-slate-700 mb-1">Note for the psychologist (optional)</label>
        <input
          type="text"
          value={draft.notes}
          maxLength={500}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="e.g. Follow-up after 2 weeks, wants evening slot"
          className={field}
        />
      </div>
      <div className="col-span-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
        <DaySchedule sessions={sessions} clients={clients} clinicianId={draft.clinicianId} date={draft.date} />
        {findConflict(sessions, draft) && (
          <p className="text-[11px] font-semibold text-red-700">
            {to12h(draft.time)}&ndash;{to12h(endTimeOf(draft.time, draft.duration))} overlaps a booked session. Please pick another time.
          </p>
        )}
      </div>
    </div>
  );
}

export function submitSession(clientId: string, draft: SessionDraft) {
  return bookSession({
    client_id: clientId,
    clinician_id: draft.clinicianId,
    date: draft.date,
    start_time: draft.time,
    duration_minutes: draft.duration,
    mode: draft.mode,
    notes: draft.notes.trim() || undefined,
  });
}

export const BookSessionModal: React.FC<{
  client: Client;
  clinicians: User[];
  sessions: WebSession[];
  clients: Client[];
  currentUser: User;
  onClose: () => void;
  onBooked: (session: WebSession) => void;
}> = ({ client, clinicians, sessions, clients, currentUser, onClose, onBooked }) => {
  const isPsych = currentUser.role === 'clinician' || currentUser.role === 'psychologist';
  const [draft, setDraft] = useState<SessionDraft>(() =>
    newSessionDraft(isPsych ? currentUser.id : client.assigned_clinician_id || clinicians[0]?.id || '')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { session } = await submitSession(client.id, draft);
      onBooked(session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <form onSubmit={handleBook} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#5749e2]" />
            Book Session &bull; {client.name}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <SessionFields
          draft={draft}
          onChange={setDraft}
          clinicians={clinicians}
          sessions={sessions}
          clients={clients}
          lockClinician={isPsych}
        />
        {draft.clinicianId !== client.assigned_clinician_id && (
          <p className="text-[11px] text-slate-500">
            The client file and all earlier reports will move to this psychologist.
          </p>
        )}
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">{error}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !draft.clinicianId}
            className="px-5 py-2 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm"
          >
            {saving ? 'Booking...' : 'Book Session'}
          </button>
        </div>
      </form>
    </div>
  );
};
