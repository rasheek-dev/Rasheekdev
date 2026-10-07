export type UserRole = 'owner' | 'clinician' | 'coordinator';

export const isOwner = (role?: string) => role === 'owner';
export const isClinician = (role?: string) => role === 'clinician';
export const isCoordinator = (role?: string) => role === 'coordinator';

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
  authToken?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  data_residency_region: string;
  consent_officer_name: string;
  consent_officer_email: string;
  consent_officer_phone: string;
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
}

export type NoteTemplateType = 'SOAP' | 'DAP' | 'free_text';

export interface NoteAddendum {
  id: string;
  text: string;
  added_by: string;
  added_at: string;
}

export interface SessionNote {
  id: string;
  client_id: string;
  clinician_id: string;
  template_type: NoteTemplateType;
  content: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    data?: string;
    free_text?: string;
  };
  private_notes?: string;
  duration_minutes?: number;
  status: 'draft' | 'signed';
  signed_at?: string;
  signed_by?: string;
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
  client_id: string;
  clinician_id: string;
  type: AssessmentType;
  sent_at: string;
  completed_at?: string;
  secure_link_token: string;
  expires_at: string;
  responses?: Record<number, number>;
  score?: number;
  severity_band?: string;
  status: 'pending' | 'completed' | 'expired';
}

export interface ConsentRecord {
  id: string;
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
