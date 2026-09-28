import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ExternalLink,
  Award,
  Sparkles
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';

interface StudentsListViewProps {
  students: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  students,
  onSelectStudent
}) => {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [minCgpa, setMinCgpa] = useState<number>(0);

  const filtered = students.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.skills.some(sk => sk.toLowerCase().includes(search.toLowerCase()));

    const matchesBranch = 
      selectedBranch === 'All' || s.branch.toLowerCase().includes(selectedBranch.toLowerCase());

    const matchesCgpa = s.cgpa >= minCgpa;

    return matchesSearch && matchesBranch && matchesCgpa;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Student Directory & Verified Candidate Profiles
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browse graduating batch candidates, verified academic transcripts, and AI readiness indexes.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
          {filtered.length} / {students.length} Candidates
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, email, or skill (e.g. Python, SQL)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden"
          >
            <option value="All">All Branches</option>
            <option value="Computer Science">Computer Science (CSE)</option>
            <option value="Information Technology">Information Tech (IT)</option>
            <option value="Artificial Intelligence">AI & DS</option>
            <option value="Electronics">Electronics (ECE)</option>
            <option value="Mechanical">Mechanical (ME)</option>
          </select>

          <select
            value={minCgpa}
            onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-hidden"
          >
            <option value="0">All CGPA</option>
            <option value="7.0">CGPA &gt;= 7.0</option>
            <option value="8.0">CGPA &gt;= 8.0</option>
            <option value="8.5">CGPA &gt;= 8.5</option>
            <option value="9.0">CGPA &gt;= 9.0</option>
          </select>
        </div>

      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.userId}
            onClick={() => onSelectStudent(s)}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {s.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                      {s.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {s.branch.split(' ')[0]} · {s.rollNumber}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  s.placementStatus === 'Placed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  s.placementStatus === 'In Process' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {s.placementStatus || 'In Process'}
                </span>
              </div>

              {/* CGPA & Readiness */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">CGPA</span>
                  <div className="font-bold font-mono text-slate-800">{s.cgpa.toFixed(2)} / 10.0</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">AI Readiness</span>
                  <div className="font-bold font-mono text-indigo-600">{s.readinessScore}/100</div>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1">
                {s.skills.slice(0, 4).map((sk, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono">
                    {sk}
                  </span>
                ))}
                {s.skills.length > 4 && (
                  <span className="text-[10px] text-slate-400 pl-1 font-mono">
                    +{s.skills.length - 4}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                {s.projects.length} Projects · {s.certifications.length} Certs
              </span>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                <span>View Full File</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
