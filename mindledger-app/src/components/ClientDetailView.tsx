import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Plus,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Lock,
  Printer,
  Copy,
} from 'lucide-react';
import { Client, SessionNote, Assessment, ConsentRecord, User, Clinic, isOwner, isPsychologist, isCoordinator } from '../types';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';
import { withdrawConsent, eraseClient, buildClientExport, assessmentLink } from '../lib/api';
import { printClientReport } from './clientReport';

interface ClientDetailViewProps {
  client: Client;
  notes: SessionNote[];
  assessments: Assessment[];
  consentRecords: ConsentRecord[];
  allUsers: User[];
  clinic: Clinic;
  currentUser: User;
  onBack: () => void;
  onOpenNote: (noteId?: string, clientId?: string) => void;
  onSendAssessment: (clientId: string) => void;
  onRefreshData: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  notes,
  assessments,
  consentRecords,
  allUsers,
  clinic,
  currentUser,
  onBack,
  onOpenNote,
  onSendAssessment,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'assessments' | 'consent'>('overview');
  const [withdrawing, setWithdrawing] = useState(false);
  const [erasing, setErasing] = useState(false);

  // PSYCHOLOGIST BOUNDARY: If a psychologist attempts to view a client not in their assigned caseload, show Access Denied
  if (isPsychologist(currentUser.role) && client.assigned_clinician_id !== currentUser.id) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center ring-8 ring-red-50/50">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied: Caseload Boundary</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have authorization to view this client&apos;s records. Psychologists may only access clients assigned to their own caseload under clinic privacy policies.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to My Clients</span>
        </button>
      </div>
    );
  }

  const assignedClinician = allUsers.find((u) => u.id === client.assigned_clinician_id);
  const userIsCoordinator = isCoordinator(currentUser.role);
  const userIsOwner = isOwner(currentUser.role);
  const userIsPsychologist = isPsychologist(currentUser.role);
  const sortedNotes = [...notes].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const sortedAssessments = [...assessments].sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''));
  const latestCompleted = sortedAssessments.find((a) => a.status === 'completed');
  const impressionNote = sortedNotes.find((n) => n.content?.assessment?.trim() || n.content?.text?.trim());
  const latestImpression = impressionNote
    ? {
        text: impressionNote.content.assessment?.trim() || impressionNote.content.text?.trim() || '',
        date: impressionNote.signed_at || impressionNote.created_at?.split('T')[0] || '',
      }
    : null;

  const handleWithdrawConsent = async (purpose: string) => {
    if (!confirm(`Are you sure you want to record a DPDP Consent Withdrawal for "${purpose}"? This action will be immutably logged.`)) return;
    setWithdrawing(true);
    try {
      await withdrawConsent(client, purpose, 'Client requested withdrawal in person / via portal.');
      onRefreshData();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDownloadDPDPExport = () => {
    const bundle = buildClientExport(clinic, client, userIsCoordinator ? [] : notes, userIsCoordinator ? [] : assessments, consentRecords);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MindLedger_Data_Export_${client.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExecuteErasure = async () => {
    const confirmName = prompt(
      `DPDP Right to Erasure: Type "${client.name}" to permanently purge contact PII and anonymize clinical records:`
    );
    if (confirmName !== client.name) return;

    setErasing(true);
    try {
      await eraseClient(client);
      alert('Client contact details were erased and the clinical record anonymized.');
      onRefreshData();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setErasing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Back & Info Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients Directory</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!userIsCoordinator && (
              <button
                onClick={() => printClientReport({ clinic, client, notes: sortedNotes, assessments: sortedAssessments, clinician: assignedClinician })}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Client Report</span>
              </button>
            )}
            <button
              onClick={handleDownloadDPDPExport}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DPDP Data Export</span>
            </button>
            {!userIsCoordinator && (
              <button
                onClick={() => onSendAssessment(client.id)}
                className="px-3 py-1.5 bg-[#f4f3fe] hover:bg-[#e8e6fd] text-[#5749e2] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Send Assessment</span>
              </button>
            )}
          </div>
        </div>

        {/* Client identity card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#f4f3fe] border border-[#d4d0fb] text-[#392cb3] font-extrabold text-xl flex items-center justify-center shrink-0">
              {client.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    client.status === 'active' ? 'bg-[#f4f3fe] text-[#392cb3] border border-[#d4d0fb]' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {client.status}
                </span>
                {client.is_minor && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                    Minor (Under 18)
                  </span>
                )}
                {client.anonymized && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                    Anonymized (DPDP Erased)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                <span>DOB: {client.date_of_birth}</span>
                <span>&bull;</span>
                <span>Phone: {client.phone}</span>
                <span>&bull;</span>
                <span>Email: {client.email}</span>
                <span>&bull;</span>
                <span className="font-medium text-slate-700">
                  Assigned Clinician: {assignedClinician?.name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency contact bar */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">Emergency Contact: </span>
            <span>{client.emergency_contact_name} ({client.emergency_contact_phone})</span>
          </div>
          {client.is_minor && client.guardian_name && (
            <div>
              <span className="font-semibold text-slate-700">Parent/Guardian: </span>
              <span>{client.guardian_name} ({client.guardian_contact})</span>
            </div>
          )}
        </div>

        {/* Tabs Bar matching Screenshot 08 */}
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar, visible: true },
            { id: 'notes', label: `Session Notes (${notes.length})`, icon: FileText, visible: !userIsCoordinator },
            { id: 'assessments', label: `Assessments (${assessments.length})`, icon: ClipboardCheck, visible: !userIsCoordinator },
            { id: 'consent', label: `DPDP Consent History (${consentRecords.length})`, icon: ShieldCheck, visible: true },
          ]
            .filter((t) => t.visible)
            .map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-[#5749e2] text-[#5749e2]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Clinical Case Summary</h3>
              {userIsCoordinator ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Clinical case summary is restricted to psychologists and clinic owners under DPDP rules.</span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 leading-relaxed">
                  {latestImpression ? (
                    <>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Latest clinical impression &bull; {latestImpression.date}
                      </span>
                      <p className="whitespace-pre-line">{latestImpression.text}</p>
                    </>
                  ) : (
                    <p className="text-slate-400">No clinical notes yet. The assessment section of the latest session note will appear here.</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">First Intake</span>
                  <span className="font-semibold text-slate-800">{client.created_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Latest Assessment</span>
                  <span className="font-semibold text-[#5749e2]">
                    {userIsCoordinator
                      ? 'Restricted'
                      : latestCompleted
                      ? `${latestCompleted.type}: ${latestCompleted.score} (${latestCompleted.severity_band})`
                      : 'None completed yet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Session Notes</h3>
                {!userIsCoordinator && (
                  <button
                    onClick={() => onOpenNote(undefined, client.id)}
                    className="text-xs font-semibold text-[#5749e2] hover:text-[#392cb3] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Note</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {userIsCoordinator && (
                  <p className="text-xs text-slate-400">Clinical notes are restricted to psychologists and the clinic owner.</p>
                )}
                {!userIsCoordinator && sortedNotes.length === 0 && <p className="text-xs text-slate-400">No session notes yet.</p>}
                {sortedNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onOpenNote(note.id, client.id)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {note.template_type} Session Note
                        </span>
                        {note.duration_minutes ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#f4f3fe] text-[#5749e2] border border-[#d4d0fb] text-[10px] font-semibold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{note.duration_minutes}m</span>
                          </span>
                        ) : null}
                        {note.status === 'signed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Signed & Locked</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {userIsCoordinator
                          ? 'Clinical note — restricted'
                          : note.content.subjective || note.content.data || 'Review session content...'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {note.signed_at || note.created_at?.split('T')[0] || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Actions for Client
              </h3>
              <div className="space-y-2">
                {!userIsCoordinator && (
                  <>
                    <button
                      onClick={() => onOpenNote(undefined, client.id)}
                      className="w-full py-2 px-3 bg-[#f4f3fe] hover:bg-[#e8e6fd] text-[#392cb3] text-xs font-semibold rounded-xl text-left transition-colors flex items-center justify-between"
                    >
                      <span>Write Clinical Note</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSendAssessment(client.id)}
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl text-left transition-colors flex items-center justify-between"
                    >
                      <span>Send PHQ-9 / GAD-7</span>
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#5749e2]" />
                    </button>
                    <button
                      onClick={() => printClientReport({ clinic, client, notes: sortedNotes, assessments: sortedAssessments, clinician: assignedClinician })}
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl text-left transition-colors flex items-center justify-between"
                    >
                      <span>Print Client Report</span>
                      <Printer className="w-3.5 h-3.5 text-[#5749e2]" />
                    </button>
                  </>
                )}
                {userIsCoordinator && (
                  <p className="text-[11px] text-slate-500">
                    Clinical actions are handled by the assigned psychologist.
                  </p>
                )}
              </div>
            </div>

            {/* DPDP Privacy Badge */}
            <div className="p-4 rounded-2xl bg-[#f4f3fe]/70 border border-[#d4d0fb] text-xs text-[#281e80] space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#5749e2]" />
                <span>DPDP Act (2023) Protected</span>
              </div>
              <p className="text-[11px] text-[#392cb3] leading-relaxed">
                Notes and assessments are only visible to the assigned psychologist and the clinic owner. The client may request data export or erasure at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Session Notes & Clinical Addenda</h2>
            {!userIsCoordinator && (
              <button
                onClick={() => onOpenNote(undefined, client.id)}
                className="px-3.5 py-2 bg-[#5749e2] hover:bg-[#4738cf] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Note</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sortedNotes.length === 0 && (
              <p className="text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl p-6 text-center">No session notes yet.</p>
            )}
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenNote(note.id, client.id)}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-[#5749e2] transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900">
                      {note.template_type} Session Note
                    </span>
                    {note.status === 'signed' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Signed & Locked</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                        Draft (Editable)
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {note.signed_at || note.created_at?.split('T')[0] || ''}
                  </span>
                </div>

                {/* Snippet preview */}
                {userIsCoordinator ? (
                  <div className="text-xs text-slate-500 italic bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Clinical note — restricted</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    {note.content.text && <div className="line-clamp-3 whitespace-pre-line">{note.content.text}</div>}
                    {note.content.data && (
                      <div>
                        <span className="font-bold text-slate-700">Data: </span>
                        <span>{note.content.data}</span>
                      </div>
                    )}
                    {note.content.subjective && (
                      <div>
                        <span className="font-bold text-slate-700">Subjective: </span>
                        <span>{note.content.subjective}</span>
                      </div>
                    )}
                    {note.content.assessment && (
                      <div>
                        <span className="font-bold text-slate-700">Assessment: </span>
                        <span>{note.content.assessment}</span>
                      </div>
                    )}
                    {note.content.plan && (
                      <div>
                        <span className="font-bold text-slate-700">Plan: </span>
                        <span>{note.content.plan}</span>
                      </div>
                    )}
                  </div>
                )}

                {note.status === 'signed' && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    <span>Signed by: {note.signed_by}</span>
                    <span className="font-mono text-[10px]">{note.signature_hash}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ASSESSMENTS */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Psychometric Assessments</h2>
              <p className="text-xs text-slate-500">PHQ-9 (Depression) and GAD-7 (Anxiety) Tracking</p>
            </div>
            <button
              onClick={() => onSendAssessment(client.id)}
              className="px-3.5 py-2 bg-[#5749e2] hover:bg-[#4738cf] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Send Assessment Link</span>
            </button>
          </div>

          <div className="grid gap-4">
            {sortedAssessments.length === 0 && (
              <p className="text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl p-6 text-center">No assessments sent yet.</p>
            )}
            {sortedAssessments.map((ass) => (
              <div
                key={ass.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#f4f3fe] text-[#5749e2] flex items-center justify-center font-bold text-xs">
                      {ass.type}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {ASSESSMENT_DEFINITIONS[ass.type]?.fullName || ass.type}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {ass.completed_at ? `Completed on ${ass.completed_at}` : `Sent on ${ass.sent_at?.split('T')[0] || ''}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    {ass.status === 'completed' ? (
                      <div className="text-right">
                        <span className="text-lg font-extrabold text-slate-900">
                          {ass.score} / {ass.type === 'PHQ9' ? '27' : '21'}
                        </span>
                        <div className="text-xs font-semibold text-[#5749e2]">{ass.severity_band}</div>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                        Link Pending (7-day validity)
                      </span>
                    )}
                  </div>
                </div>

                {ass.status === 'pending' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 font-mono truncate">
                      {new Date(ass.expires_at).getTime() < Date.now()
                        ? 'Link expired \u2014 send a new assessment'
                        : assessmentLink(ass.secure_link_token)}
                    </span>
                    {new Date(ass.expires_at).getTime() >= Date.now() && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(assessmentLink(ass.secure_link_token));
                          alert('Assessment link copied to clipboard!');
                        }}
                        className="text-xs font-semibold text-[#5749e2] hover:underline shrink-0 inline-flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DPDP CONSENT AUDIT HISTORY */}
      {activeTab === 'consent' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 text-[#5749e2] text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>DPDP Act (2023) Section 6 & 11 Audit Trail</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Immutable Consent Ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Under Indian DPDP requirements, consent records are strictly append-only. Withdrawals generate new audit rows and never delete historical consent tokens.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5">Purpose</th>
                  <th className="py-2.5">Version</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Granted / Withdrawn At</th>
                  <th className="py-2.5">IP / Source</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consentRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No consent records yet.
                    </td>
                  </tr>
                )}
                {consentRecords.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-semibold text-slate-800">{c.purpose}</td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">{c.consent_text_version}</td>
                    <td className="py-3">
                      {c.status === 'granted' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          Granted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
                          Withdrawn
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-600 text-[11px]">
                      {c.granted_at || c.withdrawn_at || '\u2014'}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px]">{c.ip_address}</td>
                    <td className="py-3 text-right">
                      {c.status === 'granted' && (
                        <button
                          onClick={() => handleWithdrawConsent(c.purpose)}
                          disabled={withdrawing}
                          className="text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dangerous Zone for DPDP Erasure */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
              Data Subject Rights (DPDP Statutory Actions)
            </h3>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">Right to Erasure (DPDP Section 12)</div>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-xl">
                  Purges all client personal contact data (phone, email, emergency contacts) and anonymizes notes to comply with mandatory clinical record retention guidelines.
                </p>
                {!userIsOwner && (
                  <p className="text-[10px] text-amber-700 font-semibold mt-1">
                    Note: DPDP Right to Erasure execution is restricted to the Clinic Owner (Data Fiduciary).
                  </p>
                )}
              </div>
              {userIsOwner ? (
                <button
                  onClick={handleExecuteErasure}
                  disabled={erasing || client.anonymized}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{client.anonymized ? 'Already Erased' : 'Execute Erasure'}</span>
                </button>
              ) : (
                <div className="px-3 py-1.5 bg-slate-200/70 text-slate-500 text-xs font-medium rounded-xl shrink-0 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  <span>Owner Only</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
