import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Video, 
  Award, 
  MapPin, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  Briefcase
} from 'lucide-react';
import { Application, ApplicationStage } from '../types/index.ts';

interface ApplicationTrackerModalProps {
  application: Application | null;
  onClose: () => void;
  onOpenFullApplications?: (applicationId: string) => void;
  onRespondOffer?: (applicationId: string, action: 'accept' | 'decline') => Promise<void>;
}

export const ApplicationTrackerModal: React.FC<ApplicationTrackerModalProps> = ({
  application,
  onClose,
  onOpenFullApplications,
  onRespondOffer
}) => {
  if (!application) return null;

  const app = application;

  const stageOrder: ApplicationStage[] = [
    'applied',
    'screening',
    'assessment',
    'interview',
    'hr_round',
    'offered',
    'accepted',
    'joined'
  ];

  const getStageIndex = (stage: ApplicationStage) => {
    const idx = stageOrder.indexOf(stage);
    return idx === -1 ? 0 : idx;
  };

  const currentStageIndex = getStageIndex(app.stage);

  const pipelineSteps = [
    { id: 'applied', label: 'Applied', desc: 'Application logged' },
    { id: 'screening', label: 'Screening', desc: 'AI ATS verification' },
    { id: 'assessment', label: 'Assessment', desc: 'Coding & tests' },
    { id: 'interview', label: 'Interview', desc: 'Technical panel' },
    { id: 'offered', label: 'Offer', desc: 'Campus package' },
    { id: 'joined', label: 'Joined', desc: 'Official placement' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-indigo-900 font-black text-sm flex items-center justify-center shrink-0">
              {app.companyLogo || app.companyName.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LIVE APPLICATION STATUS TRACKER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ID: #{app.id.slice(-6)}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {app.jobTitle}
              </h2>
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-slate-700">{app.companyName}</span>
                <span>·</span>
                <span>{app.jobLocation || 'Campus Placement'}</span>
                <span>·</span>
                <span className="font-mono text-emerald-700 font-bold">{app.ctcOrStipend}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE STATUS BANNER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <div className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">Current Pipeline Stage</div>
            <div className="text-lg font-black text-white capitalize mt-0.5 flex items-center gap-2">
              <span>{app.stage.replace('_', ' ')}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                ACTIVE
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1">
              {app.coverNote || 'Application in active review with campus recruitment panel.'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl text-center border border-white/10 shrink-0 self-start sm:self-auto">
            <span className="text-[10px] text-slate-300 block font-semibold uppercase">AI Match</span>
            <span className="text-xl font-black text-emerald-300 font-mono">{app.matchScore}%</span>
          </div>
        </div>

        {/* VISUAL STEP PROGRESSION TRACKER */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900">Placement Stage Progression</div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            {pipelineSteps.map((step, idx) => {
              const isPast = getStageIndex(step.id as ApplicationStage) < currentStageIndex;
              const isCurrent = getStageIndex(step.id as ApplicationStage) === currentStageIndex;
              const isFuture = getStageIndex(step.id as ApplicationStage) > currentStageIndex;

              return (
                <div 
                  key={step.id}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    isCurrent 
                      ? 'bg-indigo-50 border-indigo-300 shadow-xs ring-1 ring-indigo-400/40' 
                      : isPast 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-slate-50 border-slate-100 opacity-60'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-1">
                    {isPast ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    ) : (
                      <span className="text-slate-400">{idx + 1}</span>
                    )}
                  </div>
                  <div className={`font-bold text-[11px] ${
                    isCurrent ? 'text-indigo-900 font-extrabold' : isPast ? 'text-emerald-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERVIEW CARD (IF INTERVIEW SCHEDULED) */}
        {app.interviewDetails && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                <Video className="w-4 h-4 text-amber-700" />
                <span>Upcoming Technical Interview</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Action Required
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/70 p-3 rounded-xl border border-amber-200/60">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Round</span>
                <span className="font-bold text-slate-900">{app.interviewDetails.roundName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Schedule</span>
                <span className="font-mono text-slate-900">{app.interviewDetails.date} · {app.interviewDetails.time}</span>
              </div>
              {app.interviewDetails.venue && (
                <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-700 pt-1 border-t border-amber-100">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span><strong>Venue:</strong> {app.interviewDetails.venue}</span>
                </div>
              )}
              {app.interviewDetails.meetingLink && (
                <div className="sm:col-span-2 pt-1">
                  <a
                    href={app.interviewDetails.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Join Live Interview Meeting</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OFFER DETAILS CARD (IF EXTENDED) */}
        {app.offerDetails && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Campus Offer Extended!</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900">
                {app.offerDetails.status || 'Extended'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Offered Package:</span>
                <span className="text-base font-black text-emerald-700 font-mono">{app.offerDetails.ctc}</span>
              </div>
              {app.offerDetails.baseFixed && (
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Fixed Component:</span>
                  <span className="font-mono font-semibold">{app.offerDetails.baseFixed}</span>
                </div>
              )}
              {app.offerDetails.joiningDate && (
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Expected Joining Date:</span>
                  <span className="font-mono font-semibold">{app.offerDetails.joiningDate}</span>
                </div>
              )}
              {app.offerDetails.terms && (
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 mt-2">
                  {app.offerDetails.terms}
                </p>
              )}
            </div>

            {onRespondOffer && (app.offerDetails.status !== 'Accepted' && app.offerDetails.status !== 'Joined') && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onRespondOffer(app.id, 'accept')}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  Accept Offer Letter 🤝
                </button>
                <button
                  onClick={() => onRespondOffer(app.id, 'decline')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* TIMELINE HISTORY */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900">Submission & Evaluation Log</div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(app.stageHistory && app.stageHistory.length > 0 ? app.stageHistory : [
              { stage: 'applied', label: 'Application Submitted', timestamp: app.createdAt.split('T')[0], note: 'Application registered on CAMPUSLINK' },
              { stage: app.stage, label: app.coverNote || 'In Progress', timestamp: app.updatedAt.split('T')[0], note: 'Latest update' }
            ]).map((hist, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{hist.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {hist.timestamp ? hist.timestamp.split('T')[0] : 'Today'}
                    </span>
                  </div>
                  {hist.note && (
                    <div className="text-[11px] text-slate-600 mt-0.5">{hist.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
          >
            Close Tracker
          </button>

          {onOpenFullApplications && (
            <button
              onClick={() => {
                onClose();
                onOpenFullApplications(app.id);
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open in Full Applications Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
