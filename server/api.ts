import { Router, Request, Response } from 'express';
import { 
  db, 
  dbEvents, 
  generateObjectId, 
  computeReadiness, 
  calculateMatchAndExplanation 
} from './db.ts';
import { 
  Application, 
  ApplicationStage, 
  JobPosting, 
  StudentProfile, 
  RecruiterProfile,
  Company,
  Drive,
  InterviewRecord,
  OfferRecord,
  DocumentItem,
  EvaluationNote,
  InterviewDetails,
  OfferDetails
} from '../src/types/index.ts';

export const apiRouter = Router();

// Helper to get active user ID from request headers
function getReqUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) return headerUserId;
  return 'user_student_aarav';
}

// ----------------- AUTH & PROFILES -----------------

apiRouter.get('/auth/users', (_req: Request, res: Response) => {
  const users = db.getUsers();
  res.json({ success: true, data: users });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
  }
  const studentProfile = user.role === 'student' ? db.getStudentProfile(user.id) : null;
  const recruiterProfile = user.role === 'recruiter' ? db.getRecruiterProfile(user.id) : null;
  res.json({ success: true, data: { user, profile: studentProfile || recruiterProfile } });
});

apiRouter.post('/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const studentProfile = user.role === 'student' ? db.getStudentProfile(user.id) : null;
  const recruiterProfile = user.role === 'recruiter' ? db.getRecruiterProfile(user.id) : null;

  res.json({
    success: true,
    data: {
      user,
      profile: studentProfile || recruiterProfile
    }
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId) || db.getUserById('user_student_bishnu');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const studentProfile = user.role === 'student' ? db.getStudentProfile(user.id) : null;
  const recruiterProfile = user.role === 'recruiter' ? db.getRecruiterProfile(user.id) : null;

  res.json({
    success: true,
    data: {
      user,
      profile: studentProfile || recruiterProfile
    }
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    role, 
    department, 
    cgpa, 
    branch, 
    skills,
    phone,
    university,
    rollNumber,
    degree,
    graduationYear,
    backlogs,
    bio,
    github,
    linkedin,
    portfolio,
    resumeFilename,
    projects,
    certifications,
    targetRoles,
    // Recruiter specific
    companyName,
    industry,
    location,
    companyWebsite,
    companyLogo
  } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists' });
  }

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const newUser = db.createUser({
    id: `user_${role}_${generateObjectId()}`,
    name,
    email,
    role,
    avatar: initials || (role === 'student' ? 'ST' : 'CP'),
    title: role === 'student' ? `${degree || 'B.Tech'} ${branch || 'CSE'} · ${graduationYear || 2026}` : role === 'tpo' ? 'Placement Officer' : 'Talent Acquisition Partner',
    department: department || (role === 'student' ? (branch || 'Computer Science & Engineering') : 'Talent Cell'),
    createdAt: new Date().toISOString()
  });

  if (role === 'student') {
    const studentSkills = Array.isArray(skills) && skills.length > 0 
      ? skills 
      : ['Python', 'React', 'SQL', 'Git'];

    const studentProjects = Array.isArray(projects) && projects.length > 0 
      ? projects 
      : [
          { id: `proj_${generateObjectId()}`, title: 'Autonomous Placement Hub', tech: 'React, TypeScript, Express', description: 'Real-time placement management platform with AI candidate matching.' }
        ];

    const studentProfile = db.upsertStudentProfile({
      userId: newUser.id,
      fullName: name,
      email,
      phone: phone || '+91 98765 00000',
      university: university || 'National Institute of Technology',
      rollNumber: rollNumber || ('2022UG' + Math.floor(1000 + Math.random() * 9000)),
      degree: degree || 'B.Tech',
      branch: branch || 'Computer Science & Engineering',
      graduationYear: typeof graduationYear === 'number' ? graduationYear : parseInt(graduationYear, 10) || 2026,
      cgpa: typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || 8.2,
      maxCgpa: 10,
      backlogs: typeof backlogs === 'number' ? backlogs : parseInt(backlogs, 10) || 0,
      skills: studentSkills,
      bio: bio || 'Enthusiastic undergraduate eager to solve complex problems and build scalable production software.',
      github: github || `https://github.com/${name.toLowerCase().replace(/\s+/g, '')}`,
      linkedin: linkedin || `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, '-')}`,
      portfolio: portfolio || `https://${name.toLowerCase().replace(/\s+/g, '')}.dev`,
      resumeFilename: resumeFilename || `${name.replace(/\s+/g, '_')}_Resume.pdf`,
      resumeUrl: '#preview-resume',
      projects: studentProjects,
      experience: [],
      certifications: Array.isArray(certifications) && certifications.length > 0 ? certifications : ['AWS Certified Cloud Practitioner'],
      targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0 ? targetRoles : ['Full Stack Developer', 'Software Engineer'],
      aptitudeScore: 84,
      mockInterviewScore: 82,
      communicationScore: 84,
      isVerified: true
    });

    // Notify student body of registration
    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: newUser.id,
      title: `Welcome to CAMPUSLINK, ${name}! 🎓`,
      message: `Your student profile has been verified with CGPA ${studentProfile.cgpa}. AI Employability score computed: ${studentProfile.readinessScore}/100.`,
      type: 'Skill Recommendation',
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'overview'
    });

    res.json({ success: true, data: { user: newUser, profile: studentProfile } });
  } else if (role === 'recruiter') {
    const compName = companyName || 'Enterprise Talent Corp';
    const compLogo = companyLogo || compName.slice(0, 4).toUpperCase();
    
    // Also create company entry in companies table
    const comp = db.createCompany({
      id: `comp_${generateObjectId()}`,
      name: compName,
      industry: industry || 'Information Technology & Software',
      location: location || 'Bangalore / Hybrid',
      website: companyWebsite || 'https://example.com',
      logo: compLogo,
      recruiterId: newUser.id,
      recruiterName: name,
      recruiterEmail: email,
      hiringStatus: 'Active',
      description: 'Corporate hiring partner registered on CAMPUSLINK placement portal.',
      activeDrivesCount: 1,
      totalHires: 0
    });

    const recruiterProfile = db.upsertRecruiterProfile({
      userId: newUser.id,
      companyId: comp.id,
      companyName: compName,
      recruiterName: name,
      title: 'Talent Acquisition Lead',
      email,
      phone: phone || '+91 98765 11111',
      companyWebsite: companyWebsite || 'https://example.com',
      companyLogo: compLogo,
      industry: industry || 'Information Technology',
      headquarters: location || 'Bangalore / Hybrid',
      companyBio: 'Leading university hiring initiatives and engineering recruitment.',
      activeDrivesCount: 1
    });

    res.json({ success: true, data: { user: newUser, profile: recruiterProfile } });
  } else {
    res.json({ success: true, data: { user: newUser } });
  }
});

// ----------------- STUDENTS CRUD -----------------

apiRouter.get('/students', (req: Request, res: Response) => {
  const branch = req.query.branch as string;
  const minCgpa = req.query.minCgpa ? parseFloat(req.query.minCgpa as string) : undefined;
  const search = req.query.search as string;

  let students = db.getAllStudentProfiles();

  if (branch && branch !== 'All') {
    students = students.filter(s => s.branch.toLowerCase().includes(branch.toLowerCase()));
  }
  if (typeof minCgpa === 'number') {
    students = students.filter(s => s.cgpa >= minCgpa);
  }
  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.skills.some(sk => sk.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: students });
});

apiRouter.get('/students/:id', (req: Request, res: Response) => {
  const student = db.getStudentProfile(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }
  res.json({ success: true, data: student });
});

apiRouter.put('/students/:id', (req: Request, res: Response) => {
  const updated = db.upsertStudentProfile({
    ...req.body,
    userId: req.params.id
  });
  res.json({ success: true, data: updated });
});

apiRouter.post('/students', (req: Request, res: Response) => {
  const created = db.upsertStudentProfile({
    ...req.body,
    userId: req.body.userId || `user_student_${generateObjectId()}`
  });
  res.status(201).json({ success: true, data: created });
});

// ----------------- COMPANIES CRUD -----------------

apiRouter.get('/companies', (_req: Request, res: Response) => {
  const companies = db.getCompanies();
  res.json({ success: true, data: companies });
});

apiRouter.get('/companies/:id', (req: Request, res: Response) => {
  const company = db.getCompanyById(req.params.id);
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.json({ success: true, data: company });
});

apiRouter.post('/companies', (req: Request, res: Response) => {
  const { name, industry, location, website, logo, recruiterName, recruiterEmail, description } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Company name is required' });
  }
  const newCompany: Company = {
    id: `comp_${generateObjectId()}`,
    name,
    industry: industry || 'Technology & Software',
    location: location || 'Bangalore / Hybrid',
    website: website || 'https://example.com',
    logo: logo || name.slice(0, 4).toUpperCase(),
    recruiterId: getReqUserId(req),
    recruiterName: recruiterName || 'Recruitment Team',
    recruiterEmail: recruiterEmail || 'recruiter@company.com',
    hiringStatus: 'Active',
    description: description || 'Premier corporate hiring partner.',
    activeDrivesCount: 1,
    totalHires: 0
  };
  const created = db.createCompany(newCompany);
  res.status(201).json({ success: true, data: created });
});

// ----------------- JOBS CRUD -----------------

apiRouter.get('/jobs', (req: Request, res: Response) => {
  const search = req.query.search as string;
  const type = req.query.type as string;
  const department = req.query.department as string;
  const minCgpa = req.query.minCgpa ? parseFloat(req.query.minCgpa as string) : undefined;

  const jobs = db.getJobs({ search, type, department, minCgpa });
  res.json({ success: true, data: jobs });
});

apiRouter.get('/jobs/:id', (req: Request, res: Response) => {
  const job = db.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job posting not found' });
  }
  res.json({ success: true, data: job });
});

apiRouter.post('/jobs', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);
  const recruiterProfile = db.getRecruiterProfile(userId);

  const {
    title,
    department,
    location,
    type,
    workplaceType,
    ctcOrStipend,
    minCgpa,
    allowedBranches,
    maxBacklogs,
    targetBatches,
    description,
    responsibilities,
    requirements,
    skills,
    applicationDeadline,
    openingsCount,
    driveDate,
    driveTime,
    venue
  } = req.body;

  if (!title || !ctcOrStipend) {
    return res.status(400).json({ success: false, message: 'Job title and compensation are required' });
  }

  const newJob: JobPosting = {
    id: `job_${generateObjectId()}`,
    companyId: recruiterProfile?.companyId || 'comp_technova',
    recruiterId: userId,
    companyName: recruiterProfile?.companyName || user?.name || 'TechNova Solutions',
    companyLogo: recruiterProfile?.companyLogo || 'TECH',
    title,
    department: department || 'Core Engineering',
    location: location || 'Bangalore / Hybrid',
    type: type || 'Full-Time',
    workplaceType: workplaceType || 'Hybrid',
    ctcOrStipend,
    minCgpa: typeof minCgpa === 'number' ? minCgpa : 7.0,
    allowedBranches: allowedBranches && allowedBranches.length > 0 
      ? allowedBranches 
      : ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    maxBacklogs: typeof maxBacklogs === 'number' ? maxBacklogs : 0,
    targetBatches: targetBatches && targetBatches.length > 0 ? targetBatches : [2026],
    description: description || 'Exciting campus recruitment drive opportunity.',
    responsibilities: responsibilities || ['Architect clean backend & frontend solutions', 'Collaborate in agile sprints'],
    requirements: requirements || ['Strong technical foundations', 'Proficient problem solving'],
    skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Python', 'React', 'SQL', 'Git'],
    status: 'Active',
    applicationDeadline: applicationDeadline || '2026-11-30',
    openingsCount: parseInt(openingsCount, 10) || 5,
    applicantCount: 0,
    driveDate: driveDate || '2026-11-15',
    driveTime: driveTime || '10:00 AM - 05:00 PM',
    venue: venue || 'Turing Hall & Computing Lab 3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const created = db.createJob(newJob);
  res.status(201).json({ success: true, data: created });
});

apiRouter.put('/jobs/:id', (req: Request, res: Response) => {
  const updated = db.updateJob(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Job posting not found' });
  }
  res.json({ success: true, data: updated });
});

apiRouter.delete('/jobs/:id', (req: Request, res: Response) => {
  const deleted = db.deleteJob(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, message: 'Job removed successfully' });
});

// ----------------- AI READINESS & SCORING -----------------

apiRouter.post('/ai/readiness-score', (req: Request, res: Response) => {
  const { studentId, profileData, customWeights } = req.body;
  const profile = profileData || (studentId ? db.getStudentProfile(studentId) : null);
  if (!profile) {
    return res.status(400).json({ success: false, message: 'Valid studentId or profileData required' });
  }

  const weights = customWeights || db.getScoringWeights();
  const readiness = computeReadiness(profile, weights);
  res.json({ success: true, data: readiness });
});

apiRouter.post('/ai/skill-gap', (req: Request, res: Response) => {
  const { studentId, targetRole } = req.body;
  const activeStudentId = studentId || getReqUserId(req);
  const analysis = db.getSkillGapAnalysis(activeStudentId, targetRole || 'Full Stack Developer');
  res.json({ success: true, data: analysis });
});

apiRouter.post('/ai/match', (req: Request, res: Response) => {
  const { studentId, jobId } = req.body;
  const activeStudentId = studentId || getReqUserId(req);
  const student = db.getStudentProfile(activeStudentId);
  const job = db.getJobById(jobId);

  if (!student || !job) {
    return res.status(400).json({ success: false, message: 'Student and Job must exist to compute match' });
  }

  const matchResult = calculateMatchAndExplanation(student, job, db.getMatchingWeights());
  res.json({ success: true, data: matchResult });
});

apiRouter.post('/ai/explain-match', (req: Request, res: Response) => {
  const { studentId, jobId } = req.body;
  const student = db.getStudentProfile(studentId);
  const job = db.getJobById(jobId);
  if (!student || !job) {
    return res.status(400).json({ success: false, message: 'Student and Job not found' });
  }
  const matchResult = calculateMatchAndExplanation(student, job, db.getMatchingWeights());
  res.json({ success: true, data: matchResult.explainableMatch });
});

// AI Career Assistant Chatbot
apiRouter.post('/ai/assistant-chat', (req: Request, res: Response) => {
  const { query, studentId } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  const activeStudentId = studentId || getReqUserId(req);
  const student = db.getStudentProfile(activeStudentId) || db.getAllStudentProfiles()[0];
  const jobs = db.getJobs();
  const q = query.toLowerCase();

  let reply = '';
  let suggestions: string[] = [];

  if (q.includes('eligible') || q.includes('am i eligible')) {
    const eligibleJobs = jobs.filter(j => student.cgpa >= j.minCgpa && (student.backlogs ?? 0) <= j.maxBacklogs);
    reply = `Based on your verified CGPA (${student.cgpa.toFixed(2)}) and 0 active backlogs, you are formally eligible for **${eligibleJobs.length} out of ${jobs.length}** campus recruitment drives, including **${eligibleJobs.slice(0, 3).map(j => j.companyName).join(', ')}**.`;
    suggestions = ['Which jobs match my skills best?', 'How can I improve my readiness score?', 'Why was I not shortlisted?'];
  } else if (q.includes('improve') || q.includes('skills') || q.includes('skill gap')) {
    const gap = db.getSkillGapAnalysis(student.userId, 'Full Stack Developer');
    const missingHigh = gap.missingSkills.filter(m => m.priority === 'HIGH').map(m => m.skill);
    reply = `Your current readiness score is **${student.readinessScore}/100** (${student.readinessLevel}). To maximize your shortlisting probability for marquee Tier-1 companies (TechNova, Microsoft, AWS), prioritize mastering: **${missingHigh.length > 0 ? missingHigh.join(', ') : 'AWS Cloud, Docker, and SQL Window Functions'}**. Completing these will boost your score by approximately +8 to +12 points.`;
    suggestions = ['View recommended preparation roadmap', 'Take a mock technical test', 'Am I eligible for Google?'];
  } else if (q.includes('why was i not shortlisted') || q.includes('not shortlisted') || q.includes('rejection')) {
    reply = `In CAMPUSLINK, every non-shortlist status is explainable. Typical reasons include: (1) CGPA or backlog benchmark, (2) missing prerequisite frameworks (e.g. AWS/Docker for DevOps), or (3) mock interview score below 75%. You can inspect the **Explainable AI Breakdown** on any job card to see exact positive factors and gap areas.`;
    suggestions = ['Check TechNova requirements', 'Schedule mock interview', 'What is my readiness score?'];
  } else if (q.includes('match') || q.includes('recommend')) {
    const matches = jobs.map(j => {
      const m = calculateMatchAndExplanation(student, j);
      return { job: j, matchScore: m.matchScore, isShortlisted: m.explainableMatch.isShortlisted };
    }).sort((a, b) => b.matchScore - a.matchScore);

    const top = matches[0];
    reply = `Your top recommended campus role is **${top.job.title} at ${top.job.companyName}** with an overall match score of **${top.matchScore}%**! You satisfy the academic criteria and match core skills (${student.skills.slice(0, 4).join(', ')}).`;
    suggestions = ['View Match Details', 'Apply now with 1-click', 'Am I eligible for Microsoft?'];
  } else {
    reply = `Hello ${student.fullName}! I am your CAMPUSLINK AI Career Advisor. I have real-time access to your academic profile (CGPA: ${student.cgpa}), your ${student.skills.length} verified technical skills, and all active campus drives. You can ask me about eligibility, skill gap roadmaps, or why a candidate is shortlisted!`;
    suggestions = ['Am I eligible for TechNova?', 'What skills should I improve?', 'Which jobs match my profile?'];
  }

  res.json({
    success: true,
    data: {
      text: reply,
      suggestions
    }
  });
});

// Configurable Weights Endpoints
apiRouter.get('/ai/weights', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      scoringWeights: db.getScoringWeights(),
      matchingWeights: db.getMatchingWeights()
    }
  });
});

apiRouter.put('/ai/weights', (req: Request, res: Response) => {
  const { scoringWeights, matchingWeights } = req.body;
  if (scoringWeights) {
    db.updateScoringWeights(scoringWeights);
  }
  if (matchingWeights) {
    db.updateMatchingWeights(matchingWeights);
  }
  res.json({
    success: true,
    data: {
      scoringWeights: db.getScoringWeights(),
      matchingWeights: db.getMatchingWeights()
    }
  });
});

// ----------------- DRIVES & CONFLICT-FREE SCHEDULING -----------------

apiRouter.get('/drives', (_req: Request, res: Response) => {
  const drives = db.getDrives();
  res.json({ success: true, data: drives });
});

apiRouter.post('/drives', (req: Request, res: Response) => {
  const {
    title,
    companyId,
    companyName,
    companyLogo,
    date,
    startTime,
    endTime,
    venue,
    targetBatches,
    allowedBranches,
    minCgpa,
    openings,
    panelMembers
  } = req.body;

  if (!title || !date || !startTime || !venue) {
    return res.status(400).json({ success: false, message: 'Title, date, startTime, and venue are required' });
  }

  // Conflict Check
  const conflict = db.checkSchedulingConflict({
    companyId: companyId || 'comp_custom',
    date,
    startTime,
    endTime: endTime || '05:00 PM',
    venue,
    targetBatches: targetBatches || [2026]
  });

  const newDrive: Drive = {
    id: `drive_${generateObjectId()}`,
    title,
    companyId: companyId || 'comp_custom',
    companyName: companyName || 'Corporate Partner',
    companyLogo: companyLogo || 'CORP',
    date,
    startTime,
    endTime: endTime || '05:00 PM',
    venue,
    targetBatches: targetBatches || [2026],
    allowedBranches: allowedBranches || ['Computer Science & Engineering', 'Information Technology'],
    minCgpa: typeof minCgpa === 'number' ? minCgpa : 7.0,
    openings: parseInt(openings, 10) || 10,
    status: 'Upcoming',
    panelMembers: Array.isArray(panelMembers) && panelMembers.length > 0 ? panelMembers : ['Campus Hiring Lead', 'TPO Observer'],
    shortlistedCount: 20,
    conflictDetails: conflict.hasConflict ? conflict : undefined
  };

  const created = db.createDrive(newDrive);

  // Notify student body of new drive
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: 'all',
    title: `New Placement Drive: ${title} 📢`,
    message: `${companyName} campus recruitment drive scheduled on ${date} at ${venue}.`,
    type: 'Drive Announcement',
    read: false,
    createdAt: new Date().toISOString(),
    linkTab: 'drives'
  });

  res.status(201).json({ success: true, data: created, conflict });
});

apiRouter.post('/scheduling/check-conflict', (req: Request, res: Response) => {
  const { companyId, date, startTime, endTime, venue, targetBatches } = req.body;
  const result = db.checkSchedulingConflict({
    companyId: companyId || 'comp_check',
    date: date || '2026-10-18',
    startTime: startTime || '10:00 AM',
    endTime: endTime || '05:00 PM',
    venue: venue || 'Turing Hall',
    targetBatches: targetBatches || [2026]
  });
  res.json({ success: true, data: result });
});

apiRouter.post('/scheduling/suggest-slot', (req: Request, res: Response) => {
  const { date, venue } = req.body;
  // Suggest a safe alternative slot (e.g. 2:00 PM - 5:00 PM or alternative venue)
  const suggested = {
    date: date || '2026-10-19',
    startTime: '02:00 PM',
    endTime: '05:30 PM',
    alternativeVenues: ['Computing Lab 1', 'Seminar Hall B', 'Virtual Teams Suite']
  };
  res.json({ success: true, data: suggested });
});

// ----------------- APPLICATIONS -----------------

apiRouter.get('/applications', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);
  const jobId = req.query.jobId as string;

  let query: { studentId?: string; jobId?: string; recruiterId?: string } = {};

  if (user?.role === 'student') {
    query.studentId = user.id;
  } else if (user?.role === 'recruiter') {
    query.recruiterId = user.id;
  }

  if (jobId) {
    query.jobId = jobId;
  }

  const applications = db.getApplications(query);
  res.json({ success: true, data: applications });
});

apiRouter.get('/applications/:id', (req: Request, res: Response) => {
  const app = db.getApplicationById(req.params.id);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }
  res.json({ success: true, data: app });
});

apiRouter.post('/applications', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);
  const student = db.getStudentProfile(userId) || db.getAllStudentProfiles()[0];

  const { jobId, coverNote } = req.body;
  if (!jobId) {
    return res.status(400).json({ success: false, message: 'jobId is required' });
  }

  const job = db.getJobById(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  // Calculate full match & explainability
  const match = calculateMatchAndExplanation(student, job, db.getMatchingWeights());

  const now = new Date().toISOString();
  const initialStage: ApplicationStage = match.explainableMatch.isShortlisted ? 'screening' : 'applied';

  const newApp: Application = {
    id: `app_${generateObjectId()}`,
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
    coverNote: coverNote || 'Excited to apply for this campus recruitment position through CAMPUSLINK.',
    eligibilityStatus: match.eligibilityStatus,
    eligibilityReasons: match.eligibilityReasons,
    matchScore: match.matchScore,
    matchBreakdown: match.matchBreakdown,
    explainableMatch: match.explainableMatch,
    stage: initialStage,
    stageHistory: [
      {
        stage: 'applied',
        label: 'Application Submitted',
        timestamp: now,
        note: `Submitted application for ${job.title} at ${job.companyName}.`
      }
    ],
    evaluations: [],
    createdAt: now,
    updatedAt: now
  };

  if (match.explainableMatch.isShortlisted) {
    newApp.stageHistory.push({
      stage: 'screening',
      label: 'AI Shortlisted & Screened',
      timestamp: now,
      note: `Automated AI Shortlisting cleared: Match score ${match.matchScore}%, CGPA ${student.cgpa} >= ${job.minCgpa}.`
    });
  }

  try {
    const created = db.createApplication(newApp);

    // Notify student
    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: student.userId,
      title: match.explainableMatch.isShortlisted ? `Shortlisted for ${job.companyName}! 🎯` : `Application Received - ${job.companyName}`,
      message: match.explainableMatch.isShortlisted
        ? `Great news! Your match score of ${match.matchScore}% earned you an automatic shortlist for ${job.title}.`
        : `Your application has been logged into the recruitment pipeline.`,
      type: match.explainableMatch.isShortlisted ? 'Shortlisted' : 'status_change',
      read: false,
      createdAt: now,
      applicationId: created.id
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to apply' });
  }
});

// Update Application Stage
apiRouter.patch('/applications/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, note, interviewDetails, offerDetails } = req.body as {
    stage: ApplicationStage;
    note?: string;
    interviewDetails?: InterviewDetails;
    offerDetails?: OfferDetails;
  };

  const currentApp = db.getApplicationById(id);
  if (!currentApp) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const stageLabels: Record<ApplicationStage, string> = {
    applied: 'Application Received',
    screening: 'Screening Passed',
    assessment: 'Assessment Scheduled',
    interview: 'Technical Interview Scheduled',
    hr_round: 'HR & Culture Round',
    offered: 'Campus Offer Extended 🎉',
    accepted: 'Offer Accepted by Student 🤝',
    rejected: 'Application Concluded',
    joined: 'Joined & Verified 🎓'
  };

  const historyItem = {
    stage,
    label: stageLabels[stage] || stage,
    timestamp: new Date().toISOString(),
    note: note || `Application transitioned to ${stageLabels[stage] || stage}.`,
    updatedBy: (req.headers['x-user-name'] as string) || 'Placement Officer'
  };

  const updates: Partial<Application> = {
    stage,
    stageHistory: [...currentApp.stageHistory, historyItem]
  };

  if (interviewDetails) updates.interviewDetails = interviewDetails;
  if (offerDetails) updates.offerDetails = offerDetails;

  const updated = db.updateApplication(id, updates);

  // Send real-time notification
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: currentApp.studentId,
    title: `Stage Update: ${currentApp.companyName} (${stageLabels[stage]})`,
    message: note || `Your application for ${currentApp.jobTitle} is now in "${stageLabels[stage]}".`,
    type: stage === 'offered' ? 'Offer Letter' : stage === 'interview' ? 'Interview Schedule' : 'status_change',
    read: false,
    createdAt: new Date().toISOString(),
    applicationId: id
  });

  res.json({ success: true, data: updated });
});

// Recruiter scorecard evaluation
apiRouter.post('/applications/:id/evaluations', (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment, author, role } = req.body;

  const currentApp = db.getApplicationById(id);
  if (!currentApp) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const newEval: EvaluationNote = {
    id: `eval_${generateObjectId()}`,
    author: author || 'Interviewer',
    role: role || 'Technical Panel Lead',
    rating: parseInt(rating, 10) || 5,
    comment: comment || 'Strong problem solving and architectural thinking.',
    timestamp: new Date().toISOString()
  };

  const updated = db.updateApplication(id, {
    evaluations: [...(currentApp.evaluations || []), newEval]
  });

  res.json({ success: true, data: updated });
});

// Student accepts or declines offer
apiRouter.post('/applications/:id/respond-offer', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'decline'

  const currentApp = db.getApplicationById(id);
  if (!currentApp) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const isAccept = action === 'accept';
  const newStage: ApplicationStage = isAccept ? 'accepted' : 'rejected';

  const updatedHistory = [
    ...currentApp.stageHistory,
    {
      stage: newStage,
      label: isAccept ? 'Offer Formally Accepted by Candidate 🤝' : 'Offer Declined by Candidate',
      timestamp: new Date().toISOString(),
      note: isAccept 
        ? 'Candidate has officially confirmed and accepted the university placement offer.' 
        : 'Candidate has formally declined the campus offer.',
      updatedBy: currentApp.studentName
    }
  ];

  const updatedOffer: OfferDetails | undefined = currentApp.offerDetails ? {
    ...currentApp.offerDetails,
    status: isAccept ? 'Accepted' : 'Declined'
  } : undefined;

  const updated = db.updateApplication(id, {
    stage: newStage,
    stageHistory: updatedHistory,
    offerDetails: updatedOffer
  });

  // Notify TPO and student
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: 'user_officer_rajesh',
    title: `Offer ${isAccept ? 'Accepted' : 'Declined'}: ${currentApp.studentName} 🎓`,
    message: `${currentApp.studentName} has ${isAccept ? 'accepted' : 'declined'} offer from ${currentApp.companyName} (${currentApp.ctcOrStipend}).`,
    type: 'Offer Letter',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, data: updated });
});

// ----------------- INTERVIEWS CRUD -----------------

apiRouter.get('/interviews', (_req: Request, res: Response) => {
  const interviews = db.getInterviews();
  res.json({ success: true, data: interviews });
});

apiRouter.get('/interviews/:id', (req: Request, res: Response) => {
  const interview = db.getInterviewById(req.params.id);
  if (!interview) {
    return res.status(404).json({ success: false, message: 'Interview record not found' });
  }
  res.json({ success: true, data: interview });
});

apiRouter.put('/interviews/:id', (req: Request, res: Response) => {
  const updated = db.updateInterview(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Interview record not found' });
  }
  res.json({ success: true, data: updated });
});

// ----------------- OFFERS CRUD -----------------

apiRouter.get('/offers', (_req: Request, res: Response) => {
  const offers = db.getOffers();
  res.json({ success: true, data: offers });
});

apiRouter.get('/offers/:id', (req: Request, res: Response) => {
  const offer = db.getOfferById(req.params.id);
  if (!offer) {
    return res.status(404).json({ success: false, message: 'Offer record not found' });
  }
  res.json({ success: true, data: offer });
});

apiRouter.patch('/offers/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const updated = db.updateOfferStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Offer not found' });
  }
  res.json({ success: true, data: updated });
});

// ----------------- DOCUMENTS CRUD -----------------

apiRouter.get('/documents', (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  const docs = db.getDocuments(studentId);
  res.json({ success: true, data: docs });
});

apiRouter.post('/documents', (req: Request, res: Response) => {
  const { studentId, studentName, title, category, filename, fileSize } = req.body;
  if (!title || !category || !filename) {
    return res.status(400).json({ success: false, message: 'Title, category, and filename are required' });
  }
  const newDoc: DocumentItem = {
    id: `doc_${generateObjectId()}`,
    studentId: studentId || getReqUserId(req),
    studentName: studentName || 'Bishnu Sahoo',
    title,
    category,
    filename,
    fileUrl: '#preview-document',
    fileSize: fileSize || '1.4 MB',
    uploadedDate: new Date().toISOString().split('T')[0],
    status: 'Uploaded',
    verificationNote: 'Uploaded and awaiting TPO Officer verification.'
  };
  const created = db.createDocument(newDoc);
  res.status(201).json({ success: true, data: created });
});

apiRouter.put('/documents/:id/verify', (req: Request, res: Response) => {
  const { status, note, verifiedBy } = req.body;
  const updated = db.updateDocumentStatus(req.params.id, status || 'Verified', note, verifiedBy || 'Dr. Rajesh Rao');
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }
  res.json({ success: true, data: updated });
});

// ----------------- ANALYTICS & AT-RISK -----------------

apiRouter.get('/analytics/overview', (_req: Request, res: Response) => {
  const stats = db.getPlacementStats();
  res.json({ success: true, data: stats });
});

apiRouter.get('/analytics/branches', (_req: Request, res: Response) => {
  const stats = db.getPlacementStats();
  res.json({ success: true, data: stats.branchPlacement });
});

apiRouter.get('/analytics/skills', (_req: Request, res: Response) => {
  const stats = db.getPlacementStats();
  res.json({ success: true, data: stats.skillDemand });
});

apiRouter.get('/analytics/packages', (_req: Request, res: Response) => {
  const stats = db.getPlacementStats();
  res.json({
    success: true,
    data: {
      distribution: stats.packageDistribution,
      trend: stats.averagePackageTrend,
      offersByCompany: stats.offersByCompany
    }
  });
});

apiRouter.get('/analytics/at-risk', (_req: Request, res: Response) => {
  const atRisk = db.getAtRiskStudents();
  res.json({ success: true, data: atRisk });
});

// ----------------- NOTIFICATIONS -----------------

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const notifications = db.getNotifications(userId);
  res.json({ success: true, data: notifications });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  res.json({ success });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const success = db.markAllNotificationsRead(userId);
  res.json({ success });
});

// ----------------- REAL-TIME SSE STREAM -----------------

apiRouter.get('/realtime/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  const onApplicationCreated = (app: Application) => {
    res.write(`data: ${JSON.stringify({ type: 'application:created', data: app })}\n\n`);
  };

  const onApplicationUpdated = (app: Application) => {
    res.write(`data: ${JSON.stringify({ type: 'application:updated', data: app })}\n\n`);
  };

  const onJobCreated = (job: JobPosting) => {
    res.write(`data: ${JSON.stringify({ type: 'job:created', data: job })}\n\n`);
  };

  const onNotificationCreated = (notif: any) => {
    res.write(`data: ${JSON.stringify({ type: 'notification:created', data: notif })}\n\n`);
  };

  dbEvents.on('application:created', onApplicationCreated);
  dbEvents.on('application:updated', onApplicationUpdated);
  dbEvents.on('job:created', onJobCreated);
  dbEvents.on('notification:created', onNotificationCreated);

  const interval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 20000);

  req.on('close', () => {
    clearInterval(interval);
    dbEvents.off('application:created', onApplicationCreated);
    dbEvents.off('application:updated', onApplicationUpdated);
    dbEvents.off('job:created', onJobCreated);
    dbEvents.off('notification:created', onNotificationCreated);
  });
});
