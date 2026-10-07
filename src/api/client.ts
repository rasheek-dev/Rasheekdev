// API client to communicate with Mentra PHP backend

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_PATH = process.env.VITE_BASE_PATH || '/mindledger';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('POST', '/auth/login', { email, password });
  }

  async logout() {
    return this.request('POST', '/auth/logout', {});
  }

  // Client endpoints
  async getClients() {
    return this.request('GET', '/clients', {});
  }

  async createClient(client: any) {
    return this.request('POST', '/clients', client);
  }

  async updateClient(clientId: string, updates: any) {
    return this.request('PUT', `/clients/${clientId}`, updates);
  }

  async getClient(clientId: string) {
    return this.request('GET', `/clients/${clientId}`, {});
  }

  // Session notes endpoints
  async getSessionNotes(clientId: string) {
    return this.request('GET', `/clients/${clientId}/notes`, {});
  }

  async createSessionNote(clientId: string, note: any) {
    return this.request('POST', `/clients/${clientId}/notes`, note);
  }

  async updateSessionNote(clientId: string, noteId: string, updates: any) {
    return this.request('PUT', `/clients/${clientId}/notes/${noteId}`, updates);
  }

  // Assessment endpoints
  async sendAssessment(clientId: string, assessment: any) {
    return this.request('POST', `/clients/${clientId}/assessments`, assessment);
  }

  async getAssessments(clientId: string) {
    return this.request('GET', `/clients/${clientId}/assessments`, {});
  }

  async updateAssessmentResponse(assessmentId: string, responses: any) {
    return this.request('PUT', `/assessments/${assessmentId}/responses`, responses);
  }

  // Reports endpoints
  async getReports(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.request('GET', `/reports${query}`, {});
  }

  async exportReport(reportId: string, format: 'pdf' | 'csv') {
    return this.request('GET', `/reports/${reportId}/export?format=${format}`, {});
  }
}

export const apiClient = new ApiClient();
