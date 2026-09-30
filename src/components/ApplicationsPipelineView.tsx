import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Building2, 
  Award, 
  AlertCircle,
  Video,
  FileText,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Send,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { Application, JobPosting, User, StudentProfile } from '../types/index.ts';

interface ApplicationsPipelineViewProps {
  applications: Application[];
  initialSelectedAppId?: string | null;
  currentUser?: User | null;
  activeStudent?: StudentProfile;
  jobs?: JobPosting[];
  onApplyJob?: (jobId: string, coverNote?: string) => Promise<any>;
  onViewJobDetails?: (jobId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const ApplicationsPipelineView: React.FC<ApplicationsPipelineViewProps> = ({
  applications,
  initialSelectedAppId,
  currentUser,
  activeStudent,
  jobs = [],
  onApplyJob,
  onViewJobDetails,
  onNavigateTab
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedAppId) {
      const match = applications.find(a => a.id === initialSelectedAppId);
      if (match) {
        setSelectedApp(match);
        return;
      }
    }
    if (!selectedApp && applications.length > 0) {
      setSelectedApp(applications[0]);
    }
  }, [initialSelectedAppId, applications]);

  const isTPO = currentUser?.role === 'tpo';

  // Dynamic real counts from the database
  const stageCounts = {
    all: applications.length,
    screening: applications.filter(a => a.stage === 'screening').length,
    interview: applications.filter(a => a.stage === 'interview').length,
    assessment: applications.filter(a => a.stage === 'assessment').length,
    offered: applications.filter(a => a.stage === 'offered' || a.stage === 'accepted').length,
    accepted: applications.filter(a => a.stage === 'accepted' || a.stage === 'joined').length
  };

  const stages = [
    { id: 'all', label: `All (${stageCounts.all})` },
    { id: 'screening', label: `Screening (${stageCounts.screening})` },
    { id: 'interview', label: `Interview (${stageCounts.interview})` },
    { id: 'assessment', label: `Assessment (${stageCounts.assessment})` },
    { id: 'offered', label: `Offers (${stageCounts.offered})` },
    { id: 'accepted', label: `Accepted (${stageCounts.accepted})` }
  ];

  const filteredApps = applications.filter((app) => {
    const matchesStage = selectedStage === 'all' 
      ? true 
      : selectedStage === 'offered'
        ? (app.stage === 'offered' || app.stage === 'accepted')
        : selectedStage === 'accepted'
          ? (app.stage === 'accepted' || app.stage === 'joined')
          : app.stage === selectedStage;

    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.studentName && app.studentName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStage && matchesSearch;
  });

  const handleInstantApply = async (jobId: string) => {
    if (!onApplyJob) return;
    setApplyingJobId(jobId);
    try {
      await onApplyJob(jobId, 'Applied via CAMPUSLINK Instant Application Pipeline.');
    } catch (e: any) {
      alert(e.message || 'Application failed');
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
              {isTPO ? 'INSTITUTIONAL PIPELINE MONITOR' : 'MY PLACEMENT PIPELINE'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F5E9] text-[#227547] border border-[#C5ECD2]">
              Live Real Data
            </span>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1E2522] mt-0.5">
            {isTPO ? 'All Student Applications' : 'My Applications'}
          </h1>
          <p className="text-xs text-[#7A7268] mt-1">
            Tracking {applications.length} real active {applications.length === 1 ? 'submission' : 'submissions'} across campus placement drives
            {activeStudent ? ` for ${activeStudent.fullName} (${activeStudent.email})` : ''}
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab?.('discover')}
            className="px-4 py-2 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Discover More Roles</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#ECE4D9] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Stage Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {stages.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStage(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedStage === st.id
                  ? 'bg-[#1C4631] text-white font-semibold shadow-2xs'
                  : 'text-[#7A7268] hover:text-[#1E2522] hover:bg-[#F0EAE1]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8377]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isTPO ? "Search company, job, or student..." : "Search company or title..."}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F7F3EC] text-xs text-[#1E2522] placeholder-[#8C8377] rounded-full border border-[#E3DCD1] focus:outline-none focus:border-[#1C4631]"
          />
        </div>
      </div>

      {/* Applications Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Application Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#ECE4D9] space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F7F3EC] text-[#1C4631] flex items-center justify-center">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-[#1E2522]">
                  {applications.length === 0 
                    ? 'No Job Applications Found Yet' 
                    : 'No Applications Match This Stage'}
                </h3>
                <p className="text-xs text-[#7A7268] mt-1">
                  {applications.length === 0 
                    ? `You haven't applied to any campus drives yet. Explore available jobs below or visit Discover to apply with your verified profile.`
                    : `Try selecting "All" or a different stage filter to view all your submissions.`}
                </p>
              </div>

              {/* Instant Apply options when 0 applications */}
              {applications.length === 0 && jobs.length > 0 && (
                <div className="pt-4 border-t border-[#ECE4D9] text-left max-w-lg mx-auto space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1C4631]" />
                    <span>Recommended Drives to Apply Now</span>
                  </div>
                  <div className="space-y-2">
                    {jobs.slice(0, 3).map(j => (
                      <div key={j.id} className="p-3 bg-[#FDFBF7] rounded-xl border border-[#ECE4D9] flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-[#1E2522]">{j.title}</div>
                          <div className="text-[11px] text-[#7A7268]">{j.companyName} · {j.ctcOrStipend}</div>
                        </div>
                        <button
                          disabled={applyingJobId === j.id}
                          onClick={() => handleInstantApply(j.id)}
                          className="px-3 py-1.5 bg-[#1C4631] hover:bg-[#153826] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                        >
                          {applyingJobId === j.id ? 'Applying...' : '1-Click Apply'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const isOffer = app.stage === 'offered' || app.stage === 'accepted' || app.stage === 'joined';
              const isInterview = app.stage === 'interview';

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected 
                      ? 'border-[#1C4631] ring-1 ring-[#1C4631]' 
                      : 'border-[#ECE4D9] hover:border-[#DDD5C7]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#F7F3EC] border border-[#E3DCD1] text-[#1C4631] font-bold text-xs flex items-center justify-center shrink-0">
                      {app.companyLogo || app.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#1E2522] truncate">
                          {app.jobTitle}
                        </h3>
                        {isTPO && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {app.studentName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#7A7268] mt-0.5">
                        {app.companyName} <span aria-hidden="true">·</span> {app.jobLocation || 'Campus Drive'}
                      </div>
                      
                      {/* Timeline status note */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5E574E]">
                        <Clock className="w-3 h-3 text-[#8C8377]" />
                        <span>{app.coverNote || 'Updated recently in recruitment cycle'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Stage Badge & Match Score */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#F0EAE1]">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isOffer 
                        ? 'bg-[#E2F5E9] text-[#227547]' 
                        : isInterview 
                          ? 'bg-[#FCE8DE] text-[#B8552D]' 
                          : app.stage === 'screening' 
                            ? 'bg-[#E8F0FE] text-[#2B5885]' 
                            : 'bg-[#F0EAE1] text-[#5E574E]'
                    }`}>
                      {app.stage.toUpperCase()}
                    </span>

                    <span className="text-[11px] font-mono text-[#7A7268]">
                      Match: <strong className="text-[#1E2522]">{app.matchScore}%</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 1 Col: Stage Inspector Drawer / Details */}
        <div className="bg-white rounded-3xl p-6 border border-[#ECE4D9] shadow-2xs h-fit space-y-5 sticky top-20">
          {selectedApp ? (
            <>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A7268]">
                  APPLICATION DETAILS
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1E2522] mt-0.5">
                  {selectedApp.jobTitle}
                </h3>
                <div className="text-xs text-[#7A7268] mt-0.5">
                  {selectedApp.companyName} <span aria-hidden="true">·</span> {selectedApp.ctcOrStipend}
                </div>
                {isTPO && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-bold text-slate-800">Candidate:</span> {selectedApp.studentName} ({selectedApp.studentEmail})
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      CGPA: {selectedApp.studentCgpa} · {selectedApp.studentBranch}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Milestones */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-[#1E2522]">
                  Recruitment Stage Timeline
                </div>

                <div className="space-y-2 text-xs">
                  {(selectedApp.stageHistory && selectedApp.stageHistory.length > 0 
                    ? selectedApp.stageHistory 
                    : [
                      { stage: 'applied', label: 'Application Submitted', timestamp: selectedApp.createdAt.split('T')[0], note: 'Application logged' },
                      { stage: 'screening', label: 'AI Eligibility Cleared', timestamp: selectedApp.createdAt.split('T')[0], note: 'Match score checked' },
                      { stage: selectedApp.stage, label: selectedApp.coverNote || 'In Review', timestamp: selectedApp.updatedAt.split('T')[0], note: selectedApp.coverNote || '' }
                    ]
                  ).map((hist, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FDFBF7] border border-[#F0EAE1]">
                      <CheckCircle2 className="w-4 h-4 text-[#1C4631] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#1E2522] text-xs">{hist.label}</div>
                        <div className="text-[10px] text-[#7A7268] mt-0.5">
                          {hist.timestamp} {hist.note ? `· ${hist.note}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview info if available */}
              {selectedApp.interviewDetails && (
                <div className="p-3.5 rounded-2xl bg-[#FCE8DE]/40 border border-[#FCE8DE] text-xs space-y-1.5">
                  <div className="font-bold text-[#B8552D] flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    <span>Upcoming Interview</span>
                  </div>
                  <div className="text-[#1E2522] font-semibold">
                    {selectedApp.interviewDetails.roundName}
                  </div>
                  <div className="text-[11px] text-[#7A7268]">
                    {selectedApp.interviewDetails.date} at {selectedApp.interviewDetails.time}
                  </div>
                  {selectedApp.interviewDetails.venue && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      <span>{selectedApp.interviewDetails.venue}</span>
                    </div>
                  )}
                  {selectedApp.interviewDetails.meetingLink && (
                    <a
                      href={selectedApp.interviewDetails.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[11px] text-indigo-700 underline font-semibold mt-1"
                    >
                      Join Virtual Room →
                    </a>
                  )}
                </div>
              )}

              {/* Offer details if available */}
              {selectedApp.offerDetails && (
                <div className="p-3.5 rounded-2xl bg-[#E2F5E9]/50 border border-[#E2F5E9] text-xs space-y-2">
                  <div className="font-bold text-[#227547] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Offer Extended: {selectedApp.offerDetails.ctc}</span>
                  </div>
                  <p className="text-[11px] text-[#5E574E] leading-relaxed">
                    {selectedApp.offerDetails.terms}
                  </p>
                  <button
                    onClick={() => onNavigateTab?.('offers')}
                    className="w-full py-1.5 bg-[#1C4631] text-white rounded-xl text-xs font-semibold hover:bg-[#153826] transition-colors"
                  >
                    View Official Offer Letter
                  </button>
                </div>
              )}

              {/* Action */}
              <button
                onClick={() => onViewJobDetails?.(selectedApp.jobId)}
                className="w-full py-2 bg-[#F0EAE1] hover:bg-[#EAE3D9] text-[#1C4631] font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>View Job Specification</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="text-center py-10 text-[#7A7268] space-y-2">
              <Briefcase className="w-8 h-8 mx-auto text-[#8C8377]" />
              <p className="text-xs">Click any application to inspect stage feedback, dates, and details.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
