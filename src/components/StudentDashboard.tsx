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
  Video
} from 'lucide-react';
import { 
  StudentProfile, 
  JobPosting, 
  Application, 
  InterviewRecord,
  SkillGapAnalysis 
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

  // Recommendations calculated from student skills
  const studentSkillsLower = (student.skills || []).map(s => s.toLowerCase());
  
  const recommendedRoles = jobs.map((job) => {
    const matched = job.skills.filter(s => studentSkillsLower.includes(s.toLowerCase()));
    const missing = job.skills.filter(s => !studentSkillsLower.includes(s.toLowerCase()));
    const matchPercent = Math.min(96, Math.max(68, Math.round((matched.length / Math.max(1, job.skills.length)) * 55 + 41)));
    const isApplied = applications.some(a => a.jobId === job.id && a.studentId === student.userId);

    return {
      job,
      matched,
      missing,
      matchPercent,
      isApplied
    };
  }).filter(item => {
    if (selectedFilter === 'high') return item.matchPercent >= 85;
    if (selectedFilter === 'intern') return item.job.type === 'Internship';
    if (selectedFilter === 'fulltime') return item.job.type === 'Full-Time';
    return true;
  });

  // Calculate current date string matching the screenshot: "THURSDAY · 14 MARCH"
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date()).toUpperCase().replace(',', ' ·');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
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

      {/* Top 4 Stat Cards matching screenshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: MATCH SCORE */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE4D9] shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            MATCH SCORE
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              78
            </span>
            <span className="font-serif text-2xl font-bold text-[#1E2522]">%</span>
          </div>
          <div className="text-[12px] font-medium text-[#2E6B48]">
            +6 since Monday
          </div>
        </div>

        {/* Card 2: APPLICATIONS */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE4D9] shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            APPLICATIONS
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              24
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#7A7268]">
            3 in final round
          </div>
        </div>

        {/* Card 3: INTERVIEWS */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE4D9] shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            INTERVIEWS
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              2
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#B8552D]">
            Next: Fri 10:00
          </div>
        </div>

        {/* Card 4: OFFERS */}
        <div className="bg-white rounded-2xl p-5 border border-[#ECE4D9] shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            OFFERS
          </div>
          <div className="my-2">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1E2522] tracking-tight">
              1
            </span>
          </div>
          <div className="text-[12px] font-medium text-[#7A7268]">
            Awaiting response
          </div>
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
          {recommendedRoles.slice(0, 4).map(({ job, matched, missing, matchPercent, isApplied }) => (
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
                ) : (
                  <button
                    onClick={() => onApplyJob(job.id)}
                    className="px-3.5 py-1.5 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Quick Apply
                  </button>
                )}
              </div>
            </div>
          ))}
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

    </div>
  );
};
