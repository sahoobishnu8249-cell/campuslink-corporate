import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { 
  User, 
  StudentProfile, 
  RecruiterProfile, 
  Company,
  JobPosting, 
  Drive,
  Application, 
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
  ReadinessLevel,
  ReadinessBreakdown,
  OtpRecord,
  PlacementPassportModel,
  PassportVerificationModel,
  StudentSkillModel,
  DriveCandidateModel,
  InterviewQueueModel,
  InterviewRoundModel,
  PlacementPolicyModel,
  PolicyDecisionModel,
  OfferModel,
  AttendanceModel,
  AuditLogModel,
  QueueStatus,
  PassportStatus,
  ResumeExtractedData,
  ResumeSkillModel,
  SkillScoreModel,
  AssessmentQuestion,
  StudentAnswer,
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
} from '../src/types/index.ts';
import {
  initialCollegeRooms,
  initialAcademicSchedules,
  initialPlacementAllocations,
  initialAdminAlerts,
  detectRoomConflicts,
  suggestSuitableRooms,
  isTimeOverlapping
} from './roomAllocationService.ts';

export const dbEvents = new EventEmitter();

export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export function hashPassword(password: string): string {
  const salt = 'campuslink_secret_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  return hashPassword(password) === hash;
}

export function hashOtp(otp: string): string {
  const salt = 'campuslink_otp_secret_salt_2026';
  return crypto.createHash('sha256').update(otp + salt).digest('hex');
}

export function verifyOtpHash(otp: string, storedHash: string): boolean {
  return hashOtp(otp) === storedHash;
}

export interface DatabaseSchema {
  users: User[];
  studentProfiles: StudentProfile[];
  recruiterProfiles: RecruiterProfile[];
  companies: Company[];
  jobs: JobPosting[];
  drives: Drive[];
  applications: Application[];
  interviews: InterviewRecord[];
  offers: OfferRecord[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  scoringWeights: ScoringWeights;
  matchingWeights: MatchingWeights;
  otpRecords?: OtpRecord[];
  passports?: PlacementPassportModel[];
  passportVerifications?: PassportVerificationModel[];
  studentSkills?: StudentSkillModel[];
  driveCandidates?: DriveCandidateModel[];
  interviewQueues?: InterviewQueueModel[];
  interviewRounds?: InterviewRoundModel[];
  placementPolicies?: PlacementPolicyModel[];
  policyDecisions?: PolicyDecisionModel[];
  offerEntities?: OfferModel[];
  attendances?: AttendanceModel[];
  auditLogs?: AuditLogModel[];
  resumeSkills?: ResumeSkillModel[];
  skillScores?: SkillScoreModel[];
  assessmentSessions?: AssessmentSession[];
  assessmentResults?: AssessmentResultModel[];
  certificates?: CertificateModel[];
  assessmentSettings?: AssessmentSettingsModel;
  resumeAnalyses?: Record<string, ResumeExtractedData>;
  rooms?: CollegeRoom[];
  academicSchedules?: AcademicSchedule[];
  placementAllocations?: PlacementDriveAllocation[];
  adminAlerts?: AdministrationAlert[];
}

export const defaultAssessmentSettings: AssessmentSettingsModel = {
  passing_threshold_percentage: 80,
  level1_time_limit_sec: 60,
  level2_time_limit_sec: 60,
  level3_time_limit_sec: 90,
  questions_per_level: 5,
  strong_skill_threshold: 85,
  developing_skill_threshold: 70,
  auto_advance_levels: true
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'campuslink_db.json');

// Default Configurable Weights
export const defaultScoringWeights: ScoringWeights = {
  technicalWeight: 0.25,
  academicWeight: 0.20,
  projectsWeight: 0.15,
  certificationsWeight: 0.10,
  aptitudeWeight: 0.10,
  communicationWeight: 0.10,
  interviewWeight: 0.10
};

export const defaultMatchingWeights: MatchingWeights = {
  technicalSkillMatch: 0.40,
  academicEligibility: 0.20,
  projectRelevance: 0.15,
  certificationMatch: 0.10,
  interviewPerformance: 0.15
};

// ----------------- AI HELPER ENGINES -----------------

// Calculate Student Readiness Score Deterministically
export function computeReadiness(profile: Partial<StudentProfile>, weights: ScoringWeights = defaultScoringWeights): {
  score: number;
  level: ReadinessLevel;
  breakdown: ReadinessBreakdown;
} {
  // 1. Technical Skills score (skills count, diversity, standard stack)
  const skills = profile.skills || [];
  const techScore = Math.min(100, Math.round((skills.length / 8) * 85 + (skills.includes('React') || skills.includes('Python') ? 15 : 0)));

  // 2. Academic score based on CGPA and backlogs
  const cgpa = profile.cgpa ?? 8.0;
  const backlogs = profile.backlogs ?? 0;
  let academicScore = Math.min(100, Math.round((cgpa / 10) * 100));
  if (backlogs > 0) academicScore = Math.max(0, academicScore - backlogs * 15);

  // 3. Projects score
  const projects = profile.projects || [];
  const projectScore = Math.min(100, Math.round((projects.length / 3) * 80 + (projects.some(p => p.githubLink) ? 20 : 10)));

  // 4. Certifications score
  const certs = profile.certifications || [];
  const certScore = Math.min(100, Math.round(certs.length * 25));

  // 5. Aptitude score
  const aptScore = profile.aptitudeScore ?? 75;

  // 6. Communication score
  const commScore = profile.communicationScore ?? 75;

  // 7. Mock Interview score
  const mockScore = profile.mockInterviewScore ?? 78;

  const totalWeighted = 
    techScore * weights.technicalWeight +
    academicScore * weights.academicWeight +
    projectScore * weights.projectsWeight +
    certScore * weights.certificationsWeight +
    aptScore * weights.aptitudeWeight +
    commScore * weights.communicationWeight +
    mockScore * weights.interviewWeight;

  const finalScore = Math.min(100, Math.max(10, Math.round(totalWeighted)));

  let level: ReadinessLevel = 'NOT READY';
  if (finalScore >= 90) level = 'HIGHLY EMPLOYABLE';
  else if (finalScore >= 75) level = 'READY';
  else if (finalScore >= 60) level = 'DEVELOPING';

  return {
    score: finalScore,
    level,
    breakdown: {
      technical: techScore,
      academic: academicScore,
      projects: projectScore,
      certifications: certScore,
      aptitude: aptScore,
      communication: commScore,
      interview: mockScore
    }
  };
}

// TF-IDF & Skill Match Algorithm
export function calculateMatchAndExplanation(
  student: StudentProfile,
  job: JobPosting,
  weights: MatchingWeights = defaultMatchingWeights
) {
  // Check Hard Eligibility Criteria
  const cgpaEligible = student.cgpa >= job.minCgpa;
  const branchEligible = job.allowedBranches.some(b => 
    b.toLowerCase().includes(student.branch.toLowerCase()) || 
    b.toLowerCase().includes('all') ||
    student.branch.toLowerCase().includes(b.toLowerCase())
  );
  const backlogEligible = (student.backlogs ?? 0) <= (job.maxBacklogs ?? 0);
  const isHardEligible = cgpaEligible && branchEligible && backlogEligible;

  // Technical Skill Matching (Set comparison & cosine token overlap)
  const reqSkills = job.skills.map(s => s.toLowerCase().trim());
  const studentSkills = student.skills.map(s => s.toLowerCase().trim());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  job.skills.forEach(skill => {
    const sLower = skill.toLowerCase().trim();
    if (studentSkills.some(st => st.includes(sLower) || sLower.includes(st))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const technicalSkillMatch = reqSkills.length > 0 
    ? Math.round((matchedSkills.length / reqSkills.length) * 100)
    : 85;

  const academicEligibility = cgpaEligible ? Math.min(100, Math.round((student.cgpa / 10) * 100)) : 40;

  // Project Relevance (Keyword matching in project titles/descriptions)
  let projRelevanceCount = 0;
  student.projects.forEach(p => {
    const text = (p.title + ' ' + p.tech + ' ' + p.description).toLowerCase();
    if (reqSkills.some(s => text.includes(s))) projRelevanceCount++;
  });
  const projectRelevance = student.projects.length > 0 
    ? Math.min(100, Math.round((projRelevanceCount / Math.max(1, student.projects.length)) * 60 + 35))
    : 45;

  const certificationMatch = student.certifications.length > 0
    ? Math.min(100, student.certifications.length * 35)
    : 40;

  const interviewPerformance = student.mockInterviewScore || 80;

  const rawMatch = 
    technicalSkillMatch * weights.technicalSkillMatch +
    academicEligibility * weights.academicEligibility +
    projectRelevance * weights.projectRelevance +
    certificationMatch * weights.certificationMatch +
    interviewPerformance * weights.interviewPerformance;

  const overallMatch = isHardEligible 
    ? Math.min(98, Math.max(25, Math.round(rawMatch)))
    : Math.min(55, Math.round(rawMatch * 0.6));

  const isShortlisted = isHardEligible && overallMatch >= 70;

  const positiveFactors: string[] = [];
  const gapFactors: string[] = [];

  if (cgpaEligible) positiveFactors.push(`CGPA ${student.cgpa.toFixed(2)} satisfies the benchmark (>= ${job.minCgpa})`);
  else gapFactors.push(`CGPA ${student.cgpa.toFixed(2)} is below minimum requirement (${job.minCgpa})`);

  if (branchEligible) positiveFactors.push(`Degree branch (${student.branch}) matches eligible hiring streams`);
  else gapFactors.push(`Branch ${student.branch} is not in allowed departments`);

  if (matchedSkills.length > 0) {
    positiveFactors.push(`Strong proficiency in core required skills: ${matchedSkills.slice(0, 3).join(', ')}`);
  }

  if (missingSkills.length > 0) {
    gapFactors.push(`Lacks essential tooling/frameworks: ${missingSkills.slice(0, 3).join(', ')}`);
  }

  if (student.projects.length >= 2) {
    positiveFactors.push(`Solid hands-on project portfolio with GitHub repositories`);
  }

  if (student.mockInterviewScore < 75) {
    gapFactors.push(`Mock interview score (${student.mockInterviewScore}/100) below recruiter benchmark (75/100)`);
  } else {
    positiveFactors.push(`Mock technical interview score (${student.mockInterviewScore}/100) shows strong readiness`);
  }

  const assessmentBenchmark = student.mockInterviewScore >= 75
    ? `Meets technical benchmark (Candidate: ${student.mockInterviewScore}%, Benchmark: 75%)`
    : `Below recommended threshold (Candidate: ${student.mockInterviewScore}%, Benchmark: 75%)`;

  const summary = isShortlisted
    ? `Candidate is SHORTLISTED based on high technical skill alignment (${technicalSkillMatch}%), strong academic credentials (${student.cgpa}/10.0), and verified mock assessment scores.`
    : `Candidate is NOT SHORTLISTED. Main gaps are: ${missingSkills.length > 0 ? missingSkills.join(', ') : 'academic / assessment benchmarks'}. Review recommended actions below.`;

  const recommendedAction = isShortlisted
    ? `Prepare for technical live coding round and review ${job.companyName}'s system design requirements.`
    : `Complete targeted courses in ${missingSkills.slice(0, 2).join(' and ') || 'data structures'}, build a domain project, and retake the mock technical assessment.`;

  return {
    eligibilityStatus: (isHardEligible ? 'Eligible' : 'Not Eligible') as 'Eligible' | 'Not Eligible',
    eligibilityReasons: isHardEligible 
      ? ['All criteria met: CGPA, branch, and zero backlogs verified'] 
      : gapFactors,
    matchScore: overallMatch,
    matchBreakdown: {
      technicalSkillMatch,
      academicEligibility,
      projectRelevance,
      certificationMatch,
      interviewPerformance
    },
    explainableMatch: {
      isShortlisted,
      summary,
      matchedSkills,
      missingSkills,
      positiveFactors,
      gapFactors,
      assessmentBenchmark,
      recommendedAction
    }
  };
}

// ----------------- SEED DATA -----------------

const initialUsers: User[] = [
  // 0. Primary Featured Student from UI (Aarav Reddy)
  {
    id: 'user_student_aarav',
    _id: 'user_student_aarav',
    name: 'Aarav Reddy',
    email: 'aarav.reddy@campus.edu',
    college_id: '2022UGCS001',
    phone: '+91 98450 12345',
    branch: 'Computer Science & Engineering',
    role: 'student',
    email_verified: true,
    account_status: 'active',
    avatar: 'AR',
    title: 'B.Tech CSE · 2026',
    department: 'Computer Science & Engineering',
    createdAt: '2026-08-01T09:00:00Z',
  },
  // 1. Student Secondary (Bishnu Demo)
  {
    id: 'user_student_bishnu',
    _id: 'user_student_bishnu',
    name: 'Bishnu Sahoo',
    email: 'demo.bishnu@campus.edu',
    college_id: 'DEMO2026001',
    phone: '+91 98765 43210',
    branch: 'MCA',
    role: 'student',
    email_verified: true,
    account_status: 'active',
    avatar: 'BS',
    title: 'Final Year MCA',
    department: 'MCA',
    createdAt: '2026-08-01T10:00:00Z',
  },
  // 2. Student (Priya)
  {
    id: 'user_student_priya',
    _id: 'user_student_priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@campus.edu',
    college_id: '2022UGAI002',
    phone: '+91 98765 11111',
    branch: 'Computer Science & Engineering',
    role: 'student',
    email_verified: true,
    account_status: 'active',
    avatar: 'PS',
    title: 'Final Year B.Tech AI & DS',
    department: 'Artificial Intelligence & Data Science',
    createdAt: '2026-08-05T11:00:00Z',
  },
  // 3. Student (Rahul)
  {
    id: 'user_student_rahul',
    _id: 'user_student_rahul',
    name: 'Rahul Verma',
    email: 'rahul.verma@campus.edu',
    college_id: '2022UGIT003',
    phone: '+91 98765 22222',
    branch: 'Information Technology',
    role: 'student',
    email_verified: true,
    account_status: 'active',
    avatar: 'RV',
    title: 'Final Year B.Tech IT',
    department: 'Information Technology',
    createdAt: '2026-08-10T12:00:00Z',
  },
  // 4. Student (Ananya)
  {
    id: 'user_student_ananya',
    _id: 'user_student_ananya',
    name: 'Ananya Patel',
    email: 'ananya.patel@campus.edu',
    college_id: '2022UGEC004',
    phone: '+91 98765 33333',
    branch: 'Electronics & Communication',
    role: 'student',
    email_verified: true,
    account_status: 'active',
    avatar: 'AP',
    title: 'Final Year B.Tech ECE',
    department: 'Electronics & Communication',
    createdAt: '2026-08-12T09:00:00Z',
  },
  // 5. TPO Officer (Dr. Rajesh Rao)
  {
    id: 'user_officer_rajesh',
    _id: 'user_officer_rajesh',
    name: 'Dr. Rajesh Rao',
    email: 'placement.cell@campus.edu',
    role: 'tpo',
    email_verified: true,
    account_status: 'active',
    avatar: 'RR',
    title: 'Head of Training & Placement Cell',
    department: 'University Placement Office',
    createdAt: '2026-06-15T08:00:00Z',
  },
  // 6. Recruiter (Sarah Jenkins @ Microsoft)
  {
    id: 'user_recruiter_sarah',
    _id: 'user_recruiter_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@microsoft.com',
    role: 'recruiter',
    email_verified: true,
    account_status: 'active',
    avatar: 'SJ',
    title: 'Senior University Talent Lead',
    department: 'Global Campus Recruitment',
    createdAt: '2026-07-20T09:00:00Z',
  },
  // 7. Recruiter (Arjun Mehta @ Google)
  {
    id: 'user_recruiter_arjun',
    _id: 'user_recruiter_arjun',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@google.com',
    role: 'recruiter',
    email_verified: true,
    account_status: 'active',
    avatar: 'AM',
    title: 'Staff University Recruiter',
    department: 'Engineering Hiring',
    createdAt: '2026-07-25T14:30:00Z',
  },
  // 8. Recruiter (Neha Kapoor @ TechNova)
  {
    id: 'user_recruiter_neha',
    _id: 'user_recruiter_neha',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@technova.io',
    role: 'recruiter',
    email_verified: true,
    account_status: 'active',
    avatar: 'NK',
    title: 'Talent Acquisition Director',
    department: 'People Operations',
    createdAt: '2026-07-28T10:00:00Z',
  }
];

// 20+ Realistic Students
const rawStudentsData = [
  { id: 'user_student_aarav', name: 'Aarav Reddy', email: 'aarav.reddy@campus.edu', branch: 'Computer Science & Engineering', cgpa: 8.78, backlogs: 0, skills: ['Python', 'Machine Learning', 'React', 'SQL', 'Data Structures', 'Docker', 'FastAPI'], apt: 85, mock: 84, comm: 86, status: 'In Process' },
  { id: 'user_student_bishnu', name: 'Bishnu Sahoo', email: 'sahoobishnu8249@gmail.com', branch: 'Computer Science & Engineering', cgpa: 8.92, backlogs: 0, skills: ['Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'Git'], apt: 88, mock: 86, comm: 84, status: 'In Process' },
  { id: 'user_student_priya', name: 'Priya Sharma', email: 'priya.sharma@campus.edu', branch: 'Artificial Intelligence & Data Science', cgpa: 9.40, backlogs: 0, skills: ['Python', 'PyTorch', 'TensorFlow', 'SQL', 'FastAPI', 'Pandas', 'AWS'], apt: 94, mock: 92, comm: 90, status: 'Placed', placedCo: 'Google India', placedPkg: '₹34.5 LPA' },
  { id: 'user_student_rahul', name: 'Rahul Verma', email: 'rahul.verma@campus.edu', branch: 'Information Technology', cgpa: 8.45, backlogs: 0, skills: ['Java', 'Spring Boot', 'SQL', 'Microservices', 'Docker', 'Kubernetes'], apt: 82, mock: 80, comm: 78, status: 'In Process' },
  { id: 'user_student_ananya', name: 'Ananya Patel', email: 'ananya.patel@campus.edu', branch: 'Electronics & Communication', cgpa: 8.65, backlogs: 0, skills: ['C++', 'Python', 'Embedded Systems', 'IoT', 'MATLAB', 'Git'], apt: 84, mock: 82, comm: 86, status: 'In Process' },
  { id: 'user_student_karan', name: 'Karan Malhotra', email: 'karan.m@campus.edu', branch: 'Computer Science & Engineering', cgpa: 7.90, backlogs: 0, skills: ['JavaScript', 'React', 'HTML/CSS', 'Tailwind', 'Node.js'], apt: 74, mock: 72, comm: 75, status: 'In Process' },
  { id: 'user_student_sneha', name: 'Sneha Kulkarni', email: 'sneha.k@campus.edu', branch: 'Computer Science & Engineering', cgpa: 9.15, backlogs: 0, skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'Redis', 'Kafka'], apt: 90, mock: 88, comm: 88, status: 'Placed', placedCo: 'Microsoft India', placedPkg: '₹28.0 LPA' },
  { id: 'user_student_aditya', name: 'Aditya Sen', email: 'aditya.sen@campus.edu', branch: 'Mechanical Engineering', cgpa: 7.20, backlogs: 1, skills: ['Python', 'AutoCAD', 'SolidWorks', 'MATLAB', 'C'], apt: 65, mock: 60, comm: 68, status: 'Not Placed' },
  { id: 'user_student_ritika', name: 'Ritika Roy', email: 'ritika.roy@campus.edu', branch: 'Information Technology', cgpa: 8.80, backlogs: 0, skills: ['Python', 'React', 'MongoDB', 'Express', 'Node.js', 'Next.js'], apt: 86, mock: 85, comm: 88, status: 'In Process' },
  { id: 'user_student_vikram', name: 'Vikram Joshi', email: 'vikram.j@campus.edu', branch: 'Computer Science & Engineering', cgpa: 6.85, backlogs: 0, skills: ['Java', 'SQL', 'HTML/CSS', 'Git'], apt: 68, mock: 64, comm: 70, status: 'Not Placed' },
  { id: 'user_student_tanvi', name: 'Tanvi Nair', email: 'tanvi.nair@campus.edu', branch: 'Artificial Intelligence & Data Science', cgpa: 8.75, backlogs: 0, skills: ['Python', 'R', 'Machine Learning', 'SQL', 'Tableau', 'PowerBI'], apt: 85, mock: 84, comm: 86, status: 'In Process' },
  { id: 'user_student_rohit', name: 'Rohit Deshmukh', email: 'rohit.d@campus.edu', branch: 'Electronics & Communication', cgpa: 7.40, backlogs: 0, skills: ['C', 'C++', 'Verilog', 'VLSI', 'Linux'], apt: 72, mock: 70, comm: 68, status: 'Not Placed' },
  { id: 'user_student_divya', name: 'Divya Iyer', email: 'divya.iyer@campus.edu', branch: 'Computer Science & Engineering', cgpa: 9.30, backlogs: 0, skills: ['Go', 'Kubernetes', 'Docker', 'AWS', 'Linux', 'Distributed Systems'], apt: 92, mock: 90, comm: 92, status: 'Placed', placedCo: 'Amazon Web Services', placedPkg: '₹32.0 LPA' },
  { id: 'user_student_manish', name: 'Manish Pandey', email: 'manish.p@campus.edu', branch: 'Information Technology', cgpa: 6.40, backlogs: 2, skills: ['HTML', 'CSS', 'JavaScript'], apt: 54, mock: 50, comm: 55, status: 'Not Placed' }, // At-Risk student
  { id: 'user_student_pooja', name: 'Pooja Hegde', email: 'pooja.h@campus.edu', branch: 'Computer Science & Engineering', cgpa: 8.50, backlogs: 0, skills: ['Flutter', 'Dart', 'Firebase', 'React Native', 'Mobile Security'], apt: 82, mock: 80, comm: 84, status: 'In Process' },
  { id: 'user_student_siddharth', name: 'Siddharth Rao', email: 'siddharth.r@campus.edu', branch: 'Mechanical Engineering', cgpa: 8.10, backlogs: 0, skills: ['MATLAB', 'Python', 'ANSYS', 'CATIA', 'Robotics'], apt: 78, mock: 75, comm: 76, status: 'In Process' },
  { id: 'user_student_megha', name: 'Megha Bansal', email: 'megha.b@campus.edu', branch: 'Electronics & Communication', cgpa: 8.90, backlogs: 0, skills: ['C++', 'Digital Signal Processing', 'Python', 'Embedded C', 'RTOS'], apt: 88, mock: 86, comm: 85, status: 'Placed', placedCo: 'Cisco Systems', placedPkg: '₹22.5 LPA' },
  { id: 'user_student_abhishek', name: 'Abhishek Kumar', email: 'abhishek.k@campus.edu', branch: 'Information Technology', cgpa: 7.70, backlogs: 0, skills: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'Bootstrap'], apt: 72, mock: 68, comm: 72, status: 'In Process' },
  { id: 'user_student_swati', name: 'Swati Mishra', email: 'swati.m@campus.edu', branch: 'Artificial Intelligence & Data Science', cgpa: 9.05, backlogs: 0, skills: ['Python', 'NLP', 'Computer Vision', 'PyTorch', 'Transformers', 'FastAPI'], apt: 90, mock: 89, comm: 88, status: 'In Process' },
  { id: 'user_student_aravind', name: 'Aravind Swaminathan', email: 'aravind.s@campus.edu', branch: 'Computer Science & Engineering', cgpa: 5.90, backlogs: 3, skills: ['C', 'Java Basics'], apt: 48, mock: 42, comm: 50, status: 'Not Placed' }, // High At-Risk student
  { id: 'user_student_isha', name: 'Isha Reddy', email: 'isha.reddy@campus.edu', branch: 'Computer Science & Engineering', cgpa: 8.85, backlogs: 0, skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'PostgreSQL', 'Tailwind'], apt: 87, mock: 85, comm: 86, status: 'In Process' },
  { id: 'user_student_deepak', name: 'Deepak Choudhary', email: 'deepak.c@campus.edu', branch: 'Mechanical Engineering', cgpa: 6.95, backlogs: 1, skills: ['AutoCAD', 'SolidWorks', 'Manufacturing'], apt: 62, mock: 58, comm: 60, status: 'Not Placed' }
];

const initialStudentProfiles: StudentProfile[] = rawStudentsData.map((s, idx) => {
  const readiness = computeReadiness({
    skills: s.skills,
    cgpa: s.cgpa,
    backlogs: s.backlogs,
    projects: [
      { id: `proj_${idx}_1`, title: `${s.skills[0] || 'Web'} Application Hub`, tech: s.skills.slice(0, 3).join(', '), description: 'Full-fledged production system built for campus and enterprise needs.', githubLink: 'https://github.com/campus-projects' },
      { id: `proj_${idx}_2`, title: `AI Intelligent Analytics Engine`, tech: 'Python, ML, SQL', description: 'Predictive data pipeline analyzing institutional metrics and throughput.', githubLink: 'https://github.com/analytics' }
    ],
    certifications: idx % 2 === 0 ? ['AWS Certified Cloud Practitioner', 'MongoDB Certified Developer'] : ['Oracle Certified Java Associate'],
    aptitudeScore: s.apt,
    communicationScore: s.comm,
    mockInterviewScore: s.mock
  });

  return {
    userId: s.id,
    fullName: s.name,
    email: s.email,
    phone: `+91 98${Math.floor(10000000 + idx * 87654)}`,
    university: 'National Institute of Technology',
    rollNumber: `2022UG${s.branch.split(' ')[0]}${String(idx + 1).padStart(3, '0')}`,
    degree: 'B.Tech',
    branch: s.branch,
    graduationYear: 2026,
    cgpa: s.cgpa,
    maxCgpa: 10,
    backlogs: s.backlogs,
    skills: s.skills,
    bio: `Driven final year ${s.branch} undergraduate committed to software craftsmanship, scalable systems, and continuous technological learning.`,
    github: `https://github.com/${s.name.toLowerCase().replace(/\s+/g, '')}`,
    linkedin: `https://linkedin.com/in/${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    portfolio: `https://${s.name.toLowerCase().replace(/\s+/g, '')}.dev`,
    resumeFilename: `${s.name.replace(/\s+/g, '_')}_Official_Resume.pdf`,
    resumeUrl: '#preview-resume',
    resumeScore: Math.min(96, Math.round(readiness.score * 0.95 + 4)),
    projects: [
      { id: `proj_${idx}_1`, title: `${s.skills[0] || 'FullStack'} Cloud Service`, tech: s.skills.slice(0, 3).join(', '), description: 'Microservices architecture with automated CI/CD and secure token authentication.', githubLink: 'https://github.com/project-repo', liveLink: 'https://demo-app.dev' },
      { id: `proj_${idx}_2`, title: 'Intelligent Query Engine', tech: 'Python, REST APIs, SQL', description: 'Fast query caching layer reducing database retrieval latency by 45%.', githubLink: 'https://github.com/fast-query' }
    ],
    experience: idx % 3 === 0 ? [
      { id: `exp_${idx}`, role: 'Summer Software Engineering Intern', company: 'Infosys Springboard', duration: 'May 2025 - July 2025', description: 'Implemented backend microservices in Node/Express and automated unit test coverage.' }
    ] : [],
    certifications: idx % 2 === 0 ? ['AWS Certified Cloud Practitioner', 'MongoDB Certified Associate'] : ['Google Cloud Associate Cloud Engineer'],
    targetRoles: ['Software Engineer', 'Full Stack Developer', 'Cloud Engineer'],
    aptitudeScore: s.apt,
    mockInterviewScore: s.mock,
    communicationScore: s.comm,
    readinessScore: readiness.score,
    readinessLevel: readiness.level,
    readinessBreakdown: readiness.breakdown,
    isVerified: true,
    placementStatus: s.status as any,
    placedCompany: s.placedCo,
    placedPackage: s.placedPkg
  };
});

// Marquee Companies matching UI
const initialCompanies: Company[] = [
  {
    id: 'comp_meridian',
    name: 'Meridian Labs',
    industry: 'Machine Learning & Applied AI',
    location: 'Bangalore / Hybrid',
    website: 'https://meridianlabs.ai',
    logo: 'MV',
    recruiterId: 'user_recruiter_sarah',
    recruiterName: 'Elena Rostova',
    recruiterEmail: 'elena@meridianlabs.ai',
    hiringStatus: 'Active',
    description: 'Pioneering multimodal foundation models, high-throughput transformer inference, and synthetic data engines.',
    activeDrivesCount: 1,
    totalHires: 8
  },
  {
    id: 'comp_northwind',
    name: 'Northwind Fintech',
    industry: 'Financial Technology & Quantitative Analytics',
    location: 'Mumbai / Bangalore',
    website: 'https://northwindfin.com',
    logo: 'NF',
    recruiterId: 'user_recruiter_neha',
    recruiterName: 'Rohan Deshmukh',
    recruiterEmail: 'rohan@northwindfin.com',
    hiringStatus: 'Active',
    description: 'Next-generation algorithmic trading rails, credit risk scoring platforms, and real-time payment settlement networks.',
    activeDrivesCount: 1,
    totalHires: 12
  },
  {
    id: 'comp_cedar',
    name: 'Cedar Solutions',
    industry: 'Data Infrastructure & Cloud Analytics',
    location: 'Hyderabad / Remote',
    website: 'https://cedarsolutions.io',
    logo: 'CS',
    recruiterId: 'user_recruiter_arjun',
    recruiterName: 'Tara Sengupta',
    recruiterEmail: 'tara@cedarsolutions.io',
    hiringStatus: 'Active',
    description: 'Enterprise data lakes, automated ETL pipelines, and real-time business telemetry for global healthcare & retail.',
    activeDrivesCount: 1,
    totalHires: 15
  },
  {
    id: 'comp_helio',
    name: 'Helio Robotics',
    industry: 'Autonomous Systems & Embedded AI',
    location: 'Bangalore / Pune',
    website: 'https://heliorobotics.tech',
    logo: 'HL',
    recruiterId: 'user_recruiter_sarah',
    recruiterName: 'Vikram Seth',
    recruiterEmail: 'vikram@heliorobotics.tech',
    hiringStatus: 'Active',
    description: 'Building autonomous warehouse robotics, sensor fusion platforms, and computer vision guidance stacks.',
    activeDrivesCount: 1,
    totalHires: 6
  },
  {
    id: 'comp_technova',
    name: 'TechNova Solutions',
    industry: 'Enterprise Software & Cloud Platforms',
    location: 'Bangalore / Hyderabad / Pune',
    website: 'https://technova.io',
    logo: 'TECH',
    recruiterId: 'user_recruiter_neha',
    recruiterName: 'Neha Kapoor',
    recruiterEmail: 'neha.kapoor@technova.io',
    hiringStatus: 'Active',
    description: 'Pioneering enterprise AI platforms and scalable cloud orchestration systems for Fortune 500 businesses.',
    activeDrivesCount: 2,
    totalHires: 14
  },
  {
    id: 'comp_microsoft',
    name: 'Microsoft India',
    industry: 'Cloud Infrastructure & Product Engineering',
    location: 'Hyderabad / Bangalore / Noida',
    website: 'https://careers.microsoft.com',
    logo: 'MSFT',
    recruiterId: 'user_recruiter_sarah',
    recruiterName: 'Sarah Jenkins',
    recruiterEmail: 'sarah.jenkins@microsoft.com',
    hiringStatus: 'Active',
    description: 'Empowering every person and organization on the planet to achieve more with Azure, Office, and Windows engineering.',
    activeDrivesCount: 1,
    totalHires: 22
  },
  {
    id: 'comp_google',
    name: 'Google India',
    industry: 'Search, AI Systems & Global Infrastructure',
    location: 'Bangalore / Hyderabad',
    website: 'https://buildyourfuture.withgoogle.com',
    logo: 'GOOG',
    recruiterId: 'user_recruiter_arjun',
    recruiterName: 'Arjun Mehta',
    recruiterEmail: 'arjun.mehta@google.com',
    hiringStatus: 'Active',
    description: 'Building world-scale AI, Android, YouTube, and Cloud systems serving billions of daily active users.',
    activeDrivesCount: 1,
    totalHires: 12
  },
  {
    id: 'comp_aws',
    name: 'Amazon Web Services',
    industry: 'Cloud Computing & Distributed Systems',
    location: 'Hyderabad / Bangalore / Chennai',
    website: 'https://amazon.jobs',
    logo: 'AWS',
    recruiterId: 'user_recruiter_sarah',
    recruiterName: 'Anand Krishnan',
    recruiterEmail: 'anand.k@amazon.com',
    hiringStatus: 'Active',
    description: 'The world’s most comprehensive and broadly adopted cloud platform offering over 200 fully featured services.',
    activeDrivesCount: 1,
    totalHires: 18
  },
  {
    id: 'comp_cisco',
    name: 'Cisco Systems',
    industry: 'Networking, Cyber Security & IoT',
    location: 'Bangalore',
    website: 'https://jobs.cisco.com',
    logo: 'CSCO',
    recruiterId: 'user_recruiter_neha',
    recruiterName: 'Priyanka Verma',
    recruiterEmail: 'p.verma@cisco.com',
    hiringStatus: 'Active',
    description: 'Transforming how people connect, communicate, and collaborate securely across globally distributed networks.',
    activeDrivesCount: 1,
    totalHires: 15
  }
];

const initialRecruiterProfiles: RecruiterProfile[] = [
  {
    userId: 'user_recruiter_sarah',
    companyId: 'comp_microsoft',
    companyName: 'Microsoft India',
    recruiterName: 'Sarah Jenkins',
    title: 'Senior University Talent Acquisition Lead',
    email: 'sarah.jenkins@microsoft.com',
    phone: '+91 98765 11223',
    companyWebsite: 'https://careers.microsoft.com',
    companyLogo: 'MSFT',
    industry: 'Cloud & Software Engineering',
    headquarters: 'Redmond, WA · India IDC Hyderabad',
    companyBio: 'Overseeing graduate and intern recruitment for Microsoft IDC across India premier campuses.',
    activeDrivesCount: 1
  },
  {
    userId: 'user_recruiter_arjun',
    companyId: 'comp_google',
    companyName: 'Google India',
    recruiterName: 'Arjun Mehta',
    title: 'Staff University Recruiter',
    email: 'arjun.mehta@google.com',
    phone: '+91 98765 44332',
    companyWebsite: 'https://buildyourfuture.withgoogle.com',
    companyLogo: 'GOOG',
    industry: 'Internet & Artificial Intelligence',
    headquarters: 'Mountain View, CA · Bangalore',
    companyBio: 'Partnering with academic institutions to identify exceptional future engineers for Google Engineering.',
    activeDrivesCount: 1
  },
  {
    userId: 'user_recruiter_neha',
    companyId: 'comp_technova',
    companyName: 'TechNova Solutions',
    recruiterName: 'Neha Kapoor',
    title: 'Talent Acquisition Director',
    email: 'neha.kapoor@technova.io',
    phone: '+91 98765 88990',
    companyWebsite: 'https://technova.io',
    companyLogo: 'TECH',
    industry: 'Enterprise Software & Cloud Platforms',
    headquarters: 'Bangalore, India',
    companyBio: 'Leading early-career university hiring and strategic placement partnerships across top-tier campuses.',
    activeDrivesCount: 2
  }
];

// 12 Realistic Job Postings
const initialJobs: JobPosting[] = [
  {
    id: 'job_meridian_ml',
    companyId: 'comp_meridian',
    recruiterId: 'user_recruiter_sarah',
    companyName: 'Meridian Labs',
    companyLogo: 'MV',
    title: 'ML Engineer Intern',
    department: 'Applied Machine Learning & GenAI',
    location: 'Bangalore / Hybrid',
    type: 'Internship',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹80,000 / mo (PPO ₹26 LPA)',
    minCgpa: 8.0,
    allowedBranches: ['Computer Science & Engineering', 'Artificial Intelligence & Data Science', 'Information Technology'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Work on foundational deep learning models, transformer fine-tuning, and scalable inference microservices.',
    responsibilities: [
      'Design PyTorch and TensorFlow distributed training scripts',
      'Optimize LLM inference latency with TensorRT and ONNX',
      'Deploy FastAPI model inference endpoints behind Kubernetes clusters'
    ],
    requirements: [
      'Strong proficiency in Python, PyTorch, and linear algebra',
      'Understanding of transformers, attention mechanisms, and embeddings',
      'Minimum CGPA 8.0 with zero backlogs'
    ],
    skills: ['Python', 'PyTorch', 'Machine Learning', 'FastAPI', 'Docker'],
    status: 'Active',
    applicationDeadline: '2026-10-25',
    openingsCount: 4,
    applicantCount: 38,
    driveDate: '2026-10-30',
    driveTime: '09:00 AM - 05:00 PM',
    venue: 'AI Computing Hub',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'job_northwind_analyst',
    companyId: 'comp_northwind',
    recruiterId: 'user_recruiter_neha',
    companyName: 'Northwind Fintech',
    companyLogo: 'NF',
    title: 'Product Analyst',
    department: 'Growth Analytics & Algorithmic Settlement',
    location: 'Mumbai / Bangalore',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹14.0 - ₹18.5 LPA',
    minCgpa: 7.5,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'All Engineering Disciplines'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Conduct quantitative cohort analysis, conversion funnel instrumentation, and algorithmic user segmentation.',
    responsibilities: [
      'Author complex SQL queries for transaction stream aggregations',
      'Develop real-time business telemetry in Tableau and Metabase',
      'Collaborate with Product Managers to launch experiments and A/B tests'
    ],
    requirements: [
      'High SQL proficiency and Python data modeling (Pandas, NumPy)',
      'Sharp product intuition and statistical hypothesis testing',
      'Minimum CGPA 7.5'
    ],
    skills: ['SQL', 'Python', 'Product Analytics', 'Tableau', 'Statistics'],
    status: 'Active',
    applicationDeadline: '2026-10-28',
    openingsCount: 8,
    applicantCount: 45,
    driveDate: '2026-11-04',
    driveTime: '10:00 AM - 04:30 PM',
    venue: 'Virtual Placement Room A',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-12T10:00:00Z'
  },
  {
    id: 'job_cedar_data',
    companyId: 'comp_cedar',
    recruiterId: 'user_recruiter_arjun',
    companyName: 'Cedar Solutions',
    companyLogo: 'CS',
    title: 'Data Associate',
    department: 'Enterprise Data Platform',
    location: 'Hyderabad / Remote',
    type: 'Full-Time',
    workplaceType: 'Remote',
    ctcOrStipend: '₹12.0 - ₹16.0 LPA',
    minCgpa: 7.2,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Build enterprise ETL/ELT pipelines, automate data warehouse syncing, and enforce data quality contracts.',
    responsibilities: [
      'Write data ingestion pipelines in Python, Airflow, and dbt',
      'Optimize relational indexing and analytical query plans in PostgreSQL / Snowflake',
      'Monitor pipeline latency and automated data validation suites'
    ],
    requirements: [
      'Solid command of SQL and Python',
      'Familiarity with cloud data concepts and dimensional modeling',
      'Minimum CGPA 7.2'
    ],
    skills: ['SQL', 'Python', 'ETL', 'PostgreSQL', 'Airflow'],
    status: 'Active',
    applicationDeadline: '2026-11-02',
    openingsCount: 10,
    applicantCount: 30,
    driveDate: '2026-11-08',
    driveTime: '09:30 AM - 04:00 PM',
    venue: 'Computing Complex 2',
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'job_helio_research',
    companyId: 'comp_helio',
    recruiterId: 'user_recruiter_sarah',
    companyName: 'Helio Robotics',
    companyLogo: 'HL',
    title: 'Research Intern',
    department: 'Autonomous Navigation & Robotics Perception',
    location: 'Bangalore / Pune',
    type: 'Internship',
    workplaceType: 'On-Campus',
    ctcOrStipend: '₹65,000 / mo (PPO ₹22 LPA)',
    minCgpa: 7.8,
    allowedBranches: ['Computer Science & Engineering', 'Electronics & Communication', 'Mechanical Engineering'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Implement computer vision algorithms, SLAM tracking, and robot actuation control loops for autonomous robotics.',
    responsibilities: [
      'Develop real-time perception algorithms in C++ and OpenCV',
      'Simulate robotic kinematics and trajectory planning in ROS / Gazebo',
      'Conduct hardware-in-the-loop validation on autonomous platforms'
    ],
    requirements: [
      'Proficiency in C++ and Python',
      'Familiarity with ROS (Robot Operating System) and Linux',
      'Minimum CGPA 7.8'
    ],
    skills: ['C++', 'Python', 'ROS', 'Computer Vision', 'Linux'],
    status: 'Active',
    applicationDeadline: '2026-11-05',
    openingsCount: 5,
    applicantCount: 22,
    driveDate: '2026-11-12',
    driveTime: '10:00 AM - 05:00 PM',
    venue: 'Robotics Center Lab',
    createdAt: '2026-08-16T10:00:00Z',
    updatedAt: '2026-08-16T10:00:00Z'
  },
  {
    id: 'job_technova_swe',
    companyId: 'comp_technova',
    recruiterId: 'user_recruiter_neha',
    companyName: 'TechNova Solutions',
    companyLogo: 'TECH',
    title: 'Software Developer (Full Stack)',
    department: 'Core Product Engineering',
    location: 'Bangalore / Hybrid',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹14.5 - ₹18.0 LPA',
    minCgpa: 7.0,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Design, develop, and scale modern cloud-native web applications using Python, React, SQL, and AWS infrastructure.',
    responsibilities: [
      'Build performant frontend interfaces in React and TypeScript',
      'Architect robust RESTful microservices in Python / Node.js',
      'Optimize database queries and schema designs in PostgreSQL / MongoDB',
      'Participate in code reviews, automated CI/CD deployments, and agile sprint planning'
    ],
    requirements: [
      'Strong proficiency in Python, React, and SQL',
      'Demonstrated understanding of REST APIs and Git version control',
      'Working knowledge of Docker, AWS, or modern cloud fundamentals is a plus',
      'Minimum CGPA of 7.0 with no standing backlogs'
    ],
    skills: ['Python', 'React', 'SQL', 'Git', 'REST API', 'AWS', 'Docker'],
    status: 'Active',
    applicationDeadline: '2026-10-15',
    openingsCount: 12,
    applicantCount: 28,
    driveDate: '2026-10-18',
    driveTime: '09:30 AM - 05:00 PM',
    venue: 'Turing Hall & Computing Lab 3',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'job_microsoft_sde',
    companyId: 'comp_microsoft',
    recruiterId: 'user_recruiter_sarah',
    companyName: 'Microsoft India',
    companyLogo: 'MSFT',
    title: 'Software Development Engineer - I',
    department: 'Azure Distributed Systems & Core OS',
    location: 'Hyderabad / Bangalore',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹28.5 - ₹32.0 LPA',
    minCgpa: 8.0,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science', 'Electronics & Communication'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Work on cutting-edge cloud infrastructure, distributed microservices, and high-throughput data pipelines within Microsoft Azure.',
    responsibilities: [
      'Write highly efficient, robust, and clean code in C++, C#, Java, or Go',
      'Solve distributed systems concurrency, low-latency, and caching challenges',
      'Drive unit testing, integration testing, and telemetry-guided deployments',
      'Collaborate with international teams across Redmond and India Development Centers'
    ],
    requirements: [
      'Solid command of Data Structures, Algorithms, and Object-Oriented Design',
      'Experience in C++, Java, or Python',
      'Strong problem-solving capability and verified high aptitude scores',
      'Minimum CGPA of 8.0 with zero active backlogs'
    ],
    skills: ['C++', 'Java', 'Data Structures', 'Distributed Systems', 'Algorithms', 'SQL'],
    status: 'Active',
    applicationDeadline: '2026-10-20',
    openingsCount: 8,
    applicantCount: 42,
    driveDate: '2026-10-24',
    driveTime: '10:00 AM - 06:00 PM',
    venue: 'Campus Main Auditorium & CSE Labs',
    createdAt: '2026-08-12T11:00:00Z',
    updatedAt: '2026-08-12T11:00:00Z'
  },
  {
    id: 'job_google_swe',
    companyId: 'comp_google',
    recruiterId: 'user_recruiter_arjun',
    companyName: 'Google India',
    companyLogo: 'GOOG',
    title: 'Associate Software Engineer (SWE Campus)',
    department: 'Google Search & Machine Intelligence',
    location: 'Bangalore / Hyderabad',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹34.0 - ₹38.0 LPA',
    minCgpa: 8.5,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Create solutions that impact millions of users worldwide through state-of-the-art search algorithms, machine learning models, and web scale infrastructure.',
    responsibilities: [
      'Develop scalable, fault-tolerant software services for Google Products',
      'Implement algorithmic optimizations and large-scale data handling',
      'Design clean architectural patterns and conduct peer code reviews'
    ],
    requirements: [
      'Deep mastery of Computer Science fundamentals: Algorithms, OS, Networks, DBMS',
      'Proficiency in Python, C++, or Go',
      'Proven competitive programming or open-source track record',
      'Minimum CGPA of 8.5 with no active backlogs'
    ],
    skills: ['Python', 'C++', 'Data Structures', 'Machine Learning', 'Linux', 'Algorithms'],
    status: 'Active',
    applicationDeadline: '2026-10-25',
    openingsCount: 6,
    applicantCount: 35,
    driveDate: '2026-10-28',
    driveTime: '09:00 AM - 05:30 PM',
    venue: 'Senate Hall & Online Google Meet',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'job_aws_cloud',
    companyId: 'comp_aws',
    recruiterId: 'user_recruiter_sarah',
    companyName: 'Amazon Web Services',
    companyLogo: 'AWS',
    title: 'Cloud Support Associate & DevOps Engineer',
    department: 'AWS Cloud Architecture & Reliability',
    location: 'Hyderabad / Bangalore',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹18.0 - ₹22.5 LPA',
    minCgpa: 7.5,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Artificial Intelligence & Data Science'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Build automated cloud migration scripts, configure container orchestration, and optimize customer infrastructure on AWS.',
    responsibilities: [
      'Provision and manage cloud environments using Terraform and CloudFormation',
      'Design resilient CI/CD pipelines in Docker and Kubernetes',
      'Debug Linux system administration and TCP/IP networking incidents'
    ],
    requirements: [
      'Proficiency in Linux, Bash scripting, and Python or Go',
      'Understanding of AWS Core Services (EC2, S3, VPC, RDS)',
      'Familiarity with Docker containers and Git workflow'
    ],
    skills: ['AWS', 'Linux', 'Docker', 'Python', 'Kubernetes', 'Networking'],
    status: 'Active',
    applicationDeadline: '2026-11-05',
    openingsCount: 10,
    applicantCount: 22,
    driveDate: '2026-11-10',
    driveTime: '10:00 AM - 04:30 PM',
    venue: 'Seminar Hall B & Server Lab',
    createdAt: '2026-08-18T14:00:00Z',
    updatedAt: '2026-08-18T14:00:00Z'
  },
  {
    id: 'job_cisco_embedded',
    companyId: 'comp_cisco',
    recruiterId: 'user_recruiter_neha',
    companyName: 'Cisco Systems',
    companyLogo: 'CSCO',
    title: 'Software Engineer - Systems & Embedded Networking',
    department: 'Enterprise Routing & Security',
    location: 'Bangalore',
    type: 'Full-Time',
    workplaceType: 'On-Campus',
    ctcOrStipend: '₹19.0 - ₹23.0 LPA',
    minCgpa: 7.5,
    allowedBranches: ['Electronics & Communication', 'Computer Science & Engineering', 'Information Technology'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Engineer low-level device drivers, routing protocols, and secure network infrastructure for enterprise routers and switches.',
    responsibilities: [
      'Implement real-time network protocol handlers in C and C++',
      'Optimize RTOS device drivers and kernel modules',
      'Analyze network packet captures and automated security compliance'
    ],
    requirements: [
      'Strong grasp of C, C++, Data Structures, and Computer Networking',
      'Knowledge of TCP/IP stack, sockets, and Linux kernel programming',
      'Minimum CGPA 7.5'
    ],
    skills: ['C', 'C++', 'Networking', 'Linux', 'Embedded Systems', 'TCP/IP'],
    status: 'Active',
    applicationDeadline: '2026-11-12',
    openingsCount: 8,
    applicantCount: 19,
    driveDate: '2026-11-15',
    driveTime: '09:30 AM - 05:00 PM',
    venue: 'ECE Department Seminar Complex',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z'
  },
  {
    id: 'job_technova_data',
    companyId: 'comp_technova',
    recruiterId: 'user_recruiter_neha',
    companyName: 'TechNova Solutions',
    companyLogo: 'TECH',
    title: 'Junior Data Analyst & BI Developer',
    department: 'Business Intelligence & Growth',
    location: 'Pune / Remote',
    type: 'Full-Time',
    workplaceType: 'Remote',
    ctcOrStipend: '₹9.0 - ₹12.0 LPA',
    minCgpa: 6.8,
    allowedBranches: ['All Engineering Disciplines'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Transform raw institutional and business telemetry into actionable dashboards and predictive statistical models.',
    responsibilities: [
      'Write complex SQL queries, aggregations, and ETL workflows',
      'Develop executive dashboards in PowerBI, Tableau, and Metabase',
      'Conduct statistical cohort analysis and KPI reporting'
    ],
    requirements: [
      'Strong SQL proficiency and data visualization skills',
      'Experience in Python (Pandas, NumPy) and Excel modeling',
      'Clear analytical communication and business curiosity'
    ],
    skills: ['SQL', 'Python', 'PowerBI', 'Tableau', 'Pandas', 'Excel'],
    status: 'Active',
    applicationDeadline: '2026-11-20',
    openingsCount: 15,
    applicantCount: 31,
    driveDate: '2026-11-22',
    driveTime: '11:00 AM - 04:00 PM',
    venue: 'Virtual Placement Suite',
    createdAt: '2026-08-22T16:00:00Z',
    updatedAt: '2026-08-22T16:00:00Z'
  },
  {
    id: 'job_technova_intern',
    companyId: 'comp_technova',
    recruiterId: 'user_recruiter_neha',
    companyName: 'TechNova Solutions',
    companyLogo: 'TECH',
    title: 'Software Engineering Summer Intern (2026 Batch)',
    department: 'Frontend Engineering & Design Systems',
    location: 'Bangalore',
    type: 'Internship',
    workplaceType: 'On-Campus',
    ctcOrStipend: '₹45,000 / month Stipend (PPO Eligible)',
    minCgpa: 7.0,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: '6-month pre-placement internship opportunity building user-facing web interfaces, component libraries, and testing suites.',
    responsibilities: [
      'Develop interactive UI widgets using React and Tailwind CSS',
      'Integrate REST endpoints and state management',
      'Write unit tests using Vitest and React Testing Library'
    ],
    requirements: [
      'Good understanding of JavaScript/TypeScript, React, and CSS',
      'Enthusiasm for UI/UX details and fast learner'
    ],
    skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Git'],
    status: 'Active',
    applicationDeadline: '2026-11-25',
    openingsCount: 10,
    applicantCount: 26,
    driveDate: '2026-11-28',
    driveTime: '10:00 AM - 03:00 PM',
    venue: 'Computing Lab 1',
    createdAt: '2026-08-25T11:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z'
  },
  {
    id: 'job_microsoft_ai',
    companyId: 'comp_microsoft',
    recruiterId: 'user_recruiter_sarah',
    companyName: 'Microsoft India',
    companyLogo: 'MSFT',
    title: 'AI/ML Applied Scientist Associate',
    department: 'Azure AI & Cognitive Services',
    location: 'Hyderabad',
    type: 'Full-Time',
    workplaceType: 'Hybrid',
    ctcOrStipend: '₹30.0 - ₹35.0 LPA',
    minCgpa: 8.5,
    allowedBranches: ['Computer Science & Engineering', 'Artificial Intelligence & Data Science', 'Information Technology'],
    maxBacklogs: 0,
    targetBatches: [2026],
    description: 'Train, fine-tune, and deploy multimodal generative models and neural search algorithms for global enterprise users.',
    responsibilities: [
      'Develop model evaluation benchmarks and data preprocessing pipelines',
      'Fine-tune foundation models using PyTorch, DeepSpeed, and ONNX Runtime',
      'Deploy scalable inference APIs on Azure Kubernetes Service'
    ],
    requirements: [
      'Strong mathematics foundation: Linear Algebra, Probability, Calculus',
      'Extensive hands-on experience with PyTorch, Transformers, and Python',
      'Minimum CGPA 8.5'
    ],
    skills: ['Python', 'PyTorch', 'Machine Learning', 'NLP', 'FastAPI', 'Azure'],
    status: 'Active',
    applicationDeadline: '2026-12-01',
    openingsCount: 5,
    applicantCount: 20,
    driveDate: '2026-12-05',
    driveTime: '09:00 AM - 05:00 PM',
    venue: 'Virtual Teams Placement Suite',
    createdAt: '2026-08-28T09:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z'
  }
];

// At least 3 Placement Drives
const initialDrives: Drive[] = [
  {
    id: 'drive_technova_01',
    title: 'TechNova Solutions Campus Placement Drive 2026',
    companyId: 'comp_technova',
    companyName: 'TechNova Solutions',
    companyLogo: 'TECH',
    date: '2026-10-18',
    startTime: '09:30 AM',
    endTime: '05:00 PM',
    venue: 'Turing Hall & Computing Lab 3',
    targetBatches: [2026],
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    minCgpa: 7.0,
    openings: 12,
    status: 'Upcoming',
    panelMembers: ['Neha Kapoor (TA Director)', 'Kunal Shinde (Tech Lead)', 'Dr. Rajesh Rao (TPO Observer)'],
    shortlistedCount: 28
  },
  {
    id: 'drive_microsoft_01',
    title: 'Microsoft IDC Campus Recruitment Drive 2026',
    companyId: 'comp_microsoft',
    companyName: 'Microsoft India',
    companyLogo: 'MSFT',
    date: '2026-10-24',
    startTime: '10:00 AM',
    endTime: '06:00 PM',
    venue: 'Campus Main Auditorium & CSE Labs',
    targetBatches: [2026],
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science', 'Electronics & Communication'],
    minCgpa: 8.0,
    openings: 8,
    status: 'Upcoming',
    panelMembers: ['Sarah Jenkins (Talent Lead)', 'Vivek Anand (Principal Engineer)', 'Prof. A. K. Sen (CSE HOD)'],
    shortlistedCount: 32
  },
  {
    id: 'drive_google_01',
    title: 'Google University Hiring Sprint 2026',
    companyId: 'comp_google',
    companyName: 'Google India',
    companyLogo: 'GOOG',
    date: '2026-10-28',
    startTime: '09:00 AM',
    endTime: '05:30 PM',
    venue: 'Senate Hall & Online Google Meet',
    targetBatches: [2026],
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    minCgpa: 8.5,
    openings: 6,
    status: 'Upcoming',
    panelMembers: ['Arjun Mehta (Staff Recruiter)', 'Devika S. (Senior SWE)', 'TPO Lead Invigilator'],
    shortlistedCount: 18
  },
  {
    id: 'drive_aws_01',
    title: 'Amazon Web Services Cloud & Systems Drive',
    companyId: 'comp_aws',
    companyName: 'Amazon Web Services',
    companyLogo: 'AWS',
    date: '2026-11-10',
    startTime: '10:00 AM',
    endTime: '04:30 PM',
    venue: 'Seminar Hall B & Server Lab',
    targetBatches: [2026],
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    minCgpa: 7.5,
    openings: 10,
    status: 'Upcoming',
    panelMembers: ['Anand Krishnan (DevOps Manager)', 'Ritu Pillai (Solutions Architect)'],
    shortlistedCount: 16
  }
];

// Pre-seeded Applications with Explainable AI & Matching
const initialApplications: Application[] = [
  // 1. Aarav Reddy -> Meridian Labs (Screening)
  (() => {
    const student = initialStudentProfiles[0];
    const job = initialJobs.find(j => j.id === 'job_meridian_ml') || initialJobs[0];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_meridian_aarav',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Applied 3 days ago · screening',
      eligibilityStatus: 'Eligible' as const,
      eligibilityReasons: ['CGPA and branch criteria verified'],
      matchScore: 84,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'screening' as const,
      stageHistory: [
        { stage: 'applied' as const, label: 'Applied', timestamp: '2026-09-25T10:00:00Z', note: 'Applied 3 days ago' },
        { stage: 'screening' as const, label: 'Screening In Progress', timestamp: '2026-09-26T14:00:00Z', note: 'Resume shortlisted for review' }
      ],
      evaluations: [],
      createdAt: '2026-09-25T10:00:00Z',
      updatedAt: '2026-09-26T14:00:00Z'
    };
  })(),

  // 2. Aarav Reddy -> Northwind Fintech (Interview)
  (() => {
    const student = initialStudentProfiles[0];
    const job = initialJobs.find(j => j.id === 'job_northwind_analyst') || initialJobs[1];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_northwind_aarav',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Interview Fri 10:00 · prep suggested',
      eligibilityStatus: 'Eligible' as const,
      eligibilityReasons: ['Technical and aptitude test cleared'],
      matchScore: 89,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'interview' as const,
      stageHistory: [
        { stage: 'applied' as const, label: 'Application Submitted', timestamp: '2026-09-20T10:00:00Z' },
        { stage: 'screening' as const, label: 'Screening Passed', timestamp: '2026-09-22T11:00:00Z' },
        { stage: 'interview' as const, label: 'Interview Scheduled', timestamp: '2026-09-27T15:00:00Z', note: 'Technical Round: Fri 10:00 AM' }
      ],
      interviewDetails: {
        id: 'int_northwind_aarav',
        date: '2026-10-02',
        time: '10:00 AM',
        interviewer: 'Rohan Deshmukh (Lead Analyst)',
        meetingLink: 'https://meet.northwindfin.com/interview/aarav',
        roundName: 'Round 1: SQL & Analytical Problem Solving',
        venue: 'Virtual Placement Room A'
      },
      evaluations: [],
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-27T15:00:00Z'
    };
  })(),

  // 3. Aarav Reddy -> Cedar Solutions (Offer)
  (() => {
    const student = initialStudentProfiles[0];
    const job = initialJobs.find(j => j.id === 'job_cedar_data') || initialJobs[2];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_cedar_aarav',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Offer received · respond by Fri',
      eligibilityStatus: 'Eligible' as const,
      eligibilityReasons: ['Final evaluation completed with high commendation'],
      matchScore: 92,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'offered' as const,
      stageHistory: [
        { stage: 'applied' as const, label: 'Applied', timestamp: '2026-09-10T10:00:00Z' },
        { stage: 'interview' as const, label: 'Interviews Completed', timestamp: '2026-09-21T16:00:00Z' },
        { stage: 'offered' as const, label: 'Formal Offer Issued', timestamp: '2026-09-26T12:00:00Z', note: 'Offer received · respond by Fri' }
      ],
      offerDetails: {
        id: 'off_cedar_aarav',
        ctc: '₹14.5 LPA',
        baseFixed: '₹12.0 LPA',
        bonus: '₹2.5 LPA',
        joiningDate: '2026-07-15',
        validTill: '2026-10-02',
        offerLetterUrl: '#preview-offer',
        status: 'Pending Acceptance' as const,
        terms: 'Comprehensive healthcare coverage, laptop equipment allowance, and hybrid work stipend.'
      },
      evaluations: [],
      createdAt: '2026-09-10T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z'
    };
  })(),

  // 4. Aarav Reddy -> Helio Robotics (Case Study)
  (() => {
    const student = initialStudentProfiles[0];
    const job = initialJobs.find(j => j.id === 'job_helio_research') || initialJobs[3];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_helio_aarav',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Case study due Mon · 2 days left',
      eligibilityStatus: 'Eligible' as const,
      eligibilityReasons: ['Coding round cleared'],
      matchScore: 81,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'assessment' as const,
      stageHistory: [
        { stage: 'applied' as const, label: 'Applied', timestamp: '2026-09-18T10:00:00Z' },
        { stage: 'assessment' as const, label: 'Case Study Take-Home Task', timestamp: '2026-09-26T09:00:00Z', note: 'Case study due Mon · 2 days left' }
      ],
      evaluations: [],
      createdAt: '2026-09-18T10:00:00Z',
      updatedAt: '2026-09-26T09:00:00Z'
    };
  })(),

  // 5. TechNova SWE
  (() => {
    const student = initialStudentProfiles[1];
    const job = initialJobs.find(j => j.id === 'job_technova_swe') || initialJobs[4];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_technova_bishnu',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Extremely passionate about full-stack cloud systems. Have built production React and Node.js web apps and maintain strong database fundamentals.',
      eligibilityStatus: match.eligibilityStatus,
      eligibilityReasons: match.eligibilityReasons,
      matchScore: match.matchScore,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'interview',
      stageHistory: [
        { stage: 'applied', label: 'Application Submitted', timestamp: '2026-08-15T10:00:00Z', note: 'Applied via CAMPUSLINK portal' },
        { stage: 'screening', label: 'AI Eligibility & ATS Screening Cleared', timestamp: '2026-08-16T14:00:00Z', note: 'CGPA 8.92 and technical skillset verified' },
        { stage: 'assessment', label: 'Online Coding Assessment Cleared', timestamp: '2026-08-20T16:00:00Z', note: 'Scored 94/100 on algorithmic test' },
        { stage: 'interview', label: 'Technical Interview Scheduled', timestamp: '2026-08-25T11:00:00Z', note: 'Round 1 with Tech Lead scheduled' }
      ],
      interviewDetails: {
        id: 'int_technova_bishnu',
        date: '2026-10-18',
        time: '11:00 AM',
        interviewer: 'Kunal Shinde (Lead Architect)',
        meetingLink: 'https://meet.technova.io/campus-swe-bishnu',
        roundName: 'Round 1: System Architecture & Live Coding',
        venue: 'Computing Lab 3 - Interview Booth A',
        technicalScore: 88,
        communicationScore: 85,
        problemSolvingScore: 90,
        overallScore: 88,
        feedback: 'Demonstrated solid grasp of asynchronous Node.js, relational schema indexing, and clean React component state.'
      },
      evaluations: [
        { id: 'eval_1', author: 'Kunal Shinde', role: 'Lead Architect', rating: 5, comment: 'Exceptional problem decomposition and clean modular code writing.', timestamp: '2026-08-25T12:30:00Z' }
      ],
      createdAt: '2026-08-15T10:00:00Z',
      updatedAt: '2026-08-25T12:30:00Z'
    };
  })(),

  // 2. Priya Sharma -> Google SWE (Placed Offer)
  (() => {
    const student = initialStudentProfiles[1];
    const job = initialJobs[2];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_google_priya',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Dedicated to machine learning infrastructure, high-dimensional search indexing, and distributed systems.',
      eligibilityStatus: match.eligibilityStatus,
      eligibilityReasons: match.eligibilityReasons,
      matchScore: 96,
      matchBreakdown: { technicalSkillMatch: 95, academicEligibility: 100, projectRelevance: 95, certificationMatch: 90, interviewPerformance: 98 },
      explainableMatch: {
        isShortlisted: true,
        summary: 'Top percentile candidate with 9.40 CGPA, PyTorch and deep learning publications, and exceptional algorithmic capability.',
        matchedSkills: ['Python', 'PyTorch', 'Algorithms', 'Machine Learning', 'Linux', 'SQL'],
        missingSkills: [],
        positiveFactors: ['CGPA 9.40 ranks top 2% in batch', 'Published research in computer vision', 'Score 98% in coding benchmark'],
        gapFactors: [],
        assessmentBenchmark: 'Exceeds recruiter benchmark (98% vs 75%)',
        recommendedAction: 'Extend Super Dream Campus Offer immediately.'
      },
      stage: 'accepted',
      stageHistory: [
        { stage: 'applied', label: 'Application Submitted', timestamp: '2026-08-10T09:00:00Z' },
        { stage: 'screening', label: 'Shortlisted by Recruiter', timestamp: '2026-08-12T10:00:00Z' },
        { stage: 'interview', label: 'Technical Rounds Cleared', timestamp: '2026-08-18T16:00:00Z' },
        { stage: 'offered', label: 'Campus Offer Extended 🎉', timestamp: '2026-08-22T14:00:00Z' },
        { stage: 'accepted', label: 'Offer Formally Accepted by Candidate 🤝', timestamp: '2026-08-24T11:00:00Z' }
      ],
      offerDetails: {
        id: 'off_google_priya',
        ctc: '₹34.5 LPA',
        baseFixed: '₹22.0 LPA',
        bonus: '₹4.5 LPA',
        rsu: '₹8.0 LPA (over 4 years)',
        joiningDate: '2026-07-06',
        validTill: '2026-09-15',
        offerLetterUrl: '#view-offer-letter',
        status: 'Accepted',
        terms: 'Includes comprehensive family health insurance, ₹1.5 Lakh relocation allowance, and wellness benefits.'
      },
      evaluations: [
        { id: 'eval_google_1', author: 'Arjun Mehta', role: 'Staff Recruiter', rating: 5, comment: 'Outstanding engineering maturity and crystal-clear technical articulation.', timestamp: '2026-08-20T10:00:00Z' }
      ],
      createdAt: '2026-08-10T09:00:00Z',
      updatedAt: '2026-08-24T11:00:00Z'
    };
  })(),

  // 3. Rahul Verma -> Microsoft SDE
  (() => {
    const student = initialStudentProfiles[2];
    const job = initialJobs[1];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_microsoft_rahul',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Extensive hands-on expertise in Java Spring Boot, microservices architecture, and Docker deployments.',
      eligibilityStatus: match.eligibilityStatus,
      eligibilityReasons: match.eligibilityReasons,
      matchScore: match.matchScore,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'interview',
      stageHistory: [
        { stage: 'applied', label: 'Application Submitted', timestamp: '2026-08-16T12:00:00Z' },
        { stage: 'assessment', label: 'Assessment Cleared', timestamp: '2026-08-22T14:00:00Z' },
        { stage: 'interview', label: 'Technical Interview Scheduled', timestamp: '2026-08-27T10:00:00Z' }
      ],
      interviewDetails: {
        id: 'int_msft_rahul',
        date: '2026-10-24',
        time: '02:00 PM',
        interviewer: 'Vivek Anand (Principal Engineer)',
        meetingLink: 'https://teams.microsoft.com/meet/sde-rahul',
        roundName: 'Round 1: Algorithms & Data Concurrency',
        venue: 'Campus Main Auditorium - Panel 2',
        technicalScore: 82,
        communicationScore: 80,
        problemSolvingScore: 84,
        overallScore: 82,
        feedback: 'Good grasp of multi-threading in Java and distributed transactions.'
      },
      evaluations: [],
      createdAt: '2026-08-16T12:00:00Z',
      updatedAt: '2026-08-27T10:00:00Z'
    };
  })(),

  // 4. Ananya Patel -> Cisco Embedded Systems
  (() => {
    const student = initialStudentProfiles[3];
    const job = initialJobs[4];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_cisco_ananya',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Passionate about firmware programming, RTOS devices, and hardware-software integration.',
      eligibilityStatus: match.eligibilityStatus,
      eligibilityReasons: match.eligibilityReasons,
      matchScore: match.matchScore,
      matchBreakdown: match.matchBreakdown,
      explainableMatch: match.explainableMatch,
      stage: 'assessment',
      stageHistory: [
        { stage: 'applied', label: 'Application Submitted', timestamp: '2026-08-21T10:00:00Z' },
        { stage: 'screening', label: 'Screening Verified', timestamp: '2026-08-23T11:00:00Z' },
        { stage: 'assessment', label: 'Online Technical Test Scheduled', timestamp: '2026-08-26T15:00:00Z' }
      ],
      evaluations: [],
      createdAt: '2026-08-21T10:00:00Z',
      updatedAt: '2026-08-26T15:00:00Z'
    };
  })(),

  // 5. Manish Pandey -> TechNova SWE (Not Shortlisted with clear explanation)
  (() => {
    const student = initialStudentProfiles[12]; // Manish (low CGPA, backlogs)
    const job = initialJobs[0];
    const match = calculateMatchAndExplanation(student, job);
    return {
      id: 'app_technova_manish',
      jobId: job.id,
      studentId: student.userId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyLogo: job.companyLogo,
      jobLocation: job.location,
      jobType: job.type,
      ctcOrStipend: job.ctcOrStipend,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      studentCgpa: student.cgpa,
      studentDegree: student.degree,
      studentBranch: student.branch,
      studentGraduationYear: student.graduationYear,
      studentSkills: student.skills,
      studentResumeFilename: student.resumeFilename,
      studentResumeUrl: student.resumeUrl,
      coverNote: 'Interested in entry-level frontend software engineering.',
      eligibilityStatus: 'Not Eligible',
      eligibilityReasons: [
        'CGPA 6.40 does not meet required threshold of 7.0',
        '2 active backlogs violate corporate criteria (max 0 allowed)'
      ],
      matchScore: 42,
      matchBreakdown: { technicalSkillMatch: 35, academicEligibility: 25, projectRelevance: 40, certificationMatch: 20, interviewPerformance: 50 },
      explainableMatch: {
        isShortlisted: false,
        summary: 'NOT SHORTLISTED. Candidate does not satisfy minimum CGPA requirements (6.40 vs 7.0 required) and has active backlogs. Missing core backend skills (Python, SQL, AWS).',
        matchedSkills: ['JavaScript'],
        missingSkills: ['Python', 'React', 'SQL', 'AWS', 'Docker'],
        positiveFactors: ['Basic understanding of web technologies (HTML, CSS, JS)'],
        gapFactors: [
          'CGPA 6.40 is below minimum recruiter cutoff 7.0',
          '2 active academic backlogs',
          'Missing key backend frameworks (Python, SQL, REST APIs)',
          'Mock interview score 50% below benchmark 75%'
        ],
        assessmentBenchmark: 'Below benchmark (50% vs 75%)',
        recommendedAction: 'Clear active backlogs, complete SQL and Python foundation modules, and build full-stack CRUD projects before the next recruitment phase.'
      },
      stage: 'rejected',
      stageHistory: [
        { stage: 'applied', label: 'Application Submitted', timestamp: '2026-08-18T10:00:00Z' },
        { stage: 'rejected', label: 'Not Shortlisted - Eligibility Criteria', timestamp: '2026-08-19T11:00:00Z', note: 'Automated AI Eligibility Engine: CGPA & Backlogs criteria not met.' }
      ],
      evaluations: [],
      createdAt: '2026-08-18T10:00:00Z',
      updatedAt: '2026-08-19T11:00:00Z'
    };
  })()
];

// Document Management Records
const initialDocuments: DocumentItem[] = [
  {
    id: 'doc_1',
    studentId: 'user_student_bishnu',
    studentName: 'Bishnu Sahoo',
    title: 'Final Year Technical Resume (ATS Optimized)',
    category: 'Resume',
    filename: 'Bishnu_Sahoo_SWE_Resume_2026.pdf',
    fileUrl: '#preview-resume',
    fileSize: '1.2 MB',
    uploadedDate: '2026-08-05',
    status: 'Verified',
    verificationNote: 'Format approved by University T&P Cell',
    verifiedBy: 'Dr. Rajesh Rao'
  },
  {
    id: 'doc_2',
    studentId: 'user_student_bishnu',
    studentName: 'Bishnu Sahoo',
    title: 'University Identity Card & Bonafide Certificate',
    category: 'ID Proof',
    filename: 'NIT_Student_ID_2022UGCS049.pdf',
    fileUrl: '#preview-id',
    fileSize: '840 KB',
    uploadedDate: '2026-08-06',
    status: 'Verified',
    verificationNote: 'Roll number and department verified',
    verifiedBy: 'Dr. Rajesh Rao'
  },
  {
    id: 'doc_3',
    studentId: 'user_student_bishnu',
    studentName: 'Bishnu Sahoo',
    title: 'Cumulative Grade Transcript (Sem 1 to 6)',
    category: 'Academic Marksheet',
    filename: 'Semester_Transcript_NIT_Bishnu.pdf',
    fileUrl: '#preview-marksheet',
    fileSize: '2.4 MB',
    uploadedDate: '2026-08-08',
    status: 'Verified',
    verificationNote: 'CGPA 8.92 and zero backlogs confirmed',
    verifiedBy: 'Dr. Rajesh Rao'
  },
  {
    id: 'doc_4',
    studentId: 'user_student_bishnu',
    studentName: 'Bishnu Sahoo',
    title: 'AWS Certified Cloud Practitioner Credential',
    category: 'Certificates',
    filename: 'AWS_CCP_Badge_Verification.pdf',
    fileUrl: '#preview-cert',
    fileSize: '512 KB',
    uploadedDate: '2026-08-10',
    status: 'Verified',
    verificationNote: 'Credential ID validated on AWS verification portal',
    verifiedBy: 'Dr. Rajesh Rao'
  },
  {
    id: 'doc_5',
    studentId: 'user_student_priya',
    studentName: 'Priya Sharma',
    title: 'Official Google Campus Offer Letter',
    category: 'Offer Letter',
    filename: 'Google_India_Offer_Letter_PriyaSharma.pdf',
    fileUrl: '#preview-offer',
    fileSize: '1.8 MB',
    uploadedDate: '2026-08-23',
    status: 'Verified',
    verificationNote: 'Digitally countersigned by Google University Hiring and Student',
    verifiedBy: 'Dr. Rajesh Rao'
  },
  {
    id: 'doc_6',
    studentId: 'user_student_priya',
    studentName: 'Priya Sharma',
    title: 'Pre-Joining Medical & Background Verification Dossier',
    category: 'Joining Documents',
    filename: 'BGC_Medical_Priya_Sharma.pdf',
    fileUrl: '#preview-joining',
    fileSize: '3.1 MB',
    uploadedDate: '2026-08-25',
    status: 'Uploaded',
    verificationNote: 'Pending final review by Corporate HR'
  }
];

// Notifications
const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'user_student_bishnu',
    title: 'Technical Interview Scheduled ⚡',
    message: 'Your Round 1 interview with TechNova Solutions has been confirmed for Oct 18 at 11:00 AM in Computing Lab 3.',
    type: 'Interview Schedule',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    linkTab: 'interviews',
    applicationId: 'app_technova_bishnu'
  },
  {
    id: 'notif_2',
    userId: 'user_student_bishnu',
    title: 'AI Skill Gap Alert ✦',
    message: 'TechNova and AWS require SQL & Docker. Improving these by 15% will elevate your readiness score to 92/100.',
    type: 'Skill Recommendation',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    linkTab: 'skillgap'
  },
  {
    id: 'notif_3',
    userId: 'user_student_bishnu',
    title: 'New Campus Placement Drive Announced 🚀',
    message: 'Microsoft IDC Campus Recruitment Drive 2026 is now live. SDE-1 package: ₹28.5 - ₹32 LPA.',
    type: 'Drive Announcement',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    linkTab: 'jobs',
    jobId: 'job_microsoft_sde'
  },
  {
    id: 'notif_4',
    userId: 'user_student_priya',
    title: 'Super Dream Campus Offer Extended! 🎉',
    message: 'Congratulations! Google India has extended an official campus offer of ₹34.5 LPA. Inspect your letter in Documents.',
    type: 'Offer Letter',
    read: false,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    linkTab: 'offers'
  },
  {
    id: 'notif_5',
    userId: 'user_officer_rajesh',
    title: 'Placement Rate Crossed 72% Milestone 📊',
    message: 'With 326 total campus offers confirmed, university placement rate has reached 72.4%. View command center analytics.',
    type: 'Drive Announcement',
    read: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    linkTab: 'analytics'
  }
];

// Initial Placement Policies
const initialPlacementPolicies: PlacementPolicyModel[] = [
  {
    id: 'policy_aicte_2026',
    name: 'University Placement Council Regulation 2026',
    description: 'Standard 3-Tier Policy (Regular, Dream, Super Dream) enforcing single offer holding with merit-based upgrade guarantees and anti-hoarding controls.',
    conditions: {
      min_cgpa_standard: 6.5,
      max_active_backlogs: 0,
      mandatory_attendance_pct: 85
    },
    offer_categories: {
      regular_max_lpa: 6.0,
      dream_min_lpa: 6.0,
      dream_max_lpa: 12.0,
      super_dream_min_lpa: 12.0
    },
    upgrade_rules: {
      allow_dream_if_regular_held: true,
      allow_super_dream_always: true,
      min_ctc_multiplier_for_upgrade: 1.4,
      max_total_offers_per_student: 2
    },
    active: true,
    created_by: 'user_officer_rajesh',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  }
];

// Initial Placement Passports
const initialPassports: PlacementPassportModel[] = [
  {
    id: 'passport_user_student_aarav',
    student_id: 'user_student_aarav',
    passport_number: 'CL-2026-CSE-0001',
    status: 'VERIFIED',
    academic_verified: true,
    eligibility_verified: true,
    tpo_verified: true,
    attendance_verified: true,
    documents_verified: true,
    qr_token: 'QR_TOK_AARAV_8f2c31e9a44b',
    verified_at: '2026-08-15T10:00:00Z',
    expires_at: '2027-07-31T23:59:59Z',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
    blockchain_hash: '0x8f2c31e9a44b9123',
    metrics: {
      cgpa: 8.78,
      backlogs: 0,
      ats_score: 92,
      readiness_score: 84
    }
  },
  {
    id: 'passport_user_student_bishnu',
    student_id: 'user_student_bishnu',
    passport_number: 'CL-2026-MCA-8924',
    status: 'VERIFIED',
    academic_verified: true,
    eligibility_verified: true,
    tpo_verified: true,
    attendance_verified: true,
    documents_verified: true,
    qr_token: 'QR_TOK_BISHNU_7c91a03f4112',
    verified_at: '2026-08-18T11:00:00Z',
    expires_at: '2027-07-31T23:59:59Z',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-18T11:00:00Z',
    blockchain_hash: '0x7c91a03f411288dd',
    metrics: {
      cgpa: 8.65,
      backlogs: 0,
      ats_score: 88,
      readiness_score: 82
    }
  },
  {
    id: 'passport_user_student_priya',
    student_id: 'user_student_priya',
    passport_number: 'CL-2026-AID-1002',
    status: 'VERIFIED',
    academic_verified: true,
    eligibility_verified: true,
    tpo_verified: true,
    attendance_verified: true,
    documents_verified: true,
    qr_token: 'QR_TOK_PRIYA_b19284cf734a',
    verified_at: '2026-08-10T12:00:00Z',
    expires_at: '2027-07-31T23:59:59Z',
    created_at: '2026-08-01T09:00:00Z',
    updated_at: '2026-08-10T12:00:00Z',
    blockchain_hash: '0xb19284cf734a0122',
    metrics: {
      cgpa: 9.40,
      backlogs: 0,
      ats_score: 96,
      readiness_score: 94
    }
  }
];

// Initial Drive Candidates for War-Room
const initialDriveCandidates: DriveCandidateModel[] = [
  {
    id: 'dc_1',
    drive_id: 'drive_google_campus',
    student_id: 'user_student_priya',
    student_name: 'Priya Sharma',
    roll_number: '2022UGAI002',
    branch: 'AI & Data Science',
    cgpa: 9.40,
    attendance_status: 'CHECKED_IN',
    check_in_time: '2026-08-20T08:30:00Z',
    current_stage: 'TECH_ROUND_1',
    token_number: 'B-15',
    created_at: '2026-08-20T08:30:00Z'
  },
  {
    id: 'dc_2',
    drive_id: 'drive_google_campus',
    student_id: 'user_student_rahul',
    student_name: 'Rahul Verma',
    roll_number: '2022UGIT003',
    branch: 'Information Technology',
    cgpa: 8.85,
    attendance_status: 'CHECKED_IN',
    check_in_time: '2026-08-20T08:35:00Z',
    current_stage: 'TECH_ROUND_1',
    token_number: 'B-16',
    created_at: '2026-08-20T08:35:00Z'
  },
  {
    id: 'dc_3',
    drive_id: 'drive_google_campus',
    student_id: 'user_student_ananya',
    student_name: 'Ananya Patel',
    roll_number: '2022UGEC004',
    branch: 'ECE',
    cgpa: 8.60,
    attendance_status: 'CHECKED_IN',
    check_in_time: '2026-08-20T08:40:00Z',
    current_stage: 'TECH_ROUND_1',
    token_number: 'B-17',
    created_at: '2026-08-20T08:40:00Z'
  },
  {
    id: 'dc_4',
    drive_id: 'drive_google_campus',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    roll_number: '2022UGCS001',
    branch: 'Computer Science',
    cgpa: 8.78,
    attendance_status: 'CHECKED_IN',
    check_in_time: '2026-08-20T08:45:00Z',
    current_stage: 'TECH_ROUND_1',
    token_number: 'B-18',
    created_at: '2026-08-20T08:45:00Z'
  }
];

// Initial War-Room Queue
const initialInterviewQueues: InterviewQueueModel[] = [
  {
    id: 'q_1',
    drive_id: 'drive_google_campus',
    candidate_id: 'dc_1',
    student_id: 'user_student_priya',
    student_name: 'Priya Sharma',
    student_roll: '2022UGAI002',
    token_number: 'B-15',
    room: 'Room B-204 (Tech Panel 2)',
    round: 'Tech Round 1',
    status: 'IN_PROGRESS',
    queue_position: 1,
    called_at: '2026-08-20T09:00:00Z',
    created_at: '2026-08-20T08:30:00Z'
  },
  {
    id: 'q_2',
    drive_id: 'drive_google_campus',
    candidate_id: 'dc_2',
    student_id: 'user_student_rahul',
    student_name: 'Rahul Verma',
    student_roll: '2022UGIT003',
    token_number: 'B-16',
    room: 'Room B-204 (Tech Panel 2)',
    round: 'Tech Round 1',
    status: 'WAITING',
    queue_position: 2,
    created_at: '2026-08-20T08:35:00Z'
  },
  {
    id: 'q_3',
    drive_id: 'drive_google_campus',
    candidate_id: 'dc_3',
    student_id: 'user_student_ananya',
    student_name: 'Ananya Patel',
    student_roll: '2022UGEC004',
    token_number: 'B-17',
    room: 'Room B-204 (Tech Panel 2)',
    round: 'Tech Round 1',
    status: 'WAITING',
    queue_position: 3,
    created_at: '2026-08-20T08:40:00Z'
  },
  {
    id: 'q_4',
    drive_id: 'drive_google_campus',
    candidate_id: 'dc_4',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    student_roll: '2022UGCS001',
    token_number: 'B-18',
    room: 'Room B-204 (Tech Panel 2)',
    round: 'Tech Round 1',
    status: 'WAITING',
    queue_position: 4,
    created_at: '2026-08-20T08:45:00Z'
  }
];

// Initial Policy Audit Logs
const initialAuditLogs: AuditLogModel[] = [
  {
    id: 'audit_1',
    user_id: 'user_officer_rajesh',
    user_name: 'Dr. Rajesh Swaminathan',
    action: 'POLICY_EVALUATION',
    entity_type: 'PlacementPolicy',
    entity_id: 'policy_aicte_2026',
    details: 'Student Priya Sharma approved for Super Dream upgrade to Google India (₹34.5 LPA) under AICTE Rule 4.2.',
    timestamp: '2026-08-22T14:15:00Z'
  },
  {
    id: 'audit_2',
    user_id: 'user_officer_rajesh',
    user_name: 'Dr. Rajesh Swaminathan',
    action: 'PASSPORT_VERIFIED',
    entity_type: 'PlacementPassport',
    entity_id: 'passport_user_student_aarav',
    details: 'All 4 seals verified: Academic CGPA 8.78, TPO clearance, ATS 92%, and BGV passed.',
    timestamp: '2026-08-15T10:05:00Z'
  }
];

// Initial Skill Assessment Seeds
const initialResumeSkills: ResumeSkillModel[] = [
  { id: 'rsk_1', student_id: 'user_student_aarav', skill_name: 'Python', category: 'programming', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 92 },
  { id: 'rsk_2', student_id: 'user_student_aarav', skill_name: 'Django', category: 'framework', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 86 },
  { id: 'rsk_3', student_id: 'user_student_aarav', skill_name: 'React', category: 'framework', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 89 },
  { id: 'rsk_4', student_id: 'user_student_aarav', skill_name: 'SQL', category: 'database', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 78 },
  { id: 'rsk_5', student_id: 'user_student_aarav', skill_name: 'AWS', category: 'cloud', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 64 },
  { id: 'rsk_6', student_id: 'user_student_aarav', skill_name: 'TypeScript', category: 'programming', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: true, verified_score: 85 },
  { id: 'rsk_7', student_id: 'user_student_aarav', skill_name: 'Docker', category: 'tool', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: false },
  { id: 'rsk_8', student_id: 'user_student_aarav', skill_name: 'Git', category: 'tool', source: 'resume_extracted', claimed_at: '2026-08-01T09:00:00Z', is_verified: false },
  // Priya
  { id: 'rsk_9', student_id: 'user_student_priya', skill_name: 'Python', category: 'programming', source: 'resume_extracted', claimed_at: '2026-08-05T11:00:00Z', is_verified: true, verified_score: 95 },
  { id: 'rsk_10', student_id: 'user_student_priya', skill_name: 'Machine Learning', category: 'technology', source: 'resume_extracted', claimed_at: '2026-08-05T11:00:00Z', is_verified: true, verified_score: 91 },
  { id: 'rsk_11', student_id: 'user_student_priya', skill_name: 'SQL', category: 'database', source: 'resume_extracted', claimed_at: '2026-08-05T11:00:00Z', is_verified: true, verified_score: 84 },
  // Rahul
  { id: 'rsk_12', student_id: 'user_student_rahul', skill_name: 'Java', category: 'programming', source: 'resume_extracted', claimed_at: '2026-08-10T12:00:00Z', is_verified: true, verified_score: 88 },
  { id: 'rsk_13', student_id: 'user_student_rahul', skill_name: 'Spring Boot', category: 'framework', source: 'resume_extracted', claimed_at: '2026-08-10T12:00:00Z', is_verified: true, verified_score: 82 },
  { id: 'rsk_14', student_id: 'user_student_rahul', skill_name: 'PostgreSQL', category: 'database', source: 'resume_extracted', claimed_at: '2026-08-10T12:00:00Z', is_verified: true, verified_score: 80 }
];

const initialSkillScores: SkillScoreModel[] = [
  { id: 'ssc_1', student_id: 'user_student_aarav', skill_name: 'Python', claimed: true, verified_score: 92, category: 'programming', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-20T14:30:00Z' },
  { id: 'ssc_2', student_id: 'user_student_aarav', skill_name: 'Django', claimed: true, verified_score: 86, category: 'framework', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-20T14:30:00Z' },
  { id: 'ssc_3', student_id: 'user_student_aarav', skill_name: 'React', claimed: true, verified_score: 89, category: 'framework', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-20T14:30:00Z' },
  { id: 'ssc_4', student_id: 'user_student_aarav', skill_name: 'SQL', claimed: true, verified_score: 78, category: 'database', status: 'ASSESSMENT_VERIFIED', level_cleared: 1, last_assessed_at: '2026-09-18T10:00:00Z' },
  { id: 'ssc_5', student_id: 'user_student_aarav', skill_name: 'AWS', claimed: true, verified_score: 64, category: 'cloud', status: 'ASSESSMENT_VERIFIED', level_cleared: 1, last_assessed_at: '2026-09-18T10:00:00Z' },
  { id: 'ssc_6', student_id: 'user_student_aarav', skill_name: 'TypeScript', claimed: true, verified_score: 85, category: 'programming', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-20T14:30:00Z' },
  { id: 'ssc_7', student_id: 'user_student_aarav', skill_name: 'Docker', claimed: true, verified_score: 0, category: 'tool', status: 'CLAIMED_ONLY', level_cleared: 0 },
  { id: 'ssc_8', student_id: 'user_student_aarav', skill_name: 'Git', claimed: true, verified_score: 0, category: 'tool', status: 'CLAIMED_ONLY', level_cleared: 0 },
  // Priya
  { id: 'ssc_9', student_id: 'user_student_priya', skill_name: 'Python', claimed: true, verified_score: 95, category: 'programming', status: 'ASSESSMENT_VERIFIED', level_cleared: 3, last_assessed_at: '2026-09-22T11:00:00Z' },
  { id: 'ssc_10', student_id: 'user_student_priya', skill_name: 'Machine Learning', claimed: true, verified_score: 91, category: 'technology', status: 'ASSESSMENT_VERIFIED', level_cleared: 3, last_assessed_at: '2026-09-22T11:00:00Z' },
  { id: 'ssc_11', student_id: 'user_student_priya', skill_name: 'SQL', claimed: true, verified_score: 84, category: 'database', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-22T11:00:00Z' },
  // Rahul
  { id: 'ssc_12', student_id: 'user_student_rahul', skill_name: 'Java', claimed: true, verified_score: 88, category: 'programming', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-24T16:00:00Z' },
  { id: 'ssc_13', student_id: 'user_student_rahul', skill_name: 'Spring Boot', claimed: true, verified_score: 82, category: 'framework', status: 'ASSESSMENT_VERIFIED', level_cleared: 2, last_assessed_at: '2026-09-24T16:00:00Z' }
];

const initialCertificates: CertificateModel[] = [
  {
    id: 'cert_1',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    certificate_name: 'AWS Certified Cloud Practitioner',
    skill_or_course_name: 'AWS',
    issuing_organization: 'Amazon Web Services',
    issue_date: '2026-01-20',
    certificate_id: 'AWS-CCP-98241',
    file_url: '#cert-preview',
    file_name: 'AWS_Cloud_Practitioner.pdf',
    file_type: 'pdf',
    verification_status: 'VERIFIED',
    verification_type: 'AI_PLATFORM_VERIFIED',
    verified_by: 'CAMPUSLINK AI Verifier',
    verified_at: '2026-01-22T08:00:00Z',
    created_at: '2026-01-20T10:00:00Z'
  },
  {
    id: 'cert_2',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    certificate_name: 'Meta Front-End Developer Professional',
    skill_or_course_name: 'React',
    issuing_organization: 'Meta / Coursera',
    issue_date: '2025-11-15',
    certificate_id: 'META-FE-7721',
    file_url: '#cert-preview',
    file_name: 'Meta_FrontEnd_Cert.pdf',
    file_type: 'pdf',
    verification_status: 'VERIFIED',
    verification_type: 'STUDENT_UPLOADED',
    verified_by: 'Dr. Rajesh Rao (TPO)',
    verified_at: '2025-11-18T14:30:00Z',
    created_at: '2025-11-15T12:00:00Z'
  },
  {
    id: 'cert_3',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    certificate_name: 'Advanced PostgreSQL Performance Tuning',
    skill_or_course_name: 'PostgreSQL',
    issuing_organization: 'Database Engineering Institute',
    issue_date: '2026-03-01',
    certificate_id: 'PG-DBA-4401',
    file_url: '#cert-preview',
    file_name: 'PostgreSQL_Cert.pdf',
    file_type: 'pdf',
    verification_status: 'PENDING',
    verification_type: 'STUDENT_UPLOADED',
    created_at: '2026-03-01T15:00:00Z'
  },
  {
    id: 'cert_4',
    student_id: 'user_student_priya',
    student_name: 'Priya Sharma',
    certificate_name: 'TensorFlow Developer Certificate',
    skill_or_course_name: 'Machine Learning',
    issuing_organization: 'Google Developers',
    issue_date: '2025-12-05',
    certificate_id: 'TF-DEV-1940',
    file_url: '#cert-preview',
    file_name: 'TF_Dev_Certificate.pdf',
    file_type: 'pdf',
    verification_status: 'VERIFIED',
    verification_type: 'AI_PLATFORM_VERIFIED',
    verified_by: 'CAMPUSLINK AI Verifier',
    verified_at: '2025-12-07T09:15:00Z',
    created_at: '2025-12-05T09:00:00Z'
  }
];

const initialAssessmentResults: AssessmentResultModel[] = [
  {
    id: 'res_l1_aarav',
    assessment_id: 'sess_seed_l1',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    level: 1,
    status: 'PASSED',
    passing_threshold_pct: 80,
    total_questions: 5,
    correct_answers: 5,
    incorrect_answers: 0,
    score_percentage: 100,
    total_time_taken_seconds: 180,
    average_response_time_seconds: 36,
    skill_breakdown: {
      Python: { total: 2, correct: 2, percentage: 100 },
      React: { total: 2, correct: 2, percentage: 100 },
      SQL: { total: 1, correct: 1, percentage: 100 }
    },
    ai_summary: 'Flawless fundamental knowledge across Python, React, and SQL syntax. Cleared Level 1 with 100% score.',
    next_level_unlocked: true,
    completed_at: '2026-09-18T10:15:00Z'
  },
  {
    id: 'res_l2_aarav',
    assessment_id: 'sess_seed_l2',
    student_id: 'user_student_aarav',
    student_name: 'Aarav Reddy',
    level: 2,
    status: 'PASSED',
    passing_threshold_pct: 80,
    total_questions: 5,
    correct_answers: 4,
    incorrect_answers: 1,
    score_percentage: 80,
    total_time_taken_seconds: 240,
    average_response_time_seconds: 48,
    skill_breakdown: {
      Python: { total: 2, correct: 2, percentage: 100 },
      Django: { total: 1, correct: 1, percentage: 100 },
      React: { total: 1, correct: 1, percentage: 100 },
      SQL: { total: 1, correct: 0, percentage: 0 }
    },
    ai_summary: 'Demonstrated solid intermediate scenario skills in Python generators, Django query optimization, and React memory caching. Minor gap noted in complex SQL query plans.',
    next_level_unlocked: true,
    completed_at: '2026-09-20T14:45:00Z'
  }
];

// Class to manage in-memory database with persistent JSON fallback
class CampusDatabase {
  private users: User[] = [];
  private studentProfiles: StudentProfile[] = [];
  private recruiterProfiles: RecruiterProfile[] = [];
  private companies: Company[] = [];
  private jobs: JobPosting[] = [];
  private drives: Drive[] = [];
  private applications: Application[] = [];
  private interviews: InterviewRecord[] = [];
  private offers: OfferRecord[] = [];
  private documents: DocumentItem[] = [];
  private notifications: NotificationItem[] = [];
  private scoringWeights: ScoringWeights = defaultScoringWeights;
  private matchingWeights: MatchingWeights = defaultMatchingWeights;
  private otpRecords: OtpRecord[] = [];

  // Extended Relational Entities
  private passports: PlacementPassportModel[] = [];
  private passportVerifications: PassportVerificationModel[] = [];
  private studentSkills: StudentSkillModel[] = [];
  private driveCandidates: DriveCandidateModel[] = [];
  private interviewQueues: InterviewQueueModel[] = [];
  private interviewRounds: InterviewRoundModel[] = [];
  private placementPolicies: PlacementPolicyModel[] = [];
  private policyDecisions: PolicyDecisionModel[] = [];
  private offerEntities: OfferModel[] = [];
  private attendances: AttendanceModel[] = [];
  private auditLogs: AuditLogModel[] = [];

  // Skill Verification & Assessment Entities
  private resumeSkills: ResumeSkillModel[] = [];
  private skillScores: SkillScoreModel[] = [];
  private assessmentSessions: AssessmentSession[] = [];
  private assessmentResults: AssessmentResultModel[] = [];
  private certificates: CertificateModel[] = [];
  private assessmentSettings: AssessmentSettingsModel = { ...defaultAssessmentSettings };
  private resumeAnalyses: Record<string, ResumeExtractedData> = {};

  // Smart Room Allocation Entities
  private rooms: CollegeRoom[] = [];
  private academicSchedules: AcademicSchedule[] = [];
  private placementAllocations: PlacementDriveAllocation[] = [];
  private adminAlerts: AdministrationAlert[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        this.users = data.users || initialUsers;
        this.studentProfiles = data.studentProfiles || initialStudentProfiles;
        this.recruiterProfiles = data.recruiterProfiles || initialRecruiterProfiles;
        this.companies = data.companies || initialCompanies;
        this.jobs = data.jobs || initialJobs;
        this.drives = data.drives || initialDrives;
        this.applications = data.applications || initialApplications;
        this.documents = data.documents || initialDocuments;
        this.notifications = data.notifications || initialNotifications;
        this.scoringWeights = data.scoringWeights || defaultScoringWeights;
        this.matchingWeights = data.matchingWeights || defaultMatchingWeights;
        this.otpRecords = data.otpRecords || [];
        this.passports = data.passports || initialPassports;
        this.passportVerifications = data.passportVerifications || [];
        this.studentSkills = data.studentSkills || [];
        this.driveCandidates = data.driveCandidates || initialDriveCandidates;
        this.interviewQueues = data.interviewQueues || initialInterviewQueues;
        this.interviewRounds = data.interviewRounds || [];
        this.placementPolicies = data.placementPolicies || initialPlacementPolicies;
        this.policyDecisions = data.policyDecisions || [];
        this.offerEntities = data.offerEntities || [];
        this.attendances = data.attendances || [];
        this.auditLogs = data.auditLogs || initialAuditLogs;
        this.resumeSkills = data.resumeSkills || initialResumeSkills;
        this.skillScores = data.skillScores || initialSkillScores;
        this.assessmentSessions = data.assessmentSessions || [];
        this.assessmentResults = data.assessmentResults || initialAssessmentResults;
        this.certificates = data.certificates || initialCertificates;
        this.assessmentSettings = data.assessmentSettings || { ...defaultAssessmentSettings };
        this.resumeAnalyses = data.resumeAnalyses || {};
        this.rooms = data.rooms && data.rooms.length > 0 ? data.rooms : [...initialCollegeRooms];
        this.academicSchedules = data.academicSchedules && data.academicSchedules.length > 0 ? data.academicSchedules : [...initialAcademicSchedules];
        this.placementAllocations = data.placementAllocations && data.placementAllocations.length > 0 ? data.placementAllocations : [...initialPlacementAllocations];
        this.adminAlerts = data.adminAlerts && data.adminAlerts.length > 0 ? data.adminAlerts : [...initialAdminAlerts];
        this.syncDerivedCollections();
        return;
      }
    } catch (err) {
      console.error('Error loading campus database, initializing defaults:', err);
    }

    // Default initialization
    this.users = [...initialUsers];
    this.studentProfiles = [...initialStudentProfiles];
    this.recruiterProfiles = [...initialRecruiterProfiles];
    this.companies = [...initialCompanies];
    this.jobs = [...initialJobs];
    this.drives = [...initialDrives];
    this.applications = [...initialApplications];
    this.documents = [...initialDocuments];
    this.notifications = [...initialNotifications];
    this.scoringWeights = { ...defaultScoringWeights };
    this.matchingWeights = { ...defaultMatchingWeights };
    this.otpRecords = [];
    this.passports = [...initialPassports];
    this.passportVerifications = [];
    this.studentSkills = [];
    this.driveCandidates = [...initialDriveCandidates];
    this.interviewQueues = [...initialInterviewQueues];
    this.interviewRounds = [];
    this.placementPolicies = [...initialPlacementPolicies];
    this.policyDecisions = [];
    this.offerEntities = [];
    this.attendances = [];
    this.auditLogs = [...initialAuditLogs];
    this.resumeSkills = [...initialResumeSkills];
    this.skillScores = [...initialSkillScores];
    this.assessmentSessions = [];
    this.assessmentResults = [...initialAssessmentResults];
    this.certificates = [...initialCertificates];
    this.assessmentSettings = { ...defaultAssessmentSettings };
    this.resumeAnalyses = {};
    this.rooms = [...initialCollegeRooms];
    this.academicSchedules = [...initialAcademicSchedules];
    this.placementAllocations = [...initialPlacementAllocations];
    this.adminAlerts = [...initialAdminAlerts];
    this.syncDerivedCollections();
    this.save();
  }

  private syncDerivedCollections() {
    // Generate interview records from applications
    this.interviews = [];
    this.applications.forEach(app => {
      if (app.interviewDetails) {
        this.interviews.push({
          id: app.interviewDetails.id || `int_${app.id}`,
          applicationId: app.id,
          studentId: app.studentId,
          studentName: app.studentName,
          studentBranch: app.studentBranch,
          studentCgpa: app.studentCgpa,
          companyName: app.companyName,
          companyLogo: app.companyLogo,
          jobTitle: app.jobTitle,
          roundName: app.interviewDetails.roundName,
          date: app.interviewDetails.date,
          time: app.interviewDetails.time,
          venueOrLink: app.interviewDetails.venue || app.interviewDetails.meetingLink,
          panel: app.interviewDetails.interviewer,
          status: (app.stage === 'interview' ? 'Scheduled' : app.stage === 'offered' || app.stage === 'accepted' ? 'Selected' : 'Completed') as any,
          technicalScore: app.interviewDetails.technicalScore,
          communicationScore: app.interviewDetails.communicationScore,
          problemSolvingScore: app.interviewDetails.problemSolvingScore,
          overallScore: app.interviewDetails.overallScore,
          feedback: app.interviewDetails.feedback
        });
      }
    });

    // Generate offer records
    this.offers = [];
    this.applications.forEach(app => {
      if (app.offerDetails) {
        this.offers.push({
          id: app.offerDetails.id || `off_${app.id}`,
          applicationId: app.id,
          studentId: app.studentId,
          studentName: app.studentName,
          studentEmail: app.studentEmail,
          studentBranch: app.studentBranch,
          companyName: app.companyName,
          companyLogo: app.companyLogo,
          jobTitle: app.jobTitle,
          ctc: app.offerDetails.ctc,
          baseFixed: app.offerDetails.baseFixed || '70% Base',
          bonus: app.offerDetails.bonus || '15% Performance',
          rsu: app.offerDetails.rsu || '15% Equity',
          offerDate: '2026-08-20',
          joiningDate: app.offerDetails.joiningDate,
          validTill: app.offerDetails.validTill,
          status: app.offerDetails.status,
          offerLetterUrl: app.offerDetails.offerLetterUrl || '#preview-offer',
          terms: app.offerDetails.terms || 'Full health coverage and comprehensive onboarding.'
        });
      }
    });
  }

  public save() {
    try {
      const data: DatabaseSchema = {
        users: this.users,
        studentProfiles: this.studentProfiles,
        recruiterProfiles: this.recruiterProfiles,
        companies: this.companies,
        jobs: this.jobs,
        drives: this.drives,
        applications: this.applications,
        interviews: this.interviews,
        offers: this.offers,
        documents: this.documents,
        notifications: this.notifications,
        scoringWeights: this.scoringWeights,
        matchingWeights: this.matchingWeights,
        otpRecords: this.otpRecords,
        passports: this.passports,
        passportVerifications: this.passportVerifications,
        studentSkills: this.studentSkills,
        driveCandidates: this.driveCandidates,
        interviewQueues: this.interviewQueues,
        interviewRounds: this.interviewRounds,
        placementPolicies: this.placementPolicies,
        policyDecisions: this.policyDecisions,
        offerEntities: this.offerEntities,
        attendances: this.attendances,
        auditLogs: this.auditLogs,
        resumeSkills: this.resumeSkills,
        skillScores: this.skillScores,
        assessmentSessions: this.assessmentSessions,
        assessmentResults: this.assessmentResults,
        certificates: this.certificates,
        assessmentSettings: this.assessmentSettings,
        resumeAnalyses: this.resumeAnalyses,
        rooms: this.rooms,
        academicSchedules: this.academicSchedules,
        placementAllocations: this.placementAllocations,
        adminAlerts: this.adminAlerts
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // ----------------- USERS -----------------
  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id || u._id === id);
  }

  getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    return this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  getUserByCollegeId(collegeId: string): User | undefined {
    if (!collegeId) return undefined;
    const cid = collegeId.trim().toLowerCase();
    const foundUser = this.users.find(u => u.college_id && u.college_id.toLowerCase() === cid);
    if (foundUser) return foundUser;
    const profile = this.studentProfiles.find(p => p.rollNumber && p.rollNumber.toLowerCase() === cid);
    if (profile) return this.getUserById(profile.userId);
    return undefined;
  }

  checkDuplicate(email: string, collegeId?: string): { emailExists: boolean; collegeIdExists: boolean } {
    const normEmail = (email || '').trim().toLowerCase();
    const normCid = (collegeId || '').trim().toLowerCase();

    // Only accounts that are active, verified, and have set passwords are considered duplicate registered accounts
    const emailUser = this.users.find(u => u.email.toLowerCase() === normEmail);
    const emailExists = Boolean(emailUser && emailUser.email_verified === true && Boolean(emailUser.password_hash));

    const cidUser = this.users.find(u => u.college_id && u.college_id.toLowerCase() === normCid);
    const collegeIdExists = Boolean(
      cidUser && 
      cidUser.email_verified === true && 
      Boolean(cidUser.password_hash) && 
      cidUser.email.toLowerCase() !== normEmail
    );

    return { emailExists, collegeIdExists };
  }

  createUser(user: User): User {
    this.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id || u._id === id);
    if (idx === -1) return undefined;
    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.users[idx];
  }

  // ----------------- OTP RECORDS -----------------
  getOtpRecords(): OtpRecord[] {
    return this.otpRecords;
  }

  createOtpRecord(record: OtpRecord): OtpRecord {
    this.otpRecords.push(record);
    this.save();
    return record;
  }

  getLatestOtpByEmail(email: string): OtpRecord | undefined {
    if (!email) return undefined;
    const normEmail = email.trim().toLowerCase();
    const matches = this.otpRecords.filter(r => r.email.toLowerCase() === normEmail);
    if (matches.length === 0) return undefined;
    // Sort descending by created_at
    return matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }

  updateOtpRecord(id: string, updates: Partial<OtpRecord>): OtpRecord | undefined {
    const idx = this.otpRecords.findIndex(r => r._id === id);
    if (idx === -1) return undefined;
    this.otpRecords[idx] = {
      ...this.otpRecords[idx],
      ...updates
    };
    this.save();
    return this.otpRecords[idx];
  }

  // ----------------- PROFILES -----------------
  getStudentProfile(userId: string): StudentProfile | undefined {
    return this.studentProfiles.find(p => p.userId === userId);
  }

  getAllStudentProfiles(): StudentProfile[] {
    return this.studentProfiles;
  }

  upsertStudentProfile(profile: Partial<StudentProfile> & { userId: string }): StudentProfile {
    const idx = this.studentProfiles.findIndex(p => p.userId === profile.userId);
    const existing = idx >= 0 ? this.studentProfiles[idx] : null;

    const merged = {
      ...(existing || {
        userId: profile.userId,
        fullName: 'Student Candidate',
        email: '',
        phone: '',
        university: 'National Institute of Technology',
        rollNumber: '2022UGCS001',
        degree: 'B.Tech',
        branch: 'Computer Science & Engineering',
        graduationYear: 2026,
        cgpa: 8.0,
        maxCgpa: 10,
        backlogs: 0,
        skills: ['React', 'Python', 'SQL'],
        bio: '',
        github: '',
        linkedin: '',
        portfolio: '',
        resumeFilename: 'Student_Resume.pdf',
        resumeUrl: '#preview-resume',
        projects: [],
        experience: [],
        certifications: [],
        targetRoles: ['Software Engineer'],
        aptitudeScore: 80,
        mockInterviewScore: 80,
        communicationScore: 80,
        readinessScore: 80,
        readinessLevel: 'READY' as ReadinessLevel,
        readinessBreakdown: { technical: 80, academic: 80, projects: 80, certifications: 80, aptitude: 80, communication: 80, interview: 80 },
        isVerified: true
      }),
      ...profile
    };

    // Recompute readiness deterministically using current weights
    const readiness = computeReadiness(merged, this.scoringWeights);
    merged.readinessScore = readiness.score;
    merged.readinessLevel = readiness.level;
    merged.readinessBreakdown = readiness.breakdown;

    if (idx >= 0) {
      this.studentProfiles[idx] = merged as StudentProfile;
    } else {
      this.studentProfiles.push(merged as StudentProfile);
    }

    this.save();
    return merged as StudentProfile;
  }

  getRecruiterProfile(userId: string): RecruiterProfile | undefined {
    return this.recruiterProfiles.find(p => p.userId === userId);
  }

  upsertRecruiterProfile(profile: RecruiterProfile): RecruiterProfile {
    const idx = this.recruiterProfiles.findIndex(p => p.userId === profile.userId);
    if (idx >= 0) {
      this.recruiterProfiles[idx] = profile;
    } else {
      this.recruiterProfiles.push(profile);
    }
    this.save();
    return profile;
  }

  // ----------------- COMPANIES -----------------
  getCompanies(): Company[] {
    return this.companies;
  }

  getCompanyById(id: string): Company | undefined {
    return this.companies.find(c => c.id === id);
  }

  createCompany(company: Company): Company {
    this.companies.push(company);
    this.save();
    return company;
  }

  // ----------------- JOBS -----------------
  getJobs(filters?: { search?: string; type?: string; department?: string; minCgpa?: number }): JobPosting[] {
    let result = [...this.jobs];
    if (!filters) return result;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q)) ||
        j.description.toLowerCase().includes(q)
      );
    }
    if (filters.type && filters.type !== 'All') {
      result = result.filter(j => j.type === filters.type);
    }
    if (filters.department && filters.department !== 'All') {
      result = result.filter(j => j.department.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    if (typeof filters.minCgpa === 'number') {
      result = result.filter(j => j.minCgpa <= filters.minCgpa!);
    }
    return result;
  }

  getJobById(id: string): JobPosting | undefined {
    return this.jobs.find(j => j.id === id);
  }

  createJob(job: JobPosting): JobPosting {
    this.jobs.unshift(job);
    this.save();
    dbEvents.emit('job:created', job);
    return job;
  }

  updateJob(id: string, updates: Partial<JobPosting>): JobPosting | null {
    const idx = this.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.jobs[idx] = { ...this.jobs[idx], ...updates, updatedAt: new Date().toISOString() };
    this.save();
    return this.jobs[idx];
  }

  deleteJob(id: string): boolean {
    const initialLen = this.jobs.length;
    this.jobs = this.jobs.filter(j => j.id !== id);
    if (this.jobs.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // ----------------- DRIVES & SCHEDULING (CONFLICT DETECTION) -----------------
  getDrives(): Drive[] {
    return this.drives;
  }

  getDriveById(id: string): Drive | undefined {
    return this.drives.find(d => d.id === id);
  }

  checkSchedulingConflict(candidateDrive: {
    companyId: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    targetBatches: number[];
  }): ConflictCheckResult {
    // 1. Check Venue Clash
    const venueClash = this.drives.find(d => 
      d.date === candidateDrive.date && 
      d.venue.toLowerCase().trim() === candidateDrive.venue.toLowerCase().trim() &&
      d.status !== 'Completed' &&
      d.status !== 'Postponed'
    );

    if (venueClash) {
      return {
        hasConflict: true,
        conflictType: 'venue',
        description: `Venue "${candidateDrive.venue}" is already reserved on ${candidateDrive.date} for "${venueClash.title}" (${venueClash.startTime} - ${venueClash.endTime}).`,
        clashingEntities: [venueClash.companyName, venueClash.venue],
        suggestedSlot: {
          date: candidateDrive.date,
          startTime: '02:00 PM',
          endTime: '05:30 PM'
        }
      };
    }

    // 2. Check Company Duplicate Drive on Same Day
    const companyClash = this.drives.find(d =>
      d.companyId === candidateDrive.companyId &&
      d.date === candidateDrive.date
    );

    if (companyClash) {
      return {
        hasConflict: true,
        conflictType: 'company',
        description: `Company ${companyClash.companyName} already has an active drive scheduled on ${candidateDrive.date}.`,
        clashingEntities: [companyClash.companyName],
        suggestedSlot: {
          date: '2026-10-30',
          startTime: '10:00 AM',
          endTime: '04:00 PM'
        }
      };
    }

    // 3. Check Student Batch Overlap (two tier-1 drives at the same slot)
    const tierOneClashes = this.drives.filter(d =>
      d.date === candidateDrive.date &&
      d.startTime === candidateDrive.startTime
    );

    if (tierOneClashes.length > 0) {
      return {
        hasConflict: true,
        conflictType: 'student',
        description: `High student shortlist conflict: 42 eligible CSE/IT students are already scheduled for "${tierOneClashes[0].title}" at ${candidateDrive.startTime}.`,
        clashingEntities: [tierOneClashes[0].companyName],
        suggestedSlot: {
          date: candidateDrive.date,
          startTime: '02:00 PM',
          endTime: '06:00 PM'
        }
      };
    }

    return { hasConflict: false };
  }

  // ----------------- APPLICATIONS -----------------
  getApplications(query?: { studentId?: string; studentEmail?: string; jobId?: string; recruiterId?: string }): Application[] {
    let result = [...this.applications];
    if (!query) return result;

    if (query.studentId || query.studentEmail) {
      const email = query.studentEmail?.toLowerCase();
      result = result.filter(a => 
        (query.studentId && a.studentId === query.studentId) ||
        (email && a.studentEmail?.toLowerCase() === email)
      );
    }
    if (query.jobId) {
      result = result.filter(a => a.jobId === query.jobId);
    }
    if (query.recruiterId) {
      const recruiterJobs = this.jobs.filter(j => j.recruiterId === query.recruiterId).map(j => j.id);
      result = result.filter(a => recruiterJobs.includes(a.jobId));
    }
    return result;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find(a => a.id === id);
  }

  createApplication(app: Application): Application {
    const existing = this.applications.find(a => a.studentId === app.studentId && a.jobId === app.jobId);
    if (existing) {
      throw new Error('You have already applied for this job posting');
    }
    this.applications.unshift(app);
    this.updateJobApplicantCount(app.jobId);
    this.syncDerivedCollections();
    this.save();
    dbEvents.emit('application:created', app);
    return app;
  }

  updateApplication(id: string, updates: Partial<Application>): Application | null {
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.applications[idx] = { ...this.applications[idx], ...updates, updatedAt: new Date().toISOString() };
    this.syncDerivedCollections();
    this.save();
    dbEvents.emit('application:updated', this.applications[idx]);
    return this.applications[idx];
  }

  private updateJobApplicantCount(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) {
      job.applicantCount = this.applications.filter(a => a.jobId === jobId).length;
    }
  }

  // ----------------- INTERVIEWS -----------------
  getInterviews(): InterviewRecord[] {
    return this.interviews;
  }

  getInterviewById(id: string): InterviewRecord | undefined {
    return this.interviews.find(i => i.id === id);
  }

  updateInterview(id: string, updates: Partial<InterviewRecord>): InterviewRecord | null {
    const idx = this.interviews.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.interviews[idx] = { ...this.interviews[idx], ...updates };
    
    // Also update parent application
    const appIdx = this.applications.findIndex(a => a.id === this.interviews[idx].applicationId);
    if (appIdx >= 0 && this.applications[appIdx].interviewDetails) {
      this.applications[appIdx].interviewDetails = {
        ...this.applications[appIdx].interviewDetails!,
        technicalScore: updates.technicalScore ?? this.applications[appIdx].interviewDetails!.technicalScore,
        communicationScore: updates.communicationScore ?? this.applications[appIdx].interviewDetails!.communicationScore,
        problemSolvingScore: updates.problemSolvingScore ?? this.applications[appIdx].interviewDetails!.problemSolvingScore,
        overallScore: updates.overallScore ?? this.applications[appIdx].interviewDetails!.overallScore,
        feedback: updates.feedback ?? this.applications[appIdx].interviewDetails!.feedback,
        status: updates.status ?? this.applications[appIdx].interviewDetails!.status
      };
    }
    this.save();
    return this.interviews[idx];
  }

  // ----------------- OFFERS -----------------
  getOffers(): OfferRecord[] {
    return this.offers;
  }

  getOfferById(id: string): OfferRecord | undefined {
    return this.offers.find(o => o.id === id);
  }

  updateOfferStatus(id: string, status: OfferRecord['status']): OfferRecord | null {
    const idx = this.offers.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.offers[idx].status = status;

    // Update parent application
    const app = this.applications.find(a => a.id === this.offers[idx].applicationId);
    if (app && app.offerDetails) {
      app.offerDetails.status = status;
      if (status === 'Accepted') app.stage = 'accepted';
      else if (status === 'Joined') app.stage = 'joined';
    }
    this.save();
    return this.offers[idx];
  }

  // ----------------- DOCUMENTS -----------------
  getDocuments(studentId?: string): DocumentItem[] {
    if (studentId) {
      return this.documents.filter(d => d.studentId === studentId);
    }
    return this.documents;
  }

  createDocument(doc: DocumentItem): DocumentItem {
    this.documents.unshift(doc);
    this.save();
    return doc;
  }

  updateDocumentStatus(id: string, status: DocumentItem['status'], note?: string, verifiedBy?: string): DocumentItem | null {
    const idx = this.documents.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.documents[idx].status = status;
    if (note) this.documents[idx].verificationNote = note;
    if (verifiedBy) this.documents[idx].verifiedBy = verifiedBy;
    this.save();
    return this.documents[idx];
  }

  // ----------------- NOTIFICATIONS -----------------
  getNotifications(userId: string, userEmail?: string, userRole?: string): NotificationItem[] {
    const user = this.users.find(u => u.id === userId || (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase()));
    const resolvedRole = userRole || user?.role || (userId.includes('officer') || userId.includes('tpo') ? 'tpo' : userId.includes('recruiter') ? 'recruiter' : 'student');
    const resolvedEmail = (userEmail || user?.email || '').toLowerCase();

    // Set of matching recipient IDs / aliases
    const aliases = new Set<string>([userId, 'all']);
    if (resolvedEmail) aliases.add(resolvedEmail);
    if (user?.id) aliases.add(user.id);

    if (resolvedRole === 'tpo' || resolvedRole === 'admin') {
      aliases.add('tpo');
      aliases.add('admin');
      aliases.add('officer');
      aliases.add('user_officer_rajesh');
    } else if (resolvedRole === 'recruiter') {
      aliases.add('recruiter');
    } else if (resolvedRole === 'student') {
      aliases.add('student');
    }

    // Also check student profile if any
    const profile = this.studentProfiles.find(sp => sp.userId === userId || (resolvedEmail && sp.email?.toLowerCase() === resolvedEmail));
    if (profile) {
      aliases.add(profile.userId);
      if (profile.email) aliases.add(profile.email.toLowerCase());
    }

    // Handle student Bishnu Sahoo aliases across demo accounts
    if (resolvedEmail === 'sahoobishnu8249@gmail.com' || userId === 'user_student_bishnu' || userId === 'user_student_b078fb0cca9b0275517b16ff') {
      aliases.add('user_student_bishnu');
      aliases.add('user_student_b078fb0cca9b0275517b16ff');
      aliases.add('sahoobishnu8249@gmail.com');
    }

    return this.notifications.filter(n => {
      if (aliases.has(n.userId)) return true;
      if (n.targetRole && (n.targetRole === resolvedRole || n.targetRole === 'all')) return true;
      if (resolvedEmail && n.userEmail && n.userEmail.toLowerCase() === resolvedEmail) return true;
      return false;
    });
  }

  createNotification(notif: NotificationItem): NotificationItem {
    this.notifications.unshift(notif);
    this.save();
    dbEvents.emit('notification:created', notif);
    return notif;
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): boolean {
    let changed = false;
    const user = this.users.find(u => u.id === userId);
    const isTPO = user?.role === 'tpo' || userId === 'user_officer_rajesh' || userId === 'tpo';
    
    this.notifications.forEach(n => {
      const match = n.userId === userId || n.userId === 'all' || (isTPO && (n.userId === 'tpo' || n.targetRole === 'tpo'));
      if (match && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) this.save();
    return changed;
  }

  deleteNotification(id: string): boolean {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    if (this.notifications.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  clearReadNotifications(userId: string): number {
    const initialLen = this.notifications.length;
    const user = this.users.find(u => u.id === userId);
    const isTPO = user?.role === 'tpo' || userId === 'user_officer_rajesh' || userId === 'tpo';

    this.notifications = this.notifications.filter(n => {
      const isForUser = n.userId === userId || n.userId === 'all' || (isTPO && (n.userId === 'tpo' || n.targetRole === 'tpo'));
      return !(isForUser && n.read);
    });
    const removed = initialLen - this.notifications.length;
    if (removed > 0) this.save();
    return removed;
  }

  // ----------------- SKILL GAP ANALYSIS -----------------
  getSkillGapAnalysis(studentId: string, targetRole: string = 'Full Stack Developer'): SkillGapAnalysis {
    const student = this.getStudentProfile(studentId) || this.studentProfiles[0];
    const roleRequirements: Record<string, string[]> = {
      'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'REST API', 'Git'],
      'Backend Developer': ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis', 'Kafka', 'Microservices', 'Git'],
      'Data Analyst': ['SQL', 'Python', 'PowerBI', 'Tableau', 'Pandas', 'Excel', 'Statistics'],
      'Cloud DevOps Engineer': ['AWS', 'Linux', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Python'],
      'AI/ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'FastAPI', 'SQL', 'Docker', 'Algorithms']
    };

    const reqSkills = roleRequirements[targetRole] || roleRequirements['Full Stack Developer'];
    const studentSkillsLower = student.skills.map(s => s.toLowerCase());

    const matched: string[] = [];
    const missing: { skill: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; resource: string; estimatedDays: number; category: string }[] = [];

    reqSkills.forEach(skill => {
      if (studentSkillsLower.includes(skill.toLowerCase())) {
        matched.push(skill);
      } else {
        let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        let days = 10;
        let res = 'Interactive coding track & documentation';

        if (skill === 'SQL' || skill === 'Python' || skill === 'React') {
          priority = 'HIGH';
          days = 7;
          res = 'Stanford DB / LeetCode SQL 50 Study Plan';
        } else if (skill === 'AWS' || skill === 'Docker') {
          priority = 'HIGH';
          days = 12;
          res = 'AWS Certified Practitioner Hands-On Labs';
        } else {
          priority = 'LOW';
          days = 5;
          res = 'Official Documentation & micro-project sandbox';
        }

        missing.push({
          skill,
          priority,
          resource: res,
          estimatedDays: days,
          category: 'Core Competency'
        });
      }
    });

    const roleReadiness = Math.round((matched.length / reqSkills.length) * 100);

    const roadmap = [
      {
        id: 'road_1',
        title: 'Database Mastery & Query Optimization',
        category: 'SQL / Relational Modeling',
        progress: studentSkillsLower.includes('sql') ? 100 : 40,
        tasks: ['Complete SQL Joins & Subqueries', 'Write window functions for analytics', 'Index optimization & execution plan analysis']
      },
      {
        id: 'road_2',
        title: 'Containerization & Cloud Infrastructure',
        category: 'Docker & AWS Basics',
        progress: studentSkillsLower.includes('docker') ? 80 : 25,
        tasks: ['Write multi-stage Dockerfiles', 'Deploy containers to AWS ECS/Fargate', 'Configure AWS S3 bucket policies & IAM roles']
      },
      {
        id: 'road_3',
        title: 'Full-Stack REST Architecture & Security',
        category: 'System Design',
        progress: 85,
        tasks: ['Implement JWT Bearer authorization', 'Add rate limiting and CORS validation', 'Write automated end-to-end integration tests']
      }
    ];

    return {
      targetRole,
      currentSkills: student.skills,
      requiredSkills: reqSkills,
      matchedSkills: matched,
      missingSkills: missing,
      preparationRoadmap: roadmap,
      roleReadinessScore: roleReadiness
    };
  }

  // ----------------- AT-RISK STUDENTS DETECTION -----------------
  getAtRiskStudents(): AtRiskStudent[] {
    const list: AtRiskStudent[] = [];

    this.studentProfiles.forEach(s => {
      const reasons: string[] = [];
      let isHighRisk = false;
      let isMediumRisk = false;

      if (s.readinessScore < 60) {
        reasons.push(`Low readiness score (${s.readinessScore}/100)`);
        isHighRisk = true;
      } else if (s.readinessScore < 72) {
        reasons.push(`Developing readiness score (${s.readinessScore}/100)`);
        isMediumRisk = true;
      }

      if (s.cgpa < 6.8) {
        reasons.push(`Academic CGPA (${s.cgpa.toFixed(2)}) below standard corporate cutoff (7.0)`);
        isHighRisk = true;
      }

      if ((s.backlogs ?? 0) > 0) {
        reasons.push(`${s.backlogs} standing academic backlog(s)`);
        isHighRisk = true;
      }

      if (s.skills.length <= 4) {
        reasons.push(`Limited technical skill coverage (${s.skills.length} skills listed)`);
        isMediumRisk = true;
      }

      if (s.mockInterviewScore < 65) {
        reasons.push(`Mock interview score (${s.mockInterviewScore}/100) below acceptable benchmark`);
        isMediumRisk = true;
      }

      const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = isHighRisk ? 'HIGH' : isMediumRisk ? 'MEDIUM' : 'LOW';

      if (reasons.length > 0) {
        let recommendedAction = 'Enroll in institutional remediation workshop, complete SQL/Python track, and schedule mock interview with TPO panel.';
        if (riskLevel === 'HIGH') {
          recommendedAction = 'Priority 1: Urgent 1-on-1 counseling with Department Placement Coordinator; clear backlogs and enroll in intensive DSA bootcamp.';
        }

        list.push({
          studentId: s.userId,
          studentName: s.fullName,
          branch: s.branch,
          cgpa: s.cgpa,
          readinessScore: s.readinessScore,
          technicalCoverage: Math.min(100, s.skills.length * 12),
          failedInterviews: s.userId === 'user_student_manish' ? 2 : s.userId === 'user_student_aravind' ? 3 : 0,
          riskLevel,
          reasons,
          recommendedAction
        });
      }
    });

    return list.sort((a, b) => (a.riskLevel === 'HIGH' ? -1 : 1));
  }

  // ----------------- TPO & PLACEMENT ANALYTICS -----------------
  getPlacementStats(): CampusPlacementStats {
    const totalStudents = 1248;
    const placementReady = this.studentProfiles.filter(s => s.readinessScore >= 75).length * 42 + 210;
    const activeDrives = this.drives.filter(d => d.status === 'Upcoming' || d.status === 'In Progress').length + 8;
    const totalOffers = 326;
    const placedStudents = 302;
    const placementRate = Math.round((placedStudents / 420) * 100);
    const studentsAtRisk = this.getAtRiskStudents().length * 6 + 18;

    return {
      totalStudents,
      placementReady,
      activeDrives,
      totalOffers,
      placedStudents,
      placementRate,
      studentsAtRisk,
      averagePackageLPA: 12.8,
      highestPackageLPA: 48.0,
      funnel: {
        registered: 1248,
        eligible: 1085,
        shortlisted: 640,
        interviewed: 480,
        selected: 338,
        offerAccepted: 302,
        joined: 285
      },
      branchPlacement: [
        { branch: 'CSE', total: 320, placed: 295, rate: 92 },
        { branch: 'IT', total: 240, placed: 212, rate: 88 },
        { branch: 'AI & DS', total: 180, placed: 165, rate: 91 },
        { branch: 'ECE', total: 260, placed: 198, rate: 76 },
        { branch: 'ME', total: 150, placed: 88, rate: 58 },
        { branch: 'EE', total: 98, placed: 62, rate: 63 }
      ],
      skillDemand: [
        { skill: 'Python', jobCount: 38, percentage: 86 },
        { skill: 'React', jobCount: 32, percentage: 72 },
        { skill: 'SQL', jobCount: 30, percentage: 68 },
        { skill: 'AWS / Cloud', jobCount: 26, percentage: 59 },
        { skill: 'Docker / K8s', jobCount: 22, percentage: 50 },
        { skill: 'Java / Spring', jobCount: 20, percentage: 45 },
        { skill: 'Machine Learning', jobCount: 16, percentage: 36 }
      ],
      packageDistribution: [
        { range: '< ₹6 LPA', count: 45 },
        { range: '₹6 - ₹10 LPA', count: 110 },
        { range: '₹10 - ₹18 LPA', count: 125 },
        { range: '₹18 - ₹25 LPA', count: 32 },
        { range: '₹25 - ₹40 LPA', count: 14 }
      ],
      averagePackageTrend: [
        { year: '2023', avg: 8.9, highest: 36.0 },
        { year: '2024', avg: 10.4, highest: 42.0 },
        { year: '2025', avg: 11.6, highest: 45.5 },
        { year: '2026', avg: 12.8, highest: 48.0 }
      ],
      offersByCompany: [
        { company: 'Microsoft India', offers: 24, avgCtc: '₹29.2 LPA' },
        { company: 'Google India', offers: 12, avgCtc: '₹35.0 LPA' },
        { company: 'TechNova Solutions', offers: 28, avgCtc: '₹16.0 LPA' },
        { company: 'Amazon Web Services', offers: 20, avgCtc: '₹21.5 LPA' },
        { company: 'Cisco Systems', offers: 18, avgCtc: '₹21.0 LPA' },
        { company: 'TCS Digital', offers: 64, avgCtc: '₹7.5 LPA' }
      ],
      monthlyTrend: [
        { month: 'Jun', drives: 2, offers: 15 },
        { month: 'Jul', drives: 4, offers: 42 },
        { month: 'Aug', drives: 8, offers: 96 },
        { month: 'Sep', drives: 12, offers: 148 },
        { month: 'Oct (Proj)', drives: 10, offers: 90 }
      ]
    };
  }

  // ----------------- WEIGHTS CONFIGURATION -----------------
  getScoringWeights(): ScoringWeights {
    return this.scoringWeights;
  }

  updateScoringWeights(weights: Partial<ScoringWeights>): ScoringWeights {
    this.scoringWeights = { ...this.scoringWeights, ...weights };
    // Recompute all student readiness scores with new weights
    this.studentProfiles.forEach(p => {
      const res = computeReadiness(p, this.scoringWeights);
      p.readinessScore = res.score;
      p.readinessLevel = res.level;
      p.readinessBreakdown = res.breakdown;
    });
    this.save();
    return this.scoringWeights;
  }

  getMatchingWeights(): MatchingWeights {
    return this.matchingWeights;
  }

  updateMatchingWeights(weights: Partial<MatchingWeights>): MatchingWeights {
    this.matchingWeights = { ...this.matchingWeights, ...weights };
    this.save();
    return this.matchingWeights;
  }

  // =============================================================
  // RELATIONAL METHODS: PASSPORTS & VERIFICATIONS
  // =============================================================

  getPassports(): PlacementPassportModel[] {
    return this.passports;
  }

  getPassportById(id: string): PlacementPassportModel | undefined {
    return this.passports.find(p => p.id === id || p.passport_number === id);
  }

  getPassportByStudentId(studentId: string): PlacementPassportModel | undefined {
    return this.passports.find(p => p.student_id === studentId);
  }

  getPassportByQrToken(qrToken: string): PlacementPassportModel | undefined {
    if (!qrToken) return undefined;
    return this.passports.find(p => p.qr_token === qrToken || qrToken.includes(p.qr_token) || qrToken.includes(p.student_id));
  }

  createPassport(studentId: string, customData?: Partial<PlacementPassportModel>): PlacementPassportModel {
    const student = this.getStudentProfile(studentId);
    const existing = this.getPassportByStudentId(studentId);
    if (existing) {
      if (customData) {
        Object.assign(existing, customData, { updated_at: new Date().toISOString() });
        this.save();
      }
      return existing;
    }

    const branch = student?.branch ? student.branch.substring(0, 3).toUpperCase() : 'CSE';
    const rollShort = student?.rollNumber ? student.rollNumber.slice(-4) : student?.userId.slice(-4) || '8924';
    const passportNumber = `CL-2026-${branch}-${rollShort}`;
    const qrToken = `QR_TOK_${studentId}_${crypto.randomBytes(6).toString('hex')}`;
    const hash = '0x' + crypto.randomBytes(8).toString('hex');

    const newPassport: PlacementPassportModel = {
      id: `passport_${studentId}`,
      student_id: studentId,
      passport_number: passportNumber,
      status: 'VERIFIED',
      academic_verified: (student?.cgpa || 0) >= 6.0 && (student?.backlogs || 0) === 0,
      eligibility_verified: true,
      tpo_verified: true,
      attendance_verified: true,
      documents_verified: true,
      qr_token: qrToken,
      verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      blockchain_hash: hash,
      metrics: {
        cgpa: student?.cgpa || 8.65,
        backlogs: student?.backlogs || 0,
        ats_score: (student as any)?.atsScore || 90,
        readiness_score: student?.readinessScore || 85
      },
      ...customData
    };

    this.passports.push(newPassport);

    this.createAuditLog({
      user_id: studentId,
      action: 'PASSPORT_CREATED',
      entity_type: 'PlacementPassport',
      entity_id: newPassport.id,
      details: `Placement Passport ${newPassport.passport_number} generated for student.`
    });

    this.save();
    return newPassport;
  }

  updatePassport(id: string, updates: Partial<PlacementPassportModel>): PlacementPassportModel | undefined {
    const passport = this.getPassportById(id);
    if (!passport) return undefined;
    Object.assign(passport, updates, { updated_at: new Date().toISOString() });
    this.save();
    return passport;
  }

  verifyPassportSeal(
    passportId: string, 
    sealType: 'ACADEMIC' | 'TPO' | 'ATS' | 'BGV', 
    verifierId: string, 
    verifierRole: string, 
    status: 'VERIFIED' | 'REJECTED', 
    notes?: string
  ): PlacementPassportModel | undefined {
    const passport = this.getPassportById(passportId);
    if (!passport) return undefined;

    const verification: PassportVerificationModel = {
      id: `ver_${generateObjectId()}`,
      passport_id: passport.id,
      verifier_id: verifierId,
      verifier_role: verifierRole,
      seal_type: sealType,
      status,
      notes,
      verified_at: new Date().toISOString()
    };
    this.passportVerifications.push(verification);

    if (sealType === 'ACADEMIC') passport.academic_verified = status === 'VERIFIED';
    if (sealType === 'TPO') passport.tpo_verified = status === 'VERIFIED';
    if (sealType === 'ATS') passport.documents_verified = status === 'VERIFIED';
    if (sealType === 'BGV') passport.attendance_verified = status === 'VERIFIED';

    if (passport.academic_verified && passport.tpo_verified && passport.documents_verified) {
      passport.status = 'VERIFIED';
      passport.verified_at = new Date().toISOString();
    }

    passport.updated_at = new Date().toISOString();

    this.createAuditLog({
      user_id: verifierId,
      action: `PASSPORT_SEAL_${sealType}_${status}`,
      entity_type: 'PlacementPassport',
      entity_id: passport.id,
      details: notes || `${sealType} seal updated to ${status}`
    });

    this.save();
    return passport;
  }

  approvePassport(id: string, approverId: string): PlacementPassportModel | undefined {
    const passport = this.getPassportById(id);
    if (!passport) return undefined;
    passport.status = 'VERIFIED';
    passport.academic_verified = true;
    passport.tpo_verified = true;
    passport.eligibility_verified = true;
    passport.documents_verified = true;
    passport.attendance_verified = true;
    passport.verified_at = new Date().toISOString();
    passport.updated_at = new Date().toISOString();

    this.createAuditLog({
      user_id: approverId,
      action: 'PASSPORT_APPROVED',
      entity_type: 'PlacementPassport',
      entity_id: passport.id,
      details: 'All credentials and verification seals approved by TPO Directorate.'
    });

    this.save();
    return passport;
  }

  rejectPassport(id: string, rejectorId: string, reason: string): PlacementPassportModel | undefined {
    const passport = this.getPassportById(id);
    if (!passport) return undefined;
    passport.status = 'REVOKED';
    passport.updated_at = new Date().toISOString();

    this.createAuditLog({
      user_id: rejectorId,
      action: 'PASSPORT_REVOKED',
      entity_type: 'PlacementPassport',
      entity_id: passport.id,
      details: reason || 'Passport revoked due to academic discrepancy or policy infraction.'
    });

    this.save();
    return passport;
  }

  recheckPassport(id: string, requesterId: string, reason?: string): PlacementPassportModel | undefined {
    const passport = this.getPassportById(id);
    if (!passport) return undefined;
    passport.status = 'UNDER_REVIEW';
    passport.updated_at = new Date().toISOString();

    this.createAuditLog({
      user_id: requesterId,
      action: 'PASSPORT_RECHECK_REQUESTED',
      entity_type: 'PlacementPassport',
      entity_id: passport.id,
      details: reason || 'Recheck requested for passport credentials.'
    });

    this.save();
    return passport;
  }

  // =============================================================
  // RELATIONAL METHODS: DRIVES, CANDIDATES & QR CHECK-IN
  // =============================================================

  createDrive(data: Partial<Drive>): Drive {
    const newDrive: Drive = {
      id: data.id || `drv_${generateObjectId()}`,
      companyId: data.companyId || `comp_${generateObjectId()}`,
      companyName: data.companyName || 'Corporate Partner',
      companyLogo: data.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120',
      title: data.title || 'Campus Placement Drive 2026',
      role: data.role || data.title || 'Software Development Engineer',
      type: data.type || 'Full-Time',
      packageCtc: data.packageCtc || '₹18.0 LPA',
      location: data.location || 'Campus Tech Tower',
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || '09:00 AM',
      endTime: data.endTime || '05:00 PM',
      venue: data.venue || 'APJ Abdul Kalam Auditorium',
      targetBatches: data.targetBatches || [2026],
      allowedBranches: data.allowedBranches || ['CSE', 'IT', 'ECE'],
      eligibleBranches: data.eligibleBranches || ['CSE', 'IT', 'ECE'],
      minCgpa: data.minCgpa ?? 7.0,
      openings: data.openings || 10,
      status: (data.status as any) || 'Upcoming',
      panelMembers: data.panelMembers || ['Recruitment Panel 1', 'Engineering Manager'],
      currentStage: data.currentStage || 'Registration',
      totalRegistered: data.totalRegistered || 0,
      shortlistedCount: data.shortlistedCount || 0,
      offersReleased: data.offersReleased || 0,
      reportingTime: data.reportingTime || '09:00 AM',
      instructions: data.instructions || 'Bring physical copy of Placement Passport with dynamic QR code.',
      schedule: data.schedule || [
        { time: '09:00 AM', activity: 'Gate QR Check-in & Security Clearance', hall: 'Auditorium Gate 1' },
        { time: '10:00 AM', activity: 'Online Coding / Technical Assessment', hall: 'Central Lab 3' },
        { time: '01:30 PM', activity: 'Technical Interview Panel 1', hall: 'Room B-204' },
        { time: '04:00 PM', activity: 'HR & Executive Round', hall: 'Conference Hall' }
      ]
    };

    this.drives.unshift(newDrive);

    this.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: 'all',
      title: `🚀 New Drive Announced: ${newDrive.companyName}`,
      message: `${newDrive.companyName} is hiring for ${newDrive.role} (${newDrive.packageCtc}). Register before drive day.`,
      type: 'drive_announcement',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    return newDrive;
  }

  updateDrive(id: string, updates: Partial<Drive>): Drive | undefined {
    const drive = this.drives.find(d => d.id === id);
    if (!drive) return undefined;
    Object.assign(drive, updates);
    this.save();
    return drive;
  }

  deleteDrive(id: string): boolean {
    const idx = this.drives.findIndex(d => d.id === id);
    if (idx === -1) return false;
    this.drives.splice(idx, 1);
    this.save();
    return true;
  }

  getDriveCandidates(driveId: string): DriveCandidateModel[] {
    return this.driveCandidates.filter(c => c.drive_id === driveId);
  }

  getDriveCandidate(driveId: string, studentId: string): DriveCandidateModel | undefined {
    return this.driveCandidates.find(c => c.drive_id === driveId && (c.student_id === studentId || c.token_number === studentId));
  }

  checkInCandidate(
    driveId: string, 
    studentId: string, 
    method: 'QR_SCAN' | 'MANUAL' = 'QR_SCAN', 
    verifiedBy = 'system_gate_scanner'
  ): {
    student: StudentProfile;
    eligibility: { status: 'ELIGIBLE' | 'NOT_ELIGIBLE'; reasons: string[] };
    attendance: AttendanceModel;
    candidate: DriveCandidateModel;
    token: InterviewQueueModel;
    queue_position: number;
    drive: Drive;
    current_stage: string;
  } {
    const student = this.getStudentProfile(studentId);
    if (!student) {
      throw new Error(`Student not found with ID ${studentId}`);
    }

    const drive = this.getDriveById(driveId);
    if (!drive) {
      throw new Error(`Placement Drive not found with ID ${driveId}`);
    }

    // Check Eligibility against Drive requirements
    const isCgpaOk = (student.cgpa || 0) >= (drive.minCgpa || 6.0);
    const branches = drive.allowedBranches || (drive as any).eligibleBranches || [];
    const isBranchOk = branches.length === 0 || 
      branches.some((b: string) => b.toLowerCase().includes(student.branch.toLowerCase()) || student.branch.toLowerCase().includes(b.toLowerCase()));
    const isBacklogOk = (student.backlogs || 0) === 0;

    const reasons: string[] = [];
    if (!isCgpaOk) reasons.push(`CGPA ${student.cgpa} below cutoff ${drive.minCgpa}`);
    if (!isBranchOk) reasons.push(`Branch ${student.branch} not listed in eligible branches`);
    if (!isBacklogOk) reasons.push(`Student has ${student.backlogs} active backlog(s)`);

    const isEligible = isCgpaOk && isBranchOk && isBacklogOk;

    // Check if already checked in
    let candidate = this.getDriveCandidate(driveId, studentId);
    let queueItem = this.interviewQueues.find(q => q.drive_id === driveId && q.student_id === studentId);

    if (candidate && candidate.attendance_status === 'CHECKED_IN' && queueItem) {
      // Already checked in, return existing token
      const att = this.attendances.find(a => a.drive_id === driveId && a.student_id === studentId) || {
        id: `att_${generateObjectId()}`,
        drive_id: driveId,
        student_id: studentId,
        check_in_time: candidate.check_in_time || new Date().toISOString(),
        verified_by: verifiedBy,
        method,
        created_at: new Date().toISOString()
      };

      return {
        student,
        eligibility: {
          status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
          reasons: reasons.length ? reasons : ['All prerequisites verified']
        },
        attendance: att,
        candidate,
        token: queueItem,
        queue_position: queueItem.queue_position,
        drive,
        current_stage: candidate.current_stage
      };
    }

    // Generate Next Token (e.g. B-15, B-16, ...)
    const existingQueue = this.interviewQueues.filter(q => q.drive_id === driveId);
    const nextNum = existingQueue.length + 15;
    const tokenNumber = `B-${nextNum}`;
    const queuePosition = existingQueue.length + 1;

    // Record Attendance
    const attendance: AttendanceModel = {
      id: `att_${generateObjectId()}`,
      drive_id: driveId,
      student_id: studentId,
      check_in_time: new Date().toISOString(),
      verified_by: verifiedBy,
      method,
      created_at: new Date().toISOString()
    };
    this.attendances.push(attendance);

    // Create / Update Drive Candidate
    if (!candidate) {
      candidate = {
        id: `dc_${generateObjectId()}`,
        drive_id: driveId,
        student_id: studentId,
        student_name: student.fullName,
        roll_number: student.rollNumber || student.userId,
        branch: student.branch,
        cgpa: student.cgpa || 8.0,
        attendance_status: 'CHECKED_IN',
        check_in_time: new Date().toISOString(),
        current_stage: 'TECH_ROUND_1',
        token_number: tokenNumber,
        created_at: new Date().toISOString()
      };
      this.driveCandidates.push(candidate);
    } else {
      candidate.attendance_status = 'CHECKED_IN';
      candidate.check_in_time = new Date().toISOString();
      candidate.token_number = tokenNumber;
    }

    // Add to Interview Queue
    queueItem = {
      id: `q_${generateObjectId()}`,
      drive_id: driveId,
      candidate_id: candidate.id,
      student_id: studentId,
      student_name: student.fullName,
      student_roll: student.rollNumber || student.userId,
      token_number: tokenNumber,
      room: 'Room B-204 (Tech Panel 2)',
      round: 'Tech Round 1',
      status: 'WAITING',
      queue_position: queuePosition,
      created_at: new Date().toISOString()
    };
    this.interviewQueues.push(queueItem);

    // Audit Log
    this.createAuditLog({
      user_id: studentId,
      action: 'QR_GATE_CHECKIN',
      entity_type: 'DriveCandidate',
      entity_id: candidate.id,
      details: `Student ${student.fullName} checked in for ${drive.companyName}. Assigned Token ${tokenNumber}.`
    });

    // Notify Student
    this.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: studentId,
      title: `🎫 Gate Check-in Confirmed: Token ${tokenNumber}`,
      message: `You are Token ${tokenNumber} for ${drive.companyName}. Proceed to Room B-204 for Tech Round 1.`,
      type: 'drive_announcement',
      read: false,
      createdAt: new Date().toISOString()
    });

    dbEvents.emit('queue:updated', { driveId, queueItem });
    this.save();

    return {
      student,
      eligibility: {
        status: isEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
        reasons: reasons.length ? reasons : ['All prerequisites verified']
      },
      attendance,
      candidate,
      token: queueItem,
      queue_position: queuePosition,
      drive,
      current_stage: candidate.current_stage
    };
  }

  // =============================================================
  // RELATIONAL METHODS: WAR-ROOM & INTERVIEW QUEUE
  // =============================================================

  getDriveQueue(driveId: string): InterviewQueueModel[] {
    return this.interviewQueues
      .filter(q => q.drive_id === driveId || driveId === 'all')
      .sort((a, b) => a.queue_position - b.queue_position);
  }

  getQueueItemById(id: string): InterviewQueueModel | undefined {
    return this.interviewQueues.find(q => q.id === id || q.token_number === id);
  }

  callNextQueueCandidate(driveId: string, room = 'Room B-204 (Tech Panel 2)', interviewerName = 'Staff Engineer'): InterviewQueueModel | null {
    const queue = this.getDriveQueue(driveId);
    
    // Complete any currently in-progress candidate if needed
    const current = queue.find(q => q.status === 'CALLED' || q.status === 'IN_PROGRESS');
    if (current) {
      current.status = 'COMPLETED';
      current.completed_at = new Date().toISOString();
    }

    // Find next waiting candidate
    const nextCandidate = queue.find(q => q.status === 'WAITING');
    if (!nextCandidate) return null;

    nextCandidate.status = 'CALLED';
    nextCandidate.called_at = new Date().toISOString();
    nextCandidate.room = room;

    // Recalculate remaining positions
    let pos = 1;
    queue.forEach(item => {
      if (item.status === 'WAITING') {
        item.queue_position = pos++;
      }
    });

    // Create Notification & Broadcast Event
    this.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: nextCandidate.student_id,
      title: `🔔 YOUR TURN! Token ${nextCandidate.token_number}`,
      message: `Please report immediately to ${nextCandidate.room} with ${interviewerName}!`,
      type: 'drive_announcement',
      read: false,
      createdAt: new Date().toISOString()
    });

    dbEvents.emit('queue:called', { driveId, candidate: nextCandidate });
    this.save();
    return nextCandidate;
  }

  callSpecificCandidate(driveId: string, candidateIdOrToken: string, room = 'Room B-204 (Tech Panel 2)'): InterviewQueueModel | null {
    const queue = this.getDriveQueue(driveId);
    const candidate = queue.find(q => q.id === candidateIdOrToken || q.token_number === candidateIdOrToken || q.candidate_id === candidateIdOrToken || q.student_id === candidateIdOrToken);
    if (!candidate) return null;

    candidate.status = 'CALLED';
    candidate.called_at = new Date().toISOString();
    candidate.room = room;

    this.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: candidate.student_id,
      title: `🔔 YOUR TURN! Token ${candidate.token_number}`,
      message: `Please report immediately to ${candidate.room}!`,
      type: 'drive_announcement',
      read: false,
      createdAt: new Date().toISOString()
    });

    dbEvents.emit('queue:called', { driveId, candidate });
    this.save();
    return candidate;
  }

  updateQueueStatus(queueId: string, status: QueueStatus, notes?: string): InterviewQueueModel | undefined {
    const item = this.getQueueItemById(queueId);
    if (!item) return undefined;

    item.status = status;
    if (status === 'IN_PROGRESS' && !item.called_at) {
      item.called_at = new Date().toISOString();
    }
    if (status === 'COMPLETED' || status === 'SKIPPED' || status === 'ABSENT') {
      item.completed_at = new Date().toISOString();
    }

    dbEvents.emit('queue:updated', { queueId, item });
    this.save();
    return item;
  }

  moveQueueCandidateRoom(queueId: string, newRoom: string): InterviewQueueModel | undefined {
    const item = this.getQueueItemById(queueId);
    if (!item) return undefined;
    item.room = newRoom;
    dbEvents.emit('queue:updated', { queueId, item });
    this.save();
    return item;
  }

  // =============================================================
  // RELATIONAL METHODS: PLACEMENT POLICIES & AUDIT LOGS
  // =============================================================

  getPolicies(): PlacementPolicyModel[] {
    return this.placementPolicies;
  }

  getPolicyById(id: string): PlacementPolicyModel | undefined {
    return this.placementPolicies.find(p => p.id === id);
  }

  createPolicy(policy: Partial<PlacementPolicyModel>): PlacementPolicyModel {
    const newPolicy: PlacementPolicyModel = {
      id: policy.id || `policy_${generateObjectId()}`,
      name: policy.name || 'Placement Upgrade Policy',
      description: policy.description || 'Rules governing single-offer and dream-tier promotions.',
      conditions: policy.conditions || { min_cgpa_standard: 6.5, max_active_backlogs: 0, mandatory_attendance_pct: 85 },
      offer_categories: policy.offer_categories || { regular_max_lpa: 6.0, dream_min_lpa: 6.0, dream_max_lpa: 12.0, super_dream_min_lpa: 12.0 },
      upgrade_rules: policy.upgrade_rules || { allow_dream_if_regular_held: true, allow_super_dream_always: true, min_ctc_multiplier_for_upgrade: 1.4, max_total_offers_per_student: 2 },
      active: policy.active !== undefined ? policy.active : true,
      created_by: policy.created_by || 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.placementPolicies.push(newPolicy);
    this.save();
    return newPolicy;
  }

  updatePolicy(id: string, updates: Partial<PlacementPolicyModel>): PlacementPolicyModel | undefined {
    const policy = this.getPolicyById(id);
    if (!policy) return undefined;
    Object.assign(policy, updates, { updated_at: new Date().toISOString() });
    this.save();
    return policy;
  }

  deletePolicy(id: string): boolean {
    const idx = this.placementPolicies.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.placementPolicies.splice(idx, 1);
    this.save();
    return true;
  }

  evaluatePolicy(
    studentId: string, 
    newCompany: string, 
    newPackageLPA: number, 
    newOfferCategory?: 'REGULAR' | 'DREAM' | 'SUPER_DREAM'
  ): PolicyDecisionModel {
    const student = this.getStudentProfile(studentId);
    const existingOffers = this.offers.filter(o => o.studentId === studentId && (o.status === 'Accepted' || o.status === 'Selected' || o.status === 'Offer Generated' || o.status === 'Offered'));
    const activePolicy = this.placementPolicies.find(p => p.active) || initialPlacementPolicies[0];

    // Determine current tier and highest package
    let highestHeldLpa = 0;
    let heldCategory: 'REGULAR' | 'DREAM' | 'SUPER_DREAM' = 'REGULAR';

    if (existingOffers.length > 0) {
      existingOffers.forEach(o => {
        const val = parseFloat(o.ctc.replace(/[^\d.]/g, '')) || 7.0;
        if (val > highestHeldLpa) highestHeldLpa = val;
      });
      if (highestHeldLpa >= activePolicy.offer_categories.super_dream_min_lpa) heldCategory = 'SUPER_DREAM';
      else if (highestHeldLpa >= activePolicy.offer_categories.dream_min_lpa) heldCategory = 'DREAM';
    }

    // Determine target category
    let targetCategory = newOfferCategory;
    if (!targetCategory) {
      if (newPackageLPA >= activePolicy.offer_categories.super_dream_min_lpa) targetCategory = 'SUPER_DREAM';
      else if (newPackageLPA >= activePolicy.offer_categories.dream_min_lpa) targetCategory = 'DREAM';
      else targetCategory = 'REGULAR';
    }

    let decision: 'ELIGIBLE' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
    let reason = 'Candidate is eligible to participate and accept this offer under University Placement Council regulations.';
    let applicableRule = 'Standard Merit Placement Rule 1.1';

    // Rule 1: Max Total Offers limit
    if (existingOffers.length >= activePolicy.upgrade_rules.max_total_offers_per_student) {
      decision = 'NOT_ELIGIBLE';
      reason = `Student has reached the maximum allowed limit of ${activePolicy.upgrade_rules.max_total_offers_per_student} accepted placement offers.`;
      applicableRule = 'Anti-Hoarding Cap (Rule 3.4)';
    } 
    // Rule 2: Holding Dream offer and attempting to apply for Regular/Core (<6 LPA)
    else if (highestHeldLpa >= activePolicy.offer_categories.dream_min_lpa && targetCategory === 'REGULAR') {
      decision = 'NOT_ELIGIBLE';
      reason = `Candidate currently holds a ${heldCategory} offer (₹${highestHeldLpa} LPA). Lower Regular-tier roles (<₹${activePolicy.offer_categories.regular_max_lpa} LPA) are locked to protect unplaced peers.`;
      applicableRule = 'Peer Equity Lock (Rule 2.2)';
    }
    // Rule 3: Super Dream always unlocked if package meets multiplier
    else if (targetCategory === 'SUPER_DREAM') {
      const minRequired = highestHeldLpa > 0 ? highestHeldLpa * activePolicy.upgrade_rules.min_ctc_multiplier_for_upgrade : activePolicy.offer_categories.super_dream_min_lpa;
      if (newPackageLPA >= minRequired || activePolicy.upgrade_rules.allow_super_dream_always) {
        decision = 'ELIGIBLE';
        reason = `Eligible for Super Dream Tier opportunity at ${newCompany} (₹${newPackageLPA} LPA). Exceeds upgrade multiplier threshold of ₹${minRequired.toFixed(1)} LPA.`;
        applicableRule = 'Super Dream Merit Upgrade (Rule 4.2)';
      } else {
        decision = 'NOT_ELIGIBLE';
        reason = `Super Dream upgrade requires package of at least ₹${minRequired.toFixed(1)} LPA (1.4x existing offer). Offered: ₹${newPackageLPA} LPA.`;
        applicableRule = 'CTC Multiplier Constraint (Rule 4.3)';
      }
    }
    // Rule 4: Regular to Dream Upgrade
    else if (targetCategory === 'DREAM' && highestHeldLpa <= activePolicy.offer_categories.regular_max_lpa) {
      decision = 'ELIGIBLE';
      reason = `Eligible to upgrade from Regular tier to Dream tier offer at ${newCompany} (₹${newPackageLPA} LPA).`;
      applicableRule = 'Tier Promotion Policy (Rule 3.1)';
    }

    const decisionRecord: PolicyDecisionModel = {
      id: `pdec_${generateObjectId()}`,
      student_id: studentId,
      student_name: student?.fullName || 'Student',
      current_package_lpa: highestHeldLpa,
      new_company: newCompany,
      new_package: newPackageLPA,
      new_offer_category: targetCategory,
      decision,
      reason,
      applicable_rule: applicableRule,
      timestamp: new Date().toISOString()
    };

    this.policyDecisions.unshift(decisionRecord);

    this.createAuditLog({
      user_id: studentId,
      action: 'POLICY_DECISION_RECORDED',
      entity_type: 'PolicyDecision',
      entity_id: decisionRecord.id,
      details: `${student?.fullName} evaluated for ${newCompany} (${targetCategory}): ${decision} under ${applicableRule}`
    });

    this.save();
    return decisionRecord;
  }

  getPolicyAuditLogs(): AuditLogModel[] {
    return this.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  overridePolicyDecision(decisionId: string, overrideReason: string, overriddenBy: string): PolicyDecisionModel | undefined {
    const decision = this.policyDecisions.find(d => d.id === decisionId);
    if (!decision) return undefined;

    decision.decision = 'ELIGIBLE';
    decision.override_status = 'OVERRIDDEN';
    decision.override_reason = overrideReason;
    decision.overridden_by = overriddenBy;

    this.createAuditLog({
      user_id: overriddenBy,
      action: 'POLICY_OVERRIDE_APPROVED',
      entity_type: 'PolicyDecision',
      entity_id: decisionId,
      details: `Policy decision overridden by TPO Officer. Reason: ${overrideReason}`,
      override_status: 'OVERRIDDEN',
      override_reason: overrideReason,
      overridden_by: overriddenBy
    });

    this.save();
    return decision;
  }

  createAuditLog(data: Partial<AuditLogModel>): AuditLogModel {
    const log: AuditLogModel = {
      id: `audit_${generateObjectId()}`,
      user_id: data.user_id || 'system',
      user_name: data.user_name || 'System Operator',
      action: data.action || 'GENERAL_ACTION',
      entity_type: data.entity_type || 'System',
      entity_id: data.entity_id || 'sys',
      details: data.details || '',
      ip_address: data.ip_address || '127.0.0.1',
      timestamp: new Date().toISOString(),
      override_status: data.override_status,
      override_reason: data.override_reason,
      overridden_by: data.overridden_by
    };

    this.auditLogs.unshift(log);
    this.save();
    return log;
  }

  getAuditLogs(): AuditLogModel[] {
    return this.auditLogs;
  }

  // =============================================================
  // RELATIONAL METHODS: OFFERS & DIGITAL SIGNING
  // =============================================================

  getOfferEntities(): OfferModel[] {
    return this.offerEntities;
  }

  getOfferEntityById(id: string): OfferModel | undefined {
    return this.offerEntities.find(o => o.id === id);
  }

  rejectOfferEntity(id: string, reason?: string): OfferModel | undefined {
    const offer = this.getOfferEntityById(id);
    if (!offer) return undefined;

    offer.status = 'REJECTED';
    
    const mirror = this.offers.find(o => o.id === id);
    if (mirror) mirror.status = 'Declined';

    this.createAuditLog({
      user_id: offer.student_id,
      action: 'OFFER_REJECTED',
      entity_type: 'Offer',
      entity_id: offer.id,
      details: `Student declined offer from ${offer.company_name}. Reason: ${reason || 'Candidate choice'}`
    });

    this.save();
    return offer;
  }

  createOfferEntity(offer: Partial<OfferModel>): OfferModel {
    const newOffer: OfferModel = {
      id: offer.id || `off_${generateObjectId()}`,
      student_id: offer.student_id || '',
      student_name: offer.student_name,
      company_id: offer.company_id || `comp_${generateObjectId()}`,
      company_name: offer.company_name || 'Corporate Partner',
      package: offer.package || '₹18.0 LPA',
      package_lpa: offer.package_lpa || 18.0,
      category: offer.category || 'DREAM',
      status: offer.status || 'ISSUED',
      issued_at: new Date().toISOString(),
      joining_date: offer.joining_date || '2026-07-15',
      location: offer.location || 'Bangalore / Hybrid'
    };

    this.offerEntities.unshift(newOffer);

    // Also mirror to initial offer records
    this.offers.unshift({
      id: newOffer.id,
      applicationId: `app_${newOffer.id}`,
      studentId: newOffer.student_id,
      studentName: newOffer.student_name || 'Candidate',
      studentEmail: '',
      studentBranch: 'CSE',
      companyName: newOffer.company_name,
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=120',
      jobTitle: 'Software Engineer',
      ctc: newOffer.package,
      baseFixed: '75% Base',
      bonus: '15% Bonus',
      rsu: '10% RSU',
      offerDate: new Date().toISOString().split('T')[0],
      joiningDate: newOffer.joining_date || '2026-07-15',
      validTill: '2026-10-30',
      status: 'Offered',
      offerLetterUrl: '#view-offer-letter',
      terms: 'Subject to maintaining 7.5+ CGPA and zero backlogs.'
    });

    this.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: newOffer.student_id,
      title: `🎉 Official Campus Offer: ${newOffer.company_name}`,
      message: `${newOffer.company_name} has extended an offer of ${newOffer.package}. Inspect your offer in Placement Escrow.`,
      type: 'offer_extended',
      read: false,
      createdAt: new Date().toISOString()
    });

    this.save();
    return newOffer;
  }

  acceptOfferEntity(id: string, signature?: string): OfferModel | undefined {
    const offer = this.getOfferEntityById(id);
    if (!offer) return undefined;

    offer.status = 'ACCEPTED';
    offer.accepted_at = new Date().toISOString();
    offer.signature = signature;

    // Update in derived offers collection as well
    const mirror = this.offers.find(o => o.id === id);
    if (mirror) mirror.status = 'Accepted';

    // Update student placement status
    const student = this.getStudentProfile(offer.student_id);
    if (student) {
      student.placementStatus = 'Placed';
      student.placedCompany = offer.company_name;
      student.placedPackage = offer.package;
    }

    this.createAuditLog({
      user_id: offer.student_id,
      action: 'OFFER_ACCEPTED',
      entity_type: 'Offer',
      entity_id: offer.id,
      details: `Student accepted offer from ${offer.company_name} (${offer.package}). Digital signature authenticated.`
    });

    this.save();
    return offer;
  }

  // =============================================================
  // RELATIONAL METHODS: ATTENDANCE
  // =============================================================

  getAttendanceRecords(driveId?: string): AttendanceModel[] {
    if (!driveId) return this.attendances;
    return this.attendances.filter(a => a.drive_id === driveId);
  }

  recordAttendance(data: Partial<AttendanceModel>): AttendanceModel {
    const record: AttendanceModel = {
      id: data.id || `att_${generateObjectId()}`,
      drive_id: data.drive_id || '',
      student_id: data.student_id || '',
      check_in_time: data.check_in_time || new Date().toISOString(),
      verified_by: data.verified_by || 'gate_scanner',
      method: data.method || 'QR_SCAN',
      created_at: new Date().toISOString()
    };

    this.attendances.push(record);
    this.save();
    return record;
  }

  // =============================================================
  // AI SKILL VERIFICATION & ASSESSMENT METHODS
  // =============================================================

  getResumeAnalysis(studentId: string): ResumeExtractedData | undefined {
    return this.resumeAnalyses[studentId];
  }

  saveResumeAnalysis(studentId: string, analysis: ResumeExtractedData): ResumeExtractedData {
    this.resumeAnalyses[studentId] = analysis;
    this.save();
    return analysis;
  }

  getStudentResumeSkills(studentId: string): ResumeSkillModel[] {
    return this.resumeSkills.filter(s => s.student_id === studentId);
  }

  setStudentResumeSkills(studentId: string, skills: Array<{ name: string; category?: string }>): ResumeSkillModel[] {
    const existingScores = this.getStudentSkillScores(studentId);

    const newExtracted: ResumeSkillModel[] = skills.map(sk => {
      const matchScore = existingScores.find(sc => sc.skill_name.toLowerCase() === sk.name.toLowerCase());
      return {
        id: `rsk_${generateObjectId()}`,
        student_id: studentId,
        skill_name: sk.name,
        category: (sk.category as any) || 'technology',
        source: 'resume_extracted',
        claimed_at: new Date().toISOString(),
        is_verified: matchScore ? matchScore.verified_score >= 80 : false,
        verified_score: matchScore ? matchScore.verified_score : undefined
      };
    });

    // Remove old extracted skills for this student and insert new
    this.resumeSkills = this.resumeSkills.filter(s => s.student_id !== studentId || s.source === 'manual_added');
    this.resumeSkills.push(...newExtracted);
    this.save();
    return this.getStudentResumeSkills(studentId);
  }

  addStudentManualSkill(studentId: string, skillName: string, category = 'technology'): ResumeSkillModel {
    const existing = this.resumeSkills.find(s => s.student_id === studentId && s.skill_name.toLowerCase() === skillName.toLowerCase());
    if (existing) return existing;

    const skill: ResumeSkillModel = {
      id: `rsk_${generateObjectId()}`,
      student_id: studentId,
      skill_name: skillName,
      category: category as any,
      source: 'manual_added',
      claimed_at: new Date().toISOString(),
      is_verified: false
    };

    this.resumeSkills.push(skill);
    this.save();
    return skill;
  }

  getStudentSkillScores(studentId: string): SkillScoreModel[] {
    return this.skillScores.filter(s => s.student_id === studentId);
  }

  updateStudentSkillScores(
    studentId: string, 
    breakdown: Record<string, { total: number; correct: number; percentage: number }>, 
    level: number
  ): SkillScoreModel[] {
    const now = new Date().toISOString();

    Object.entries(breakdown).forEach(([skillName, stat]) => {
      const existingIdx = this.skillScores.findIndex(
        s => s.student_id === studentId && s.skill_name.toLowerCase() === skillName.toLowerCase()
      );

      if (existingIdx >= 0) {
        const current = this.skillScores[existingIdx];
        const newScore = Math.max(current.verified_score, stat.percentage);
        this.skillScores[existingIdx] = {
          ...current,
          verified_score: newScore,
          status: newScore > 0 ? 'ASSESSMENT_VERIFIED' : 'CLAIMED_ONLY',
          level_cleared: Math.max(current.level_cleared, stat.percentage >= 80 ? level : current.level_cleared),
          last_assessed_at: now
        };
      } else {
        this.skillScores.push({
          id: `ssc_${generateObjectId()}`,
          student_id: studentId,
          skill_name: skillName,
          claimed: true,
          verified_score: stat.percentage,
          category: 'skill',
          status: stat.percentage > 0 ? 'ASSESSMENT_VERIFIED' : 'CLAIMED_ONLY',
          level_cleared: stat.percentage >= 80 ? level : 0,
          last_assessed_at: now
        });
      }

      const rSkill = this.resumeSkills.find(
        rs => rs.student_id === studentId && rs.skill_name.toLowerCase() === skillName.toLowerCase()
      );
      if (rSkill) {
        rSkill.is_verified = stat.percentage >= 80;
        rSkill.verified_score = stat.percentage;
      }
    });

    this.save();
    return this.getStudentSkillScores(studentId);
  }

  getAssessmentSettings(): AssessmentSettingsModel {
    return this.assessmentSettings;
  }

  updateAssessmentSettings(updates: Partial<AssessmentSettingsModel>): AssessmentSettingsModel {
    this.assessmentSettings = {
      ...this.assessmentSettings,
      ...updates
    };
    this.save();
    return this.assessmentSettings;
  }

  createAssessmentSession(session: AssessmentSession): AssessmentSession {
    this.assessmentSessions.unshift(session);
    this.save();
    return session;
  }

  getAssessmentSession(id: string): AssessmentSession | undefined {
    return this.assessmentSessions.find(s => s.id === id);
  }

  updateAssessmentSession(id: string, updates: Partial<AssessmentSession>): AssessmentSession | undefined {
    const session = this.getAssessmentSession(id);
    if (!session) return undefined;
    Object.assign(session, updates);
    this.save();
    return session;
  }

  saveAssessmentResult(result: AssessmentResultModel): AssessmentResultModel {
    this.assessmentResults.unshift(result);

    this.createAuditLog({
      user_id: result.student_id,
      user_name: result.student_name,
      action: `ASSESSMENT_LEVEL_${result.level}_${result.status}`,
      entity_type: 'AssessmentResult',
      entity_id: result.id,
      details: `Candidate completed Level ${result.level} assessment with ${result.score_percentage}% (${result.correct_answers}/${result.total_questions} correct). Status: ${result.status}.`
    });

    this.save();
    return result;
  }

  getAssessmentResults(studentId?: string): AssessmentResultModel[] {
    if (!studentId) return this.assessmentResults;
    return this.assessmentResults.filter(r => r.student_id === studentId);
  }

  getAssessmentResultById(id: string): AssessmentResultModel | undefined {
    return this.assessmentResults.find(r => r.id === id || r.assessment_id === id);
  }

  getCertificates(studentId?: string): CertificateModel[] {
    if (!studentId) return this.certificates;
    return this.certificates.filter(c => c.student_id === studentId);
  }

  getCertificateById(id: string): CertificateModel | undefined {
    return this.certificates.find(c => c.id === id);
  }

  createCertificate(cert: Partial<CertificateModel>): CertificateModel {
    const newCert: CertificateModel = {
      id: cert.id || `cert_${generateObjectId()}`,
      student_id: cert.student_id || '',
      student_name: cert.student_name || 'Student Candidate',
      certificate_name: cert.certificate_name || 'Technical Course Certificate',
      skill_or_course_name: cert.skill_or_course_name || 'Computer Science',
      issuing_organization: cert.issuing_organization || 'Authorized Institute',
      issue_date: cert.issue_date || new Date().toISOString().split('T')[0],
      certificate_id: cert.certificate_id,
      file_url: cert.file_url || '#preview',
      file_name: cert.file_name || 'Certificate.pdf',
      file_type: cert.file_type || 'pdf',
      verification_status: cert.verification_status || 'PENDING',
      verification_type: cert.verification_type || 'STUDENT_UPLOADED',
      verified_by: cert.verified_by,
      verified_at: cert.verified_at,
      created_at: new Date().toISOString()
    };

    this.certificates.unshift(newCert);

    this.createAuditLog({
      user_id: newCert.student_id,
      user_name: newCert.student_name,
      action: 'CERTIFICATE_UPLOADED',
      entity_type: 'Certificate',
      entity_id: newCert.id,
      details: `Student uploaded certificate: ${newCert.certificate_name} (${newCert.skill_or_course_name}) issued by ${newCert.issuing_organization}.`
    });

    this.save();
    return newCert;
  }

  verifyCertificate(
    id: string, 
    status: 'VERIFIED' | 'REJECTED', 
    verifiedBy: string, 
    rejectionReason?: string
  ): CertificateModel | undefined {
    const cert = this.getCertificateById(id);
    if (!cert) return undefined;

    cert.verification_status = status;
    cert.verified_by = verifiedBy;
    cert.verified_at = new Date().toISOString();
    if (rejectionReason) cert.rejection_reason = rejectionReason;

    this.createAuditLog({
      user_id: verifiedBy,
      action: `CERTIFICATE_${status}`,
      entity_type: 'Certificate',
      entity_id: cert.id,
      details: `Certificate "${cert.certificate_name}" marked ${status} by ${verifiedBy}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
    });

    this.save();
    return cert;
  }

  getCandidateVerifiedProfile(studentId: string): CandidateVerifiedSkillProfile | null {
    const student = this.getStudentProfile(studentId);
    if (!student) return null;

    const resumeSkills = this.getStudentResumeSkills(studentId);
    const verifiedSkills = this.getStudentSkillScores(studentId);
    const certificates = this.getCertificates(studentId);
    const results = this.getAssessmentResults(studentId);

    const level1Passed = results.some(r => r.level === 1 && r.status === 'PASSED');
    const level2Passed = results.some(r => r.level === 2 && r.status === 'PASSED');
    const level3Passed = results.some(r => r.level === 3 && r.status === 'PASSED');

    const highestLevel = level3Passed ? 3 : level2Passed ? 2 : level1Passed ? 1 : 0;

    const assessedScores = verifiedSkills.filter(v => v.verified_score > 0);
    const overallScore = assessedScores.length > 0 
      ? Math.round(assessedScores.reduce((acc, s) => acc + s.verified_score, 0) / assessedScores.length)
      : (results[0]?.score_percentage || 0);

    const totalQuestions = results.reduce((acc, r) => acc + r.total_questions, 0);
    const totalCorrect = results.reduce((acc, r) => acc + r.correct_answers, 0);
    const avgResponseTime = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.average_response_time_seconds, 0) / results.length)
      : 42;

    const manualSkills = resumeSkills.filter(s => s.source === 'manual_added').map(s => s.skill_name);

    return {
      student,
      resume_skills: resumeSkills,
      verified_skills: verifiedSkills,
      additional_skills: manualSkills,
      certifications: certificates,
      highest_level_cleared: highestLevel,
      level_progress: {
        level1_cleared: level1Passed,
        level2_cleared: level2Passed,
        level3_cleared: level3Passed
      },
      overall_verified_score: overallScore,
      latest_assessment_result: results[0],
      total_questions_attempted: totalQuestions,
      total_correct_answers: totalCorrect,
      average_response_time_sec: avgResponseTime
    };
  }

  getCandidatesVerifiedProfiles(filters?: {
    skill?: string;
    minScore?: number;
    level?: number;
    branch?: string;
    minCgpa?: number;
    search?: string;
  }): CandidateVerifiedSkillProfile[] {
    const students = this.getAllStudentProfiles();
    const profiles: CandidateVerifiedSkillProfile[] = [];

    students.forEach(st => {
      const prof = this.getCandidateVerifiedProfile(st.userId);
      if (!prof) return;

      if (filters) {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matches = prof.student.fullName.toLowerCase().includes(q) ||
            prof.student.email.toLowerCase().includes(q) ||
            prof.resume_skills.some(s => s.skill_name.toLowerCase().includes(q));
          if (!matches) return;
        }

        if (filters.skill) {
          const reqSkill = filters.skill.toLowerCase();
          const target = prof.verified_skills.find(v => v.skill_name.toLowerCase().includes(reqSkill));
          if (!target) return;
          if (filters.minScore && target.verified_score < filters.minScore) return;
        }

        if (filters.level && prof.highest_level_cleared < filters.level) return;
        if (filters.branch && filters.branch !== 'All' && !prof.student.branch.toLowerCase().includes(filters.branch.toLowerCase())) return;
        if (filters.minCgpa && prof.student.cgpa < filters.minCgpa) return;
      }

      profiles.push(prof);
    });

    return profiles;
  }

  // =============================================================
  // SMART ROOM ALLOCATION & NOTIFICATION METHODS
  // =============================================================

  getCollegeRooms(): CollegeRoom[] {
    return this.rooms;
  }

  createCollegeRoom(room: CollegeRoom): CollegeRoom {
    const newRoom = { ...room, id: room.id || `room_${generateObjectId()}` };
    this.rooms.push(newRoom);
    this.save();
    return newRoom;
  }

  updateCollegeRoom(id: string, updates: Partial<CollegeRoom>): CollegeRoom | undefined {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.rooms[idx] = { ...this.rooms[idx], ...updates };
    this.save();
    return this.rooms[idx];
  }

  getAcademicSchedules(date?: string): AcademicSchedule[] {
    if (date) {
      return this.academicSchedules.filter(s => s.date === date);
    }
    return this.academicSchedules;
  }

  createAcademicSchedule(sched: AcademicSchedule): AcademicSchedule {
    const newSched: AcademicSchedule = {
      ...sched,
      id: sched.id || `acad_${generateObjectId()}`,
      status: sched.status || 'SCHEDULED'
    };
    this.academicSchedules.push(newSched);
    this.save();
    return newSched;
  }

  updateAcademicSchedule(id: string, updates: Partial<AcademicSchedule>): AcademicSchedule | undefined {
    const idx = this.academicSchedules.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.academicSchedules[idx] = { ...this.academicSchedules[idx], ...updates };
    this.save();
    return this.academicSchedules[idx];
  }

  getPlacementAllocations(): PlacementDriveAllocation[] {
    return this.placementAllocations;
  }

  getPlacementAllocationById(id: string): PlacementDriveAllocation | undefined {
    return this.placementAllocations.find(a => a.id === id);
  }

  getAdministrationAlerts(): AdministrationAlert[] {
    return this.adminAlerts;
  }

  suggestRoomsForAllocation(
    date: string,
    startTime: string,
    endTime: string,
    requiredCapacity: number,
    currentAllocationId?: string
  ) {
    return suggestSuitableRooms(
      date,
      startTime,
      endTime,
      requiredCapacity,
      this.rooms,
      this.academicSchedules,
      this.placementAllocations,
      currentAllocationId
    );
  }

  createPlacementAllocation(data: Partial<PlacementDriveAllocation>): {
    allocation: PlacementDriveAllocation;
    alert?: AdministrationAlert;
  } {
    const allocationId = data.id || `alloc_${generateObjectId()}`;
    const date = data.date || new Date().toISOString().split('T')[0];
    const startTime = data.startTime || '10:00';
    const endTime = data.endTime || '13:00';
    const requiredCapacity = data.requiredCapacity || data.registeredStudentsCount || 80;

    // Check if target room is requested or find best room
    let targetRoomId = data.allocatedRoomId;
    let targetRoom = targetRoomId ? this.rooms.find(r => r.id === targetRoomId) : undefined;

    if (!targetRoomId) {
      // Suggest best room
      const suggestions = this.suggestRoomsForAllocation(date, startTime, endTime, requiredCapacity);
      if (suggestions.length > 0) {
        targetRoom = suggestions[0].room;
        targetRoomId = targetRoom.id;
      }
    }

    // Detect conflicts in target room
    let conflictStatus: 'NO_CONFLICT' | 'CONFLICT_DETECTED' | 'CONFLICT_RESOLVED' = 'NO_CONFLICT';
    let conflictDetails: any = undefined;
    let generatedAlert: AdministrationAlert | undefined = undefined;

    if (targetRoomId) {
      const conflict = detectRoomConflicts(
        targetRoomId,
        date,
        startTime,
        endTime,
        allocationId,
        this.rooms,
        this.academicSchedules,
        this.placementAllocations
      );

      if (conflict.hasConflict) {
        conflictStatus = 'CONFLICT_DETECTED';
        conflictDetails = {
          conflictType: conflict.conflictType || 'CLASS_SCHEDULE',
          conflictingEntityId: conflict.conflictingEntityId || '',
          conflictingEntityTitle: conflict.conflictingEntityTitle || '',
          instructor: conflict.instructor,
          roomName: conflict.roomName || targetRoom?.name || 'Room',
          timeSlot: conflict.timeSlot || `${startTime} - ${endTime}`,
          detectedAt: new Date().toISOString()
        };

        // Create Administration Alert per user requirement:
        // "Room Conflict Detected: Seminar Hall 1 is allocated for TCS placement at 10:00 AM, but a class is scheduled in the same room. Please change the classroom or reschedule the placement activity."
        const alertMsg = conflict.message || `Room Conflict Detected: ${targetRoom?.name || 'Room'} is allocated for ${data.companyName || 'placement'} placement at ${startTime}, but a class is scheduled in the same room. Please change the classroom or reschedule the placement activity.`;

        generatedAlert = {
          id: `alert_${generateObjectId()}`,
          allocationId,
          companyName: data.companyName || 'Company Placement',
          roomId: targetRoomId,
          roomName: targetRoom?.name || 'Hall',
          date,
          timeSlot: `${startTime} - ${endTime}`,
          conflictType: conflict.conflictType || 'CLASS_SCHEDULE',
          conflictingScheduleId: conflict.conflictingEntityId || '',
          conflictingScheduleTitle: conflict.conflictingEntityTitle || '',
          conflictingInstructor: conflict.instructor,
          alertMessage: alertMsg,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        };

        this.adminAlerts.unshift(generatedAlert);

        // Notify TPO / Admins
        this.createNotification({
          id: `notif_${generateObjectId()}`,
          userId: 'all',
          title: `⚠️ Administration Alert: Room Conflict (${targetRoom?.name})`,
          message: alertMsg,
          type: 'Conflict Alert',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    const newAllocation: PlacementDriveAllocation = {
      id: allocationId,
      companyId: data.companyId,
      companyName: data.companyName || 'Company',
      jobId: data.jobId,
      jobTitle: data.jobTitle || 'Graduate Trainee Engineer',
      driveRound: data.driveRound || 'Online Technical Assessment',
      date,
      startTime,
      endTime,
      reportingTime: data.reportingTime || `${startTime} (Report 30 mins prior)`,
      registeredStudentsCount: data.registeredStudentsCount || 60,
      requiredCapacity,
      allocatedRoomId: targetRoomId,
      allocatedRoomName: targetRoom?.name,
      allocatedRoomCapacity: targetRoom?.capacity,
      allocatedRoomBlock: targetRoom ? `${targetRoom.block} (${targetRoom.floor})` : undefined,
      registeredStudentIds: data.registeredStudentIds && data.registeredStudentIds.length > 0 
        ? data.registeredStudentIds 
        : ['user_student_1', 'user_student_2', 'user_student_3'],
      conflictStatus,
      conflictDetails,
      allocationStatus: conflictStatus === 'CONFLICT_DETECTED' ? 'CONFLICT' : (targetRoomId ? 'ALLOCATED' : 'PENDING'),
      notificationStatus: 'NOT_SENT',
      notificationsSentCount: 0,
      importantInstructions: data.importantInstructions || 'Carry College ID Card, 2 copies of verified resume, and standard examination stationery.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.placementAllocations.unshift(newAllocation);
    this.save();

    return { allocation: newAllocation, alert: generatedAlert };
  }

  updatePlacementAllocation(id: string, updates: Partial<PlacementDriveAllocation>): PlacementDriveAllocation | undefined {
    const idx = this.placementAllocations.findIndex(a => a.id === id);
    if (idx === -1) return undefined;

    const existing = this.placementAllocations[idx];
    const updated = { 
      ...existing, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };

    // Re-check conflict if room or time changed
    if (updates.allocatedRoomId || updates.date || updates.startTime || updates.endTime) {
      if (updated.allocatedRoomId) {
        const conflict = detectRoomConflicts(
          updated.allocatedRoomId,
          updated.date,
          updated.startTime,
          updated.endTime,
          updated.id,
          this.rooms,
          this.academicSchedules,
          this.placementAllocations
        );

        if (conflict.hasConflict) {
          updated.conflictStatus = 'CONFLICT_DETECTED';
          updated.conflictDetails = {
            conflictType: conflict.conflictType || 'CLASS_SCHEDULE',
            conflictingEntityId: conflict.conflictingEntityId || '',
            conflictingEntityTitle: conflict.conflictingEntityTitle || '',
            instructor: conflict.instructor,
            roomName: conflict.roomName || 'Room',
            timeSlot: conflict.timeSlot || `${updated.startTime} - ${updated.endTime}`,
            detectedAt: new Date().toISOString()
          };
          updated.allocationStatus = 'CONFLICT';
        } else {
          updated.conflictStatus = 'NO_CONFLICT';
          updated.conflictDetails = undefined;
          if (updated.allocationStatus === 'CONFLICT') {
            updated.allocationStatus = 'ALLOCATED';
          }
        }
      }
    }

    this.placementAllocations[idx] = updated;
    this.save();
    return updated;
  }

  deletePlacementAllocation(id: string): boolean {
    const idx = this.placementAllocations.findIndex(a => a.id === id);
    if (idx === -1) return false;
    this.placementAllocations.splice(idx, 1);
    this.save();
    return true;
  }

  autoAllocateAllPendingDrives(): {
    allocatedCount: number;
    conflictsCount: number;
    allocations: PlacementDriveAllocation[];
  } {
    const pendingDrives = this.placementAllocations.filter(
      a => !a.allocatedRoomId || a.allocationStatus === 'PENDING'
    );

    // Sort by largest required capacity first to avoid room starvation
    pendingDrives.sort((a, b) => b.requiredCapacity - a.requiredCapacity);

    let allocatedCount = 0;
    let conflictsCount = 0;

    for (const drive of pendingDrives) {
      const suggestions = this.suggestRoomsForAllocation(
        drive.date,
        drive.startTime,
        drive.endTime,
        drive.requiredCapacity,
        drive.id
      );

      if (suggestions.length > 0) {
        const best = suggestions[0];
        drive.allocatedRoomId = best.room.id;
        drive.allocatedRoomName = best.room.name;
        drive.allocatedRoomCapacity = best.room.capacity;
        drive.allocatedRoomBlock = `${best.room.block} (${best.room.floor})`;
        drive.updatedAt = new Date().toISOString();

        if (best.hasConflict) {
          drive.conflictStatus = 'CONFLICT_DETECTED';
          drive.allocationStatus = 'CONFLICT';
          drive.conflictDetails = {
            conflictType: best.conflictDetails?.conflictType || 'CLASS_SCHEDULE',
            conflictingEntityId: best.conflictDetails?.conflictingEntityId || '',
            conflictingEntityTitle: best.conflictDetails?.conflictingEntityTitle || '',
            instructor: best.conflictDetails?.instructor,
            roomName: best.room.name,
            timeSlot: best.conflictDetails?.timeSlot || `${drive.startTime} - ${drive.endTime}`,
            detectedAt: new Date().toISOString()
          };

          // Generate Administration Alert
          const alertMsg = best.conflictDetails?.message || `Room Conflict Detected: ${best.room.name} is allocated for ${drive.companyName} placement at ${drive.startTime}, but a class is scheduled in the same room. Please change the classroom or reschedule the placement activity.`;

          this.adminAlerts.unshift({
            id: `alert_${generateObjectId()}`,
            allocationId: drive.id,
            companyName: drive.companyName,
            roomId: best.room.id,
            roomName: best.room.name,
            date: drive.date,
            timeSlot: `${drive.startTime} - ${drive.endTime}`,
            conflictType: best.conflictDetails?.conflictType || 'CLASS_SCHEDULE',
            conflictingScheduleId: best.conflictDetails?.conflictingEntityId || '',
            conflictingScheduleTitle: best.conflictDetails?.conflictingEntityTitle || '',
            conflictingInstructor: best.conflictDetails?.instructor,
            alertMessage: alertMsg,
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          });

          conflictsCount++;
        } else {
          drive.conflictStatus = 'NO_CONFLICT';
          drive.allocationStatus = 'ALLOCATED';
          allocatedCount++;
        }
      }
    }

    this.save();
    return {
      allocatedCount,
      conflictsCount,
      allocations: this.placementAllocations
    };
  }

  resolveAdministrationConflict(
    alertId: string,
    action: ConflictResolutionAction,
    payload: {
      alternateRoomId?: string;
      newTimeSlot?: { startTime: string; endTime: string };
      note?: string;
      resolvedBy?: string;
    }
  ): {
    success: boolean;
    alert: AdministrationAlert;
    allocation?: PlacementDriveAllocation;
    updatedSchedule?: AcademicSchedule;
    message: string;
  } {
    const alert = this.adminAlerts.find(a => a.id === alertId);
    if (!alert) {
      throw new Error(`Administration Alert ${alertId} not found`);
    }

    const allocation = this.placementAllocations.find(a => a.id === alert.allocationId);
    const schedule = this.academicSchedules.find(s => s.id === alert.conflictingScheduleId);

    let resolutionMsg = '';

    if (action === 'CHANGE_CLASSROOM') {
      // 1. Change the classroom: Move the conflicting class to an alternate available room
      if (!payload.alternateRoomId) {
        throw new Error('Alternate room ID is required to move the classroom');
      }

      const newClassRoom = this.rooms.find(r => r.id === payload.alternateRoomId);
      if (!newClassRoom) throw new Error('Target alternate classroom not found');

      if (schedule) {
        schedule.originalRoomId = schedule.roomId;
        schedule.originalRoomName = schedule.roomName;
        schedule.roomId = newClassRoom.id;
        schedule.roomName = newClassRoom.name;
        schedule.status = 'MOVED';
        schedule.resolutionNote = `Relocated from ${alert.roomName} to ${newClassRoom.name} to accommodate ${alert.companyName} placement drive.`;
      }

      if (allocation) {
        allocation.conflictStatus = 'CONFLICT_RESOLVED';
        allocation.allocationStatus = 'ALLOCATED';
        allocation.conflictDetails = undefined;
      }

      resolutionMsg = `Classroom successfully changed: '${schedule?.title || 'Academic Class'}' moved to ${newClassRoom.name}. Placement drive for ${alert.companyName} confirmed in ${alert.roomName}.`;
    } 
    else if (action === 'CHANGE_PLACEMENT_ROOM') {
      // 2. Change the placement room: Move the placement drive to an alternate room
      if (!payload.alternateRoomId) {
        throw new Error('Alternate room ID is required to relocate placement drive');
      }

      const newPlacementRoom = this.rooms.find(r => r.id === payload.alternateRoomId);
      if (!newPlacementRoom) throw new Error('Target alternate placement room not found');

      if (allocation) {
        allocation.allocatedRoomId = newPlacementRoom.id;
        allocation.allocatedRoomName = newPlacementRoom.name;
        allocation.allocatedRoomCapacity = newPlacementRoom.capacity;
        allocation.allocatedRoomBlock = `${newPlacementRoom.block} (${newPlacementRoom.floor})`;
        allocation.conflictStatus = 'CONFLICT_RESOLVED';
        allocation.allocationStatus = 'ALLOCATED';
        allocation.conflictDetails = undefined;

        // If notifications were already sent to students, send immediate venue update
        if (allocation.notificationStatus === 'SENT' || allocation.notificationStatus === 'UPDATED') {
          this.dispatchUpdatedRoomNotification(
            allocation,
            `Placement venue relocated from ${alert.roomName} to ${newPlacementRoom.name} (${newPlacementRoom.block}).`
          );
        }
      }

      resolutionMsg = `Placement venue changed: ${alert.companyName} drive moved to ${newPlacementRoom.name}. Academic schedule in ${alert.roomName} left intact.`;
    } 
    else if (action === 'RESCHEDULE_CLASS') {
      // 3. Reschedule the class to a non-conflicting time slot
      if (!payload.newTimeSlot) {
        throw new Error('New time slot (startTime, endTime) required to reschedule class');
      }

      if (schedule) {
        const oldSlot = `${schedule.startTime} - ${schedule.endTime}`;
        schedule.startTime = payload.newTimeSlot.startTime;
        schedule.endTime = payload.newTimeSlot.endTime;
        schedule.status = 'RESCHEDULED';
        schedule.resolutionNote = `Rescheduled from ${oldSlot} to ${schedule.startTime} - ${schedule.endTime} to accommodate ${alert.companyName} placement drive.`;
      }

      if (allocation) {
        allocation.conflictStatus = 'CONFLICT_RESOLVED';
        allocation.allocationStatus = 'ALLOCATED';
        allocation.conflictDetails = undefined;
      }

      resolutionMsg = `Class rescheduled: '${schedule?.title || 'Class'}' moved to ${payload.newTimeSlot.startTime} - ${payload.newTimeSlot.endTime}. Placement drive confirmed in ${alert.roomName}.`;
    }

    // Mark Alert as Resolved
    alert.status = 'RESOLVED';
    alert.resolutionAction = action;
    alert.resolutionDetails = resolutionMsg;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = payload.resolvedBy || 'TPO Placement Officer';

    this.save();

    return {
      success: true,
      alert,
      allocation,
      updatedSchedule: schedule,
      message: resolutionMsg
    };
  }

  confirmAllocationAndNotifyStudents(
    allocationId: string,
    customInstructions?: string
  ): {
    success: boolean;
    notifiedCount: number;
    allocation: PlacementDriveAllocation;
  } {
    const allocation = this.placementAllocations.find(a => a.id === allocationId);
    if (!allocation) throw new Error('Placement allocation not found');

    if (!allocation.allocatedRoomId || !allocation.allocatedRoomName) {
      throw new Error('Cannot confirm allocation without an allocated room');
    }

    allocation.allocationStatus = 'CONFIRMED';
    if (customInstructions) {
      allocation.importantInstructions = customInstructions;
    }

    // Determine targeted recipient students: ONLY students registered for this company!
    // We check registeredStudentIds, or find students who applied to this company's jobs in applications table
    let targetStudentIds = allocation.registeredStudentIds || [];
    if (targetStudentIds.length === 0 && allocation.companyName) {
      const companyApps = this.applications.filter(
        app => app.companyName.toLowerCase().includes(allocation.companyName.toLowerCase())
      );
      targetStudentIds = Array.from(new Set(companyApps.map(a => a.studentId)));
    }

    // Fallback: if no studentIds registered yet, notify all eligible students
    if (targetStudentIds.length === 0) {
      targetStudentIds = this.studentProfiles.map(s => s.userId);
    }

    const roomInfo = `${allocation.allocatedRoomName}${allocation.allocatedRoomBlock ? ` (${allocation.allocatedRoomBlock})` : ''}`;

    // Dispatch Room Allotment Notification only to registered students
    targetStudentIds.forEach(studentId => {
      this.createNotification({
        id: `notif_${generateObjectId()}`,
        userId: studentId,
        title: `📍 Room Allotment: ${allocation.companyName} (${allocation.allocatedRoomName})`,
        message: `Company: ${allocation.companyName} | Round: ${allocation.driveRound} | Date: ${allocation.date} | Time: ${allocation.startTime} - ${allocation.endTime} | Venue: ${roomInfo} | Reporting Time: ${allocation.reportingTime} | Instructions: ${allocation.importantInstructions}`,
        type: 'Room Allotment',
        read: false,
        createdAt: new Date().toISOString(),
        jobId: allocation.jobId,
        linkTab: 'roomallocation'
      });
    });

    allocation.notificationStatus = 'SENT';
    allocation.notificationsSentCount = targetStudentIds.length;
    allocation.lastNotifiedAt = new Date().toISOString();
    allocation.updatedAt = new Date().toISOString();

    this.save();

    return {
      success: true,
      notifiedCount: targetStudentIds.length,
      allocation
    };
  }

  private dispatchUpdatedRoomNotification(
    allocation: PlacementDriveAllocation,
    reason: string
  ) {
    const targetStudentIds = allocation.registeredStudentIds || [];
    const roomInfo = `${allocation.allocatedRoomName}${allocation.allocatedRoomBlock ? ` (${allocation.allocatedRoomBlock})` : ''}`;

    targetStudentIds.forEach(studentId => {
      this.createNotification({
        id: `notif_${generateObjectId()}`,
        userId: studentId,
        title: `⚠️ Placement Venue Update: ${allocation.companyName} (${allocation.allocatedRoomName})`,
        message: `Attention: The venue for ${allocation.companyName} placement drive on ${allocation.date} at ${allocation.startTime} has been updated to ${roomInfo}. Reporting Time: ${allocation.reportingTime}. Reason: ${reason} Instructions: ${allocation.importantInstructions}`,
        type: 'Room Allotment',
        read: false,
        createdAt: new Date().toISOString(),
        jobId: allocation.jobId,
        linkTab: 'roomallocation'
      });
    });

    allocation.notificationStatus = 'UPDATED';
    allocation.updatedAt = new Date().toISOString();
  }

  getRoomAllocationStats(): RoomAllocationStats {
    const totalRooms = this.rooms.length;
    const totalCapacity = this.rooms.reduce((acc, r) => acc + (r.isActive ? r.capacity : 0), 0);
    const activeAllocations = this.placementAllocations.filter(a => a.allocationStatus !== 'CANCELLED').length;
    const confirmedAllocations = this.placementAllocations.filter(a => a.allocationStatus === 'CONFIRMED').length;
    const conflictCount = this.adminAlerts.filter(a => a.status === 'ACTIVE').length;
    const notificationsSentTotal = this.placementAllocations.reduce((acc, a) => acc + (a.notificationsSentCount || 0), 0);
    
    // Students accommodated today
    const todayStr = '2026-09-30';
    const studentsAccommodatedToday = this.placementAllocations
      .filter(a => a.date === todayStr && a.allocatedRoomId)
      .reduce((acc, a) => acc + (a.registeredStudentsCount || 0), 0);

    return {
      totalRooms,
      totalCapacity,
      activeAllocations,
      confirmedAllocations,
      conflictCount,
      notificationsSentTotal,
      studentsAccommodatedToday
    };
  }
}

export const db = new CampusDatabase();

