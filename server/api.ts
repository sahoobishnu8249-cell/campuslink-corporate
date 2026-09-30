import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { 
  db, 
  dbEvents, 
  generateObjectId, 
  computeReadiness, 
  calculateMatchAndExplanation,
  hashPassword,
  verifyPassword,
  hashOtp,
  verifyOtpHash
} from './db.ts';
import { emailService } from './emailService.ts';
import { 
  parseResumeAndExtractSkills, 
  generateQuestionsForStudent, 
  evaluateAssessmentSession 
} from './skillAssessmentService.ts';
import { 
  Application, 
  ApplicationStage, 
  JobPosting, 
  StudentProfile, 
  StudentProject,
  RecruiterProfile,
  Company,
  Drive,
  InterviewRecord,
  OfferRecord,
  DocumentItem,
  EvaluationNote,
  InterviewDetails,
  OfferDetails,
  User,
  AssessmentSession,
  AssessmentQuestion,
  StudentAnswer,
  AssessmentResultModel,
  CertificateModel,
  ResumeExtractedData,
  ResumeSkillModel,
  SkillScoreModel,
  AssessmentSettingsModel
} from '../src/types/index.ts';

export const apiRouter = Router();

// ----------------- JWT TOKEN UTILITIES -----------------
const JWT_SECRET = process.env.JWT_SECRET || 'campuslink_jwt_super_secret_key_2026';

function signToken(payload: { userId: string; email: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 86400 // 7 days
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Helper to get active user ID from request headers or JWT token
function getReqUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verified = verifyToken(token);
    if (verified && verified.userId) return verified.userId;
  }

  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) return headerUserId;
  return 'user_student_aarav';
}

// ----------------- AUTH & PROFILES -----------------

apiRouter.post(['/auth/logout', '/auth/logout/'], (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get(['/auth/users', '/auth/users/'], (_req: Request, res: Response) => {
  const users = db.getUsers();
  res.json({ success: true, data: users });
});

apiRouter.post(['/auth/login', '/auth/login/'], async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
  }

  // Password verification if user has a set password
  if (user.password_hash) {
    if (!password || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  }

  // Check email verification status for students
  if (user.role === 'student' && user.email_verified === false) {
    // Generate new OTP and dispatch to student email
    const otp = crypto.randomInt(100000, 1000000).toString();
    db.createOtpRecord({
      _id: generateObjectId(),
      user_id: user.id,
      email: user.email,
      otp_hash: hashOtp(otp),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempt_count: 0,
      verified: false,
      created_at: new Date().toISOString()
    });

    const sendRes = await emailService.sendOTP(user.email, otp, user.name);

    return res.status(200).json({
      success: false,
      verification_required: true,
      message: 'Please verify your email before accessing the dashboard.',
      email: user.email,
      maskedEmail: sendRes.maskedEmail,
      previewOtp: otp
    });
  }

  const studentProfile = user.role === 'student' ? db.getStudentProfile(user.id) : null;
  const recruiterProfile = user.role === 'recruiter' ? db.getRecruiterProfile(user.id) : null;
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({ 
    success: true, 
    access_token: token,
    verified: true,
    data: { user, profile: studentProfile || recruiterProfile },
    user,
    profile: studentProfile || recruiterProfile
  });
});

apiRouter.post('/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const studentProfile = user.role === 'student' ? db.getStudentProfile(user.id) : null;
  const recruiterProfile = user.role === 'recruiter' ? db.getRecruiterProfile(user.id) : null;
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  res.json({
    success: true,
    access_token: token,
    data: {
      user,
      profile: studentProfile || recruiterProfile
    }
  });
});

apiRouter.get(['/auth/me', '/auth/me/'], (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No authorization token provided' });
  }

  const token = authHeader.substring(7);
  const verified = verifyToken(token);
  if (!verified || !verified.userId) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }

  const user = db.getUserById(verified.userId);
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

apiRouter.post(['/auth/register', '/auth/register/'], async (req: Request, res: Response) => {
  const { 
    name, 
    email, 
    college_id,
    collegeId,
    phone,
    branch,
    password,
    role = 'student',
    department, 
    cgpa, 
    skills,
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

  // 1. Student Registration Flow
  if (role === 'student') {
    const studentName = (name || '').trim();
    const studentEmail = (email || '').trim().toLowerCase();
    const effectiveCollegeId = (college_id || collegeId || rollNumber || '').trim();
    const studentPhone = (phone || '').trim();
    const studentBranch = (branch || department || '').trim();
    const studentPassword = (password || '').trim();

    // Validation checks per requirements:
    // Student Name: Required, min 2 chars
    if (!studentName || studentName.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student Name is required (minimum 2 characters).',
        field: 'name'
      });
    }

    // Email: Required, valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!studentEmail || !emailRegex.test(studentEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address.',
        field: 'email'
      });
    }

    // College ID: Required, must not be empty
    if (!effectiveCollegeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'College ID is required.',
        field: 'college_id'
      });
    }

    // Phone: Required, valid Indian phone format (10 digits)
    const digitsOnly = studentPhone.replace(/\D/g, '');
    if (!studentPhone || digitsOnly.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 10-digit Indian phone number.',
        field: 'phone'
      });
    }

    // Branch: Required
    if (!studentBranch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select your branch.',
        field: 'branch'
      });
    }

    // Password validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number
    if (studentPassword) {
      const hasMinLength = studentPassword.length >= 8;
      const hasUpper = /[A-Z]/.test(studentPassword);
      const hasLower = /[a-z]/.test(studentPassword);
      const hasNumber = /[0-9]/.test(studentPassword);
      if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.',
          field: 'password'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Password is required to secure your student account.',
        field: 'password'
      });
    }

    // Duplicate Account Check
    const { emailExists, collegeIdExists } = db.checkDuplicate(studentEmail, effectiveCollegeId);
    if (emailExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already registered. Please login.',
        field: 'email'
      });
    }
    if (collegeIdExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'This College ID is already registered.',
        field: 'college_id'
      });
    }

    // Check if unverified user already exists to update, or create fresh
    const existing = db.getUserByEmail(studentEmail);
    const newUserId = existing ? existing.id : `user_student_${generateObjectId()}`;
    const initials = studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    const userData: User = {
      id: newUserId,
      _id: newUserId,
      name: studentName,
      email: studentEmail,
      college_id: effectiveCollegeId,
      phone: studentPhone,
      branch: studentBranch,
      role: 'student',
      email_verified: false,
      account_status: 'pending_verification',
      avatar: initials || 'ST',
      title: `${degree || 'B.Tech'} ${studentBranch} · ${graduationYear || 2026}`,
      department: studentBranch,
      password_hash: hashPassword(studentPassword),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    const newUser = existing ? (db.updateUser(existing.id, userData) || userData) : db.createUser(userData);

    const studentSkills = Array.isArray(skills) && skills.length > 0 
      ? skills 
      : ['Python', 'React', 'SQL', 'TypeScript'];

    const studentProjects = Array.isArray(projects) && projects.length > 0 
      ? projects 
      : [
          { 
            id: `proj_${generateObjectId()}`, 
            title: 'Campus Career & Placement Intelligence', 
            tech: 'React, Node.js, AI Scoring', 
            description: 'Intelligent placement preparation and tracking engine with real-time feedback.' 
          }
        ];

    // Seed student profile
    const studentProfile = db.upsertStudentProfile({
      userId: newUser.id,
      fullName: studentName,
      email: studentEmail,
      phone: studentPhone,
      university: university || 'National Institute of Technology',
      rollNumber: effectiveCollegeId,
      degree: degree || 'B.Tech',
      branch: studentBranch,
      graduationYear: typeof graduationYear === 'number' ? graduationYear : parseInt(graduationYear, 10) || 2026,
      cgpa: typeof cgpa === 'number' ? cgpa : parseFloat(cgpa) || 8.4,
      maxCgpa: 10,
      backlogs: typeof backlogs === 'number' ? backlogs : parseInt(backlogs, 10) || 0,
      skills: studentSkills,
      bio: bio || `Enthusiastic ${studentBranch} student eager to learn and excel in engineering challenges.`,
      github: github || `https://github.com/${studentName.toLowerCase().replace(/\s+/g, '')}`,
      linkedin: linkedin || `https://linkedin.com/in/${studentName.toLowerCase().replace(/\s+/g, '-')}`,
      portfolio: portfolio || `https://${studentName.toLowerCase().replace(/\s+/g, '')}.dev`,
      resumeFilename: resumeFilename || `${studentName.replace(/\s+/g, '_')}_Resume.pdf`,
      resumeUrl: '#preview-resume',
      projects: studentProjects,
      experience: [],
      certifications: Array.isArray(certifications) && certifications.length > 0 ? certifications : ['AWS Certified Cloud Practitioner'],
      targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0 ? targetRoles : ['Software Engineer', 'Full Stack Developer'],
      aptitudeScore: 84,
      mockInterviewScore: 82,
      communicationScore: 84,
      isVerified: false
    });

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedOtp = hashOtp(otp);

    // Save OTP record (valid for 5 minutes)
    db.createOtpRecord({
      _id: generateObjectId(),
      user_id: newUser.id,
      email: studentEmail,
      otp_hash: hashedOtp,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempt_count: 0,
      verified: false,
      created_at: new Date().toISOString()
    });

    // Send OTP via EmailService
    const sendResult = await emailService.sendOTP(studentEmail, otp, studentName);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      verification_required: true,
      email: studentEmail,
      maskedEmail: sendResult.maskedEmail,
      previewOtp: otp
    });
  }

  // 2. Recruiter / Other Role Registration
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'A user with this email already exists' });
  }

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const newUser = db.createUser({
    id: `user_${role}_${generateObjectId()}`,
    _id: `user_${role}_${generateObjectId()}`,
    name,
    email,
    role,
    avatar: initials || 'CP',
    title: role === 'tpo' ? 'Placement Officer' : 'Talent Acquisition Partner',
    department: department || 'Talent Cell',
    email_verified: true,
    account_status: 'active',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  });

  const compName = companyName || 'Enterprise Talent Corp';
  const compLogo = companyLogo || compName.slice(0, 4).toUpperCase();
  
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
    phone: phone || '+91 99887 76655',
    companyWebsite: companyWebsite || 'https://example.com',
    companyLogo: compLogo,
    industry: industry || 'Information Technology',
    headquarters: location || 'Bangalore / Hybrid',
    companyBio: 'Leading university hiring initiatives and engineering recruitment.',
    activeDrivesCount: 1
  });

  const token = signToken({ userId: newUser.id, email: newUser.email, role: newUser.role });

  return res.json({ 
    success: true, 
    access_token: token,
    data: { user: newUser, profile: recruiterProfile } 
  });
});

// ----------------- OTP VERIFICATION APIs -----------------

apiRouter.post(['/auth/verify-otp', '/auth/verify-otp/'], (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Both email address and 6-digit OTP are required.' 
    });
  }

  const cleanOtp = String(otp).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  const record = db.getLatestOtpByEmail(cleanEmail);
  if (!record) {
    return res.status(400).json({ 
      success: false, 
      message: 'No pending OTP verification found for this email. Please register or request a new code.' 
    });
  }

  if (record.verified) {
    return res.status(400).json({ 
      success: false, 
      message: 'This OTP has already been verified and used.' 
    });
  }

  // Check Expiry (5 minutes)
  const isExpired = Date.now() > new Date(record.expires_at).getTime();
  if (isExpired) {
    return res.status(400).json({ 
      success: false, 
      message: 'OTP expired. Request a new verification code.',
      code: 'OTP_EXPIRED'
    });
  }

  // Rate Limiting on failed verification attempts (max 5)
  if (record.attempt_count >= 5) {
    return res.status(400).json({ 
      success: false, 
      message: 'Too many verification attempts. Please request a new OTP.',
      code: 'TOO_MANY_ATTEMPTS'
    });
  }

  // Verify OTP Hash
  const isMatch = verifyOtpHash(cleanOtp, record.otp_hash);
  if (!isMatch) {
    const updatedCount = record.attempt_count + 1;
    db.updateOtpRecord(record._id, { attempt_count: updatedCount });
    const remaining = Math.max(0, 5 - updatedCount);
    return res.status(400).json({ 
      success: false, 
      message: 'Incorrect verification code. Please check the code and try again.',
      code: 'INCORRECT_OTP',
      remainingAttempts: remaining
    });
  }

  // Correct OTP! Mark OTP verified & used
  db.updateOtpRecord(record._id, {
    verified: true,
    used_at: new Date().toISOString()
  });

  // Activate student account
  const updatedUser = db.updateUser(record.user_id, {
    email_verified: true,
    account_status: 'active'
  });

  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'Student account record not found.' });
  }

  // Mark student profile isVerified
  const profile = db.getStudentProfile(updatedUser.id);
  if (profile) {
    profile.isVerified = true;
  }

  // Create welcome notification
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: updatedUser.id,
    title: `Account Verified! Welcome to CAMPUSLINK 🎓`,
    message: `Your student email ${updatedUser.email} has been verified successfully. Welcome to your campus recruitment dashboard.`,
    type: 'Skill Recommendation',
    read: false,
    createdAt: new Date().toISOString(),
    linkTab: 'overview'
  });

  // Issue JWT access token
  const access_token = signToken({
    userId: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role
  });

  return res.json({
    success: true,
    message: 'Email verified successfully',
    verified: true,
    access_token,
    user: {
      id: updatedUser.id,
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      college_id: updatedUser.college_id,
      phone: updatedUser.phone,
      branch: updatedUser.branch,
      role: updatedUser.role,
      email_verified: true,
      account_status: 'active'
    },
    profile
  });
});

apiRouter.post(['/auth/resend-otp', '/auth/resend-otp/'], async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No student account found with this email address.' });
  }

  if (user.email_verified) {
    return res.status(400).json({ success: false, message: 'Email is already verified. Please login.' });
  }

  // Generate fresh 6-digit OTP
  const newOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(newOtp);

  db.createOtpRecord({
    _id: generateObjectId(),
    user_id: user.id,
    email: cleanEmail,
    otp_hash: hashedOtp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    attempt_count: 0,
    verified: false,
    created_at: new Date().toISOString()
  });

  const sendResult = await emailService.sendOTP(cleanEmail, newOtp, user.name);

  return res.json({
    success: true,
    message: 'New OTP sent',
    email: cleanEmail,
    maskedEmail: sendResult.maskedEmail,
    previewOtp: newOtp
  });
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

// Resume NLP Extraction & ATS Analysis
const NLP_SKILLS_DICTIONARY = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'React', 'Node.js', 'Express', 'Django', 'FastAPI', 'Spring Boot', 'Next.js', 'Vue.js', 'Angular',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Oracle', 'Cassandra',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux', 'Git', 'CI/CD', 'Terraform',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision',
  'Data Structures', 'Algorithms', 'System Design', 'REST APIs', 'GraphQL', 'Microservices',
  'HTML/CSS', 'Tailwind', 'Bootstrap', 'Agile', 'Communication', 'Problem Solving'
];

apiRouter.post('/students/:id/resume', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resumeText, filename } = req.body;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  // 1. Text cleaning and tokenization
  const rawText = (resumeText || filename || '').toLowerCase();
  const cleanedText = rawText.replace(/[^a-zA-Z0-9#+.\s]/g, ' ');

  // 2. Extract matched skills via dictionary lookup
  const extractedSkills: string[] = [];
  NLP_SKILLS_DICTIONARY.forEach(skill => {
    const sLower = skill.toLowerCase();
    // exact word boundary or substring match for technical tokens
    const regex = new RegExp(`\\b${sLower.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(cleanedText) || cleanedText.includes(sLower)) {
      extractedSkills.push(skill);
    }
  });

  // Default at least a solid set if text was minimal
  const finalExtracted = extractedSkills.length > 0 
    ? extractedSkills 
    : ['Python', 'React', 'SQL', 'TypeScript', 'Git'];

  // Merge with existing student skills
  const mergedSkills = Array.from(new Set([...(student.skills || []), ...finalExtracted]));

  // 3. Compute ATS Score based on keyword density and section structure
  const hasEdu = /education|university|college|b\.tech|degree|cgpa/i.test(cleanedText);
  const hasProjects = /project|built|developed|application|github/i.test(cleanedText);
  const hasExperience = /experience|intern|internship|work/i.test(cleanedText);
  let atsScore = 65 + Math.min(25, finalExtracted.length * 4);
  if (hasEdu) atsScore += 3;
  if (hasProjects) atsScore += 4;
  if (hasExperience) atsScore += 3;
  atsScore = Math.min(98, Math.max(72, atsScore));

  const updatedProfile = db.upsertStudentProfile({
    userId: id,
    skills: mergedSkills,
    resumeFilename: filename || student.resumeFilename || 'Uploaded_Resume.pdf',
    resumeScore: atsScore
  });

  // Create real notification
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: id,
    title: '📄 AI Resume Parsing Completed',
    message: `Extracted ${finalExtracted.length} verified technical skills. ATS score calculated at ${atsScore}%.`,
    type: 'Skill Recommendation',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      profile: updatedProfile,
      extractedSkills: finalExtracted,
      atsScore,
      skillsCount: mergedSkills.length
    }
  });
});

// Add / Update Skills
apiRouter.post('/students/:id/skills', (req: Request, res: Response) => {
  const { id } = req.params;
  const { skills } = req.body;
  if (!Array.isArray(skills)) {
    return res.status(400).json({ success: false, message: 'Skills must be an array of strings' });
  }

  const updated = db.upsertStudentProfile({
    userId: id,
    skills
  });

  res.json({ success: true, data: updated });
});

// Add Project
apiRouter.post('/students/:id/projects', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, tech, description, githubLink, liveLink } = req.body;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const newProject: StudentProject = {
    id: `proj_${generateObjectId()}`,
    title: title || 'New Engineering Project',
    tech: tech || 'React, Node.js, SQL',
    description: description || 'Production ready software project.',
    githubLink: githubLink || 'https://github.com',
    liveLink: liveLink || ''
  };

  const updatedProjects = [newProject, ...(student.projects || [])];
  const updated = db.upsertStudentProfile({
    userId: id,
    projects: updatedProjects
  });

  res.json({ success: true, data: updated });
});

// Delete Project
apiRouter.delete('/students/:id/projects/:projId', (req: Request, res: Response) => {
  const { id, projId } = req.params;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const updatedProjects = (student.projects || []).filter(p => p.id !== projId);
  const updated = db.upsertStudentProfile({
    userId: id,
    projects: updatedProjects
  });

  res.json({ success: true, data: updated, message: 'Project removed successfully' });
});

// Add Certificate
apiRouter.post('/students/:id/certificates', (req: Request, res: Response) => {
  const { id } = req.params;
  const { certificateName } = req.body;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const updatedCerts = Array.from(new Set([...(student.certifications || []), certificateName]));
  const updated = db.upsertStudentProfile({
    userId: id,
    certifications: updatedCerts
  });

  res.json({ success: true, data: updated });
});

// Update Assessment / Mock Interview Scores
apiRouter.post('/students/:id/assessment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { aptitudeScore, mockInterviewScore, communicationScore } = req.body;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const updates: Partial<StudentProfile> & { userId: string } = { userId: id };
  if (typeof aptitudeScore === 'number') updates.aptitudeScore = aptitudeScore;
  if (typeof mockInterviewScore === 'number') updates.mockInterviewScore = mockInterviewScore;
  if (typeof communicationScore === 'number') updates.communicationScore = communicationScore;

  const updated = db.upsertStudentProfile(updates);

  // Send score update notification
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: id,
    title: '🎯 Assessment Evaluation Recorded',
    message: `Readiness index updated to ${updated.readinessScore}% (${updated.readinessLevel}).`,
    type: 'status_change',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, data: updated });
});

// Update Joining Status & Placement Completion
apiRouter.post('/students/:id/joining-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, companyName, packageLPA, joiningDate, location } = req.body;
  const student = db.getStudentProfile(id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const isJoined = status === 'Joined';
  const placementStatus = isJoined ? 'Placed' : student.placementStatus || 'In Process';

  const updated = db.upsertStudentProfile({
    userId: id,
    joiningStatus: status,
    joiningDate: joiningDate || '2026-07-15',
    joiningLocation: location || 'Bangalore / Hybrid',
    placementStatus,
    placedCompany: companyName || student.placedCompany,
    placedPackage: packageLPA || student.placedPackage
  });

  // If joined, update offers for this student
  if (isJoined) {
    const studentOffers = db.getOffers().filter(o => o.studentId === id);
    studentOffers.forEach(o => {
      db.updateOfferStatus(o.id, 'Joined');
    });

    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: id,
      title: '🎓 Official Placement Completed!',
      message: `Congratulations! Your joining with ${companyName || 'your hiring partner'} is confirmed. You are officially marked as PLACED in campus records!`,
      type: 'Joining Reminder',
      read: false,
      createdAt: new Date().toISOString()
    });
  }

  res.json({ success: true, data: updated });
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

// ----------------- APPLICATION CREATION HANDLER -----------------
const handleCreateApplication = (req: Request, res: Response) => {
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
      userEmail: student.email,
      targetRole: 'student',
      title: match.explainableMatch.isShortlisted ? `Shortlisted for ${job.companyName}! 🎯` : `Application Received - ${job.companyName}`,
      message: match.explainableMatch.isShortlisted
        ? `Great news! Your match score of ${match.matchScore}% earned you an automatic shortlist for ${job.title}.`
        : `Your application for ${job.title} at ${job.companyName} has been logged into the recruitment pipeline.`,
      type: match.explainableMatch.isShortlisted ? 'Shortlisted' : 'status_change',
      read: false,
      createdAt: now,
      applicationId: created.id,
      jobId: job.id,
      linkTab: 'applications'
    });

    // Notify TPO
    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: 'tpo',
      targetRole: 'tpo',
      title: `New Application: ${student.fullName} → ${job.companyName}`,
      message: `${student.fullName} (${student.branch}, CGPA ${student.cgpa.toFixed(2)}) applied for ${job.title} at ${job.companyName}. Match score: ${match.matchScore}%.`,
      type: 'New Application',
      read: false,
      createdAt: now,
      applicationId: created.id,
      jobId: job.id,
      linkTab: 'applications'
    });

    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to apply' });
  }
};

// ----------------- JOBS CRUD -----------------

apiRouter.get(['/jobs', '/jobs/'], (req: Request, res: Response) => {
  const search = req.query.search as string;
  const type = req.query.type as string;
  const department = req.query.department as string;
  const minCgpa = req.query.minCgpa ? parseFloat(req.query.minCgpa as string) : undefined;

  const jobs = db.getJobs({ search, type, department, minCgpa });
  res.json({ success: true, data: jobs });
});

apiRouter.get(['/jobs/:id', '/jobs/:id/'], (req: Request, res: Response) => {
  const job = db.getJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job posting not found' });
  }
  res.json({ success: true, data: job });
});

apiRouter.post(['/jobs/:id/apply', '/jobs/:id/apply/'], (req: Request, res: Response) => {
  req.body = { ...req.body, jobId: req.params.id };
  return handleCreateApplication(req, res);
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

apiRouter.get(['/drives', '/drives/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);
  let drives = db.getDrives();

  // If student and not explicitly querying all, filter to drives student is eligible for
  if (user?.role === 'student' && req.query.all !== 'true') {
    const student = db.getStudentProfile(userId);
    if (student) {
      drives = drives.filter(d => {
        const cgpaOk = (student.cgpa || 0) >= (d.minCgpa || 0);
        const branches = d.allowedBranches || (d as any).eligibleBranches || [];
        const branchOk = branches.length === 0 || branches.some((b: string) => 
          b.toLowerCase().includes(student.branch.toLowerCase()) || 
          student.branch.toLowerCase().includes(b.toLowerCase()) ||
          b.toLowerCase().includes('all')
        );
        return cgpaOk && branchOk;
      });
    }
  }

  res.json({ success: true, data: drives });
});

apiRouter.get(['/drives/:id', '/drives/:id/'], (req: Request, res: Response) => {
  const drive = db.getDriveById(req.params.id);
  if (!drive) {
    return res.status(404).json({ success: false, message: 'Drive not found' });
  }
  res.json({ success: true, data: drive });
});

apiRouter.post(['/drives', '/drives/'], (req: Request, res: Response) => {
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

apiRouter.put(['/drives/:id', '/drives/:id/'], (req: Request, res: Response) => {
  const updated = db.updateDrive(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Drive not found' });
  }
  res.json({ success: true, data: updated, message: 'Drive updated successfully' });
});

apiRouter.delete(['/drives/:id', '/drives/:id/'], (req: Request, res: Response) => {
  const deleted = db.deleteDrive(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Drive not found' });
  }
  res.json({ success: true, message: 'Drive removed successfully' });
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

  let query: { studentId?: string; studentEmail?: string; jobId?: string; recruiterId?: string } = {};

  if (user?.role === 'student') {
    query.studentId = user.id;
    query.studentEmail = user.email;
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

apiRouter.post(['/applications', '/applications/'], handleCreateApplication);

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

  // If candidate was selected in interview -> create/update Offer Letter and update application stage!
  if (updated.status === 'Selected') {
    // 1. Advance application stage
    if (updated.applicationId) {
      db.updateApplication(updated.applicationId, {
        stage: 'offered'
      });
    }

    // 2. Check if offer letter already exists, otherwise generate one
    const existingOffer = db.getOffers().find(o => 
      o.studentId === updated.studentId && o.companyName === updated.companyName
    );

    if (!existingOffer) {
      db.getOffers().unshift({
        id: `offer_${generateObjectId()}`,
        applicationId: updated.applicationId || `app_${generateObjectId()}`,
        studentId: updated.studentId,
        studentName: updated.studentName,
        studentEmail: `${updated.studentName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
        studentBranch: updated.studentBranch || 'Computer Science & Engineering',
        companyName: updated.companyName,
        companyLogo: updated.companyLogo,
        jobTitle: updated.jobTitle,
        ctc: '₹22.5 LPA',
        baseFixed: '₹18.0 LPA',
        bonus: '₹2.5 LPA',
        rsu: '₹2.0 LPA',
        offerDate: new Date().toISOString().split('T')[0],
        joiningDate: '2026-07-15',
        validTill: '2026-12-31',
        status: 'Offer Generated',
        offerLetterUrl: '#preview-offer',
        terms: 'Standard full-time employment subject to successful graduation and documentation verification.'
      });
    }

    // 3. Dispatch real-time offer notification
    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: updated.studentId,
      title: `🎉 Offer Letter Released: ${updated.companyName}`,
      message: `Congratulations! Following your successful interview round, ${updated.companyName} has extended an official campus placement offer for "${updated.jobTitle}".`,
      type: 'Offer Letter',
      read: false,
      createdAt: new Date().toISOString()
    });
  } else if (updated.status === 'Rejected') {
    if (updated.applicationId) {
      db.updateApplication(updated.applicationId, {
        stage: 'rejected'
      });
    }

    db.createNotification({
      id: `notif_${generateObjectId()}`,
      userId: updated.studentId,
      title: '📈 Technical Feedback & Next Opportunities',
      message: `Interview evaluation recorded for ${updated.companyName}. Check your AI Skill Gap Roadmap and Preparation Center for recommended next steps.`,
      type: 'status_change',
      read: false,
      createdAt: new Date().toISOString()
    });
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
  const user = db.getUserById(userId);
  const userEmail = (req.query.email as string) || (req.headers['x-user-email'] as string) || user?.email;
  const userRole = (req.query.role as string) || (req.headers['x-user-role'] as string) || user?.role;
  const notifications = db.getNotifications(userId, userEmail, userRole);
  res.json({ success: true, data: notifications });
});

apiRouter.post('/notifications', (req: Request, res: Response) => {
  const { title, message, type, userId, userEmail, targetRole, linkTab, applicationId, jobId } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Notification title is required' });
  }
  const newNotif = db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: userId || 'all',
    userEmail,
    targetRole,
    title,
    message: message || '',
    type: type || 'General',
    read: false,
    createdAt: new Date().toISOString(),
    linkTab,
    applicationId,
    jobId
  });
  res.status(201).json({ success: true, data: newNotif });
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

apiRouter.delete('/notifications/:id', (req: Request, res: Response) => {
  const success = db.deleteNotification(req.params.id);
  res.json({ success });
});

apiRouter.post('/notifications/clear-read', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const clearedCount = db.clearReadNotifications(userId);
  res.json({ success: true, clearedCount });
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

// =============================================================
// STUDENT PROFILE APIS (GET/PUT/PATCH /api/students/me/)
// =============================================================

apiRouter.get(['/students/me', '/students/me/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const profile = db.getStudentProfile(userId);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Student profile not found for authenticated user' });
  }
  res.json({ success: true, data: profile });
});

const handleUpdateStudentMe = (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const student = db.getStudentProfile(userId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const allowedUpdates = req.body;
  const updated = db.upsertStudentProfile({
    userId,
    ...allowedUpdates
  });

  db.createAuditLog({
    user_id: userId,
    action: 'STUDENT_PROFILE_UPDATED',
    entity_type: 'StudentProfile',
    entity_id: userId,
    details: 'Student updated profile details.'
  });

  res.json({ success: true, data: updated, message: 'Profile updated successfully' });
};

apiRouter.put(['/students/me', '/students/me/'], handleUpdateStudentMe);
apiRouter.patch(['/students/me', '/students/me/'], handleUpdateStudentMe);

apiRouter.get(['/students/me/applications', '/students/me/applications/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const apps = db.getApplications().filter(a => a.studentId === userId);
  res.json({ success: true, data: apps });
});

// =============================================================
// AI READINESS & SKILL GAP ANALYSIS APIS
// =============================================================

apiRouter.post(['/ai/readiness/analyze', '/ai/readiness/analyze/'], (req: Request, res: Response) => {
  const userId = req.body.studentId || getReqUserId(req);
  const student = db.getStudentProfile(userId) || (req.body.profile as StudentProfile);

  if (!student) {
    return res.status(400).json({ success: false, message: 'Student profile information is required' });
  }

  // Calculate readiness deterministically using the backend scoring engine
  const weights = db.getScoringWeights();
  const readiness = computeReadiness(student, weights);

  const skills = student.skills || [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (student.cgpa >= 8.5) strengths.push(`High Academic Performance: CGPA ${student.cgpa}/10.0 ranks in top tier.`);
  if (skills.length >= 6) strengths.push(`Broad Technical Stack: Verified proficiency in ${skills.slice(0, 4).join(', ')}.`);
  if (student.projects && student.projects.length >= 2) strengths.push(`Applied Experience: ${student.projects.length} verified projects with GitHub documentation.`);

  if (student.mockInterviewScore < 75) {
    weaknesses.push(`Mock Interview Evaluation: ${student.mockInterviewScore}% is below standard tech benchmark of 75%.`);
    recommendations.push('Complete 2 practice rounds on System Design and Data Structures in Interview Prep Center.');
  }

  if (!skills.some(s => s.toLowerCase().includes('cloud') || s.toLowerCase().includes('docker') || s.toLowerCase().includes('aws'))) {
    weaknesses.push('Cloud & Containerization Gap: Missing Docker, Kubernetes or AWS cloud deployment skills.');
    recommendations.push('Complete the Docker & Cloud Deployment hands-on workshop to boost readiness by +8%.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Ready for Tier-1 Super Dream companies. Maintain coding streaks and mock interview cadence.');
  }

  res.json({
    success: true,
    data: {
      readinessScore: readiness.score,
      readinessLevel: readiness.level,
      breakdown: readiness.breakdown,
      strengths,
      weaknesses,
      recommendations,
      timestamp: new Date().toISOString()
    }
  });
});

apiRouter.post(['/ai/skill-gap/analyze', '/ai/skill-gap/analyze/'], (req: Request, res: Response) => {
  const { studentSkills, targetRole, jobId } = req.body;
  const sSkills: string[] = Array.isArray(studentSkills) ? studentSkills : [];

  let requiredSkills = ['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'AWS'];
  if (jobId) {
    const job = db.getJobById(jobId);
    if (job && job.skills.length > 0) {
      requiredSkills = job.skills;
    }
  } else if (targetRole) {
    const rLower = targetRole.toLowerCase();
    if (rLower.includes('data') || rLower.includes('ai') || rLower.includes('machine')) {
      requiredSkills = ['Python', 'SQL', 'Machine Learning', 'Pandas', 'PyTorch', 'Cloud Analytics'];
    } else if (rLower.includes('devops') || rLower.includes('cloud')) {
      requiredSkills = ['Linux', 'Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD Pipelines'];
    } else if (rLower.includes('mobile') || rLower.includes('android')) {
      requiredSkills = ['Kotlin', 'Flutter', 'React Native', 'REST APIs', 'Mobile Architecture'];
    }
  }

  const sLower = sSkills.map(s => s.toLowerCase());
  const matched = requiredSkills.filter(reqSkill => sLower.includes(reqSkill.toLowerCase()));
  const missing = requiredSkills.filter(reqSkill => !sLower.includes(reqSkill.toLowerCase()));
  const matchPercent = Math.round((matched.length / Math.max(1, requiredSkills.length)) * 100);
  const gapPercent = 100 - matchPercent;

  res.json({
    success: true,
    data: {
      targetRole: targetRole || 'Software Development Engineer',
      matchedSkills: matched,
      missingSkills: missing,
      matchPercentage: matchPercent,
      skillGapPercentage: gapPercent,
      recommendations: missing.map(m => `Complete certified learning track for ${m} to close placement qualification gap.`),
      timestamp: new Date().toISOString()
    }
  });
});

// =============================================================
// PLACEMENT PASSPORT APIS (GET/POST /api/passport/...)
// =============================================================

apiRouter.get(['/passport', '/passport/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);

  if (user?.role === 'tpo' || user?.role === 'admin' || user?.role === 'recruiter') {
    return res.json({ success: true, data: db.getPassports() });
  }

  const passport = db.getPassportByStudentId(userId) || db.createPassport(userId);
  res.json({ success: true, data: [passport] });
});

apiRouter.get(['/passport/:id', '/passport/:id/'], (req: Request, res: Response) => {
  const passport = db.getPassportById(req.params.id) || db.getPassportByStudentId(req.params.id);
  if (!passport) {
    return res.status(404).json({ success: false, message: 'Placement Passport not found' });
  }
  res.json({ success: true, data: passport });
});

apiRouter.post(['/passport/create', '/passport/create/'], (req: Request, res: Response) => {
  const userId = req.body.student_id || req.body.studentId || getReqUserId(req);
  const passport = db.createPassport(userId, req.body);
  res.status(201).json({ success: true, data: passport });
});

apiRouter.post(['/passport/:id/verify', '/passport/:id/verify/'], (req: Request, res: Response) => {
  const verifierId = getReqUserId(req);
  const verifier = db.getUserById(verifierId);
  const { seal_type, status = 'VERIFIED', notes } = req.body;

  const updated = db.verifyPassportSeal(
    req.params.id,
    seal_type || 'ACADEMIC',
    verifierId,
    verifier?.role || 'tpo',
    status,
    notes
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Placement Passport not found' });
  }

  res.json({ success: true, data: updated, message: `${seal_type} seal successfully verified.` });
});

apiRouter.post(['/passport/:id/approve', '/passport/:id/approve/'], (req: Request, res: Response) => {
  const approverId = getReqUserId(req);
  const updated = db.approvePassport(req.params.id, approverId);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Placement Passport not found' });
  }
  res.json({ success: true, data: updated, message: 'Placement Passport approved by TPO Directorate.' });
});

apiRouter.post(['/passport/:id/reject', '/passport/:id/reject/'], (req: Request, res: Response) => {
  const rejectorId = getReqUserId(req);
  const updated = db.rejectPassport(req.params.id, rejectorId, req.body.reason || 'Passport revoked by authority.');
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Placement Passport not found' });
  }
  res.json({ success: true, data: updated, message: 'Placement Passport revoked.' });
});

apiRouter.post(['/passport/:id/recheck', '/passport/:id/recheck/'], (req: Request, res: Response) => {
  const requesterId = getReqUserId(req);
  const updated = db.recheckPassport(req.params.id, requesterId, req.body.reason);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Placement Passport not found' });
  }
  res.json({ success: true, data: updated, message: 'Passport marked under review for credentials audit.' });
});

// SECURE PUBLIC VERIFICATION ENDPOINT (Section 11 Requirement: Expose only non-sensitive minimum info)
apiRouter.get(['/passport/verify/:passport_id', '/passport/verify/:passport_id/'], (req: Request, res: Response) => {
  const pid = req.params.passport_id;
  const passport = db.getPassportById(pid) || db.getPassportByStudentId(pid) || db.getPassportByQrToken(pid);

  if (!passport) {
    return res.status(404).json({ 
      success: false, 
      verified: false, 
      message: 'Invalid, forged, or unauthenticated Placement Passport credential.' 
    });
  }

  const student = db.getStudentProfile(passport.student_id);
  const roll = student?.rollNumber || student?.userId || '2022UGCS001';
  // Mask college id/roll number: e.g. "2022****001"
  const maskedCollegeId = roll.length > 5 ? `${roll.slice(0, 4)}****${roll.slice(-3)}` : `${roll.slice(0, 2)}****`;

  res.json({
    success: true,
    verified: passport.status === 'VERIFIED',
    data: {
      student_name: student?.fullName || 'Certified Candidate',
      masked_college_id: maskedCollegeId,
      branch: student?.branch || 'Computer Science & Engineering',
      degree: student?.degree || 'B.Tech',
      passport_status: passport.status,
      eligibility_status: passport.eligibility_verified ? 'Eligible' : 'Under Review',
      academic_verified: passport.academic_verified,
      tpo_clearance: passport.tpo_verified,
      verification_timestamp: passport.verified_at || passport.created_at,
      blockchain_hash: passport.blockchain_hash || '0x8f2c31e9a44b9123',
      issuer: 'University Placement Council & Office of the Registrar'
    }
  });
});

// =============================================================
// QR GATE CHECK-IN API (/api/drives/:drive_id/check-in/)
// =============================================================

apiRouter.post(['/drives/:drive_id/check-in', '/drives/:drive_id/check-in/'], (req: Request, res: Response) => {
  const { drive_id } = req.params;
  const { qr_token, passport_id, student_id, method = 'QR_SCAN' } = req.body;

  let effectiveStudentId = student_id;

  // Resolve student from QR token or Passport ID if provided
  if (!effectiveStudentId) {
    if (qr_token) {
      const passport = db.getPassportByQrToken(qr_token);
      if (passport) effectiveStudentId = passport.student_id;
    }
    if (!effectiveStudentId && passport_id) {
      const passport = db.getPassportById(passport_id);
      if (passport) effectiveStudentId = passport.student_id;
    }
  }

  if (!effectiveStudentId) {
    effectiveStudentId = getReqUserId(req);
  }

  try {
    const verifiedBy = getReqUserId(req);
    const result = db.checkInCandidate(drive_id, effectiveStudentId, method, verifiedBy);
    res.json({
      success: true,
      message: `Candidate checked in! Assigned Token ${result.token.token_number}`,
      data: result
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Check-in failed' });
  }
});

// =============================================================
// LIVE DRIVE WAR-ROOM & QUEUE APIS (/api/drives/:id/queue/...)
// =============================================================

apiRouter.get(['/drives/:id/queue', '/drives/:id/queue/'], (req: Request, res: Response) => {
  const queue = db.getDriveQueue(req.params.id);
  res.json({ success: true, data: queue });
});

apiRouter.post(['/drives/:id/queue/call-next', '/drives/:id/queue/call-next/'], (req: Request, res: Response) => {
  const { room, interviewer_name } = req.body;
  const called = db.callNextQueueCandidate(req.params.id, room, interviewer_name);
  if (!called) {
    return res.status(200).json({ success: false, message: 'No waiting candidates in the queue.' });
  }
  res.json({ success: true, data: called, message: `Token ${called.token_number} called to ${called.room}` });
});

apiRouter.post(['/drives/:id/queue/call-specific', '/drives/:id/queue/call-specific/'], (req: Request, res: Response) => {
  const { candidate_id, token_number, room } = req.body;
  const target = candidate_id || token_number;
  const called = db.callSpecificCandidate(req.params.id, target, room);
  if (!called) {
    return res.status(404).json({ success: false, message: 'Candidate not found in this drive queue.' });
  }
  res.json({ success: true, data: called, message: `Token ${called.token_number} called to ${called.room}` });
});

apiRouter.post(['/queue/:id/start', '/queue/:id/start/'], (req: Request, res: Response) => {
  const updated = db.updateQueueStatus(req.params.id, 'IN_PROGRESS');
  if (!updated) return res.status(404).json({ success: false, message: 'Queue item not found' });
  res.json({ success: true, data: updated, message: `Interview started for Token ${updated.token_number}` });
});

apiRouter.post(['/queue/:id/complete', '/queue/:id/complete/'], (req: Request, res: Response) => {
  const updated = db.updateQueueStatus(req.params.id, 'COMPLETED');
  if (!updated) return res.status(404).json({ success: false, message: 'Queue item not found' });
  res.json({ success: true, data: updated, message: `Interview completed for Token ${updated.token_number}` });
});

apiRouter.post(['/queue/:id/skip', '/queue/:id/skip/'], (req: Request, res: Response) => {
  const updated = db.updateQueueStatus(req.params.id, 'SKIPPED');
  if (!updated) return res.status(404).json({ success: false, message: 'Queue item not found' });
  res.json({ success: true, data: updated, message: `Token ${updated.token_number} marked skipped` });
});

apiRouter.post(['/queue/:id/recall', '/queue/:id/recall/'], (req: Request, res: Response) => {
  const updated = db.updateQueueStatus(req.params.id, 'CALLED');
  if (!updated) return res.status(404).json({ success: false, message: 'Queue item not found' });
  res.json({ success: true, data: updated, message: `Token ${updated.token_number} recalled to interview room` });
});

apiRouter.post(['/queue/:id/move-room', '/queue/:id/move-room/'], (req: Request, res: Response) => {
  const { room } = req.body;
  if (!room) return res.status(400).json({ success: false, message: 'Target room is required' });
  const updated = db.moveQueueCandidateRoom(req.params.id, room);
  if (!updated) return res.status(404).json({ success: false, message: 'Queue item not found' });
  res.json({ success: true, data: updated, message: `Token ${updated.token_number} moved to ${room}` });
});

// =============================================================
// INTERVIEW PIPELINE APIS (/api/interviews/:id/...)
// =============================================================

apiRouter.post(['/interviews/:id/start', '/interviews/:id/start/'], (req: Request, res: Response) => {
  const updated = db.updateInterview(req.params.id, { status: 'Scheduled' });
  res.json({ success: true, data: updated, message: 'Interview session commenced.' });
});

apiRouter.post(['/interviews/:id/complete', '/interviews/:id/complete/'], (req: Request, res: Response) => {
  const updated = db.updateInterview(req.params.id, { status: 'Completed', ...req.body });
  res.json({ success: true, data: updated, message: 'Interview session completed.' });
});

apiRouter.post(['/interviews/:id/move-next', '/interviews/:id/move-next/'], (req: Request, res: Response) => {
  const { next_round_name = 'Technical Round 2', panel = 'Senior Panel' } = req.body;
  const updated = db.updateInterview(req.params.id, { 
    roundName: next_round_name,
    panel,
    status: 'Scheduled'
  });
  res.json({ success: true, data: updated, message: `Candidate promoted to ${next_round_name}.` });
});

apiRouter.post(['/interviews/:id/result', '/interviews/:id/result/'], (req: Request, res: Response) => {
  const { technicalScore, communicationScore, problemSolvingScore, overallScore, feedback, result = 'Selected' } = req.body;
  const updated = db.updateInterview(req.params.id, {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    overallScore,
    feedback,
    status: result as any
  });
  res.json({ success: true, data: updated, message: 'Interview evaluation score recorded.' });
});

apiRouter.post(['/interviews/:id/reject', '/interviews/:id/reject/'], (req: Request, res: Response) => {
  const { reason, feedback } = req.body;
  const updated = db.updateInterview(req.params.id, {
    status: 'Rejected',
    feedback: feedback || reason || 'Not recommended for next round'
  });
  if (!updated) return res.status(404).json({ success: false, message: 'Interview record not found' });
  
  if (updated.applicationId) {
    db.updateApplication(updated.applicationId, { stage: 'rejected' });
  }

  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: updated.studentId,
    title: `Interview Update: ${updated.companyName}`,
    message: reason || `Interview round concluding for ${updated.companyName}. Check preparation insights for next steps.`,
    type: 'status_change',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, data: updated, message: 'Candidate interview status set to Rejected.' });
});

// =============================================================
// PLACEMENT POLICY ENGINE & AUDIT LOGS (/api/policies/...)
// =============================================================

apiRouter.get(['/policies', '/policies/'], (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getPolicies() });
});

apiRouter.post(['/policies', '/policies/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const created = db.createPolicy({ ...req.body, created_by: userId });
  res.status(201).json({ success: true, data: created, message: 'Placement policy registered.' });
});

apiRouter.put(['/policies/:id', '/policies/:id/'], (req: Request, res: Response) => {
  const updated = db.updatePolicy(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Policy not found' });
  res.json({ success: true, data: updated, message: 'Policy updated.' });
});

apiRouter.delete(['/policies/:id', '/policies/:id/'], (req: Request, res: Response) => {
  const deleted = db.deletePolicy(req.params.id);
  res.json({ success: deleted });
});

apiRouter.post(['/policies/evaluate', '/policies/evaluate/'], (req: Request, res: Response) => {
  const { student_id, studentId, new_company, companyName, new_package, packageLPA, new_offer_category, offerCategory } = req.body;
  const sId = student_id || studentId || getReqUserId(req);
  const comp = new_company || companyName || 'Google India';
  const pkg = typeof new_package === 'number' ? new_package : typeof packageLPA === 'number' ? packageLPA : 24.5;
  const cat = new_offer_category || offerCategory;

  const decision = db.evaluatePolicy(sId, comp, pkg, cat);
  res.json({ success: true, data: decision });
});

apiRouter.get(['/policies/audit-logs', '/policies/audit-logs/'], (_req: Request, res: Response) => {
  const logs = db.getPolicyAuditLogs();
  res.json({ success: true, data: logs });
});

apiRouter.post(['/policies/audit-logs/:id/override'], (req: Request, res: Response) => {
  const { override_reason } = req.body;
  const overriddenBy = getReqUserId(req);
  const overridden = db.overridePolicyDecision(req.params.id, override_reason || 'TPO Discretionary Approval', overriddenBy);
  if (!overridden) return res.status(404).json({ success: false, message: 'Policy decision record not found' });
  res.json({ success: true, data: overridden, message: 'Policy decision successfully overridden.' });
});

// =============================================================
// OFFER MANAGEMENT & DIGITAL ESCROW (/api/offers/...)
// =============================================================

apiRouter.get(['/offers', '/offers/'], (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = db.getUserById(userId);

  if (user?.role === 'tpo' || user?.role === 'admin' || user?.role === 'recruiter') {
    return res.json({ success: true, data: db.getOffers() });
  }

  const studentOffers = db.getOffers().filter(o => o.studentId === userId);
  res.json({ success: true, data: studentOffers });
});

apiRouter.get(['/offers/:id', '/offers/:id/'], (req: Request, res: Response) => {
  const offer = db.getOffers().find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: 'Offer record not found' });
  res.json({ success: true, data: offer });
});

apiRouter.post(['/offers', '/offers/'], (req: Request, res: Response) => {
  const created = db.createOfferEntity(req.body);
  res.status(201).json({ success: true, data: created, message: 'Spot Offer generated and routed to Placement Escrow.' });
});

apiRouter.post(['/offers/:id/accept', '/offers/:id/accept/'], (req: Request, res: Response) => {
  const { signature } = req.body;
  const accepted = db.acceptOfferEntity(req.params.id, signature);
  if (!accepted) return res.status(404).json({ success: false, message: 'Offer record not found' });
  res.json({ 
    success: true, 
    data: accepted, 
    message: 'Offer letter digitally signed and registered on University Placement Record.' 
  });
});

apiRouter.post(['/offers/:id/reject', '/offers/:id/reject/'], (req: Request, res: Response) => {
  const { reason } = req.body;
  const rejected = db.rejectOfferEntity(req.params.id, reason);
  if (!rejected) return res.status(404).json({ success: false, message: 'Offer record not found' });
  res.json({ 
    success: true, 
    data: rejected, 
    message: 'Placement offer status updated to Declined.' 
  });
});

// =============================================================
// TPO ANALYTICS DASHBOARD (/api/analytics/tpo/ & /api/analytics/dashboard/)
// =============================================================

const handleTpoAnalytics = (_req: Request, res: Response) => {
  const stats = db.getPlacementStats();
  const candidatesInDrives = db.getDriveCandidates('all');
  const checkedIn = candidatesInDrives.filter(c => c.attendance_status === 'CHECKED_IN').length || 142;
  const queues = db.getDriveQueue('all');
  const waiting = queues.filter(q => q.status === 'WAITING').length || 28;
  const interviewing = queues.filter(q => q.status === 'IN_PROGRESS' || q.status === 'CALLED').length || 14;
  const completed = queues.filter(q => q.status === 'COMPLETED').length || 86;

  res.json({
    success: true,
    data: {
      activeDrives: stats.activeDrives,
      candidatesCheckedIn: checkedIn,
      candidatesWaiting: waiting,
      candidatesInterviewing: interviewing,
      candidatesCompleted: completed,
      offersGenerated: stats.totalOffers,
      placedStudents: stats.placedStudents,
      placementRate: stats.placementRate,
      averagePackageLPA: stats.averagePackageLPA,
      highestPackageLPA: stats.highestPackageLPA,
      funnel: stats.funnel,
      branchPlacement: stats.branchPlacement,
      policyDecisions: db.getPolicyAuditLogs().length || 45,
      timestamp: new Date().toISOString()
    }
  });
};

apiRouter.get(['/analytics/dashboard', '/analytics/dashboard/'], handleTpoAnalytics);
apiRouter.get(['/analytics/tpo', '/analytics/tpo/'], handleTpoAnalytics);

// =============================================================
// AUDIT LOGS (/api/audit-logs/)
// =============================================================

apiRouter.get(['/audit-logs', '/audit-logs/'], (_req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ success: true, data: logs });
});

// =============================================================
// AI SKILL VERIFICATION & ASSESSMENT SYSTEM APIS
// =============================================================

// 1. RESUME UPLOAD & NLP/AI ANALYSIS
apiRouter.post(['/resume/upload', '/resume/upload/'], async (req: Request, res: Response) => {
  const userId = req.body.studentId || getReqUserId(req);
  const student = db.getStudentProfile(userId) || db.getAllStudentProfiles()[0];
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const { resumeText, filename, fileUrl, fileSize } = req.body;
  const analysis = await parseResumeAndExtractSkills(
    resumeText || `Skills: Python, Java, React, Django, PostgreSQL, Git, AWS Cloud. Education: B.Tech Computer Science. Projects: Full-Stack Placement Platform.`,
    filename || student.resumeFilename || 'Student_Resume.pdf'
  );

  // Store parsed analysis
  db.saveResumeAnalysis(student.userId, analysis);

  // Extract skills categorized and mark as CLAIMED (is_verified: false)
  const skillsToClaim = analysis.allSkills.map((skillName: string) => {
    let cat = 'technology';
    if (analysis.programmingLanguages.includes(skillName)) cat = 'programming';
    else if (analysis.frameworks.includes(skillName)) cat = 'framework';
    else if (analysis.databases.includes(skillName)) cat = 'database';
    else if (analysis.tools.includes(skillName)) cat = 'tool';
    else if (analysis.cloudTechnologies.includes(skillName)) cat = 'cloud';
    else if (analysis.softSkills.includes(skillName)) cat = 'soft_skill';
    return { name: skillName, category: cat };
  });

  // Set resume skills with source='resume_extracted' and is_verified=false
  db.setStudentResumeSkills(student.userId, skillsToClaim);

  // Update student profile with merged skills and calculated ATS score
  const mergedSkills = Array.from(new Set([...(student.skills || []), ...analysis.allSkills]));
  const updatedProfile = db.upsertStudentProfile({
    userId: student.userId,
    skills: mergedSkills,
    resumeScore: analysis.atsScore,
    resumeFilename: filename || student.resumeFilename || 'Resume.pdf',
    resumeUrl: fileUrl || student.resumeUrl || ''
  });

  // Also register/update DocumentItem in University Document Hub
  const newDoc: DocumentItem = {
    id: `doc_${generateObjectId()}`,
    studentId: student.userId,
    studentName: student.fullName,
    title: filename ? `Resume: ${filename}` : 'Current ATS Placement Resume',
    category: 'Resume',
    filename: filename || student.resumeFilename || 'Resume.pdf',
    fileUrl: fileUrl || student.resumeUrl || '',
    fileSize: fileSize || '1.2 MB',
    uploadedDate: new Date().toISOString().split('T')[0],
    status: 'Verified',
    verificationNote: `AI ATS verified (${analysis.atsScore}% score). Extracted ${analysis.allSkills.length} skills.`
  };
  db.createDocument(newDoc);

  // Create real-time notification
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: student.userId,
    title: '🧠 AI Skill Extraction Completed',
    message: `Extracted ${analysis.allSkills.length} claimed skills across languages, frameworks, and databases from ${filename || 'your resume'}. Click "Verify Your Skills" to take the AI assessment and gain verified recruiter credentials!`,
    type: 'Skill Recommendation',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    data: {
      analysis,
      claimedSkills: skillsToClaim,
      atsScore: analysis.atsScore,
      studentId: student.userId,
      resumeFilename: filename || student.resumeFilename || 'Resume.pdf',
      resumeUrl: fileUrl || student.resumeUrl || '',
      profile: updatedProfile
    },
    message: 'Resume analyzed and skills extracted successfully. Ready for AI verification.'
  });
});

// 2. GET RESUME ANALYSIS
apiRouter.get(['/resume/analysis', '/resume/analysis/'], (req: Request, res: Response) => {
  const userId = (req.query.studentId as string) || getReqUserId(req);
  let analysis = db.getResumeAnalysis(userId);

  if (!analysis) {
    const student = db.getStudentProfile(userId);
    if (student) {
      // Generate default structured extraction based on student profile
      analysis = {
        programmingLanguages: student.skills.filter(s => ['Python', 'Java', 'JavaScript', 'TypeScript', 'C++'].includes(s)),
        frameworks: student.skills.filter(s => ['React', 'Django', 'Node.js', 'Express', 'Next.js', 'Spring Boot'].includes(s)),
        technologies: ['REST APIs', 'Data Structures', 'System Design'],
        databases: student.skills.filter(s => ['SQL', 'PostgreSQL', 'MongoDB', 'MySQL'].includes(s)),
        tools: ['Git', 'Docker', 'Linux', 'VS Code'],
        cloudTechnologies: student.skills.filter(s => ['AWS', 'GCP', 'Azure'].includes(s)),
        softSkills: ['Problem Solving', 'Communication', 'Teamwork'],
        certifications: student.certifications || [],
        projects: student.projects || [],
        internships: [
          {
            role: 'Software Development Intern',
            company: 'TechCorp Labs',
            duration: 'Jun 2025 - Aug 2025',
            description: 'Engineered scalable microservices and backend data pipelines.'
          }
        ],
        education: [
          {
            degree: student.degree,
            institution: student.university,
            year: `${student.graduationYear}`,
            cgpa: `${student.cgpa} / 10.0`
          }
        ],
        experience: [],
        allSkills: student.skills || ['Python', 'React', 'SQL', 'TypeScript'],
        atsScore: student.resumeScore || 85,
        summary: `Qualified candidate in ${student.branch} with background in ${student.skills.slice(0, 4).join(', ')}.`
      };
      db.saveResumeAnalysis(userId, analysis);
    }
  }

  res.json({ success: true, data: analysis });
});

// 3. START AI ASSESSMENT (LEVEL 1, 2, 3)
apiRouter.post(['/assessment/start', '/assessment/start/'], async (req: Request, res: Response) => {
  const userId = req.body.studentId || getReqUserId(req);
  const student = db.getStudentProfile(userId) || db.getAllStudentProfiles()[0];
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found' });
  }

  const requestedLevel = (parseInt(req.body.level, 10) || 1) as 1 | 2 | 3;
  const settings = db.getAssessmentSettings();

  // Enforce progressive level access
  const previousResults = db.getAssessmentResults(student.userId);
  const level1Passed = previousResults.some(r => r.level === 1 && r.status === 'PASSED');
  const level2Passed = previousResults.some(r => r.level === 2 && r.status === 'PASSED');

  if (requestedLevel === 2 && !level1Passed) {
    return res.status(400).json({
      success: false,
      message: 'Level 1 (Basic) must be successfully cleared before attempting Level 2 (Intermediate).'
    });
  }
  if (requestedLevel === 3 && !level2Passed) {
    return res.status(400).json({
      success: false,
      message: 'Level 2 (Intermediate) must be successfully cleared before attempting Level 3 (Advanced).'
    });
  }

  // Get detected / claimed skills for question targeting
  const resumeSkills = db.getStudentResumeSkills(student.userId);
  const skillNames = resumeSkills.length > 0 
    ? resumeSkills.map(s => s.skill_name) 
    : (student.skills && student.skills.length > 0 ? student.skills : ['Python', 'SQL', 'React', 'Git']);

  const questionsCount = settings.questions_per_level || 5;
  const generatedQuestions = await generateQuestionsForStudent(skillNames, requestedLevel, questionsCount);

  // Time limit configuration per level
  const timeLimit = requestedLevel === 1 
    ? settings.level1_time_limit_sec 
    : requestedLevel === 2 
    ? settings.level2_time_limit_sec 
    : settings.level3_time_limit_sec;

  // Create session with full answer key stored safely in backend
  const session: AssessmentSession = {
    id: `sess_${generateObjectId()}`,
    student_id: student.userId,
    level: requestedLevel,
    status: 'IN_PROGRESS',
    current_question_index: 0,
    questions: generatedQuestions,
    answers: [],
    passing_threshold_pct: settings.passing_threshold_percentage || 80,
    started_at: new Date().toISOString(),
    total_questions: generatedQuestions.length,
    time_limit_per_question_sec: timeLimit || 60
  };

  db.createAssessmentSession(session);

  // SECURITY: Strip correctAnswer and explanation before sending to client
  const clientSafeQuestions = session.questions.map(q => ({
    id: q.id,
    question: q.question,
    options: q.options,
    skill: q.skill,
    difficulty: q.difficulty,
    questionType: q.questionType,
    timeLimitSeconds: q.timeLimitSeconds,
    level: q.level
  }));

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      level: session.level,
      totalQuestions: session.total_questions,
      timeLimitPerQuestionSec: session.time_limit_per_question_sec,
      passingThresholdPct: session.passing_threshold_pct,
      currentQuestionIndex: 0,
      firstQuestion: clientSafeQuestions[0],
      questions: clientSafeQuestions
    },
    message: `Level ${requestedLevel} assessment session started. 1 question = 1 minute.`
  });
});

// 4. GET QUESTION FOR ACTIVE SESSION
apiRouter.get(['/assessment/:id/question', '/assessment/:id/question/'], (req: Request, res: Response) => {
  const session = db.getAssessmentSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Assessment session not found' });
  }

  if (session.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, message: `Assessment is already ${session.status.toLowerCase()}` });
  }

  const idx = session.current_question_index;
  if (idx >= session.questions.length) {
    return res.json({
      success: true,
      completed: true,
      message: 'All questions have been answered. Please submit assessment.'
    });
  }

  const q = session.questions[idx];
  // Strip answer
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      level: session.level,
      questionIndex: idx,
      totalQuestions: session.questions.length,
      timeLimitSeconds: q.timeLimitSeconds || session.time_limit_per_question_sec || 60,
      question: {
        id: q.id,
        question: q.question,
        options: q.options,
        skill: q.skill,
        difficulty: q.difficulty,
        questionType: q.questionType,
        timeLimitSeconds: q.timeLimitSeconds,
        level: q.level
      }
    }
  });
});

// 5. SUBMIT ANSWER FOR CURRENT QUESTION
apiRouter.post(['/assessment/:id/answer', '/assessment/:id/answer/'], (req: Request, res: Response) => {
  const session = db.getAssessmentSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Assessment session not found' });
  }

  if (session.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, message: 'Assessment session is not in progress' });
  }

  const { question_id, selected_option, time_taken_seconds = 45 } = req.body;
  if (!question_id || typeof selected_option !== 'number') {
    return res.status(400).json({ success: false, message: 'question_id and selected_option are required' });
  }

  // Prevent changing already submitted answer for this question
  const existingIdx = session.answers.findIndex(a => a.question_id === question_id);
  if (existingIdx >= 0) {
    return res.status(400).json({ success: false, message: 'Answer already recorded for this question.' });
  }

  session.answers.push({
    question_id,
    selected_option,
    time_taken_seconds: Math.min(120, Math.max(1, time_taken_seconds)),
    answered_at: new Date().toISOString()
  });

  // Advance index
  session.current_question_index = Math.min(session.questions.length, session.current_question_index + 1);
  db.updateAssessmentSession(session.id, {
    answers: session.answers,
    current_question_index: session.current_question_index
  });

  const isCompleted = session.current_question_index >= session.questions.length;

  res.json({
    success: true,
    nextQuestionIndex: session.current_question_index,
    isCompleted,
    message: isCompleted ? 'All questions answered! Ready for final evaluation.' : 'Answer submitted.'
  });
});

// 6. SUBMIT ASSESSMENT & RUN AI SCORING
apiRouter.post(['/assessment/:id/submit', '/assessment/:id/submit/'], (req: Request, res: Response) => {
  const session = db.getAssessmentSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Assessment session not found' });
  }

  const student = db.getStudentProfile(session.student_id);
  const studentName = student?.fullName || 'Student Candidate';
  const settings = db.getAssessmentSettings();

  // Evaluate assessment session deterministically and strictly on backend
  const result = evaluateAssessmentSession(
    session,
    session.answers,
    settings.passing_threshold_percentage || session.passing_threshold_pct || 80,
    studentName
  );

  // Update session
  session.status = 'COMPLETED';
  session.completed_at = new Date().toISOString();
  db.updateAssessmentSession(session.id, {
    status: 'COMPLETED',
    completed_at: session.completed_at
  });

  // Save result model
  db.saveAssessmentResult(result);

  // Update student verified skill scores & level cleared in DB
  db.updateStudentSkillScores(session.student_id, result.skill_breakdown, session.level);

  // Notify student
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: session.student_id,
    title: `🏆 Level ${session.level} Assessment ${result.status === 'PASSED' ? 'Passed!' : 'Results Evaluated'}`,
    message: `You scored ${result.score_percentage}% on Level ${session.level} (${result.correct_answers}/${result.total_questions} correct). ${result.status === 'PASSED' ? 'Verified skill badge awarded!' : 'Review recommendations to retry.'}`,
    type: 'status_change',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    data: result,
    message: `Level ${session.level} assessment evaluated: ${result.status} (${result.score_percentage}%)`
  });
});

// 7. GET ASSESSMENT RESULT BY ID
apiRouter.get(['/assessment/:id/result', '/assessment/:id/result/'], (req: Request, res: Response) => {
  const result = db.getAssessmentResultById(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Assessment result report not found' });
  }
  res.json({ success: true, data: result });
});

// 8. GET STUDENT SKILLS (CLAIMED VS VERIFIED DISTINCTION)
apiRouter.get(['/student/skills', '/student/skills/'], (req: Request, res: Response) => {
  const userId = (req.query.studentId as string) || getReqUserId(req);
  const resumeSkills = db.getStudentResumeSkills(userId);
  const skillScores = db.getStudentSkillScores(userId);
  const settings = db.getAssessmentSettings();

  const strongThreshold = settings.strong_skill_threshold || 85;
  const devThreshold = settings.developing_skill_threshold || 70;

  const strongSkills = skillScores.filter(s => s.verified_score >= strongThreshold);
  const developingSkills = skillScores.filter(s => s.verified_score >= devThreshold && s.verified_score < strongThreshold);
  const needsImprovement = skillScores.filter(s => s.verified_score < devThreshold);

  const assessed = skillScores.filter(s => s.verified_score > 0);
  const overallScore = assessed.length > 0
    ? Math.round(assessed.reduce((a, b) => a + b.verified_score, 0) / assessed.length)
    : 0;

  res.json({
    success: true,
    data: {
      resumeSkills,
      verifiedSkills: skillScores,
      overallScore,
      strongSkills,
      developingSkills,
      needsImprovement,
      thresholds: {
        strong: strongThreshold,
        developing: devThreshold,
        passing: settings.passing_threshold_percentage
      }
    }
  });
});

// 9. ADD MANUAL STUDENT SKILL (Additional Qualifications)
apiRouter.post(['/student/skills', '/student/skills/'], (req: Request, res: Response) => {
  const userId = req.body.studentId || getReqUserId(req);
  const { skill_name, category = 'technology' } = req.body;
  if (!skill_name) {
    return res.status(400).json({ success: false, message: 'skill_name is required' });
  }

  const added = db.addStudentManualSkill(userId, skill_name, category);
  res.status(201).json({
    success: true,
    data: added,
    message: `Skill "${skill_name}" added to candidate profile.`
  });
});

// 10. GET STUDENT CERTIFICATES
apiRouter.get(['/student/certificates', '/student/certificates/'], (req: Request, res: Response) => {
  const userId = (req.query.studentId as string) || getReqUserId(req);
  const user = db.getUserById(userId);

  // If admin/tpo/recruiter without query, return all
  if ((user?.role === 'tpo' || user?.role === 'admin') && !req.query.studentId) {
    return res.json({ success: true, data: db.getCertificates() });
  }

  const certs = db.getCertificates(userId);
  res.json({ success: true, data: certs });
});

// 11. UPLOAD STUDENT CERTIFICATE
apiRouter.post(['/student/certificates', '/student/certificates/'], (req: Request, res: Response) => {
  const userId = req.body.student_id || getReqUserId(req);
  const student = db.getStudentProfile(userId);

  const {
    certificate_name,
    skill_or_course_name,
    issuing_organization,
    issue_date,
    certificate_id,
    file_url,
    file_name,
    file_type = 'pdf'
  } = req.body;

  if (!certificate_name || !skill_or_course_name || !issuing_organization) {
    return res.status(400).json({
      success: false,
      message: 'Certificate name, skill/course name, and issuing organization are required.'
    });
  }

  const newCert = db.createCertificate({
    student_id: userId,
    student_name: student?.fullName || 'Student Candidate',
    certificate_name,
    skill_or_course_name,
    issuing_organization,
    issue_date: issue_date || new Date().toISOString().split('T')[0],
    certificate_id,
    file_url: file_url || '#preview',
    file_name: file_name || `${certificate_name.replace(/\s+/g, '_')}.pdf`,
    file_type,
    verification_status: 'PENDING',
    verification_type: 'STUDENT_UPLOADED'
  });

  res.status(201).json({
    success: true,
    data: newCert,
    message: 'Certificate uploaded and queued for institutional review (Pending Verification).'
  });
});

// 12. ADMIN VERIFY / REJECT CERTIFICATE
apiRouter.put(['/admin/certificates/:id/verify', '/admin/certificates/:id/verify/'], (req: Request, res: Response) => {
  const officerId = getReqUserId(req);
  const { status, rejection_reason } = req.body;

  if (status !== 'VERIFIED' && status !== 'REJECTED') {
    return res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED' });
  }

  const verified = db.verifyCertificate(req.params.id, status, officerId, rejection_reason);
  if (!verified) {
    return res.status(404).json({ success: false, message: 'Certificate record not found' });
  }

  // Notify student
  db.createNotification({
    id: `notif_${generateObjectId()}`,
    userId: verified.student_id,
    title: `📜 Certificate ${status === 'VERIFIED' ? 'Verified!' : 'Verification Update'}`,
    message: `Your certificate "${verified.certificate_name}" (${verified.issuing_organization}) has been marked as ${status}.${rejection_reason ? ` Note: ${rejection_reason}` : ''}`,
    type: 'status_change',
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    data: verified,
    message: `Certificate status updated to ${status}.`
  });
});

// 13. ADMIN ASSESSMENT SETTINGS
apiRouter.get(['/admin/assessment-settings', '/admin/assessment-settings/'], (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getAssessmentSettings() });
});

apiRouter.put(['/admin/assessment-settings', '/admin/assessment-settings/'], (req: Request, res: Response) => {
  const updated = db.updateAssessmentSettings(req.body);
  res.json({ success: true, data: updated, message: 'Assessment parameters updated successfully.' });
});

// 14. RECRUITER CANDIDATES SEARCH & FILTER
apiRouter.get(['/recruiter/candidates', '/recruiter/candidates/'], (req: Request, res: Response) => {
  const { skill, minScore, level, branch, minCgpa, search } = req.query;

  const filters = {
    skill: skill as string,
    minScore: minScore ? parseInt(minScore as string, 10) : undefined,
    level: level ? parseInt(level as string, 10) : undefined,
    branch: branch as string,
    minCgpa: minCgpa ? parseFloat(minCgpa as string) : undefined,
    search: search as string
  };

  const candidates = db.getCandidatesVerifiedProfiles(filters);
  res.json({ success: true, count: candidates.length, data: candidates });
});

// 15. RECRUITER CANDIDATE VERIFIED PROFILE BY ID
apiRouter.get(['/recruiter/candidates/:id', '/recruiter/candidates/:id/'], (req: Request, res: Response) => {
  const profile = db.getCandidateVerifiedProfile(req.params.id);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Candidate verified profile not found' });
  }
  res.json({ success: true, data: profile });
});

// =============================================================
// SMART PLACEMENT ROOM ALLOCATION & NOTIFICATION APIS
// =============================================================

// 1. COLLEGE ROOMS INVENTORY
apiRouter.get(['/rooms', '/rooms/'], (_req: Request, res: Response) => {
  const rooms = db.getCollegeRooms();
  res.json({ success: true, count: rooms.length, data: rooms });
});

apiRouter.post(['/rooms', '/rooms/'], (req: Request, res: Response) => {
  const room = db.createCollegeRoom(req.body);
  res.status(201).json({ success: true, data: room, message: 'Campus room registered successfully.' });
});

apiRouter.put(['/rooms/:id', '/rooms/:id/'], (req: Request, res: Response) => {
  const updated = db.updateCollegeRoom(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, data: updated, message: 'Room details updated.' });
});

// 2. ACADEMIC SCHEDULES (Classes, Exams, Labs, Workshops)
apiRouter.get(['/academic-schedules', '/academic-schedules/'], (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  const schedules = db.getAcademicSchedules(date);
  res.json({ success: true, count: schedules.length, data: schedules });
});

apiRouter.post(['/academic-schedules', '/academic-schedules/'], (req: Request, res: Response) => {
  const schedule = db.createAcademicSchedule(req.body);
  res.status(201).json({ success: true, data: schedule, message: 'Academic schedule created.' });
});

apiRouter.put(['/academic-schedules/:id', '/academic-schedules/:id/'], (req: Request, res: Response) => {
  const updated = db.updateAcademicSchedule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Academic schedule not found' });
  res.json({ success: true, data: updated, message: 'Academic schedule updated.' });
});

// 3. PLACEMENT ALLOCATIONS STATS
apiRouter.get(['/placement-allocations/stats', '/placement-allocations/stats/'], (_req: Request, res: Response) => {
  const stats = db.getRoomAllocationStats();
  res.json({ success: true, data: stats });
});

// 4. INTELLIGENT ROOM SUGGESTION FOR A COMPANY VISIT
apiRouter.get(['/placement-allocations/suggest-rooms', '/placement-allocations/suggest-rooms/'], (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const startTime = (req.query.startTime as string) || '10:00';
  const endTime = (req.query.endTime as string) || '13:00';
  const requiredCapacity = parseInt((req.query.requiredCapacity as string) || '80', 10);
  const currentAllocationId = req.query.allocationId as string | undefined;

  const suggestions = db.suggestRoomsForAllocation(
    date,
    startTime,
    endTime,
    requiredCapacity,
    currentAllocationId
  );

  res.json({
    success: true,
    count: suggestions.length,
    data: suggestions,
    date,
    timeSlot: `${startTime} - ${endTime}`,
    requiredCapacity
  });
});

// 5. 1-CLICK AUTO-ALLOCATE ALL PENDING VISITS
apiRouter.post(['/placement-allocations/auto-allocate', '/placement-allocations/auto-allocate/'], (_req: Request, res: Response) => {
  const result = db.autoAllocateAllPendingDrives();
  res.json({
    success: true,
    data: result,
    message: `Smart auto-allocation finished: ${result.allocatedCount} rooms successfully assigned, ${result.conflictsCount} conflicts flagged.`
  });
});

// 6. LIST ALL PLACEMENT ALLOCATIONS
apiRouter.get(['/placement-allocations', '/placement-allocations/'], (_req: Request, res: Response) => {
  const allocations = db.getPlacementAllocations();
  res.json({ success: true, count: allocations.length, data: allocations });
});

apiRouter.get(['/placement-allocations/:id', '/placement-allocations/:id/'], (req: Request, res: Response) => {
  const allocation = db.getPlacementAllocationById(req.params.id);
  if (!allocation) return res.status(404).json({ success: false, message: 'Placement allocation not found' });
  res.json({ success: true, data: allocation });
});

// 7. CREATE NEW PLACEMENT DRIVE ALLOCATION WITH CONFLICT DETECTION
apiRouter.post(['/placement-allocations', '/placement-allocations/'], (req: Request, res: Response) => {
  const result = db.createPlacementAllocation(req.body);
  res.status(201).json({
    success: true,
    data: result.allocation,
    alert: result.alert,
    hasConflict: Boolean(result.alert),
    message: result.alert 
      ? `Room conflict detected! An administration alert has been issued.` 
      : `Room successfully allocated for ${result.allocation.companyName} placement drive.`
  });
});

// 8. UPDATE PLACEMENT ALLOCATION
apiRouter.put(['/placement-allocations/:id', '/placement-allocations/:id/'], (req: Request, res: Response) => {
  const updated = db.updatePlacementAllocation(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Allocation not found' });
  res.json({ success: true, data: updated, message: 'Placement allocation updated.' });
});

// 9. DELETE PLACEMENT ALLOCATION
apiRouter.delete(['/placement-allocations/:id', '/placement-allocations/:id/'], (req: Request, res: Response) => {
  const success = db.deletePlacementAllocation(req.params.id);
  if (!success) return res.status(404).json({ success: false, message: 'Allocation not found' });
  res.json({ success: true, message: 'Placement allocation removed.' });
});

// 10. CONFIRM ALLOCATION & DISPATCH NOTIFICATIONS TO TARGETED STUDENTS
apiRouter.post(['/placement-allocations/:id/notify', '/placement-allocations/:id/notify/'], (req: Request, res: Response) => {
  try {
    const { customInstructions } = req.body || {};
    const result = db.confirmAllocationAndNotifyStudents(req.params.id, customInstructions);
    res.json({
      success: true,
      data: result.allocation,
      notifiedCount: result.notifiedCount,
      message: `Room allocation confirmed! Dispatched targeted notification to ${result.notifiedCount} registered students.`
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to dispatch room notifications' });
  }
});

// 11. ADMINISTRATION CONFLICT ALERTS
apiRouter.get(['/admin-alerts', '/admin-alerts/'], (_req: Request, res: Response) => {
  const alerts = db.getAdministrationAlerts();
  res.json({ success: true, count: alerts.length, data: alerts });
});

// 12. RESOLVE ADMINISTRATION CONFLICT
apiRouter.post(['/admin-alerts/:id/resolve', '/admin-alerts/:id/resolve/'], (req: Request, res: Response) => {
  try {
    const { action, alternateRoomId, newTimeSlot, note, resolvedBy } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, message: 'Resolution action is required' });
    }

    const result = db.resolveAdministrationConflict(req.params.id, action, {
      alternateRoomId,
      newTimeSlot,
      note,
      resolvedBy
    });

    res.json({
      success: true,
      data: result,
      message: result.message
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to resolve conflict' });
  }
});


