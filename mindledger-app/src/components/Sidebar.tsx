import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  Receipt,
  BarChart3,
  Settings,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
  Globe,
  ExternalLink,
  X,
  LogOut,
  User as UserIcon,
  Mail,
  Phone,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { User, Clinic } from '../types';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: any) => void;
  setActiveTab?: (tab: any) => void;
  currentUser: User;
  onLogout?: () => void;
  clinic?: Clinic;
  onOpenDataRights?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  headerHeight?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  currentUser,
  onLogout,
  clinic,
  onOpenDataRights,
  mobileOpen = false,
  onCloseMobile,
  headerHeight = 102,
}) => {
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const selectedTab = currentTab || activeTab || 'dashboard';

  const isOwnerUser = currentUser?.role === 'owner';
  const isCoordinatorUser = currentUser?.role === 'coordinator' || currentUser?.role === 'front_desk';
  const isPsychologistUser = currentUser?.role === 'psychologist' || currentUser?.role === 'clinician';

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    ownerOnly?: boolean;
    lockedRole?: string;
  }

  // Role-tailored navigation items
  const navItems: NavItem[] = isCoordinatorUser
    ? [
        { id: 'dashboard', label: 'Front Desk Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'All Clients', icon: Users },
      ]
    : isPsychologistUser
    ? [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'My Clients', icon: Users },
        { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
      ]
    : [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'All Clients', icon: Users },
        { id: 'assessments', label: 'All Assessments', icon: ClipboardCheck },
        { id: 'reports', label: 'Clinical Reports', icon: BarChart3, ownerOnly: true },
        { id: 'settings', label: 'Clinic Settings', icon: Settings, ownerOnly: true },
      ];

  const handleNavClick = (id: string, lockedRole?: string, ownerOnly?: boolean) => {
    if (lockedRole) {
      alert(`Access Restricted: This module is reserved for ${lockedRole}.`);
      return;
    }
    if (ownerOnly && !isOwnerUser) {
      alert('Access Restricted: This module is reserved for the Clinic Owner.');
      return;
    }
    if (setCurrentTab) setCurrentTab(id);
    if (setActiveTab) setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full max-h-full bg-[#161338] text-slate-200 justify-between select-none overflow-y-auto scrollbar-thin">
      {/* Top Brand */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-5 border-b border-indigo-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5749e2] flex items-center justify-center text-white font-bold shadow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
                MindLedger
                <span className="text-[9px] uppercase font-bold text-[#fd2a83] bg-[#fd2a83]/20 px-1.5 py-0.5 rounded border border-[#fd2a83]/40 font-bold">
                  India
                </span>
              </div>
              <div className="text-[10px] text-indigo-200/70 truncate max-w-[130px]">{clinic?.name || ''}</div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-indigo-300 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isOwner = currentUser?.role === 'owner';
            const isActive = selectedTab === item.id;
            const isLocked = (item.ownerOnly && !isOwner) || Boolean(item.lockedRole);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.lockedRole, item.ownerOnly)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#5749e2] text-white shadow-sm font-semibold'
                    : isLocked
                    ? 'text-indigo-300/40 hover:bg-indigo-950/20'
                    : 'text-indigo-100/80 hover:bg-[#5749e2]/20 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLocked ? 'text-indigo-400/40' : 'text-indigo-300/80'}`} />
                  <span>{item.label}</span>
                </div>
                {item.ownerOnly && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#fd2a83]/20 text-[#fd2a83] border border-[#fd2a83]/40 font-bold uppercase">
                    Owner
                  </span>
                )}
                {item.lockedRole && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                    Locked
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Public link & Role Switcher */}
      <div className="p-3 space-y-2 border-t border-indigo-900/50">
        {/* Quick Public Links */}
        <div className="px-2 py-1.5 bg-[#100d28]/70 rounded-xl border border-indigo-900/50 space-y-1">
          <button
            onClick={onOpenDataRights}
            className="w-full text-left flex items-center justify-between text-[11px] text-indigo-200 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#fd2a83]" />
              <span>DPDP Compliance</span>
            </span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Current User Profile Card & Logout (Exclusive to logged-in user) */}
        <div className="bg-[#100d28]/80 border border-indigo-800/60 rounded-xl p-2.5 space-y-2.5">
          {/* User Profile Summary Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={currentUser.name} src={currentUser.avatar_url} />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-indigo-300 font-medium truncate">
                  {currentUser.role === 'owner'
                    ? 'Clinic Owner'
                    : currentUser.role === 'psychologist' || currentUser.role === 'clinician'
                    ? 'Psychologist'
                    : 'Client Coordinator'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setProfileModalOpen(!profileModalOpen)}
              className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 transition-colors"
              title="View your profile details"
            >
              {profileModalOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#fd2a83]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>
          </div>

          {/* User's Own Profile Details (Toggled or Expanded) */}
          {profileModalOpen && (
            <div className="pt-2 border-t border-indigo-900/60 text-[11px] space-y-1.5 animate-fade-in text-indigo-200">
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 text-[10px]">Email:</span>
                <span className="text-white font-medium truncate max-w-[130px]">{currentUser.email}</span>
              </div>
              {currentUser.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 text-[10px]">Phone:</span>
                  <span className="text-white font-medium">{currentUser.phone}</span>
                </div>
              )}
              {currentUser.license_number && (
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 text-[10px]">RCI License:</span>
                  <span className="text-amber-300 font-medium">{currentUser.license_number}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-indigo-400 text-[10px]">Clinic:</span>
                <span className="text-white font-medium truncate max-w-[130px]">{clinic?.name || 'MindLedger'}</span>
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[9px] text-emerald-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Stored on your clinic's server</span>
                </span>
              </div>
            </div>
          )}

          {/* Logout Action Button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Card */}
      <aside
        className="hidden md:flex flex-col w-full min-h-[460px] rounded-2xl overflow-hidden border border-indigo-900/50 shadow-sm bg-[#161338]"
        style={{
          height: `calc(100vh - ${headerHeight + 48}px)`,
          maxHeight: '850px',
        }}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 h-full z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
