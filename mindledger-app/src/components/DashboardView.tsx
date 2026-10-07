import React, { useMemo, useState } from 'react';
import {
  Users,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Plus,
  Send,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Globe,
  Video,
} from 'lucide-react';
import { Assessment, Client, SessionNote, User, Clinic, WebSession, isOwner, isPsychologist, isCoordinator } from '../types';
import { formatSessionDate } from './SessionNoteEditor';

interface DashboardViewProps {
  clients: Client[];
  notes: SessionNote[];
  assessments: Assessment[];
  sessions: WebSession[];
  currentUser: User;
  allUsers: User[];
  clinic: Clinic;
  onSelectClient: (clientId: string) => void;
  onOpenNote: (noteId?: string, clientId?: string, sessionId?: string) => void;
  onNewClient: () => void;
  onSendAssessment: () => void;
  onGoToAssessments: () => void;
  onGoToClients: () => void;
  onGoToReports: () => void;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const isExpired = (a: Assessment) => a.status === 'pending' && new Date(a.expires_at).getTime() < Date.now();

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  notes,
  assessments,
  sessions,
  currentUser,
  allUsers,
  clinic,
  onSelectClient,
  onOpenNote,
  onNewClient,
  onSendAssessment,
  onGoToAssessments,
  onGoToClients,
  onGoToReports,
}) => {
  const userIsCoordinator = isCoordinator(currentUser.role);
  const userIsPsychologist = isPsychologist(currentUser.role);
  const userIsOwner = isOwner(currentUser.role);

  const [clinicianFilter, setClinicianFilter] = useState<string>('all');
  const [notesView, setNotesView] = useState<'drafts' | 'recent'>('drafts');

  const clinicians = allUsers.filter((u) => u.role === 'clinician' || u.role === 'psychologist' || u.role === 'owner');
  const byClinician = <T extends { assigned_clinician_id?: string; clinician_id?: string }>(items: T[]) =>
    clinicianFilter === 'all'
      ? items
      : items.filter((i) => i.assigned_clinician_id === clinicianFilter || i.clinician_id === clinicianFilter);

  const visibleClients = clinicianFilter === 'all' ? clients : clients.filter((c) => c.assigned_clinician_id === clinicianFilter);
  const visibleNotes = byClinician(notes);
  const visibleAssessments = byClinician(assessments);

  const activeClients = visibleClients.filter((c) => c.status === 'active');
  const signedNotes = visibleNotes.filter((n) => n.status === 'signed');
  const draftNotes = visibleNotes.filter((n) => n.status === 'draft');
  const pendingAssessments = visibleAssessments.filter((a) => a.status === 'pending' && !isExpired(a));
  const completedAssessments = visibleAssessments
    .filter((a) => a.status === 'completed')
    .sort((a, b) => (b.completed_at_iso || '').localeCompare(a.completed_at_iso || ''));

  const thisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return visibleClients.filter((c) => new Date(c.created_at).getTime() >= weekAgo).length;
  }, [visibleClients]);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const upcomingSessions = byClinician(sessions)
    .filter((s) => s.status !== 'cancelled' && s.date >= todayKey)
    .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`))
    .slice(0, 8);

  const listedNotes = (notesView === 'drafts' ? draftNotes : visibleNotes).slice(0, 8);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name || 'Client';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {greeting()}, {currentUser.name.replace(/^Dr\.?\s+/i, '').split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} &bull; {clinic.name}
          </p>
        </div>

        {userIsOwner && clinicians.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Clinician:</span>
            <select
              value={clinicianFilter}
              onChange={(e) => setClinicianFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
            >
              <option value="all">All Clinicians (Group Practice)</option>
              {clinicians.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'owner' ? 'Owner' : 'Clinician'})
                </option>
              ))}
            </select>
          </div>
        ) : userIsPsychologist ? (
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-1.5">
            <span>Psychologist Caseload:</span>
            <span className="font-bold">{currentUser.name}</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={userIsPsychologist ? 'My Caseload' : 'Active Clients'}
          value={activeClients.length}
          hint={thisWeek > 0 ? `+${thisWeek} registered this week` : `${visibleClients.length} client files in total`}
          icon={<Users className="w-4 h-4" />}
          tone="blue"
        />
        {userIsCoordinator ? (
          <StatCard
            label="Consent Pending"
            value={visibleClients.filter((c) => c.consent_status === 'pending').length}
            hint="Clients awaiting DPDP consent"
            icon={<ShieldAlert className="w-4 h-4" />}
            tone="amber"
          />
        ) : (
          <StatCard
            label="Signed Session Notes"
            value={signedNotes.length}
            hint="Locked & DPDP compliant"
            icon={<CheckCircle2 className="w-4 h-4" />}
            tone="emerald"
          />
        )}
        {userIsCoordinator ? (
          <StatCard
            label="Consent Withdrawn"
            value={visibleClients.filter((c) => c.consent_status === 'withdrawn').length}
            hint="Review with clinic owner"
            icon={<ShieldAlert className="w-4 h-4" />}
            tone="rose"
          />
        ) : (
          <StatCard
            label="Draft Notes"
            value={draftNotes.length}
            hint="Require signature lock"
            icon={<FileText className="w-4 h-4" />}
            tone="amber"
          />
        )}
        {userIsCoordinator ? (
          <StatCard
            label="Minors"
            value={visibleClients.filter((c) => c.is_minor).length}
            hint="Guardian consent required"
            icon={<Users className="w-4 h-4" />}
            tone="violet"
          />
        ) : (
          <StatCard
            label="Pending Assessments"
            value={pendingAssessments.length}
            hint={`${completedAssessments.length} completed in total`}
            icon={<ClipboardCheck className="w-4 h-4" />}
            tone="violet"
          />
        )}
      </div>

      {sessions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Upcoming Website Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Booked on your website. Returning clients open their existing file with all earlier reports.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{upcomingSessions.length}</span>
          </div>
          {upcomingSessions.length === 0 && <p className="text-xs text-slate-400 py-2">No upcoming sessions.</p>}
          <div className="grid md:grid-cols-2 gap-2.5">
            {upcomingSessions.map((sess) => {
              const sessNote = notes.find((n) => n.appointment_id === sess.id);
              const psych = allUsers.find((u) => u.id === sess.clinician_id);
              const pastReports = notes.filter((n) => n.client_id === sess.client_id && n.appointment_id !== sess.id).length;
              const isFollowUp = sessions.some(
                (o) => o.client_id === sess.client_id && o.status !== 'cancelled' && `${o.date} ${o.start_time}` < `${sess.date} ${sess.start_time}`
              );
              const isToday = sess.date === todayKey;
              return (
                <div key={sess.id} className="p-3.5 rounded-xl border border-slate-200 border-l-4 border-l-blue-400 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {isToday ? 'Today' : formatSessionDate(sess.date)}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{sess.start_time}</span>
                    </div>
                    <button
                      onClick={() => onSelectClient(sess.client_id)}
                      className="text-sm font-bold text-slate-900 hover:text-[#5749e2] text-left truncate block max-w-full"
                    >
                      {clientName(sess.client_id)}
                    </button>
                    <div className="text-[11px] text-slate-500 truncate">
                      {psych?.name || 'Psychologist'}
                      {isFollowUp ? ' \u2022 Follow-up' : ' \u2022 First session'}
                      {!userIsCoordinator && pastReports > 0 && ` \u2022 ${pastReports} earlier report${pastReports === 1 ? '' : 's'}`}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {sess.meet_url && (
                      <a
                        href={sess.meet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 inline-flex items-center gap-1"
                      >
                        <Video className="w-3 h-3" />
                        Meet
                      </a>
                    )}
                    {userIsCoordinator ? (
                      <button
                        onClick={() => onSelectClient(sess.client_id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700"
                      >
                        Client File
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenNote(sessNote?.id, sess.client_id, sess.id)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#5749e2] text-white inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        {sessNote ? 'Open Report' : 'Write Report'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          {userIsCoordinator ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Recently Registered Clients</h2>
                <button onClick={onGoToClients} className="text-xs font-semibold text-[#5749e2] hover:underline">
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {visibleClients.length === 0 && (
                  <EmptyState text="No clients yet." action={{ label: 'Register New Client', onClick: onNewClient }} />
                )}
                {[...visibleClients]
                  .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
                  .slice(0, 8)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectClient(c.id)}
                      className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.phone} &bull; Registered {c.created_at} &bull;{' '}
                          {allUsers.find((u) => u.id === c.assigned_clinician_id)?.name || 'Unassigned'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {notesView === 'drafts' ? 'Notes Awaiting Signature' : 'Recent Session Notes'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      {notesView === 'drafts' ? draftNotes.length : visibleNotes.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {notesView === 'drafts'
                      ? 'Draft notes stay editable until you sign and lock them.'
                      : 'Latest clinical documentation across your caseload.'}
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs self-start">
                  {(['drafts', 'recent'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setNotesView(tab)}
                      className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                        notesView === tab ? 'bg-white text-[#5749e2] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {listedNotes.length === 0 && (
                  <EmptyState
                    text={notesView === 'drafts' ? 'No draft notes. Everything is signed.' : 'No session notes yet.'}
                    action={{ label: 'Open Client Files', onClick: onGoToClients }}
                  />
                )}
                {listedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 ${
                      note.status === 'signed' ? 'border-l-emerald-400' : 'border-l-amber-400'
                    } border-slate-200 bg-white hover:border-slate-300`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onSelectClient(note.client_id)}
                          className="text-sm font-bold text-slate-900 hover:text-[#5749e2] transition-colors text-left"
                        >
                          {clientName(note.client_id)}
                        </button>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {note.template_type}
                        </span>
                        {note.duration_minutes ? (
                          <span className="text-[10px] text-slate-500">{note.duration_minutes} min</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-md">
                        {note.content?.subjective || note.content?.data || note.content?.text || 'No content yet'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {note.status === 'signed'
                          ? `Signed ${note.signed_at}`
                          : `Last edited ${new Date(note.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
                        {note.clinician_name && note.clinician_id !== currentUser.id ? ` • ${note.clinician_name}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenNote(note.id, note.client_id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 self-start sm:self-center ${
                        note.status === 'signed'
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-[#f4f3fe] text-[#5749e2] hover:bg-[#e8e6fd]'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{note.status === 'signed' ? 'View Note' : 'Continue Draft'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {!userIsPsychologist && (
                <QuickAction icon={<Plus className="w-4 h-4" />} title="New Client" hint="Intake profile" onClick={onNewClient} />
              )}
              {!userIsCoordinator && (
                <QuickAction icon={<FileText className="w-4 h-4" />} title="Write Note" hint="Pick a client file" onClick={onGoToClients} />
              )}
              {!userIsCoordinator && (
                <QuickAction icon={<Send className="w-4 h-4" />} title="Send Assessment" hint="PHQ-9 / GAD-7" onClick={onSendAssessment} />
              )}
              <QuickAction
                icon={<Users className="w-4 h-4" />}
                title={userIsPsychologist ? 'My Clients' : 'All Clients'}
                hint="Client directory"
                onClick={onGoToClients}
              />
              {userIsOwner && (
                <QuickAction icon={<BarChart3 className="w-4 h-4" />} title="Reports" hint="Clinical activity" onClick={onGoToReports} />
              )}
            </div>
          </div>

          {!userIsCoordinator && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest Assessment Results</h3>
                <button onClick={onGoToAssessments} className="text-[11px] font-semibold text-[#5749e2] hover:underline">
                  View all
                </button>
              </div>
              {completedAssessments.length === 0 && <p className="text-xs text-slate-400">No completed assessments yet.</p>}
              <div className="space-y-2">
                {completedAssessments.slice(0, 5).map((a) => {
                  const flagged = a.type === 'PHQ9' && Number(a.responses?.[9] ?? 0) > 0;
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSelectClient(a.client_id)}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{clientName(a.client_id)}</span>
                        <span className="text-[11px] font-bold text-[#392cb3] shrink-0">
                          {a.type === 'PHQ9' ? 'PHQ-9' : 'GAD-7'}: {a.score}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                        <span>
                          {a.severity_band} &bull; {a.completed_at}
                        </span>
                        {flagged && (
                          <span className="inline-flex items-center gap-0.5 text-red-700 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Item 9
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TONES: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-[#f4f3fe] text-[#5749e2]',
  rose: 'bg-rose-50 text-rose-600',
};

const HINT_TONES: Record<string, string> = {
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  violet: 'text-[#5749e2]',
  rose: 'text-rose-600',
};

function StatCard({ label, value, hint, icon, tone }: { label: string; value: number; hint: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${TONES[tone]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className={`text-[11px] font-medium ${HINT_TONES[tone]}`}>{hint}</div>
    </div>
  );
}

function QuickAction({ icon, title, hint, onClick }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-3 rounded-xl border border-slate-200 hover:border-[#5749e2] hover:bg-[#f4f3fe] text-left transition-all group"
    >
      <div className="w-7 h-7 rounded-lg bg-[#f4f3fe] text-[#5749e2] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div className="text-xs font-bold text-slate-800">{title}</div>
      <div className="text-[10px] text-slate-400">{hint}</div>
    </button>
  );
}

function EmptyState({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="py-10 text-center text-slate-500 space-y-3">
      <p className="text-sm font-semibold text-slate-700">{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-3.5 py-2 text-xs font-bold bg-[#5749e2] text-white rounded-xl shadow-xs hover:bg-[#4738cf]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
