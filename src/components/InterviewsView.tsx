import React, { useState } from 'react';
import { 
  Video, 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Edit3, 
  UserCircle2, 
  Briefcase,
  ChevronRight,
  Filter
} from 'lucide-react';
import { InterviewRecord } from '../types/index.ts';

interface InterviewsViewProps {
  interviews: InterviewRecord[];
  onUpdateInterview: (id: string, data: Partial<InterviewRecord>) => Promise<InterviewRecord>;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  interviews,
  onUpdateInterview
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [activeScorecard, setActiveScorecard] = useState<InterviewRecord | null>(null);

  // Scorecard modal state
  const [techScore, setTechScore] = useState(85);
  const [commScore, setCommScore] = useState(80);
  const [probScore, setProbScore] = useState(85);
  const [feedback, setFeedback] = useState('');
  const [outcome, setOutcome] = useState<'Selected' | 'Rejected' | 'Completed'>('Selected');
  const [saving, setSaving] = useState(false);

  const filtered = filterStatus === 'All'
    ? interviews
    : interviews.filter(i => i.status === filterStatus);

  const handleOpenScorecard = (item: InterviewRecord) => {
    setActiveScorecard(item);
    setTechScore(item.technicalScore || 85);
    setCommScore(item.communicationScore || 80);
    setProbScore(item.problemSolvingScore || 85);
    setFeedback(item.feedback || 'Candidate demonstrated clean problem decomposition and solid fundamentals.');
    setOutcome(item.status === 'Selected' ? 'Selected' : 'Completed');
  };

  const handleSaveScorecard = async () => {
    if (!activeScorecard) return;
    setSaving(true);
    try {
      const overall = Math.round((techScore * 0.4) + (probScore * 0.4) + (commScore * 0.2));
      await onUpdateInterview(activeScorecard.id, {
        technicalScore: techScore,
        communicationScore: commScore,
        problemSolvingScore: probScore,
        overallScore: overall,
        feedback,
        status: outcome
      });
      setActiveScorecard(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
              <Video className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Placement Interview Management & Scorecards
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track interview panels, evaluation scorecards, and multi-round technical assessments.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            <option value="All">All Statuses ({interviews.length})</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Grid of Interviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {item.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                    {item.studentName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {item.studentBranch} · CGPA {item.studentCgpa.toFixed(2)}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                item.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                item.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                item.status === 'Completed' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {item.status}
              </span>
            </div>

            {/* Company & Round */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">{item.companyName}</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {item.roundName}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {item.jobTitle}
              </div>
            </div>

            {/* Date, Time, Venue */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{item.date}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{item.time}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{item.venueOrLink}</span>
              </div>
            </div>

            {/* Panel & Evaluation Score */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-500">
                Panel: <strong className="text-slate-700">{item.panel}</strong>
              </div>

              {item.overallScore ? (
                <div className="flex items-center gap-1 font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{item.overallScore}/100</span>
                </div>
              ) : (
                <button
                  onClick={() => handleOpenScorecard(item)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Enter Scorecard</span>
                </button>
              )}
            </div>

            {item.feedback && (
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                "{item.feedback}"
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Scorecard Modal */}
      {activeScorecard && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Candidate Interview Scorecard</h3>
                <p className="text-xs text-slate-500">{activeScorecard.studentName} · {activeScorecard.companyName}</p>
              </div>
              <button
                onClick={() => setActiveScorecard(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>Technical Proficiency Score</span>
                  <span className="font-mono text-indigo-600">{techScore}/100</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={techScore}
                  onChange={(e) => setTechScore(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>Problem Solving & Algorithms</span>
                  <span className="font-mono text-indigo-600">{probScore}/100</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={probScore}
                  onChange={(e) => setProbScore(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>Communication & Behavioral Fit</span>
                  <span className="font-mono text-indigo-600">{commScore}/100</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={commScore}
                  onChange={(e) => setCommScore(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Qualitative Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Notes on candidate technical depth, code cleanliness, and behavioral response..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Interview Round Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Selected', 'Completed', 'Rejected'] as const).map(dec => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setOutcome(dec)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        outcome === dec
                          ? dec === 'Selected' ? 'bg-emerald-600 text-white border-emerald-600' :
                            dec === 'Rejected' ? 'bg-rose-600 text-white border-rose-600' :
                            'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveScorecard(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveScorecard}
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                {saving ? 'Saving...' : 'Submit Evaluation Scorecard'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
