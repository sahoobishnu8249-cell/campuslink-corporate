import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Layers, 
  CheckSquare, 
  Square,
  Clock,
  ExternalLink
} from 'lucide-react';
import { SkillGapAnalysis, StudentProfile } from '../types/index.ts';

interface SkillGapViewProps {
  student: StudentProfile;
  initialAnalysis: SkillGapAnalysis | null;
  onFetchSkillGap: (role: string) => Promise<SkillGapAnalysis>;
  onNavigateTab: (tab: any) => void;
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({
  student,
  initialAnalysis,
  onFetchSkillGap,
  onNavigateTab
}) => {
  const [selectedRole, setSelectedRole] = useState(initialAnalysis?.targetRole || 'Full Stack Developer');
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    'Complete SQL Joins & Subqueries': true,
    'Implement JWT Bearer authorization': true
  });

  const availableRoles = [
    'Full Stack Developer',
    'Backend Developer',
    'Data Analyst',
    'Cloud DevOps Engineer',
    'AI/ML Engineer'
  ];

  const handleRoleChange = async (role: string) => {
    setSelectedRole(role);
    setLoading(true);
    try {
      const data = await onFetchSkillGap(role);
      setAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskName: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskName]: !prev[taskName]
    }));
  };

  if (!analysis) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading AI Skill Gap Analysis...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Skill Gap Detection & Roadmap
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Compare your verified skill matrix against real corporate recruitment benchmarks and target roles.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-400 font-medium px-2">Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={loading}
            className="text-xs font-bold text-slate-900 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Role Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Target Corporate Role
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {analysis.targetRole}
          </h3>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Corporate benchmarks require a balance of frontend, robust server-side frameworks, relational schema management, and modern cloud deployment.
          </p>
        </div>

        {/* Role Readiness Score */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Role Alignment</div>
            <div className="text-3xl font-black text-indigo-600 font-mono">{analysis.roleReadinessScore}%</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20 font-mono">
            {analysis.matchedSkills.length}/{analysis.requiredSkills.length}
          </div>
        </div>
      </div>

      {/* Grid: Matched vs Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Current & Matched Skills */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">Verified Skills Matched</h4>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {analysis.matchedSkills.length} Passed
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Skills present in your verified student profile that satisfy this role’s JD requirements:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {analysis.matchedSkills.map((s, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-extrabold text-emerald-950 text-xs">{s}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Missing Skills with Priority */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-extrabold text-slate-900 text-sm">Skill Gaps & Priority</h4>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {analysis.missingSkills.length} Needed
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Skills missing from your profile that recruiters screen for during placement drives:
          </p>

          <div className="space-y-2 pt-1">
            {analysis.missingSkills.map((m, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{m.skill}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.2 rounded ${
                      m.priority === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      m.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {m.priority} PRIORITY
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>~{m.estimatedDays} days estimated · {m.resource}</span>
                  </div>
                </div>

                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recommended Preparation Roadmap */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
              Adaptive Learning Plan
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Recommended Preparation Roadmap
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('prep')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>Open Interactive Prep Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.preparationRoadmap.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded text-indigo-700 border border-slate-200">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">{item.progress}%</span>
              </div>

              <h5 className="font-extrabold text-slate-900 text-xs">
                {item.title}
              </h5>

              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {/* Task Checklist */}
              <div className="space-y-1.5 pt-1">
                {item.tasks.map((task, tIdx) => {
                  const isDone = !!completedTasks[task];
                  return (
                    <button
                      key={tIdx}
                      onClick={() => toggleTask(task)}
                      className="w-full flex items-start gap-2 p-1.5 rounded-lg hover:bg-white text-left transition-colors"
                    >
                      {isDone ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-[11px] leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
