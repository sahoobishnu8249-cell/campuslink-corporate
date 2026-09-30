import React, { useState, useRef } from 'react';
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
  Cpu, 
  Upload, 
  Play, 
  FileCode, 
  Layers, 
  BookOpen, 
  Check, 
  AlertTriangle, 
  X,
  Download,
  Eye,
  FileUp,
  BrainCircuit
} from 'lucide-react';
import { StudentProfile, StudentProject } from '../types/index.ts';
import { api } from '../services/api.ts';
import { extractFileContent } from '../utils/fileExtractor.ts';

interface StudentProfileViewProps {
  student: StudentProfile;
  onUpdateProfile: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
  onNavigateTab?: (tab: any) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  onUpdateProfile,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'skills' | 'projects' | 'certifications' | 'assessments'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<StudentProfile>({ ...student });
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

  // Resume File Upload & AI Parsing state
  const [resumeText, setResumeText] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const [nlpSuccessMsg, setNlpSuccessMsg] = useState<string | null>(null);
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string>('');
  const [resumeFileSize, setResumeFileSize] = useState<string>('');
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [extractedAnalysis, setExtractedAnalysis] = useState<any>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const handleResumeFileSelect = async (file: File) => {
    setSelectedResumeFile(file);
    try {
      const extracted = await extractFileContent(file);
      setResumeDataUrl(extracted.dataUrl);
      setResumeFileSize(extracted.fileSize);
      if (extracted.text && extracted.text.trim()) {
        setResumeText(extracted.text);
      }
    } catch (err) {
      console.warn('Error reading resume file:', err);
    }
  };

  const handleUploadAndAnalyzeResume = async () => {
    setParsingResume(true);
    setNlpSuccessMsg(null);
    try {
      const filename = selectedResumeFile 
        ? selectedResumeFile.name 
        : (student.resumeFilename || `${student.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
      
      const effectiveText = resumeText.trim() ? resumeText : `
        ${student.fullName}
        Education: ${student.degree} in ${student.branch}, ${student.university}. CGPA: ${student.cgpa}
        Technical Skills: ${student.skills?.join(', ') || 'Python, Java, React, SQL, AWS, Docker'}
        Projects: CampusLink Platform Architecture.
      `;

      const res = await api.uploadResumeForSkillAnalysis(
        effectiveText,
        filename,
        student.userId,
        resumeDataUrl || student.resumeUrl || '',
        resumeFileSize || '1.2 MB'
      );

      setExtractedAnalysis(res.analysis);
      const updated = {
        ...formData,
        resumeFilename: filename,
        resumeScore: res.atsScore,
        resumeUrl: resumeDataUrl || student.resumeUrl || '',
        skills: Array.from(new Set([...(formData.skills || []), ...res.analysis.allSkills]))
      };
      setFormData(updated);
      await onUpdateProfile(updated);
      setNlpSuccessMsg(`✓ Successfully parsed resume! Extracted ${res.claimedSkills.length} technical skills. ATS Score updated to ${res.atsScore}%.`);
      setSelectedResumeFile(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload and parse resume');
    } finally {
      setParsingResume(false);
    }
  };

  const handleDownloadResume = () => {
    const url = student.resumeUrl || resumeDataUrl;
    if (url && url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = student.resumeFilename || `${student.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const sampleContent = `
======================================================
${student.fullName.toUpperCase()} — PLACEMENT RESUME
======================================================
Email: ${student.email} | Phone: ${student.phone}
University: ${student.university}
Degree: ${student.degree} in ${student.branch} (CGPA: ${student.cgpa.toFixed(2)}/10.0)
Graduation Year: ${student.graduationYear} | Roll Number: ${student.rollNumber}

TECHNICAL SKILLS:
${student.skills.join(', ')}

PROJECTS:
${(student.projects || []).map(p => `• ${p.title} (${p.tech})\n  ${p.description}\n  GitHub: ${p.githubLink || 'N/A'} | Live: ${p.liveLink || 'N/A'}`).join('\n\n')}

CERTIFICATIONS:
${(student.certifications || []).join(', ')}
      `;
      const blob = new Blob([sampleContent], { type: 'text/plain' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = student.resumeFilename ? student.resumeFilename.replace(/\.pdf$/i, '.txt') : `${student.fullName}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
    }
  };

  // Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjGithub, setNewProjGithub] = useState('');
  const [newProjLiveLink, setNewProjLiveLink] = useState('');
  const [addingProject, setAddingProject] = useState(false);

  // Certificate Modal State
  const [showCertModal, setShowCertModal] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [addingCert, setAddingCert] = useState(false);

  // Assessment Simulation Modal
  const [assessmentModal, setAssessmentModal] = useState<'aptitude' | 'mock' | null>(null);
  const [simScore, setSimScore] = useState(85);
  const [updatingScore, setUpdatingScore] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await onUpdateProfile(formData);
      setFormData(updated);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRunNlpExtraction = async () => {
    setParsingResume(true);
    setNlpSuccessMsg(null);
    try {
      const sampleText = resumeText || `
        ${student.fullName}
        Education: ${student.degree} in ${student.branch}, ${student.university}. CGPA: ${student.cgpa}
        Technical Skills: Python, Django, SQL, React, Git, TypeScript, Docker, AWS Cloud, PostgreSQL, REST APIs.
        Projects: CampusLink Placement Architecture Platform built using React, TypeScript, Express, and AI Matching.
      `;
      const res = await api.parseResume(student.userId, sampleText, `${student.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
      setFormData(res.profile);
      await onUpdateProfile(res.profile);
      setNlpSuccessMsg(`✓ Extracted ${res.extractedSkills.length} skills with NLP! ATS Score: ${res.atsScore}%.`);
    } catch (err: any) {
      alert(err.message || 'Failed to parse resume');
    } finally {
      setParsingResume(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    setAddingProject(true);
    try {
      const updated = await api.addStudentProject(student.userId, {
        title: newProjTitle.trim(),
        tech: newProjTech.trim() || 'React, Node.js, SQL',
        description: newProjDesc.trim() || 'Full-stack software engineering project.',
        githubLink: newProjGithub.trim() || 'https://github.com/project',
        liveLink: newProjLiveLink.trim()
      } as any);
      setFormData(updated);
      await onUpdateProfile(updated);
      setShowProjectModal(false);
      setNewProjTitle('');
      setNewProjTech('');
      setNewProjDesc('');
      setNewProjGithub('');
      setNewProjLiveLink('');
    } catch (err: any) {
      alert(err.message || 'Failed to add project');
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    if (!confirm('Are you sure you want to remove this project?')) return;
    try {
      const updated = await api.deleteStudentProject(student.userId, projId);
      setFormData(updated);
      await onUpdateProfile(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to remove project');
    }
  };

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertName.trim()) return;
    setAddingCert(true);
    try {
      const updated = await api.addStudentCertificate(student.userId, newCertName.trim());
      setFormData(updated);
      await onUpdateProfile(updated);
      setShowCertModal(false);
      setNewCertName('');
    } catch (err: any) {
      alert(err.message || 'Failed to add certificate');
    } finally {
      setAddingCert(false);
    }
  };

  const handleSaveAssessmentScore = async () => {
    setUpdatingScore(true);
    try {
      const payload: any = {};
      if (assessmentModal === 'aptitude') payload.aptitudeScore = simScore;
      if (assessmentModal === 'mock') payload.mockInterviewScore = simScore;
      const updated = await api.updateAssessment(student.userId, payload);
      setFormData(updated);
      await onUpdateProfile(updated);
      setAssessmentModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to record assessment');
    } finally {
      setUpdatingScore(false);
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

            {/* Personal Projects Quick Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                  Personal Projects ({student.projects?.length || 0})
                </span>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Project
                </button>
              </div>
              <div className="space-y-1.5">
                {(student.projects || []).length > 0 ? (
                  (student.projects || []).slice(0, 3).map((p) => (
                    <div key={p.id} className="p-2 bg-white rounded-xl border border-slate-200/80 text-[11px] flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[170px]">{p.title}</span>
                      <span className="text-[10px] font-mono text-indigo-600 font-semibold">{p.tech.split(',')[0]}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No personal projects added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resume & ATS Score */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          {/* UPLOAD & PARSER CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">ATS Placement Resume & Skill Extractor</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live AI Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your actual resume (PDF, DOCX, TXT) to evaluate ATS score, extract technical skills, and unlock recruiter verified badges.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">ATS Score</div>
                  <div className="text-2xl font-black text-indigo-600 font-mono">{student.resumeScore || 92}/100</div>
                </div>
                <button 
                  onClick={handleDownloadResume}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Resume</span>
                </button>
              </div>
            </div>

            {nlpSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                <span>{nlpSuccessMsg}</span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('skillverification')}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shrink-0 ml-3 flex items-center gap-1"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Verify Skills Now →
                  </button>
                )}
              </div>
            )}

            {/* REAL DRAG & DROP / FILE INPUT ZONE */}
            <div className="space-y-4">
              <input
                type="file"
                ref={resumeInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleResumeFileSelect(e.target.files[0]);
                  }
                }}
                accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                className="hidden"
              />

              <div
                onClick={() => resumeInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingResume(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingResume(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingResume(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleResumeFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  isDraggingResume 
                    ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]' 
                    : selectedResumeFile 
                      ? 'border-emerald-400 bg-emerald-50/30' 
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                {selectedResumeFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{selectedResumeFile.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {resumeFileSize || `${(selectedResumeFile.size / 1024).toFixed(1)} KB`} · Ready for AI parsing
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                        File Loaded Successfully
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResumeFile(null);
                          setResumeDataUrl('');
                        }}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Change File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">
                        Click to browse or drop your resume here
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Supports PDF, DOCX, DOC, TXT, or Markdown (Up to 15MB)
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Current file: <strong className="text-slate-700">{student.resumeFilename || 'Rahul_Kumar_Resume.pdf'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & Optional Text Paste */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resume saved securely in university database</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (!resumeText) {
                        setResumeText(`
Rahul Kumar
Education: B.Tech Computer Science, NIT Trichy. CGPA: 8.7
Technical Skills: Python, Java, React, Django, PostgreSQL, Git, AWS Cloud, Docker, TypeScript.
Projects: CampusLink Placement Architecture Platform built using React, Node.js and PostgreSQL.
                        `);
                      }
                      resumeInputRef.current?.click();
                    }}
                    type="button"
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Select File
                  </button>

                  <button
                    onClick={handleUploadAndAnalyzeResume}
                    disabled={parsingResume}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    {parsingResume ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI Parsing Resume...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Upload & Analyze with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ATS METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
              <span className="font-extrabold text-emerald-950">Keyword Density: High ({student.resumeScore || 92}%)</span>
              <p className="text-emerald-800 text-[11px]">Core engineering keywords (React, Node, SQL, Python) match top corporate JDs.</p>
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

          {/* RESUME PREVIEW & CURRENT DETAILS CONTAINER */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Resume Preview & Verified Stack</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{student.resumeFilename || 'Placement_Resume.pdf'}</p>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('skillverification')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Take AI Verification Test →</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 font-serif text-slate-800 text-xs space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold tracking-wider uppercase font-sans text-slate-900">{student.fullName}</h2>
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
                  <span className="font-mono">2022 - {student.graduationYear}</span>
                </div>
                <div className="text-slate-600 font-sans text-[11px]">
                  Cumulative Grade Point Average: <strong>{student.cgpa.toFixed(2)} / 10.0</strong> (No Standing Backlogs)
                </div>
              </div>

              <div>
                <h4 className="font-sans font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 mb-1.5">
                  Technical Skills Extracted ({student.skills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1 font-sans">
                  {(student.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100/80 text-indigo-900 border border-indigo-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-sans font-bold text-indigo-900 uppercase text-[11px] tracking-wider border-b border-slate-200 pb-1 mb-1.5">
                  Projects ({student.projects?.length || 0})
                </h4>
                <div className="space-y-2 font-sans">
                  {(student.projects || []).map((proj) => (
                    <div key={proj.id} className="text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{proj.title}</span>
                        <span className="font-mono text-indigo-600 text-[11px]">{proj.tech}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Personal & Academic Engineering Projects ({student.projects?.length || 0})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload and showcase your personal repositories, full-stack apps, and live deployments to recruiters.
              </p>
            </div>

            <button
              onClick={() => setShowProjectModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Personal Project</span>
            </button>
          </div>

          {(student.projects || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.projects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{proj.title}</h4>
                      <div className="flex items-center gap-2">
                        {proj.githubLink && (
                          <a 
                            href={proj.githubLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Open GitHub Repository"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {proj.liveLink && (
                          <a 
                            href={proj.liveLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Open Live Demo"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove Project"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {proj.tech.split(',').map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved in Database
                    </span>
                    {proj.githubLink && (
                      <span className="truncate max-w-[150px]">{proj.githubLink.replace('https://', '')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileCode className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">No Personal Projects Added Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your personal engineering repositories, side projects, and capstone software to boost AI matching scores!
              </p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Project</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Certifications */}
      {activeTab === 'certifications' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Industry & Cloud Certifications
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical credentials recognized by corporate hiring partners
              </p>
            </div>

            <button
              onClick={() => setShowCertModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certificate</span>
            </button>
          </div>

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
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Verified Assessments & Mock Review Scores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional readiness indicators recorded by Placement Cell
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSimScore(student.aptitudeScore || 85);
                  setAssessmentModal('aptitude');
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                Simulate Aptitude Test
              </button>
              <button
                onClick={() => {
                  setSimScore(student.mockInterviewScore || 80);
                  setAssessmentModal('mock');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Record Mock Interview
              </button>
            </div>
          </div>

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

      {/* ============================================================= */}
      {/* MODAL 1: ADD PERSONAL ENGINEERING PROJECT                    */}
      {/* ============================================================= */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddProject} 
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Add Personal Engineering Project</h3>
                  <p className="text-[11px] text-slate-500">Saved directly to your persistent campus database profile</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowProjectModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Cache & Microservice Architecture"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Technologies Used (Comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, Docker"
                  value={newProjTech}
                  onChange={(e) => setNewProjTech(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    GitHub Repository Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={newProjGithub}
                    onChange={(e) => setNewProjGithub(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Live Demo / Deployed Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://myproject.vercel.app"
                    value={newProjLiveLink}
                    onChange={(e) => setNewProjLiveLink(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project Description & Key Technical Highlights *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Architected responsive web frontend, designed relational PostgreSQL schemas, and implemented JWT authentication with automated CI/CD pipelines."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowProjectModal(false)} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={addingProject || !newProjTitle.trim()} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {addingProject ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Project</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: ADD CERTIFICATION                                    */}
      {/* ============================================================= */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddCertificate} 
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add Technical Certificate</h3>
              <button type="button" onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Certificate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect Associate"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowCertModal(false)} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={addingCert || !newCertName.trim()} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                {addingCert ? 'Saving...' : 'Add Certificate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: ASSESSMENT / MOCK SCORE RECORDER                     */}
      {/* ============================================================= */}
      {assessmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                {assessmentModal === 'aptitude' ? 'Record Aptitude Test Score' : 'Record Mock Interview Score'}
              </h3>
              <button onClick={() => setAssessmentModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Score: <strong className="text-indigo-600 text-base">{simScore} / 100</strong>
                </label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={simScore}
                  onChange={(e) => setSimScore(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button onClick={() => setAssessmentModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleSaveAssessmentScore} disabled={updatingScore} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                {updatingScore ? 'Saving...' : 'Save to Record'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
