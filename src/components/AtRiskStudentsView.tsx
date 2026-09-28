import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  UserCircle2, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Filter,
  GraduationCap
} from 'lucide-react';
import { AtRiskStudent } from '../types/index.ts';

interface AtRiskStudentsViewProps {
  atRiskStudents: AtRiskStudent[];
}

export const AtRiskStudentsView: React.FC<AtRiskStudentsViewProps> = ({ atRiskStudents }) => {
  const [filterRisk, setFilterRisk] = useState<string>('All');

  const filtered = filterRisk === 'All'
    ? atRiskStudents
    : atRiskStudents.filter(s => s.riskLevel === filterRisk);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              At-Risk Student Intervention Hub
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Predictive AI indicators identifying candidates needing academic counseling, aptitude remediation, or mock interview coaching.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs text-slate-500 font-medium">Risk Level:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Risk Levels ({atRiskStudents.length})</option>
            <option value="HIGH">HIGH Risk Only</option>
            <option value="MEDIUM">MEDIUM Risk Only</option>
          </select>
        </div>
      </div>

      {/* AI Indicator Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-extrabold uppercase tracking-wider text-[10px]">
            ✦ Institutional Predictive Intelligence Disclaimer
          </div>
          <p className="leading-relaxed">
            These risk levels are <strong>AI-generated diagnostic indicators</strong> derived from technical skill coverage, academic backlogs, aptitude benchmarking, and interview conversion ratios. They represent opportunities for targeted coaching and are not deterministic outcomes.
          </p>
        </div>
      </div>

      {/* Student Risk Cards */}
      <div className="space-y-3">
        {filtered.map((student) => (
          <div
            key={student.studentId}
            className={`p-5 rounded-3xl border transition-all ${
              student.riskLevel === 'HIGH' 
                ? 'bg-white border-rose-200 hover:border-rose-400 shadow-xs' 
                : 'bg-white border-amber-200 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              
              {/* Student Overview */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                    student.riskLevel === 'HIGH' ? 'bg-rose-600' : 'bg-amber-600'
                  }`}>
                    {student.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {student.studentName}
                      </h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                        student.riskLevel === 'HIGH' 
                          ? 'bg-rose-100 text-rose-800 border-rose-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {student.riskLevel} RISK
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {student.branch} · CGPA: <strong>{student.cgpa.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Reasons List */}
                <div className="pt-2 space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Diagnostic Risk Factors:
                  </div>
                  <ul className="space-y-1">
                    {student.reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics Badge */}
              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0">
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Readiness Score</div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {student.readinessScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500">
                  Technical Coverage: <strong className="text-slate-800">{student.technicalCoverage}%</strong>
                </div>
              </div>

            </div>

            {/* Recommended Action Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>AI Recommended Action:</strong> {student.recommendedAction}
                </span>
              </div>

              <button
                onClick={() => alert(`Remediation invite and counseling session logged for ${student.studentName}.`)}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Schedule Counseling
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
