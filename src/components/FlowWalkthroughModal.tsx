import React, { useState } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  FileText, 
  Zap, 
  Check,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { 
  StudentProfile, 
  JobPosting, 
  Company, 
  Drive, 
  Application, 
  OfferRecord,
  CampusPlacementStats,
  User
} from '../types/index.ts';
import { NavTab } from './Sidebar.tsx';
import { FLOW_STEPS, FlowStep } from './FlowWalkthroughView.tsx';

interface FlowWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  jobs: JobPosting[];
  companies: Company[];
  drives: Drive[];
  applications: Application[];
  offers: OfferRecord[];
  placementStats: CampusPlacementStats | null;
  currentUser: User | null;
  onNavigateTab: (tab: NavTab) => void;
  onOpenFullFlowView: () => void;
}

export const FlowWalkthroughModal: React.FC<FlowWalkthroughModalProps> = ({
  isOpen,
  onClose,
  student,
  jobs,
  companies,
  drives,
  applications,
  offers,
  placementStats,
  currentUser,
  onNavigateTab,
  onOpenFullFlowView
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = FLOW_STEPS[activeStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-[#F7F3EC] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-[#ECE4D9] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#ECE4D9] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C4631] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C4631] bg-[#DCE8DF] px-2.5 py-0.5 rounded-full">
                  Architecture Flow
                </span>
                <span className="text-xs text-[#7A7268]">8 Linked Phases</span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E2522] mt-0.5">
                CAMPUSLINK Process & Flow Diagram
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenFullFlowView();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C4631] hover:bg-[#153826] text-white text-xs font-semibold rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <span>Full Interactive Mode</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#7A7268] hover:text-[#1E2522] hover:bg-[#EAE3D9] rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 8-Step Navigation Strip */}
        <div className="bg-[#FAF8F5] px-4 py-2.5 border-b border-[#ECE4D9] overflow-x-auto shrink-0 flex items-center gap-2 scrollbar-none">
          {FLOW_STEPS.map((s, idx) => {
            const isCurrent = activeStepIndex === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStepIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#1C4631] text-white font-bold shadow-2xs'
                    : 'text-[#5E574E] hover:bg-[#EFE8DD]'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? 'bg-white text-[#1C4631]' : 'bg-[#E3DCD1] text-[#5E574E]'
                }`}>
                  {s.stepNumber}
                </span>
                <span>{s.shortTitle.replace(/^\d+\.\s*/, '')}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* Active Step Presentation */}
          <div className="bg-white rounded-2xl p-6 border border-[#ECE4D9] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAE1]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
                  Stage {currentStep.stepNumber} of 8 · {currentStep.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif text-[#1E2522] mt-0.5">
                  {currentStep.title}
                </h3>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateTab(currentStep.destinationTab);
                  }}
                  className="px-4 py-2 bg-[#DCE8DF] hover:bg-[#CFDDD2] text-[#1C4631] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open This Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stage Description */}
            <p className="text-sm text-[#4A4237] leading-relaxed">
              {currentStep.description}
            </p>

            {/* Architecture Entities */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#1E2522] uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#1C4631]" />
                <span>Data Models & Entities</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentStep.entities.map(e => (
                  <span key={e} className="px-2.5 py-1 bg-[#F9F6F0] border border-[#E3DCD1] text-xs font-mono rounded-lg text-[#1E2522]">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* REST API Endpoints */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[#1E2522] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1C4631]" />
                <span>RESTful APIs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentStep.apiEndpoints.map(ep => (
                  <div key={ep} className="p-2 bg-[#FAF8F5] border border-[#ECE4D9] rounded-lg text-xs font-mono text-[#5E574E]">
                    {ep}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Step Switcher */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
              disabled={activeStepIndex === 0}
              className="text-xs font-bold text-[#7A7268] hover:text-[#1E2522] disabled:opacity-30 cursor-pointer"
            >
              ← Previous Stage
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenFullFlowView();
              }}
              className="text-xs font-bold text-[#1C4631] underline cursor-pointer"
            >
              Open Full Interactive Pipeline Studio →
            </button>

            <button
              onClick={() => setActiveStepIndex(Math.min(FLOW_STEPS.length - 1, activeStepIndex + 1))}
              disabled={activeStepIndex === FLOW_STEPS.length - 1}
              className="text-xs font-bold text-[#1C4631] hover:underline disabled:opacity-30 cursor-pointer"
            >
              Next Stage →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
export default FlowWalkthroughModal;
