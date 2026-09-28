import { 
  User, 
  StudentProfile, 
  RecruiterProfile, 
  Company,
  JobPosting, 
  Drive,
  Application, 
  ApplicationStage, 
  InterviewRecord,
  OfferRecord,
  DocumentItem,
  NotificationItem, 
  CampusPlacementStats,
  SkillGapAnalysis,
  AtRiskStudent,
  ScoringWeights,
  MatchingWeights,
  ConflictCheckResult,
  InterviewDetails,
  OfferDetails
} from '../types/index.ts';

const LOCAL_STORAGE_USER_KEY = 'campuslink_current_user_id';

class ApiService {
  private currentUserId: string = 'user_student_aarav';
  private currentUserName: string = 'Aarav Reddy';
  private sseSource: EventSource | null = null;
  private sseListeners: Array<(event: { type: string; data?: any }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        this.currentUserId = stored;
      }
    }
  }

  getCurrentUserId(): string {
    return this.currentUserId;
  }

  setCurrentUser(user: User) {
    this.currentUserId = user.id;
    this.currentUserName = user.name;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
    }
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
      'x-user-name': this.currentUserName
    };
  }

  // ----------------- AUTH -----------------

  async fetchCurrentUser(): Promise<{ user: User; profile: StudentProfile | RecruiterProfile | null }> {
    const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch current user');
    if (json.data?.user) {
      this.currentUserName = json.data.user.name;
    }
    return json.data;
  }

  async getAllUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users');
    const json = await res.json();
    return json.data || [];
  }

  async switchUser(userId: string): Promise<{ user: User; profile: StudentProfile | RecruiterProfile | null }> {
    const res = await fetch('/api/auth/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to switch user');
    this.setCurrentUser(json.data.user);
    return json.data;
  }

  async registerUser(data: { name: string; email: string; role: string; branch?: string; cgpa?: number; skills?: string[] }): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to register');
    this.setCurrentUser(json.data);
    return json.data;
  }

  async loginUser(email: string): Promise<{ user: User; profile: StudentProfile | RecruiterProfile | null }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Login failed');
    this.setCurrentUser(json.data.user);
    return json.data;
  }

  // ----------------- STUDENTS -----------------

  async getAllStudents(filters?: { branch?: string; minCgpa?: number; search?: string }): Promise<StudentProfile[]> {
    const params = new URLSearchParams();
    if (filters?.branch) params.append('branch', filters.branch);
    if (filters?.minCgpa) params.append('minCgpa', filters.minCgpa.toString());
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/students?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getStudentById(id: string): Promise<StudentProfile> {
    const res = await fetch(`/api/students/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Student not found');
    return json.data;
  }

  async updateStudentProfile(profile: Partial<StudentProfile>): Promise<StudentProfile> {
    const userId = profile.userId || this.currentUserId;
    const res = await fetch(`/api/students/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profile)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update profile');
    return json.data;
  }

  // ----------------- COMPANIES & JOBS -----------------

  async getAllCompanies(): Promise<Company[]> {
    const res = await fetch('/api/companies', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getJobs(filters?: { search?: string; type?: string; department?: string; minCgpa?: number }): Promise<JobPosting[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.minCgpa) params.append('minCgpa', filters.minCgpa.toString());

    const res = await fetch(`/api/jobs?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getJobById(id: string): Promise<JobPosting> {
    const res = await fetch(`/api/jobs/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Job not found');
    return json.data;
  }

  async createJob(job: Partial<JobPosting>): Promise<JobPosting> {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(job)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create job');
    return json.data;
  }

  async deleteJob(id: string): Promise<void> {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete job');
  }

  // ----------------- DRIVES & SCHEDULING -----------------

  async getDrives(): Promise<Drive[]> {
    const res = await fetch('/api/drives', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async createDrive(drive: Partial<Drive>): Promise<{ drive: Drive; conflict: ConflictCheckResult }> {
    const res = await fetch('/api/drives', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(drive)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create drive');
    return { drive: json.data, conflict: json.conflict };
  }

  async checkSchedulingConflict(data: {
    companyId: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    targetBatches?: number[];
  }): Promise<ConflictCheckResult> {
    const res = await fetch('/api/scheduling/check-conflict', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.data;
  }

  async suggestAlternativeSlot(data: { date: string; venue: string }): Promise<any> {
    const res = await fetch('/api/scheduling/suggest-slot', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.data;
  }

  // ----------------- APPLICATIONS -----------------

  async getApplications(query?: { jobId?: string }): Promise<Application[]> {
    const params = new URLSearchParams();
    if (query?.jobId) params.append('jobId', query.jobId);

    const res = await fetch(`/api/applications?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getApplicationById(id: string): Promise<Application> {
    const res = await fetch(`/api/applications/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Application not found');
    return json.data;
  }

  async applyForJob(jobId: string, coverNote?: string): Promise<Application> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ jobId, coverNote })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to submit application');
    return json.data;
  }

  async updateApplicationStage(
    id: string, 
    stage: ApplicationStage, 
    options?: { note?: string; interviewDetails?: InterviewDetails; offerDetails?: OfferDetails }
  ): Promise<Application> {
    const res = await fetch(`/api/applications/${id}/stage`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ stage, ...options })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update application stage');
    return json.data;
  }

  async addEvaluation(id: string, evaluation: { rating: number; comment: string; author?: string; role?: string }): Promise<Application> {
    const res = await fetch(`/api/applications/${id}/evaluations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(evaluation)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to add evaluation');
    return json.data;
  }

  async respondToOffer(id: string, action: 'accept' | 'decline'): Promise<Application> {
    const res = await fetch(`/api/applications/${id}/respond-offer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to respond to offer');
    return json.data;
  }

  // ----------------- INTERVIEWS & OFFERS -----------------

  async getInterviews(): Promise<InterviewRecord[]> {
    const res = await fetch('/api/interviews', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async updateInterview(id: string, data: Partial<InterviewRecord>): Promise<InterviewRecord> {
    const res = await fetch(`/api/interviews/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update interview');
    return json.data;
  }

  async getOffers(): Promise<OfferRecord[]> {
    const res = await fetch('/api/offers', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async updateOfferStatus(id: string, status: OfferRecord['status']): Promise<OfferRecord> {
    const res = await fetch(`/api/offers/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update offer status');
    return json.data;
  }

  // ----------------- DOCUMENTS -----------------

  async getDocuments(studentId?: string): Promise<DocumentItem[]> {
    const url = studentId ? `/api/documents?studentId=${studentId}` : '/api/documents';
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async uploadDocument(doc: { title: string; category: string; filename: string; fileSize?: string; studentId?: string; studentName?: string }): Promise<DocumentItem> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(doc)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to upload document');
    return json.data;
  }

  async verifyDocument(id: string, status: 'Verified' | 'Rejected', note?: string): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}/verify`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, note })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to verify document');
    return json.data;
  }

  // ----------------- AI READINESS & MATCHING -----------------

  async getSkillGap(studentId?: string, targetRole?: string): Promise<SkillGapAnalysis> {
    const res = await fetch('/api/ai/skill-gap', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId: studentId || this.currentUserId, targetRole })
    });
    const json = await res.json();
    return json.data;
  }

  async computeReadinessScore(studentId?: string, customWeights?: Partial<ScoringWeights>) {
    const res = await fetch('/api/ai/readiness-score', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ studentId: studentId || this.currentUserId, customWeights })
    });
    const json = await res.json();
    return json.data;
  }

  async computeJobMatch(jobId: string, studentId?: string) {
    const res = await fetch('/api/ai/match', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ jobId, studentId: studentId || this.currentUserId })
    });
    const json = await res.json();
    return json.data;
  }

  async askAiAssistant(query: string, studentId?: string): Promise<{ text: string; suggestions?: string[] }> {
    const res = await fetch('/api/ai/assistant-chat', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, studentId: studentId || this.currentUserId })
    });
    const json = await res.json();
    return json.data;
  }

  async getAiWeights(): Promise<{ scoringWeights: ScoringWeights; matchingWeights: MatchingWeights }> {
    const res = await fetch('/api/ai/weights');
    const json = await res.json();
    return json.data;
  }

  async updateAiWeights(weights: { scoringWeights?: Partial<ScoringWeights>; matchingWeights?: Partial<MatchingWeights> }) {
    const res = await fetch('/api/ai/weights', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(weights)
    });
    const json = await res.json();
    return json.data;
  }

  // ----------------- ANALYTICS & AT-RISK -----------------

  async getPlacementStats(): Promise<CampusPlacementStats> {
    const res = await fetch('/api/analytics/overview');
    const json = await res.json();
    return json.data;
  }

  async getAtRiskStudents(): Promise<AtRiskStudent[]> {
    const res = await fetch('/api/analytics/at-risk');
    const json = await res.json();
    return json.data || [];
  }

  // ----------------- NOTIFICATIONS -----------------

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: this.getHeaders()
    });
  }

  // ----------------- REAL-TIME SSE -----------------

  initRealtimeSync(listener: (event: { type: string; data?: any }) => void): () => void {
    this.sseListeners.push(listener);

    if (!this.sseSource && typeof window !== 'undefined') {
      try {
        this.sseSource = new EventSource('/api/realtime/events');
        this.sseSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            this.sseListeners.forEach(fn => fn(data));
          } catch (err) {
            // ignore heartbeat or parse errors
          }
        };
        this.sseSource.onerror = () => {
          // auto reconnects
        };
      } catch (e) {
        console.warn('SSE not supported or disabled', e);
      }
    }

    return () => {
      this.sseListeners = this.sseListeners.filter(fn => fn !== listener);
      if (this.sseListeners.length === 0 && this.sseSource) {
        this.sseSource.close();
        this.sseSource = null;
      }
    };
  }
}

export const api = new ApiService();
