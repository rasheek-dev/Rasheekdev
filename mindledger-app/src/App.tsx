import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, LogOut, AlertTriangle } from 'lucide-react';
import { Clinic, User, isPsychologist, isCoordinator, isOwner } from './types';
import { isConfigured, config } from './lib/firebase';
import * as api from './lib/api';
import type { ClinicData, SessionState } from './lib/api';

import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ClientDetailView } from './components/ClientDetailView';
import { SessionNoteEditor } from './components/SessionNoteEditor';
import { AssessmentsView } from './components/AssessmentsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PublicAssessment } from './components/PublicAssessment';
import { DataRightsModal } from './components/DataRightsModal';
import { NewClientModal } from './components/NewClientModal';
import { SignupPage } from './components/SignupPage';
import { LoginPage } from './components/LoginPage';

type Tab = 'dashboard' | 'clients' | 'client-detail' | 'note-editor' | 'assessments' | 'reports' | 'settings';

const BASE = import.meta.env.BASE_URL;
const TAB_PATHS: Tab[] = ['dashboard', 'clients', 'assessments', 'reports', 'settings'];

function currentPath(): string {
  const p = window.location.pathname;
  return (p.startsWith(BASE) ? p.slice(BASE.length) : p.replace(/^\//, '')).replace(/\/$/, '');
}

function navigate(path: string) {
  const target = `${BASE}${path}`;
  if (window.location.pathname !== target) window.history.pushState(null, '', target);
}

const EMPTY_DATA: Omit<ClinicData, 'clinic'> = {
  users: [],
  clients: [],
  notes: [],
  assessments: [],
  consentRecords: [],
  dpdpRequests: [],
};

function FullScreenMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#5749e2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    const onPop = () => setPath(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (!isConfigured) {
    return (
      <FullScreenMessage title="MindLedger is not connected yet">
        <p>
          Open <code className="bg-slate-100 px-1 rounded">config.js</code> in this folder on your server and paste your
          Firebase web app settings into it, then reload this page.
        </p>
      </FullScreenMessage>
    );
  }

  if (path.startsWith('assessment/')) {
    return <PublicAssessment token={path.slice('assessment/'.length)} />;
  }

  return <ClinicApp path={path} setPath={setPath} />;
}

function ClinicApp({ path, setPath }: { path: string; setPath: (p: string) => void }) {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => api.watchSession(setSession), []);

  const go = (p: string) => {
    navigate(p);
    setPath(p);
  };

  if (!session) return <Spinner label="Opening MindLedger..." />;

  if (session.status === 'removed') {
    return (
      <FullScreenMessage title="Your access has been removed">
        <p>
          The account <strong>{session.email}</strong> is no longer part of a clinic on MindLedger. Please contact your clinic
          owner if you think this is a mistake.
        </p>
        <button
          onClick={() => api.signOut()}
          className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </FullScreenMessage>
    );
  }

  if (session.status === 'signed-out') {
    if (path === 'signup' && config?.allowSignup !== false) {
      return <SignupPage onSignupSuccess={() => go('dashboard')} onNavigateToLogin={() => go('login')} />;
    }
    return (
      <LoginPage
        allowSignup={config?.allowSignup !== false}
        onLoginSuccess={() => go('dashboard')}
        onNavigateToSignup={() => go('signup')}
      />
    );
  }

  return <Workspace key={session.user.id} user={session.user} initialClinic={session.clinic} path={path} go={go} />;
}

function Workspace({
  user,
  initialClinic,
  path,
  go,
}: {
  user: User;
  initialClinic: Clinic;
  path: string;
  go: (p: string) => void;
}) {
  const [clinic, setClinic] = useState<Clinic>(initialClinic);
  const [data, setData] = useState(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedNoteId, setSelectedNoteId] = useState<string | undefined>();
  const [editorSession, setEditorSession] = useState(0);
  const [assessmentClientId, setAssessmentClientId] = useState<string | undefined>();
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDataRightsModal, setShowDataRightsModal] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(102);

  const userIsPsychologist = isPsychologist(user.role);
  const userIsCoordinator = isCoordinator(user.role);
  const userIsOwner = isOwner(user.role);

  useEffect(() => {
    if (!headerRef.current) return;
    const update = () => headerRef.current && setHeaderHeight(headerRef.current.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const result = await api.loadClinicData();
      setClinic(result.clinic);
      setData({
        users: result.users,
        clients: result.clients,
        notes: result.notes,
        assessments: result.assessments,
        consentRecords: result.consentRecords,
        dpdpRequests: result.dpdpRequests,
      });
      setLoadError(null);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep the address bar in step with the main sections.
  useEffect(() => {
    const allowed = (t: Tab) => {
      if (t === 'reports' || t === 'settings') return userIsOwner;
      if (t === 'assessments') return !userIsCoordinator;
      return true;
    };
    const fromPath = TAB_PATHS.find((t) => t === path);
    if (fromPath && allowed(fromPath)) setActiveTab(fromPath);
    else if (!['client-detail', 'note-editor'].includes(activeTab)) setActiveTab('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (TAB_PATHS.includes(tab)) go(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('client-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNote = (noteId?: string, clientId?: string) => {
    if (clientId) setSelectedClientId(clientId);
    setSelectedNoteId(noteId);
    setEditorSession((n) => n + 1);
    setActiveTab('note-editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendAssessment = (clientId?: string) => {
    setAssessmentClientId(clientId);
    switchTab('assessments');
  };

  const handleLogout = async () => {
    await api.signOut();
    go('login');
  };

  const handleUpdateClinic = async (updated: Partial<Clinic>) => {
    const saved = await api.updateClinic(updated);
    setClinic(saved);
  };

  const { users, clients, notes, assessments, consentRecords, dpdpRequests } = data;
  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientNotes = notes.filter((n) => n.client_id === activeClient?.id);
  const clientAssessments = assessments.filter((a) => a.client_id === activeClient?.id);
  const clientConsents = consentRecords.filter((c) => c.client_id === activeClient?.id);
  const activeNote = notes.find((n) => n.id === selectedNoteId);
  const clinicians = users.filter((u) => u.role === 'clinician' || u.role === 'psychologist' || u.role === 'owner');

  if (!loaded) return <Spinner label="Loading your practice..." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#f4f3fe] selection:text-[#5749e2]">
      <div ref={headerRef} className="sticky top-0 z-40 bg-white shadow-xs">
        <header className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs px-3 sm:px-6 py-2 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-[#5749e2] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                ML
              </div>
              <span className="font-bold text-white tracking-wide truncate">MindLedger &bull; {clinic.name}</span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-[11px] text-[#fd2a83]">DPDP Act (2023) Ready</span>
            </div>
            <button
              onClick={() => setShowDataRightsModal(true)}
              className="px-2.5 py-1 rounded-lg font-semibold text-emerald-400 hover:bg-slate-800 transition-all flex items-center gap-1 text-[11px] shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Rights</span>
            </button>
          </div>
        </header>

        <Navigation
          clinic={clinic}
          currentUser={user}
          onOpenDataRights={() => setShowDataRightsModal(true)}
          onNewClient={userIsPsychologist ? undefined : () => setShowClientModal(true)}
          onSendAssessment={userIsCoordinator ? undefined : () => handleSendAssessment()}
          onLogout={handleLogout}
        />
      </div>

      {loadError && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800 flex items-center justify-between gap-3">
            <span>Could not load your clinic data: {loadError}</span>
            <button onClick={loadData} className="font-semibold underline shrink-0">
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8 items-start">
          <div className="w-60 shrink-0 hidden md:block sticky self-start z-10" style={{ top: `${headerHeight + 24}px` }}>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(t: Tab) => switchTab(t)}
              currentUser={user}
              clinic={clinic}
              headerHeight={headerHeight}
              onOpenDataRights={() => setShowDataRightsModal(true)}
              onLogout={handleLogout}
            />
          </div>

          <main className="flex-1 min-w-0">
            <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-3 mb-4 border-b border-slate-200 text-xs">
              {(userIsPsychologist
                ? [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'clients', label: 'My Clients' },
                    { id: 'assessments', label: 'Assessments' },
                  ]
                : userIsCoordinator
                ? [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'clients', label: 'Clients' },
                  ]
                : [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'clients', label: 'Clients' },
                    { id: 'assessments', label: 'Assessments' },
                    { id: 'reports', label: 'Reports' },
                    { id: 'settings', label: 'Settings' },
                  ]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id as Tab)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    activeTab === t.id ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
              <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-rose-600">
                Sign out
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <DashboardView
                clients={clients}
                notes={notes}
                assessments={assessments}
                currentUser={user}
                allUsers={users}
                clinic={clinic}
                onSelectClient={handleSelectClient}
                onOpenNote={handleOpenNote}
                onNewClient={() => setShowClientModal(true)}
                onSendAssessment={() => handleSendAssessment()}
                onGoToAssessments={() => switchTab('assessments')}
                onGoToClients={() => switchTab('clients')}
                onGoToReports={() => switchTab('reports')}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView
                clients={clients}
                allUsers={users}
                currentUser={user}
                onSelectClient={handleSelectClient}
                onNewClient={() => setShowClientModal(true)}
              />
            )}

            {activeTab === 'client-detail' && activeClient && (
              <ClientDetailView
                client={activeClient}
                notes={clientNotes}
                assessments={clientAssessments}
                consentRecords={clientConsents}
                allUsers={users}
                clinic={clinic}
                currentUser={user}
                onBack={() => switchTab('clients')}
                onOpenNote={handleOpenNote}
                onSendAssessment={handleSendAssessment}
                onRefreshData={loadData}
              />
            )}

            {activeTab === 'note-editor' && activeClient && (
              <SessionNoteEditor
                key={editorSession}
                note={activeNote}
                client={activeClient}
                currentUser={user}
                onBack={() => setActiveTab('client-detail')}
                onSave={(saved) => {
                  setSelectedNoteId(saved.id);
                  setData((prev) => ({
                    ...prev,
                    notes: [saved, ...prev.notes.filter((n) => n.id !== saved.id)],
                  }));
                }}
              />
            )}

            {activeTab === 'assessments' && (
              <AssessmentsView
                assessments={assessments}
                clients={clients}
                currentUser={user}
                initialClientId={assessmentClientId}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'reports' && userIsOwner && (
              <ReportsView clinic={clinic} users={users} clients={clients} notes={notes} assessments={assessments} />
            )}

            {activeTab === 'settings' && userIsOwner && (
              <SettingsView
                clinic={clinic}
                allUsers={users}
                currentUser={user}
                dpdpRequests={dpdpRequests}
                onUpdateClinic={handleUpdateClinic}
                onRefresh={loadData}
              />
            )}
          </main>
        </div>
      </div>

      {showClientModal && !userIsPsychologist && (
        <NewClientModal
          clinicians={clinicians}
          onClose={() => setShowClientModal(false)}
          onSuccess={(client) => {
            setShowClientModal(false);
            loadData();
            handleSelectClient(client.id);
          }}
        />
      )}

      {showDataRightsModal && (
        <DataRightsModal
          clients={clients}
          clinic={clinic}
          onClose={() => setShowDataRightsModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
