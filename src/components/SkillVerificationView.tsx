import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award, 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  ChevronRight, 
  Layers, 
  TrendingUp, 
  Check, 
  X, 
  ExternalLink, 
  BarChart2, 
  BrainCircuit, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  Settings2, 
  Plus, 
  Lock, 
  Unlock, 
  Eye, 
  Code, 
  HelpCircle,
  FileCheck2,
  FileX2,
  Building,
  GraduationCap,
  Download
} from 'lucide-react';
import { extractFileContent } from '../utils/fileExtractor.ts';
import { 
  StudentProfile, 
  User, 
  ResumeExtractedData, 
  ResumeSkillModel, 
  SkillScoreModel, 
  AssessmentResultModel, 
  CertificateModel, 
  AssessmentSettingsModel, 
  CandidateVerifiedSkillProfile 
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface SkillVerificationViewProps {
  student: StudentProfile;
  currentUser: User | null;
  onNavigateTab?: (tab: any) => void;
  onUpdateProfile?: (data: Partial<StudentProfile>) => Promise<StudentProfile>;
}

export const SkillVerificationView: React.FC<SkillVerificationViewProps> = ({
  student,
  currentUser,
  onNavigateTab,
  onUpdateProfile
}) => {
  const isRecruiterOrAdmin = currentUser?.role === 'recruiter' || currentUser?.role === 'tpo' || currentUser?.role === 'admin';

  // Main navigation tabs within Skill Verification
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'assessment' | 'profile' | 'certificates' | 'recruiter' | 'admin'>(
    isRecruiterOrAdmin ? 'recruiter' : 'overview'
  );

  // -------------------------------------------------------------
  // STATE: RESUME NLP / AI PARSING
  // -------------------------------------------------------------
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeExtractedData | null>(null);
  const [resumeAnalysisSuccess, setResumeAnalysisSuccess] = useState<string | null>(null);
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [resumeDataUrl, setResumeDataUrl] = useState<string>('');
  const [resumeFileSize, setResumeFileSize] = useState<string>('');
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);

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

  // -------------------------------------------------------------
  // STATE: VERIFIED SKILLS & SCORES
  // -------------------------------------------------------------
  const [resumeSkills, setResumeSkills] = useState<ResumeSkillModel[]>([]);
  const [verifiedSkills, setVerifiedSkills] = useState<SkillScoreModel[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [strongSkills, setStrongSkills] = useState<SkillScoreModel[]>([]);
  const [developingSkills, setDevelopingSkills] = useState<SkillScoreModel[]>([]);
  const [needsImprovement, setNeedsImprovement] = useState<SkillScoreModel[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  // -------------------------------------------------------------
  // STATE: ACTIVE LIVE ASSESSMENT ENGINE
  // -------------------------------------------------------------
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [assessmentSession, setAssessmentSession] = useState<any | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResultModel | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const timerRef = useRef<any>(null);

  // -------------------------------------------------------------
  // STATE: CERTIFICATES & EXTRA QUALIFICATIONS
  // -------------------------------------------------------------
  const [certificates, setCertificates] = useState<CertificateModel[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newManualSkill, setNewManualSkill] = useState('');
  const [newManualCategory, setNewManualCategory] = useState('technology');
  const [showUploadCertModal, setShowUploadCertModal] = useState(false);
  const [certForm, setCertForm] = useState({
    certificate_name: '',
    skill_or_course_name: '',
    issuing_organization: '',
    issue_date: new Date().toISOString().split('T')[0],
    certificate_id: '',
    file_name: 'Certificate_Doc.pdf',
    file_type: 'pdf' as 'pdf' | 'jpg' | 'jpeg' | 'png'
  });
  const [uploadingCert, setUploadingCert] = useState(false);

  // -------------------------------------------------------------
  // STATE: RECRUITER CANDIDATE DIRECTORY
  // -------------------------------------------------------------
  const [candidates, setCandidates] = useState<CandidateVerifiedSkillProfile[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [recruiterFilterSkill, setRecruiterFilterSkill] = useState('');
  const [recruiterMinScore, setRecruiterMinScore] = useState<number>(75);
  const [recruiterLevelFilter, setRecruiterLevelFilter] = useState<number>(0);
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [selectedCandidateDossier, setSelectedCandidateDossier] = useState<CandidateVerifiedSkillProfile | null>(null);

  // -------------------------------------------------------------
  // STATE: ADMIN SETTINGS
  // -------------------------------------------------------------
  const [adminSettings, setAdminSettings] = useState<AssessmentSettingsModel>({
    passing_threshold_percentage: 80,
    level1_time_limit_sec: 60,
    level2_time_limit_sec: 60,
    level3_time_limit_sec: 90,
    questions_per_level: 5,
    strong_skill_threshold: 85,
    developing_skill_threshold: 70,
    auto_advance_levels: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // -------------------------------------------------------------
  const loadSkillsData = async () => {
    try {
      setLoadingSkills(true);
      const data = await api.getStudentVerifiedSkills(student.userId);
      setResumeSkills(data.resumeSkills || []);
      setVerifiedSkills(data.verifiedSkills || []);
      setOverallScore(data.overallScore || 0);
      setStrongSkills(data.strongSkills || []);
      setDevelopingSkills(data.developingSkills || []);
      setNeedsImprovement(data.needsImprovement || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadCertificates = async () => {
    try {
      setLoadingCerts(true);
      const data = await api.getStudentCertificates(student.userId);
      setCertificates(data);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  const loadResumeAnalysis = async () => {
    try {
      const data = await api.getResumeAnalysis(student.userId);
      if (data) setResumeAnalysis(data);
    } catch (err) {
      console.error('Failed to load resume analysis:', err);
    }
  };

  const loadRecruiterCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const data = await api.getRecruiterCandidates({
        skill: recruiterFilterSkill || undefined,
        minScore: recruiterMinScore || undefined,
        level: recruiterLevelFilter > 0 ? recruiterLevelFilter : undefined,
        search: recruiterSearch || undefined
      });
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load recruiter candidates:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const settings = await api.getAssessmentSettings();
      if (settings) setAdminSettings(settings);
    } catch (err) {
      console.error('Failed to load admin settings:', err);
    }
  };

  useEffect(() => {
    loadSkillsData();
    loadCertificates();
    loadResumeAnalysis();
    loadAdminSettings();
    if (isRecruiterOrAdmin) {
      loadRecruiterCandidates();
    }
  }, [student.userId, isRecruiterOrAdmin]);

  // -------------------------------------------------------------
  // COUNTDOWN TIMER LOGIC FOR ACTIVE ASSESSMENT (1 Question = 1 Min)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!assessmentSession || !currentQuestion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpiredAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentSession, currentQuestion]);

  const handleTimeExpiredAutoSubmit = () => {
    // Automatically submit current selection or default 0 when time reaches zero
    const choice = selectedOption !== null ? selectedOption : 0;
    handleAnswerSubmit(choice, timeLeft);
  };

  // -------------------------------------------------------------
  // HANDLERS: RESUME ANALYSIS
  // -------------------------------------------------------------
  const handleAnalyzeResume = async () => {
    setIsAnalyzingResume(true);
    setResumeAnalysisSuccess(null);
    try {
      const defaultSample = `
        ${student.fullName}
        Email: ${student.email} | Roll: ${student.rollNumber || '2022UGCS001'}
        Education: ${student.degree} in ${student.branch}, ${student.university} (CGPA: ${student.cgpa}/10.0)
        Technical Skills: Python, Java, React, Django, PostgreSQL, Git, AWS Cloud, Docker, TypeScript, REST APIs.
        Projects: Campus Recruitment & Placement Analytics Platform built with React, Node.js and PostgreSQL.
        Certifications: AWS Certified Cloud Practitioner, Google Professional Data Engineer.
      `;
      const textToAnalyze = resumeText.trim() ? resumeText : defaultSample;
      const filename = selectedResumeFile 
        ? selectedResumeFile.name 
        : (student.resumeFilename || `${student.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
      const res = await api.uploadResumeForSkillAnalysis(
        textToAnalyze,
        filename,
        student.userId,
        resumeDataUrl || student.resumeUrl || '',
        resumeFileSize || '1.2 MB'
      );

      setResumeAnalysis(res.analysis);
      setResumeAnalysisSuccess(`✓ Successfully parsed resume! Extracted ${res.claimedSkills.length} skills across categories. ATS Score: ${res.atsScore}%.`);
      await loadSkillsData();
      if (onUpdateProfile) {
        onUpdateProfile({ resumeScore: res.atsScore });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: ASSESSMENT LIFECYCLE
  // -------------------------------------------------------------
  const handleStartAssessment = async (level: 1 | 2 | 3) => {
    try {
      setSelectedLevel(level);
      const session = await api.startSkillAssessment(level, student.userId);
      setAssessmentSession(session);
      setCurrentQuestionIndex(0);
      setCurrentQuestion(session.firstQuestion || session.questions[0]);
      setSelectedOption(null);
      setTimeLeft(session.timeLimitPerQuestionSec || 60);
      setActiveSubTab('assessment');
    } catch (err: any) {
      alert(err.message || 'Failed to start assessment. Please ensure prerequisite level is cleared.');
    }
  };

  const handleAnswerSubmit = async (optionIndex: number, remainingSec: number) => {
    if (!assessmentSession || !currentQuestion || isSubmittingAnswer) return;

    setIsSubmittingAnswer(true);
    const timeTaken = Math.max(1, (assessmentSession.timeLimitPerQuestionSec || 60) - remainingSec);

    try {
      const res = await api.submitAssessmentAnswer(
        assessmentSession.sessionId,
        currentQuestion.id,
        optionIndex,
        timeTaken
      );

      if (res.isCompleted) {
        // Complete and evaluate level on backend
        const result = await api.submitAssessmentLevel(assessmentSession.sessionId);
        setAssessmentResult(result);
        setShowResultModal(true);
        setAssessmentSession(null);
        setCurrentQuestion(null);
        await loadSkillsData();
      } else {
        // Advance to next question
        const nextIdx = res.nextQuestionIndex;
        setCurrentQuestionIndex(nextIdx);
        setCurrentQuestion(assessmentSession.questions[nextIdx]);
        setSelectedOption(null);
        setTimeLeft(assessmentSession.timeLimitPerQuestionSec || 60);
      }
    } catch (err: any) {
      console.error('Answer submission error:', err);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS: CERTIFICATE & MANUAL SKILL
  // -------------------------------------------------------------
  const handleAddManualSkill = async () => {
    if (!newManualSkill.trim()) return;
    try {
      await api.addStudentManualSkill(newManualSkill.trim(), newManualCategory, student.userId);
      setNewManualSkill('');
      setShowAddSkillModal(false);
      await loadSkillsData();
    } catch (err: any) {
      alert(err.message || 'Failed to add manual skill');
    }
  };

  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.certificate_name || !certForm.skill_or_course_name || !certForm.issuing_organization) {
      alert('Please fill out all required certificate fields.');
      return;
    }
    setUploadingCert(true);
    try {
      await api.uploadStudentCertificate({
        ...certForm,
        student_id: student.userId,
        student_name: student.fullName
      });
      setShowUploadCertModal(false);
      setCertForm({
        certificate_name: '',
        skill_or_course_name: '',
        issuing_organization: '',
        issue_date: new Date().toISOString().split('T')[0],
        certificate_id: '',
        file_name: 'Certificate_Doc.pdf',
        file_type: 'pdf'
      });
      await loadCertificates();
    } catch (err: any) {
      alert(err.message || 'Failed to upload certificate');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleAdminVerifyCert = async (certId: string, status: 'VERIFIED' | 'REJECTED') => {
    const reason = status === 'REJECTED' ? prompt('Enter reason for certificate rejection:') || 'Documentation incomplete' : undefined;
    try {
      await api.verifyCertificate(certId, status, reason);
      await loadCertificates();
      if (isRecruiterOrAdmin) await loadRecruiterCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to update certificate verification status');
    }
  };

  const handleSaveAdminSettings = async () => {
    setSavingSettings(true);
    setSettingsSuccessMsg(null);
    try {
      const updated = await api.updateAssessmentSettings(adminSettings);
      setAdminSettings(updated);
      setSettingsSuccessMsg('✓ Assessment parameters and passing thresholds updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Determine highest level cleared for student
  const level1Cleared = verifiedSkills.some(s => s.level_cleared >= 1 && s.verified_score >= (adminSettings.passing_threshold_percentage || 80));
  const level2Cleared = verifiedSkills.some(s => s.level_cleared >= 2 && s.verified_score >= (adminSettings.passing_threshold_percentage || 80));
  const level3Cleared = verifiedSkills.some(s => s.level_cleared >= 3 && s.verified_score >= (adminSettings.passing_threshold_percentage || 80));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 backdrop-blur-xs">
              <BrainCircuit className="w-3.5 h-3.5" />
              AI Skill Verification & Objective Assessment Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Skill Verification System
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Bridging the credibility gap between resume claims and real engineering capability. Student claimed skills undergo dynamic multi-level AI assessments with anti-cheating controls, generating objective, recruiter-verified skill profiles.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3 shrink-0 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
            <div className="text-center px-3 border-r border-white/10">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Verified Score</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">{overallScore}%</p>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Level Cleared</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-300">
                {level3Cleared ? 'Level 3' : level2Cleared ? 'Level 2' : level1Cleared ? 'Level 1' : 'None'}
              </p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Passing Threshold</p>
              <p className="text-xl sm:text-2xl font-black text-amber-300">{adminSettings.passing_threshold_percentage}%</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="mt-8 flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            Resume Analysis & Skills
          </button>

          <button
            onClick={() => setActiveSubTab('assessment')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'assessment'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-4 h-4" />
            Verify Your Skills (Test)
          </button>

          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            Verified Skill Profile
          </button>

          <button
            onClick={() => setActiveSubTab('certificates')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSubTab === 'certificates'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Additional Qualifications & Certs
          </button>

          {isRecruiterOrAdmin && (
            <button
              onClick={() => {
                setActiveSubTab('recruiter');
                loadRecruiterCandidates();
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeSubTab === 'recruiter'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              Recruiter Candidate Search
            </button>
          )}

          {(currentUser?.role === 'tpo' || currentUser?.role === 'admin') && (
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeSubTab === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              Admin Assessment Controls
            </button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* SUBTAB 1: RESUME UPLOAD & NLP/AI ANALYSIS                      */}
      {/* ============================================================= */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: RESUME UPLOAD & EXTRACTION */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Student Resume Upload & AI Parser
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extracts programming languages, frameworks, databases, tools, cloud, and certifications.
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                  Claims Unverified
                </span>
              </div>

              {resumeAnalysisSuccess && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
                  <span>{resumeAnalysisSuccess}</span>
                  <button
                    onClick={() => setActiveSubTab('assessment')}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shrink-0 ml-3"
                  >
                    Verify Now →
                  </button>
                </div>
              )}

              {/* Real File Input & Drag and Drop Zone */}
              <div className="space-y-4">
                <input
                  type="file"
                  ref={resumeFileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleResumeFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                  className="hidden"
                />

                <div
                  onClick={() => resumeFileInputRef.current?.click()}
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
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-7 text-center cursor-pointer transition-all ${
                    isDraggingResume
                      ? 'border-indigo-600 bg-indigo-50/60'
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
                          {resumeFileSize || `${(selectedResumeFile.size / 1024).toFixed(1)} KB`} · Ready for AI skill extraction
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1">
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
                        <div className="text-xs text-slate-500 mt-0.5">
                          PDF, DOCX, DOC, TXT, or Markdown (Automatically extracts readable text & skills)
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Current active file: <strong className="text-slate-700">{student.resumeFilename || 'Rahul_Kumar_Resume.pdf'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Resume Text & Content Preview
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeText(`
Rahul Kumar
Education: ${student.degree} in ${student.branch}, ${student.university}. CGPA: ${student.cgpa}/10.0
Technical Skills: Python, Java, React, Django, PostgreSQL, Git, AWS Cloud, Docker, TypeScript, REST APIs.
Projects: Campus Recruitment & Placement Analytics Platform built with React, Node.js and PostgreSQL.
Certifications: AWS Certified Cloud Practitioner, Google Professional Data Engineer.
                        `.trim());
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Use Sample Candidate Resume
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder={`e.g.\nRahul Kumar\nEducation: B.Tech Computer Science, NIT Trichy. CGPA: 8.7\nTechnical Skills: Python, Java, React, Django, PostgreSQL, Git, AWS, Docker.\nProjects: Full-Stack Placement Management Architecture platform with automated evaluations.\nCertifications: AWS Cloud Practitioner.`}
                    className="w-full text-xs font-mono p-4 rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Target File: <strong className="text-slate-700">{selectedResumeFile ? selectedResumeFile.name : (student.resumeFilename || 'Resume.pdf')}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => resumeFileInputRef.current?.click()}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Browse File
                    </button>

                    <button
                      onClick={handleAnalyzeResume}
                      disabled={isAnalyzingResume}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isAnalyzingResume ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          AI Parsing Resume...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze Resume with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* EXTRACTED ENTITIES SECTION */}
            {resumeAnalysis && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Extracted Skill Categories</h4>
                    <p className="text-xs text-slate-500">All skills detected from uploaded resume</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">ATS Score:</span>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                      {resumeAnalysis.atsScore}%
                    </span>
                  </div>
                </div>

                {/* Categorized Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Programming Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeAnalysis.programmingLanguages.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Frameworks & Libraries</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeAnalysis.frameworks.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Databases</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeAnalysis.databases.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tools & Cloud</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...resumeAnalysis.tools, ...resumeAnalysis.cloudTechnologies].map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <strong className="font-bold">Resume claims are not verified skills.</strong> Recruiters are specifically notified that these skills are self-reported claims until validated via the AI Skill Verification Test.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COL: CALL TO ACTION CARD */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  “Verify Your Skills”
                </h3>
                <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                  Start an AI-generated assessment based specifically on the technical skills detected from your resume.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-indigo-100 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Dynamic question generation (no static tests)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>1 min/question countdown with anti-cheat controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Skill-wise confidence score calculated by AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Recruiter-verified skill badges on your profile</span>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('assessment')}
                className="w-full py-3 bg-white text-indigo-900 rounded-2xl font-black text-xs hover:bg-indigo-50 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-indigo-900" />
                Start AI Verification Test
              </button>
            </div>

            {/* QUICK STATS CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Current Assessment Status
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Level 1 (Basic)</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${level1Cleared ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {level1Cleared ? 'Passed ✓' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Level 2 (Intermediate)</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${level2Cleared ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {level2Cleared ? 'Passed ✓' : level1Cleared ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Level 3 (Advanced)</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${level3Cleared ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {level3Cleared ? 'Passed ✓' : level2Cleared ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 2: AI SKILL VERIFICATION TEST (LIVE ASSESSMENT ENGINE)   */}
      {/* ============================================================= */}
      {activeSubTab === 'assessment' && (
        <div className="space-y-6">
          {!assessmentSession ? (
            /* LEVEL SELECTOR SCREEN */
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <div className="max-w-2xl space-y-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Select Your Assessment Level
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Assessment questions are dynamically generated based on skills detected in your resume (e.g. Python, React, SQL, Django). A passing threshold of <strong>{adminSettings.passing_threshold_percentage}%</strong> is required to unlock each subsequent level.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                  {/* LEVEL 1: BASIC */}
                  <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    selectedLevel === 1 
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/70 px-2.5 py-1 rounded-full">
                          Level 1
                        </span>
                        {level1Cleared && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Cleared
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">BASIC CONCEPTS</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Tests fundamental syntax, code outputs, core data structures, and basic principles.
                      </p>
                      <div className="text-[11px] text-slate-600 space-y-1 pt-2 font-mono">
                        <div>⏱ 1 min / question</div>
                        <div>📊 Threshold: {adminSettings.passing_threshold_percentage}%</div>
                        <div>🎯 5 Questions</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAssessment(1)}
                      className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {level1Cleared ? 'Re-attempt Level 1' : 'Start Level 1'}
                    </button>
                  </div>

                  {/* LEVEL 2: INTERMEDIATE */}
                  <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    !level1Cleared 
                      ? 'border-slate-200 bg-slate-50/60 opacity-75' 
                      : selectedLevel === 2 
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-100/70 px-2.5 py-1 rounded-full">
                          Level 2
                        </span>
                        {!level1Cleared ? (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Locked
                          </span>
                        ) : level2Cleared ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Cleared
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5" /> Unlocked
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">INTERMEDIATE</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Practical scenario-based questions, memory efficiency, algorithm optimization, and debugging.
                      </p>
                      <div className="text-[11px] text-slate-600 space-y-1 pt-2 font-mono">
                        <div>⏱ 1 min / question</div>
                        <div>📊 Threshold: {adminSettings.passing_threshold_percentage}%</div>
                        <div>🎯 5 Questions</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAssessment(2)}
                      disabled={!level1Cleared}
                      className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {!level1Cleared ? 'Requires Level 1' : level2Cleared ? 'Re-attempt Level 2' : 'Start Level 2'}
                    </button>
                  </div>

                  {/* LEVEL 3: ADVANCED */}
                  <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    !level2Cleared 
                      ? 'border-slate-200 bg-slate-50/60 opacity-75' 
                      : selectedLevel === 3 
                      ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-100/70 px-2.5 py-1 rounded-full">
                          Level 3
                        </span>
                        {!level2Cleared ? (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Locked
                          </span>
                        ) : level3Cleared ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Cleared
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                            <Unlock className="w-3.5 h-3.5" /> Unlocked
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">ADVANCED & ARCHITECTURE</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Complex problem solving, distributed systems, concurrency, async patterns, and architectural scale.
                      </p>
                      <div className="text-[11px] text-slate-600 space-y-1 pt-2 font-mono">
                        <div>⏱ 1.5 min / question</div>
                        <div>📊 Threshold: {adminSettings.passing_threshold_percentage}%</div>
                        <div>🎯 5 Questions</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAssessment(3)}
                      disabled={!level2Cleared}
                      className="mt-6 w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {!level2Cleared ? 'Requires Level 2' : level3Cleared ? 'Re-attempt Level 3' : 'Start Level 3'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE ASSESSMENT QUESTION INTERFACE (ANTI-CHEAT & FAIRNESS CONTROLS) */
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
              {/* ASSESSMENT TOP BAR: ANTI-CHEATING & TIMER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                      Level {assessmentSession.level} Assessment
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 font-mono">
                      Session: {assessmentSession.sessionId.slice(-8)}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Question {currentQuestionIndex + 1} of {assessmentSession.totalQuestions}
                  </h3>
                </div>

                {/* COUNTDOWN TIMER BADGE */}
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono text-sm font-black transition-all ${
                    timeLeft <= 15
                      ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>⏱ 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Auto-submits on timeout
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / assessmentSession.totalQuestions) * 100}%` }}
                />
              </div>

              {/* QUESTION DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Skill: {currentQuestion.skill}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                    Type: {currentQuestion.questionType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {currentQuestion.question}
                </div>
              </div>

              {/* OPTIONS SELECTOR */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select the best answer:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map((optionText: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs sm:text-sm leading-relaxed">{optionText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <div className="text-xs text-slate-400">
                  Fairness control: Once submitted, previous questions cannot be modified.
                </div>

                <button
                  onClick={() => {
                    if (selectedOption === null) {
                      alert('Please select an option before advancing.');
                      return;
                    }
                    handleAnswerSubmit(selectedOption, timeLeft);
                  }}
                  disabled={selectedOption === null || isSubmittingAnswer}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmittingAnswer ? (
                    'Recording Answer...'
                  ) : currentQuestionIndex + 1 === assessmentSession.totalQuestions ? (
                    'Complete Assessment & Evaluate →'
                  ) : (
                    'Next Question →'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ASSESSMENT EVALUATION REPORT MODAL */}
          {showResultModal && assessmentResult && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8">
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      assessmentResult.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {assessmentResult.status === 'PASSED' ? <Award className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        AI Skill Assessment Report
                      </h3>
                      <p className="text-xs text-slate-500">
                        Candidate: {assessmentResult.student_name} · Level {assessmentResult.level}
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                    assessmentResult.status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    Level {assessmentResult.level} — {assessmentResult.status}
                  </span>
                </div>

                {/* OVERALL METRICS BANNER */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Overall Score</p>
                    <p className={`text-xl font-black ${assessmentResult.score_percentage >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {assessmentResult.score_percentage}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Questions</p>
                    <p className="text-xl font-black text-slate-800">{assessmentResult.total_questions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Correct</p>
                    <p className="text-xl font-black text-emerald-600">{assessmentResult.correct_answers}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Response</p>
                    <p className="text-xl font-black text-indigo-600">{assessmentResult.average_response_time_seconds}s</p>
                  </div>
                </div>

                {/* SKILL PERFORMANCE BREAKDOWN */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Skill-Wise Demonstrated Performance
                  </h4>
                  <div className="space-y-2.5">
                    {Object.entries(assessmentResult.skill_breakdown).map(([skName, stat], idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-800">{skName}</span>
                          <span className={`${stat.percentage >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {stat.percentage}% ({stat.correct}/{stat.total} correct)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stat.percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI SUMMARY BOX */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                  <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    AI Evaluator Summary
                  </p>
                  <p className="text-xs text-indigo-950 leading-relaxed font-sans">
                    {assessmentResult.ai_summary}
                  </p>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      setActiveSubTab('profile');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    View Verified Skill Profile
                  </button>

                  {assessmentResult.next_level_unlocked && assessmentResult.level < 3 && (
                    <button
                      onClick={() => {
                        setShowResultModal(false);
                        handleStartAssessment((assessmentResult.level + 1) as 1 | 2 | 3);
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Proceed to Level {assessmentResult.level + 1} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 3: VERIFIED SKILL PROFILE (CLAIMED VS VERIFIED)         */}
      {/* ============================================================= */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* PROFILE SUMMARY HERO */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xl font-black text-indigo-800 shadow-xs">
                  {student.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{student.fullName}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      AI Verified Profile
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {student.degree} in {student.branch} · {student.university} (CGPA: {student.cgpa}/10.0)
                  </p>
                </div>
              </div>

              {/* LEVEL PROGRESS BADGES */}
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  level1Cleared ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  {level1Cleared ? <Check className="w-3.5 h-3.5" /> : null} Level 1
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  level2Cleared ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  {level2Cleared ? <Check className="w-3.5 h-3.5" /> : null} Level 2
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  level3Cleared ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  {level3Cleared ? <Check className="w-3.5 h-3.5" /> : null} Level 3
                </div>
              </div>
            </div>

            {/* OVERALL SCORE & ANALYTICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              {/* STRONG SKILLS */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                    Strong Skills (≥85%)
                  </span>
                  <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center">
                    {strongSkills.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {strongSkills.length > 0 ? (
                    strongSkills.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-emerald-950">
                        <span>{s.skill_name}</span>
                        <span className="font-mono">{s.verified_score}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No skills currently in strong bracket</p>
                  )}
                </div>
              </div>

              {/* DEVELOPING SKILLS */}
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                    Developing Skills (70-84%)
                  </span>
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-black flex items-center justify-center">
                    {developingSkills.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {developingSkills.length > 0 ? (
                    developingSkills.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-amber-950">
                        <span>{s.skill_name}</span>
                        <span className="font-mono">{s.verified_score}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No skills currently developing</p>
                  )}
                </div>
              </div>

              {/* NEEDS IMPROVEMENT */}
              <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-800 uppercase tracking-wider">
                    Requires Improvement (&lt;70%)
                  </span>
                  <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 text-xs font-black flex items-center justify-center">
                    {needsImprovement.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {needsImprovement.length > 0 ? (
                    needsImprovement.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-rose-950">
                        <span>{s.skill_name}</span>
                        <span className="font-mono">{s.verified_score}%</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No low-scoring skill gaps detected</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VERIFIED SKILL PROFILE COMPARISON (CRITICAL DISTINCTION REQUIREMENT 5) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                VERIFIED SKILL PROFILE — Claimed vs. Assessed
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Clearly distinguishes between self-reported resume claims and AI test verification scores.
              </p>
            </div>

            <div className="space-y-3.5">
              {verifiedSkills.length > 0 ? (
                verifiedSkills.map((sk, idx) => {
                  const isVerified = sk.verified_score >= (adminSettings.passing_threshold_percentage || 80);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {sk.skill_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                            Resume: Claimed
                          </span>
                          {isVerified ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Verified {sk.verified_score}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              Assessment: {sk.verified_score}% (Needs {adminSettings.passing_threshold_percentage}%)
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono font-bold text-slate-600">
                          Level Cleared: {sk.level_cleared > 0 ? `Level ${sk.level_cleared}` : 'Unassessed'}
                        </span>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sk.verified_score >= 85
                              ? 'bg-emerald-500'
                              : sk.verified_score >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.max(5, sk.verified_score)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No skills assessed yet. Complete the AI verification test above to populate your verified profile!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 4: ADDITIONAL QUALIFICATIONS & CERTIFICATE UPLOAD       */}
      {/* ============================================================= */}
      {activeSubTab === 'certificates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Additional Qualifications & Course Certificates
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload industry certificates (PDF, JPG, PNG) and add extra technical qualifications not on your resume.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddSkillModal(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Extra Skill
                </button>
                <button
                  onClick={() => setShowUploadCertModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Certificate
                </button>
              </div>
            </div>

            {/* CERTIFICATE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {cert.skill_or_course_name}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {cert.certificate_name}
                      </h4>
                      <p className="text-xs text-slate-600">{cert.issuing_organization}</p>
                    </div>

                    {/* STATUS BADGE */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      cert.verification_status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : cert.verification_status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {cert.verification_status === 'PENDING' ? 'Pending Verification' : cert.verification_status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span>Issued: {cert.issue_date}</span>
                    <span>Type: {cert.verification_type === 'AI_PLATFORM_VERIFIED' ? 'Platform Verified' : 'Student Uploaded'}</span>
                  </div>

                  {/* ADMIN ACTION CONTROLS */}
                  {(currentUser?.role === 'tpo' || currentUser?.role === 'admin') && cert.verification_status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => handleAdminVerifyCert(cert.id, 'VERIFIED')}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                      >
                        Verify Certificate
                      </button>
                      <button
                        onClick={() => handleAdminVerifyCert(cert.id, 'REJECTED')}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 5: RECRUITER CANDIDATE DIRECTORY & SEARCH              */}
      {/* ============================================================= */}
      {activeSubTab === 'recruiter' && isRecruiterOrAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Verified Candidate Search & Filter
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Filter candidates based on measurable AI-verified scores and assessment levels without unexplained algorithms.
              </p>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Verified Skill</label>
                <input
                  type="text"
                  placeholder="e.g. Python, React, SQL"
                  value={recruiterFilterSkill}
                  onChange={(e) => setRecruiterFilterSkill(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Min. Verified Score: <strong>{recruiterMinScore}%</strong>
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={recruiterMinScore}
                  onChange={(e) => setRecruiterMinScore(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Min. Assessment Level</label>
                <select
                  value={recruiterLevelFilter}
                  onChange={(e) => setRecruiterLevelFilter(parseInt(e.target.value, 10))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value={0}>All Levels</option>
                  <option value={1}>Level 1+ (Basic)</option>
                  <option value={2}>Level 2+ (Intermediate)</option>
                  <option value={3}>Level 3 (Advanced Only)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadRecruiterCandidates}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* CANDIDATES LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Showing <strong>{candidates.length}</strong> verified engineering candidates</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((c) => (
                  <div key={c.student.userId} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs space-y-3 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{c.student.fullName}</h4>
                        <p className="text-xs text-slate-500">{c.student.branch} · CGPA {c.student.cgpa}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          {c.overall_verified_score}% Verified
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c.highest_level_cleared > 0 ? `Level ${c.highest_level_cleared} Cleared` : 'Unassessed'}
                        </p>
                      </div>
                    </div>

                    {/* RESUME SKILLS VS VERIFIED SKILLS BADGES */}
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          AI Verified Skills:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {c.verified_skills.filter(s => s.verified_score >= 80).map((vs, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-[11px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> {vs.skill_name}: {vs.verified_score}%
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                      <span>Questions: {c.total_correct_answers}/{c.total_questions_attempted} correct</span>
                      <button
                        onClick={() => setSelectedCandidateDossier(c)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        View Full Dossier →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CANDIDATE FULL DOSSIER MODAL */}
          {selectedCandidateDossier && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Recruiter Verified Skill Dossier
                    </h3>
                    <p className="text-xs text-slate-500">
                      Candidate: {selectedCandidateDossier.student.fullName} ({selectedCandidateDossier.student.branch})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCandidateDossier(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Resume Claimed Skills</p>
                    <p className="text-slate-600">
                      {selectedCandidateDossier.resume_skills.map(s => s.skill_name).join(', ') || 'None reported'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <p className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Objective AI Verified Skills</p>
                    <div className="space-y-1.5">
                      {selectedCandidateDossier.verified_skills.map((vs, idx) => (
                        <div key={idx} className="flex items-center justify-between font-bold text-emerald-950">
                          <span>{vs.skill_name}</span>
                          <span>{vs.verified_score}% (Level {vs.level_cleared} Passed)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedCandidateDossier(null)}
                    className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* SUBTAB 6: ADMIN ASSESSMENT SETTINGS                           */}
      {/* ============================================================= */}
      {activeSubTab === 'admin' && (currentUser?.role === 'tpo' || currentUser?.role === 'admin') && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              Institutional Assessment Configuration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure passing percentage benchmarks, question time limits, and verification thresholds.
            </p>
          </div>

          {settingsSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
              {settingsSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Passing Threshold Percentage (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={adminSettings.passing_threshold_percentage}
                onChange={(e) => setAdminSettings({ ...adminSettings, passing_threshold_percentage: parseInt(e.target.value, 10) || 80 })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Students scoring below this percentage fail the level and cannot advance.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Questions Per Assessment Level
              </label>
              <input
                type="number"
                min="3"
                max="15"
                value={adminSettings.questions_per_level}
                onChange={(e) => setAdminSettings({ ...adminSettings, questions_per_level: parseInt(e.target.value, 10) || 5 })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Level 1 Time Limit (Seconds / Question)
              </label>
              <input
                type="number"
                min="30"
                max="120"
                value={adminSettings.level1_time_limit_sec}
                onChange={(e) => setAdminSettings({ ...adminSettings, level1_time_limit_sec: parseInt(e.target.value, 10) || 60 })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Strong Skill Benchmark (%)
              </label>
              <input
                type="number"
                min="70"
                max="95"
                value={adminSettings.strong_skill_threshold}
                onChange={(e) => setAdminSettings({ ...adminSettings, strong_skill_threshold: parseInt(e.target.value, 10) || 85 })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveAdminSettings}
              disabled={savingSettings}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              {savingSettings ? 'Saving Parameters...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL SKILL */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Add Additional Skill</h3>
              <button onClick={() => setShowAddSkillModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skill or Language Name</label>
                <input
                  type="text"
                  placeholder="e.g. C++, Docker, Go, Redis"
                  value={newManualSkill}
                  onChange={(e) => setNewManualSkill(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newManualCategory}
                  onChange={(e) => setNewManualCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200"
                >
                  <option value="programming">Programming Language</option>
                  <option value="framework">Framework</option>
                  <option value="database">Database</option>
                  <option value="tool">Tool</option>
                  <option value="cloud">Cloud Technology</option>
                  <option value="technology">Technology Concept</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setShowAddSkillModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleAddManualSkill} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD CERTIFICATE */}
      {showUploadCertModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUploadCertificate} className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Upload Course Certificate</h3>
              <button type="button" onClick={() => setShowUploadCertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Certificate Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certForm.certificate_name}
                  onChange={(e) => setCertForm({ ...certForm, certificate_name: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skill / Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & AWS Architecture"
                  value={certForm.skill_or_course_name}
                  onChange={(e) => setCertForm({ ...certForm, skill_or_course_name: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issuing Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amazon Web Services, Coursera, IBM"
                  value={certForm.issuing_organization}
                  onChange={(e) => setCertForm({ ...certForm, issuing_organization: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={certForm.issue_date}
                    onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Certificate ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS-9921-X"
                    value={certForm.certificate_id}
                    onChange={(e) => setCertForm({ ...certForm, certificate_id: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowUploadCertModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button type="submit" disabled={uploadingCert} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                {uploadingCert ? 'Uploading...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
