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
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentView('dashboard');
        // Fetch data from API if user is already logged in
        fetchInitialData(user);
      } catch (err) {
        console.error('Failed to restore user session:', err);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const fetchInitialData = async (user: User) => {
    setIsLoading(true);
    try {
      const clientsResponse = await apiClient.getClients();
      if (clientsResponse.success && clientsResponse.data) {
        setClients(clientsResponse.data);
      }

      const reportsResponse = await apiClient.getReports();
      if (reportsResponse.success && reportsResponse.data) {
        // Extract session notes and assessments from reports if available
        setSessionNotes([]);
        setAssessments([]);
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.authToken) {
      apiClient.setToken(user.authToken);
    }
    setCurrentView('dashboard');
    fetchInitialData(user);
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    apiClient.clearToken();
    localStorage.removeItem('currentUser');
    setClients([]);
    setSessionNotes([]);
    setAssessments([]);
    setCurrentView('login');
  };

  const handleAddClient = async (client: Client) => {
    setIsLoading(true);
    try {
      const response = await apiClient.createClient(client);
      if (response.success && response.data) {
        setClients([...clients, response.data]);
      }
    } catch (err) {
      console.error('Failed to add client:', err);
      setClients([...clients, client]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setIsLoading(true);
    try {
      const response = await apiClient.updateClient(updatedClient.id, updatedClient);
      if (response.success) {
        setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      }
    } catch (err) {
      console.error('Failed to update client:', err);
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSessionNote = async (note: SessionNote) => {
    setIsLoading(true);
    try {
      const response = await apiClient.createSessionNote(note.client_id, note);
      if (response.success && response.data) {
        setSessionNotes([...sessionNotes, response.data]);
      }
    } catch (err) {
      console.error('Failed to add session note:', err);
      setSessionNotes([...sessionNotes, note]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAssessment = async (assessment: Assessment) => {
    setIsLoading(true);
    try {
      const response = await apiClient.sendAssessment(assessment.client_id, assessment);
      if (response.success && response.data) {
        setAssessments([...assessments, response.data]);
      }
    } catch (err) {
      console.error('Failed to add assessment:', err);
      setAssessments([...assessments, assessment]);
    } finally {
      setIsLoading(false);
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
