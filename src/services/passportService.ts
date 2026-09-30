import { PlacementPassport, LiveDriveToken, DriveHallCandidate, StudentProfile } from '../types/index.ts';

// Web Audio API Chime Synthesizer for live room call announcements
export function playChimeSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play dual-tone airport / board chime (D5 -> A5 -> D6)
    const tones = [
      { freq: 587.33, start: 0.0, dur: 0.25 }, // D5
      { freq: 880.00, start: 0.2, dur: 0.35 }, // A5
      { freq: 1174.66, start: 0.45, dur: 0.6 } // D6
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.start);
      
      gain.gain.setValueAtTime(0.001, ctx.currentTime + t.start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t.start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t.start + t.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t.start);
      osc.stop(ctx.currentTime + t.start + t.dur + 0.05);
    });
  } catch (e) {
    console.warn('Audio chime failed to play:', e);
  }
}

export function generateDefaultPassport(student: StudentProfile): PlacementPassport {
  const hash = '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    id: `passport-${student.userId}`,
    studentId: student.userId,
    passportNumber: `CL-2026-${(student.branch || 'CSE').substring(0, 3).toUpperCase()}-${student.rollNumber?.slice(-4) || '8924'}`,
    issueDate: '2026-08-01',
    expiryDate: '2027-07-31',
    blockchainHash: hash,
    qrPayload: `CAMPUSLINK_VERIFIED:${student.userId}:${student.fullName}:${student.cgpa || 8.65}:${hash}`,
    seals: {
      academic: {
        id: 'seal-acad',
        name: 'University Registrar Academic Integrity',
        issuer: 'Office of the Registrar & Controller of Examinations',
        status: 'VERIFIED',
        verifiedAt: '2026-08-15',
        hash: 'SHA256:4a8e99b2c31e',
        details: `CGPA ${student.cgpa || 8.65} verified from central ERP. 0 Active Backlogs. 10th: 92%, 12th: 89%.`
      },
      tpoClearance: {
        id: 'seal-tpo',
        name: 'Central Placement Cell Clearance (TPO)',
        issuer: 'Campus Placement & Training Directorate',
        status: 'VERIFIED',
        verifiedAt: '2026-08-18',
        hash: 'SHA256:7c91a03f4112',
        details: 'Mandatory 85%+ attendance fulfilled. Disciplinary clearance granted. Placement code accepted.'
      },
      technicalATS: {
        id: 'seal-ats',
        name: 'AI Neural ATS & Code Authenticity Seal',
        issuer: 'CampusLink Automated Verifier Engine',
        status: 'VERIFIED',
        verifiedAt: '2026-09-02',
        hash: 'SHA256:b19284cf734a',
        details: `Resume ATS Score: ${student.atsScore || 88}%. 100% verified GitHub repos and live hosted demos.`
      },
      backgroundCheck: {
        id: 'seal-bgv',
        name: 'Pre-Employment Background Verification (BGV)',
        issuer: 'DigiLocker & National Academic Depository (NAD)',
        status: 'VERIFIED',
        verifiedAt: '2026-08-20',
        hash: 'SHA256:90a3c4fe8810',
        details: 'Identity (Aadhaar / Passport) authenticated. Academic transcripts verified on blockchain ledger.'
      }
    },
    metrics: {
      cgpa: student.cgpa || 8.65,
      backlogs: student.backlogs || 0,
      atsScore: student.atsScore || 88,
      readinessScore: student.readinessScore || 84,
      githubCommits: 342,
      leetCodeSolved: 185,
      verifiedSkillsCount: (student.skills || []).length || 8
    },
    policyTier: {
      currentStatus: 'PLACED_DREAM_ONLY',
      allowedTier: 'SUPER_DREAM',
      offersHeldCount: 1,
      maxAllowedOffers: 2,
      currentHighestCtcLPA: 7.5
    }
  };
}

export const INITIAL_LIVE_DRIVES: LiveDriveToken[] = [
  {
    id: 'live-drive-1',
    driveId: 'drv-google-2026',
    companyName: 'Google Cloud IDC',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=120&auto=format&fit=crop&q=80',
    role: 'Associate Cloud Engineer (SDE)',
    packageCtc: '₹24.5 LPA',
    date: 'Today · Active Live',
    venue: 'Campus Tech Tower · Level 3, Hall A',
    studentTokenNumber: 'B-18',
    currentServedToken: 'B-15',
    estimatedWaitMinutes: 14,
    hallName: 'APJ Abdul Kalam Auditorium',
    roomNumber: 'Room B-204 (Tech Panel 2)',
    stage: 'TECH_ROUND_1',
    status: 'QUEUED',
    interviewerName: 'Dr. Sarah Lin (Staff Engineer, Google)',
    announcementAlert: 'Tokens B-16 to B-18, please assemble outside Room B-204 for document verification & panel briefing.'
  },
  {
    id: 'live-drive-2',
    driveId: 'drv-msft-2026',
    companyName: 'Microsoft R&D',
    companyLogo: 'https://images.unsplash.com/photo-1642132652809-8c9e54d58079?w=120&auto=format&fit=crop&q=80',
    role: 'Software Development Engineer - I',
    packageCtc: '₹32.0 LPA',
    date: 'Tomorrow · 09:00 AM',
    venue: 'Convention Center · Hall 2',
    studentTokenNumber: 'M-09',
    currentServedToken: 'M-01',
    estimatedWaitMinutes: 90,
    hallName: 'Convention Hall 2',
    roomNumber: 'Panel 4',
    stage: 'APTITUDE_TEST',
    status: 'QUEUED',
    interviewerName: 'Rohan Mehra (Engineering Manager, Azure)',
    announcementAlert: 'Online technical coding assessment link active at 09:15 AM sharp.'
  },
  {
    id: 'live-drive-3',
    driveId: 'drv-tcs-2026',
    companyName: 'TCS Digital / Prime',
    companyLogo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    role: 'Prime Developer (AI/ML)',
    packageCtc: '₹9.0 LPA',
    date: 'In 3 Days',
    venue: 'Central Computer Lab 4',
    studentTokenNumber: 'T-44',
    currentServedToken: 'T-10',
    estimatedWaitMinutes: 180,
    hallName: 'Central Lab 4',
    roomNumber: 'Lab Station 12',
    stage: 'GATE_CHECKIN',
    status: 'QUEUED',
    interviewerName: 'Campus Hiring Team',
    announcementAlert: 'Bring physical printed copy of CampusLink Placement Passport for fast-track barcode scanning.'
  }
];

export const INITIAL_HALL_CANDIDATES: DriveHallCandidate[] = [
  {
    id: 'hc-1',
    studentId: 'usr-1',
    name: 'Aarav Sharma',
    rollNo: '22CS089',
    branch: 'CSE',
    cgpa: 8.92,
    tokenNumber: 'B-15',
    stage: 'TECH_ROUND_1',
    checkInTime: '08:45 AM',
    passportHash: '0x8f2c31e9a',
    isVerified: true,
    score: 91
  },
  {
    id: 'hc-2',
    studentId: 'usr-2',
    name: 'Diya Patel',
    rollNo: '22CS104',
    branch: 'CSE',
    cgpa: 9.15,
    tokenNumber: 'B-16',
    stage: 'TECH_ROUND_1',
    checkInTime: '08:50 AM',
    passportHash: '0x3a4b9c1d',
    isVerified: true,
    score: 95
  },
  {
    id: 'hc-3',
    studentId: 'usr-3',
    name: 'Rohan Verma',
    rollNo: '22IT045',
    branch: 'IT',
    cgpa: 8.65,
    tokenNumber: 'B-17',
    stage: 'TECH_ROUND_1',
    checkInTime: '08:52 AM',
    passportHash: '0x99a1b2c3',
    isVerified: true,
    score: 87
  },
  {
    id: 'hc-4',
    studentId: 'usr-4',
    name: 'Current User (You)',
    rollNo: '22CS021',
    branch: 'CSE',
    cgpa: 8.78,
    tokenNumber: 'B-18',
    stage: 'TECH_ROUND_1',
    checkInTime: '09:00 AM',
    passportHash: '0x44dd88aa',
    isVerified: true,
    score: 88
  },
  {
    id: 'hc-5',
    studentId: 'usr-5',
    name: 'Sneha Rao',
    rollNo: '22EC012',
    branch: 'ECE',
    cgpa: 8.40,
    tokenNumber: 'B-19',
    stage: 'APTITUDE_TEST',
    checkInTime: '09:05 AM',
    passportHash: '0x77ee11bb',
    isVerified: true,
    score: 82
  }
];
