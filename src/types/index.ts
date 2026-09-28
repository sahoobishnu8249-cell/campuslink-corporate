export type UserRole = 'student' | 'recruiter' | 'tpo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
  department?: string;
  createdAt: string;
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
  placementStatus?: 'Not Placed' | 'In Process' | 'Placed';
  placedCompany?: string;
  placedPackage?: string;
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
  minCgpa: number;
  openings: number;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Postponed';
  panelMembers: string[];
  shortlistedCount: number;
  conflictDetails?: ConflictCheckResult;
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
  status: 'Offer Generated' | 'Pending Acceptance' | 'Accepted' | 'Declined' | 'Deferred' | 'Withdrawn' | 'Joined';
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
  status: 'Offer Generated' | 'Pending Acceptance' | 'Accepted' | 'Declined' | 'Deferred' | 'Withdrawn' | 'Joined';
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
  | 'status_change';

export interface NotificationItem {
  id: string;
  userId: string;
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
