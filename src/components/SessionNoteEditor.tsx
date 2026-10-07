import { useState } from 'react';
import { SessionNote } from '../types';
import { X } from 'lucide-react';

interface SessionNoteEditorProps {
  note: SessionNote;
  onClose: () => void;
  onSave: (note: SessionNote) => void;
}

export default function SessionNoteEditor({ note, onClose, onSave }: SessionNoteEditorProps) {
  const [content, setContent] = useState(note.content);
  const [templateType, setTemplateType] = useState(note.template_type);
  const [privateNotes, setPrivateNotes] = useState(note.private_notes || '');

  const handleSave = () => {
    onSave({
      ...note,
      template_type: templateType,
      content,
      private_notes: privateNotes,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Note</h3>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(note.created_at).toLocaleDateString()} · {templateType}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Note Template</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as SessionNote['template_type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="SOAP">SOAP (Subjective, Objective, Assessment, Plan)</option>
              <option value="DAP">DAP (Data, Assessment, Plan)</option>
              <option value="free_text">Free Text</option>
            </select>
          </div>

          <div className="space-y-4">
            {templateType === 'SOAP' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                  <textarea
                    value={content.subjective || ''}
                    onChange={(e) => setContent({ ...content, subjective: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Client's subjective report..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <textarea
                    value={content.objective || ''}
                    onChange={(e) => setContent({ ...content, objective: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Clinician's observations..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                  <textarea
                    value={content.assessment || ''}
                    onChange={(e) => setContent({ ...content, assessment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Clinical assessment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <textarea
                    value={content.plan || ''}
                    onChange={(e) => setContent({ ...content, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Treatment plan..."
                  />
                </div>
              </>
            )}

            {templateType === 'DAP' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <textarea
                    value={content.data || ''}
                    onChange={(e) => setContent({ ...content, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Session data and observations..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                  <textarea
                    value={content.assessment || ''}
                    onChange={(e) => setContent({ ...content, assessment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Clinical assessment..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <textarea
                    value={content.plan || ''}
                    onChange={(e) => setContent({ ...content, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Treatment plan..."
                  />
                </div>
              </>
            )}

            {templateType === 'free_text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
                <textarea
                  value={content.free_text || ''}
                  onChange={(e) => setContent({ ...content, free_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-48"
                  placeholder="Free-form session notes..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes (clinician only)</label>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 h-20"
                placeholder="These notes are only visible to you..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
