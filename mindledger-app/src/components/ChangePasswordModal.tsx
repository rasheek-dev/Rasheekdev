import React, { useState } from 'react';
import { Key, X } from 'lucide-react';
import { changePassword } from '../lib/api';

export const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError('New password must be at least 8 characters long.');
    if (next !== confirm) return setError('The new passwords do not match.');
    setSaving(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-[#5749e2]" />
            Change Password
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        {done ? (
          <div className="space-y-4 text-xs">
            <p className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              Password changed. Other devices signed in with your account have been signed out.
            </p>
            <button onClick={onClose} className="w-full py-2 bg-slate-900 text-white rounded-xl font-semibold">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl">{error}</div>}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current password</label>
              <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New password (min 8 characters)</label>
              <input type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm new password</label>
              <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
