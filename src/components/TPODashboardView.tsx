import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  CalendarClock, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Briefcase, 
  FileCheck2, 
  ArrowRight, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  GraduationCap
} from 'lucide-react';
import { CampusPlacementStats, AtRiskStudent, Drive, Application } from '../types/index.ts';

interface TPODashboardViewProps {
  stats: CampusPlacementStats;
  atRiskStudents: AtRiskStudent[];
  drives: Drive[];
  applications: Application[];
  onNavigateTab: (tab: any) => void;
}

export const TPODashboardView: React.FC<TPODashboardViewProps> = ({
  stats,
  atRiskStudents,
  drives,
  applications,
  onNavigateTab
}) => {
  const f = stats.funnel;

  const funnelStages = [
    { label: 'Registered', count: f.registered, color: 'bg-indigo-600', text: 'text-indigo-600', percent: '100%' },
    { label: 'Eligible', count: f.eligible, color: 'bg-indigo-500', text: 'text-indigo-500', percent: `${Math.round((f.eligible / f.registered) * 100)}%` },
    { label: 'Shortlisted', count: f.shortlisted, color: 'bg-purple-600', text: 'text-purple-600', percent: `${Math.round((f.shortlisted / f.registered) * 100)}%` },
    { label: 'Interviewed', count: f.interviewed, color: 'bg-purple-500', text: 'text-purple-500', percent: `${Math.round((f.interviewed / f.registered) * 100)}%` },
    { label: 'Selected', count: f.selected, color: 'bg-emerald-600', text: 'text-emerald-600', percent: `${Math.round((f.selected / f.registered) * 100)}%` },
    { label: 'Offer Accepted', count: f.offerAccepted, color: 'bg-teal-600', text: 'text-teal-600', percent: `${Math.round((f.offerAccepted / f.registered) * 100)}%` },
    { label: 'Joined', count: f.joined, color: 'bg-emerald-700', text: 'text-emerald-700', percent: `${Math.round((f.joined / f.registered) * 100)}%` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Placement Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            University Placement Cell executive monitoring, conversion pipelines, and early-warning indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('scheduling')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <CalendarClock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Manage Drives ({drives.length})</span>
          </button>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Full Analytics Report</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {stats.totalStudents.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Batch 2026 Enrolled</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Placement Ready</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono mt-1">
            {stats.placementReady}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Score &gt;= 75/100</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Drives</span>
            <CalendarClock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {stats.activeDrives}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Conflict-Free Slots</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Offers</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
            {stats.totalOffers}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Top: ₹48 LPA</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Placement Rate</span>
            <TrendingUp className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-700 font-mono mt-1">
            {stats.placementRate}%
          </div>
          <div className="text-[10px] text-teal-600 font-bold mt-0.5">302 Students Placed</div>
        </div>

        <div 
          onClick={() => onNavigateTab('atrisk')}
          className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:bg-rose-50/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Students At Risk</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            {atRiskStudents.length}
          </div>
          <div className="text-[10px] text-rose-700 font-bold mt-0.5">Needs Intervention →</div>
        </div>

      </div>

      {/* Placement Funnel Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
              Institutional Conversion Engine
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Placement Conversion Funnel
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Overall Conversion: <strong className="text-emerald-700 font-mono">{Math.round((f.joined / f.registered) * 100)}%</strong> from Registration to Final Joining
          </span>
        </div>

        {/* Funnel Visual Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {funnelStages.map((stage, idx) => (
            <div key={idx} className="relative p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">Step {idx + 1}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-700">{stage.percent}</span>
                </div>
                <div className="font-extrabold text-slate-900 text-xs mt-1">
                  {stage.label}
                </div>
              </div>

              <div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {stage.count.toLocaleString()}
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${stage.color} rounded-full`} style={{ width: stage.percent }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column: Upcoming Drives Quick Schedule + High At-Risk Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Drives Preview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Upcoming Campus Drives</h3>
            </div>
            <button
              onClick={() => onNavigateTab('scheduling')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View Calendar →
            </button>
          </div>

          <div className="space-y-2.5">
            {drives.slice(0, 3).map(drive => (
              <div key={drive.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-black text-slate-800 flex items-center justify-center text-xs shrink-0">
                    {drive.companyLogo}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">{drive.companyName}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{drive.venue}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-indigo-700">{drive.date}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{drive.startTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Students Quick Review */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Students Requiring Early Intervention</h3>
            </div>
            <button
              onClick={() => onNavigateTab('atrisk')}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              Intervention Hub ({atRiskStudents.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {atRiskStudents.slice(0, 3).map(student => (
              <div key={student.studentId} className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{student.studentName}</span>
                    <span className="text-[10px] font-mono text-slate-500">({student.branch.split(' ')[0]})</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                      {student.riskLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {student.reasons[0]}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    {student.readinessScore}/100
                  </span>
                  <div className="text-[10px] text-slate-400">Readiness</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
