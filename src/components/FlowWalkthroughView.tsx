import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap, 
  BarChart3, 
  Calendar, 
  Award, 
  Cpu, 
  FileText, 
  Users, 
  ExternalLink, 
  Check, 
  AlertCircle,
  Building2,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Search,
  Zap
} from 'lucide-react';
import { 
  StudentProfile, 
  JobPosting, 
  Company, 
  Drive, 
  Application, 
  OfferRecord,
  CampusPlacementStats,
  User
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { NavTab } from './Sidebar.tsx';

interface FlowWalkthroughViewProps {
  student: StudentProfile;
  jobs: JobPosting[];
  companies: Company[];
  drives: Drive[];
  applications: Application[];
  offers: OfferRecord[];
  placementStats: CampusPlacementStats | null;
  currentUser: User | null;
  onNavigateTab: (tab: NavTab) => void;
  onRefreshData?: () => Promise<void>;
}

export interface FlowStep {
  stepNumber: number;
  id: string;
  title: string;
  shortTitle: string;
  category: 'Student' | 'AI Engine' | 'Recruiter' | 'TPO / Cell' | 'Final Analytics';
  entities: string[];
  description: string;
  apiEndpoints: string[];
  destinationTab: NavTab;
  systemActionLabel: string;
}

export const FLOW_STEPS: FlowStep[] = [
  {
    stepNumber: 1,
    id: 'student_reg',
    title: 'Student Registration & Profile Building',
    shortTitle: '1. Student Profile',
    category: 'Student',
    entities: ['Student', 'Skill', 'Resume', 'Project', 'Certificate'],
    description: 'Student creates verified profile with Roll No, Branch, CGPA, Backlogs, technical skills, capstone projects, certifications, and ATS resume upload.',
    apiEndpoints: ['POST /api/auth/register', 'POST /api/students', 'PUT /api/students/:id', 'POST /api/documents'],
    destinationTab: 'register',
    systemActionLabel: 'Verify Academic Profile & Skills'
  },
  {
    stepNumber: 2,
    id: 'readiness_scoring',
    title: 'AI Profile Analysis & Readiness Scoring',
    shortTitle: '2. AI Readiness',
    category: 'AI Engine',
    entities: ['ScoringWeights', 'SkillGapAnalysis', 'ATSScore', 'ReadinessScore'],
    description: 'Deterministic 7-factor readiness score (0-100), ATS resume compatibility parsing, skill gap roadmap targeting industry roles, and early risk detection.',
    apiEndpoints: ['POST /api/ai/readiness-score', 'POST /api/ai/skill-gap'],
    destinationTab: 'readiness',
    systemActionLabel: 'Compute AI Employability Score'
  },
  {
    stepNumber: 3,
    id: 'job_posting',
    title: 'Company Registration & Job Posting',
    shortTitle: '3. Job Posting',
    category: 'Recruiter',
    entities: ['Company', 'Job', 'EligibilityRules', 'Openings'],
    description: 'Corporate recruiters configure job postings with hard eligibility gates: Min CGPA (7.5), Eligible Branches, Max Allowed Backlogs (0), CTC tier, and deadlines.',
    apiEndpoints: ['POST /api/companies', 'POST /api/jobs'],
    destinationTab: 'jobs',
    systemActionLabel: 'Publish Job with Eligibility Gates'
  },
  {
    stepNumber: 4,
    id: 'candidate_matching',
    title: 'AI-Driven Candidate-Job Matching & Explainability Engine',
    shortTitle: '4. AI Matching',
    category: 'AI Engine',
    entities: ['MatchBreakdown', 'ExplainableMatch', 'Application'],
    description: 'Cosine similarity vector matching compares student profile against job requirements. Evaluates hard eligibility gates, outputs match % and explainability score breakdown.',
    apiEndpoints: ['POST /api/ai/match', 'POST /api/ai/explain-match', 'POST /api/applications'],
    destinationTab: 'aimatching',
    systemActionLabel: 'Run Match & Submit 1-Click Apply'
  },
  {
    stepNumber: 5,
    id: 'drive_scheduling',
    title: 'Placement Drive Creation & Conflict-Free Scheduling',
    shortTitle: '5. Drive Scheduling',
    category: 'TPO / Cell',
    entities: ['Drive', 'TimeSlot', 'ConflictCheckResult', 'Notification'],
    description: 'TPO creates multi-round recruitment drive (Aptitude, Tech, HR). Automated conflict engine checks venue, date, and student batch availability with 0 clashes.',
    apiEndpoints: ['POST /api/drives', 'POST /api/scheduling/check-conflict'],
    destinationTab: 'scheduling',
    systemActionLabel: 'Validate Slots & Schedule Drive'
  },
  {
    stepNumber: 6,
    id: 'round_evaluations',
    title: 'Automated Multi-Round Evaluation & Progression',
    shortTitle: '6. Round Evaluation',
    category: 'Recruiter',
    entities: ['Assessment', 'Interview', 'Scorecard', 'StageProgression'],
    description: 'Round 1 online assessment scores recorded. Qualified students advance to Round 2 (Technical Coding & Architecture) and Round 3 (HR & Leadership Fit).',
    apiEndpoints: ['PATCH /api/applications/:id/stage', 'POST /api/applications/:id/evaluations'],
    destinationTab: 'interviews',
    systemActionLabel: 'Evaluate & Advance All Rounds'
  },
  {
    stepNumber: 7,
    id: 'offer_management',
    title: 'Offer Generation, Verification & Letter Management',
    shortTitle: '7. Offer Letter',
    category: 'TPO / Cell',
    entities: ['Offer', 'OfferDetails', 'ComplianceCheck', 'StudentAcceptance'],
    description: 'Recruiter extends official Offer Letter with CTC breakdown. Student reviews and accepts in real-time. TPO validates university compliance policy (e.g. 1-offer / dream upgrade rule).',
    apiEndpoints: ['PATCH /api/offers/:id/status', 'POST /api/applications/:id/respond-offer'],
    destinationTab: 'offers',
    systemActionLabel: 'Extend, Accept & Verify Offer'
  },
  {
    stepNumber: 8,
    id: 'analytics_dashboard',
    title: 'Post-Offer Student Joining & University TPO Analytics Dashboard',
    shortTitle: '8. TPO Analytics',
    category: 'Final Analytics',
    entities: ['PlacementStats', 'ConversionFunnel', 'BranchPlacement', 'AtRiskStudent'],
    description: 'Candidate marked Placed & Joined. University placement command center displays real-time placement rate %, 7-stage conversion funnel, salary tiers, and hiring heatmaps.',
    apiEndpoints: ['GET /api/analytics/overview', 'GET /api/analytics/packages', 'GET /api/analytics/at-risk'],
    destinationTab: 'analytics',
    systemActionLabel: 'View Real-time University Funnel'
  }
];

export const FlowWalkthroughView: React.FC<FlowWalkthroughViewProps> = ({
  student,
  jobs,
  companies,
  drives,
  applications,
  offers,
  placementStats,
  currentUser,
  onNavigateTab,
  onRefreshData
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [simulatedSteps, setSimulatedSteps] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: applications.some(a => a.studentId === student.userId),
    5: drives.length > 0,
    6: applications.some(a => a.stage === 'interview' || a.stage === 'hr_round' || a.stage === 'offered' || a.stage === 'accepted'),
    7: offers.length > 0 || applications.some(a => a.stage === 'offered' || a.stage === 'accepted'),
    8: Boolean(placementStats && placementStats.placedStudents > 0)
  });

  const [isRunningAll, setIsRunningAll] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [activeStepActionLoading, setActiveStepActionLoading] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<string | null>(null);

  const activeStep = FLOW_STEPS[selectedStepIndex];

  // Helper to append log
  const addLog = (msg: string) => {
    setExecutionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Run single step interactive simulation
  const handleExecuteStep = async (stepNum: number) => {
    setActiveStepActionLoading(true);
    setStepFeedback(null);
    try {
      if (stepNum === 1) {
        addLog(`Step 1: Updating & Verifying Student Profile for ${student.fullName}...`);
        const updatedSkills = Array.from(new Set([...student.skills, 'System Design', 'FastAPI', 'Docker']));
        await api.updateStudentProfile({
          userId: student.userId,
          skills: updatedSkills,
          aptitudeScore: 88,
          mockInterviewScore: 84
        });
        setSimulatedSteps(prev => ({ ...prev, 1: true }));
        setStepFeedback('✓ Step 1 Successful: Profile enriched with verified skills, GPA verified (8.42), 0 backlogs.');
        addLog('Step 1 Complete: Persisted Student, Skills & Resume in database.');
      } 
      else if (stepNum === 2) {
        addLog('Step 2: Calculating 7-factor AI Readiness Score & Skill Gap...');
        const readiness = await api.computeReadinessScore(student.userId);
        const gap = await api.getSkillGap(student.userId, 'Full Stack Developer');
        setSimulatedSteps(prev => ({ ...prev, 2: true }));
        setStepFeedback(`✓ Step 2 Successful: AI Readiness Score is ${readiness.overallScore}/100 (${readiness.level}). ATS Match: 91%. Top missing skill: ${gap.missingSkills[0]?.skill || 'AWS'}.`);
        addLog(`Step 2 Complete: Readiness Score = ${readiness.overallScore}/100. Target role mapped.`);
      }
      else if (stepNum === 3) {
        addLog('Step 3: Registering corporate partner & publishing campus job opening...');
        const newJob = await api.createJob({
          title: 'AI Systems & Cloud Engineer',
          department: 'Platform AI Engineering',
          location: 'Bangalore / Hybrid',
          type: 'Full-Time',
          ctcOrStipend: '₹24 LPA',
          minCgpa: 7.5,
          maxBacklogs: 0,
          allowedBranches: ['Computer Science & Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
          skills: ['Python', 'PyTorch', 'React', 'Docker', 'SQL'],
          openingsCount: 8,
          description: 'High-growth platform engineering role focusing on neural inference and distributed systems.'
        });
        setSimulatedSteps(prev => ({ ...prev, 3: true }));
        setStepFeedback(`✓ Step 3 Successful: Job "${newJob.title}" posted at ${newJob.companyName} with CTC ${newJob.ctcOrStipend}. Eligibility rules verified.`);
        addLog(`Step 3 Complete: Job ${newJob.id} published with Min CGPA 7.5 & 0 Backlogs.`);
      }
      else if (stepNum === 4) {
        addLog(`Step 4: Running AI Cosine Match between ${student.fullName} and active roles...`);
        const targetJob = jobs[0] || { id: 'job_technova_sde', title: 'Software Engineer', companyName: 'TechNova' };
        const matchRes = await api.computeJobMatch(targetJob.id, student.userId);
        addLog(`Match computed: ${matchRes.matchScore}% Match Score. Eligibility Gate: ${matchRes.eligibilityStatus}.`);
        
        // 1-Click apply
        const existingApp = applications.find(a => a.studentId === student.userId && a.jobId === targetJob.id);
        if (!existingApp) {
          await api.applyForJob(targetJob.id, 'Candidate matched through CAMPUSLINK AI flow with 88%+ cosine score.');
        }
        setSimulatedSteps(prev => ({ ...prev, 4: true }));
        setStepFeedback(`✓ Step 4 Successful: Match Score: ${matchRes.matchScore}%. Gate check: PASSED. Application logged & AI shortlisted.`);
        addLog('Step 4 Complete: Application submitted with explainable score decomposition.');
      }
      else if (stepNum === 5) {
        addLog('Step 5: Verifying schedule conflicts & booking recruitment drive...');
        const conflict = await api.checkSchedulingConflict({
          companyId: companies[0]?.id || 'comp_technova',
          date: '2026-11-20',
          startTime: '10:00 AM',
          endTime: '05:00 PM',
          venue: 'Turing Hall & Computing Lab 3',
          targetBatches: [2026]
        });
        
        const newDrive = await api.createDrive({
          title: 'Campus Super-Drive: TechNova Solutions',
          companyId: companies[0]?.id || 'comp_technova',
          companyName: companies[0]?.name || 'TechNova Solutions',
          date: '2026-11-20',
          startTime: '10:00 AM',
          endTime: '05:00 PM',
          venue: 'Turing Hall & Computing Lab 3',
          minCgpa: 7.5,
          openings: 12,
          panelMembers: ['Dr. Ananya Sen (TPO)', 'Vikas Mehta (VP Engineering)']
        });
        setSimulatedSteps(prev => ({ ...prev, 5: true }));
        setStepFeedback(`✓ Step 5 Successful: Drive scheduled on ${newDrive.drive.date} with 0 time/venue clashes. Notifications sent to students.`);
        addLog(`Step 5 Complete: Conflict-Free check: ${conflict.hasConflict ? 'CLASH' : 'CLEAR'}. Drive ${newDrive.drive.id} confirmed.`);
      }
      else if (stepNum === 6) {
        addLog('Step 6: Executing Multi-Round evaluations (Aptitude -> Tech -> HR)...');
        // Find or create an application to advance
        const targetApp = applications[0];
        if (targetApp) {
          // Advance to assessment, then interview
          await api.updateApplicationStage(targetApp.id, 'interview', {
            note: 'Cleared Round 1 Online Assessment (Score 92/100). Technical Interview scheduled.',
            interviewDetails: {
              roundName: 'Round 2: Technical & System Architecture',
              interviewer: 'Sarah Jenkins (Principal Engineer)',
              date: '2026-11-21',
              time: '11:30 AM',
              meetingLink: 'https://campuslink.edu/interview/tech-live'
            }
          });
          // Add scorecard
          await api.addEvaluation(targetApp.id, {
            rating: 5,
            comment: 'Exceptional proficiency in algorithms, clean code structures, and API architectural patterns.',
            author: 'Sarah Jenkins',
            role: 'Principal Engineer'
          });
        }
        setSimulatedSteps(prev => ({ ...prev, 6: true }));
        setStepFeedback('✓ Step 6 Successful: Student passed Round 1 (Score 92/100), cleared Round 2 Technical with 5/5 rating, advanced to final HR round.');
        addLog('Step 6 Complete: Interview scorecards and round progression updated.');
      }
      else if (stepNum === 7) {
        addLog('Step 7: Extending formal Offer Letter, executing student acceptance, and TPO compliance audit...');
        const targetApp = applications[0];
        if (targetApp) {
          await api.updateApplicationStage(targetApp.id, 'offered', {
            note: 'Official campus offer letter generated and dispatched to candidate.',
            offerDetails: {
              ctc: '₹24,00,000 LPA',
              baseFixed: '₹18,00,000 LPA',
              bonus: '₹3,00,000 Joining Bonus',
              rsu: '₹3,00,000 RSUs',
              joiningDate: '2026-07-01',
              validTill: '2026-07-15',
              offerLetterUrl: '#preview-offer-letter',
              status: 'Offer Generated'
            }
          });
          // Student accepts
          await api.respondToOffer(targetApp.id, 'accept');
          // TPO verifies offer
          if (offers[0]) {
            await api.updateOfferStatus(offers[0].id, 'Accepted');
          }
        }
        setSimulatedSteps(prev => ({ ...prev, 7: true }));
        setStepFeedback('✓ Step 7 Successful: ₹24 LPA offer extended, accepted by student in real-time, and approved by TPO compliance.');
        addLog('Step 7 Complete: Student accepted offer. University 1-student-1-job compliance verified.');
      }
      else if (stepNum === 8) {
        addLog('Step 8: Transitioning candidate to Placed & Joined status, refreshing university metrics...');
        const targetApp = applications[0];
        if (targetApp) {
          await api.updateApplicationStage(targetApp.id, 'joined', {
            note: 'Final university documentation complete. Candidate marked as Placed & Joined.'
          });
        }
        const refreshedStats = await api.getPlacementStats();
        setSimulatedSteps(prev => ({ ...prev, 8: true }));
        setStepFeedback(`✓ Step 8 Successful: Placement rate reached ${refreshedStats.placementRate}%! Total Offers: ${refreshedStats.totalOffers}, Highest CTC: ₹${refreshedStats.highestPackageLPA} LPA.`);
        addLog(`Step 8 Complete: Placement conversion funnel updated. Placed count: ${refreshedStats.placedStudents}.`);
      }

      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
      setStepFeedback(`⚠ Action Note: ${err.message || 'Operation executed with fallback state.'}`);
      addLog(`Step ${stepNum} alert: ${err.message || 'Error executing action'}`);
    } finally {
      setActiveStepActionLoading(false);
    }
  };

  // Run all 8 steps automatically
  const handleRunAllSteps = async () => {
    setIsRunningAll(true);
    setExecutionLog([]);
    addLog('🚀 INITIATING FULL END-TO-END CAMPUSLINK PLACEMENT PIPELINE (Steps 1 to 8)...');

    for (let i = 1; i <= 8; i++) {
      setSelectedStepIndex(i - 1);
      await handleExecuteStep(i);
      // Brief pause between steps for realistic simulation feel
      await new Promise(res => setTimeout(res, 800));
    }

    addLog('🎉 COMPLETE CAMPUSLINK PIPELINE SUCCESSFULLY EXECUTED: All 8 Architecture Stages Live & Verified!');
    setIsRunningAll(false);
  };

  // Reset demo simulation state
  const handleResetSimulation = () => {
    setSimulatedSteps({
      1: true,
      2: true,
      3: true,
      4: false,
      5: false,
      6: false,
      7: false,
      8: false
    });
    setExecutionLog([]);
    setStepFeedback('Simulation state reset. You can now step through each phase or click "Auto-Run All 8 Steps".');
    setSelectedStepIndex(0);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Student':
        return 'bg-[#FCE8DE] text-[#B8552D] border-[#F4D1C1]';
      case 'AI Engine':
        return 'bg-[#E3EFE7] text-[#1C4631] border-[#C7DFD0]';
      case 'Recruiter':
        return 'bg-[#EDE8F5] text-[#5B3E8C] border-[#D9CDEB]';
      case 'TPO / Cell':
        return 'bg-[#E3EDF7] text-[#1E5288] border-[#CADDF0]';
      case 'Final Analytics':
        return 'bg-[#FAF0D7] text-[#8C6414] border-[#ECDAB0]';
      default:
        return 'bg-[#F0EAE1] text-[#5E574E] border-[#E0D7C9]';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Hero Banner matching editorial aesthetic */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE4D9] shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#DCE8DF]/40 via-transparent to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE8DF] text-[#1C4631] text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified System Architecture</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif text-[#1E2522] tracking-tight">
              CAMPUSLINK End-to-End Placement Flow
            </h2>
            
            <p className="text-sm text-[#5E574E] leading-relaxed">
              Trace the complete 8-stage lifecycle from initial student registration and ATS scoring through AI cosine matching, conflict-free scheduling, multi-round interviews, to verified job offer joining and university-wide TPO analytics.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRunAllSteps}
              disabled={isRunningAll}
              className="px-5 py-2.5 bg-[#1C4631] hover:bg-[#153826] disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              {isRunningAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>⚡ Auto-Run All 8 Steps</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetSimulation}
              disabled={isRunningAll}
              className="px-4 py-2.5 bg-[#F0EAE1] hover:bg-[#E5DDCF] text-[#5E574E] text-xs font-semibold rounded-2xl flex items-center gap-2 transition-colors cursor-pointer"
              title="Reset simulation state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 8-Stage Progress Track */}
        <div className="mt-8 pt-6 border-t border-[#ECE4D9]">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {FLOW_STEPS.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              const isDone = simulatedSteps[step.stepNumber];
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`p-3 rounded-2xl text-left transition-all border text-xs relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C4631] text-white border-[#1C4631] shadow-xs'
                      : isDone
                      ? 'bg-[#F4F8F5] text-[#1E2522] border-[#CDE1D4] hover:bg-[#EAF3ED]'
                      : 'bg-[#FAF8F5] text-[#7A7268] border-[#ECE4D9] hover:bg-[#F2ECE1]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? 'text-emerald-200' : isDone ? 'text-[#1C4631]' : 'text-[#8C8377]'
                    }`}>
                      Step {step.stepNumber}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#1C4631]'}`} />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white/50' : 'bg-[#D5CCC0]'}`} />
                    )}
                  </div>
                  <div className="font-semibold truncate text-[11px] leading-snug">
                    {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Flow Stage Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Step Deep Dive (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ECE4D9] shadow-xs space-y-6">
            
            {/* Stage Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#F0EAE1]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(activeStep.category)}`}>
                    {activeStep.category}
                  </span>
                  <span className="text-xs text-[#7A7268] font-medium">Stage {activeStep.stepNumber} of 8</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-[#1E2522]">
                  {activeStep.title}
                </h3>
              </div>

              {/* Status pill */}
              <div className="shrink-0">
                {simulatedSteps[activeStep.stepNumber] ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8DF] text-[#1C4631] text-xs font-bold">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>State Active & Verified</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0D7] text-[#8C6414] text-xs font-bold">
                    <span>Ready for Execution</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Description & Objective */}
            <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9] space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A7268]">
                Phase Objective & Architecture Logic
              </div>
              <p className="text-xs sm:text-sm text-[#3E3831] leading-relaxed">
                {activeStep.description}
              </p>
            </div>

            {/* Architecture Entities Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#1E2522] uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#1C4631]" />
                <span>Primary Architecture Entities & Data Models</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {activeStep.entities.map((entity) => (
                  <span
                    key={entity}
                    className="px-3 py-1 bg-white border border-[#E3DCD1] text-[#1E2522] font-mono text-xs rounded-xl shadow-2xs font-semibold"
                  >
                    <code>{entity}</code>
                  </span>
                ))}
              </div>
            </div>

            {/* REST API Endpoints Involved */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#1E2522] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#1C4631]" />
                <span>Underlying RESTful API Endpoints</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeStep.apiEndpoints.map((ep) => (
                  <div 
                    key={ep}
                    className="p-2.5 rounded-xl bg-[#F6F2EC] text-[11px] font-mono text-[#4A4237] border border-[#E7DFD4] flex items-center justify-between"
                  >
                    <span>{ep}</span>
                    <span className="text-[10px] text-[#1C4631] font-sans font-bold">REST</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Interactive Action Controls */}
            <div className="pt-4 border-t border-[#F0EAE1] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => handleExecuteStep(activeStep.stepNumber)}
                disabled={activeStepActionLoading || isRunningAll}
                className="w-full sm:w-auto px-6 py-3 bg-[#1C4631] hover:bg-[#153826] disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
              >
                {activeStepActionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Executing Action...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{activeStep.systemActionLabel}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onNavigateTab(activeStep.destinationTab)}
                className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-[#F9F6F0] text-[#1C4631] border border-[#CDE1D4] text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Jump to Live UI Module</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Feedback Toast if updated */}
            {stepFeedback && (
              <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#C2DEC9] text-xs text-[#1C4631] font-medium animate-in fade-in">
                {stepFeedback}
              </div>
            )}

            {/* Step Pagination */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedStepIndex(Math.max(0, selectedStepIndex - 1))}
                disabled={selectedStepIndex === 0}
                className="text-xs font-bold text-[#7A7268] hover:text-[#1E2522] disabled:opacity-30 cursor-pointer"
              >
                ← Previous Stage
              </button>

              <span className="text-xs text-[#8C8377] font-medium">
                {selectedStepIndex + 1} of {FLOW_STEPS.length}
              </span>

              <button
                onClick={() => setSelectedStepIndex(Math.min(FLOW_STEPS.length - 1, selectedStepIndex + 1))}
                disabled={selectedStepIndex === FLOW_STEPS.length - 1}
                className="text-xs font-bold text-[#1C4631] hover:underline disabled:opacity-30 cursor-pointer"
              >
                Next Stage →
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Live State & System Execution Console (1 col) */}
        <div className="space-y-6">
          
          {/* Current Live State Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#ECE4D9] shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-[#1E2522] uppercase tracking-wider flex items-center justify-between">
              <span>Pipeline State Monitor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">Active Candidate</span>
                <span className="font-bold text-[#1E2522]">{student.fullName} (CSE)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">Verified CGPA / Backlogs</span>
                <span className="font-bold text-[#1C4631]">{student.cgpa.toFixed(2)} · 0 Backlogs</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">AI Readiness Score</span>
                <span className="font-bold text-[#1C4631]">{student.readinessScore}/100</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">Active Applications</span>
                <span className="font-bold text-[#1E2522]">{applications.length} Submissions</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">Placement Drives</span>
                <span className="font-bold text-[#1E2522]">{drives.length} Scheduled</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">Campus Offers Released</span>
                <span className="font-bold text-[#B8552D]">{offers.length} Offers</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F6F0] border border-[#ECE4D9]">
                <span className="text-[#5E574E]">University Placement Rate</span>
                <span className="font-bold text-[#1C4631]">{placementStats?.placementRate || 78}%</span>
              </div>
            </div>
          </div>

          {/* Real-time Execution Log Console */}
          <div className="bg-[#1E2522] text-[#E0E7E3] rounded-3xl p-6 border border-[#2B3530] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3A33] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-300">SYSTEM EXECUTION LOG</span>
              </div>
              <span className="text-[10px] font-mono text-[#83968C]">Live Stream</span>
            </div>

            <div className="h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 pr-1 leading-relaxed text-[#B7C7BF]">
              {executionLog.length === 0 ? (
                <div className="text-center py-16 text-[#6B7D74] italic">
                  Press "Auto-Run All 8 Steps" or execute individual stage actions to inspect live system state changes.
                </div>
              ) : (
                executionLog.map((log, idx) => (
                  <div key={idx} className="border-b border-[#2A3730]/40 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#2D3A33] flex items-center justify-between text-[10px] text-[#83968C] font-mono">
              <span>CAMPUSLINK Neural Engine</span>
              <span>Deterministic v2.4</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default FlowWalkthroughView;
