import React, { useMemo, useState } from 'react';
import { Calendar, Download, Clock } from 'lucide-react';
import { Assessment, Client, Clinic, SessionNote, User } from '../types';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';
import { Avatar } from './Avatar';

interface ReportsViewProps {
  clinic: Clinic;
  users: User[];
  clients: Client[];
  notes: SessionNote[];
  assessments: Assessment[];
}

type Period = 'month' | 'quarter' | 'year' | 'all';

const PERIOD_LABEL: Record<Period, string> = {
  month: 'This month',
  quarter: 'Last 3 months',
  year: 'Last 12 months',
  all: 'All time',
};

function periodStart(period: Period): number {
  const now = new Date();
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (period === 'quarter') return new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
  if (period === 'year') return new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  return 0;
}

const inPeriod = (iso: string | undefined, start: number) => Boolean(iso) && new Date(iso!).getTime() >= start;

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ clinic, users, clients, notes, assessments }) => {
  const [period, setPeriod] = useState<Period>('month');
  const start = periodStart(period);

  const periodNotes = notes.filter((n) => inPeriod(n.created_at, start));
  const periodAssessmentsSent = assessments.filter((a) => inPeriod(a.sent_at, start));
  const periodCompleted = assessments.filter((a) => a.status === 'completed' && inPeriod(a.completed_at_iso, start));
  const signedCount = periodNotes.filter((n) => n.status === 'signed').length;
  const contactMinutes = periodNotes.reduce((sum, n) => sum + (n.duration_minutes || 0), 0);

  const clinicians = users.filter((u) => u.role === 'clinician' || u.role === 'psychologist' || u.role === 'owner');

  const rows = clinicians.map((c) => {
    const own = periodNotes.filter((n) => n.clinician_id === c.id);
    const signed = own.filter((n) => n.status === 'signed');
    const turnaroundHours = signed
      .filter((n) => n.signed_at_iso)
      .map((n) => (new Date(n.signed_at_iso!).getTime() - new Date(n.created_at).getTime()) / 3_600_000);
    const avgTurnaround = turnaroundHours.length
      ? turnaroundHours.reduce((s, h) => s + h, 0) / turnaroundHours.length
      : null;
    const sent = periodAssessmentsSent.filter((a) => a.clinician_id === c.id);
    return {
      id: c.id,
      name: c.name,
      avatar: c.avatar_url,
      role: c.role === 'owner' ? 'Owner & Clinician' : 'Psychologist',
      clients: clients.filter((cl) => cl.assigned_clinician_id === c.id && cl.status === 'active').length,
      notes: own.length,
      signed: signed.length,
      drafts: own.length - signed.length,
      minutes: own.reduce((s, n) => s + (n.duration_minutes || 0), 0),
      sent: sent.length,
      completed: sent.filter((a) => a.status === 'completed').length,
      turnaround: avgTurnaround,
    };
  });
  const maxNotes = Math.max(1, ...rows.map((r) => r.notes));

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const inMonth = (iso?: string) => {
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return t >= d.getTime() && t < next;
      };
      return {
        label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        notes: notes.filter((n) => inMonth(n.created_at)).length,
        assessments: assessments.filter((a) => a.status === 'completed' && inMonth(a.completed_at_iso)).length,
      };
    });
  }, [notes, assessments]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.notes + m.assessments));

  // Latest completed score per client, per measure.
  const severity = (['PHQ9', 'GAD7'] as const).map((type) => {
    const latest = new Map<string, Assessment>();
    assessments
      .filter((a) => a.type === type && a.status === 'completed')
      .sort((a, b) => (a.completed_at_iso || '').localeCompare(b.completed_at_iso || ''))
      .forEach((a) => latest.set(a.client_id, a));
    const def = ASSESSMENT_DEFINITIONS[type];
    const total = latest.size;
    return {
      type,
      title: def.title,
      total,
      bands: def.scoringBands.map((b) => ({
        ...b,
        count: [...latest.values()].filter((a) => a.severity_band === b.severity).length,
      })),
    };
  });

  const handleExportCSV = () => {
    const header = ['Clinician', 'Role', 'Active clients', 'Notes', 'Signed', 'Drafts', 'Contact minutes', 'Assessments sent', 'Assessments completed', 'Avg hours to sign'];
    const lines = rows.map((r) =>
      [r.name, r.role, r.clients, r.notes, r.signed, r.drafts, r.minutes, r.sent, r.completed, r.turnaround === null ? '' : r.turnaround.toFixed(1)]
        .map(csvCell)
        .join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${clinic.name.replace(/[^a-z0-9]+/gi, '_')}_Clinical_Report_${PERIOD_LABEL[period].replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const formatHours = (h: number | null) => (h === null ? '—' : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} hours`);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Clinical Activity Report</h1>
            <span className="text-[10px] uppercase font-bold text-[#392cb3] bg-[#f4f3fe] border border-[#d4d0fb] px-2 py-0.5 rounded-full">
              Owner Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Documentation, assessment completion and caseload per clinician.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="font-semibold bg-transparent focus:outline-none"
            >
              {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABEL[p]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Sessions Documented" value={periodNotes.length} hint={`${contactMinutes} contact minutes recorded`} />
        <Kpi
          label="Notes Signed"
          value={periodNotes.length ? `${Math.round((signedCount / periodNotes.length) * 100)}%` : '—'}
          hint={`${signedCount} signed, ${periodNotes.length - signedCount} drafts`}
        />
        <Kpi label="Assessments Completed" value={periodCompleted.length} hint={`${periodAssessmentsSent.length} ${periodAssessmentsSent.length === 1 ? 'link' : 'links'} sent`} />
        <Kpi
          label="Active Clients"
          value={clients.filter((c) => c.status === 'active').length}
          hint={`${clients.filter((c) => inPeriod(c.created_at, start)).length} new in period`}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Per-Clinician Breakdown &bull; {PERIOD_LABEL[period]}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Clinician</th>
                <th className="py-2.5 px-3">Active Clients</th>
                <th className="py-2.5 px-3">Notes (Signed / Draft)</th>
                <th className="py-2.5 px-3">Contact Time</th>
                <th className="py-2.5 px-3">Assessments (Done / Sent)</th>
                <th className="py-2.5 px-3">Avg Time to Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} src={r.avatar} />
                      <div>
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{r.clients}</td>
                  <td className="py-3.5 px-3 text-slate-700">
                    <span className="font-bold text-[#392cb3]">{r.notes}</span> ({r.signed} / {r.drafts})
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{r.minutes ? `${r.minutes} min` : '—'}</td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {r.completed} / {r.sent}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatHours(r.turnaround)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes by Clinician ({PERIOD_LABEL[period]})</h3>
          <div className="space-y-3 pt-2">
            {rows.map((r) => (
              <div key={r.id} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 font-semibold">{r.name}</span>
                  <span className="text-slate-500">{r.notes} {r.notes === 1 ? 'note' : 'notes'}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5749e2] rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((r.notes / maxNotes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">6-Month Clinical Activity</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#5749e2]" />
                Notes
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#fd2a83]" />
                Assessments
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between h-44 pt-6 px-2 border-b border-slate-100 gap-2">
            {monthly.map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <span className="text-[10px] font-bold text-[#392cb3]">{m.notes + m.assessments || ''}</span>
                <div className="w-full max-w-10 flex flex-col justify-end" style={{ height: '75%' }}>
                  <div className="bg-[#fd2a83] rounded-t-md" style={{ height: `${(m.assessments / maxMonthly) * 100}%` }} />
                  <div
                    className={`bg-[#5749e2] ${m.assessments ? '' : 'rounded-t-md'}`}
                    style={{ height: `${(m.notes / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {severity.map((s) => (
          <div key={s.type} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current {s.title} Severity ({s.total} clients)
            </h3>
            {s.total === 0 && <p className="text-xs text-slate-400">No completed {s.title} assessments yet.</p>}
            {s.total > 0 &&
              s.bands.map((b) => (
                <div key={b.severity} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{b.severity}</span>
                    <span className="text-slate-500">{b.count}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(b.count / s.total) * 100}%`, background: b.color }} />
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500 font-medium">{hint}</div>
    </div>
  );
}
