import React, { useState } from 'react';
import { 
  Briefcase, 
  Users, 
  Video, 
  Award, 
  Filter, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Plus, 
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { JobPosting, Application, StudentProfile } from '../types/index.ts';

interface RecruiterDashboardViewProps {
  jobs: JobPosting[];
  applications: Application[];
  students: StudentProfile[];
  onCreateJob: () => void;
  onAdvanceStage: (appId: string, stage: any) => Promise<void>;
  onViewCandidate: (student: StudentProfile) => void;
}

export const RecruiterDashboardView: React.FC<RecruiterDashboardViewProps> = ({
  jobs,
  applications,
  students,
  onCreateJob,
  onAdvanceStage,
  onViewCandidate
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>('All');
  const [filterBranch, setFilterBranch] = useState<string>('All');
  const [searchCandidate, setSearchCandidate] = useState<string>('');

  const shortlistedCount = applications.filter(a => a.stage !== 'applied' && a.stage !== 'rejected').length;
  const interviewedCount = applications.filter(a => a.stage === 'interview' || a.stage === 'hr_round' || a.stage === 'offered' || a.stage === 'accepted').length;
  const selectedCount = applications.filter(a => a.stage === 'offered' || a.stage === 'accepted').length;

  let filteredApps = applications;
  if (selectedJobId !== 'All') {
    filteredApps = filteredApps.filter(a => a.jobId === selectedJobId);
  }
  if (filterBranch !== 'All') {
    filteredApps = filteredApps.filter(a => a.studentBranch.toLowerCase().includes(filterBranch.toLowerCase()));
  }
  if (searchCandidate) {
    const q = searchCandidate.toLowerCase();
    filteredApps = filteredApps.filter(a => 
      a.studentName.toLowerCase().includes(q) ||
      a.studentSkills.some(s => s.toLowerCase().includes(q))
    );
  }

  // Sort by match score descending
  const sortedApps = [...filteredApps].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Recruiter Command & Candidate Pipeline
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review ranked candidate pool, evaluate interview scorecards, and extend campus placement offers.
          </p>
        </div>

        <button
          onClick={onCreateJob}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Campus Job / Drive</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Active Campus Roles</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{jobs.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Core Engineering</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Total Applicants</div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-1">{applications.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated ATS Screened</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">AI Shortlisted</div>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">{shortlistedCount}</div>
          <div className="text-[10px] text-purple-700 font-bold mt-0.5">Match &gt;= 70%</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-slate-400 text-xs font-medium">Offers Extended</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{selectedCount}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Formal Letter Issued</div>
        </div>
      </div>

      {/* Filter and Candidate Ranking Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        
        {/* Table Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Ranked Candidate Pool ({sortedApps.length})
            </h3>
            <p className="text-xs text-slate-500">Sorted by AI Content Similarity & CGPA Criteria</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search candidate */}
            <input
              type="text"
              placeholder="Search candidate or skill..."
              value={searchCandidate}
              onChange={(e) => setSearchCandidate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-44 focus:outline-hidden"
            />

            {/* Filter by Job */}
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden"
            >
              <option value="All">All Jobs</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            {/* Filter by Branch */}
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden"
            >
              <option value="All">All Branches</option>
              <option value="Computer Science">CSE</option>
              <option value="Information Technology">IT</option>
              <option value="Artificial Intelligence">AI & DS</option>
              <option value="Electronics">ECE</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Candidate</th>
                <th className="pb-3">Job Applied</th>
                <th className="pb-3 text-center">Match Score</th>
                <th className="pb-3">CGPA</th>
                <th className="pb-3">Key Skills</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedApps.map((app, idx) => {
                const s = students.find(st => st.userId === app.studentId) || students[0];
                return (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>

                    <td className="py-3 font-extrabold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {app.studentName[0]}
                        </div>
                        <div>
                          <div>{app.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">{app.studentBranch.split(' ')[0]}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-slate-700 font-medium">
                      {app.jobTitle}
                    </td>

                    <td className="py-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                        app.matchScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        app.matchScore >= 70 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.matchScore}%
                      </span>
                    </td>

                    <td className="py-3 font-mono font-bold text-slate-800">
                      {app.studentCgpa.toFixed(2)}
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {app.studentSkills.slice(0, 3).map((sk, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        app.stage === 'offered' || app.stage === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        app.stage === 'interview' ? 'bg-purple-100 text-purple-800' :
                        app.stage === 'screening' ? 'bg-indigo-100 text-indigo-800' :
                        app.stage === 'rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.stage}
                      </span>
                    </td>

                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewCandidate(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                        >
                          Profile
                        </button>
                        {app.stage === 'screening' && (
                          <button
                            onClick={() => onAdvanceStage(app.id, 'interview')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-2xs"
                          >
                            Schedule
                          </button>
                        )}
                        {app.stage === 'interview' && (
                          <button
                            onClick={() => onAdvanceStage(app.id, 'offered')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs"
                          >
                            Extend Offer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
