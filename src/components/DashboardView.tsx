import { User, Client, SessionNote, Assessment } from '../types';
import { Users, FileText, ClipboardList } from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  clients: Client[];
  sessionNotes: SessionNote[];
  assessments: Assessment[];
  onViewClients: () => void;
  onViewReports: () => void;
}

export default function DashboardView({
  currentUser,
  clients,
  sessionNotes,
  assessments,
  onViewClients,
  onViewReports
}: DashboardViewProps) {
  const activeClients = clients.filter(c => c.status === 'active' && c.assigned_clinician_id === currentUser.id).length;
  const pendingAssessments = assessments.filter(a => a.status === 'pending').length;
  const totalNotes = sessionNotes.filter(n => n.clinician_id === currentUser.id).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name}!</h2>
        <p className="text-gray-600 mt-1">Manage your clients, track session notes, and send assessments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeClients}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Session Notes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalNotes}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Assessments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pendingAssessments}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onViewClients}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Clients</h3>
              <p className="text-gray-600 text-sm">Add and view client information</p>
            </div>
          </div>
        </button>

        <button
          onClick={onViewReports}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Reports</h3>
              <p className="text-gray-600 text-sm">Review session notes and assessments</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
