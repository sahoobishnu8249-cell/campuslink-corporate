export type UserRole = 'student' | 'recruiter' | 'tpo' | 'admin';

export type AccountStatus = 'pending_verification' | 'active' | 'suspended';

export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  college_id?: string;
  phone?: string;
  branch?: string;
  role: UserRole;
  email_verified?: boolean;
  account_status?: AccountStatus;
  avatar?: string;
  title?: string;
  department?: string;
  password_hash?: string;
  created_at?: string;
  updated_at?: string;
  createdAt: string;
}

export interface OtpRecord {
  _id: string;
  user_id: string;
  email: string;
  otp_hash: string;
  expires_at: string;
  attempt_count: number;
  verified: boolean;
  created_at: string;
  used_at?: string;
}

export interface AuthRegisterResponse {
  success: boolean;
  message: string;
  verification_required: boolean;
  email: string;
  maskedEmail?: string;
  previewOtp?: string;
}

export interface AuthVerifyOtpResponse {
  success: boolean;
  message: string;
  verified: boolean;
  access_token: string;
  user: User;
  profile?: StudentProfile | RecruiterProfile | null;
}

export interface AuthLoginResponse {
  success: boolean;
  message?: string;
  verification_required?: boolean;
  access_token?: string;
  verified?: boolean;
  email?: string;
  user?: User;
  profile?: StudentProfile | RecruiterProfile | null;
  previewOtp?: string;
}

export interface StudentProject {
  id: string;
  title: string;
  tech: string;
  description: string;
  githubLink?: string;
  liveLink?: string;
  relevanceScore?: number;
}

export interface StudentExperience {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export type ReadinessLevel = 'NOT READY' | 'DEVELOPING' | 'READY' | 'HIGHLY EMPLOYABLE';

export interface ReadinessBreakdown {
  technical: number;       // 0-100
  academic: number;        // 0-100
  projects: number;        // 0-100
  certifications: number;  // 0-100
  aptitude: number;        // 0-100
  communication: number;   // 0-100
  interview: number;       // 0-100
}

export interface StudentProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  university: string;
  rollNumber: string;
  degree: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  maxCgpa: number;
  backlogs: number;
  skills: string[];
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resumeFilename: string;
  resumeUrl: string;
  resumeScore?: number;
  projects: StudentProject[];
  experience: StudentExperience[];
  certifications: string[];
  targetRoles: string[];
  aptitudeScore: number;       // 0-100
  mockInterviewScore: number;  // 0-100
  communicationScore: number;  // 0-100
  readinessScore: number;      // 0-100
  readinessLevel: ReadinessLevel;
  readinessBreakdown: ReadinessBreakdown;
  isVerified: boolean;
  avatar?: string;
  atsScore?: number;
  joiningStatus?: string;
  placementStatus?: 'Not Placed' | 'In Process' | 'Placed';
  placedCompany?: string;
  placedPackage?: string;
  joiningDate?: string;
  joiningLocation?: string;
}

export function calculateProfileCompletion(student?: StudentProfile | null): number {
  if (!student) return 0;
  let score = 0;
  // 1. Personal & Contact Info (20%)
  if (student.fullName && student.email && student.phone && student.branch) score += 20;
  else if (student.fullName && student.email) score += 10;

  // 2. Academic Info (15%)
  if (student.cgpa > 0 && student.graduationYear > 0) score += 15;
  else if (student.cgpa > 0) score += 10;

  // 3. Resume Uploaded (20%)
  if (student.resumeFilename || student.resumeUrl) score += 20;

  // 4. Skills Added (15%)
  if (student.skills && student.skills.length >= 5) score += 15;
  else if (student.skills && student.skills.length > 0) score += 10;

  // 5. Projects Added (15%)
  if (student.projects && student.projects.length >= 2) score += 15;
  else if (student.projects && student.projects.length > 0) score += 10;

  // 6. Certifications (15%)
  if (student.certifications && student.certifications.length > 0) score += 15;

  return Math.min(100, Math.max(0, score));
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  logo: string;
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  hiringStatus: 'Active' | 'Upcoming' | 'Closed';
  description: string;
  activeDrivesCount: number;
  totalHires?: number;
}

export interface RecruiterProfile {
  userId: string;
  companyId?: string;
  companyName: string;
  recruiterName: string;
  title: string;
  email: string;
  phone: string;
  companyWebsite: string;
  companyLogo: string;
  industry: string;
  headquarters: string;
  companyBio: string;
  activeDrivesCount: number;
}

export type JobType = 'Full-Time' | 'Internship' | 'Co-op';
export type WorkplaceType = 'On-Campus' | 'Hybrid' | 'Remote';
export type JobStatus = 'Active' | 'Reviewing' | 'Closed';

export interface JobPosting {
  id: string;
  companyId: string;
  recruiterId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  department: string;
  location: string;
  type: JobType;
  workplaceType: WorkplaceType;
  ctcOrStipend: string;
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  targetBatches: number[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  certificationsRequired?: string[];
  status: JobStatus;
  applicationDeadline: string;
  openingsCount: number;
  applicantCount: number;
  driveDate?: string;
  driveTime?: string;
  venue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Drive {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  targetBatches: number[];
  allowedBranches: string[];
  eligibleBranches?: string[];
  minCgpa: number;
  openings: number;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Postponed';
  panelMembers: string[];
  shortlistedCount: number;
  conflictDetails?: ConflictCheckResult;
  role?: string;
  type?: string;
  packageCtc?: string;
  location?: string;
  currentStage?: string;
  totalRegistered?: number;
  offersReleased?: number;
  reportingTime?: string;
  instructions?: string;
  schedule?: Array<{ time: string; activity: string; hall: string }>;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: 'company' | 'student' | 'venue' | 'panel';
  description?: string;
  clashingEntities?: string[];
  suggestedSlot?: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

export type ApplicationStage = 
  | 'applied' 
  | 'screening' 
  | 'assessment' 
  | 'interview' 
  | 'hr_round' 
  | 'offered' 
  | 'accepted' 
  | 'rejected'
  | 'joined';

export interface StageHistoryItem {
  stage: ApplicationStage;
  label: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface InterviewDetails {
  id?: string;
  date: string;
  time: string;
  interviewer: string;
  meetingLink: string;
  roundName: string;
  venue?: string;
  notes?: string;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  overallScore?: number;
  feedback?: string;
  status?: 'Scheduled' | 'Completed' | 'Selected' | 'Rejected' | 'Pending';
}

export interface AssessmentDetails {
  testLink: string;
  deadline: string;
  score?: number;
  maxScore?: number;
  status: 'Pending' | 'Completed';
}

export interface OfferDetails {
  id?: string;
  ctc: string;
  baseFixed?: string;
  bonus?: string;
  rsu?: string;
  joiningDate: string;
  validTill: string;
  offerLetterUrl?: string;
  status: 'Offer Generated' | 'Pending Acceptance' | 'Accepted' | 'Declined' | 'Deferred' | 'Withdrawn' | 'Joined' | 'Offered' | 'Selected';
  terms?: string;
}

export interface EvaluationNote {
  id: string;
  author: string;
  role: string;
  rating: number; // 1 to 5
  comment: string;
  timestamp: string;
}

export interface ExplainableMatch {
  isShortlisted: boolean;
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  positiveFactors: string[];
  gapFactors: string[];
  assessmentBenchmark: string;
  recommendedAction: string;
}

export interface MatchBreakdown {
  technicalSkillMatch: number;   // e.g. 88%
  academicEligibility: number;   // e.g. 100%
  projectRelevance: number;      // e.g. 82%
  certificationMatch: number;    // e.g. 70%
  interviewPerformance: number;  // e.g. 84%
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobLocation: string;
  jobType: JobType;
  ctcOrStipend: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentCgpa: number;
  studentDegree: string;
  studentBranch: string;
  studentGraduationYear: number;
  studentSkills: string[];
  studentResumeFilename: string;
  studentResumeUrl: string;
  coverNote: string;
  eligibilityStatus: 'Eligible' | 'Not Eligible';
  eligibilityReasons?: string[];
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  explainableMatch: ExplainableMatch;
  stage: ApplicationStage;
  stageHistory: StageHistoryItem[];
  interviewDetails?: InterviewDetails;
  assessmentDetails?: AssessmentDetails;
  offerDetails?: OfferDetails;
  evaluations: EvaluationNote[];
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRecord {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  studentBranch: string;
  studentCgpa: number;
  companyName: string;
  companyLogo: string;
  jobTitle: string;
  roundName: string;
  date: string;
  time: string;
  venueOrLink: string;
  panel: string;
  status: 'Scheduled' | 'Completed' | 'Selected' | 'Rejected' | 'Pending';
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  overallScore?: number;
  feedback?: string;
}

export interface OfferRecord {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentBranch: string;
  companyName: string;
  companyLogo: string;
  jobTitle: string;
  ctc: string;
  baseFixed: string;
  bonus: string;
  rsu: string;
  offerDate: string;
  joiningDate: string;
  validTill: string;
  status: 'Offer Generated' | 'Pending Acceptance' | 'Accepted' | 'Declined' | 'Deferred' | 'Withdrawn' | 'Joined' | 'Offered' | 'Selected';
  offerLetterUrl: string;
  terms: string;
}

export interface DocumentItem {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  category: 'Resume' | 'ID Proof' | 'Academic Marksheet' | 'Certificates' | 'Offer Letter' | 'Joining Documents';
  filename: string;
  fileUrl: string;
  fileSize: string;
  uploadedDate: string;
  status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
  verificationNote?: string;
  verifiedBy?: string;
}

export type NotificationType = 
  | 'Drive Announcement' 
  | 'Shortlisted' 
  | 'Interview Schedule' 
  | 'Document Deadline' 
  | 'Offer Letter' 
  | 'Joining Reminder' 
  | 'Skill Recommendation'
  | 'Conflict Alert'
  | 'Room Allotment'
  | 'New Application'
  | 'Offer Accepted'
  | 'Offer Declined'
  | 'status_change'
  | 'drive_announcement'
  | 'offer_extended'
  | string;

export interface NotificationItem {
  id: string;
  userId: string;
  userEmail?: string;
  targetRole?: 'student' | 'tpo' | 'recruiter' | 'all' | string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  applicationId?: string;
  jobId?: string;
  linkTab?: string;
}

export interface SkillGapItem {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  resource: string;
  estimatedDays: number;
  category: string;
}

export interface PrepRoadmapItem {
  id: string;
  title: string;
  category: string;
  progress: number;
  tasks: string[];
}

export interface SkillGapAnalysis {
  targetRole: string;
  currentSkills: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: SkillGapItem[];
  preparationRoadmap: PrepRoadmapItem[];
  roleReadinessScore: number;
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  branch: string;
  cgpa: number;
  readinessScore: number;
  technicalCoverage: number;
  failedInterviews: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
  recommendedAction: string;
}

export interface PlacementFunnel {
  registered: number;
  eligible: number;
  shortlisted: number;
  interviewed: number;
  selected: number;
  offerAccepted: number;
  joined: number;
}

export interface CampusPlacementStats {
  totalStudents: number;
  placementReady: number;
  activeDrives: number;
  totalOffers: number;
  placedStudents: number;
  placementRate: number;
  studentsAtRisk: number;
  averagePackageLPA: number;
  highestPackageLPA: number;
  funnel: PlacementFunnel;
  branchPlacement: { branch: string; total: number; placed: number; rate: number }[];
  skillDemand: { skill: string; jobCount: number; percentage: number }[];
  packageDistribution: { range: string; count: number }[];
  averagePackageTrend: { year: string; avg: number; highest: number }[];
  offersByCompany: { company: string; offers: number; avgCtc: string }[];
  monthlyTrend: { month: string; drives: number; offers: number }[];
}

export interface ScoringWeights {
  technicalWeight: number;    // default 0.25
  academicWeight: number;     // default 0.20
  projectsWeight: number;     // default 0.15
  certificationsWeight: number; // default 0.10
  aptitudeWeight: number;     // default 0.10
  communicationWeight: number; // default 0.10
  interviewWeight: number;    // default 0.10
}

export interface MatchingWeights {
  technicalSkillMatch: number;   // default 0.40
  academicEligibility: number;   // default 0.20
  projectRelevance: number;      // default 0.15
  certificationMatch: number;    // default 0.10
  interviewPerformance: number;  // default 0.15
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
}

// -------------------------------------------------------------
// CAMPUSLINK PLACEMENT PASSPORT™ & LIVE DRIVE WAR-ROOM TYPES
// -------------------------------------------------------------
export interface VerificationSeal {
  id: string;
  name: string;
  issuer: string;
  status: 'VERIFIED' | 'PENDING' | 'EXPIRING';
  verifiedAt: string;
  hash: string;
  details: string;
}

export interface PlacementPassport {
  id: string;
  studentId: string;
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  blockchainHash: string;
  qrPayload: string;
  seals: {
    academic: VerificationSeal;
    tpoClearance: VerificationSeal;
    technicalATS: VerificationSeal;
    backgroundCheck: VerificationSeal;
  };
  metrics: {
    cgpa: number;
    backlogs: number;
    atsScore: number;
    readinessScore: number;
    githubCommits: number;
    leetCodeSolved: number;
    verifiedSkillsCount: number;
  };
  policyTier: {
    currentStatus: 'ELIGIBLE' | 'PLACED_DREAM_ONLY' | 'LOCKED_LIMIT_REACHED';
    allowedTier: 'REGULAR' | 'DREAM' | 'SUPER_DREAM';
    offersHeldCount: number;
    maxAllowedOffers: number;
    currentHighestCtcLPA: number;
  };
}

export interface LiveDriveToken {
  id: string;
  driveId: string;
  companyName: string;
  companyLogo: string;
  role: string;
  packageCtc: string;
  date: string;
  venue: string;
  studentTokenNumber: string;
  currentServedToken: string;
  estimatedWaitMinutes: number;
  hallName: string;
  roomNumber: string;
  stage: 'GATE_CHECKIN' | 'APTITUDE_TEST' | 'TECH_ROUND_1' | 'TECH_ROUND_2' | 'HR_ROUND' | 'OFFERED' | 'COMPLETED';
  status: 'QUEUED' | 'IN_ROOM' | 'CLEARED' | 'ON_HOLD';
  interviewerName?: string;
  announcementAlert?: string;
}

export interface DriveHallCandidate {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  branch: string;
  cgpa: number;
  tokenNumber: string;
  stage: 'GATE_CHECKIN' | 'APTITUDE_TEST' | 'TECH_ROUND_1' | 'TECH_ROUND_2' | 'HR_ROUND' | 'OFFERED';
  checkInTime: string;
  passportHash: string;
  isVerified: boolean;
  score: number;
}

// =============================================================
// RELATIONAL ENTITY MODELS & BACKEND CONTRACTS
// =============================================================

export type PassportStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'EXPIRED' | 'REVOKED';

export interface PlacementPassportModel {
  id: string;
  student_id: string;
  passport_number: string;
  status: PassportStatus;
  academic_verified: boolean;
  eligibility_verified: boolean;
  tpo_verified: boolean;
  attendance_verified: boolean;
  documents_verified: boolean;
  qr_token: string;
  verified_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  blockchain_hash?: string;
  metrics?: {
    cgpa: number;
    backlogs: number;
    ats_score: number;
    readiness_score: number;
  };
}

export interface PassportVerificationModel {
  id: string;
  passport_id: string;
  verifier_id: string;
  verifier_role: string;
  seal_type: 'ACADEMIC' | 'TPO' | 'ATS' | 'BGV';
  status: 'VERIFIED' | 'REJECTED' | 'PENDING';
  notes?: string;
  verified_at: string;
}

export interface StudentSkillModel {
  id: string;
  student_id: string;
  skill_name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  verified: boolean;
  verified_by?: string;
  created_at: string;
}

export interface DriveCandidateModel {
  id: string;
  drive_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  cgpa: number;
  attendance_status: 'REGISTERED' | 'CHECKED_IN' | 'ABSENT';
  check_in_time?: string;
  current_stage: 'GATE_CHECKIN' | 'APTITUDE_TEST' | 'TECH_ROUND_1' | 'TECH_ROUND_2' | 'HR_ROUND' | 'OFFERED' | 'REJECTED';
  token_number: string;
  created_at: string;
}

export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'ABSENT';

export interface InterviewQueueModel {
  id: string;
  drive_id: string;
  candidate_id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  token_number: string;
  room: string;
  round: string;
  status: QueueStatus;
  queue_position: number;
  called_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface InterviewRoundModel {
  id: string;
  drive_id: string;
  round_number: number;
  round_name: string;
  room: string;
  interviewer_name: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  created_at: string;
}

export interface PlacementPolicyModel {
  id: string;
  name: string;
  description: string;
  conditions: {
    min_cgpa_standard?: number;
    max_active_backlogs?: number;
    mandatory_attendance_pct?: number;
  };
  offer_categories: {
    regular_max_lpa: number;
    dream_min_lpa: number;
    dream_max_lpa: number;
    super_dream_min_lpa: number;
  };
  upgrade_rules: {
    allow_dream_if_regular_held: boolean;
    allow_super_dream_always: boolean;
    min_ctc_multiplier_for_upgrade: number;
    max_total_offers_per_student: number;
  };
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyDecisionModel {
  id: string;
  student_id: string;
  student_name: string;
  drive_id?: string;
  current_offer_id?: string;
  current_package_lpa?: number;
  new_company: string;
  new_package: number;
  new_offer_category: 'REGULAR' | 'DREAM' | 'SUPER_DREAM';
  decision: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  reason: string;
  applicable_rule: string;
  required_condition?: string;
  timestamp: string;
  override_status?: 'NONE' | 'OVERRIDDEN';
  override_reason?: string;
  overridden_by?: string;
}

export interface OfferModel {
  id: string;
  student_id: string;
  student_name?: string;
  company_id: string;
  company_name: string;
  package: string;
  package_lpa: number;
  category: 'REGULAR' | 'DREAM' | 'SUPER_DREAM';
  status: 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'JOINED';
  issued_at: string;
  accepted_at?: string;
  joining_date?: string;
  location?: string;
  signature?: string;
}

export interface AttendanceModel {
  id: string;
  drive_id: string;
  student_id: string;
  check_in_time: string;
  verified_by: string;
  method: 'QR_SCAN' | 'MANUAL';
  created_at: string;
}

export interface AuditLogModel {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address?: string;
  timestamp: string;
  override_status?: string;
  override_reason?: string;
  overridden_by?: string;
}

// =============================================================
// AI SKILL VERIFICATION & ASSESSMENT SYSTEM TYPES
// =============================================================

export interface ResumeExtractedData {
  programmingLanguages: string[];
  frameworks: string[];
  technologies: string[];
  databases: string[];
  tools: string[];
  cloudTechnologies: string[];
  softSkills: string[];
  certifications: string[];
  projects: Array<{ title: string; tech: string; description: string }>;
  internships: Array<{ role: string; company: string; duration: string; description: string }>;
  education: Array<{ degree: string; institution: string; year: string; cgpa?: string }>;
  experience: Array<{ role: string; organization: string; duration: string }>;
  allSkills: string[];
  atsScore: number;
  summary: string;
}

export interface ResumeSkillModel {
  id: string;
  student_id: string;
  skill_name: string;
  category: 'programming' | 'framework' | 'database' | 'tool' | 'cloud' | 'soft_skill' | 'technology';
  source: 'resume_extracted' | 'manual_added';
  claimed_at: string;
  is_verified: boolean;
  verified_score?: number;
}

export interface SkillScoreModel {
  id: string;
  student_id: string;
  skill_name: string;
  claimed: boolean;
  verified_score: number; // 0 - 100
  category: string;
  status: 'CLAIMED_ONLY' | 'ASSESSMENT_VERIFIED';
  level_cleared: number; // 1, 2, 3
  last_assessed_at?: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number; // Kept secure on backend during active test
  explanation?: string;
  skill: string;
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  questionType: 'mcq' | 'code_output' | 'debugging' | 'scenario' | 'concept';
  timeLimitSeconds: number; // 1 min (60s)
  level: 1 | 2 | 3;
}

export interface StudentAnswer {
  question_id: string;
  selected_option: number;
  is_correct?: boolean;
  time_taken_seconds: number;
  answered_at: string;
}

export interface AssessmentSession {
  id: string;
  student_id: string;
  level: 1 | 2 | 3;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  current_question_index: number;
  questions: AssessmentQuestion[];
  answers: StudentAnswer[];
  passing_threshold_pct: number;
  started_at: string;
  completed_at?: string;
  total_questions: number;
  time_limit_per_question_sec: number;
}

export interface AssessmentResultModel {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name: string;
  level: 1 | 2 | 3;
  status: 'PASSED' | 'FAILED';
  passing_threshold_pct: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  total_time_taken_seconds: number;
  average_response_time_seconds: number;
  skill_breakdown: Record<string, { total: number; correct: number; percentage: number }>;
  ai_summary: string;
  next_level_unlocked: boolean;
  completed_at: string;
}

export interface CertificateModel {
  id: string;
  student_id: string;
  student_name: string;
  certificate_name: string;
  skill_or_course_name: string;
  issuing_organization: string;
  issue_date: string;
  certificate_id?: string;
  file_url: string;
  file_name: string;
  file_type: 'pdf' | 'jpg' | 'jpeg' | 'png';
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verification_type: 'AI_PLATFORM_VERIFIED' | 'STUDENT_UPLOADED';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface AssessmentSettingsModel {
  passing_threshold_percentage: number; // default 80
  level1_time_limit_sec: number; // 60
  level2_time_limit_sec: number; // 60
  level3_time_limit_sec: number; // 60
  questions_per_level: number; // 5
  strong_skill_threshold: number; // 85
  developing_skill_threshold: number; // 70
  auto_advance_levels: boolean;
}

export interface CandidateVerifiedSkillProfile {
  student: StudentProfile;
  resume_skills: ResumeSkillModel[];
  verified_skills: SkillScoreModel[];
  additional_skills: string[];
  certifications: CertificateModel[];
  highest_level_cleared: number;
  level_progress: {
    level1_cleared: boolean;
    level2_cleared: boolean;
    level3_cleared: boolean;
  };
  overall_verified_score: number;
  latest_assessment_result?: AssessmentResultModel;
  total_questions_attempted: number;
  total_correct_answers: number;
  average_response_time_sec: number;
}

// =============================================================
// SMART PLACEMENT ROOM ALLOCATION & NOTIFICATION TYPES
// =============================================================

export type RoomType = 'Seminar Hall' | 'Auditorium' | 'Computer Lab' | 'Classroom' | 'Conference Room';

export interface CollegeRoom {
  id: string;
  name: string;
  block: string;
  floor: string;
  capacity: number;
  type: RoomType;
  facilities: string[];
  isActive: boolean;
  code: string;
}

export type AcademicScheduleType = 'Class' | 'Examination' | 'Workshop' | 'Laboratory';
export type AcademicScheduleStatus = 'SCHEDULED' | 'MOVED' | 'RESCHEDULED' | 'CANCELLED';

export interface AcademicSchedule {
  id: string;
  title: string;
  code: string;
  type: AcademicScheduleType;
  roomId: string;
  roomName: string;
  instructor: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  registeredCount: number;
  status: AcademicScheduleStatus;
  originalRoomId?: string;
  originalRoomName?: string;
  resolutionNote?: string;
}

export type AllocationConflictStatus = 'NO_CONFLICT' | 'CONFLICT_DETECTED' | 'CONFLICT_RESOLVED';
export type PlacementAllocationStatus = 'PENDING' | 'SUGGESTED' | 'ALLOCATED' | 'CONFLICT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type AllocationNotificationStatus = 'NOT_SENT' | 'SENT' | 'UPDATED';

export interface PlacementDriveAllocation {
  id: string;
  companyId?: string;
  companyName: string;
  jobId?: string;
  jobTitle?: string;
  driveRound: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reportingTime: string;
  registeredStudentsCount: number;
  requiredCapacity: number;
  allocatedRoomId?: string;
  allocatedRoomName?: string;
  allocatedRoomCapacity?: number;
  allocatedRoomBlock?: string;
  registeredStudentIds: string[];
  conflictStatus: AllocationConflictStatus;
  conflictDetails?: {
    conflictType: 'CLASS_SCHEDULE' | 'EXAMINATION' | 'WORKSHOP' | 'OVERLAPPING_PLACEMENT';
    conflictingEntityId: string;
    conflictingEntityTitle: string;
    instructor?: string;
    roomName: string;
    timeSlot: string;
    detectedAt: string;
  };
  allocationStatus: PlacementAllocationStatus;
  notificationStatus: AllocationNotificationStatus;
  notificationsSentCount: number;
  lastNotifiedAt?: string;
  importantInstructions: string;
  createdAt: string;
  updatedAt: string;
}

export type ConflictResolutionAction = 
  | 'CHANGE_CLASSROOM' 
  | 'CHANGE_PLACEMENT_ROOM' 
  | 'RESCHEDULE_CLASS' 
  | 'RESCHEDULE_PLACEMENT';

export interface AdministrationAlert {
  id: string;
  allocationId: string;
  companyName: string;
  roomId: string;
  roomName: string;
  date: string;
  timeSlot: string;
  conflictType: 'CLASS_SCHEDULE' | 'EXAMINATION' | 'WORKSHOP' | 'OVERLAPPING_PLACEMENT';
  conflictingScheduleId: string;
  conflictingScheduleTitle: string;
  conflictingInstructor?: string;
  alertMessage: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  resolutionAction?: ConflictResolutionAction;
  resolutionDetails?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface RoomAllocationStats {
  totalRooms: number;
  totalCapacity: number;
  activeAllocations: number;
  confirmedAllocations: number;
  conflictCount: number;
  notificationsSentTotal: number;
  studentsAccommodatedToday: number;
}


