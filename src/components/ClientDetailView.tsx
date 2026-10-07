import { useState } from 'react';
import { User, Client, SessionNote, Assessment } from '../types';
import { ArrowLeft, Plus } from 'lucide-react';

interface ClientDetailViewProps {
  client: Client;
  currentUser: User;
  sessionNotes: SessionNote[];
  assessments: Assessment[];
  onBack: () => void;
  onAddNote: (note: SessionNote) => void;
  onEditNote: (note: SessionNote) => void;
  onAddAssessment: (assessment: Assessment) => void;
  onUpdateClient: (client: Client) => void;
}

export default function ClientDetailView({
  client,
  currentUser,
  sessionNotes,
  assessments,
  onBack,
  onAddNote,
  onEditNote,
  onAddAssessment
}: ClientDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'assessments'>('info');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </button>

      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
        <p className="text-gray-600 mt-1">{client.email} · {client.phone}</p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{client.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Consent</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{client.consent_status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Session Notes</p>
            <p className="text-lg font-semibold text-gray-900">{sessionNotes.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase">Assessments</p>
            <p className="text-lg font-semibold text-gray-900">{assessments.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'notes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Session Notes
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'assessments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assessments
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Personal Information</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="text-gray-900">{client.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="text-gray-900">{client.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Date of Birth</dt>
                      <dd className="text-gray-900">{new Date(client.date_of_birth).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Age Group</dt>
                      <dd className="text-gray-900">{client.is_minor ? 'Minor (under 18)' : 'Adult'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Name</dt>
                      <dd className="text-gray-900">{client.emergency_contact_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="text-gray-900">{client.emergency_contact_phone}</dd>
                    </div>
                    {client.is_minor && client.guardian_name && (
                      <>
                        <div>
                          <dt className="text-sm text-gray-500">Guardian</dt>
                          <dd className="text-gray-900">{client.guardian_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Guardian Contact</dt>
                          <dd className="text-gray-900">{client.guardian_contact}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">Session Notes ({sessionNotes.length})</h4>
                <button
                  onClick={() => {
                    const newNote: SessionNote = {
                      id: 'note_' + Math.random().toString(36).substr(2, 9),
                      client_id: client.id,
                      clinician_id: currentUser.id,
                      template_type: 'SOAP',
                      content: {},
                      status: 'draft',
                      addenda: [],
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    onAddNote(newNote);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </button>
              </div>

              {sessionNotes.length > 0 ? (
                <div className="space-y-3">
                  {sessionNotes.map(note => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow transition cursor-pointer" onClick={() => onEditNote(note)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {note.template_type} Note
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          note.status === 'signed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {note.status}
                        </span>
                      </div>
                      {note.content.free_text && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{note.content.free_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No session notes yet.</p>
              )}
            </div>
          )}

          {activeTab === 'assessments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">Assessments ({assessments.length})</h4>
                <button
                  onClick={() => {
                    const types: Array<'PHQ9' | 'GAD7' | 'PCL5' | 'WHO5' | 'YBOCS'> = ['PHQ9', 'GAD7', 'PCL5', 'WHO5', 'YBOCS'];
                    const newAssessment: Assessment = {
                      id: 'assessment_' + Math.random().toString(36).substr(2, 9),
                      client_id: client.id,
                      clinician_id: currentUser.id,
                      type: types[Math.floor(Math.random() * types.length)],
                      sent_at: new Date().toISOString(),
                      secure_link_token: Math.random().toString(36).substr(2, 9),
                      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      status: 'pending',
                    };
                    onAddAssessment(newAssessment);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Send Assessment
                </button>
              </div>

              {assessments.length > 0 ? (
                <div className="space-y-3">
                  {assessments.map(assessment => (
                    <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{assessment.type}</p>
                          <p className="text-sm text-gray-600">
                            Sent: {new Date(assessment.sent_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          assessment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assessment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assessment.status}
                        </span>
                      </div>
                      {assessment.status === 'completed' && assessment.score && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-900">Score: <span className="font-semibold">{assessment.score}</span></p>
                          {assessment.severity_band && (
                            <p className="text-gray-600">Severity: {assessment.severity_band}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 py-8 text-center">No assessments yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
