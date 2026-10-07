import { Assessment, Client, Clinic, SessionNote, User } from '../types';
import { ASSESSMENT_DEFINITIONS } from '../data/clinicalData';

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function para(label: string, text?: string): string {
  if (!text?.trim()) return '';
  return `<p><strong>${esc(label)}:</strong> ${esc(text).replace(/\n/g, '<br>')}</p>`;
}

export function printClientReport(input: {
  clinic: Clinic;
  client: Client;
  notes: SessionNote[];
  assessments: Assessment[];
  clinician?: User;
}) {
  const { clinic, client, notes, assessments, clinician } = input;
  const completed = assessments.filter((a) => a.status === 'completed');

  const assessmentRows = completed.length
    ? completed
        .map((a) => {
          const max = a.type === 'PHQ9' ? 27 : 21;
          const item9 = a.type === 'PHQ9' && Number(a.responses?.[9] ?? 0) > 0;
          return `<tr><td>${esc(a.completed_at)}</td><td>${esc(ASSESSMENT_DEFINITIONS[a.type]?.title || a.type)}</td><td>${esc(
            a.score
          )} / ${max}</td><td>${esc(a.severity_band)}${
            item9 ? ' <strong style="color:#b91c1c">&middot; Item 9 (self-harm thoughts) answered above zero</strong>' : ''
          }</td></tr>`;
        })
        .join('')
    : '<tr><td colspan="4" class="muted">No completed assessments.</td></tr>';

  const noteBlocks = notes.length
    ? notes
        .map((n) => {
          const c = n.content || {};
          const status = n.status === 'signed' ? `Signed by ${esc(n.signed_by)} on ${esc(n.signed_at)}` : 'Draft (unsigned)';
          const addenda = (n.addenda || [])
            .map((ad) => `<p class="addendum"><strong>Addendum, ${esc(ad.added_at)} (${esc(ad.added_by)}):</strong> ${esc(ad.text)}</p>`)
            .join('');
          return `<div class="note">
            <div class="note-head"><span>${esc(n.created_at?.split('T')[0])} &middot; ${esc(n.template_type)}${
            n.duration_minutes ? ` &middot; ${esc(n.duration_minutes)} min` : ''
          }</span><span>${status}</span></div>
            ${para('Subjective', c.subjective)}${para('Objective', c.objective)}${para('Data', c.data)}${para(
            'Assessment',
            c.assessment
          )}${para('Plan', c.plan)}${para('Notes', c.text || c.free_text)}
            ${addenda}
          </div>`;
        })
        .join('')
    : '<p class="muted">No session notes.</p>';

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Client Report - ${esc(client.name)}</title>
  <style>
    body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 32px; font-size: 12px; line-height: 1.5; }
    h1 { font-size: 20px; margin: 0; } h2 { font-size: 14px; margin: 24px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .muted { color: #64748b; } .header { display: flex; justify-content: space-between; border-bottom: 2px solid #5749e2; padding-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; } td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { font-size: 10px; text-transform: uppercase; color: #64748b; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
    .note { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; page-break-inside: avoid; }
    .note-head { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px; color: #392cb3; }
    .note p { margin: 4px 0; } .addendum { background: #f8fafc; padding: 6px; border-radius: 6px; }
    .footer { margin-top: 32px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print { body { margin: 12mm; } }
  </style></head><body>
  <div class="header">
    <div><h1>Client Clinical Report</h1><div class="muted">${esc(clinic.name)}${clinic.address ? ` &middot; ${esc(clinic.address)}` : ''}</div></div>
    <div class="muted" style="text-align:right">Generated ${esc(new Date().toLocaleString('en-GB'))}<br>CONFIDENTIAL</div>
  </div>
  <h2>Client</h2>
  <div class="grid">
    <div><strong>Name:</strong> ${esc(client.name)}</div><div><strong>Date of birth:</strong> ${esc(client.date_of_birth)}</div>
    <div><strong>Phone:</strong> ${esc(client.phone)}</div><div><strong>Email:</strong> ${esc(client.email)}</div>
    <div><strong>Assigned clinician:</strong> ${esc(clinician?.name || 'Unassigned')}</div><div><strong>First intake:</strong> ${esc(
    client.created_at
  )}</div>
    <div><strong>Emergency contact:</strong> ${esc(client.emergency_contact_name)} (${esc(client.emergency_contact_phone)})</div>
    <div><strong>Consent:</strong> ${esc(client.consent_status)}</div>
    ${client.is_minor ? `<div><strong>Guardian:</strong> ${esc(client.guardian_name)} (${esc(client.guardian_contact)})</div>` : ''}
  </div>
  <h2>Psychometric assessments</h2>
  <table><thead><tr><th>Date</th><th>Measure</th><th>Score</th><th>Severity</th></tr></thead><tbody>${assessmentRows}</tbody></table>
  <h2>Session notes (${notes.length})</h2>
  ${noteBlocks}
  <div class="footer">Private clinician notes are excluded from this report. This document contains sensitive personal data protected under the DPDP Act, 2023.</div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to print the client report.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
