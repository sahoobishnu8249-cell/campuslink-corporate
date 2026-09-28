import React, { useState } from 'react';
import { 
  GraduationCap, 
  Building2, 
  Sparkles, 
  Upload, 
  Check, 
  FileText, 
  Plus, 
  X, 
  ArrowRight, 
  Award, 
  FolderGit2, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase,
  Zap
} from 'lucide-react';
import { api } from '../services/api.ts';
import { User, StudentProfile, RecruiterProfile } from '../types/index.ts';
import { NavTab } from './Sidebar.tsx';

interface RegistrationViewProps {
  onRegistrationSuccess: (user: User, profile: StudentProfile | RecruiterProfile) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onRegistrationSuccess,
  onNavigateTab
}) => {
  const [roleTab, setRoleTab] = useState<'student' | 'recruiter'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    phone: '+91 98765 43210',
    university: 'National Institute of Technology',
    rollNumber: '',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: 2026,
    cgpa: 8.45,
    backlogs: 0,
    bio: 'Undergraduate computer science student passionate about scalable distributed systems and AI applications.',
    github: 'https://github.com/newcandidate',
    linkedin: 'https://linkedin.com/in/newcandidate',
    portfolio: 'https://newcandidate.dev',
    resumeFilename: 'Candidate_Resume_Verified.pdf',
    skills: ['Python', 'React', 'TypeScript', 'SQL', 'Docker', 'FastAPI'],
    targetRoles: ['Software Engineer', 'Full Stack Developer'],
    certifications: ['AWS Certified Cloud Practitioner', 'Google Data Analytics'],
    projectTitle: 'Distributed Microservices Campus Engine',
    projectTech: 'React, Node.js, PostgreSQL, Docker',
    projectDescription: 'High-throughput event-driven microservices architecture handling campus recruitment pipelines.'
  });

  // Recruiter Form State
  const [recruiterForm, setRecruiterForm] = useState({
    recruiterName: '',
    email: '',
    phone: '+91 98765 88888',
    companyName: 'Nexar AI Technologies',
    industry: 'Enterprise Software & Artificial Intelligence',
    location: 'Bangalore / Hybrid',
    website: 'https://nexarai.io',
    companyBio: 'Pioneering multimodal AI platforms for Fortune 500 enterprises.',
    jobTitle: 'AI Platform Systems Engineer',
    ctcPackage: '₹24 LPA',
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
    jobSkills: ['Python', 'PyTorch', 'React', 'Docker', 'Distributed Systems']
  });

  // Skill input tag helper
  const [newSkillInput, setNewSkillInput] = useState('');

  const handleAddSkill = (skillToAdd?: string) => {
    const s = (skillToAdd || newSkillInput).trim();
    if (!s) return;
    if (!studentForm.skills.includes(s)) {
      setStudentForm(prev => ({
        ...prev,
        skills: [...prev.skills, s]
      }));
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setStudentForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Sample prefill helpers
  const handlePrefillCSE = () => {
    const randomRoll = '2022CS' + Math.floor(1000 + Math.random() * 9000);
    setStudentForm({
      fullName: 'Vikramaditya Sharma',
      email: `vikram.sharma${Math.floor(100 + Math.random() * 900)}@campus.edu`,
      phone: '+91 98451 22334',
      university: 'National Institute of Technology',
      rollNumber: randomRoll,
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduationYear: 2026,
      cgpa: 8.78,
      backlogs: 0,
      bio: 'Final year CSE undergraduate with deep expertise in full-stack architecture, microservices, and AI matching algorithms.',
      github: 'https://github.com/vikramsharma-cs',
      linkedin: 'https://linkedin.com/in/vikram-sharma-tech',
      portfolio: 'https://vikramsharma.dev',
      resumeFilename: 'Vikram_Sharma_CSE_Resume.pdf',
      skills: ['Python', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Tailwind CSS'],
      targetRoles: ['Full Stack Developer', 'Software Engineer', 'Backend Specialist'],
      certifications: ['AWS Certified Developer Associate', 'Meta Front-End Specialization'],
      projectTitle: 'Autonomous Campus Placement Matcher',
      projectTech: 'React, Node.js, Vector Embeddings, PostgreSQL',
      projectDescription: 'Explainable AI-driven placement allocation engine matching students with corporate job specifications.'
    });
  };

  const handlePrefillRecruiter = () => {
    setRecruiterForm({
      recruiterName: 'Meera Deshmukh',
      email: `meera.deshmukh${Math.floor(10 + Math.random() * 90)}@nexarai.com`,
      phone: '+91 99234 55667',
      companyName: 'Nexar AI Technologies',
      industry: 'Enterprise AI & Machine Learning',
      location: 'Bangalore / Hybrid',
      website: 'https://nexarai.com',
      companyBio: 'Next-generation AI foundation models and autonomous platform engineering.',
      jobTitle: 'Core AI Systems Engineer',
      ctcPackage: '₹26 LPA',
      minCgpa: 8.0,
      maxBacklogs: 0,
      allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
      jobSkills: ['Python', 'PyTorch', 'Distributed Systems', 'C++', 'CUDA', 'Docker']
    });
  };

  // Submit Student
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName.trim() || !studentForm.email.trim()) {
      setErrorMsg('Please enter both student name and university email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'student',
          name: studentForm.fullName,
          email: studentForm.email,
          phone: studentForm.phone,
          university: studentForm.university,
          rollNumber: studentForm.rollNumber || ('2022UG' + Math.floor(1000 + Math.random() * 9000)),
          degree: studentForm.degree,
          branch: studentForm.branch,
          graduationYear: studentForm.graduationYear,
          cgpa: studentForm.cgpa,
          backlogs: studentForm.backlogs,
          skills: studentForm.skills,
          bio: studentForm.bio,
          github: studentForm.github,
          linkedin: studentForm.linkedin,
          portfolio: studentForm.portfolio,
          resumeFilename: studentForm.resumeFilename,
          targetRoles: studentForm.targetRoles,
          certifications: studentForm.certifications,
          projects: [
            {
              id: 'proj_' + Date.now(),
              title: studentForm.projectTitle,
              tech: studentForm.projectTech,
              description: studentForm.projectDescription
            }
          ]
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Registration failed');

      api.setCurrentUser(json.data.user);
      onRegistrationSuccess(json.data.user, json.data.profile);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Recruiter
  const handleSubmitRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterForm.recruiterName.trim() || !recruiterForm.email.trim() || !recruiterForm.companyName.trim()) {
      setErrorMsg('Please fill in recruiter name, official email, and company name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'recruiter',
          name: recruiterForm.recruiterName,
          email: recruiterForm.email,
          phone: recruiterForm.phone,
          companyName: recruiterForm.companyName,
          industry: recruiterForm.industry,
          location: recruiterForm.location,
          companyWebsite: recruiterForm.website,
          companyLogo: recruiterForm.companyName.slice(0, 4).toUpperCase(),
          companyBio: recruiterForm.companyBio
        })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Registration failed');

      // Also create their initial job opening
      if (recruiterForm.jobTitle && json.data.user?.id) {
        await api.createJob({
          title: recruiterForm.jobTitle,
          companyName: recruiterForm.companyName,
          companyLogo: recruiterForm.companyName.slice(0, 4).toUpperCase(),
          ctcOrStipend: recruiterForm.ctcPackage,
          minCgpa: recruiterForm.minCgpa,
          maxBacklogs: recruiterForm.maxBacklogs,
          allowedBranches: recruiterForm.allowedBranches,
          skills: recruiterForm.jobSkills,
          description: `Premier campus recruitment drive launched by ${recruiterForm.companyName}.`
        });
      }

      api.setCurrentUser(json.data.user);
      onRegistrationSuccess(json.data.user, json.data.profile);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete recruiter registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickSkills = ['Python', 'React', 'TypeScript', 'SQL', 'Docker', 'AWS', 'PyTorch', 'Node.js', 'PostgreSQL', 'Java', 'Git'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE4D9] shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EAE1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-[#DCE8DF] text-[#1C4631] px-2.5 py-0.5 rounded-full">
                Step 1 of Placement Flow
              </span>
              <span className="text-xs text-[#7A7268]">Verified Registration & Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#1E2522] font-semibold mt-1">
              CAMPUSLINK Platform Registration
            </h1>
            <p className="text-xs sm:text-sm text-[#5E574E] mt-1 max-w-xl">
              Create a verified candidate profile with automated AI readiness evaluation, or register as a corporate hiring partner to publish campus drives.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={roleTab === 'student' ? handlePrefillCSE : handlePrefillRecruiter}
              className="px-4 py-2 bg-[#F7F2EA] hover:bg-[#EFE8DD] text-[#8C6414] border border-[#E8DCC8] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>{roleTab === 'student' ? '1-Click Sample Student' : '1-Click Sample Partner'}</span>
            </button>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="pt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="inline-flex p-1 bg-[#F5EFE6] rounded-2xl border border-[#E5DDD0]">
            <button
              type="button"
              onClick={() => {
                setRoleTab('student');
                setErrorMsg(null);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'student'
                  ? 'bg-white text-[#1C4631] shadow-2xs'
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#1C4631]" />
              <span>Student Registration & Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab('recruiter');
                setErrorMsg(null);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleTab === 'recruiter'
                  ? 'bg-white text-[#1C4631] shadow-2xs'
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#1C4631]" />
              <span>Company / Recruiter Registration</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('flow')}
            className="text-xs font-bold text-[#1C4631] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect 8-Stage Flow Diagram</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#FCE8DE] border border-[#F4D1C1] text-xs text-[#B8552D] font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STUDENT REGISTRATION FORM */}
      {roleTab === 'student' && (
        <form onSubmit={handleSubmitStudent} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE4D9] shadow-xs space-y-7">
          
          {/* Section 1: Basic & Academic Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EAE1]">
              <GraduationCap className="w-4 h-4 text-[#1C4631]" />
              <h3 className="font-bold text-sm text-[#1E2522] uppercase tracking-wider">
                1. Student Academic Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Reddy or Vikramaditya"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  University Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student@campus.edu"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Roll / Registration Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2022CS8942"
                  value={studentForm.rollNumber}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Department / Branch
                </label>
                <select
                  value={studentForm.branch}
                  onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#5E574E] mb-1">
                    Current CGPA *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="4"
                    max="10"
                    value={studentForm.cgpa}
                    onChange={(e) => setStudentForm({ ...studentForm, cgpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E574E] mb-1">
                    Active Backlogs
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={studentForm.backlogs}
                    onChange={(e) => setStudentForm({ ...studentForm, backlogs: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Technical Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1C4631]" />
                <h3 className="font-bold text-sm text-[#1E2522] uppercase tracking-wider">
                  2. Technical & Domain Skills
                </h3>
              </div>
              <span className="text-xs text-[#7A7268]">{studentForm.skills.length} skills added</span>
            </div>

            {/* Quick recommend pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#7A7268] mr-1">Quick Add:</span>
              {quickSkills.map(sk => (
                <button
                  type="button"
                  key={sk}
                  onClick={() => handleAddSkill(sk)}
                  disabled={studentForm.skills.includes(sk)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    studentForm.skills.includes(sk)
                      ? 'bg-[#E3EFE7] text-[#1C4631] opacity-60'
                      : 'bg-[#F2ECE1] hover:bg-[#EAE2D5] text-[#5E574E]'
                  }`}
                >
                  + {sk}
                </button>
              ))}
            </div>

            {/* Active Skills tags */}
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E3DCD1] min-h-[50px] items-center">
              {studentForm.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-white border border-[#CDE1D4] text-[#1C4631] font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-500 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="text"
                  placeholder="Type new skill..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="px-2.5 py-1 bg-white border border-[#E3DCD1] rounded-lg text-xs text-[#1E2522] focus:outline-none focus:border-[#1C4631]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-2.5 py-1 bg-[#1C4631] text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Verified ATS Resume & Projects */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EAE1]">
              <FileText className="w-4 h-4 text-[#1C4631]" />
              <h3 className="font-bold text-sm text-[#1E2522] uppercase tracking-wider">
                3. ATS Resume Upload & Featured Project
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ATS Resume Box */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-[#CDE1D4] bg-[#F4FAF6] space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C4631]">ATS Resume Parsed</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#DCE8DF] text-[#1C4631] text-[10px] font-bold">
                      91% Score
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1C4631] text-white flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-[#1E2522] truncate">
                        {studentForm.resumeFilename}
                      </div>
                      <div className="text-[10px] text-[#7A7268]">
                        Parsed 8 technical skills · 2 projects
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#3B664C] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1C4631]" />
                  <span>Resume verified and ready for AI matching</span>
                </div>
              </div>

              {/* Capstone Project */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E3DCD1] space-y-2">
                <label className="block text-xs font-bold text-[#5E574E]">
                  Featured Project Title
                </label>
                <input
                  type="text"
                  value={studentForm.projectTitle}
                  onChange={(e) => setStudentForm({ ...studentForm, projectTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E3DCD1] bg-white text-xs text-[#1E2522] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Tech stack (e.g. React, Node, SQL)"
                  value={studentForm.projectTech}
                  onChange={(e) => setStudentForm({ ...studentForm, projectTech: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E3DCD1] bg-white text-xs text-[#1E2522] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#F0EAE1] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#7A7268]">
              Submitting computes candidate eligibility & initial readiness score in real-time.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1C4631] hover:bg-[#153826] disabled:opacity-50 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Verified Profile & Computing Score...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Register & Generate AI Profile</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

      {/* RECRUITER REGISTRATION FORM */}
      {roleTab === 'recruiter' && (
        <form onSubmit={handleSubmitRecruiter} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE4D9] shadow-xs space-y-7">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EAE1]">
              <Building2 className="w-4 h-4 text-[#1C4631]" />
              <h3 className="font-bold text-sm text-[#1E2522] uppercase tracking-wider">
                1. Corporate Partner & Recruiter Info
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Recruiter Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Deshmukh"
                  value={recruiterForm.recruiterName}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, recruiterName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Official Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. talent@company.com"
                  value={recruiterForm.email}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexar AI Technologies"
                  value={recruiterForm.companyName}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Industry & Sector
                </label>
                <input
                  type="text"
                  value={recruiterForm.industry}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:bg-white focus:outline-none focus:border-[#1C4631] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Initial Job Posting Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F0EAE1]">
              <Briefcase className="w-4 h-4 text-[#1C4631]" />
              <h3 className="font-bold text-sm text-[#1E2522] uppercase tracking-wider">
                2. Initial Campus Role & Eligibility Gate
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Job Role Title
                </label>
                <input
                  type="text"
                  value={recruiterForm.jobTitle}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, jobTitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  CTC Package
                </label>
                <input
                  type="text"
                  value={recruiterForm.ctcPackage}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, ctcPackage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:outline-none font-bold text-[#1C4631]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E574E] mb-1">
                  Minimum CGPA Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={recruiterForm.minCgpa}
                  onChange={(e) => setRecruiterForm({ ...recruiterForm, minCgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E3DCD1] bg-[#FAF8F5] text-xs text-[#1E2522] focus:outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#F0EAE1] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#7A7268]">
              Registers company, opens campus recruitment portal, and publishes initial drive role.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#1C4631] hover:bg-[#153826] disabled:opacity-50 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering Corporate Partner...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Register Company & Launch Campus Drive</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
export default RegistrationView;
