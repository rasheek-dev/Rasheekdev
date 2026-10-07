import { useState, useEffect } from 'react';
import { User, Client, SessionNote, Assessment } from './types';
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import ClientDetailView from './components/ClientDetailView';
import SessionNoteEditor from './components/SessionNoteEditor';
import ReportsView from './components/ReportsView';
import Navigation from './components/Navigation';

type View = 'login' | 'dashboard' | 'clients' | 'client-detail' | 'session-note' | 'reports';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }

    const savedClients = localStorage.getItem('clients');
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }

    const savedNotes = localStorage.getItem('sessionNotes');
    if (savedNotes) {
      setSessionNotes(JSON.parse(savedNotes));
    }

    const savedAssessments = localStorage.getItem('assessments');
    if (savedAssessments) {
      setAssessments(JSON.parse(savedAssessments));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (sessionNotes.length > 0) {
      localStorage.setItem('sessionNotes', JSON.stringify(sessionNotes));
    }
  }, [sessionNotes]);

  useEffect(() => {
    if (assessments.length > 0) {
      localStorage.setItem('assessments', JSON.stringify(assessments));
    }
  }, [assessments]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('login');
  };

  const handleAddClient = (client: Client) => {
    setClients([...clients, client]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleAddSessionNote = (note: SessionNote) => {
    setSessionNotes([...sessionNotes, note]);
  };

  const handleAddAssessment = (assessment: Assessment) => {
    setAssessments([...assessments, assessment]);
  };

  const handleViewClientDetail = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('client-detail');
  };

  const handleEditSessionNote = (note: SessionNote) => {
    setSelectedNote(note);
    setCurrentView('session-note');
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setCurrentView('clients');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
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
            onBack={handleBackToClients}
            onAddNote={handleAddSessionNote}
            onEditNote={handleEditSessionNote}
            onAddAssessment={handleAddAssessment}
            onUpdateClient={handleUpdateClient}
          />
        )}

        {currentView === 'session-note' && selectedNote && (
          <SessionNoteEditor
            note={selectedNote}
            onClose={handleBackToDashboard}
            onSave={() => handleBackToDashboard()}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            clients={clients}
            sessionNotes={sessionNotes}
            assessments={assessments}
            onBack={handleBackToDashboard}
          />
        )}
      </main>
    </div>
  );
}
