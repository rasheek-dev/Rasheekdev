import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { SessionNote, Client, User, WebSession, isPsychologist, isCoordinator } from '../types';
import { SessionDurationTimer } from './SessionDurationTimer';
import { saveNote, signNote, addAddendum } from '../lib/api';

interface SessionNoteEditorProps {
  note?: SessionNote;
  session?: WebSession;
  client: Client;
  currentUser: User;
  onBack: () => void;
  onSave: (note: SessionNote) => void;
}

export function formatSessionDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export const SessionNoteEditor: React.FC<SessionNoteEditorProps> = (props) => {
  const { client, currentUser, onBack } = props;
  // ROLE-BASED ACCESS CONTROL GUARDS:
  // 1. Client Coordinator cannot access clinical session notes
  if (isCoordinator(currentUser.role)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied: Clinical Documentation Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Client Coordinators handle client intake and contact details. Under clinic privacy policies and DPDP rules, clinical session notes are restricted to treating psychologists and clinic owners.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Clinic Workspace</span>
        </button>
      </div>
    );
  }

  // 2. Psychologist can only access clients in their assigned caseload
  if (isPsychologist(currentUser.role) && client.assigned_clinician_id !== currentUser.id) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center ring-8 ring-red-50/50">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied: Caseload Boundary</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You do not have authorization to view or edit clinical session notes for clients outside your assigned caseload.
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

  return <NoteEditorBody {...props} />;
};

const NoteEditorBody: React.FC<SessionNoteEditorProps> = ({ note, session, client, currentUser, onBack, onSave }) => {
  const [currentNote, setCurrentNote] = useState<SessionNote | undefined>(note);

  // Sync state if incoming note prop changes
  React.useEffect(() => {
    if (note) {
      setCurrentNote(note);
      if (note.template_type) {
        setTemplateType(note.template_type === 'free_text' ? 'Free Text' : (note.template_type as any));
      }
      if (note.content?.subjective) setSubjective(note.content.subjective);
      if (note.content?.objective) setObjective(note.content.objective);
      if (note.content?.assessment) setAssessment(note.content.assessment);
      if (note.content?.plan) setPlan(note.content.plan);
      if (note.content?.data) setDataField(note.content.data);
      if (note.content?.text) setFreeText(note.content.text);
      if (note.private_notes) setPrivateNotes(note.private_notes);
      if (note.duration_seconds) setDurationSeconds(note.duration_seconds);
      if (note.duration_minutes) setDurationMinutes(note.duration_minutes);
      if (note.started_at) setStartedAt(note.started_at);
      if (note.ended_at) setEndedAt(note.ended_at);
    }
  }, [note]);

  const isSigned = currentNote?.status === 'signed';

  const [templateType, setTemplateType] = useState<'SOAP' | 'DAP' | 'Free Text'>(
    (note?.template_type === 'free_text' ? 'Free Text' : (note?.template_type as any)) || 'SOAP'
  );

  // SOAP fields
  const [subjective, setSubjective] = useState(note?.content?.subjective || '');
  const [objective, setObjective] = useState(note?.content?.objective || '');
  const [assessment, setAssessment] = useState(note?.content?.assessment || '');
  const [plan, setPlan] = useState(note?.content?.plan || '');

  // DAP fields
  const [dataField, setDataField] = useState(note?.content?.data || '');

  // Free text
  const [freeText, setFreeText] = useState(note?.content?.text || '');

  // Private notes
  const [privateNotes, setPrivateNotes] = useState(note?.private_notes || '');

  // Session duration timer
  const [durationSeconds, setDurationSeconds] = useState<number>(
    note?.duration_seconds || (note?.duration_minutes ? note.duration_minutes * 60 : 0)
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    note?.duration_minutes || (note?.duration_seconds ? Math.round(note.duration_seconds / 60) : 0)
  );
  const [startedAt, setStartedAt] = useState<string>(note?.started_at || '');
  const [endedAt, setEndedAt] = useState<string>(note?.ended_at || '');

  // Addendum
  const [newAddendumText, setNewAddendumText] = useState('');
  const [showAddendumBox, setShowAddendumBox] = useState(false);
  const [savingAddendum, setSavingAddendum] = useState(false);

  // Sign & Lock Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Insert session timing stamp directly into clinical documentation
  const handleInsertStamp = (stampText: string) => {
    if (templateType === 'SOAP') {
      setObjective((prev) => (prev ? `${prev}\n${stampText}` : stampText));
    } else if (templateType === 'DAP') {
      setDataField((prev) => (prev ? `${prev}\n${stampText}` : stampText));
    } else {
      setFreeText((prev) => (prev ? `${prev}\n${stampText}` : stampText));
    }
  };

  const buildFields = (): Partial<SessionNote> => {
    let content: Record<string, string> = {};
    if (templateType === 'SOAP') {
      content = { subjective, objective, assessment, plan };
    } else if (templateType === 'DAP') {
      content = { data: dataField, assessment, plan };
    } else {
      content = { text: freeText };
    }
    return {
      appointment_id: currentNote?.appointment_id || session?.id,
      template_type: templateType,
      content,
      private_notes: privateNotes,
      duration_minutes: durationMinutes,
      duration_seconds: durationSeconds,
      started_at: startedAt,
      ended_at: endedAt,
    };
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const saved = await saveNote(client, currentNote, buildFields());
      setCurrentNote(saved);
      onSave(saved);
      showStatus('success', 'Session note draft and clinical timer saved successfully.');
    } catch (e) {
      showStatus('error', (e as Error).message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleConfirmSign = async () => {
    setSigning(true);
    try {
      const saved = await saveNote(client, currentNote, buildFields());
      setCurrentNote(saved);
      const signed = await signNote(saved);
      setCurrentNote(signed);
      setShowSignModal(false);
      onSave(signed);
      try {
        localStorage.removeItem(`mindledger_timer_${client.id}_${saved.id}`);
        localStorage.removeItem(`mindledger_timer_${client.id}_default`);
      } catch {
        // storage may be unavailable
      }
      showStatus('success', `Note signed by ${currentUser.name} and locked.`);
    } catch (e) {
      setShowSignModal(false);
      showStatus('error', (e as Error).message);
    } finally {
      setSigning(false);
    }
  };

  const handleAddAddendum = async () => {
    if (!currentNote?.id || !newAddendumText.trim()) return;
    setSavingAddendum(true);
    try {
      const updated = await addAddendum(currentNote, newAddendumText);
      setCurrentNote(updated);
      setNewAddendumText('');
      setShowAddendumBox(false);
      onSave(updated);
      showStatus('success', 'Addendum appended to the locked record.');
    } catch (e) {
      showStatus('error', (e as Error).message);
    } finally {
      setSavingAddendum(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Toast Feedback Notification */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client File</span>
        </button>

        <div className="flex items-center gap-2">
          {!isSigned && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                onClick={() => setShowSignModal(true)}
                className="px-4 py-1.5 bg-[#5749e2] hover:bg-[#4738cf] text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign & Lock Note</span>
              </button>
            </>
          )}

          {isSigned && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Signed & Locked</span>
              </span>
              <button
                onClick={() => setShowAddendumBox(true)}
                className="px-3 py-1.5 bg-[#5749e2] hover:bg-[#4738cf] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Addendum</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Note Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Note Metadata Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#5749e2]">Clinical Session Record</div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              {client.name} &bull; {currentNote?.created_at ? currentNote.created_at.split('T')[0] : 'Today'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Clinician: {currentNote?.clinician_name || currentUser.name}
              {currentNote?.status === 'draft' && ' \u2022 Draft (not yet signed)'}
              {session && (
                <>
                  {' \u2022 '}Website session {formatSessionDate(session.date)}, {session.start_time}&ndash;{session.end_time}
                  {session.booking_code ? ` (${session.booking_code})` : ''}
                </>
              )}
            </p>
          </div>

          {/* Template Switcher (Disabled if signed) */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            {(['SOAP', 'DAP', 'Free Text'] as const).map((t) => (
              <button
                key={t}
                disabled={isSigned}
                onClick={() => setTemplateType(t)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  templateType === t
                    ? 'bg-[#5749e2] text-white'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Signed status banner */}
        {isSigned && currentNote && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start justify-between text-xs">
            <div className="space-y-1">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Signed by {currentNote.signed_by || currentUser.name}, {currentNote.signed_at}</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                This clinical record is immutable and locked under DPDP and medical record regulations.
                {currentNote.duration_minutes ? ` Verified contact duration: ${currentNote.duration_minutes} minutes.` : ''} Addenda may be appended below.
              </p>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-emerald-700 pt-1">
                <span>Audit Hash: {currentNote.signature_hash}</span>
                {currentNote.duration_minutes ? (
                  <span className="font-sans font-semibold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                    Clinical Duration: {currentNote.duration_minutes}m actual contact
                  </span>
                ) : null}
              </div>
            </div>
            <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          </div>
        )}

        {/* Clinical Session Duration Timer */}
        <SessionDurationTimer
          initialSeconds={durationSeconds}
          initialStartedAt={startedAt}
          initialEndedAt={endedAt}
          isSigned={isSigned}
          timerKey={currentNote?.id}
          clientId={client.id}
          clientName={client.name}
          onUpdate={({ durationSeconds: sec, durationMinutes: mins, startedAt: start, endedAt: end }) => {
            setDurationSeconds(sec);
            setDurationMinutes(mins);
            if (start) setStartedAt(start);
            if (end) setEndedAt(end);
          }}
          onInsertStamp={handleInsertStamp}
        />

        {/* Template Form Fields */}
        {templateType === 'SOAP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subjective (Client reports, symptoms, history)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Client reports feeling anxious during work meetings..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Objective (Clinician observations, affect, eye contact)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Affect congruent with mood; good eye contact maintained..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assessment (Clinical impressions, DSM/ICD formulations, progress)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Mild-to-moderate generalized anxiety with cognitive distortion..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Plan (Interventions, homework, next scheduled session)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Continue cognitive restructuring worksheets. Next session in 1 week..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>
          </div>
        )}

        {templateType === 'DAP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Data (Subjective reports + Objective behavioral observations)
              </label>
              <textarea
                disabled={isSigned}
                rows={4}
                value={dataField}
                onChange={(e) => setDataField(e.target.value)}
                placeholder="Client reports..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assessment (Clinical formulation and response to interventions)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Clinical impressions..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Plan (Therapeutic homework and next session date)
              </label>
              <textarea
                disabled={isSigned}
                rows={3}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Next steps..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
              />
            </div>
          </div>
        )}

        {templateType === 'Free Text' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Clinical Narrative
            </label>
            <textarea
              disabled={isSigned}
              rows={8}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Record unstructured session documentation..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] disabled:bg-slate-50 disabled:text-slate-700"
            />
          </div>
        )}

        {/* Private Clinician Notes (never exported) */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
            Private Clinician Notes (Confidential &bull; Not Shared)
          </label>
          <textarea
            disabled={isSigned}
            rows={2}
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            placeholder="Personal hypotheses, countertransference observations, supervision notes..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:text-slate-700"
          />
        </div>

        {/* Append-Only Addenda Section (Follow-up Prompt #1) */}
        {currentNote?.addenda && currentNote.addenda.length > 0 && (
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Append-Only Addenda ({currentNote.addenda.length})
            </h3>
            <div className="space-y-2.5">
              {currentNote.addenda.map((addendum) => (
                <div
                  key={addendum.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 pb-1 mb-1">
                    <span className="font-semibold text-slate-700">Addendum by {addendum.added_by}</span>
                    <span>{addendum.added_at}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{addendum.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Addendum Form Box */}
        {showAddendumBox && (
          <div className="p-4 bg-[#f4f3fe]/50 border border-[#d4d0fb] rounded-xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#281e80]">New Clinical Addendum</span>
              <button
                onClick={() => setShowAddendumBox(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            <textarea
              rows={3}
              value={newAddendumText}
              onChange={(e) => setNewAddendumText(e.target.value)}
              placeholder="Enter new relevant clinical details, phone calls, or crisis updates..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#d4d0fb] focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddAddendum}
                disabled={savingAddendum || !newAddendumText.trim()}
                className="px-4 py-2 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {savingAddendum ? 'Appending...' : 'Save & Append Addendum'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Sign & Lock Confirmation Modal (Follow-up Prompt #1) */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Sign & Lock Clinical Note?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action is legally binding and permanently locks this note. Under DPDP and medical record regulations, no further edits will be permitted to the text. Only timestamped append-only addenda may be added later.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div>Signer: <span className="font-semibold text-slate-900">{currentUser.name}</span></div>
              <div>Client: <span className="font-semibold text-slate-900">{client.name}</span></div>
              <div>Audit Trail: <span className="font-mono text-[10px] text-[#5749e2]">SHA-256 fingerprint + timestamp</span></div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSignModal(false)}
                className="w-1/2 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSign}
                disabled={signing}
                className="w-1/2 py-2.5 px-3 rounded-xl bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{signing ? 'Signing...' : 'Confirm & Sign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
