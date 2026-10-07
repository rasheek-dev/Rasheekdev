import React, { useState } from 'react';
import { Plus, Send, Shield, Sparkles, ChevronDown, LogOut, ShieldCheck, Key } from 'lucide-react';
import { User, Clinic, isPsychologist, isCoordinator } from '../types';
import { Avatar } from './Avatar';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavigationProps {
  currentUser: User;
  clinic: Clinic;
  onNewClient?: () => void;
  onSendAssessment?: () => void;
  onOpenDataRights?: () => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  clinic,
  onNewClient,
  onSendAssessment,
  onOpenDataRights,
  onLogout,
}) => {
  const [userDropdown, setUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const portalLabel = isPsychologist(currentUser.role)
    ? 'Psychologist Portal'
    : isCoordinator(currentUser.role)
    ? 'Front Desk Portal'
    : 'Clinic Owner Portal';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-[#5749e2]" />
          <span>{portalLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenDataRights && (
          <button
            onClick={onOpenDataRights}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#fd2a83] bg-[#fdf0f6] border border-[#f9b8d6] hover:bg-[#fce2ee] transition-colors"
            title="DPDP Act (2023) data rights"
          >
            <Shield className="w-3.5 h-3.5 text-[#fd2a83]" />
            <span>DPDP Rights</span>
          </button>
        )}

        {onNewClient && (
          <button
            onClick={onNewClient}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">New Client</span>
          </button>
        )}

        {onSendAssessment && (
          <button
            onClick={onSendAssessment}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5749e2] hover:bg-[#4738cf] text-white transition-all shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send Assessment</span>
          </button>
        )}

        {/* Logged-in User Profile Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            type="button"
            onClick={() => setUserDropdown(!userDropdown)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
          >
            <Avatar name={currentUser.name} src={currentUser.avatar_url} />
            <div className="leading-tight hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">
                {currentUser.role === 'owner'
                  ? 'Clinic Owner'
                  : currentUser.role === 'psychologist' || currentUser.role === 'clinician'
                  ? 'Psychologist'
                  : 'Coordinator'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userDropdown && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3.5 text-xs animate-fade-in space-y-3">
              {/* Profile Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <Avatar name={currentUser.name} src={currentUser.avatar_url} className="w-10 h-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.2 rounded-full uppercase bg-[#f4f3fe] text-[#5749e2] border border-[#d4d0fb]">
                    {currentUser.role === 'owner'
                      ? 'Clinic Owner'
                      : currentUser.role === 'psychologist' || currentUser.role === 'clinician'
                      ? 'Psychologist'
                      : 'Client Coordinator'}
                  </span>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="space-y-1.5 text-slate-600 text-[11px]">
                {currentUser.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium text-slate-800">{currentUser.phone}</span>
                  </div>
                )}
                {currentUser.license_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">RCI License:</span>
                    <span className="font-semibold text-slate-800">{currentUser.license_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Practice:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[150px]">{clinic.name}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50/60 p-2 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Stored on your clinic's own server</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserDropdown(false);
                  setShowPasswordModal(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              {/* Log Out Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out / Log Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </header>
  );
};

