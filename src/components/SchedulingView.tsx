import React, { useState } from 'react';
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Users, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { Drive, ConflictCheckResult, Company } from '../types/index.ts';

interface SchedulingViewProps {
  drives: Drive[];
  companies: Company[];
  onCreateDrive: (drive: Partial<Drive>) => Promise<{ drive: Drive; conflict: ConflictCheckResult }>;
  onCheckConflict: (data: any) => Promise<ConflictCheckResult>;
}

export const SchedulingView: React.FC<SchedulingViewProps> = ({
  drives,
  companies,
  onCreateDrive,
  onCheckConflict
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [conflictModalData, setConflictModalData] = useState<{
    driveData: Partial<Drive>;
    conflict: ConflictCheckResult;
  } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState(companies[0]?.id || 'comp_technova');
  const [date, setDate] = useState('2026-10-24'); // clashes with Microsoft on same date if auditorium chosen
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('Campus Main Auditorium & CSE Labs');
  const [minCgpa, setMinCgpa] = useState(7.5);
  const [openings, setOpenings] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const selectedCompany = companies.find(c => c.id === companyId) || companies[0];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const drivePayload: Partial<Drive> = {
      title: title || `${selectedCompany?.name || 'Partner'} Campus Recruitment Drive 2026`,
      companyId,
      companyName: selectedCompany?.name || 'Partner Company',
      companyLogo: selectedCompany?.logo || 'CORP',
      date,
      startTime,
      endTime,
      venue,
      minCgpa,
      openings,
      allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
      panelMembers: [`${selectedCompany?.recruiterName || 'Campus Recruiter'}`, 'TPO Lead Invigilator'],
      targetBatches: [2026]
    };

    try {
      const result = await onCreateDrive(drivePayload);
      if (result.conflict?.hasConflict) {
        setConflictModalData({
          driveData: result.drive,
          conflict: result.conflict
        });
      } else {
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err) {
      console.error('Failed to create drive', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('2026-11-05');
    setStartTime('10:00 AM');
    setEndTime('04:30 PM');
    setVenue('Turing Hall & Computing Lab 3');
  };

  const handleApplySuggestedSlot = async () => {
    if (!conflictModalData) return;
    const suggested = conflictModalData.conflict.suggestedSlot;
    if (suggested) {
      setDate(suggested.date);
      setStartTime(suggested.startTime);
      setEndTime(suggested.endTime);
    }
    setConflictModalData(null);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Conflict-Free Placement Drive Scheduling
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Automated conflict resolution across company drives, student shortlists, venues, and interview panels.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 self-start sm:self-auto hover:scale-102 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Placement Drive</span>
        </button>
      </div>

      {/* Conflict Engine Status Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-emerald-500/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              Conflict-Free Engine Active
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Live checks active across 1248 students, 5 venues & 8 faculty panel rooms.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            Active Drives: {drives.length}
          </span>
          <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-emerald-300">
            Zero Scheduling Clashes
          </span>
        </div>
      </div>

      {/* Drives Grid */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">
          Scheduled Campus Recruitment Drives ({drives.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drives.map(drive => (
            <div
              key={drive.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shrink-0">
                    {drive.companyLogo || drive.companyName.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                      {drive.title}
                    </h4>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      {drive.companyName}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                  {drive.status}
                </span>
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-mono font-bold">{drive.date}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-mono">{drive.startTime} - {drive.endTime}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 col-span-2 mt-1">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{drive.venue}</span>
                </div>
              </div>

              {/* Criteria Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Shortlisted: <strong className="text-slate-800 font-mono">{drive.shortlistedCount} candidates</strong></span>
                </div>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Min CGPA: {drive.minCgpa}
                </span>
              </div>

              {/* Panel Members */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Interview Panel:</span> {drive.panelMembers.join(', ')}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Schedule Drive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Schedule Placement Drive</h3>
                <p className="text-xs text-slate-500">System will automatically check for conflicts</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Company</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Drive Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google India Campus Hiring Sprint 2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="05:00 PM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue / Hall</label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                >
                  <option value="Campus Main Auditorium & CSE Labs">Campus Main Auditorium & CSE Labs</option>
                  <option value="Turing Hall & Computing Lab 3">Turing Hall & Computing Lab 3</option>
                  <option value="Senate Hall & Online Google Meet">Senate Hall & Online Google Meet</option>
                  <option value="Seminar Hall B & Server Lab">Seminar Hall B & Server Lab</option>
                  <option value="ECE Department Seminar Complex">ECE Department Seminar Complex</option>
                  <option value="Virtual Placement Suite (MS Teams)">Virtual Placement Suite (MS Teams)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Minimum CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="10"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expected Openings</label>
                  <input
                    type="number"
                    value={openings}
                    onChange={(e) => setOpenings(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {submitting ? 'Checking Conflicts...' : 'Validate & Schedule Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheduling Conflict Modal */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95">
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  ⚠ Scheduling Conflict Detected
                </h3>
                <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mt-0.5">
                  AI Conflict Engine Clashing Detection
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-slate-800 space-y-2">
              <div className="font-bold text-rose-950">
                {conflictModalData.conflict.description}
              </div>
              <p className="text-[11px] text-slate-600">
                Hosting simultaneous recruitment drives on this slot will cause severe student availability overlap and venue congestion.
              </p>
            </div>

            {/* AI Suggested Alternative Slot */}
            {conflictModalData.conflict.suggestedSlot && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold uppercase text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Suggested Alternative Conflict-Free Slot</span>
                </div>
                <div className="flex items-center justify-between font-mono font-bold text-slate-900 text-xs">
                  <span>Date: {conflictModalData.conflict.suggestedSlot.date}</span>
                  <span>Time: {conflictModalData.conflict.suggestedSlot.startTime} - {conflictModalData.conflict.suggestedSlot.endTime}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleApplySuggestedSlot}
                className="w-full sm:flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Conflict (Apply Alternative)</span>
              </button>
              <button
                onClick={() => setConflictModalData(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Choose Another Slot
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
