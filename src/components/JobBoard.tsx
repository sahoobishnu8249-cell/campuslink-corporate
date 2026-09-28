import React, { useState } from 'react';
import { JobPosting, StudentProfile, Application, User } from '../types/index.ts';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Building, 
  Users, 
  ArrowRight,
  Filter,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Check,
  Building2,
  Clock,
  ChevronRight
} from 'lucide-react';

interface JobBoardProps {
  jobs: JobPosting[];
  studentProfile: StudentProfile | null;
  applications: Application[];
  currentUser: User | null;
  onApply: (jobId: string, coverNote: string) => Promise<void>;
  onSelectApplication?: (applicationId: string) => void;
  onRefreshJobs: () => void;
  onOpenPostJob?: () => void;
  onInspectMatch?: (job: JobPosting) => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({
  jobs,
  studentProfile,
  applications,
  currentUser,
  onApply,
  onSelectApplication,
  onOpenPostJob,
  onInspectMatch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isStudent = currentUser?.role === 'student';
  const studentCgpa = studentProfile?.cgpa ?? 8.92;
  const studentBranch = studentProfile?.branch || 'Computer Science & Engineering';
  const studentSkills = studentProfile?.skills || ['React', 'Node.js', 'TypeScript', 'MongoDB'];

  // Calculate skill match score
  const calculateMatchScore = (job: JobPosting): number => {
    if (!studentSkills || studentSkills.length === 0 || !job.skills || job.skills.length === 0) return 85;
    const matching = job.skills.filter(js => 
      studentSkills.some(ss => ss.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(ss.toLowerCase()))
    );
    const score = Math.round((matching.length / job.skills.length) * 100);
    // Weighted with CGPA check
    return Math.min(99, Math.max(70, studentCgpa >= job.minCgpa ? score + 15 : score));
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      selectedType === 'All' || 
      (selectedType === 'Super Dream' ? job.ctcOrStipend.includes('2') || job.ctcOrStipend.includes('3') : job.type === selectedType);

    return matchesSearch && matchesType;
  });

  const checkEligibility = (job: JobPosting): { isEligible: boolean; reason: string } => {
    if (!isStudent) {
      return { isEligible: true, reason: 'Eligible for review' };
    }

    if (studentCgpa < job.minCgpa) {
      return { 
        isEligible: false, 
        reason: `Min CGPA ${job.minCgpa.toFixed(1)} required (Yours: ${studentCgpa.toFixed(2)})` 
      };
    }

    // Check branch if specified
    const hasBranchMatch = job.allowedBranches.some(b => 
      b.toLowerCase() === 'all engineering disciplines' || 
      b.toLowerCase() === studentBranch.toLowerCase() ||
      studentBranch.toLowerCase().includes(b.toLowerCase())
    );

    if (!hasBranchMatch && job.allowedBranches.length > 0) {
      return {
        isEligible: false,
        reason: `Open for: ${job.allowedBranches.slice(0, 2).join(', ')}`
      };
    }

    return { 
      isEligible: true, 
      reason: `Eligible · CGPA ${studentCgpa.toFixed(2)} meets threshold (${job.minCgpa.toFixed(1)})` 
    };
  };

  const getApplicationForJob = (jobId: string): Application | undefined => {
    return applications.find(a => a.jobId === jobId);
  };

  const handleOpenJobModal = (job: JobPosting) => {
    setSelectedJob(job);
    setSubmitError(null);
    setSubmitSuccess(false);
    setCoverNote(
      isStudent
        ? `Excited to apply for ${job.title} at ${job.companyName}! My coursework in ${studentBranch} and project experience with ${job.skills.slice(0, 3).join(', ')} align closely with your engineering requirements.`
        : ''
    );
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onApply(selectedJob.id, coverNote);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSelectedJob(null);
        setSubmitSuccess(false);
      }, 1600);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Lovable-Inspired Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-900/50">
        
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Campus Recruitment Season 2026-27 is Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Connect with Top Tier Engineering & Tech Drives
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Explore verified corporate placement drives, assess eligibility matching in real time, and track recruitment rounds end-to-end.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <div className="text-xl sm:text-2xl font-bold font-mono text-white">46+</div>
              <div className="text-[11px] text-slate-400">Marquee Partners</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">₹48 LPA</div>
              <div className="text-[11px] text-slate-400">Peak Campus CTC</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400">94%</div>
              <div className="text-[11px] text-slate-400">Placement Rate</div>
            </div>
            <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">Live SSE</div>
              <div className="text-[11px] text-slate-400">Instant Tracking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company name, skill (e.g. React, Python), or city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Interactive filter pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto">
            {['All', 'Full-Time', 'Internship', 'Super Dream', 'Co-op'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tags Bar */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 overflow-x-auto">
          <span className="font-semibold text-slate-700 shrink-0">Popular Skills:</span>
          {['React', 'TypeScript', 'Node.js', 'Distributed Systems', 'Python', 'Cloud / Docker'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg text-[11px] font-mono transition-colors shrink-0"
            >
              #{tag}
            </button>
          ))}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-rose-600 hover:underline shrink-0 ml-1"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-base font-bold text-slate-900">No campus drives match criteria</div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keyword or clearing filter pills to view all active company drives.
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const existingApp = getApplicationForJob(job.id);
            const { isEligible, reason } = checkEligibility(job);
            const matchScore = calculateMatchScore(job);

            return (
              <div
                key={job.id}
                className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 to-indigo-50/50 border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-950 tracking-tight shadow-2xs group-hover:border-indigo-200 transition-colors">
                        {job.companyLogo || job.companyName.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                          {job.title}
                        </h2>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{job.companyName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">{job.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    {isStudent && (
                      <div className="flex flex-col items-end">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-100 flex items-center gap-1 font-mono">
                          <Zap className="w-3 h-3 text-indigo-600" />
                          {matchScore}% Match
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-3.5">
                    <span className="font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-md">
                      {job.type}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                      {job.workplaceType}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{job.location}</span>
                  </div>

                  {/* Compensation Tag */}
                  <div className="mt-3 inline-block px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 font-bold font-mono text-xs rounded-xl shadow-2xs">
                    {job.ctcOrStipend}
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                    {job.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="text-[11px] text-slate-400 pl-1 font-mono">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px]">
                    {existingApp ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>Applied ({existingApp.stage.toUpperCase()})</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1.5 ${isEligible ? 'text-slate-600' : 'text-amber-700 font-medium'}`}>
                        {isEligible ? (
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">{reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onInspectMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectMatch(job);
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 border border-indigo-200"
                        title="Inspect TF-IDF AI Match Breakdown"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">AI Match</span>
                      </button>
                    )}

                    {existingApp && onSelectApplication ? (
                      <button
                        onClick={() => onSelectApplication(existingApp.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                      >
                        Track Status
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenJobModal(job)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all shadow-xs shadow-indigo-500/20 whitespace-nowrap active:scale-98"
                      >
                        View & Apply
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Job Details & Apply Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-sm text-indigo-900 tracking-tight shadow-xs">
                  {selectedJob.companyLogo || selectedJob.companyName.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedJob.title}</h2>
                  <div className="text-xs text-slate-500 font-medium">
                    {selectedJob.companyName} · {selectedJob.department}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
              
              {/* Highlight Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-medium">Compensation / CTC</div>
                  <div className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {selectedJob.ctcOrStipend}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Min CGPA Required</div>
                  <div className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {selectedJob.minCgpa.toFixed(1)} / 10.0
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Location</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedJob.location}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Role Type</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedJob.type} ({selectedJob.workplaceType})
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Application Deadline</div>
                  <div className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {selectedJob.applicationDeadline}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Open Positions</div>
                  <div className="font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {selectedJob.openingsCount} Openings
                  </div>
                </div>
              </div>

              {/* Eligibility Check Box */}
              {isStudent && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  checkEligibility(selectedJob).isEligible 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {checkEligibility(selectedJob).isEligible ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        {checkEligibility(selectedJob).isEligible ? 'Eligibility Verified' : 'Eligibility Notice'}
                      </span>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {checkEligibility(selectedJob).reason}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-white/70 px-2 py-1 rounded-lg border border-slate-200/50">
                    Your CGPA: {studentCgpa.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Job Description */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  About The Role
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                    Key Responsibilities
                  </h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Eligible Branches */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Target Academic Branches
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.allowedBranches.map((branch) => (
                    <span
                      key={branch}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Application Form */}
              {isStudent && !getApplicationForJob(selectedJob.id) && (
                <form onSubmit={handleSubmitApplication} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">
                      Candidate Pitch / Cover Note
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Briefly state your suitability, key projects, and motivation..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all leading-relaxed"
                      required
                    />
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                    <div>
                      Attached Resume: <span className="font-bold font-mono text-indigo-950">{studentProfile?.resumeFilename || 'Student_Resume_2026.pdf'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Verified placement credential</span>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Application submitted successfully! Live real-time tracker updated.
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !checkEligibility(selectedJob).isEligible}
                      className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-98"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                    </button>
                  </div>
                </form>
              )}

              {/* Already applied state */}
              {getApplicationForJob(selectedJob.id) && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Application active and being tracked live.</span>
                  </div>
                  <button
                    onClick={() => {
                      const app = getApplicationForJob(selectedJob.id);
                      setSelectedJob(null);
                      if (app && onSelectApplication) onSelectApplication(app.id);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-xs"
                  >
                    View Status Tracker
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
