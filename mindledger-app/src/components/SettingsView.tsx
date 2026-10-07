import React, { useState, useRef } from 'react';
import {
  Building2,
  CreditCard,
  ShieldCheck,
  Users,
  Save,
  CheckCircle2,
  Lock,
  IndianRupee,
  Plus,
  X,
  UserPlus,
  Upload,
  Trash2,
  Camera,
  User as UserIcon,
  Eye,
  EyeOff,
  Key,
  AlertTriangle,
  AtSign,
} from 'lucide-react';
import { Clinic, DPDPRequest, User, isOwner } from '../types';
import { addStaff, removeStaff, completeDpdpRequest, resetStaffPassword } from '../lib/api';
import { Avatar } from './Avatar';

// Shrinks a photo to a small square JPEG so it fits comfortably in the staff record.
function resizeImage(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image file.'));
    };
    img.src = url;
  });
}

interface SettingsViewProps {
  clinic: Clinic;
  allUsers: User[];
  currentUser: User;
  dpdpRequests: DPDPRequest[];
  onUpdateClinic: (updated: Partial<Clinic>) => Promise<void>;
  onRefresh?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const userIsOwner = isOwner(props.currentUser.role);

  // Settings are strictly restricted to Clinic Owners
  if (!userIsOwner) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted: Settings Restricted to Clinic Owner</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Clinic profile, DPDP Grievance Officer details and staff accounts may only be modified by the Clinic Owner.
        </p>
      </div>
    );
  }

  return <SettingsBody {...props} />;
};

const SettingsBody: React.FC<SettingsViewProps> = ({
  clinic,
  allUsers,
  currentUser,
  dpdpRequests,
  onUpdateClinic,
  onRefresh,
}) => {
  const userIsOwner = true;
  const [clinicName, setClinicName] = useState(clinic.name || '');
  const [address, setAddress] = useState(clinic.address || '');
  const [clinicPhone, setClinicPhone] = useState(clinic.phone || '');
  const [grievancePhone, setGrievancePhone] = useState(clinic.consent_officer_phone || '');
  const [grievanceOfficer, setGrievanceOfficer] = useState(clinic.dpdp_officer_name || clinic.consent_officer_name || '');
  const [grievanceEmail, setGrievanceEmail] = useState(clinic.dpdp_officer_email || clinic.consent_officer_email || '');
  
  // Add Staff Member Modal / State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'clinician' | 'front_desk'>('clinician');
  const [newStaffLicense, setNewStaffLicense] = useState('');
  const [newStaffAvatar, setNewStaffAvatar] = useState<string>('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffAddError, setStaffAddError] = useState<string | null>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Staff Deletion State
  const [staffToDelete, setStaffToDelete] = useState<User | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);
  const [staffDeleteError, setStaffDeleteError] = useState<string | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStaffAddError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    resizeImage(file)
      .then((dataUrl) => {
        setNewStaffAvatar(dataUrl);
        setStaffAddError(null);
      })
      .catch((err) => setStaffAddError(err.message));
  };

  const handleRemoveAvatar = () => {
    setNewStaffAvatar('');
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = '';
    }
  };

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffAddError(null);
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      setStaffAddError('Staff name and email are required.');
      return;
    }
    if (newStaffPassword.length < 8) {
      setStaffAddError('The initial password must be at least 8 characters.');
      return;
    }

    setIsAddingStaff(true);
    try {
      await addStaff({
        name: newStaffName,
        email: newStaffEmail,
        password: newStaffPassword,
        phone: newStaffPhone,
        role: newStaffRole,
        license_number: newStaffRole === 'clinician' ? newStaffLicense : undefined,
        avatar_url: newStaffAvatar || undefined,
      });
      setShowAddStaff(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffPassword('');
      setNewStaffPhone('');
      setNewStaffLicense('');
      setNewStaffAvatar('');
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
      onRefresh?.();
    } catch (err) {
      setStaffAddError((err as Error).message);
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeletingStaff(true);
    setStaffDeleteError(null);
    try {
      await removeStaff(staffToDelete);
      setStaffToDelete(null);
      onRefresh?.();
    } catch (err) {
      setStaffDeleteError((err as Error).message);
    } finally {
      setIsDeletingStaff(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onUpdateClinic({
        name: clinicName.trim(),
        address: address.trim(),
        phone: clinicPhone.trim(),
        consent_officer_name: grievanceOfficer.trim(),
        dpdp_officer_name: grievanceOfficer.trim(),
        consent_officer_email: grievanceEmail.trim(),
        dpdp_officer_email: grievanceEmail.trim(),
        consent_officer_phone: grievancePhone.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (u: User) => {
    const password = prompt(
      `${u.needs_password ? 'Set a login password' : 'New password'} for ${u.name} (at least 8 characters).\nThey sign in with: ${u.email}`
    );
    if (password === null) return;
    try {
      await resetStaffPassword(u, password);
      alert(`Password saved. ${u.name} can now sign in with ${u.email} and this password.`);
      onRefresh?.();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleCompleteRequest = async (req: DPDPRequest) => {
    setCompletingId(req.id);
    try {
      await completeDpdpRequest(req);
      onRefresh?.();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Practice & Compliance Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the clinic profile, staff accounts, and DPDP grievance details.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Clinic settings and DPDP compliance details saved successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-semibold">{saveError}</div>
      )}

      {/* Section 1: Clinic Profile & Standard Practice Rate */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#5749e2]">
          <Building2 className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">Clinic Profile</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic / Practice Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Phone</label>
            <input
              type="text"
              value={clinicPhone}
              onChange={(e) => setClinicPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address & Location</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Standard Clinician Fixed Rates & Team */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Users className="w-5 h-5 text-[#5749e2]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Staff Management & Clinician Roster</h3>
              <p className="text-[11px] text-slate-500">
                Create login accounts for Psychologists and Client Coordinators. Share the initial password with them; they can change it later from their profile menu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddStaff(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5749e2] hover:bg-[#4738cf] text-white shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Add Staff Modal Form */}
        {showAddStaff && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#5749e2]" />
                <span>Add Team Member to {clinic.name}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddStaff(false);
                  setNewStaffAvatar('');
                  if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {staffAddError && (
              <div className="p-2.5 bg-red-50 text-red-800 rounded-lg text-xs">
                {staffAddError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="grid sm:grid-cols-2 gap-3 text-xs">
              {/* Profile Photo Upload & Remove Section */}
              <div className="sm:col-span-2 p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                  />
                  <div className="relative group">
                    {newStaffAvatar ? (
                      <img
                        src={newStaffAvatar}
                        alt="Staff avatar preview"
                        className="w-13 h-13 rounded-full object-cover border-2 border-[#5749e2] shadow-sm"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#5749e2]" />
                      <span>Staff Profile Photo</span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Optional. PNG, JPG or WEBP up to 5MB (resized automatically).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#5749e2]" />
                    <span>{newStaffAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {newStaffAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5"
                      title="Remove selected photo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Dr. Sneha Roy"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. sneha@mindledger.in"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#5749e2]" />
                  <span>Initial Portal Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    className="w-full pl-3 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Give this to the staff member; they sign in with their email</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Staff Role *</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white font-medium"
                >
                  <option value="clinician">Psychologist / Clinician (Clinical Notes & Caseload)</option>
                  <option value="front_desk">Client Coordinator / Front Desk (Client intake & contacts)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
                />
              </div>

              {newStaffRole === 'clinician' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">RCI / License Number</label>
                    <input
                      type="text"
                      value={newStaffLicense}
                      onChange={(e) => setNewStaffLicense(e.target.value)}
                      placeholder="e.g. RCI-CRR-A12984"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
                    />
                  </div>

                </>
              )}

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-200 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaff(false);
                    setNewStaffAvatar('');
                    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingStaff}
                  className="px-4 py-1.5 text-xs rounded-lg bg-[#5749e2] hover:bg-[#4738cf] text-white font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingStaff ? 'Adding...' : 'Create Staff Account'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff Deletion Confirmation Modal */}
        {staffToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 pb-2 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Remove Staff Member</h3>
                  <p className="text-[11px] text-slate-500">Revoke portal access and remove from roster</p>
                </div>
              </div>

              {staffDeleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {staffDeleteError}
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <Avatar name={staffToDelete.name} src={staffToDelete.avatar_url} className="w-11 h-11 text-xs" />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-bold text-slate-900 truncate">{staffToDelete.name}</div>
                  <div className="text-slate-500 text-[11px] truncate">{staffToDelete.email}</div>
                  <div className="text-[10px] text-[#5749e2] font-semibold capitalize mt-0.5">
                    Role: {staffToDelete.role} {staffToDelete.license_number ? `• ${staffToDelete.license_number}` : ''}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong>{staffToDelete.name}</strong> from <strong>{clinic.name}</strong>?
                This immediately revokes their access to clinic records. Their past session notes stay in the client files.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeletingStaff}
                  onClick={() => {
                    setStaffToDelete(null);
                    setStaffDeleteError(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingStaff}
                  onClick={handleDeleteStaff}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingStaff ? 'Removing...' : 'Confirm Removal'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {allUsers.map((u) => {
            const isCurrentLoggedInUser = u.id === currentUser.id;
            const isSoleOwner = u.id === clinic.id;

            return (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} src={u.avatar_url} className="w-10 h-10 text-xs" />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{u.name}</span>
                      <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold capitalize text-[10px]">
                        {u.role === 'owner' ? 'Clinic Owner' : u.role === 'clinician' ? 'Psychologist' : 'Coordinator'}
                      </span>
                      {u.from_website && (
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          From website
                        </span>
                      )}
                      {u.needs_password && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Login not set up
                        </span>
                      )}
                      {isCurrentLoggedInUser && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Active Session (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {u.license_number ? `License: ${u.license_number} • ` : ''}{u.email}
                      {u.phone ? ` • ${u.phone}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">

                  {/* Remove Staff Action Button */}
                  {userIsOwner && (
                    <div className="pl-2 border-l border-slate-100">
                      {isCurrentLoggedInUser ? (
                        <span className="text-[10px] text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                          Current User
                        </span>
                      ) : isSoleOwner ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-medium">
                          Primary Owner
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(u)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Key className="w-3.5 h-3.5 text-[#5749e2]" />
                          <span>{u.needs_password ? 'Set Password' : 'Reset Password'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStaffDeleteError(null);
                            setStaffToDelete(u);
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold transition-all flex items-center gap-1 shadow-2xs"
                          title={`Remove ${u.name} from clinic roster`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remove</span>
                        </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: DPDP Act (2023) Statutory Officer Parameters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#fd2a83]">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-base font-bold text-slate-900">DPDP Act (2023) Grievance Officer</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Mandatory statutory information displayed to Indian clients in notice and consent forms under Section 6 of the Digital Personal Data Protection Act.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grievance / Consent Officer Name</label>
            <input
              type="text"
              value={grievanceOfficer}
              onChange={(e) => setGrievanceOfficer(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fd2a83]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Redressal Email</label>
            <input
              type="email"
              value={grievanceEmail}
              onChange={(e) => setGrievanceEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fd2a83]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Phone</label>
            <input
              type="text"
              value={grievancePhone}
              onChange={(e) => setGrievancePhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fd2a83]"
            />
          </div>
        </div>
      </div>

      {/* Section 4: DPDP data rights requests */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">DPDP Data Rights Requests</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Export and erasure requests recorded through &ldquo;DPDP Rights&rdquo;. Fulfil them from the client&apos;s file
            (DPDP Data Export, or Execute Erasure in the consent tab), then mark them completed.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-2">Requested</th>
                <th className="py-2.5 px-2">Name / Contact</th>
                <th className="py-2.5 px-2">Type</th>
                <th className="py-2.5 px-2">Status</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dpdpRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No requests recorded.
                  </td>
                </tr>
              )}
              {dpdpRequests.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 px-2 text-slate-600">{r.requested_on}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-semibold text-slate-800">{r.client_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {r.client_contact}
                      {r.client_id === 'unmatched' && ' \u2022 no matching client file'}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 capitalize">{r.type}</td>
                  <td className="py-2.5 px-2">
                    {r.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        Completed {r.completed_at}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {r.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteRequest(r)}
                        disabled={completingId === r.id}
                        className="text-[11px] font-semibold text-[#5749e2] hover:underline disabled:opacity-50"
                      >
                        Mark completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
