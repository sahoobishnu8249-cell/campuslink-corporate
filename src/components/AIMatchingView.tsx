import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Sliders, 
  Search,
  Filter
} from 'lucide-react';
import { StudentProfile, JobPosting, MatchingWeights } from '../types/index.ts';

interface AIMatchingViewProps {
  students: StudentProfile[];
  jobs: JobPosting[];
  matchingWeights: MatchingWeights;
  onComputeMatch: (studentId: string, jobId: string) => Promise<any>;
  onInspectDetails: (job: JobPosting, student: StudentProfile) => void;
  onApplyForStudent?: (jobId: string, studentId: string) => Promise<void>;
}

export const AIMatchingView: React.FC<AIMatchingViewProps> = ({
  students,
  jobs,
  matchingWeights,
  onComputeMatch,
  onInspectDetails,
  onApplyForStudent
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.userId || '');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [computing, setComputing] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const selectedStudent = students.find(s => s.userId === selectedStudentId) || students[0];
  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const handleRunMatch = async () => {
    if (!selectedStudent || !selectedJob) return;
    setComputing(true);
    try {
      const res = await onComputeMatch(selectedStudent.userId, selectedJob.id);
      setMatchResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setComputing(false);
    }
  };

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
              AI Matching & Explainable Shortlisting Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Simulate TF-IDF content similarity and strict hard-eligibility benchmarks across any candidate and company.
          </p>
        </div>

        <button
          onClick={handleRunMatch}
          disabled={computing}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-102 active:scale-98 flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{computing ? 'Computing AI Match...' : 'Compute AI Match & Explanation'}</span>
        </button>
      </div>

      {/* Selector Grid: Student Profile + Company Job */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Student Selector Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
              Input 1: Candidate Profile
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Academic Record</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Candidate:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              {students.map(s => (
                <option key={s.userId} value={s.userId}>
                  {s.fullName} ({s.branch.split(' ')[0]} · CGPA {s.cgpa.toFixed(2)} · {s.skills.length} Skills)
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{selectedStudent.fullName}</span>
                <span className="text-emerald-700 font-mono">CGPA: {selectedStudent.cgpa.toFixed(2)}/10</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedStudent.degree} in {selectedStudent.branch} · {selectedStudent.backlogs ?? 0} Backlogs
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedStudent.skills.map((sk, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Company Job Selector Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-purple-600">
              Input 2: Corporate Job Description
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Recruiter Criteria</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Campus Job / Drive:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.companyName} — {j.title} (Min CGPA: {j.minCgpa})
                </option>
              ))}
            </select>
          </div>

          {selectedJob && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{selectedJob.companyName}</span>
                <span className="text-indigo-600 font-mono">{selectedJob.ctcOrStipend}</span>
              </div>
              <div className="text-[11px] text-slate-700 font-medium">
                {selectedJob.title}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedJob.skills.map((sk, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-indigo-700 font-bold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Match Result Display */}
      {matchResult && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6 animate-in fade-in">
          
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                AI Match Score Result
              </div>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {matchResult.matchScore}% Overall Compatibility
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Status: <strong className={matchResult.explainableMatch.isShortlisted ? 'text-emerald-400' : 'text-rose-400'}>
                  {matchResult.explainableMatch.isShortlisted ? 'AI SHORTLISTED ✓' : 'NOT SHORTLISTED ✕'}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onInspectDetails(selectedJob, selectedStudent)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors border border-white/20"
              >
                Inspect Visual Report
              </button>
            </div>
          </div>

          {/* Granular Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Skills Match</span>
              <div className="text-lg font-black font-mono text-indigo-600 mt-1">
                {matchResult.matchBreakdown.technicalSkillMatch}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Academic</span>
              <div className="text-lg font-black font-mono text-indigo-600 mt-1">
                {matchResult.matchBreakdown.academicEligibility}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Projects</span>
              <div className="text-lg font-black font-mono text-indigo-600 mt-1">
                {matchResult.matchBreakdown.projectRelevance}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Certs</span>
              <div className="text-lg font-black font-mono text-indigo-600 mt-1">
                {matchResult.matchBreakdown.certificationMatch}%
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Mock Benchmark</span>
              <div className="text-lg font-black font-mono text-indigo-600 mt-1">
                {matchResult.matchBreakdown.interviewPerformance}%
              </div>
            </div>
          </div>

          {/* Explainable AI Card */}
          <div className={`p-5 rounded-2xl border space-y-2 ${
            matchResult.explainableMatch.isShortlisted ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                ✦ Explainable Reasoning Summary
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed">
              {matchResult.explainableMatch.summary}
            </p>
            <div className="pt-2 text-[11px] text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200">
              <strong>Actionable Next Step:</strong> {matchResult.explainableMatch.recommendedAction}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
