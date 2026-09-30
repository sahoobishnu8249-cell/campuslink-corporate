import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Briefcase, 
  Building2, 
  Calendar, 
  Filter,
  FileText,
  Award,
  Video,
  ShieldCheck,
  Radio,
  Github,
  Globe,
  Plus,
  FileCode
} from 'lucide-react';
import { 
  StudentProfile, 
  JobPosting, 
  Application, 
  InterviewRecord,
  SkillGapAnalysis,
  calculateProfileCompletion
} from '../types/index.ts';

interface StudentDashboardProps {
  student: StudentProfile;
  jobs: JobPosting[];
  applications: Application[];
  interviews: InterviewRecord[];
  skillGap: SkillGapAnalysis | null;
  onViewMatchDetails: (job: JobPosting) => void;
  onNavigateTab: (tab: any) => void;
  onApplyJob: (jobId: string) => void;
  onOpenAiAssistant?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  jobs,
  applications,
  interviews,
  skillGap,
  onViewMatchDetails,
  onNavigateTab,
  onApplyJob,
  onOpenAiAssistant,
  searchQuery = '',
  setSearchQuery
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'intern' | 'fulltime'>('all');
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (setSearchQuery) setSearchQuery(val);
  };

  // Pipeline items matching the user's screenshot
  const pipelineItems = [
    {
      id: 'pipe_1',
      avatar: 'MV',
      avatarBg: 'bg-[#E3EBF7]',
      avatarText: 'text-[#2B5885]',
      title: 'ML Engineer Intern',
      company: 'Meridian Labs',
      subtext: 'Applied 3 days ago · screening',
      status: 'Screening',
      statusBg: 'bg-[#E8F0FE]',
      statusText: 'text-[#2B5885]',
      actionTab: 'applications'
    },
    {
      id: 'pipe_2',
      avatar: 'NF',
      avatarBg: 'bg-[#FCE8DE]',
      avatarText: 'text-[#B8552D]',
      title: 'Product Analyst',
      company: 'Northwind Fintech',
      subtext: 'Interview Fri 10:00 · prep suggested',
      status: 'Interview',
      statusBg: 'bg-[#FCE8DE]',
      statusText: 'text-[#B8552D]',
      actionTab: 'interviews'
    },
    {
      id: 'pipe_3',
      avatar: 'CS',
      avatarBg: 'bg-[#E2F5E9]',
      avatarText: 'text-[#227547]',
      title: 'Data Associate',
      company: 'Cedar Solutions',
      subtext: 'Offer received · respond by Fri',
      status: 'Offer',
      statusBg: 'bg-[#E2F5E9]',
      statusText: 'text-[#227547]',
      actionTab: 'offers'
    },
    {
      id: 'pipe_4',
      avatar: 'HL',
      avatarBg: 'bg-[#E7EDF5]',
      avatarText: 'text-[#3D597A]',
      title: 'Research Intern',
      company: 'Helio Robotics',
      subtext: 'Case study due Mon · 2 days left',
      status: 'Case',
      statusBg: 'bg-[#E9EFF6]',
      statusText: 'text-[#3D597A]',
      actionTab: 'prep'
    }
  ];

  // Real calculated metrics for student dashboard
  const completion = calculateProfileCompletion(student);
  const studentApps = applications.filter(a => a.studentId === student.userId);
  const studentInterviews = interviews.filter(i => i.studentId === student.userId || i.studentName === student.fullName);
  const upcomingInterviews = studentInterviews.filter(i => i.status === 'Scheduled');
  const nextInterview = upcomingInterviews[0];
  const offersList = studentApps.filter(a => a.stage === 'offered' || a.stage === 'accepted' || a.stage === 'joined');
  const offersCount = offersList.length > 0 ? offersList.length : (student.placementStatus === 'Placed' ? 1 : 0);

  const eligibleRolesCount = jobs.filter(j => {
    const cgpaOk = (student.cgpa || 0) >= j.minCgpa;
    const branchOk = j.allowedBranches.length === 0 || j.allowedBranches.some(b => b.toLowerCase().includes(student.branch.toLowerCase()) || student.branch.toLowerCase().includes(b.toLowerCase()));
    return cgpaOk && branchOk;
  }).length;

  // Recommendations calculated from student skills
  const studentSkillsLower = (student.skills || []).map(s => s.toLowerCase());
  
  const recommendedRoles = jobs.map((job) => {
    const matched = job.skills.filter(s => studentSkillsLower.includes(s.toLowerCase()));
    const missing = job.skills.filter(s => !studentSkillsLower.includes(s.toLowerCase()));
    const matchPercent = Math.min(96, Math.max(68, Math.round((matched.length / Math.max(1, job.skills.length)) * 55 + 41)));
    const isApplied = applications.some(a => a.jobId === job.id && a.studentId === student.userId);
    
    const cgpaOk = (student.cgpa || 0) >= job.minCgpa;
    const branchOk = job.allowedBranches.length === 0 || job.allowedBranches.some(b => b.toLowerCase().includes(student.branch.toLowerCase()) || student.branch.toLowerCase().includes(b.toLowerCase()));
    const isEligible = cgpaOk && branchOk;
    
    let ineligibilityReason = '';
    if (!cgpaOk) ineligibilityReason = `Min CGPA ${job.minCgpa.toFixed(1)} required (Current: ${student.cgpa.toFixed(2)})`;
    else if (!branchOk) ineligibilityReason = `Branch (${student.branch}) not in eligible streams`;
    else if (missing.length > 2) ineligibilityReason = `Missing ${missing.slice(0, 2).join(', ')}`;

    return {
      job,
      matched,
      missing,
      matchPercent,
      isApplied,
      isEligible,
      ineligibilityReason
    };
  }).filter(item => {
    if (selectedFilter === 'high') return item.matchPercent >= 85;
    if (selectedFilter === 'intern') return item.job.type === 'Internship';
    if (selectedFilter === 'fulltime') return item.job.type === 'Full-Time';
    return true;
  });

  const avgMatch = recommendedRoles.length > 0 
    ? Math.round(recommendedRoles.reduce((acc, r) => acc + r.matchPercent, 0) / recommendedRoles.length)
    : (student.readinessScore || 78);

  // Calculate current date string matching the screenshot: "THURSDAY · 14 MARCH"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date()).toUpperCase().replace(',', ' ·');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* AI SKILL VERIFICATION ACTION BANNER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">Verify Your Skills with AI</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recruiter Trusted
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5 max-w-xl leading-relaxed">
              Don't leave recruiters guessing. Take dynamic, level-based assessments tailored to your resume skills to earn verified badges and confidence scores.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('skillverification')}
          className="px-5 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 rounded-2xl text-xs font-black shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
        >
          <span>Verify Your Skills</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Top Header Row matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          {/* Micro kicker */}
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            {formattedDate || 'THURSDAY · 14 MARCH'}
          </div>
          {/* Editorial Serif Greeting */}
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1E2522] font-semibold mt-1">
            Good afternoon, {student.fullName.split(' ')[0] || 'Aarav'}
          </h1>
        </div>

        {/* Right Search Input & "Ask CampusLink" Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Pill Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8377]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search roles, companies..."
              className="w-full pl-9 pr-4 py-2 bg-white text-xs text-[#1E2522] placeholder-[#8C8377] rounded-full border border-[#E3DCD1] focus:outline-none focus:border-[#1C4631] shadow-2xs transition-colors"
            />
          </div>

          {/* Dark Green Ask CampusLink Button */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-xs transition-all hover:scale-102 active:scale-98 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ask CampusLink</span>
          </button>
        </div>
      </div>

      {/* Prominent Profile Completion Guide Banner if incomplete */}
      {completion < 100 && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 border border-purple-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-purple-700 text-white px-2.5 py-0.5 rounded-full">
                Step 1: Profile Completion
              </span>
              <span className="text-xs font-bold text-purple-900">
                Complete your profile to unlock AI-powered placement matching.
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl">
              Add your verified academic marks, upload your resume for NLP skill extraction, add projects, and complete mock assessments to maximize your corporate drive shortlists.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-48 sm:w-64 h-2 bg-purple-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-xs font-mono font-extrabold text-purple-900">{completion}% Completed</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Complete Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* EXCLUSIVE FEATURE BANNER: PLACEMENT PASSPORT & LIVE WAR-ROOM */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Campus Exclusive Feature</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Drive Active Today (Google Cloud IDC)</span>
            </span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Placement Passport™ & Live Drive War-Room</span>
          </h2>
          
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Your tamper-proof digital ID with 4-tier registrar verification seals, real-time interview token tracking (Token #B-18), audio chimes, and instant gate check-in pass.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right pr-2">
            <div className="text-[10px] font-mono text-indigo-300 uppercase">Live Queue Token</div>
            <div className="text-2xl font-black font-mono text-amber-400">#B-18</div>
          </div>
          
          <button
            onClick={() => onNavigateTab('passport')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Open Passport & War-Room</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards matching screenshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: MATCH SCORE */}
        <div 
          onClick={() => onNavigateTab('readiness')}
          className="bg-white rounded-2xl p-5 border border-[#ECE4D9] hover:border-[#1C4631] shadow-2xs flex flex-col justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
              MATCH SCORE
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1C4631] transition-colors" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              {avgMatch}
            </span>
            <span className="font-serif text-2xl font-bold text-[#1E2522]">%</span>
          </div>
          <div className="text-[12px] font-medium text-[#2E6B48]">
            Readiness: {student.readinessScore || 78}% · {student.readinessLevel || 'READY'}
          </div>
        </div>

        {/* Card 2: APPLICATIONS */}
        <div 
          onClick={() => onNavigateTab('applications')}
          className="bg-white rounded-2xl p-5 border border-[#ECE4D9] hover:border-[#1C4631] shadow-2xs flex flex-col justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
              APPLICATIONS
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1C4631] transition-colors" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              {studentApps.length > 0 ? studentApps.length : 24}
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#7A7268]">
            {studentApps.filter(a => a.stage === 'interview' || a.stage === 'screening').length || 3} in active rounds
          </div>
        </div>

        {/* Card 3: INTERVIEWS */}
        <div 
          onClick={() => onNavigateTab('interviews')}
          className="bg-white rounded-2xl p-5 border border-[#ECE4D9] hover:border-[#1C4631] shadow-2xs flex flex-col justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
              INTERVIEWS
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1C4631] transition-colors" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              {upcomingInterviews.length > 0 ? upcomingInterviews.length : 2}
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#B8552D]">
            {nextInterview ? `Next: ${nextInterview.date} ${nextInterview.time}` : 'Next: Fri 10:00'}
          </div>
        </div>

        {/* Card 4: OFFERS & JOINING */}
        <div 
          onClick={() => onNavigateTab('joining')}
          className="bg-white rounded-2xl p-5 border border-[#ECE4D9] hover:border-[#1C4631] shadow-2xs flex flex-col justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
              OFFERS & JOINING
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1C4631] transition-colors" />
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              {offersCount}
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#7A7268]">
            {student.placementStatus === 'Placed' ? 'Status: Officially Placed 🎓' : 'Awaiting response · Onboarding'}
          </div>
        </div>

      </div>

      {/* Row of Secondary Workflow Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div 
          onClick={() => onNavigateTab('profile')}
          className="p-3.5 rounded-2xl bg-white border border-[#ECE4D9] hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Profile Completion</div>
            <div className="font-black text-slate-900 font-mono mt-0.5">{completion}% Complete</div>
          </div>
          <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">Edit</span>
        </div>

        <div 
          onClick={() => onNavigateTab('resume')}
          className="p-3.5 rounded-2xl bg-white border border-[#ECE4D9] hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Resume & ATS</div>
            <div className="font-black text-indigo-700 font-mono mt-0.5">{student.resumeScore || 92}% Score</div>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">NLP Verified</span>
        </div>

        <div 
          onClick={() => onNavigateTab('roomallocation')}
          className="p-3.5 rounded-2xl bg-white border border-[#ECE4D9] hover:border-indigo-400 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Room Allotment</div>
            <div className="font-black text-indigo-700 font-mono mt-0.5 truncate max-w-[130px]">Seminar Hall 1</div>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">Venue Live</span>
        </div>

        <div 
          onClick={() => onNavigateTab('discover')}
          className="p-3.5 rounded-2xl bg-white border border-[#ECE4D9] hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Eligible Roles</div>
            <div className="font-black text-emerald-700 font-mono mt-0.5">{eligibleRolesCount} of {jobs.length} Roles</div>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">View Roles</span>
        </div>

        <div 
          onClick={() => onNavigateTab('joining')}
          className="p-3.5 rounded-2xl bg-white border border-[#ECE4D9] hover:border-purple-300 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Placement Status</div>
            <div className="font-black text-slate-900 mt-0.5">{student.placementStatus || 'In Process'}</div>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold">Onboarding</span>
        </div>
      </div>

      {/* CAMPUSLINK Placement Flow Banner matching the user flow */}
      <div 
        onClick={() => onNavigateTab('flow')}
        className="bg-gradient-to-r from-[#F4FAF6] via-[#FAF6EF] to-[#F5EFE6] border border-[#D5E6DA] hover:border-[#1C4631] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-2xs cursor-pointer group"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#1C4631] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1C4631] text-white px-2 py-0.5 rounded-full">
                Interactive Architecture
              </span>
              <span className="text-xs font-bold text-[#1C4631]">8-Stage Placement Pipeline Flow</span>
            </div>
            <p className="text-xs text-[#5E574E] mt-0.5 line-clamp-1">
              Registration → AI Readiness → Job Posting → Cosine Matching → Drive Scheduling → Multi-Round Eval → Offer Acceptance → TPO Analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#1C4631] group-hover:underline">Explore Process Flow</span>
          <ChevronRight className="w-4 h-4 text-[#1C4631] group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* "Your pipeline" Section matching screenshot */}
      <div className="bg-white rounded-3xl p-6 border border-[#ECE4D9] shadow-2xs space-y-5">
        
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-[#1E2522]">
            Your pipeline
          </h2>
          <div className="text-xs text-[#7A7268] font-medium">
            6 open <span aria-hidden="true">·</span> updated 2 min ago
          </div>
        </div>

        {/* Horizontal Visual Stage Progress Bars */}
        <div className="grid grid-cols-4 gap-2 pt-1 pb-2">
          {/* Stage 1: Screening */}
          <div className="space-y-1.5">
            <div className="h-1 bg-[#2B5885] rounded-full w-full" />
            <div className="text-[11px] text-[#7A7268] font-medium">
              Screening
            </div>
          </div>

          {/* Stage 2: Interview */}
          <div className="space-y-1.5">
            <div className="h-1 bg-[#B8552D] rounded-full w-full" />
            <div className="text-[11px] text-[#7A7268] font-medium">
              Interview
            </div>
          </div>

          {/* Stage 3: Case study */}
          <div className="space-y-1.5">
            <div className="h-1 bg-[#3D597A] rounded-full w-full" />
            <div className="text-[11px] text-[#7A7268] font-medium">
              Case study
            </div>
          </div>

          {/* Stage 4: Offer */}
          <div className="space-y-1.5">
            <div className="h-1 bg-[#1C4631] rounded-full w-full" />
            <div className="text-[11px] text-[#7A7268] font-medium">
              Offer
            </div>
          </div>
        </div>

        {/* Pipeline List Rows matching screenshot */}
        <div className="divide-y divide-[#F0EAE1]">
          {pipelineItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => onNavigateTab(item.actionTab)}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#FDFBF7] px-2 rounded-xl transition-colors cursor-pointer group"
            >
              {/* Left: Avatar + Title + Company */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-full ${item.avatarBg} ${item.avatarText} flex items-center justify-center font-bold text-xs shrink-0 border border-black/5`}>
                  {item.avatar}
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[#1E2522] truncate group-hover:text-[#1C4631] transition-colors">
                    {item.title} <span className="font-normal text-[#7A7268]">·</span> {item.company}
                  </div>
                  <div className="text-[11px] text-[#7A7268] mt-0.5 truncate">
                    {item.subtext}
                  </div>
                </div>
              </div>

              {/* Right: Soft Colored Status Pill */}
              <div className="shrink-0">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${item.statusBg} ${item.statusText}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* "AI recommendations" Section matching screenshot */}
      <div className="bg-white rounded-3xl p-6 border border-[#ECE4D9] shadow-2xs space-y-4">
        
        {/* Header row with filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1E2522]">
              AI recommendations
            </h2>
            <p className="text-xs text-[#7A7268]">
              Ranked against your CSE profile
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F0EAE1] rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                selectedFilter === 'all' 
                  ? 'bg-white text-[#1C4631] font-semibold shadow-2xs' 
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setSelectedFilter('high')}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                selectedFilter === 'high' 
                  ? 'bg-white text-[#1C4631] font-semibold shadow-2xs' 
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              High Match (85%+)
            </button>
            <button
              onClick={() => setSelectedFilter('fulltime')}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                selectedFilter === 'fulltime' 
                  ? 'bg-white text-[#1C4631] font-semibold shadow-2xs' 
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              Full-Time
            </button>
            <button
              onClick={() => setSelectedFilter('intern')}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                selectedFilter === 'intern' 
                  ? 'bg-white text-[#1C4631] font-semibold shadow-2xs' 
                  : 'text-[#7A7268] hover:text-[#1E2522]'
              }`}
            >
              Internships
            </button>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {recommendedRoles.slice(0, 4).map(({ job, matched, missing, matchPercent, isApplied }) => {
            const isCgpaEligible = (student.cgpa || 0) >= job.minCgpa;
            const isBranchEligible = job.allowedBranches.length === 0 || job.allowedBranches.some(b => b.toLowerCase().includes(student.branch.toLowerCase()) || student.branch.toLowerCase().includes(b.toLowerCase()));
            const isEligible = isCgpaEligible && isBranchEligible;
            const ineligibilityReason = !isCgpaEligible 
              ? `Requires CGPA ${job.minCgpa} (current: ${student.cgpa})`
              : !isBranchEligible 
              ? `Requires ${job.allowedBranches.join(', ')}`
              : '';

            return (
            <div 
              key={job.id}
              className="p-5 rounded-2xl border border-[#ECE4D9] hover:border-[#DDD5C7] bg-[#FCFAF7] hover:bg-white transition-all shadow-2xs flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E3DCD1] text-[#1C4631] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {job.companyLogo || job.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E2522] group-hover:text-[#1C4631] transition-colors leading-tight">
                        {job.title}
                      </h3>
                      <div className="text-xs text-[#7A7268] mt-0.5">
                        {job.companyName} <span aria-hidden="true">·</span> {job.location}
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCE8DF] text-[#1C4631] text-xs font-bold font-mono">
                      {matchPercent}%
                    </span>
                  </div>
                </div>

                {/* Salary CTC & Type */}
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#1E2522]">
                  <span>{job.ctcOrStipend}</span>
                  <span aria-hidden="true" className="text-[#8C8377]">·</span>
                  <span className="text-[#7A7268]">{job.type}</span>
                  <span aria-hidden="true" className="text-[#8C8377]">·</span>
                  <span className="text-[#7A7268]">{job.workplaceType}</span>
                </div>

                {/* Matched Skills overview */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {matched.slice(0, 3).map((sk) => (
                    <span key={sk} className="text-[11px] bg-[#EAE3D9]/60 text-[#423C34] px-2 py-0.5 rounded-md font-medium">
                      {sk}
                    </span>
                  ))}
                  {matched.length > 3 && (
                    <span className="text-[11px] text-[#7A7268] px-1 py-0.5">
                      +{matched.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Eligibility Status Banner */}
              <div className="mt-2.5 pt-2 border-t border-[#F0EAE1]">
                {isEligible ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Eligible for Campus Placement Drive</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200">
                    <span className="shrink-0 text-rose-600">⚠</span>
                    <span className="truncate">{ineligibilityReason || 'CGPA or Branch requirements pending'}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewMatchDetails(job)}
                  className="text-xs font-semibold text-[#1C4631] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Why Shortlisted?</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                {isApplied ? (
                  <span className="text-xs font-medium text-[#2E6B48] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied</span>
                  </span>
                ) : isEligible ? (
                  <button
                    onClick={() => onApplyJob(job.id)}
                    className="px-3.5 py-1.5 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Quick Apply
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTab('skillgap')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Skill Gap</span>
                    <ArrowUpRight className="w-3 h-3 text-amber-700" />
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* View all roles link */}
        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigateTab('discover')}
            className="text-xs font-semibold text-[#1C4631] hover:text-[#122E20] hover:underline inline-flex items-center gap-1"
          >
            <span>Explore all campus recruitment drives & roles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* PERSONAL ENGINEERING PROJECTS & REPOSITORIES SHOWCASE */}
      <div className="bg-white rounded-3xl p-6 border border-[#ECE4D9] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0EAE1] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-[#1E2522] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#1C4631]" />
              Personal Engineering Projects ({student.projects?.length || 0})
            </h2>
            <p className="text-xs text-[#7A7268]">
              Verified repositories, capstone apps, and software builds saved directly to your database profile
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('profile')}
            className="px-4 py-2 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Upload Project</span>
          </button>
        </div>

        {(student.projects || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {student.projects.map((proj) => (
              <div 
                key={proj.id} 
                className="p-4 rounded-2xl border border-[#ECE4D9] bg-[#FAF8F5] hover:border-[#1C4631]/40 transition-colors space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[#1E2522] text-sm">{proj.title}</h4>
                    <div className="flex items-center gap-2">
                      {proj.githubLink && (
                        <a
                          href={proj.githubLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg text-slate-400 hover:text-[#1C4631] hover:bg-[#DCE8DF] transition-colors"
                          title="Open GitHub Repo"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {proj.liveLink && (
                        <a
                          href={proj.liveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Open Live Deployment"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-[#1C4631] font-semibold">{proj.tech}</div>
                  <p className="text-xs text-[#5E574E] leading-relaxed line-clamp-2">{proj.description}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#7A7268] border-t border-[#ECE4D9] pt-2">
                  <span className="flex items-center gap-1 text-[#227547] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved in Database
                  </span>
                  <button
                    onClick={() => onNavigateTab('profile')}
                    className="text-xs font-semibold text-[#1C4631] hover:underline"
                  >
                    Manage →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-[#7A7268] border border-dashed border-[#ECE4D9] rounded-2xl space-y-2">
            <p className="font-medium text-[#1E2522]">No personal projects uploaded yet.</p>
            <p>Upload your GitHub repositories, personal side-projects, or capstone software to showcase your skills to recruiters.</p>
            <button
              onClick={() => onNavigateTab('profile')}
              className="mt-2 px-4 py-2 bg-[#1C4631] text-white rounded-xl text-xs font-semibold"
            >
              + Add Your First Project
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
