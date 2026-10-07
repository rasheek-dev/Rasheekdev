const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.BASE_URL}api/index.php`;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = localStorage.getItem('authToken');

  async request<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const [route, query] = path.split('?');
    const url = `${API_URL}?path=${encodeURIComponent(route)}${query ? `&${query}` : ''}`;
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'X-Auth-Token': this.token } : {}),
        },
        body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(text);
      } catch {
        return { success: false, error: `Server returned an invalid response (HTTP ${response.status})` };
      }
      if (!response.ok) {
        return { success: false, error: data.error || `Request failed (HTTP ${response.status})` };
      }
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? `Cannot reach server: ${error.message}` : 'Cannot reach server',
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

  login(email: string, password: string) {
    return this.request('POST', '/auth/login', { email, password });
  }

  logout() {
    return this.request('POST', '/auth/logout', {});
  }

  getClients() {
    return this.request('GET', '/clients');
  }

  createClient(client: unknown) {
    return this.request('POST', '/clients', client);
  }

  updateClient(clientId: string, updates: unknown) {
    return this.request('PUT', `/clients/${clientId}`, updates);
  }

  getClient(clientId: string) {
    return this.request('GET', `/clients/${clientId}`);
  }

  getSessionNotes(clientId: string) {
    return this.request('GET', `/clients/${clientId}/notes`);
  }

  createSessionNote(clientId: string, note: unknown) {
    return this.request('POST', `/clients/${clientId}/notes`, note);
  }

  updateSessionNote(clientId: string, noteId: string, updates: unknown) {
    return this.request('PUT', `/clients/${clientId}/notes/${noteId}`, updates);
  }

  sendAssessment(clientId: string, assessment: unknown) {
    return this.request('POST', `/clients/${clientId}/assessments`, assessment);
  }

  getAssessments(clientId: string) {
    return this.request('GET', `/clients/${clientId}/assessments`);
  }

  updateAssessmentResponse(assessmentId: string, responses: unknown) {
    return this.request('PUT', `/assessments/${assessmentId}/responses`, responses);
  }

  getReports() {
    return this.request<{ clients: unknown[]; notes: unknown[]; assessments: unknown[] }>('GET', '/reports');
  }
}

export const apiClient = new ApiClient();
