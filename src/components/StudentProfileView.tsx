import React, { useState } from 'react';
import { 
  UserCircle2, 
  GraduationCap, 
  FileText, 
  Sparkles, 
  Award, 
  Briefcase, 
  CheckCircle2, 
  Github, 
  Linkedin, 
  Globe, 
  Plus, 
  Edit3, 
  Save, 
  ExternalLink,
  Cpu
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';

interface StudentProfileViewProps {
  student: StudentProfile;
  onUpdateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'skills' | 'projects' | 'certifications' | 'assessments'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StudentProfile>({ ...student });
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateProfile(formData);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (!formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 shrink-0">
            {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {student.fullName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Verified Candidate
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Roll No: {student.rollNumber} · {student.degree} in {student.branch} · Batch {student.graduationYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'resume', label: 'Resume & ATS Score' },
          { id: 'skills', label: 'Technical Skills' },
          { id: 'projects', label: 'Projects' },
          { id: 'certifications', label: 'Certifications' },
          { id: 'assessments', label: 'Assessments & Aptitude' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-bold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Personal & Academic Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                ) : (
                  <div className="font-bold text-slate-800 mt-1">{student.fullName}</div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">University Email</label>
                <div className="font-mono text-slate-800 mt-1">{student.email}</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Degree Program</label>
                <div className="font-bold text-slate-800 mt-1">{student.degree} in {student.branch}</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Verified CGPA</label>
                <div className="font-mono font-extrabold text-emerald-700 text-sm mt-1">
                  {student.cgpa.toFixed(2)} / 10.0 (0 Backlogs)
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Contact Phone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                ) : (
                  <div className="font-mono text-slate-800 mt-1">{student.phone}</div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Target Roles</label>
                <div className="font-medium text-slate-800 mt-1">{student.targetRoles.join(', ')}</div>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Candidate Bio</label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              ) : (
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{student.bio}</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Verified Links & Portfolio
            </h3>

            <div className="space-y-3 text-xs">
              <a
                href={student.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <Github className="w-4 h-4 text-slate-900" />
                  <span>GitHub Profile</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={student.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn Credentials</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href={student.portfolio}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 font-bold text-slate-800">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Live Portfolio</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resume & ATS Score */}
      {activeTab === 'resume' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">ATS Resume Evaluation</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{student.resumeFilename}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">ATS Score</div>
                <div className="text-2xl font-black text-indigo-600 font-mono">{student.resumeScore || 92}/100</div>
              </div>
              <button 
                onClick={() => alert(`Simulated downloading ${student.resumeFilename}...`)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
              <span className="font-extrabold text-emerald-950">Keyword Density: High</span>
              <p className="text-emerald-800 text-[11px]">Core engineering keywords (React, Node, SQL) match 91% of corporate JDs.</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
              <span className="font-extrabold text-indigo-950">Standard Format: Verified</span>
              <p className="text-indigo-800 text-[11px]">Single-page standard Harvard/Stanford placement format adhered to.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-1">
              <span className="font-extrabold text-purple-950">Action Verbs: 88%</span>
              <p className="text-purple-800 text-[11px]">Project descriptions lead with quantitative impact statements.</p>
            </div>
          </div>

          {/* Visual PDF document mockup container */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 font-serif text-slate-800 text-xs space-y-4">
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold tracking-wider uppercase">{student.fullName}</h2>
              <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                {student.email} · {student.phone} · {student.university}
              </div>
            </div>

            <div>
              <h4 className="font-sans font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 mb-1.5">
                Education
              </h4>
              <div className="flex justify-between font-sans">
                <span className="font-bold">{student.university} — {student.degree} in {student.branch}</span>
                <span className="font-mono">2022 - 2026</span>
              </div>
              <div className="text-slate-600 font-sans text-[11px]">
                Cumulative Grade Point Average: <strong>{student.cgpa.toFixed(2)} / 10.0</strong> (No Standing Backlogs)
              </div>
            </div>

            <div>
              <h4 className="font-sans font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 mb-1.5">
                Technical Skills
              </h4>
              <p className="font-sans text-[11px]">
                <strong>Languages & Frameworks:</strong> {student.skills.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Skills */}
      {activeTab === 'skills' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Verified Technical Skills</h3>
              <p className="text-xs text-slate-500">Skills evaluated for AI matching and corporate JDs</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. AWS, Docker)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                onClick={addSkill}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {(isEditing ? formData.skills : student.skills).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-extrabold text-indigo-900"
              >
                <span>{skill}</span>
                {isEditing && (
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Student Projects ({student.projects.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.projects.map((proj) => (
              <div key={proj.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">{proj.title}</h4>
                  {proj.githubLink && (
                    <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="text-[11px] font-mono text-indigo-600 font-bold">{proj.tech}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Certifications */}
      {activeTab === 'certifications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Industry & Cloud Certifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {student.certifications.map((cert, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-extrabold text-slate-900">{cert}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Assessments */}
      {activeTab === 'assessments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            Verified Assessments & Mock Review Scores
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Aptitude Diagnostic</span>
              <div className="text-2xl font-black font-mono text-indigo-600">{student.aptitudeScore}/100</div>
              <p className="text-slate-500 text-[11px]">Quantitative, logical and verbal reasoning assessment.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mock Interview Score</span>
              <div className="text-2xl font-black font-mono text-purple-600">{student.mockInterviewScore}/100</div>
              <p className="text-slate-500 text-[11px]">Assessed by Alumni Senior Technical Interviewers.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Communication Skills</span>
              <div className="text-2xl font-black font-mono text-emerald-600">{student.communicationScore}/100</div>
              <p className="text-slate-500 text-[11px]">Verbal articulation, behavioral and culture fit score.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
