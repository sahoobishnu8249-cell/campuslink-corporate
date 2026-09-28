import React, { useState } from 'react';
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
  ArrowUpRight
} from 'lucide-react';
import { Application, JobPosting, InterviewRecord, OfferRecord } from '../types/index.ts';

interface ApplicationsPipelineViewProps {
  applications: Application[];
  onViewJobDetails?: (jobId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const ApplicationsPipelineView: React.FC<ApplicationsPipelineViewProps> = ({
  applications,
  onViewJobDetails,
  onNavigateTab
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const stages = [
    { id: 'all', label: 'All (24)' },
    { id: 'screening', label: 'Screening (8)' },
    { id: 'interview', label: 'Interview (2)' },
    { id: 'assessment', label: 'Case Study (4)' },
    { id: 'offered', label: 'Offers (1)' },
    { id: 'accepted', label: 'Accepted (1)' }
  ];

  const filteredApps = applications.filter((app) => {
    const matchesStage = selectedStage === 'all' 
      ? true 
      : selectedStage === 'offered'
        ? (app.stage === 'offered' || app.stage === 'accepted')
        : app.stage === selectedStage;

    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStage && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
            PLACEMENT PIPELINE
          </div>
          <h1 className="font-serif text-3xl font-semibold text-[#1E2522] mt-0.5">
            My Applications
          </h1>
          <p className="text-xs text-[#7A7268] mt-1">
            Tracking 24 active submissions across campus placement drives
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => onNavigateTab?.('discover')}
          className="px-4 py-2 bg-[#1C4631] hover:bg-[#153826] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Discover More Roles</span>
        </button>
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
            placeholder="Search company or title..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F7F3EC] text-xs text-[#1E2522] placeholder-[#8C8377] rounded-full border border-[#E3DCD1] focus:outline-none focus:border-[#1C4631]"
          />
        </div>
      </div>

      {/* Applications Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Application Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#ECE4D9]">
              <p className="text-sm text-[#7A7268]">No applications match the current filter.</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const isOffer = app.stage === 'offered' || app.stage === 'accepted';
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
                      </div>
                      <div className="text-xs text-[#7A7268] mt-0.5">
                        {app.companyName} <span aria-hidden="true">·</span> {app.jobLocation || 'Campus Drive'}
                      </div>
                      
                      {/* Timeline status note */}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#5E574E]">
                        <Clock className="w-3 h-3 text-[#8C8377]" />
                        <span>{app.coverNote || 'Updated recently'}</span>
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
              </div>

              {/* Progress Milestones */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-[#1E2522]">
                  Recruitment Stage Timeline
                </div>

                <div className="space-y-2 text-xs">
                  {(selectedApp.stageHistory || [
                    { stage: 'applied', label: 'Application Submitted', timestamp: '2026-09-20' },
                    { stage: 'screening', label: 'AI Eligibility Cleared', timestamp: '2026-09-22' },
                    { stage: selectedApp.stage, label: selectedApp.coverNote || 'In Progress', timestamp: '2026-09-27' }
                  ]).map((hist, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#FDFBF7] border border-[#F0EAE1]">
                      <CheckCircle2 className="w-4 h-4 text-[#1C4631] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-[#1E2522] text-xs">{hist.label}</div>
                        <div className="text-[10px] text-[#7A7268] mt-0.5">{hist.timestamp}</div>
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
