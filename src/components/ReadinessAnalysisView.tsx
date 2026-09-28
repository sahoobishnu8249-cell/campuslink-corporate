import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Settings, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  BookOpen, 
  RefreshCw,
  Award,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { StudentProfile, ScoringWeights, ReadinessLevel } from '../types/index.ts';

interface ReadinessAnalysisViewProps {
  student: StudentProfile;
  scoringWeights: ScoringWeights;
  onUpdateWeights: (weights: Partial<ScoringWeights>) => Promise<void>;
  onNavigateTab: (tab: any) => void;
}

export const ReadinessAnalysisView: React.FC<ReadinessAnalysisViewProps> = ({
  student,
  scoringWeights,
  onUpdateWeights,
  onNavigateTab
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempWeights, setTempWeights] = useState<ScoringWeights>({ ...scoringWeights });
  const [savingWeights, setSavingWeights] = useState(false);

  const b = student.readinessBreakdown || {
    technical: 85,
    academic: 78,
    projects: 88,
    certifications: 72,
    aptitude: 80,
    communication: 76,
    interview: 84
  };

  const readinessScore = student.readinessScore || 82;
  const readinessLevel = student.readinessLevel || 'READY';

  const breakdownMetrics = [
    { label: 'Technical Skills', score: b.technical, weight: scoringWeights.technicalWeight, desc: 'Coverage of languages, frameworks, DBs, and tools (Python, React, SQL)' },
    { label: 'Academic Performance', score: b.academic, weight: scoringWeights.academicWeight, desc: 'Verified university CGPA (8.92/10) with 0 active backlogs' },
    { label: 'Project Portfolio', score: b.projects, weight: scoringWeights.projectsWeight, desc: 'Full-stack production projects with active GitHub repositories' },
    { label: 'Certifications', score: b.certifications, weight: scoringWeights.certificationsWeight, desc: 'Industry certifications (AWS Cloud Practitioner)' },
    { label: 'Aptitude Assessment', score: b.aptitude, weight: scoringWeights.aptitudeWeight, desc: 'Quantitative, logical reasoning, and verbal aptitude testing score' },
    { label: 'Communication Skills', score: b.communication, weight: scoringWeights.communicationWeight, desc: 'Technical articulation and behavioral readiness evaluation' },
    { label: 'Mock Technical Interview', score: b.interview, weight: scoringWeights.interviewWeight, desc: 'Score from faculty and alumni technical mock panel review' },
  ];

  const handleSaveWeights = async () => {
    setSavingWeights(true);
    try {
      await onUpdateWeights(tempWeights);
      setShowConfigModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWeights(false);
    }
  };

  const getStatusBadge = (lvl: ReadinessLevel) => {
    switch (lvl) {
      case 'HIGHLY EMPLOYABLE':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'HIGHLY EMPLOYABLE (Top Tier Marquee Ready)' };
      case 'READY':
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', text: 'READY (Eligible for Corporate Drives)' };
      case 'DEVELOPING':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'DEVELOPING (Action Plan Required)' };
      default:
        return { bg: 'bg-rose-100 text-rose-800 border-rose-300', text: 'NOT READY (Immediate Remediation)' };
    }
  };

  const statusBadge = getStatusBadge(readinessLevel);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Employability & Readiness Scoring
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Deterministic institutional scoring engine powered by multi-criteria assessment algorithms.
          </p>
        </div>

        <button
          onClick={() => {
            setTempWeights({ ...scoringWeights });
            setShowConfigModal(true);
          }}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Configure Weighting Model</span>
        </button>
      </div>

      {/* Main Score & Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Big Score Display */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6 flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Overall Readiness Score
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-6xl font-black text-slate-900 font-mono tracking-tight">
              {readinessScore}
            </span>
            <span className="text-slate-400 font-mono text-xl font-bold">/ 100</span>
          </div>

          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase border ${statusBadge.bg}`}>
            {readinessLevel}
          </div>

          <p className="text-xs text-slate-500 mt-3 leading-relaxed">
            Meets placement readiness benchmark for Tier-1 Super Dream companies (Microsoft, Google, TechNova).
          </p>
        </div>

        {/* 4 Status Levels Breakdown */}
        <div className="md:col-span-2 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Institutional Benchmark Tiers
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className={`p-3 rounded-2xl border transition-all ${readinessLevel === 'HIGHLY EMPLOYABLE' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">HIGHLY EMPLOYABLE</span>
                <span className="font-mono text-[11px] font-bold text-emerald-700">90 - 100</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Super Dream corporate packages (₹25+ LPA), multi-stack leadership.</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${readinessLevel === 'READY' ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-900 text-xs">READY (Current Level)</span>
                <span className="font-mono text-[11px] font-bold text-indigo-700">75 - 89</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Core dream packages (₹12 - ₹25 LPA), validated technical & interview readiness.</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${readinessLevel === 'DEVELOPING' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">DEVELOPING</span>
                <span className="font-mono text-[11px] font-bold text-amber-700">60 - 74</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Foundation established; requires preparation on mock interviews and cloud skills.</p>
            </div>

            <div className={`p-3 rounded-2xl border transition-all ${readinessLevel === 'NOT READY' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">NOT READY</span>
                <span className="font-mono text-[11px] font-bold text-rose-700">&lt; 60</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">At-risk cohort; mandatory TPO counseling and aptitude bootcamp required.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Granular Breakdown Bars Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Component Score Breakdown</h3>
            <p className="text-xs text-slate-500">Each factor is weighted per the institutional scoring algorithm</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Weighted Sum: {readinessScore}/100
          </span>
        </div>

        <div className="space-y-4">
          {breakdownMetrics.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900">{item.label}</span>
                  <span className="ml-2 font-mono text-[10px] text-slate-400 font-semibold">(Weight: {Math.round(item.weight * 100)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-slate-900 text-xs">{item.score}%</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {item.score >= 80 ? 'Strong' : 'Improve'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    item.score >= 85 ? 'bg-indigo-600' : item.score >= 75 ? 'bg-purple-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${item.score}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                {item.desc}
              </div>
            </div>
          ))}
        </div>

        {/* AI Insight Card */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200/80 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <div className="font-extrabold text-indigo-950 uppercase tracking-wider text-[10px]">
              ✦ AI Readiness Insight
            </div>
            <p className="text-slate-700 leading-relaxed">
              Your technical score is at <strong>85%</strong>. Completing the recommended <strong>SQL Window Functions and AWS Containerization tracks</strong> will raise your technical competency to 94%, bringing your total readiness score to <strong>89/100 (High Employability Threshold)</strong>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('skillgap')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View Skill Gap & Recommended Roadmap</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Configurable Weights Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Configure Scoring Weights</h3>
                <p className="text-xs text-slate-500">Tune algorithm weights (total should equal 1.0)</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 text-xs">
              {[
                { key: 'technicalWeight' as keyof ScoringWeights, label: 'Technical Skills Weight' },
                { key: 'academicWeight' as keyof ScoringWeights, label: 'Academic Performance Weight' },
                { key: 'projectsWeight' as keyof ScoringWeights, label: 'Projects Weight' },
                { key: 'certificationsWeight' as keyof ScoringWeights, label: 'Certifications Weight' },
                { key: 'aptitudeWeight' as keyof ScoringWeights, label: 'Aptitude Weight' },
                { key: 'communicationWeight' as keyof ScoringWeights, label: 'Communication Weight' },
                { key: 'interviewWeight' as keyof ScoringWeights, label: 'Mock Interview Weight' }
              ].map(f => (
                <div key={f.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{f.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={tempWeights[f.key]}
                      onChange={(e) => setTempWeights({ ...tempWeights, [f.key]: parseFloat(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <span className="font-mono text-slate-400 font-bold">{Math.round(tempWeights[f.key] * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="text-xs text-slate-500 font-mono">
                Sum: {(Object.values(tempWeights).reduce((a, b) => a + b, 0)).toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWeights}
                  disabled={savingWeights}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {savingWeights ? 'Saving...' : 'Apply New Weights'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
