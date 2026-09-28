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
  ReadinessBreakdown
} from '../src/types/index.ts';

export const dbEvents = new EventEmitter();

export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
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
}

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
    name: 'Aarav Reddy',
    email: 'aarav.reddy@campus.edu',
    role: 'student',
    avatar: 'AR',
    title: 'B.Tech CSE · 2026',
    department: 'Computer Science & Engineering',
    createdAt: '2026-08-01T09:00:00Z',
  },
  // 1. Student Secondary (Bishnu)
  {
    id: 'user_student_bishnu',
    name: 'Bishnu Sahoo',
    email: 'sahoobishnu8249@gmail.com',
    role: 'student',
    avatar: 'BS',
    title: 'Final Year B.Tech CSE',
    department: 'Computer Science & Engineering',
    createdAt: '2026-08-01T10:00:00Z',
  },
  // 2. Student (Priya)
  {
    id: 'user_student_priya',
    name: 'Priya Sharma',
    email: 'priya.sharma@campus.edu',
    role: 'student',
    avatar: 'PS',
    title: 'Final Year B.Tech AI & DS',
    department: 'Artificial Intelligence & Data Science',
    createdAt: '2026-08-05T11:00:00Z',
  },
  // 3. Student (Rahul)
  {
    id: 'user_student_rahul',
    name: 'Rahul Verma',
    email: 'rahul.verma@campus.edu',
    role: 'student',
    avatar: 'RV',
    title: 'Final Year B.Tech IT',
    department: 'Information Technology',
    createdAt: '2026-08-10T12:00:00Z',
  },
  // 4. Student (Ananya)
  {
    id: 'user_student_ananya',
    name: 'Ananya Patel',
    email: 'ananya.patel@campus.edu',
    role: 'student',
    avatar: 'AP',
    title: 'Final Year B.Tech ECE',
    department: 'Electronics & Communication',
    createdAt: '2026-08-12T09:00:00Z',
  },
  // 5. TPO Officer (Dr. Rajesh Rao)
  {
    id: 'user_officer_rajesh',
    name: 'Dr. Rajesh Rao',
    email: 'placement.cell@campus.edu',
    role: 'tpo',
    avatar: 'RR',
    title: 'Head of Training & Placement Cell',
    department: 'University Placement Office',
    createdAt: '2026-06-15T08:00:00Z',
  },
  // 6. Recruiter (Sarah Jenkins @ Microsoft)
  {
    id: 'user_recruiter_sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@microsoft.com',
    role: 'recruiter',
    avatar: 'SJ',
    title: 'Senior University Talent Lead',
    department: 'Global Campus Recruitment',
    createdAt: '2026-07-20T09:00:00Z',
  },
  // 7. Recruiter (Arjun Mehta @ Google)
  {
    id: 'user_recruiter_arjun',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@google.com',
    role: 'recruiter',
    avatar: 'AM',
    title: 'Staff University Recruiter',
    department: 'Engineering Hiring',
    createdAt: '2026-07-25T14:30:00Z',
  },
  // 8. Recruiter (Neha Kapoor @ TechNova)
  {
    id: 'user_recruiter_neha',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@technova.io',
    role: 'recruiter',
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
        matchingWeights: this.matchingWeights
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
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: User): User {
    this.users.push(user);
    this.save();
    return user;
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

  createDrive(drive: Drive): Drive {
    this.drives.push(drive);
    this.save();
    return drive;
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
  getApplications(query?: { studentId?: string; jobId?: string; recruiterId?: string }): Application[] {
    let result = [...this.applications];
    if (!query) return result;

    if (query.studentId) {
      result = result.filter(a => a.studentId === query.studentId);
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
  getNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter(n => n.userId === userId || n.userId === 'all');
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
    this.notifications.forEach(n => {
      if ((n.userId === userId || n.userId === 'all') && !n.read) {
        n.read = true;
        changed = true;
      }
    });
    if (changed) this.save();
    return changed;
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
}

export const db = new CampusDatabase();
