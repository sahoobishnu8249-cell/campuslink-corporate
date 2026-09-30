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
  OfferDetails,
  PlacementPassportModel,
  InterviewQueueModel,
  PolicyDecisionModel,
  OfferModel,
  AuditLogModel,
  ResumeExtractedData,
  ResumeSkillModel,
  SkillScoreModel,
  AssessmentSession,
  AssessmentResultModel,
  CertificateModel,
  AssessmentSettingsModel,
  CandidateVerifiedSkillProfile,
  CollegeRoom,
  AcademicSchedule,
  PlacementDriveAllocation,
  AdministrationAlert,
  RoomAllocationStats,
  ConflictResolutionAction
} from '../types/index.ts';

const LOCAL_STORAGE_USER_KEY = 'campuslink_current_user_id';
const LOCAL_STORAGE_TOKEN_KEY = 'campuslink_auth_token';

class ApiService {
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private authToken: string | null = null;
  private sseSource: EventSource | null = null;
  private sseListeners: Array<(event: { type: string; data?: any }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      if (token && stored) {
        this.currentUserId = stored;
        this.authToken = token;
      }
    }
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      }
    }
  }

  setCurrentUser(user: User) {
    this.currentUserId = user.id;
    this.currentUserName = user.name;
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
    }
  }

  clearAuth() {
    this.authToken = null;
    this.currentUserId = null;
    this.currentUserName = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.currentUserId) {
      headers['x-user-id'] = this.currentUserId;
    }
    if (this.currentUserName) {
      headers['x-user-name'] = this.currentUserName;
    }
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // ----------------- AUTH -----------------

  async fetchCurrentUser(): Promise<{ user: User; profile: StudentProfile | RecruiterProfile | null } | null> {
    if (!this.authToken) {
      return null;
    }
    try {
      const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
      const json = await res.json();
      if (!json.success || !json.data?.user) return null;
      if (json.data?.user) {
        this.currentUserName = json.data.user.name;
        this.currentUserId = json.data.user.id;
      }
      return json.data;
    } catch {
      return null;
    }
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
    if (json.access_token) {
      this.setAuthToken(json.access_token);
    }
    this.setCurrentUser(json.data.user);
    return json.data;
  }

  async registerStudent(data: {
    name: string;
    email: string;
    college_id: string;
    phone: string;
    branch: string;
    password: string;
  }): Promise<{
    success: boolean;
    message: string;
    verification_required: boolean;
    email: string;
    maskedEmail?: string;
    previewOtp?: string;
  }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        role: 'student'
      })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const err: any = new Error(json.message || 'Registration failed');
      err.field = json.field;
      throw err;
    }
    return json;
  }

  async verifyOtp(email: string, otp: string): Promise<{
    success: boolean;
    message: string;
    verified: boolean;
    access_token: string;
    user: User;
    profile: StudentProfile;
  }> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const err: any = new Error(json.message || 'Verification failed');
      err.code = json.code;
      err.remainingAttempts = json.remainingAttempts;
      throw err;
    }
    if (json.access_token) {
      this.setAuthToken(json.access_token);
    }
    if (json.user) {
      this.setCurrentUser(json.user);
    }
    return json;
  }

  async resendOtp(email: string): Promise<{
    success: boolean;
    message: string;
    email: string;
    maskedEmail?: string;
    previewOtp?: string;
  }> {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to resend OTP');
    }
    return json;
  }

  async login(email: string, password?: string): Promise<{
    success: boolean;
    message?: string;
    verification_required?: boolean;
    access_token?: string;
    verified?: boolean;
    email?: string;
    maskedEmail?: string;
    previewOtp?: string;
    user?: User;
    profile?: StudentProfile | RecruiterProfile | null;
  }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok && !json.verification_required) {
      throw new Error(json.message || 'Login failed');
    }
    if (json.access_token) {
      this.setAuthToken(json.access_token);
    }
    if (json.user) {
      this.setCurrentUser(json.user);
    }
    return json;
  }

  async registerUser(data: { name: string; email: string; role: string; branch?: string; cgpa?: number; skills?: string[] }): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to register');
    if (json.data?.user) {
      this.setCurrentUser(json.data.user);
      return json.data.user;
    }
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

  async parseResume(userId: string, resumeText: string, filename?: string): Promise<{
    profile: StudentProfile;
    extractedSkills: string[];
    atsScore: number;
  }> {
    const techCatalog = [
      'Python', 'Django', 'Flask', 'FastAPI', 'React', 'TypeScript', 'JavaScript', 
      'Node.js', 'Express', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 
      'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'REST APIs', 'GraphQL',
      'Java', 'Spring Boot', 'C++', 'C', 'HTML/CSS', 'Tailwind', 'Next.js', 'Linux',
      'Redis', 'Kafka', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Machine Learning'
    ];

    const lower = resumeText.toLowerCase();
    const matched = techCatalog.filter(skill => lower.includes(skill.toLowerCase()));
    const extractedSkills = matched.length > 0 ? matched : ['Python', 'SQL', 'React', 'Git'];
    const atsScore = Math.min(95, Math.max(72, Math.round(extractedSkills.length * 5 + 40)));

    const current = await this.getStudentById(userId);
    const mergedSkills = Array.from(new Set([...(current.skills || []), ...extractedSkills]));
    const updatedProfile = await this.updateStudentProfile({
      userId,
      skills: mergedSkills,
      resumeFilename: filename || `${current.fullName.replace(/\s+/g, '_')}_Resume.pdf`,
      resumeScore: atsScore
    });

    return {
      profile: updatedProfile,
      extractedSkills,
      atsScore
    };
  }

  async addStudentProject(userId: string, project: {
    title: string;
    tech: string;
    description: string;
    githubLink?: string;
  }): Promise<StudentProfile> {
    const current = await this.getStudentById(userId);
    const newProj = {
      id: `proj_${Date.now()}`,
      ...project,
      relevanceScore: 88
    };
    const updatedProjects = [newProj, ...(current.projects || [])];
    return await this.updateStudentProfile({
      userId,
      projects: updatedProjects
    });
  }

  async deleteStudentProject(userId: string, projId: string): Promise<StudentProfile> {
    const res = await fetch(`/api/students/${userId}/projects/${projId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete project');
    return json.data;
  }

  async addStudentCertificate(userId: string, certificateName: string): Promise<StudentProfile> {
    const current = await this.getStudentById(userId);
    const updatedCerts = Array.from(new Set([...(current.certifications || []), certificateName]));
    return await this.updateStudentProfile({
      userId,
      certifications: updatedCerts
    });
  }

  async updateAssessment(userId: string, payload: {
    aptitudeScore?: number;
    mockInterviewScore?: number;
  }): Promise<StudentProfile> {
    return await this.updateStudentProfile({
      userId,
      ...payload
    });
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

  async createNotification(notif: Partial<NotificationItem>): Promise<NotificationItem> {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(notif)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create notification');
    return json.data;
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

  async deleteNotification(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  }

  async clearReadNotifications(): Promise<number> {
    const res = await fetch('/api/notifications/clear-read', {
      method: 'POST',
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.clearedCount || 0;
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

  // ----------------- PLACEMENT PASSPORT & SECURE QR -----------------
  async getPassports(): Promise<PlacementPassportModel[]> {
    const res = await fetch('/api/passport', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getPassportById(id: string): Promise<PlacementPassportModel> {
    const res = await fetch(`/api/passport/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Passport not found');
    return json.data;
  }

  async createPassport(studentId?: string, customData?: Partial<PlacementPassportModel>): Promise<PlacementPassportModel> {
    const res = await fetch('/api/passport/create', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ student_id: studentId || this.currentUserId, ...customData })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create passport');
    return json.data;
  }

  async verifyPassportSeal(passportId: string, data: { seal_type: string; status?: string; notes?: string }): Promise<PlacementPassportModel> {
    const res = await fetch(`/api/passport/${passportId}/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to verify seal');
    return json.data;
  }

  async approvePassport(passportId: string): Promise<PlacementPassportModel> {
    const res = await fetch(`/api/passport/${passportId}/approve`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to approve passport');
    return json.data;
  }

  async rejectPassport(passportId: string, reason?: string): Promise<PlacementPassportModel> {
    const res = await fetch(`/api/passport/${passportId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to reject passport');
    return json.data;
  }

  async recheckPassport(passportId: string, reason?: string): Promise<PlacementPassportModel> {
    const res = await fetch(`/api/passport/${passportId}/recheck`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to request recheck');
    return json.data;
  }

  async verifyPublicPassport(passportId: string): Promise<any> {
    const res = await fetch(`/api/passport/verify/${passportId}`);
    return await res.json();
  }

  // ----------------- QR GATE CHECK-IN & WAR ROOM -----------------
  async checkInToDrive(driveId: string, payload: { qr_token?: string; passport_id?: string; student_id?: string; method?: string }) {
    const res = await fetch(`/api/drives/${driveId}/check-in`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Check-in failed');
    return json.data;
  }

  async getDriveQueue(driveId: string): Promise<InterviewQueueModel[]> {
    const res = await fetch(`/api/drives/${driveId}/queue`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async callNextInQueue(driveId: string, room?: string, interviewer_name?: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/drives/${driveId}/queue/call-next`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ room, interviewer_name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'No candidates waiting');
    return json.data;
  }

  async callSpecificInQueue(driveId: string, payload: { token_number?: string; candidate_id?: string; room?: string }): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/drives/${driveId}/queue/call-specific`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Candidate not found');
    return json.data;
  }

  async startQueueItem(queueId: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/queue/${queueId}/start`, { method: 'POST', headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async completeQueueItem(queueId: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/queue/${queueId}/complete`, { method: 'POST', headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async skipQueueItem(queueId: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/queue/${queueId}/skip`, { method: 'POST', headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async recallQueueItem(queueId: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/queue/${queueId}/recall`, { method: 'POST', headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async moveQueueRoom(queueId: string, room: string): Promise<InterviewQueueModel> {
    const res = await fetch(`/api/queue/${queueId}/move-room`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ room })
    });
    const json = await res.json();
    return json.data;
  }

  // ----------------- POLICIES & AUDIT LOGS -----------------
  async evaluatePlacementPolicy(data: { student_id?: string; new_company?: string; new_package?: number; new_offer_category?: string }): Promise<PolicyDecisionModel> {
    const res = await fetch('/api/policies/evaluate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json.data;
  }

  async getTpoDashboardAnalytics(): Promise<any> {
    const res = await fetch('/api/analytics/tpo', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async getAuditLogs(): Promise<AuditLogModel[]> {
    const res = await fetch('/api/audit-logs', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async acceptOfferEscrow(offerId: string, signature?: string): Promise<any> {
    const res = await fetch(`/api/offers/${offerId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ signature })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to accept offer');
    return json.data;
  }

  async rejectOfferEscrow(offerId: string, reason?: string): Promise<any> {
    const res = await fetch(`/api/offers/${offerId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to reject offer');
    return json.data;
  }

  // =============================================================
  // AI SKILL VERIFICATION & ASSESSMENT APIS
  // =============================================================

  async uploadResumeForSkillAnalysis(
    resumeText: string, 
    filename: string, 
    studentId?: string,
    fileUrl?: string,
    fileSize?: string
  ): Promise<{
    analysis: ResumeExtractedData;
    claimedSkills: Array<{ name: string; category: string }>;
    atsScore: number;
    studentId: string;
    resumeUrl?: string;
    resumeFilename?: string;
    profile?: any;
  }> {
    const res = await fetch('/api/resume/upload', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resumeText, filename, studentId, fileUrl, fileSize })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to parse resume');
    return json.data;
  }

  async getResumeAnalysis(studentId?: string): Promise<ResumeExtractedData | null> {
    const url = studentId ? `/api/resume/analysis?studentId=${encodeURIComponent(studentId)}` : '/api/resume/analysis';
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || null;
  }

  async startSkillAssessment(level: 1 | 2 | 3, studentId?: string): Promise<{
    sessionId: string;
    level: 1 | 2 | 3;
    totalQuestions: number;
    timeLimitPerQuestionSec: number;
    passingThresholdPct: number;
    currentQuestionIndex: number;
    firstQuestion: any;
    questions: any[];
  }> {
    const res = await fetch('/api/assessment/start', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ level, studentId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to start assessment session');
    return json.data;
  }

  async getAssessmentQuestion(sessionId: string): Promise<any> {
    const res = await fetch(`/api/assessment/${sessionId}/question`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch question');
    return json;
  }

  async submitAssessmentAnswer(
    sessionId: string, 
    questionId: string, 
    selectedOption: number, 
    timeTakenSeconds = 45
  ): Promise<{ nextQuestionIndex: number; isCompleted: boolean; message: string }> {
    const res = await fetch(`/api/assessment/${sessionId}/answer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        question_id: questionId,
        selected_option: selectedOption,
        time_taken_seconds: timeTakenSeconds
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to submit answer');
    return json;
  }

  async submitAssessmentLevel(sessionId: string): Promise<AssessmentResultModel> {
    const res = await fetch(`/api/assessment/${sessionId}/submit`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to evaluate assessment');
    return json.data;
  }

  async getAssessmentResult(sessionIdOrResultId: string): Promise<AssessmentResultModel> {
    const res = await fetch(`/api/assessment/${sessionIdOrResultId}/result`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch assessment result');
    return json.data;
  }

  async getStudentVerifiedSkills(studentId?: string): Promise<{
    resumeSkills: ResumeSkillModel[];
    verifiedSkills: SkillScoreModel[];
    overallScore: number;
    strongSkills: SkillScoreModel[];
    developingSkills: SkillScoreModel[];
    needsImprovement: SkillScoreModel[];
    thresholds: { strong: number; developing: number; passing: number };
  }> {
    const url = studentId ? `/api/student/skills?studentId=${encodeURIComponent(studentId)}` : '/api/student/skills';
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async addStudentManualSkill(skillName: string, category = 'technology', studentId?: string): Promise<ResumeSkillModel> {
    const res = await fetch('/api/student/skills', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ skill_name: skillName, category, studentId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to add manual skill');
    return json.data;
  }

  async getStudentCertificates(studentId?: string): Promise<CertificateModel[]> {
    const url = studentId ? `/api/student/certificates?studentId=${encodeURIComponent(studentId)}` : '/api/student/certificates';
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async uploadStudentCertificate(data: Partial<CertificateModel>): Promise<CertificateModel> {
    const res = await fetch('/api/student/certificates', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to upload certificate');
    return json.data;
  }

  async verifyCertificate(
    certificateId: string, 
    status: 'VERIFIED' | 'REJECTED', 
    rejectionReason?: string
  ): Promise<CertificateModel> {
    const res = await fetch(`/api/admin/certificates/${certificateId}/verify`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, rejection_reason: rejectionReason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update certificate verification status');
    return json.data;
  }

  async getAssessmentSettings(): Promise<AssessmentSettingsModel> {
    const res = await fetch('/api/admin/assessment-settings', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data;
  }

  async updateAssessmentSettings(settings: Partial<AssessmentSettingsModel>): Promise<AssessmentSettingsModel> {
    const res = await fetch('/api/admin/assessment-settings', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    });
    const json = await res.json();
    return json.data;
  }

  async getRecruiterCandidates(filters?: {
    skill?: string;
    minScore?: number;
    level?: number;
    branch?: string;
    minCgpa?: number;
    search?: string;
  }): Promise<CandidateVerifiedSkillProfile[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.skill) params.set('skill', filters.skill);
      if (filters.minScore !== undefined) params.set('minScore', filters.minScore.toString());
      if (filters.level !== undefined) params.set('level', filters.level.toString());
      if (filters.branch) params.set('branch', filters.branch);
      if (filters.minCgpa !== undefined) params.set('minCgpa', filters.minCgpa.toString());
      if (filters.search) params.set('search', filters.search);
    }
    const res = await fetch(`/api/recruiter/candidates?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getRecruiterCandidateById(studentId: string): Promise<CandidateVerifiedSkillProfile> {
    const res = await fetch(`/api/recruiter/candidates/${encodeURIComponent(studentId)}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Candidate verified profile not found');
    return json.data;
  }

  // =============================================================
  // SMART ROOM ALLOCATION & NOTIFICATION APIS
  // =============================================================

  async getCollegeRooms(): Promise<CollegeRoom[]> {
    const res = await fetch('/api/rooms', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async createCollegeRoom(room: Partial<CollegeRoom>): Promise<CollegeRoom> {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(room)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create room');
    return json.data;
  }

  async updateCollegeRoom(id: string, updates: Partial<CollegeRoom>): Promise<CollegeRoom> {
    const res = await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update room');
    return json.data;
  }

  async getAcademicSchedules(date?: string): Promise<AcademicSchedule[]> {
    const url = date ? `/api/academic-schedules?date=${encodeURIComponent(date)}` : '/api/academic-schedules';
    const res = await fetch(url, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async createAcademicSchedule(sched: Partial<AcademicSchedule>): Promise<AcademicSchedule> {
    const res = await fetch('/api/academic-schedules', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sched)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create academic schedule');
    return json.data;
  }

  async updateAcademicSchedule(id: string, updates: Partial<AcademicSchedule>): Promise<AcademicSchedule> {
    const res = await fetch(`/api/academic-schedules/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update academic schedule');
    return json.data;
  }

  async getPlacementAllocations(): Promise<PlacementDriveAllocation[]> {
    const res = await fetch('/api/placement-allocations', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async getPlacementAllocationById(id: string): Promise<PlacementDriveAllocation> {
    const res = await fetch(`/api/placement-allocations/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Placement allocation not found');
    return json.data;
  }

  async getPlacementAllocationsStats(): Promise<RoomAllocationStats> {
    const res = await fetch('/api/placement-allocations/stats', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || {
      totalRooms: 0,
      totalCapacity: 0,
      activeAllocations: 0,
      confirmedAllocations: 0,
      conflictCount: 0,
      notificationsSentTotal: 0,
      studentsAccommodatedToday: 0
    };
  }

  async suggestRoomsForAllocation(params: {
    date: string;
    startTime: string;
    endTime: string;
    requiredCapacity: number;
    allocationId?: string;
  }): Promise<Array<{
    room: CollegeRoom;
    hasConflict: boolean;
    conflictDetails?: any;
    fitScore: number;
    recommendationReason: string;
  }>> {
    const q = new URLSearchParams({
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      requiredCapacity: params.requiredCapacity.toString(),
      ...(params.allocationId ? { allocationId: params.allocationId } : {})
    });
    const res = await fetch(`/api/placement-allocations/suggest-rooms?${q.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async createPlacementAllocation(data: Partial<PlacementDriveAllocation>): Promise<{
    allocation: PlacementDriveAllocation;
    alert?: AdministrationAlert;
    hasConflict: boolean;
    message: string;
  }> {
    const res = await fetch('/api/placement-allocations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to create placement allocation');
    return json;
  }

  async updatePlacementAllocation(id: string, updates: Partial<PlacementDriveAllocation>): Promise<PlacementDriveAllocation> {
    const res = await fetch(`/api/placement-allocations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to update placement allocation');
    return json.data;
  }

  async deletePlacementAllocation(id: string): Promise<void> {
    const res = await fetch(`/api/placement-allocations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete placement allocation');
  }

  async autoAllocateAllPendingDrives(): Promise<{
    allocatedCount: number;
    conflictsCount: number;
    allocations: PlacementDriveAllocation[];
    message: string;
  }> {
    const res = await fetch('/api/placement-allocations/auto-allocate', {
      method: 'POST',
      headers: this.getHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to auto-allocate rooms');
    return json;
  }

  async getAdministrationAlerts(): Promise<AdministrationAlert[]> {
    const res = await fetch('/api/admin-alerts', { headers: this.getHeaders() });
    const json = await res.json();
    return json.data || [];
  }

  async resolveAdministrationConflict(
    alertId: string,
    action: ConflictResolutionAction,
    payload: {
      alternateRoomId?: string;
      newTimeSlot?: { startTime: string; endTime: string };
      note?: string;
      resolvedBy?: string;
    }
  ): Promise<{
    success: boolean;
    alert: AdministrationAlert;
    allocation?: PlacementDriveAllocation;
    updatedSchedule?: AcademicSchedule;
    message: string;
  }> {
    const res = await fetch(`/api/admin-alerts/${encodeURIComponent(alertId)}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, ...payload })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to resolve administration conflict');
    return json;
  }

  async confirmAllocationAndNotifyStudents(
    allocationId: string,
    customInstructions?: string
  ): Promise<{
    allocation: PlacementDriveAllocation;
    notifiedCount: number;
    message: string;
  }> {
    const res = await fetch(`/api/placement-allocations/${encodeURIComponent(allocationId)}/notify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ customInstructions })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to confirm allocation and send notifications');
    return json;
  }
}

export const api = new ApiService();
