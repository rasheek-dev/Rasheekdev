import { useState } from 'react';
import { Client, SessionNote, Assessment } from '../types';
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react';

interface ReportsViewProps {
  clients: Client[];
  sessionNotes: SessionNote[];
  assessments: Assessment[];
  onBack: () => void;
}

export default function ReportsView({ clients, sessionNotes, assessments, onBack }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'notes' | 'assessments'>('notes');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const filteredNotes = selectedClient
    ? sessionNotes.filter(n => n.client_id === selectedClient)
    : sessionNotes;

  const filteredAssessments = selectedClient
    ? assessments.filter(a => a.client_id === selectedClient)
    : assessments;

  const clientMap = new Map(clients.map(c => [c.id, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600 mt-1">View all session notes and assessment results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{clients.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Session Notes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{sessionNotes.length}</p>
            </div>
            <FileText className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Assessments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{assessments.length}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setReportType('notes')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  reportType === 'notes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Session Notes
              </button>
              <button
                onClick={() => setReportType('assessments')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  reportType === 'assessments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Assessments
              </button>
            </div>

            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6">
          {reportType === 'notes' && (
            <div>
              {filteredNotes.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotes.map(note => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {clientMap.get(note.client_id)?.name} - {note.template_type}
                          </p>
                          <p className="text-sm text-gray-600">{new Date(note.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          note.status === 'signed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {note.status}
                        </span>
                      </div>

                      {note.content.free_text && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2">
                          {note.content.free_text.substring(0, 200)}...
                        </p>
                      )}

                      {note.template_type === 'SOAP' && note.content.assessment && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-2">
                          <span className="font-semibold">Assessment:</span> {note.content.assessment.substring(0, 200)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No session notes found.</p>
              )}
            </div>
          )}

          {reportType === 'assessments' && (
            <div>
              {filteredAssessments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAssessments.map(assessment => (
                    <div key={assessment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {clientMap.get(assessment.client_id)?.name} - {assessment.type}
                          </p>
                          <p className="text-sm text-gray-600">Sent: {new Date(assessment.sent_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          assessment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assessment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </div>

                      {assessment.status === 'completed' && (
                        <div className="mt-3 bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-900">
                            Score: <span className="font-semibold">{assessment.score}</span>
                            {assessment.severity_band && (
                              <span className="ml-3 text-gray-600">
                                Severity: {assessment.severity_band}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No assessments found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
