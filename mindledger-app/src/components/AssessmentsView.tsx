import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Send,
  ExternalLink,
  Copy,
  Check,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  MessageCircle,
  Mail,
} from 'lucide-react';
import { Assessment, Client, User, isCoordinator, isPsychologist } from '../types';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';
import { createAssessment, assessmentLink } from '../lib/api';

interface AssessmentsViewProps {
  assessments: Assessment[];
  clients: Client[];
  currentUser: User;
  initialClientId?: string;
  onRefresh: () => void;
}

const isExpired = (a: Assessment) => a.status === 'pending' && new Date(a.expires_at).getTime() < Date.now();
const selfHarmFlag = (a: Assessment) => a.type === 'PHQ9' && a.status === 'completed' && Number(a.responses?.[9] ?? 0) > 0;

function whatsappNumber(phone?: string) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

function shareMessage(client: Client | undefined, link: string) {
  const first = client?.name.split(' ')[0] || '';
  return `Hello ${first}, please complete this short confidential questionnaire before our next session: ${link} (link valid for 7 days)`;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = (props) => {
  const { currentUser } = props;
  // Access control guard: Coordinators cannot view psychometric assessments
  if (isCoordinator(currentUser.role)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center ring-8 ring-amber-50/50">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied: Clinical Assessment Restricted</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Client Coordinators handle client intake. Under clinic privacy policies and DPDP rules, psychometric assessments (PHQ-9 and GAD-7) and severity progressions are restricted to treating psychologists and clinic owners.
        </p>
      </div>
    );
  }

  return <AssessmentsBody {...props} />;
};

const AssessmentsBody: React.FC<AssessmentsViewProps> = ({ assessments, clients, currentUser, initialClientId, onRefresh }) => {
  // Filter clients to own caseload if psychologist
  const accessibleClients = isPsychologist(currentUser.role)
    ? clients.filter((c) => c.assigned_clinician_id === currentUser.id)
    : clients;

  const firstClientId = initialClientId || accessibleClients[0]?.id || '';
  const [selectedClientId, setSelectedClientId] = useState<string>(firstClientId);
  const [selectedType, setSelectedType] = useState<'PHQ9' | 'GAD7'>('PHQ9');
  const [showSendModal, setShowSendModal] = useState(Boolean(initialClientId));
  const [modalClientId, setModalClientId] = useState(firstClientId);
  const [modalType, setModalType] = useState<'PHQ9' | 'GAD7'>('PHQ9');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<{ link: string; client?: Client } | null>(null);

  // Filter assessments for the selected client and type
  const clientAssessments = assessments
    .filter((a) => a.client_id === selectedClientId && a.type === selectedType && a.status === 'completed')
    .sort((a, b) => (a.completed_at_iso || a.sent_at || '').localeCompare(b.completed_at_iso || b.sent_at || ''));

  const selectedClient = accessibleClients.find((c) => c.id === selectedClientId) || clients.find((c) => c.id === selectedClientId);
  const def = ASSESSMENT_DEFINITIONS[selectedType];

  const handleSendAssessment = async () => {
    const client = accessibleClients.find((c) => c.id === modalClientId);
    if (!client) {
      setSendError('Please choose a client.');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const created = await createAssessment(client, modalType);
      setCreatedLink({ link: assessmentLink(created.secure_link_token), client });
      onRefresh();
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(assessmentLink(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Build SVG trend chart with shaded severity bands (Prompt #4 requirement)
  const maxScore = selectedType === 'PHQ9' ? 27 : 21;
  const chartHeight = 220;
  const chartWidth = 560;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const points = clientAssessments.map((item, idx) => {
    const x =
      clientAssessments.length === 1
        ? paddingLeft + plotWidth / 2
        : paddingLeft + (idx / (clientAssessments.length - 1)) * plotWidth;
    const y = paddingTop + plotHeight - ((item.score || 0) / maxScore) * plotHeight;
    return { x, y, score: item.score, date: item.completed_at, band: item.severity_band };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Assessment Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standardized psychometric diagnostics (PHQ-9, GAD-7) with longitudinal severity tracking.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedLink(null);
            setSendError(null);
            setShowSendModal(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5749e2] hover:bg-[#4738cf] text-white transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Send Assessment Link</span>
        </button>
      </div>

      {/* Main Longitudinal Trend Chart Card (Follow-up Prompt #4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Selectors */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Client Caseload
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5749e2]"
              >
                {accessibleClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Assessment Battery
              </label>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSelectedType('PHQ9')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    selectedType === 'PHQ9' ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PHQ-9 (Depression)
                </button>
                <button
                  onClick={() => setSelectedType('GAD7')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    selectedType === 'GAD7' ? 'bg-[#5749e2] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GAD-7 (Anxiety)
                </button>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">Current Severity</span>
            <div className="text-base font-bold text-[#392cb3]">
              {clientAssessments.length > 0
                ? `${clientAssessments[clientAssessments.length - 1].score}/${maxScore} (${
                    clientAssessments[clientAssessments.length - 1].severity_band
                  })`
                : 'No submissions yet'}
            </div>
          </div>
        </div>

        {/* Shaded Severity Band Chart (Prompt #4) */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Longitudinal Score Progression & Severity Bands
          </h3>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-2xl mx-auto h-auto text-xs"
            >
              {/* Shaded Severity Bands */}
              {def.scoringBands.map((band) => {
                const yTop =
                  paddingTop + plotHeight - (Math.min(band.max, maxScore) / maxScore) * plotHeight;
                const yBottom = paddingTop + plotHeight - (band.min / maxScore) * plotHeight;
                const height = yBottom - yTop;

                return (
                  <g key={band.severity}>
                    <rect
                      x={paddingLeft}
                      y={yTop}
                      width={plotWidth}
                      height={height}
                      fill={band.color}
                      opacity="0.65"
                    />
                    <text
                      x={chartWidth - paddingRight + 5}
                      y={yTop + height / 2 + 4}
                      fill="#64748B"
                      fontSize="9"
                      fontWeight="500"
                    >
                      {band.severity}
                    </text>
                  </g>
                );
              })}

              {/* Y Axis Ticks */}
              {[0, Math.round(maxScore / 3), Math.round((maxScore * 2) / 3), maxScore].map((val) => {
                const y = paddingTop + plotHeight - (val / maxScore) * plotHeight;
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + plotWidth}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#94A3B8"
                      fontSize="10"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Connected Line & Points */}
              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#132E2B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylineStr}
                />
              )}

              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="5" fill="#5749e2" stroke="#FFFFFF" strokeWidth="2" />
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="#0F172A"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {p.score}
                  </text>
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Clinical interpretation summary matching Prompt #4 */}
          <div className="mt-4 p-4 bg-[#f4f3fe]/60 border border-[#d4d0fb]/80 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#f4f3fe] text-[#5749e2] flex items-center justify-center shrink-0 mt-0.5">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#281e80] block">Clinical Trend Interpretation</span>
              <p className="text-[#392cb3] mt-0.5 leading-relaxed">
                {points.length >= 2 && points[0].score! > points[points.length - 1].score! ? (
                  <>
                    Significant therapeutic progress observed: {selectedClient?.name}&apos;s score decreased from{' '}
                    <strong>{points[0].score}</strong> ({points[0].band}) to{' '}
                    <strong>{points[points.length - 1].score}</strong> ({points[points.length - 1].band}), demonstrating positive response to behavioral interventions.
                  </>
                ) : (
                  <>
                    Baseline established for {selectedClient?.name}. Longitudinal comparisons will update automatically upon subsequent questionnaire submissions.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sent & Pending Assessments Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Recent Assessment Dispatches</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-2.5 px-3">Client</th>
                <th className="py-2.5 px-3">Assessment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Score & Severity</th>
                <th className="py-2.5 px-3">Completed On</th>
                <th className="py-2.5 px-3 text-right">Secure Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No assessments sent yet. Click &ldquo;Send Assessment Link&rdquo; to create one.
                  </td>
                </tr>
              )}
              {assessments.map((ass) => {
                const c = clients.find((client) => client.id === ass.client_id);
                const isCompleted = ass.status === 'completed';

                return (
                  <tr key={ass.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">{c?.name || 'Client'}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{ass.type}</td>
                    <td className="py-3 px-3">
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          Completed
                        </span>
                      ) : isExpired(ass) ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          Pending Link (7d)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isCompleted ? (
                        <span className="font-bold text-slate-900">
                          {ass.score} &bull; <span className="text-[#5749e2] font-medium">{ass.severity_band}</span>
                          {selfHarmFlag(ass) && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold"
                              title="PHQ-9 item 9 (thoughts of self-harm) answered above zero"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              Item 9
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{ass.completed_at || 'Pending'}</td>
                    <td className="py-3 px-3 text-right">
                      {isCompleted || isExpired(ass) ? (
                        <span className="text-slate-300">&mdash;</span>
                      ) : (
                      <button
                        onClick={() => copyLink(ass.secure_link_token)}
                        className="text-xs font-semibold text-[#5749e2] hover:text-[#392cb3] inline-flex items-center gap-1"
                      >
                        {copiedToken === ass.secure_link_token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied Link</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Send Assessment */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Dispatch Clinical Assessment</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Client</label>
                <select
                  value={modalClientId}
                  disabled={Boolean(createdLink)}
                  onChange={(e) => setModalClientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5749e2] bg-white"
                >
                  {accessibleClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assessment Tool</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('PHQ9')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      modalType === 'PHQ9'
                        ? 'border-[#5749e2] bg-[#f4f3fe] text-[#281e80]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>PHQ-9</div>
                    <div className="text-[10px] font-normal text-slate-500">Patient Health Questionnaire (Depression)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('GAD7')}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      modalType === 'GAD7'
                        ? 'border-[#5749e2] bg-[#f4f3fe] text-[#281e80]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>GAD-7</div>
                    <div className="text-[10px] font-normal text-slate-500">Generalized Anxiety Disorder (Anxiety)</div>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div>&bull; Creates a private link valid for 7 days. The client does not need an account.</div>
                <div>&bull; Share it by WhatsApp, SMS or email. The score appears here as soon as they submit.</div>
              </div>

              {sendError && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">{sendError}</div>}

              {createdLink && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Link ready for {createdLink.client?.name}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-700 bg-white border border-emerald-200 rounded-lg p-2 break-all">
                    {createdLink.link}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdLink.link);
                        setCopiedToken('new');
                        setTimeout(() => setCopiedToken(null), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 inline-flex items-center gap-1"
                    >
                      {copiedToken === 'new' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === 'new' ? 'Copied' : 'Copy link'}</span>
                    </button>
                    <a
                      href={`https://wa.me/${whatsappNumber(createdLink.client?.phone)}?text=${encodeURIComponent(
                        shareMessage(createdLink.client, createdLink.link)
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Send on WhatsApp</span>
                    </a>
                    {createdLink.client?.email && (
                      <a
                        href={`mailto:${createdLink.client.email}?subject=${encodeURIComponent('Questionnaire before your next session')}&body=${encodeURIComponent(
                          shareMessage(createdLink.client, createdLink.link)
                        )}`}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 inline-flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              {createdLink ? (
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Done
                </button>
              ) : (
                <button
                  onClick={handleSendAssessment}
                  disabled={sending || accessibleClients.length === 0}
                  className="px-5 py-2.5 bg-[#5749e2] hover:bg-[#4738cf] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Generating...' : 'Generate Link'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
