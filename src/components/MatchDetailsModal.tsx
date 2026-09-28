import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Building2, 
  UserCircle2, 
  GraduationCap, 
  ShieldCheck, 
  Briefcase, 
  Award, 
  ArrowRight,
  X
} from 'lucide-react';
import { JobPosting, StudentProfile, ExplainableMatch, MatchBreakdown } from '../types/index.ts';

interface MatchDetailsModalProps {
  job: JobPosting;
  student: StudentProfile;
  matchScore: number;
  breakdown: MatchBreakdown;
  explainable: ExplainableMatch;
  eligibilityStatus: 'Eligible' | 'Not Eligible';
  eligibilityReasons?: string[];
  isApplied: boolean;
  onApply: () => void;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({
  job,
  student,
  matchScore,
  breakdown,
  explainable,
  eligibilityStatus,
  eligibilityReasons,
  isApplied,
  onApply,
  onClose
}) => {
  const isShortlisted = explainable.isShortlisted;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header Strip: Student ↔ Company */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
                {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {student.fullName}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {student.branch} · CGPA {student.cgpa.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-slate-300 font-black text-sm sm:text-base font-mono">
              ↔
            </div>

            <div className="flex items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-xs text-slate-800">
                {job.companyLogo || job.companyName.slice(0, 3)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {job.companyName}
                </h3>
                <p className="text-[11px] text-indigo-600 font-medium">
                  {job.title}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Overall Match Score Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-indigo-500/20">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
              TF-IDF + Rule-Based Match Engine
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              Overall AI Match Score: <span className="text-indigo-400 font-mono">{matchScore}%</span>
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Status: <strong className={isShortlisted ? 'text-emerald-400' : 'text-rose-400'}>
                {isShortlisted ? 'AI SHORTLISTED' : 'NOT SHORTLISTED'}
              </strong>
            </div>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex flex-col items-center justify-center font-mono">
            <span className="text-2xl font-black text-white">{matchScore}%</span>
            <span className="text-[9px] uppercase text-indigo-300 font-bold">Confidence</span>
          </div>
        </div>

        {/* 5-Factor Score Breakdown Bars */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Evaluation Breakdown
          </div>

          <div className="space-y-2 text-xs">
            {[
              { label: 'Technical Skills Match', score: breakdown.technicalSkillMatch, weight: '40%' },
              { label: 'Academic Eligibility', score: breakdown.academicEligibility, weight: '20%' },
              { label: 'Project Portfolio Relevance', score: breakdown.projectRelevance, weight: '15%' },
              { label: 'Certification Alignment', score: breakdown.certificationMatch, weight: '10%' },
              { label: 'Mock Interview Performance', score: breakdown.interviewPerformance, weight: '15%' },
            ].map((factor, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800">
                    {factor.label} <span className="font-normal text-slate-400 font-mono text-[10px]">({factor.weight})</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900">{factor.score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matched Skills & Skill Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Matched */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Matched Skills ({explainable.matchedSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {explainable.matchedSkills.map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-2xs">
                  ✓ {s}
                </span>
              ))}
            </div>
          </div>

          {/* Missing / Gaps */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Skill Gaps ({explainable.missingSkills.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {explainable.missingSkills.length === 0 ? (
                <span className="text-xs text-emerald-700 font-bold">Zero skill gaps detected!</span>
              ) : (
                explainable.missingSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white text-amber-800 border border-amber-300 rounded-lg text-xs font-bold shadow-2xs">
                    ⚠ {s}
                  </span>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Hard Eligibility Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hard Eligibility Benchmark
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className={`w-4 h-4 ${student.cgpa >= job.minCgpa ? 'text-emerald-600' : 'text-rose-500'}`} />
              <span>CGPA &gt;= {job.minCgpa} (Candidate: {student.cgpa.toFixed(2)})</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Eligible Branch ({student.branch.split(' ')[0]})</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200">
              <CheckCircle2 className={`w-4 h-4 ${(student.backlogs ?? 0) <= job.maxBacklogs ? 'text-emerald-600' : 'text-rose-500'}`} />
              <span>Backlogs: {student.backlogs ?? 0} (Max {job.maxBacklogs})</span>
            </div>
          </div>
        </div>

        {/* Explainable AI Card */}
        <div className={`p-5 rounded-2xl border space-y-2 ${isShortlisted ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-rose-50 border-rose-200 text-rose-950'}`}>
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${isShortlisted ? 'text-indigo-600' : 'text-rose-600'}`} />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              ✦ AI Explanation & Why This Result
            </span>
          </div>

          <p className="text-xs font-medium leading-relaxed">
            {explainable.summary}
          </p>

          <div className="pt-2 text-[11px] text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200 space-y-1">
            <div>
              <strong>Recommended Action:</strong> {explainable.recommendedAction}
            </div>
            <div>
              <strong>Assessment Benchmark:</strong> {explainable.assessmentBenchmark}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close Details
          </button>

          {!isApplied ? (
            <button
              onClick={() => {
                onApply();
                onClose();
              }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
            >
              <span>1-Click Apply for {job.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300">
              Application In Review ✓
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
