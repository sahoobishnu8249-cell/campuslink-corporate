import React, { useState, useEffect } from 'react';
import { api } from './services/api.ts';
import { 
  User, 
  StudentProfile, 
  RecruiterProfile, 
  Company, 
  JobPosting, 
  Drive, 
  Application, 
  InterviewRecord, 
  OfferRecord, 
  DocumentItem, 
  NotificationItem, 
  CampusPlacementStats, 
  SkillGapAnalysis, 
  AtRiskStudent, 
  ScoringWeights, 
  MatchingWeights, 
  ConflictCheckResult,
  MatchBreakdown,
  ExplainableMatch
} from './types/index.ts';

// Components
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Topbar } from './components/Topbar.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { StudentProfileView } from './components/StudentProfileView.tsx';
import { ReadinessAnalysisView } from './components/ReadinessAnalysisView.tsx';
import { SkillGapView } from './components/SkillGapView.tsx';
import { PreparationCenterView } from './components/PreparationCenterView.tsx';
import { AIMatchingView } from './components/AIMatchingView.tsx';
import { JobBoard } from './components/JobBoard.tsx';
import { JobPostingModal } from './components/JobPostingModal.tsx';
import { MatchDetailsModal } from './components/MatchDetailsModal.tsx';
import { SchedulingView } from './components/SchedulingView.tsx';
import { InterviewsView } from './components/InterviewsView.tsx';
import { OffersView } from './components/OffersView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { TPODashboardView } from './components/TPODashboardView.tsx';
import { RecruiterDashboardView } from './components/RecruiterDashboardView.tsx';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView.tsx';
import { AtRiskStudentsView } from './components/AtRiskStudentsView.tsx';
import { CompaniesView } from './components/CompaniesView.tsx';
import { StudentsListView } from './components/StudentsListView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AIChatbotModal } from './components/AIChatbotModal.tsx';
import { ApplicationsPipelineView } from './components/ApplicationsPipelineView.tsx';
import { FlowWalkthroughView } from './components/FlowWalkthroughView.tsx';
import { FlowWalkthroughModal } from './components/FlowWalkthroughModal.tsx';
import { RegistrationView } from './components/RegistrationView.tsx';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [placementStats, setPlacementStats] = useState<CampusPlacementStats | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [skillGap, setSkillGap] = useState<SkillGapAnalysis | null>(null);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>({
    technicalWeight: 0.25,
    academicWeight: 0.20,
    projectsWeight: 0.15,
    certificationsWeight: 0.10,
    aptitudeWeight: 0.10,
    communicationWeight: 0.10,
    interviewWeight: 0.10
  });
  const [matchingWeights, setMatchingWeights] = useState<MatchingWeights>({
    technicalSkillMatch: 0.40,
    academicEligibility: 0.20,
    projectRelevance: 0.15,
    certificationMatch: 0.10,
    interviewPerformance: 0.15
  });

  // App UI state
  const [isLanding, setIsLanding] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [matchModalData, setMatchModalData] = useState<{
    job: JobPosting;
    student: StudentProfile;
    matchScore: number;
    breakdown: MatchBreakdown;
    explainable: ExplainableMatch;
    eligibilityStatus: 'Eligible' | 'Not Eligible';
    eligibilityReasons?: string[];
    isApplied: boolean;
  } | null>(null);

  // Load initial data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [
        userData,
        usersList,
        studentsList,
        companiesList,
        jobsList,
        drivesList,
        appsList,
        interviewsList,
        offersList,
        docsList,
        notifsList,
        statsData,
        atRiskData,
        weightsData
      ] = await Promise.all([
        api.fetchCurrentUser(),
        api.getAllUsers(),
        api.getAllStudents(),
        api.getAllCompanies(),
        api.getJobs(),
        api.getDrives(),
        api.getApplications(),
        api.getInterviews(),
        api.getOffers(),
        api.getDocuments(),
        api.getNotifications(),
        api.getPlacementStats(),
        api.getAtRiskStudents(),
        api.getAiWeights()
      ]);

      setCurrentUser(userData.user);
      if (userData.user.role === 'student') {
        setStudentProfile(userData.profile as StudentProfile);
      } else {
        setRecruiterProfile(userData.profile as RecruiterProfile);
      }

      setAllUsers(usersList);
      setStudents(studentsList);
      setCompanies(companiesList);
      setJobs(jobsList);
      setDrives(drivesList);
      setApplications(appsList);
      setInterviews(interviewsList);
      setOffers(offersList);
      setDocuments(docsList);
      setNotifications(notifsList);
      setPlacementStats(statsData);
      setAtRiskStudents(atRiskData);

      if (weightsData) {
        setScoringWeights(weightsData.scoringWeights);
        setMatchingWeights(weightsData.matchingWeights);
      }

      // Initial skill gap for student
      if (userData.user.role === 'student') {
        const gap = await api.getSkillGap(userData.user.id, 'Full Stack Developer');
        setSkillGap(gap);
      }
    } catch (err) {
      console.error('Error loading initial app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Setup real-time event listener
    const cleanup = api.initRealtimeSync((event) => {
      if (event.type === 'application:created' || event.type === 'application:updated') {
        api.getApplications().then(setApplications);
        api.getInterviews().then(setInterviews);
        api.getOffers().then(setOffers);
      }
      if (event.type === 'job:created') {
        api.getJobs().then(setJobs);
      }
      if (event.type === 'notification:created') {
        api.getNotifications().then(setNotifications);
      }
    });

    return () => cleanup();
  }, []);

  // Handlers
  const handleSwitchUser = async (userId: string) => {
    try {
      const data = await api.switchUser(userId);
      setCurrentUser(data.user);
      if (data.user.role === 'student') {
        setStudentProfile(data.profile as StudentProfile);
        const gap = await api.getSkillGap(data.user.id, 'Full Stack Developer');
        setSkillGap(gap);
      } else if (data.user.role === 'recruiter') {
        setRecruiterProfile(data.profile as RecruiterProfile);
      }
      const [apps, notifs, myDocs] = await Promise.all([
        api.getApplications(),
        api.getNotifications(),
        api.getDocuments()
      ]);
      setApplications(apps);
      setNotifications(notifs);
      setDocuments(myDocs);
      setActiveTab('dashboard');
    } catch (e) {
      console.error('Failed to switch user:', e);
    }
  };

  const handleApplyJob = async (jobId: string, coverNote?: string) => {
    try {
      const newApp = await api.applyForJob(jobId, coverNote);
      setApplications(prev => [newApp, ...prev]);
      // refresh notifs
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (e: any) {
      alert(e.message || 'Failed to submit application');
    }
  };

  const handleAdvanceStage = async (appId: string, stage: any) => {
    try {
      const updated = await api.updateApplicationStage(appId, stage);
      setApplications(prev => prev.map(a => a.id === appId ? updated : a));
    } catch (e) {
      console.error(e);
    }
  };

  const handleInspectMatch = async (job: JobPosting, customStudent?: StudentProfile) => {
    const student = customStudent || studentProfile || students[0];
    if (!student) return;

    try {
      const res = await api.computeJobMatch(job.id, student.userId);
      const isApplied = applications.some(a => a.studentId === student.userId && a.jobId === job.id);
      setMatchModalData({
        job,
        student,
        matchScore: res.matchScore,
        breakdown: res.matchBreakdown,
        explainable: res.explainableMatch,
        eligibilityStatus: res.eligibilityStatus,
        eligibilityReasons: res.eligibilityReasons,
        isApplied
      });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/25 animate-bounce">
            <span className="font-black text-xl">CL</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-wider font-mono">CAMPUSLINK</h2>
            <p className="text-xs text-slate-400 mt-1">Bootstrapping AI placement engine & neural matrices...</p>
          </div>
        </div>
      </div>
    );
  }

  // Landing Page Mode
  if (isLanding) {
    return (
      <LandingPage
        onGetStarted={() => setIsLanding(false)}
        onSelectPersona={async (userId) => {
          await handleSwitchUser(userId);
          setIsLanding(false);
        }}
        onOpenRegister={() => {
          setIsLanding(false);
          setActiveTab('register');
        }}
        allUsers={allUsers}
      />
    );
  }

  const activeStudent = studentProfile || students[0];

  return (
    <div className="min-h-screen bg-[#F7F3EC] text-[#1E2522] font-sans flex flex-col md:flex-row antialiased selection:bg-[#DCE8DF] selection:text-[#1C4631]">
      
      {/* Desktop & Mobile Responsive Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        unreadCount={unreadNotifCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={() => setIsLanding(true)}
      />

      {/* Main Viewport Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Topbar */}
        <Topbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          notifications={notifications}
          unreadCount={unreadNotifCount}
          onMarkNotificationRead={async (id) => {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
          }}
          onMarkAllNotificationsRead={async () => {
            await api.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }}
          setMobileOpen={setMobileOpen}
          onOpenAiAssistant={() => setShowAiAssistant(true)}
          onOpenFlowModal={() => setShowFlowModal(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic Route View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* TAB: OVERVIEW / DASHBOARD (Role-Adaptive matching screenshot) */}
          {(activeTab === 'overview' || activeTab === 'dashboard') && (
            currentUser?.role === 'tpo' ? (
              <TPODashboardView
                stats={placementStats || {
                  totalStudents: 1248,
                  placementReady: 842,
                  activeDrives: 12,
                  totalOffers: 326,
                  placedStudents: 302,
                  placementRate: 72,
                  studentsAtRisk: 36,
                  averagePackageLPA: 12.8,
                  highestPackageLPA: 48.0,
                  funnel: { registered: 1248, eligible: 1085, shortlisted: 640, interviewed: 480, selected: 338, offerAccepted: 302, joined: 285 },
                  branchPlacement: [],
                  skillDemand: [],
                  packageDistribution: [],
                  averagePackageTrend: [],
                  offersByCompany: [],
                  monthlyTrend: []
                }}
                atRiskStudents={atRiskStudents}
                drives={drives}
                applications={applications}
                onNavigateTab={setActiveTab}
              />
            ) : currentUser?.role === 'recruiter' ? (
              <RecruiterDashboardView
                jobs={jobs}
                applications={applications}
                students={students}
                onCreateJob={() => setShowPostJobModal(true)}
                onAdvanceStage={handleAdvanceStage}
                onViewCandidate={(student) => {
                  setStudentProfile(student);
                  setActiveTab('profile');
                }}
              />
            ) : (
              <StudentDashboard
                student={activeStudent}
                jobs={jobs}
                applications={applications}
                interviews={interviews}
                skillGap={skillGap}
                onViewMatchDetails={(job) => handleInspectMatch(job, activeStudent)}
                onNavigateTab={setActiveTab}
                onApplyJob={(jobId) => handleApplyJob(jobId)}
                onOpenAiAssistant={() => setShowAiAssistant(true)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )
          )}

          {/* TAB: MY APPLICATIONS */}
          {activeTab === 'applications' && (
            <ApplicationsPipelineView
              applications={applications.filter(a => a.studentId === activeStudent.userId)}
              onViewJobDetails={(jobId) => {
                const job = jobs.find(j => j.id === jobId);
                if (job) handleInspectMatch(job, activeStudent);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* TAB: AI READINESS */}
          {activeTab === 'readiness' && (
            <ReadinessAnalysisView
              student={activeStudent}
              scoringWeights={scoringWeights}
              onUpdateWeights={async (weights) => {
                await api.updateAiWeights({ scoringWeights: weights });
                const updated = await api.getAiWeights();
                setScoringWeights(updated.scoringWeights);
                const s = await api.getStudentById(activeStudent.userId);
                setStudentProfile(s);
              }}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* TAB: SKILL GAP */}
          {activeTab === 'skillgap' && (
            <SkillGapView
              student={activeStudent}
              initialAnalysis={skillGap}
              onFetchSkillGap={(role) => api.getSkillGap(activeStudent.userId, role)}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* TAB: PREPARATION CENTER */}
          {activeTab === 'prep' && (
            <PreparationCenterView
              student={activeStudent}
              skillGap={skillGap}
            />
          )}

          {/* TAB: AI MATCHING */}
          {activeTab === 'aimatching' && (
            <AIMatchingView
              students={students}
              jobs={jobs}
              matchingWeights={matchingWeights}
              onComputeMatch={(studentId, jobId) => api.computeJobMatch(jobId, studentId)}
              onInspectDetails={(job, student) => handleInspectMatch(job, student)}
            />
          )}

          {/* TAB: JOBS / DISCOVER ROLES */}
          {(activeTab === 'jobs' || activeTab === 'discover') && (
            <JobBoard
              jobs={jobs}
              studentProfile={activeStudent}
              applications={applications}
              currentUser={currentUser}
              onApply={async (jobId, note) => {
                await handleApplyJob(jobId, note);
              }}
              onRefreshJobs={async () => {
                const refreshed = await api.getJobs();
                setJobs(refreshed);
              }}
              onOpenPostJob={() => setShowPostJobModal(true)}
              onInspectMatch={(job) => handleInspectMatch(job, activeStudent)}
            />
          )}

          {/* TAB: SCHEDULING / CAMPUS EVENTS */}
          {(activeTab === 'scheduling' || activeTab === 'events') && (
            <SchedulingView
              drives={drives}
              companies={companies}
              onCreateDrive={async (payload) => {
                const res = await api.createDrive(payload);
                setDrives(prev => [res.drive, ...prev]);
                return res;
              }}
              onCheckConflict={(data) => api.checkSchedulingConflict(data)}
            />
          )}

          {/* TAB: INTERVIEWS */}
          {activeTab === 'interviews' && (
            <InterviewsView
              interviews={interviews}
              onUpdateInterview={async (id, data) => {
                const updated = await api.updateInterview(id, data);
                setInterviews(prev => prev.map(i => i.id === id ? updated : i));
                return updated;
              }}
            />
          )}

          {/* TAB: OFFERS */}
          {activeTab === 'offers' && (
            <OffersView
              offers={offers}
              onUpdateStatus={async (id, status) => {
                const updated = await api.updateOfferStatus(id, status);
                setOffers(prev => prev.map(o => o.id === id ? updated : o));
                return updated;
              }}
            />
          )}

          {/* TAB: DOCUMENTS / RESUME STUDIO */}
          {(activeTab === 'documents' || activeTab === 'resume') && (
            <DocumentsView
              documents={documents}
              isTPO={currentUser?.role === 'tpo'}
              onUploadDocument={async (doc) => {
                const created = await api.uploadDocument({
                  ...doc,
                  studentId: activeStudent.userId,
                  studentName: activeStudent.fullName
                });
                setDocuments(prev => [created, ...prev]);
                return created;
              }}
              onVerifyDocument={async (id, status, note) => {
                const verified = await api.verifyDocument(id, status, note);
                setDocuments(prev => prev.map(d => d.id === id ? verified : d));
                return verified;
              }}
            />
          )}

          {/* TAB: STUDENTS */}
          {activeTab === 'students' && (
            <StudentsListView
              students={students}
              onSelectStudent={(s) => {
                setStudentProfile(s);
                setActiveTab('profile');
              }}
            />
          )}

          {/* TAB: AT RISK STUDENTS */}
          {activeTab === 'atrisk' && (
            <AtRiskStudentsView
              atRiskStudents={atRiskStudents}
            />
          )}

          {/* TAB: COMPANIES */}
          {activeTab === 'companies' && (
            <CompaniesView
              companies={companies}
              jobs={jobs}
              onSelectCompanyJobs={() => setActiveTab('jobs')}
            />
          )}

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && placementStats && (
            <AnalyticsDashboardView
              stats={placementStats}
            />
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Placement Notification Center
                </h3>
                <button
                  onClick={async () => {
                    await api.markAllNotificationsRead();
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Mark all as read
                </button>
              </div>

              <div className="space-y-2.5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={async () => {
                      if (!notif.read) {
                        await api.markNotificationRead(notif.id);
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                      }
                      if (notif.linkTab) setActiveTab(notif.linkTab as NavTab);
                    }}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                      !notif.read ? 'bg-indigo-50/60 border-indigo-100 hover:bg-indigo-50' : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />}
                        <span className="font-extrabold text-slate-900 text-sm">{notif.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.createdAt).toLocaleDateString()} · {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1.5 leading-relaxed">{notif.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS & WEIGHTS */}
          {activeTab === 'settings' && (
            <SettingsView
              scoringWeights={scoringWeights}
              matchingWeights={matchingWeights}
              onUpdateWeights={async (weights) => {
                await api.updateAiWeights(weights);
                const updated = await api.getAiWeights();
                setScoringWeights(updated.scoringWeights);
                setMatchingWeights(updated.matchingWeights);
              }}
            />
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <StudentProfileView
              student={activeStudent}
              onUpdateProfile={async (data) => {
                const updated = await api.updateStudentProfile(data);
                setStudentProfile(updated);
                return updated;
              }}
            />
          )}

          {/* TAB: PLACEMENT ARCHITECTURE FLOW (8 STEPS) */}
          {activeTab === 'flow' && (
            <FlowWalkthroughView
              student={activeStudent}
              jobs={jobs}
              companies={companies}
              drives={drives}
              applications={applications}
              offers={offers}
              placementStats={placementStats}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onRefreshData={loadInitialData}
            />
          )}

          {/* TAB: REGISTRATION PAGE (Step 1 of Flow) */}
          {activeTab === 'register' && (
            <RegistrationView
              onRegistrationSuccess={async (newUser, newProfile) => {
                setCurrentUser(newUser);
                if (newUser.role === 'student') {
                  setStudentProfile(newProfile as StudentProfile);
                } else if (newUser.role === 'recruiter') {
                  setRecruiterProfile(newProfile as RecruiterProfile);
                }
                await loadInitialData();
                setActiveTab('overview');
              }}
              onNavigateTab={setActiveTab}
            />
          )}

        </main>
      </div>

      {/* FLOW WALKTHROUGH QUICK MODAL */}
      <FlowWalkthroughModal
        isOpen={showFlowModal}
        onClose={() => setShowFlowModal(false)}
        student={activeStudent}
        jobs={jobs}
        companies={companies}
        drives={drives}
        applications={applications}
        offers={offers}
        placementStats={placementStats}
        currentUser={currentUser}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowFlowModal(false);
        }}
        onOpenFullFlowView={() => {
          setActiveTab('flow');
          setShowFlowModal(false);
        }}
      />

      {/* MATCH DETAILS MODAL (Explainable AI) */}
      {matchModalData && (
        <MatchDetailsModal
          job={matchModalData.job}
          student={matchModalData.student}
          matchScore={matchModalData.matchScore}
          breakdown={matchModalData.breakdown}
          explainable={matchModalData.explainable}
          eligibilityStatus={matchModalData.eligibilityStatus}
          eligibilityReasons={matchModalData.eligibilityReasons}
          isApplied={matchModalData.isApplied}
          onApply={() => handleApplyJob(matchModalData.job.id)}
          onClose={() => setMatchModalData(null)}
        />
      )}

      {/* POST JOB MODAL */}
      {showPostJobModal && (
        <JobPostingModal
          isOpen={showPostJobModal}
          onClose={() => setShowPostJobModal(false)}
          onJobCreated={(newJob) => {
            setJobs(prev => [newJob, ...prev]);
            setShowPostJobModal(false);
          }}
          currentUser={currentUser}
        />
      )}

      {/* AI ASSISTANT CHATBOT MODAL */}
      <AIChatbotModal
        student={activeStudent}
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        onAskAi={(query) => api.askAiAssistant(query, activeStudent.userId)}
      />

    </div>
  );
}
export default App;
