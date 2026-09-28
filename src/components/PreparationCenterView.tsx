import React, { useState } from 'react';
import { 
  BookOpenCheck, 
  Sparkles, 
  CheckCircle2, 
  Square, 
  CheckSquare, 
  Award, 
  Play, 
  FileText, 
  Code, 
  ChevronRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { StudentProfile, SkillGapAnalysis } from '../types/index.ts';

interface PreparationCenterViewProps {
  student: StudentProfile;
  skillGap: SkillGapAnalysis | null;
}

export const PreparationCenterView: React.FC<PreparationCenterViewProps> = ({
  student,
  skillGap
}) => {
  const [activePrepTab, setActivePrepTab] = useState<'tasks' | 'tests' | 'interview_prep' | 'resume_tips'>('tasks');
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Master SQL Window Functions (LEAD, LAG, RANK)', category: 'Database', done: true, progress: 100 },
    { id: 2, title: 'Build and deploy Docker Multi-stage Container on AWS', category: 'DevOps', done: false, progress: 40 },
    { id: 3, title: 'Implement JWT authentication & refresh token flow in Express', category: 'Backend', done: true, progress: 100 },
    { id: 4, title: 'Solve 25 Medium LeetCode Dynamic Programming challenges', category: 'DSA', done: false, progress: 60 },
    { id: 5, title: 'Review System Design: Cache Invalidation & Redis Clusters', category: 'Architecture', done: false, progress: 20 },
  ]);

  const [testScoreModal, setTestScoreModal] = useState<string | null>(null);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done, progress: !t.done ? 100 : 30 } : t));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Student Preparation Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Personalized curriculum tailored to eliminate skill gaps and raise your placement readiness index.
          </p>
        </div>

        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 self-start sm:self-auto">
          Target Role: {skillGap?.targetRole || 'Full Stack Developer'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
        {[
          { id: 'tasks', label: 'Adaptive Learning Tasks' },
          { id: 'tests', label: 'Mock Assessments & Tests' },
          { id: 'interview_prep', label: 'Company Technical Q&A' },
          { id: 'resume_tips', label: 'AI Resume Optimization' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActivePrepTab(t.id as any)}
            className={`px-4 py-2.5 font-bold rounded-t-xl transition-all ${
              activePrepTab === t.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Tasks */}
      {activePrepTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Recommended Skill Tasks
                </h3>
                <p className="text-xs text-slate-500">Check off completed modules to update your AI readiness profile</p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {tasks.filter(t => t.done).length} / {tasks.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    t.done ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {t.done ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className={`text-xs font-bold ${t.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                        {t.category} Track
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-700">{t.progress}%</span>
                    <div className="w-20 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${t.done ? 'bg-emerald-500' : 'bg-indigo-600'} rounded-full`} style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tests */}
      {activePrepTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Core Full-Stack Algorithmic Diagnostic', duration: '60 Mins', questions: '30 MCQs + 2 Code Problems', benchmark: '75%' },
            { title: 'Relational Database & SQL Indexing Test', duration: '45 Mins', questions: '20 Query Tasks', benchmark: '80%' },
            { title: 'Cloud Infrastructure & Docker Basics', duration: '40 Mins', questions: '25 Scenario MCQs', benchmark: '70%' },
          ].map((test, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                  Mock Benchmark
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-2">{test.title}</h4>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>Duration: <strong>{test.duration}</strong></div>
                  <div>Format: {test.questions}</div>
                  <div>Benchmark Cutoff: <strong className="text-indigo-600 font-mono">{test.benchmark}</strong></div>
                </div>
              </div>

              <button
                onClick={() => setTestScoreModal(test.title)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Launch Mock Test</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Interview Q&A */}
      {activePrepTab === 'interview_prep' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Top Recruiter Technical Questions (Asked by Microsoft & TechNova)
          </h3>

          <div className="space-y-3 text-xs">
            {[
              {
                q: 'How does Node.js event loop handle asynchronous I/O compared to worker threads?',
                a: 'Node.js delegates non-blocking system calls to libuv threadpool. For CPU-heavy encryption or compression, worker_threads are spawned to avoid blocking the main event loop.'
              },
              {
                q: 'Explain the difference between clustered and non-clustered index in relational databases.',
                a: 'A clustered index determines the physical order of data in the table (1 per table), while a non-clustered index creates a separate B-tree pointer mapping to the physical rows.'
              },
              {
                q: 'How would you architect a distributed lock across multiple microservices instances?',
                a: 'Using Redis with Redlock algorithm or atomic SETNX keys with TTL expirations, ensuring idempotency and preventing deadlocks during crash failures.'
              }
            ].map((qa, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="font-extrabold text-slate-900">
                  Q{idx + 1}: {qa.q}
                </div>
                <div className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-indigo-700">Recommended Model Answer:</span> {qa.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Resume Tips */}
      {activePrepTab === 'resume_tips' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            AI Automated Resume Optimization Feedback
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <span className="font-extrabold text-emerald-950 uppercase text-[10px] tracking-wider">
                ✓ Strong Highlights Found
              </span>
              <ul className="space-y-1.5 text-emerald-900">
                <li>• Clear quantitative results (e.g. "reduced latency by 45%")</li>
                <li>• Standard education and verified CGPA header</li>
                <li>• Links to active live demo and GitHub repository</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <span className="font-extrabold text-amber-950 uppercase text-[10px] tracking-wider">
                ⚠ Recommendations for Higher Recruiter Shortlists
              </span>
              <ul className="space-y-1.5 text-amber-900">
                <li>• Add Docker and AWS deployment details to Project 1</li>
                <li>• Mention SQL database indexing tools used in your internship</li>
                <li>• Keep technical skills grouped by Languages, Web, Database & DevOps</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Test Modal */}
      {testScoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto font-black">
              <Award className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Mock Assessment Simulation
            </h3>
            <p className="text-xs text-slate-500">
              {testScoreModal}
            </p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs">
              <div className="text-slate-400">Simulated Score</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">88 / 100</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Above corporate cutoff (75%)</div>
            </div>

            <button
              onClick={() => setTestScoreModal(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Log Assessment & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
