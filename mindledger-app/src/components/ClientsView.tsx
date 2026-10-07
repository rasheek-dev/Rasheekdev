import React, { useState } from 'react';
import { Search, Plus, Users, ShieldCheck, AlertCircle, Phone, Mail, ArrowRight } from 'lucide-react';
import { Client, User } from '../types';

interface ClientsViewProps {
  clients: Client[];
  allUsers: User[];
  currentUser?: User;
  onSelectClient: (clientId: string) => void;
  onNewClient: () => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  allUsers,
  currentUser,
  onSelectClient,
  onNewClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');

  const isCoordinator = currentUser?.role === 'coordinator' || currentUser?.role === 'front_desk';
  const isPsychologist = currentUser?.role === 'psychologist' || currentUser?.role === 'clinician';
  const isOwner = currentUser?.role === 'owner';

  // Psychologists only see their respective clients!
  const baseClients = isPsychologist
    ? clients.filter((c) => c.assigned_clinician_id === currentUser?.id)
    : clients;

  const filteredClients = baseClients.filter((c) => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(query) ||
      (c.phone || '').includes(searchQuery || '') ||
      (c.email || '').toLowerCase().includes(query);

    if (filterTab === 'all') return matchesSearch;
    return matchesSearch && c.status === filterTab;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isCoordinator
                ? 'Client Directory (Intake & Contacts)'
                : isPsychologist
                ? 'My Clients (Assigned Caseload)'
                : 'All Clinic Clients Directory'}
            </h1>
            {isPsychologist && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                Your Caseload Only
              </span>
            )}
            {isCoordinator && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                Front Desk
              </span>
            )}
            {isOwner && (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                Owner Access: All
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isCoordinator
              ? 'Client Coordinators register new clients and look up contact details without accessing private clinical notes.'
              : isPsychologist
              ? `Displaying the ${baseClients.length} clients under your direct clinical care.`
              : 'Full clinic caseload across all psychologists, therapists, and intake coordinators.'}
          </p>
        </div>

        {!isPsychologist && (
          <button
            onClick={onNewClient}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5749e2] hover:bg-[#4738cf] text-white transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Client</span>
          </button>
        )}
      </div>

      {/* Search & Tabs matching Screenshot 07 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, phone, or email..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterTab === 'all' ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({clients.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterTab === 'active' ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({clients.filter((c) => c.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterTab('inactive')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterTab === 'inactive' ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Clinician</th>
                <th className="py-3 px-3">Consent (DPDP)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    {baseClients.length === 0
                      ? isPsychologist
                        ? 'No clients have been assigned to you yet.'
                        : 'No clients yet. Click "New Client" to create the first client file.'
                      : 'No clients match your search.'}
                  </td>
                </tr>
              )}
              {filteredClients.map((client) => {
                const clinician = allUsers.find((u) => u.id === client.assigned_clinician_id);

                return (
                  <tr
                    key={client.id}
                    onClick={() => onSelectClient(client.id)}
                    className="hover:bg-[#f4f3fe]/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f4f3fe] border border-[#d4d0fb] text-[#392cb3] font-bold flex items-center justify-center text-xs">
                          {client.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#5749e2] transition-colors flex items-center gap-1.5">
                            <span>{client.name}</span>
                            {client.is_minor && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                                Minor
                              </span>
                            )}
                            {client.anonymized && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-600 rounded font-semibold">
                                Anonymized
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">DOB: {client.date_of_birth}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{client.phone}</div>
                      <div className="text-[11px] text-slate-400">{client.email}</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {clinician?.name || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-3">
                      {client.consent_status === 'granted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Granted</span>
                        </span>
                      ) : client.consent_status === 'withdrawn' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          <span>Withdrawn</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          client.status === 'active'
                            ? 'bg-[#f4f3fe] text-[#392cb3]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(client.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#5749e2] hover:bg-[#f4f3fe] transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
