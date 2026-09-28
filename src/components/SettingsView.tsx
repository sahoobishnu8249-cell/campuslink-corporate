import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Cpu, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ScoringWeights, MatchingWeights } from '../types/index.ts';

interface SettingsViewProps {
  scoringWeights: ScoringWeights;
  matchingWeights: MatchingWeights;
  onUpdateWeights: (weights: { scoringWeights?: Partial<ScoringWeights>; matchingWeights?: Partial<MatchingWeights> }) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  scoringWeights,
  matchingWeights,
  onUpdateWeights
}) => {
  const [sw, setSw] = useState<ScoringWeights>({ ...scoringWeights });
  const [mw, setMw] = useState<MatchingWeights>({ ...matchingWeights });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await onUpdateWeights({
        scoringWeights: sw,
        matchingWeights: mw
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSw({
      technicalWeight: 0.25,
      academicWeight: 0.20,
      projectsWeight: 0.15,
      certificationsWeight: 0.10,
      aptitudeWeight: 0.10,
      communicationWeight: 0.10,
      interviewWeight: 0.10
    });
    setMw({
      technicalSkillMatch: 0.40,
      academicEligibility: 0.20,
      projectRelevance: 0.15,
      certificationMatch: 0.10,
      interviewPerformance: 0.15
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Scoring Weights & System Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure institutional weights for AI readiness scoring and candidate shortlisting models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Institutional scoring models successfully updated and recomputed across all students.</span>
        </div>
      )}

      {/* Grid: Scoring Weights vs Matching Weights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Model 1: Student Readiness Weights */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Student Readiness Scoring Weights</h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600">
              Sum: {(Object.values(sw).reduce((a, b) => a + b, 0)).toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'technicalWeight' as keyof ScoringWeights, label: 'Technical Skills' },
              { key: 'academicWeight' as keyof ScoringWeights, label: 'Academic (CGPA & Backlogs)' },
              { key: 'projectsWeight' as keyof ScoringWeights, label: 'Hands-on Project Portfolio' },
              { key: 'certificationsWeight' as keyof ScoringWeights, label: 'Industry Certifications' },
              { key: 'aptitudeWeight' as keyof ScoringWeights, label: 'Aptitude Diagnostic' },
              { key: 'communicationWeight' as keyof ScoringWeights, label: 'Communication Skills' },
              { key: 'interviewWeight' as keyof ScoringWeights, label: 'Mock Technical Interview' }
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">{f.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={sw[f.key]}
                    onChange={(e) => setSw({ ...sw, [f.key]: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-mono font-bold w-8">{Math.round(sw[f.key] * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model 2: AI Matching Weights */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">AI Shortlisting & Match Weights</h3>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600">
              Sum: {(Object.values(mw).reduce((a, b) => a + b, 0)).toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'technicalSkillMatch' as keyof MatchingWeights, label: 'Technical Skill Match (TF-IDF)' },
              { key: 'academicEligibility' as keyof MatchingWeights, label: 'Academic Benchmark (CGPA)' },
              { key: 'projectRelevance' as keyof MatchingWeights, label: 'Project Portfolio Relevance' },
              { key: 'certificationMatch' as keyof MatchingWeights, label: 'Certification Alignment' },
              { key: 'interviewPerformance' as keyof MatchingWeights, label: 'Mock Interview Benchmark' }
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">{f.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={mw[f.key]}
                    onChange={(e) => setMw({ ...mw, [f.key]: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                  />
                  <span className="text-[10px] text-slate-400 font-mono font-bold w-8">{Math.round(mw[f.key] * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-[11px] text-indigo-900">
            <strong>Rule Note:</strong> Hard eligibility checks (minimum CGPA, active backlogs, allowed branch) are verified <em>before</em> content similarity weights are applied.
          </div>
        </div>

      </div>

    </div>
  );
};
