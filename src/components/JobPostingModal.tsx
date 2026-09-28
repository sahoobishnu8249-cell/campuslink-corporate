import React, { useState } from 'react';
import { JobPosting, WorkplaceType, JobType, User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { X, Plus, Trash2, Building, Briefcase, GraduationCap, Sparkles } from 'lucide-react';

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostJob?: (jobData: Partial<JobPosting>) => Promise<void>;
  onJobCreated?: (newJob: JobPosting) => void;
  currentUser?: User | null;
}

export const JobPostingModal: React.FC<JobPostingModalProps> = ({
  isOpen,
  onClose,
  onPostJob,
  onJobCreated,
  currentUser
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Core Engineering & Cloud');
  const [location, setLocation] = useState('Bengaluru / Hybrid Tech Park');
  const [type, setType] = useState<JobType>('Full-Time');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('Hybrid');
  const [ctcOrStipend, setCtcOrStipend] = useState('₹18.0 - ₹24.0 LPA');
  const [minCgpa, setMinCgpa] = useState<number>(7.5);
  const [openingsCount, setOpeningsCount] = useState<number>(8);
  const [deadline, setDeadline] = useState('2026-11-20');
  const [driveDate, setDriveDate] = useState('2026-11-25');
  const [driveTime, setDriveTime] = useState('09:30 AM - 05:00 PM');
  const [venue, setVenue] = useState('Turing Hall & Computing Lab 3');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['Python', 'React', 'SQL', 'Docker', 'AWS']);
  
  const allBranches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication',
    'Mechanical Engineering'
  ];
  const [selectedBranches, setSelectedBranches] = useState<string[]>([
    'Computer Science & Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science'
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleBranch = (branch: string) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !ctcOrStipend.trim()) {
      setErrorMsg('Job title and compensation package are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: Partial<JobPosting> = {
        title,
        department,
        location,
        type,
        workplaceType,
        ctcOrStipend,
        minCgpa: Number(minCgpa),
        allowedBranches: selectedBranches,
        maxBacklogs: 0,
        targetBatches: [2026],
        description: description || 'Exciting campus recruitment drive opportunity.',
        responsibilities: [
          'Design and maintain production systems',
          'Participate in agile sprints and code reviews',
          'Collaborate across disciplines'
        ],
        requirements: [
          'Solid fundamentals in algorithms and computer science principles',
          'Strong communication and analytical skills'
        ],
        skills,
        openingsCount: Number(openingsCount),
        applicationDeadline: deadline,
        driveDate,
        driveTime,
        venue
      };

      if (onPostJob) {
        await onPostJob(payload);
      } else {
        const created = await api.createJob(payload);
        if (onJobCreated) onJobCreated(created);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish job posting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Post New Campus Drive / Role</h2>
              <p className="text-xs text-slate-500 font-medium">Broadcast criteria across eligible graduating students</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Role Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Software Development Engineer - I"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Compensation (CTC / Stipend)</label>
              <input
                type="text"
                required
                placeholder="e.g. ₹18.0 - ₹24.0 LPA"
                value={ctcOrStipend}
                onChange={(e) => setCtcOrStipend(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Co-op">Co-op</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Workplace</label>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="On-Campus">On-Campus</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Min CGPA Cutoff</label>
              <input
                type="number"
                step="0.1"
                min="5.0"
                max="10.0"
                value={minCgpa}
                onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Openings</label>
              <input
                type="number"
                min="1"
                value={openingsCount}
                onChange={(e) => setOpeningsCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Application Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          {/* Drive schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Drive Date</label>
              <input
                type="date"
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Drive Time</label>
              <input
                type="text"
                value={driveTime}
                onChange={(e) => setDriveTime(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Allowed Academic Branches</label>
            <div className="flex flex-wrap gap-2">
              {allBranches.map((branch) => {
                const isSelected = selectedBranches.includes(branch);
                return (
                  <button
                    type="button"
                    key={branch}
                    onClick={() => handleToggleBranch(branch)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {branch}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Skills Screened</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Add skill (e.g. React, SQL, AWS)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                  {s}
                  <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-400 hover:text-rose-600">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Campus Drive'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
