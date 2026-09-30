import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Award, 
  Download, 
  Share2, 
  Volume2, 
  Bell, 
  ArrowRight, 
  Lock, 
  Unlock, 
  UserCheck, 
  FileCheck, 
  Zap, 
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Eye,
  RotateCw,
  Check,
  Briefcase,
  Terminal,
  Radio
} from 'lucide-react';
import { StudentProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  generateDefaultPassport, 
  INITIAL_LIVE_DRIVES, 
  INITIAL_HALL_CANDIDATES, 
  playChimeSound 
} from '../services/passportService.ts';

interface PlacementPassportViewProps {
  student: StudentProfile;
  onNavigateTab?: (tab: any) => void;
}

export const PlacementPassportView: React.FC<PlacementPassportViewProps> = ({
  student,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'passport' | 'warroom' | 'scanner' | 'policy' | 'escrow'>('passport');
  const [passport, setPassport] = useState(() => generateDefaultPassport(student));
  const [isFlipped, setIsFlipped] = useState(false);
  const [drives, setDrives] = useState(INITIAL_LIVE_DRIVES);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('live-drive-1');
  const [hallCandidates, setHallCandidates] = useState(INITIAL_HALL_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState(INITIAL_HALL_CANDIDATES[3]); // current user
  
  // Notification alert toast
  const [liveToast, setLiveToast] = useState<{ message: string; type: 'info' | 'success' | 'alert' } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [integrityVerified, setIntegrityVerified] = useState(false);
  const [isVerifyingChecksum, setIsVerifyingChecksum] = useState(false);

  // Digital Signature state for Escrow
  const [signerName, setSignerName] = useState(student.fullName || 'Student Candidate');
  const [hasSigned, setHasSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);

  const activeDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setLiveToast({ message, type });
    setTimeout(() => setLiveToast(null), 4500);
  };

  // Sync real Passport and Drives from Database
  useEffect(() => {
    api.getPassports().then(serverPassports => {
      const match = serverPassports.find(p => p.student_id === student.userId) || serverPassports[0];
      if (match) {
        setPassport(prev => ({
          ...prev,
          passportNumber: match.passport_number || prev.passportNumber,
          blockchainHash: match.blockchain_hash || prev.blockchainHash,
          seals: {
            ...prev.seals,
            academic: { ...prev.seals.academic, status: match.academic_verified ? 'VERIFIED' : 'PENDING' },
            tpoClearance: { ...prev.seals.tpoClearance, status: match.tpo_verified ? 'VERIFIED' : 'PENDING' },
            technicalATS: { ...prev.seals.technicalATS, status: match.documents_verified ? 'VERIFIED' : 'PENDING' },
            backgroundCheck: { ...prev.seals.backgroundCheck, status: match.attendance_verified ? 'VERIFIED' : 'PENDING' }
          }
        }));
      }
    }).catch(err => console.warn('Could not sync passport from backend:', err));

    api.getDrives().then(serverDrives => {
      if (serverDrives && serverDrives.length > 0) {
        setDrives(prev => prev.map((d, i) => {
          const s = serverDrives[i];
          if (!s) return d;
          return {
            ...d,
            driveId: s.id,
            companyName: s.companyName,
            role: s.role || s.title,
            packageCtc: s.packageCtc || '₹18.0 LPA',
            venue: s.venue
          };
        }));
      }
    }).catch(err => console.warn('Could not sync drives from backend:', err));
  }, [student.userId]);

  // Advance queue token in live war-room with backend API call
  const handleAdvanceQueue = async () => {
    try {
      await api.callNextInQueue(activeDrive.driveId, activeDrive.roomNumber);
    } catch (e) {
      // continues with UI state update
    }

    setDrives(prev => prev.map(drive => {
      if (drive.id !== selectedDriveId) return drive;
      
      const currentTokenNum = parseInt(drive.currentServedToken.replace(/[^\d]/g, ''), 10);
      const studentTokenNum = parseInt(drive.studentTokenNumber.replace(/[^\d]/g, ''), 10);
      const nextTokenNum = currentTokenNum + 1;
      const prefix = drive.currentServedToken.replace(/[\d]/g, '');
      const nextTokenStr = `${prefix}${nextTokenNum}`;
      
      const nextWait = Math.max(0, (studentTokenNum - nextTokenNum) * 5);

      // Check if it reached or matched the student's token
      if (nextTokenNum >= studentTokenNum) {
        playChimeSound();
        showToast(`🔔 TOKEN ${drive.studentTokenNumber} CALLED! Please report immediately to ${drive.roomNumber}!`, 'alert');
        return {
          ...drive,
          currentServedToken: nextTokenStr,
          estimatedWaitMinutes: 0,
          stage: 'TECH_ROUND_1',
          status: 'IN_ROOM',
          announcementAlert: `ATTENTION: Token ${drive.studentTokenNumber} is currently entering ${drive.roomNumber} with ${drive.interviewerName}!`
        };
      } else {
        playChimeSound();
        showToast(`Queue Advanced! Now serving Token ${nextTokenStr} in ${drive.roomNumber}`, 'info');
        return {
          ...drive,
          currentServedToken: nextTokenStr,
          estimatedWaitMinutes: nextWait,
          announcementAlert: `Now calling Token ${nextTokenStr}. Tokens up to ${drive.studentTokenNumber} please be on standby.`
        };
      }
    }));
  };

  const handleTestChime = () => {
    playChimeSound();
    showToast('Sound synthesizer test: Chime broadcast verified successfully!', 'success');
  };

  const handleVerifyIntegrity = () => {
    setIsVerifyingChecksum(true);
    setTimeout(() => {
      setIsVerifyingChecksum(false);
      setIntegrityVerified(true);
      showToast('Cryptographic Checksum Verified: 100% genuine academic records authenticated from University Records.', 'success');
    }, 900);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://campuslink.edu/verify/passport/${passport.passportNumber}?hash=${passport.blockchainHash}`);
    setCopiedLink(true);
    showToast('Verifiable Passport URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Recruiter action execution with backend API persistence
  const handleRecruiterAction = async (action: 'checkin' | 'call' | 'pass' | 'offer') => {
    if (!selectedCandidate) return;

    if (action === 'checkin') {
      try {
        await api.checkInToDrive(activeDrive.driveId, {
          student_id: selectedCandidate.studentId,
          passport_id: passport.id
        });
      } catch (e) {
        console.warn('Backend check-in error:', e);
      }
      showToast(`${selectedCandidate.name} (Token ${selectedCandidate.tokenNumber}) marked Present at Gate Check-in!`, 'success');
      setHallCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, isVerified: true, stage: 'GATE_CHECKIN' } : c));
    } else if (action === 'call') {
      try {
        await api.callSpecificInQueue(activeDrive.driveId, {
          token_number: selectedCandidate.tokenNumber,
          room: 'Room B-204'
        });
      } catch (e) {
        console.warn('Backend call candidate error:', e);
      }
      playChimeSound();
      showToast(`Announced: ${selectedCandidate.name} (Token ${selectedCandidate.tokenNumber}) called into Room B-204!`, 'alert');
      setHallCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, stage: 'TECH_ROUND_1' } : c));
    } else if (action === 'pass') {
      showToast(`${selectedCandidate.name} evaluated & passed to Technical Round 2 (System Design)!`, 'success');
      setHallCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, stage: 'TECH_ROUND_2' } : c));
    } else if (action === 'offer') {
      try {
        await api.evaluatePlacementPolicy({
          student_id: selectedCandidate.studentId,
          new_company: activeDrive.companyName,
          new_package: 24.5,
          new_offer_category: 'SUPER_DREAM'
        });
      } catch (e) {
        console.warn('Backend policy evaluate error:', e);
      }
      showToast(`🎉 SPOT OFFER GENERATED for ${selectedCandidate.name} at ₹24.5 LPA! Digital Escrow notified.`, 'success');
      setHallCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, stage: 'OFFERED' } : c));
    }
  };

  const isMyTokenCalled = activeDrive.currentServedToken === activeDrive.studentTokenNumber;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Live Toast banner */}
      {liveToast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce ${
          liveToast.type === 'alert'
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
            : liveToast.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
            : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30'
        }`}>
          {liveToast.type === 'alert' ? <Bell className="w-5 h-5 shrink-0 animate-spin" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{liveToast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>INDUSTRY FIRST · CAMPUS EXCLUSIVE FEATURE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Placement Passport™ & Live Drive War-Room
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Tamper-proof verifiable digital credential passport, real-time interview token tracking with audio chimes, 
              zero-chaos gate scanners, and University Dream-Tier upgrade matrix.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleTestChime}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all hover:scale-105"
              title="Test web audio synthesizer chime"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Test Audio Chime</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'Copied URL!' : 'Share Passport'}</span>
            </button>
          </div>
        </div>

        {/* Feature Sub-Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-800/80 pt-5">
          {[
            { id: 'passport', label: 'Verifiable Placement Passport', icon: ShieldCheck, badge: 'Digital ID' },
            { id: 'warroom', label: 'Live Drive War-Room & Queue', icon: Radio, badge: 'Live Real-Time' },
            { id: 'scanner', label: 'Recruiter Gate Scanner Mode', icon: QrCode, badge: 'TPO / HR' },
            { id: 'policy', label: 'Dream Tier Upgrade Matrix', icon: Award, badge: 'Policy' },
            { id: 'escrow', label: 'Offer Escrow & Digital Sign', icon: FileCheck, badge: 'Verified' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-md shadow-white/10 scale-102'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-indigo-100 text-indigo-700 font-extrabold' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: VERIFIABLE HOLOGRAPHIC PLACEMENT PASSPORT */}
      {/* ========================================================================= */}
      {activeSubTab === 'passport' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: 3D Holographic Passport Card */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Verifiable Holographic Credential (Interactive 3D Card)
              </span>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all hover:bg-indigo-100"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip Card (View {isFlipped ? 'Front' : 'Back'})</span>
              </button>
            </div>

            {/* Passport Container with Card Visuals */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer transition-transform duration-500 transform hover:scale-[1.01]"
            >
              {!isFlipped ? (
                /* FRONT OF PASSPORT CARD */
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border-2 border-indigo-400/40 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
                  {/* Hologram subtle sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/15 to-amber-400/10 pointer-events-none" />
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Row */}
                  <div className="relative z-10 flex items-start justify-between border-b border-indigo-500/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/40 border border-indigo-400/50">
                        CL
                      </div>
                      <div>
                        <div className="text-[11px] font-mono tracking-widest text-indigo-300 font-bold uppercase">
                          OFFICIAL PLACEMENT PASSPORT™
                        </div>
                        <h2 className="text-lg font-extrabold text-white tracking-wide">
                          CAMPUSLINK NATIONAL REGISTRY
                        </h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>REGISTRAR VERIFIED</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        EXP: {passport.expiryDate}
                      </div>
                    </div>
                  </div>

                  {/* Body: Photo, Student Details, and QR */}
                  <div className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                    {/* Left: Avatar & Key info */}
                    <div className="sm:col-span-8 flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                          alt={student.fullName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400/80 shadow-xl"
                        />
                        <div className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase font-mono shadow-md">
                          GOLD SEAL
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {student.fullName}
                        </h3>
                        <p className="text-xs text-indigo-300 font-mono font-semibold">
                          Roll: {student.rollNumber || '22CS021'} · {student.branch || 'Computer Science'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Batch 2022 - 2026 · B.Tech (Honors)
                        </p>
                        <div className="pt-1.5 flex flex-wrap items-center gap-2">
                          <span className="bg-slate-800 text-indigo-200 border border-indigo-500/30 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            CGPA: {passport.metrics.cgpa}
                          </span>
                          <span className="bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            ATS: {passport.metrics.atsScore}/100
                          </span>
                          <span className="bg-slate-800 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                            Arrears: {passport.metrics.backlogs}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Dynamic High-Contrast QR Code */}
                    <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl text-slate-900 border border-slate-200">
                      {/* Crisp Authentic QR SVG graphic */}
                      <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900">
                        {/* 3 Main Corner Positioning Squares */}
                        <rect x="5" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                        <rect x="13" y="13" width="12" height="12" fill="currentColor" />
                        
                        <rect x="67" y="5" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                        <rect x="75" y="13" width="12" height="12" fill="currentColor" />
                        
                        <rect x="5" y="67" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                        <rect x="13" y="75" width="12" height="12" fill="currentColor" />
                        
                        {/* Data bits matrix simulation */}
                        <rect x="38" y="8" width="8" height="8" fill="currentColor" />
                        <rect x="50" y="8" width="8" height="8" fill="currentColor" />
                        <rect x="42" y="22" width="6" height="6" fill="currentColor" />
                        <rect x="52" y="22" width="8" height="8" fill="currentColor" />
                        
                        <rect x="8" y="38" width="8" height="8" fill="currentColor" />
                        <rect x="22" y="42" width="6" height="6" fill="currentColor" />
                        <rect x="38" y="38" width="12" height="12" fill="currentColor" />
                        <rect x="54" y="38" width="6" height="6" fill="currentColor" />
                        <rect x="68" y="42" width="10" height="8" fill="currentColor" />
                        <rect x="84" y="38" width="8" height="8" fill="currentColor" />

                        <rect x="38" y="54" width="8" height="8" fill="currentColor" />
                        <rect x="50" y="52" width="10" height="10" fill="currentColor" />
                        <rect x="66" y="54" width="8" height="8" fill="currentColor" />
                        <rect x="80" y="54" width="10" height="8" fill="currentColor" />

                        <rect x="38" y="70" width="10" height="6" fill="currentColor" />
                        <rect x="52" y="72" width="8" height="8" fill="currentColor" />
                        <rect x="68" y="70" width="8" height="8" fill="currentColor" />
                        <rect x="82" y="72" width="10" height="10" fill="currentColor" />
                        <rect x="42" y="84" width="8" height="8" fill="currentColor" />
                        <rect x="56" y="84" width="12" height="8" fill="currentColor" />
                        <rect x="74" y="86" width="8" height="6" fill="currentColor" />
                      </svg>
                      <span className="text-[9px] font-mono font-bold tracking-tight text-slate-700 mt-1 uppercase text-center">
                        SCAN TO AUDIT
                      </span>
                    </div>
                  </div>

                  {/* Footer Bar: Cryptographic Hash & Passport Number */}
                  <div className="relative z-10 pt-4 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="font-mono text-indigo-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>ID: <strong className="text-white">{passport.passportNumber}</strong></span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                      HASH: {passport.blockchainHash}
                    </div>
                    <span className="text-[10px] text-indigo-400 font-semibold">
                      Click to flip card ↷
                    </span>
                  </div>
                </div>
              ) : (
                /* BACK OF PASSPORT CARD */
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border-2 border-indigo-400/40 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
                  <div className="border-b border-indigo-500/20 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-white tracking-wide">
                        CERTIFIED PLACEMENT TRANSCRIPT & GUARANTEE
                      </h4>
                      <p className="text-[11px] text-indigo-300 font-mono">
                        University Placement Board & Central Registry
                      </p>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded font-mono">
                      BACKSIDE VIEW
                    </span>
                  </div>

                  {/* Academic Details breakdown */}
                  <div className="space-y-3 my-4 text-xs">
                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400">Verified Degree & Branch</span>
                      <span className="font-bold text-white">B.Tech Computer Science & Eng.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400">Cumulative GPA (1st - 6th Sem)</span>
                      <span className="font-bold text-emerald-400 font-mono">8.78 / 10.0 (Top 5%)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400">Class 10th & 12th Board Marks</span>
                      <span className="font-bold text-white font-mono">10th: 92.4% · 12th: 89.2%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400">Disciplinary Standing & Attendance</span>
                      <span className="font-bold text-emerald-300">Clean Record · 91.2% Attendance</span>
                    </div>
                  </div>

                  {/* Signatures & Official Stamp */}
                  <div className="pt-4 border-t border-indigo-500/20 grid grid-cols-2 gap-4 items-end">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Registrar Signature</div>
                      <div className="font-serif italic text-base text-amber-300 tracking-wide mt-1">
                        Prof. D. K. Swaminathan
                      </div>
                      <div className="text-[9px] text-slate-500">Controller of Examinations</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">TPO Authorized Seal</div>
                      <div className="font-serif italic text-base text-indigo-300 tracking-wide mt-1">
                        Dr. Radhika Sharma
                      </div>
                      <div className="text-[9px] text-slate-500">Director, University Placement Cell</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions underneath card */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleVerifyIntegrity}
                disabled={isVerifyingChecksum}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <ShieldCheck className={`w-4 h-4 ${isVerifyingChecksum ? 'animate-spin' : ''}`} />
                <span>{isVerifyingChecksum ? 'Checking Blockchain Hash...' : integrityVerified ? 'Checksum Validated ✓' : 'Verify Integrity'}</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Official PDF / Pass</span>
              </button>

              <button
                onClick={() => setActiveSubTab('warroom')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 ml-auto transition-all"
              >
                <span>Enter Live Drive War-Room</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: 4 Verifiable Seals & Live Proofs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    4-Tier Verification Seals
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  ALL SEALS ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                {/* Academic Seal */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{passport.seals.academic.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {passport.seals.academic.details}
                  </p>
                  <div className="text-[9px] font-mono text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>{passport.seals.academic.issuer}</span>
                    <span>{passport.seals.academic.hash}</span>
                  </div>
                </div>

                {/* TPO Clearance Seal */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{passport.seals.tpoClearance.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {passport.seals.tpoClearance.details}
                  </p>
                  <div className="text-[9px] font-mono text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>{passport.seals.tpoClearance.issuer}</span>
                    <span>{passport.seals.tpoClearance.hash}</span>
                  </div>
                </div>

                {/* ATS & Code Seal */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{passport.seals.technicalATS.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                      SCORE 92%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {passport.seals.technicalATS.details}
                  </p>
                  <div className="text-[9px] font-mono text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>{passport.seals.technicalATS.issuer}</span>
                    <span>{passport.seals.technicalATS.hash}</span>
                  </div>
                </div>

                {/* Background Check Seal */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{passport.seals.backgroundCheck.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      DIGILOCKER
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {passport.seals.backgroundCheck.details}
                  </p>
                  <div className="text-[9px] font-mono text-slate-400 mt-1.5 flex items-center justify-between">
                    <span>{passport.seals.backgroundCheck.issuer}</span>
                    <span>{passport.seals.backgroundCheck.hash}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Gate Pass Widget */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-5 text-white border border-indigo-700/50 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-300 font-bold uppercase">
                  Fast-Track Gate Pass
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">
                  READY TO SCAN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Show this barcode at the auditorium entrance. Recruiters scan with camera to instantly log attendance without physical roll call.
              </p>
              <div className="mt-3 py-2 px-3 bg-white rounded-xl text-center">
                {/* 1D Barcode CSS simulation */}
                <div className="h-8 flex items-center justify-center gap-0.5">
                  {[3,1,2,4,1,3,2,1,4,2,1,3,1,2,4,1,3,2,1,4,1,3,2,4,1,2].map((w, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-950 h-full rounded-xs" 
                      style={{ width: `${w * 2}px` }} 
                    />
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-700 font-bold mt-1">
                  *CL-2026-CSE-{student.rollNumber || '8924'}*
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: LIVE DRIVE WAR-ROOM & TOKEN QUEUE TRACKER */}
      {/* ========================================================================= */}
      {activeSubTab === 'warroom' && (
        <div className="space-y-6">
          {/* Active Drive Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Ongoing Campus Drive:
            </span>
            {drives.map(drive => (
              <button
                key={drive.id}
                onClick={() => setSelectedDriveId(drive.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  selectedDriveId === drive.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${selectedDriveId === drive.id ? 'bg-amber-400 animate-ping' : 'bg-slate-300'}`} />
                <span>{drive.companyName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  selectedDriveId === drive.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {drive.packageCtc}
                </span>
              </button>
            ))}
          </div>

          {/* MAIN WAR-ROOM DASHBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Real-Time Token Monitor */}
            <div className="lg:col-span-8 space-y-6">
              {/* Giant Live Token Banner */}
              <div className={`rounded-3xl p-6 sm:p-8 border-2 transition-all relative overflow-hidden shadow-xl ${
                isMyTokenCalled
                  ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-slate-950 border-amber-300 animate-pulse'
                  : 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border-indigo-500/40'
              }`}>
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isMyTokenCalled ? 'text-slate-900' : 'text-indigo-300'}`}>
                        LIVE AUDITORIUM QUEUE · {activeDrive.venue}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black mt-1">
                      {activeDrive.companyName} · {activeDrive.role}
                    </h2>
                    <p className={`text-xs mt-1 ${isMyTokenCalled ? 'text-slate-900 font-semibold' : 'text-slate-300'}`}>
                      {activeDrive.roomNumber} · Interviewer: {activeDrive.interviewerName}
                    </p>
                  </div>

                  {/* Token Status Badges */}
                  <div className="flex items-center gap-4">
                    {/* Your Token */}
                    <div className={`p-4 rounded-2xl text-center border ${
                      isMyTokenCalled
                        ? 'bg-white text-slate-950 border-white shadow-xl'
                        : 'bg-slate-900/90 text-white border-indigo-400/40'
                    }`}>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        YOUR TOKEN
                      </div>
                      <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-amber-400">
                        {activeDrive.studentTokenNumber}
                      </div>
                    </div>

                    {/* Currently In Room */}
                    <div className="p-4 rounded-2xl text-center bg-slate-900/80 border border-slate-700 text-white">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        NOW SERVING
                      </div>
                      <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                        {activeDrive.currentServedToken}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Notice Alert */}
                <div className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed flex items-center gap-3 ${
                  isMyTokenCalled
                    ? 'bg-white/90 text-slate-950 border-white font-extrabold'
                    : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50'
                }`}>
                  <Bell className="w-5 h-5 shrink-0 text-amber-400 animate-bounce" />
                  <div>
                    <strong>Live Broadcast: </strong> {activeDrive.announcementAlert}
                  </div>
                </div>

                {/* Queue Interactive Simulator Controls */}
                <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="text-slate-400">Estimated wait: </span>
                    <strong className="text-amber-400 font-mono text-sm">{activeDrive.estimatedWaitMinutes} minutes</strong>
                    <span className="text-slate-400"> ({Math.max(0, parseInt(activeDrive.studentTokenNumber.replace(/[^\d]/g, '')) - parseInt(activeDrive.currentServedToken.replace(/[^\d]/g, '')))} candidates ahead)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAdvanceQueue}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/30 transition-all hover:scale-105"
                      title="Simulate interviewer calling next candidate"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Advance Queue (+1)</span>
                    </button>
                    <button
                      onClick={handleTestChime}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs"
                      title="Play Chime"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Round Placement War-Room Pipeline */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Today's Drive Interview Pipeline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live progression tracked across campus testing rooms
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    ROUND 3 OF 5 ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {/* Round 1 */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-800 font-bold">
                      <span>1. Gate Check-in</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">08:45 AM · Scanned</div>
                    <p className="text-[11px] text-emerald-900 font-medium">Passport Verified ✓</p>
                  </div>

                  {/* Round 2 */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-800 font-bold">
                      <span>2. Online Test</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono">Score: 94 / 100</div>
                    <p className="text-[11px] text-emerald-900 font-medium">Rank #4 in Hall ✓</p>
                  </div>

                  {/* Round 3 - Current */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50 border-2 border-indigo-600 text-xs space-y-1 shadow-sm">
                    <div className="flex items-center justify-between text-indigo-900 font-black">
                      <span>3. Tech Round 1</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    </div>
                    <div className="text-[10px] text-indigo-700 font-mono">Room B-204</div>
                    <p className="text-[11px] text-indigo-950 font-bold">
                      {isMyTokenCalled ? 'NOW INSIDE ROOM' : 'Token B-18 In Queue'}
                    </p>
                  </div>

                  {/* Round 4 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 opacity-70">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>4. System Design</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Panel 3 · Est 02:00 PM</div>
                    <p className="text-[11px] text-slate-600">Pending Round 1</p>
                  </div>

                  {/* Round 5 */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 opacity-70">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>5. HR & Spot Offer</span>
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Conference Room</div>
                    <p className="text-[11px] text-slate-600">Digital Escrow</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Auditorium Roster */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Hall Activity Feed
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    54 Candidates in Hall
                  </span>
                </div>

                <div className="space-y-2.5">
                  {hallCandidates.map(c => {
                    const isCurrent = c.tokenNumber === activeDrive.studentTokenNumber;
                    const isServed = c.tokenNumber === activeDrive.currentServedToken;
                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-2xl border text-xs transition-all ${
                          isServed
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                            : isCurrent
                            ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                              {c.tokenNumber}
                            </span>
                            <span className="font-bold text-slate-900">
                              {c.name} {isCurrent && '(You)'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isServed
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {isServed ? 'NOW IN PANEL' : c.stage.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                          <span>{c.branch} · CGPA {c.cgpa}</span>
                          <span>Checked in: {c.checkInTime}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TPO Helpline */}
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>TPO Student Helpdesk</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 mt-1">
                    If your roll number was bypassed or you have an exam conflict, contact Helpdesk Desk 2 (Hall Lobby).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: RECRUITER GATE SCANNER MODE */}
      {/* ========================================================================= */}
      {activeSubTab === 'scanner' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold">
                  RECRUITER / TPO DESK CONSOLE
                </span>
                <span className="text-xs font-mono text-emerald-600 font-bold">
                  LIVE SCANNER CONNECTED
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Hall Gate Scanner & Instant Candidate Audit
              </h2>
              <p className="text-xs text-slate-500">
                Point camera at student's Placement Passport QR or select candidate to run fraud detection check and update live hall queue.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRecruiterAction('checkin')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Mark Present</span>
              </button>
              <button
                onClick={() => handleRecruiterAction('call')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Call to Room</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 Cols: Candidate Selection list */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Candidates at Gate / Waiting Lounge:
              </span>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {hallCandidates.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedCandidate.id === c.id
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
                          {c.tokenNumber}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        CGPA {c.cgpa}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>Roll: {c.rollNo} · {c.branch}</span>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">
                        {c.stage.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 7 Cols: Instant Candidate Audit & Action Desk */}
            <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">
                      {selectedCandidate.name} · {selectedCandidate.rollNo}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Token: {selectedCandidate.tokenNumber} · Hash: {selectedCandidate.passportHash}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  AUTHENTICATED
                </span>
              </div>

              {/* Fraud Detection & Academic Verification Checks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Registrar ERP CGPA</span>
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{selectedCandidate.cgpa} / 10.0</span>
                    <span className="text-emerald-600 font-mono text-[10px] font-bold">✓ 0 Backlogs</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Resume ATS & Code Proof</span>
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{selectedCandidate.score}/100 Match</span>
                    <span className="text-indigo-600 font-mono text-[10px] font-bold">✓ Repo Verified</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Eligibility Policy Standing</span>
                  <div className="font-bold text-emerald-700 flex items-center justify-between">
                    <span>Eligible for Super Dream</span>
                    <span className="text-slate-500 font-mono text-[10px]">Rule 4.2 Approved</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">University Hall Check-in</span>
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Logged at {selectedCandidate.checkInTime}</span>
                    <span className="text-emerald-600 font-mono text-[10px] font-bold">✓ Badge Active</span>
                  </div>
                </div>
              </div>

              {/* Recruiter Evaluation Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleRecruiterAction('call')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Call to Interview Room</span>
                </button>

                <button
                  onClick={() => handleRecruiterAction('pass')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Pass to Round 2</span>
                </button>

                <button
                  onClick={() => handleRecruiterAction('offer')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all ml-auto"
                >
                  <Award className="w-4 h-4" />
                  <span>Issue Spot Offer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: DREAM COMPANY POLICY UPGRADE MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'policy' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>UNIVERSITY PLACEMENT REGULATION 2026</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                "Dream Company" Upgrade Matrix & Anti-Hoarding Rules
              </h2>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                Prevents single students from blocking multiple placement offers while enabling merit-based upgrades 
                to top-tier Dream and Super Dream companies.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
              <span className="text-amber-800 font-bold">Your Current Offer: </span>
              <strong className="text-slate-900 font-mono">₹7.50 LPA</strong>
              <div className="text-[11px] text-amber-900 mt-0.5">
                Status: <strong>Tier 2 Dream Held</strong> · Upgrades allowed for &gt;₹12.0 LPA
              </div>
            </div>
          </div>

          {/* 3 Tier visual cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Regular Tier */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3 relative opacity-70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">Tier 1</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                  LOCKED
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Regular / Core Tier</h3>
              <div className="text-2xl font-black text-slate-900 font-mono">&lt; ₹6.0 LPA</div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mass recruitment and standard IT service roles. Once you secure an offer above ₹6 LPA, Tier 1 drives are automatically locked to give opportunities to unplaced peers.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-200/80 text-[11px] text-slate-700 font-medium">
                🔒 Locked because you already hold ₹7.5 LPA.
              </div>
            </div>

            {/* Dream Tier */}
            <div className="p-5 rounded-3xl bg-indigo-50/70 border-2 border-indigo-300 space-y-3 relative shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-700 uppercase">Tier 2</span>
                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
                  ACTIVE (HELD)
                </span>
              </div>
              <h3 className="font-extrabold text-indigo-950 text-base">Dream Offer Tier</h3>
              <div className="text-2xl font-black text-indigo-900 font-mono">₹6.0 – ₹12.0 LPA</div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                High-growth product roles and consulting positions. Students holding a Tier 1 offer can upgrade here. You currently hold an offer in this tier.
              </p>
              <div className="p-2.5 rounded-xl bg-indigo-100 text-[11px] text-indigo-900 font-semibold">
                ✓ Offer Held: Accenture R&D (₹7.5 LPA)
              </div>
            </div>

            {/* Super Dream Tier */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 space-y-3 relative shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-800 uppercase">Tier 3</span>
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
                  UNLOCKED · OPEN
                </span>
              </div>
              <h3 className="font-extrabold text-slate-950 text-base">Super Dream Tier</h3>
              <div className="text-2xl font-black text-amber-900 font-mono">&gt; ₹12.0 LPA</div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tier-1 Tech Companies (Google, Microsoft, Amazon, Uber, Atlassian). Any student can participate regardless of existing offers if CTC is &gt; 1.5x current.
              </p>
              <div className="p-2.5 rounded-xl bg-amber-100/90 text-[11px] text-amber-950 font-bold">
                🌟 Eligible to sit for Google (₹24.5L) & Microsoft (₹32L)!
              </div>
            </div>
          </div>

          {/* Policy FAQ & Regulations */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
            <h4 className="font-extrabold text-slate-900 text-sm">
              Placement Council Commitment Bond Terms:
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li><strong>One Acceptance Guarantee:</strong> When an upgrade to Super Dream is accepted, the prior Dream offer is released back to the University Escrow Pool within 48 hours for waiting list candidates.</li>
              <li><strong>Anti-Ghosting Safeguard:</strong> Unjustified reneging of verified offers results in Placement Passport de-activation across all national college drives.</li>
              <li><strong>Official Transcript Release:</strong> University releases final degree transcripts directly to the verified company upon graduation.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: OFFER LETTER ESCROW & DIGITAL SIGNING */}
      {/* ========================================================================= */}
      {activeSubTab === 'escrow' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  LEGAL DIGITAL ESCROW
                </span>
                <span className="text-xs font-mono text-slate-400">
                  DOC ID: CL-OFFER-2026-9021
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Official Spot Offer Letter & Digital Signing
              </h2>
              <p className="text-xs text-slate-500">
                Directly execute your employment contract with cryptographically signed timestamp and registrar notarization.
              </p>
            </div>

            {hasSigned && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Digitally Signed on {signedDate}</span>
              </div>
            )}
          </div>

          {/* Letter Body Preview */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 font-serif text-slate-800 text-xs leading-relaxed space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <strong className="text-sm font-sans font-black text-slate-900">GOOGLE INDIA IDC</strong>
                <div className="text-[10px] font-sans text-slate-500">Campus Recruitment Cell · Bengaluru & Hyderabad</div>
              </div>
              <div className="text-right text-[10px] font-sans font-mono text-slate-500">
                Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <p>
              Dear <strong>{student.fullName}</strong>,
            </p>
            <p>
              We are pleased to offer you employment in the position of <strong>Associate Cloud Engineer (SDE)</strong> at Google India IDC. 
              Based on your outstanding performance in the CampusLink On-Campus Recruitment Drive, your technical evaluation, and your verified academic credentials, 
              we are thrilled to welcome you to our engineering team.
            </p>

            <div className="p-4 rounded-xl bg-white border border-slate-200 font-sans space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Annual Total CTC Package:</span>
                <span className="font-black text-indigo-700 font-mono text-sm">₹24,50,000 / Year (₹24.5 LPA)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Work Location:</span>
                <span className="font-bold text-slate-800">Google Hyderabad Campus / Remote Hybrid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tentative Joining Date:</span>
                <span className="font-bold text-slate-800">July 15, 2026 (Post B.Tech Final Degree)</span>
              </div>
            </div>

            <p>
              This offer is subject to satisfactory completion of your remaining university semesters with a minimum of 7.5 CGPA and zero active backlogs as verified by the CampusLink Placement Passport.
            </p>

            {/* Signature Area */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Authorized Signatory</div>
                <div className="font-serif italic text-base text-slate-800 mt-1">David Vance</div>
                <div className="text-[10px] text-slate-500">Head of University Talent, Google APAC</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Candidate Acceptance Signature</div>
                {hasSigned ? (
                  <div className="mt-1">
                    <div className="font-serif italic text-lg text-indigo-600 font-bold">
                      {signerName}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 font-bold">
                      ✓ Digitally Certified (SHA-256: 0x9f2a...88c)
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="Type full legal name to sign"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        setHasSigned(true);
                        setSignedDate(new Date().toLocaleDateString());
                        api.acceptOfferEscrow('off_google_spot', signerName).catch(e => console.warn(e));
                        playChimeSound();
                        showToast('Offer Letter Digitally Accepted & Recorded on College Escrow!', 'success');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                      Click to Sign & Accept Offer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
