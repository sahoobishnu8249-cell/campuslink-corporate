import { 
  CollegeRoom, 
  AcademicSchedule, 
  PlacementDriveAllocation, 
  AdministrationAlert, 
  RoomAllocationStats,
  ConflictResolutionAction
} from '../src/types/index.ts';
import { generateObjectId } from './db.ts';

// -------------------------------------------------------------
// SEED DATA: CAMPUS ROOM INVENTORY
// -------------------------------------------------------------
export const initialCollegeRooms: CollegeRoom[] = [
  {
    id: 'room_sh1',
    code: 'SH-101',
    name: 'Seminar Hall 1',
    block: 'Block B - APJ Abdul Kalam Wing',
    floor: '1st Floor',
    capacity: 150,
    type: 'Seminar Hall',
    facilities: ['Dual Laser Projectors', 'Surround Sound System', 'Central AC', 'High-Speed WiFi', 'Podium Mic', 'CCTV'],
    isActive: true
  },
  {
    id: 'room_sh2',
    code: 'SH-201',
    name: 'Seminar Hall 2',
    block: 'Block A - Ramanujan Wing',
    floor: '2nd Floor',
    capacity: 120,
    type: 'Seminar Hall',
    facilities: ['4K Smart Interactive Board', 'AC', 'Wireless Mics', 'LAN Ports', 'Live Streaming Setup'],
    isActive: true
  },
  {
    id: 'room_audi',
    code: 'AUD-MAIN',
    name: 'Main University Auditorium',
    block: 'Central Administrative Complex',
    floor: 'Ground Floor',
    capacity: 500,
    type: 'Auditorium',
    facilities: ['Grand Stage & Lighting', 'Acoustic Wall Panels', 'Dual Projection', 'Central AC', 'Green Rooms', 'VIP Lounge'],
    isActive: true
  },
  {
    id: 'room_cslab1',
    code: 'CS-LAB1',
    name: 'Turing Computing Complex (Lab 1)',
    block: 'Central IT Block',
    floor: '2nd Floor',
    capacity: 90,
    type: 'Computer Lab',
    facilities: ['90 i7 Workstations', 'Dedicated Gigabit LAN', 'Online Exam Server', 'Dual AC', 'UPS Backup (4 Hrs)'],
    isActive: true
  },
  {
    id: 'room_cslab2',
    code: 'CS-LAB2',
    name: 'Lovelace Computing Complex (Lab 2)',
    block: 'Central IT Block',
    floor: '3rd Floor',
    capacity: 75,
    type: 'Computer Lab',
    facilities: ['75 Workstations', 'Secure Browser Lockdown', 'Audio Headsets', 'AC', 'Power Backup'],
    isActive: true
  },
  {
    id: 'room_lh204',
    code: 'LH-204',
    name: 'APJ Kalam Lecture Hall 204',
    block: 'Science & Engineering Block',
    floor: '2nd Floor',
    capacity: 80,
    type: 'Classroom',
    facilities: ['Tiered Gallery Seating', 'Ultra-HD Projector', 'Whiteboard', 'Air Conditioning', 'WiFi 6'],
    isActive: true
  },
  {
    id: 'room_lh101',
    code: 'LH-101',
    name: 'Ramanujan Lecture Hall 101',
    block: 'Block A - Ramanujan Wing',
    floor: 'Ground Floor',
    capacity: 90,
    type: 'Classroom',
    facilities: ['Tiered Seating', 'Digital Smart Screen', 'Sound System', 'AC'],
    isActive: true
  },
  {
    id: 'room_conf_tpo',
    code: 'TPO-CONF',
    name: 'Corporate Placement Suite & GD Room',
    block: 'Training & Placement Block',
    floor: '1st Floor',
    capacity: 40,
    type: 'Conference Room',
    facilities: ['Roundtable GD Setup', 'Video Conferencing Suite', 'Individual Interview Cabins', 'Executive AC'],
    isActive: true
  }
];

// Today's date helper
const TODAY = '2026-09-30';
const TOMORROW = '2026-10-01';

// -------------------------------------------------------------
// SEED DATA: UNIVERSITY ACADEMIC SCHEDULES (Classes, Exams, Labs)
// -------------------------------------------------------------
export const initialAcademicSchedules: AcademicSchedule[] = [
  {
    id: 'acad_1',
    code: 'CS301',
    title: 'CS301 - Distributed Systems (B.Tech 3rd Yr)',
    type: 'Class',
    roomId: 'room_sh1',
    roomName: 'Seminar Hall 1',
    instructor: 'Dr. V. Swaminathan (Dept of CSE)',
    department: 'Computer Science & Engineering',
    date: TODAY,
    startTime: '10:00',
    endTime: '11:30',
    registeredCount: 85,
    status: 'SCHEDULED'
  },
  {
    id: 'acad_2',
    code: 'EC402',
    title: 'EC402 - Digital Signal Processing',
    type: 'Class',
    roomId: 'room_lh101',
    roomName: 'Ramanujan Lecture Hall 101',
    instructor: 'Prof. Ananya Sen (Dept of ECE)',
    department: 'Electronics & Communication',
    date: TODAY,
    startTime: '11:00',
    endTime: '12:30',
    registeredCount: 70,
    status: 'SCHEDULED'
  },
  {
    id: 'acad_3',
    code: 'CS204-LAB',
    title: 'CS204 - Advanced Data Structures Laboratory',
    type: 'Laboratory',
    roomId: 'room_cslab1',
    roomName: 'Turing Computing Complex (Lab 1)',
    instructor: 'Prof. Rajeshwar Rao',
    department: 'Computer Science & Engineering',
    date: TODAY,
    startTime: '14:00',
    endTime: '16:30',
    registeredCount: 65,
    status: 'SCHEDULED'
  },
  {
    id: 'acad_4',
    code: 'EXAM-M3',
    title: 'University Mid-Term: Engineering Mathematics III',
    type: 'Examination',
    roomId: 'room_lh204',
    roomName: 'APJ Kalam Lecture Hall 204',
    instructor: 'Dean of Academic Examinations',
    department: 'All Engineering Disciplines',
    date: TODAY,
    startTime: '09:00',
    endTime: '11:00',
    registeredCount: 75,
    status: 'SCHEDULED'
  },
  {
    id: 'acad_5',
    code: 'AI-WORKSHOP',
    title: 'National AI & Cloud Robotics Hands-on Workshop',
    type: 'Workshop',
    roomId: 'room_cslab2',
    roomName: 'Lovelace Computing Complex (Lab 2)',
    instructor: 'Guest Faculty: Dr. Arvind Patel (Industry Fellow)',
    department: 'Innovation & Research Cell',
    date: TOMORROW,
    startTime: '10:00',
    endTime: '13:00',
    registeredCount: 60,
    status: 'SCHEDULED'
  }
];

// -------------------------------------------------------------
// SEED DATA: INITIAL PLACEMENT ALLOCATIONS
// -------------------------------------------------------------
export const initialPlacementAllocations: PlacementDriveAllocation[] = [
  {
    id: 'alloc_tcs_01',
    companyId: 'comp_tcs',
    companyName: 'Tata Consultancy Services (TCS)',
    jobId: 'job_tcs_digital',
    jobTitle: 'Digital Systems Engineer & Prime Analyst',
    driveRound: 'Online Aptitude & Technical Coding Assessment',
    date: TODAY,
    startTime: '10:00',
    endTime: '13:00',
    reportingTime: '09:30 AM (30 mins before start)',
    registeredStudentsCount: 130,
    requiredCapacity: 130,
    allocatedRoomId: 'room_sh1',
    allocatedRoomName: 'Seminar Hall 1',
    allocatedRoomCapacity: 150,
    allocatedRoomBlock: 'Block B - APJ Abdul Kalam Wing (1st Floor)',
    registeredStudentIds: ['user_student_1', 'user_student_2', 'user_student_4', 'user_student_5'],
    conflictStatus: 'CONFLICT_DETECTED',
    conflictDetails: {
      conflictType: 'CLASS_SCHEDULE',
      conflictingEntityId: 'acad_1',
      conflictingEntityTitle: 'CS301 - Distributed Systems (B.Tech 3rd Yr)',
      instructor: 'Dr. V. Swaminathan (Dept of CSE)',
      roomName: 'Seminar Hall 1',
      timeSlot: '10:00 - 11:30',
      detectedAt: new Date().toISOString()
    },
    allocationStatus: 'CONFLICT',
    notificationStatus: 'NOT_SENT',
    notificationsSentCount: 0,
    importantInstructions: 'Mandatory physical college ID card, 2 copies of verified ATS resume, college formal uniform. Laptops required with charging adapters for coding section.',
    createdAt: '2026-09-28T09:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'alloc_google_01',
    companyId: 'comp_google',
    companyName: 'Google',
    jobId: 'job_google_swe',
    jobTitle: 'Software Development Engineer - Campus Graduate',
    driveRound: 'Pre-Placement Talk (PPT) & Core Problem Solving Round',
    date: TODAY,
    startTime: '10:00',
    endTime: '13:30',
    reportingTime: '09:30 AM (30 mins before start)',
    registeredStudentsCount: 65,
    requiredCapacity: 70,
    allocatedRoomId: 'room_sh2',
    allocatedRoomName: 'Seminar Hall 2',
    allocatedRoomCapacity: 120,
    allocatedRoomBlock: 'Block A - Ramanujan Wing (2nd Floor)',
    registeredStudentIds: ['user_student_1', 'user_student_3'],
    conflictStatus: 'NO_CONFLICT',
    allocationStatus: 'CONFIRMED',
    notificationStatus: 'SENT',
    notificationsSentCount: 65,
    lastNotifiedAt: '2026-09-29T16:00:00Z',
    importantInstructions: 'Bring Google shortlisting confirmation barcode, valid government ID proof, and updated GitHub repository portfolio links.',
    createdAt: '2026-09-27T11:00:00Z',
    updatedAt: '2026-09-29T16:00:00Z'
  },
  {
    id: 'alloc_infosys_01',
    companyId: 'comp_infosys',
    companyName: 'Infosys',
    jobId: 'job_infosys_sp',
    jobTitle: 'Specialist Programmer (SP) & Digital Specialist Engineer',
    driveRound: 'Pre-Placement Talk & Technical Elimination Test',
    date: TODAY,
    startTime: '14:00',
    endTime: '17:00',
    reportingTime: '01:30 PM (30 mins before start)',
    registeredStudentsCount: 110,
    requiredCapacity: 110,
    allocatedRoomId: 'room_sh1',
    allocatedRoomName: 'Seminar Hall 1',
    allocatedRoomCapacity: 150,
    allocatedRoomBlock: 'Block B - APJ Abdul Kalam Wing (1st Floor)',
    registeredStudentIds: ['user_student_2', 'user_student_4', 'user_student_5'],
    conflictStatus: 'NO_CONFLICT',
    allocationStatus: 'CONFIRMED',
    notificationStatus: 'SENT',
    notificationsSentCount: 110,
    lastNotifiedAt: '2026-09-29T17:30:00Z',
    importantInstructions: 'Students must carry college ID card, blue/black ballpoint pens, and 2 passport size photographs.',
    createdAt: '2026-09-28T14:00:00Z',
    updatedAt: '2026-09-29T17:30:00Z'
  },
  {
    id: 'alloc_microsoft_01',
    companyId: 'comp_microsoft',
    companyName: 'Microsoft',
    jobId: 'job_ms_sde',
    jobTitle: 'Software Engineer - Azure Core & Cloud AI',
    driveRound: 'Online Hands-on Systems & Algorithmic Hackathon',
    date: TOMORROW,
    startTime: '09:30',
    endTime: '13:00',
    reportingTime: '09:00 AM (30 mins before start)',
    registeredStudentsCount: 80,
    requiredCapacity: 80,
    allocatedRoomId: 'room_cslab1',
    allocatedRoomName: 'Turing Computing Complex (Lab 1)',
    allocatedRoomCapacity: 90,
    allocatedRoomBlock: 'Central IT Block (2nd Floor)',
    registeredStudentIds: ['user_student_1', 'user_student_3'],
    conflictStatus: 'NO_CONFLICT',
    allocationStatus: 'ALLOCATED',
    notificationStatus: 'NOT_SENT',
    notificationsSentCount: 0,
    importantInstructions: 'High-speed LAN stations will be provided. Please keep your HackerRank/Codility credentials logged in with 2FA enabled.',
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'alloc_amazon_01',
    companyId: 'comp_amazon',
    companyName: 'Amazon',
    jobId: 'job_amazon_sde1',
    jobTitle: 'SDE-1 (AWS Distributed Systems)',
    driveRound: 'AWS Systems Architecture & Coding Assessment',
    date: TOMORROW,
    startTime: '10:00',
    endTime: '13:30',
    reportingTime: '09:30 AM (30 mins before start)',
    registeredStudentsCount: 85,
    requiredCapacity: 85,
    registeredStudentIds: ['user_student_1', 'user_student_2', 'user_student_3'],
    conflictStatus: 'NO_CONFLICT',
    allocationStatus: 'PENDING',
    notificationStatus: 'NOT_SENT',
    notificationsSentCount: 0,
    importantInstructions: 'Carry 2 copies of verified resume with ATS score >= 80%. Laptops allowed for technical whiteboard phase.',
    createdAt: '2026-09-29T15:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

// -------------------------------------------------------------
// SEED DATA: ADMINISTRATION ALERTS
// -------------------------------------------------------------
export const initialAdminAlerts: AdministrationAlert[] = [
  {
    id: 'alert_tcs_sh1_01',
    allocationId: 'alloc_tcs_01',
    companyName: 'Tata Consultancy Services (TCS)',
    roomId: 'room_sh1',
    roomName: 'Seminar Hall 1',
    date: TODAY,
    timeSlot: '10:00 - 13:00',
    conflictType: 'CLASS_SCHEDULE',
    conflictingScheduleId: 'acad_1',
    conflictingScheduleTitle: 'CS301 - Distributed Systems (B.Tech 3rd Yr)',
    conflictingInstructor: 'Dr. V. Swaminathan (Dept of CSE)',
    alertMessage: 'Room Conflict Detected: Seminar Hall 1 is allocated for TCS placement at 10:00 AM, but a class is scheduled in the same room. Please change the classroom or reschedule the placement activity.',
    status: 'ACTIVE',
    createdAt: '2026-09-30T08:30:00Z'
  }
];

// -------------------------------------------------------------
// UTILITY FUNCTIONS FOR SMART ALLOCATION & CONFLICT DETECTION
// -------------------------------------------------------------

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export function isTimeOverlapping(
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

export interface ConflictCheckResultDetailed {
  hasConflict: boolean;
  conflictType?: 'CLASS_SCHEDULE' | 'EXAMINATION' | 'WORKSHOP' | 'OVERLAPPING_PLACEMENT';
  conflictingEntityId?: string;
  conflictingEntityTitle?: string;
  instructor?: string;
  roomName?: string;
  timeSlot?: string;
  message?: string;
}

export function detectRoomConflicts(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  currentAllocationId: string | undefined,
  rooms: CollegeRoom[],
  schedules: AcademicSchedule[],
  allocations: PlacementDriveAllocation[]
): ConflictCheckResultDetailed {
  const targetRoom = rooms.find(r => r.id === roomId);
  const roomName = targetRoom ? targetRoom.name : 'Unknown Room';

  // 1. Check Academic Schedules (Regular Class, Exam, Workshop)
  const conflictingSchedule = schedules.find(s => 
    s.roomId === roomId &&
    s.date === date &&
    s.status !== 'MOVED' &&
    s.status !== 'CANCELLED' &&
    isTimeOverlapping(startTime, endTime, s.startTime, s.endTime)
  );

  if (conflictingSchedule) {
    let type: 'CLASS_SCHEDULE' | 'EXAMINATION' | 'WORKSHOP' = 'CLASS_SCHEDULE';
    if (conflictingSchedule.type === 'Examination') type = 'EXAMINATION';
    else if (conflictingSchedule.type === 'Workshop') type = 'WORKSHOP';

    const entityLabel = conflictingSchedule.type === 'Examination' ? 'an examination' : conflictingSchedule.type === 'Workshop' ? 'a workshop' : 'a class';

    return {
      hasConflict: true,
      conflictType: type,
      conflictingEntityId: conflictingSchedule.id,
      conflictingEntityTitle: conflictingSchedule.title,
      instructor: conflictingSchedule.instructor,
      roomName,
      timeSlot: `${conflictingSchedule.startTime} - ${conflictingSchedule.endTime}`,
      message: `Room Conflict Detected: ${roomName} is allocated for placement at ${startTime}, but ${entityLabel} (${conflictingSchedule.title}) is scheduled in the same room from ${conflictingSchedule.startTime} to ${conflictingSchedule.endTime}. Please change the classroom or reschedule the placement activity.`
    };
  }

  // 2. Check Overlapping Company Placement Drives
  const conflictingPlacement = allocations.find(a => 
    a.id !== currentAllocationId &&
    a.allocatedRoomId === roomId &&
    a.date === date &&
    a.allocationStatus !== 'CANCELLED' &&
    isTimeOverlapping(startTime, endTime, a.startTime, a.endTime)
  );

  if (conflictingPlacement) {
    return {
      hasConflict: true,
      conflictType: 'OVERLAPPING_PLACEMENT',
      conflictingEntityId: conflictingPlacement.id,
      conflictingEntityTitle: `${conflictingPlacement.companyName} (${conflictingPlacement.driveRound})`,
      roomName,
      timeSlot: `${conflictingPlacement.startTime} - ${conflictingPlacement.endTime}`,
      message: `Room Collision Detected: ${roomName} is already booked for ${conflictingPlacement.companyName} placement drive from ${conflictingPlacement.startTime} to ${conflictingPlacement.endTime}. Multiple companies cannot use the same room simultaneously.`
    };
  }

  return { hasConflict: false };
}

/**
 * Intelligent Room Suggestion Engine:
 * Suggests the best-fit college rooms based on:
 * - Room capacity >= required students
 * - Zero time-slot collision with other visiting companies
 * - Zero conflict with university classes / exams
 * - Best capacity utilization ratio (closest fit without wastage)
 */
export function suggestSuitableRooms(
  date: string,
  startTime: string,
  endTime: string,
  requiredCapacity: number,
  rooms: CollegeRoom[],
  schedules: AcademicSchedule[],
  allocations: PlacementDriveAllocation[],
  currentAllocationId?: string
): Array<{
  room: CollegeRoom;
  hasConflict: boolean;
  conflictDetails?: ConflictCheckResultDetailed;
  fitScore: number; // 0-100 score based on capacity efficiency & facilities
  recommendationReason: string;
}> {
  const eligibleRooms = rooms.filter(r => r.isActive && r.capacity >= requiredCapacity);

  const results = eligibleRooms.map(room => {
    const conflict = detectRoomConflicts(
      room.id,
      date,
      startTime,
      endTime,
      currentAllocationId,
      rooms,
      schedules,
      allocations
    );

    // Calculate capacity fit: ideal is 80-100% capacity utilization
    const utilization = requiredCapacity / room.capacity;
    let fitScore = Math.round(utilization * 100);
    if (!conflict.hasConflict) fitScore += 100; // prioritize non-conflicting rooms

    let reason = '';
    if (!conflict.hasConflict) {
      reason = `Available & Optimal Fit: Capacity ${room.capacity} fits ${requiredCapacity} students (${Math.round(utilization * 100)}% utilization) with zero academic or placement collisions.`;
    } else {
      reason = `Conflict Warning: ${conflict.message}`;
    }

    return {
      room,
      hasConflict: conflict.hasConflict,
      conflictDetails: conflict.hasConflict ? conflict : undefined,
      fitScore,
      recommendationReason: reason
    };
  });

  // Sort: non-conflicting first, then closest capacity fit
  return results.sort((a, b) => b.fitScore - a.fitScore);
}
