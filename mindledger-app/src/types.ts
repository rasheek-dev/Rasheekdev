export type UserRole = 'owner' | 'clinician' | 'front_desk' | 'psychologist' | 'coordinator';

export const isOwner = (role?: string) => role === 'owner';
export const isPsychologist = (role?: string) => role === 'clinician' || role === 'psychologist';
export const isCoordinator = (role?: string) => role === 'front_desk' || role === 'coordinator';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone: string;
  role: UserRole;
  clinic_id: string;
  license_number?: string;
  signature_image_url?: string;
  specialties?: string[];
  avatar_url?: string;
  color?: string;
  from_website?: boolean;
  needs_password?: boolean;
  placeholder_email?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  data_residency_region: string;
  consent_officer_name: string;
  consent_officer_email: string;
  consent_officer_phone: string;
  upi_vpa?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  phone: string;
  email: string;
  dpdp_officer_name?: string;
  dpdp_officer_email?: string;
}

export interface Client {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  consent_status: 'pending' | 'granted' | 'withdrawn';
  consent_timestamp?: string;
  assigned_clinician_id: string;
  is_minor: boolean;
  guardian_name?: string;
  guardian_contact?: string;
  notes_count?: number;
  status: 'active' | 'inactive';
  created_at: string;
  anonymized?: boolean;
  source?: 'website';
  intake_concerns?: string;
  age_at_intake?: number | null;
  age_range?: string;
  last_booking_at?: string;
  last_visit_at?: string;
  reports_count?: number;
  last_report_at?: string | null;
}

export interface WebSession {
  id: string;
  client_id: string;
  assigned_clinician_id: string;
  clinician_id: string;
  booking_code: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  concerns: string;
  meet_url: string;
  payment_id?: string;
  payment_verified?: boolean;
  source: 'website';
}

export type NoteTemplateType = 'SOAP' | 'DAP' | 'free_text' | 'Free Text';

export interface NoteAddendum {
  id: string;
  text: string;
  added_by: string;
  added_at: string;
}

export interface SessionNote {
  id: string;
  clinic_id?: string;
  appointment_id?: string;
  client_id: string;
  assigned_clinician_id?: string;
  clinician_id: string;
  clinician_name?: string;
  template_type: NoteTemplateType;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    data?: string;
    free_text?: string;
    text?: string;
  };
  private_notes?: string;
  duration_minutes?: number;
  duration_seconds?: number;
  started_at?: string;
  ended_at?: string;
  status: 'draft' | 'signed';
  signed_at?: string;
  signed_at_iso?: string;
  signed_by?: string;
  signed_by_id?: string;
  signature_hash?: string;
  addenda: NoteAddendum[];
  created_at: string;
  updated_at: string;
}

export type AssessmentType = 'PHQ9' | 'GAD7' | 'PCL5' | 'WHO5' | 'YBOCS';

export interface AssessmentItem {
  id: number;
  question: string;
}

export interface AssessmentDefinition {
  type: AssessmentType;
  title: string;
  fullName: string;
  description: string;
  options: { label: string; value: number }[];
  questions: AssessmentItem[];
  scoringBands: {
    min: number;
    max: number;
    severity: string;
    color: string;
    bgClass: string;
  }[];
}

export interface Assessment {
  id: string;
  clinic_id?: string;
  client_id: string;
  assigned_clinician_id?: string;
  clinician_id: string;
  type: AssessmentType;
  sent_at: string;
  completed_at?: string;
  completed_at_iso?: string;
  client_first_name?: string;
  clinic_name?: string;
  secure_link_token: string;
  expires_at: string;
  responses?: Record<number, number>;
  score?: number;
  severity_band?: string;
  status: 'pending' | 'completed' | 'expired';
}

export interface ConsentRecord {
  id: string;
  clinic_id?: string;
  client_id: string;
  purpose: string;
  consent_text_version: string;
  granted_at?: string;
  withdrawn_at?: string;
  ip_address: string;
  status: 'granted' | 'withdrawn';
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  details: string;
}

export interface DPDPRequest {
  id: string;
  client_id: string;
  client_name: string;
  client_contact: string;
  type: 'export' | 'erasure';
  requested_on: string;
  requested_on_iso?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  processed_by?: string;
  notes?: string;
}
