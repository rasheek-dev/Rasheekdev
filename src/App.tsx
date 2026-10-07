import { useState, useEffect } from 'react';
import { User, Client, SessionNote, Assessment } from './types';
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import ClientDetailView from './components/ClientDetailView';
import SessionNoteEditor from './components/SessionNoteEditor';
import ReportsView from './components/ReportsView';
import Navigation from './components/Navigation';
import { apiClient } from './api/client';

type View = 'login' | 'dashboard' | 'clients' | 'client-detail' | 'session-note' | 'reports';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return;
    try {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
      fetchInitialData();
    } catch {
      localStorage.removeItem('currentUser');
    }
  }, []);

  const resetSession = () => {
    setCurrentUser(null);
    apiClient.clearToken();
    localStorage.removeItem('currentUser');
    setClients([]);
    setSessionNotes([]);
    setAssessments([]);
    setCurrentView('login');
  };

  const fetchInitialData = async () => {
    const response = await apiClient.getReports();
    if (response.success && response.data) {
      setClients(response.data.clients as Client[]);
      setSessionNotes(response.data.notes as SessionNote[]);
      setAssessments(response.data.assessments as Assessment[]);
    } else if (response.error === 'Not authenticated') {
      resetSession();
    } else {
      alert(response.error || 'Failed to load data');
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify({ ...user, authToken: undefined }));
    setCurrentView('dashboard');
    fetchInitialData();
  };

  const handleLogout = async () => {
    await apiClient.logout();
    resetSession();
  };

  const handleAddClient = async (client: Client) => {
    const response = await apiClient.createClient(client);
    if (response.success && response.data) {
      setClients(prev => [...prev, response.data as Client]);
    } else {
      alert(response.error || 'Failed to add client');
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    const response = await apiClient.updateClient(updatedClient.id, updatedClient);
    if (response.success && response.data) {
      const saved = response.data as Client;
      setClients(prev => prev.map(c => (c.id === saved.id ? saved : c)));
      setSelectedClient(saved);
    } else {
      alert(response.error || 'Failed to update client');
    }
  };

  const handleAddSessionNote = async (note: SessionNote) => {
    const response = await apiClient.createSessionNote(note.client_id, note);
    if (response.success && response.data) {
      const saved = response.data as SessionNote;
      setSessionNotes(prev => [...prev, saved]);
      setSelectedNote(saved);
      setCurrentView('session-note');
    } else {
      alert(response.error || 'Failed to add session note');
    }
  };

  const handleSaveSessionNote = async (note: SessionNote) => {
    const response = await apiClient.updateSessionNote(note.client_id, note.id, note);
    if (response.success && response.data) {
      const saved = response.data as SessionNote;
      setSessionNotes(prev => prev.map(n => (n.id === saved.id ? saved : n)));
      setSelectedNote(null);
      setCurrentView(selectedClient ? 'client-detail' : 'dashboard');
    } else {
      alert(response.error || 'Failed to save session note');
    }
  };

  const handleAddAssessment = async (assessment: Assessment) => {
    const response = await apiClient.sendAssessment(assessment.client_id, assessment);
    if (response.success && response.data) {
      setAssessments(prev => [...prev, response.data as Assessment]);
    } else {
      alert(response.error || 'Failed to add assessment');
    }
  };

  const handleViewClientDetail = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('client-detail');
  };

  const handleEditSessionNote = (note: SessionNote) => {
    setSelectedNote(note);
    setCurrentView('session-note');
  };

  const handleCloseNote = () => {
    setSelectedNote(null);
    setCurrentView(selectedClient ? 'client-detail' : 'dashboard');
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentUser={currentUser} currentView={currentView} onLogout={handleLogout} />

      <main className="pt-16">
        {currentView === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            clients={clients}
            sessionNotes={sessionNotes}
            assessments={assessments}
            onViewClients={() => setCurrentView('clients')}
            onViewReports={() => setCurrentView('reports')}
          />
        )}

        {currentView === 'clients' && (
          <ClientsView
            currentUser={currentUser}
            clients={clients}
            onAddClient={handleAddClient}
            onSelectClient={handleViewClientDetail}
          />
        )}

        {currentView === 'client-detail' && selectedClient && (
          <ClientDetailView
            client={selectedClient}
            currentUser={currentUser}
            sessionNotes={sessionNotes.filter(n => n.client_id === selectedClient.id)}
            assessments={assessments.filter(a => a.client_id === selectedClient.id)}
            onBack={() => {
              setSelectedClient(null);
              setCurrentView('clients');
            }}
            onAddNote={handleAddSessionNote}
            onEditNote={handleEditSessionNote}
            onAddAssessment={handleAddAssessment}
            onUpdateClient={handleUpdateClient}
          />
        )}

        {currentView === 'session-note' && selectedNote && (
          <SessionNoteEditor note={selectedNote} onClose={handleCloseNote} onSave={handleSaveSessionNote} />
        )}

        {currentView === 'reports' && (
          <ReportsView
            clients={clients}
            sessionNotes={sessionNotes}
            assessments={assessments}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
