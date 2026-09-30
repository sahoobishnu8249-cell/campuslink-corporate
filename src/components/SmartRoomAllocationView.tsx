import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  Building2, 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  RefreshCw, 
  Plus, 
  Filter, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  X, 
  MapPin, 
  FileText, 
  Laptop, 
  Wifi, 
  Tv, 
  Layers, 
  ArrowRight, 
  AlertCircle,
  Eye,
  Trash2,
  Edit3,
  Bell,
  ChevronRight,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { 
  CollegeRoom, 
  AcademicSchedule, 
  PlacementDriveAllocation, 
  AdministrationAlert, 
  RoomAllocationStats,
  ConflictResolutionAction,
  User,
  StudentProfile
} from '../types/index.ts';
import { api } from '../services/api.ts';

interface SmartRoomAllocationViewProps {
  currentUser: User | null;
  activeStudent?: StudentProfile;
  onNavigateTab?: (tab: any) => void;
}

export const SmartRoomAllocationView: React.FC<SmartRoomAllocationViewProps> = ({
  currentUser,
  activeStudent,
  onNavigateTab
}) => {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'allocations' | 'inventory' | 'academic' | 'alerts' | 'notifications'>('allocations');

  // Main Data States
  const [rooms, setRooms] = useState<CollegeRoom[]>([]);
  const [schedules, setSchedules] = useState<AcademicSchedule[]>([]);
  const [allocations, setAllocations] = useState<PlacementDriveAllocation[]>([]);
  const [alerts, setAlerts] = useState<AdministrationAlert[]>([]);
  const [stats, setStats] = useState<RoomAllocationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConflict, setFilterConflict] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('2026-09-30');

  // Modal States
  const [showAddAllocationModal, setShowAddAllocationModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [selectedAllocationForNotify, setSelectedAllocationForNotify] = useState<PlacementDriveAllocation | null>(null);
  const [activeResolutionAlert, setActiveResolutionAlert] = useState<AdministrationAlert | null>(null);
  const [resolutionAction, setResolutionAction] = useState<ConflictResolutionAction>('CHANGE_CLASSROOM');
  const [selectedAlternateRoomId, setSelectedAlternateRoomId] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState({ startTime: '14:00', endTime: '15:30' });
  const [isProcessingResolution, setIsProcessingResolution] = useState(false);
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);
  const [isNotifyingStudents, setIsNotifyingStudents] = useState(false);
  const [notificationSuccessMsg, setNotificationSuccessMsg] = useState<string | null>(null);

  // New Placement Allocation Form State
  const [newAllocForm, setNewAllocForm] = useState({
    companyName: 'TCS',
    jobTitle: 'Digital Systems Engineer & Prime Analyst',
    driveRound: 'Online Aptitude & Technical Coding Assessment',
    date: '2026-09-30',
    startTime: '10:00',
    endTime: '13:00',
    reportingTime: '09:30 AM (30 mins before start)',
    registeredStudentsCount: 130,
    requiredCapacity: 130,
    allocatedRoomId: 'room_sh1',
    importantInstructions: 'Mandatory physical college ID card, 2 copies of verified ATS resume, college formal uniform. Laptops required with charging adapters.'
  });

  // Room Suggestion State for New Form
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Load all initial data from backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedRooms, fetchedSchedules, fetchedAllocations, fetchedAlerts, fetchedStats] = await Promise.all([
        api.getCollegeRooms(),
        api.getAcademicSchedules(),
        api.getPlacementAllocations(),
        api.getAdministrationAlerts(),
        api.getPlacementAllocationsStats()
      ]);

      setRooms(fetchedRooms);
      setSchedules(fetchedSchedules);
      setAllocations(fetchedAllocations);
      setAlerts(fetchedAlerts);
      setStats(fetchedStats);
    } catch (err) {
      console.error('Failed to load room allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update room suggestions whenever time, date or required students change in modal
  useEffect(() => {
    if (showAddAllocationModal) {
      fetchSuggestions(
        newAllocForm.date,
        newAllocForm.startTime,
        newAllocForm.endTime,
        newAllocForm.requiredCapacity
      );
    }
  }, [showAddAllocationModal, newAllocForm.date, newAllocForm.startTime, newAllocForm.endTime, newAllocForm.requiredCapacity]);

  const fetchSuggestions = async (date: string, startTime: string, endTime: string, capacity: number) => {
    setLoadingSuggestions(true);
    try {
      const results = await api.suggestRoomsForAllocation({
        date,
        startTime,
        endTime,
        requiredCapacity: capacity
      });
      setLiveSuggestions(results);
      if (results.length > 0 && !newAllocForm.allocatedRoomId) {
        setNewAllocForm(prev => ({ ...prev, allocatedRoomId: results[0].room.id }));
      }
    } catch (e) {
      console.warn('Could not fetch suggestions:', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 1-Click Auto-Allocate Handler
  const handleAutoAllocate = async () => {
    setIsAutoAllocating(true);
    try {
      const res = await api.autoAllocateAllPendingDrives();
      alert(res.message);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Auto-allocation failed');
    } finally {
      setIsAutoAllocating(false);
    }
  };

  // Create Placement Allocation Handler
  const handleCreateAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoom = rooms.find(r => r.id === newAllocForm.allocatedRoomId);
      const res = await api.createPlacementAllocation({
        ...newAllocForm,
        allocatedRoomName: selectedRoom?.name,
        allocatedRoomCapacity: selectedRoom?.capacity,
        allocatedRoomBlock: selectedRoom ? `${selectedRoom.block} (${selectedRoom.floor})` : undefined
      });

      setShowAddAllocationModal(false);
      await loadData();

      if (res.hasConflict && res.alert) {
        alert(`⚠️ Room Conflict Detected!\n${res.alert.alertMessage}`);
        setActiveResolutionAlert(res.alert);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create room allocation');
    }
  };

  // Conflict Resolution Handler
  const handleResolveConflictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResolutionAlert) return;

    setIsProcessingResolution(true);
    try {
      const res = await api.resolveAdministrationConflict(
        activeResolutionAlert.id,
        resolutionAction,
        {
          alternateRoomId: selectedAlternateRoomId,
          newTimeSlot: resolutionAction === 'RESCHEDULE_CLASS' ? rescheduleSlot : undefined,
          resolvedBy: currentUser?.name || 'Placement Officer'
        }
      );

      alert(`✓ ${res.message}`);
      setActiveResolutionAlert(null);
      setSelectedAlternateRoomId('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve conflict');
    } finally {
      setIsProcessingResolution(false);
    }
  };

  // Confirm Allocation & Notify Registered Students Handler
  const handleConfirmAndNotify = async (allocation: PlacementDriveAllocation) => {
    setIsNotifyingStudents(true);
    setNotificationSuccessMsg(null);
    try {
      const res = await api.confirmAllocationAndNotifyStudents(
        allocation.id,
        allocation.importantInstructions
      );

      setNotificationSuccessMsg(
        `✓ Room confirmed! Dispatched targeted room allotment notification to ${res.notifiedCount} registered students.`
      );
      setSelectedAllocationForNotify(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to send room notifications');
    } finally {
      setIsNotifyingStudents(false);
    }
  };

  // Filter allocations
  const filteredAllocations = allocations.filter(alloc => {
    const matchesSearch = 
      alloc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alloc.allocatedRoomName && alloc.allocatedRoomName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      alloc.driveRound.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterConflict === 'CONFLICT' && alloc.conflictStatus !== 'CONFLICT_DETECTED') return false;
    if (filterConflict === 'NO_CONFLICT' && alloc.conflictStatus !== 'NO_CONFLICT') return false;
    if (filterConflict === 'RESOLVED' && alloc.conflictStatus !== 'CONFLICT_RESOLVED') return false;
    if (filterDate && alloc.date !== filterDate) return false;

    return true;
  });

  const activeConflictsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Smart Placement Room Allocation & Notification Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Zero Double-Booking Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automated collision detection, academic schedule conflict resolution, and targeted multi-company student notifications.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleAutoAllocate}
            disabled={isAutoAllocating}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
          >
            {isAutoAllocating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Smart Auto-Allocate (1-Click)</span>
          </button>

          <button
            onClick={() => setShowAddAllocationModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Company Slot</span>
          </button>
        </div>
      </div>

      {/* ACTIVE CONFLICT BANNER ALERT (Prominent per user instructions) */}
      {activeConflictsCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  Administration Alert: {activeConflictsCount} Room Schedule Conflict Detected!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-1 max-w-2xl leading-relaxed">
                {alerts.find(a => a.status === 'ACTIVE')?.alertMessage || 
                  'A placement drive conflicts with a regular university class or another company. Resolve to avoid venue collision.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const firstActive = alerts.find(a => a.status === 'ACTIVE');
                if (firstActive) setActiveResolutionAlert(firstActive);
                else setActiveSubTab('alerts');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Resolve Conflict Now →</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP KPI STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Campus Rooms</div>
          <div className="text-xl font-black text-slate-900 font-mono">{stats?.totalRooms || rooms.length}</div>
          <span className="text-[10px] text-slate-500">{stats?.totalCapacity || 1150} Total Seats</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Placement Drives</div>
          <div className="text-xl font-black text-indigo-600 font-mono">{stats?.activeAllocations || allocations.length}</div>
          <span className="text-[10px] text-indigo-600 font-semibold">{allocations.filter(a => a.date === '2026-09-30').length} Visiting Today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirmed Slots</div>
          <div className="text-xl font-black text-emerald-600 font-mono">{stats?.confirmedAllocations || 2}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Zero Collision</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Class Conflicts</div>
          <div className={`text-xl font-black font-mono ${activeConflictsCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
            {activeConflictsCount}
          </div>
          <span className={`text-[10px] font-semibold ${activeConflictsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {activeConflictsCount > 0 ? 'Urgent Triage' : 'All Clear'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Notifications Sent</div>
          <div className="text-xl font-black text-purple-600 font-mono">{stats?.notificationsSentTotal || 175}</div>
          <span className="text-[10px] text-purple-700 font-semibold">Only to Registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Students</div>
          <div className="text-xl font-black text-slate-900 font-mono">{stats?.studentsAccommodatedToday || 305}</div>
          <span className="text-[10px] text-slate-500">Accommodated</span>
        </div>
      </div>

      {/* NAVIGATION SUB-TABS BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        {[
          { id: 'allocations', label: 'Room Allocations (Main Dashboard)', icon: DoorOpen },
          { id: 'inventory', label: 'Campus Room Inventory', icon: Building2 },
          { id: 'academic', label: 'Academic Timetable & Classes', icon: BookOpen },
          { 
            id: 'alerts', 
            label: `Administration Alerts (${activeConflictsCount})`, 
            icon: ShieldAlert, 
            badge: activeConflictsCount > 0 ? 'ALERT' : undefined,
            badgeClass: 'bg-rose-100 text-rose-700 font-black' 
          },
          { id: 'notifications', label: 'Student Notification Logs', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${tab.badgeClass}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {notificationSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setNotificationSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 1: ROOM ALLOCATION DASHBOARD (CENTRALIZED VIEW)        */}
      {/* ============================================================= */}
      {activeSubTab === 'allocations' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search company, room, round..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-400"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Date:</span>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="2026-09-30">Today (30 Sep 2026)</option>
                  <option value="2026-10-01">Tomorrow (01 Oct 2026)</option>
                  <option value="">All Dates</option>
                </select>
              </div>

              {/* Conflict Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={filterConflict}
                  onChange={(e) => setFilterConflict(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Allocations</option>
                  <option value="CONFLICT">Conflicts Only ⚠️</option>
                  <option value="NO_CONFLICT">No Conflicts ✓</option>
                  <option value="RESOLVED">Resolved Conflicts</option>
                </select>
              </div>
            </div>

            <div className="text-slate-500 text-xs self-end md:self-auto font-medium">
              Showing <strong className="text-slate-800">{filteredAllocations.length}</strong> company schedules
            </div>
          </div>

          {/* ALLOCATIONS CARDS / TABLE */}
          <div className="space-y-3">
            {filteredAllocations.map((alloc) => {
              const hasConflict = alloc.conflictStatus === 'CONFLICT_DETECTED';
              const isResolved = alloc.conflictStatus === 'CONFLICT_RESOLVED';
              const isNotified = alloc.notificationStatus === 'SENT' || alloc.notificationStatus === 'UPDATED';

              return (
                <div
                  key={alloc.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs space-y-4 ${
                    hasConflict 
                      ? 'border-rose-300 bg-rose-50/10 hover:border-rose-400' 
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Company & Round Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                        {alloc.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{alloc.companyName}</h3>
                          <span className="text-[11px] font-mono text-slate-500">· {alloc.jobTitle}</span>
                        </div>
                        <p className="text-xs text-indigo-700 font-bold mt-0.5">{alloc.driveRound}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {alloc.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {alloc.startTime} - {alloc.endTime}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-amber-700 font-semibold">Report: {alloc.reportingTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Venue & Capacity Info */}
                    <div className="flex flex-wrap items-center gap-4 lg:text-right">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 min-w-[200px]">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Allocated Room</div>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center lg:justify-end gap-1.5 mt-0.5">
                          <DoorOpen className="w-4 h-4 text-indigo-600" />
                          <span>{alloc.allocatedRoomName || 'Pending Allocation'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {alloc.allocatedRoomBlock || 'Room not yet assigned'}
                        </p>
                      </div>

                      {/* Capacity ratio */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 min-w-[170px]">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Students vs Capacity</div>
                        <div className="font-black text-slate-900 text-sm mt-0.5">
                          {alloc.registeredStudentsCount} <span className="text-xs font-normal text-slate-400">/ {alloc.allocatedRoomCapacity || alloc.requiredCapacity} Seats</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full ${
                              (alloc.registeredStudentsCount / (alloc.allocatedRoomCapacity || 1)) > 1 
                                ? 'bg-rose-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, Math.round((alloc.registeredStudentsCount / (alloc.allocatedRoomCapacity || alloc.requiredCapacity || 100)) * 100))}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONFLICT WARNING BANNER (If conflict detected) */}
                  {hasConflict && alloc.conflictDetails && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-rose-950 block">
                            Room Conflict Detected: {alloc.allocatedRoomName} is allocated for {alloc.companyName} at {alloc.startTime}, but a class ({alloc.conflictDetails.conflictingEntityTitle}) is scheduled in the same room.
                          </span>
                          <span className="text-[11px] text-rose-800">
                            Instructor: {alloc.conflictDetails.instructor || 'Faculty'} · Time Slot: {alloc.conflictDetails.timeSlot}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const alertItem = alerts.find(a => a.allocationId === alloc.id && a.status === 'ACTIVE');
                          if (alertItem) {
                            setActiveResolutionAlert(alertItem);
                          } else {
                            setActiveResolutionAlert({
                              id: `alert_auto_${alloc.id}`,
                              allocationId: alloc.id,
                              companyName: alloc.companyName,
                              roomId: alloc.allocatedRoomId || 'room_sh1',
                              roomName: alloc.allocatedRoomName || 'Hall',
                              date: alloc.date,
                              timeSlot: `${alloc.startTime} - ${alloc.endTime}`,
                              conflictType: 'CLASS_SCHEDULE',
                              conflictingScheduleId: alloc.conflictDetails?.conflictingEntityId || 'sched_conflict',
                              conflictingScheduleTitle: alloc.conflictDetails?.conflictingEntityTitle || 'Scheduled Class / Exam',
                              conflictingInstructor: alloc.conflictDetails?.instructor,
                              alertMessage: `Room Conflict Detected: ${alloc.allocatedRoomName} is allocated for ${alloc.companyName} placement at ${alloc.startTime}, but a class is scheduled in the same room. Please change the classroom or reschedule the placement activity.`,
                              status: 'ACTIVE',
                              createdAt: new Date().toISOString()
                            });
                          }
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs text-xs shrink-0 flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Resolve Conflict</span>
                      </button>
                    </div>
                  )}

                  {/* BOTTOM STATUS & ACTIONS ROW */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Class Conflict Status */}
                      {hasConflict ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          Class Conflict Detected
                        </span>
                      ) : isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Conflict Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Zero Conflict (Clear)
                        </span>
                      )}

                      {/* Notification Status */}
                      {isNotified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          <Send className="w-3 h-3" />
                          Notified ({alloc.notificationsSentCount} Students)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3 h-3" />
                          Notification Pending
                        </span>
                      )}

                      {/* Confirmation status */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        alloc.allocationStatus === 'CONFIRMED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : alloc.allocationStatus === 'CONFLICT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {alloc.allocationStatus}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Confirm & Send Notification Button */}
                      <button
                        onClick={() => setSelectedAllocationForNotify(alloc)}
                        disabled={hasConflict}
                        title={hasConflict ? 'Resolve conflict before notifying students' : 'Send room allotment notification to registered students'}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          hasConflict
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isNotified
                              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isNotified ? 'Resend / Update' : 'Confirm & Notify Students'}</span>
                      </button>

                      {/* Quick delete */}
                      <button
                        onClick={async () => {
                          if (confirm(`Remove allocation for ${alloc.companyName}?`)) {
                            await api.deletePlacementAllocation(alloc.id);
                            await loadData();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 2: CAMPUS ROOM INVENTORY (ROOMS, CAPACITIES, AMENITIES)*/}
      {/* ============================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Campus Room & Hall Directory</h3>
              <p className="text-xs text-slate-500">Live inventory of seminar halls, auditoriums, lecture halls, and computing labs</p>
            </div>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Room</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => {
              const bookingsToday = allocations.filter(a => a.allocatedRoomId === room.id && a.date === '2026-09-30');
              const classesToday = schedules.filter(s => s.roomId === room.id && s.date === '2026-09-30' && s.status !== 'MOVED');

              return (
                <div key={room.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          {room.code}
                        </span>
                        <h4 className="font-black text-slate-900 text-base mt-1">{room.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{room.block} · {room.floor}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Capacity</div>
                        <div className="text-xl font-black text-slate-900 font-mono">{room.capacity}</div>
                      </div>
                    </div>

                    {/* Amenities tags */}
                    <div className="flex flex-wrap gap-1">
                      {room.facilities.map((fac, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                          {fac}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Occupancy Timeline today */}
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Today's Schedule</div>
                    
                    {bookingsToday.length === 0 && classesToday.length === 0 ? (
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                        ✓ Fully Free All Day
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {bookingsToday.map(b => (
                          <div key={b.id} className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 text-[11px] flex items-center justify-between">
                            <span className="font-extrabold text-indigo-900 truncate max-w-[150px]">{b.companyName}</span>
                            <span className="font-mono text-indigo-700 font-bold">{b.startTime} - {b.endTime}</span>
                          </div>
                        ))}
                        {classesToday.map(c => (
                          <div key={c.id} className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 text-[11px] flex items-center justify-between">
                            <span className="font-bold text-amber-950 truncate max-w-[150px]">{c.code} Class</span>
                            <span className="font-mono text-amber-800 font-semibold">{c.startTime} - {c.endTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 3: ACADEMIC TIMETABLE & REGULAR UNIVERSITY CLASSES     */}
      {/* ============================================================= */}
      {activeSubTab === 'academic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">University Academic Class & Examination Timetable</h3>
              <p className="text-xs text-slate-500">Regular classes and exams checked for potential placement collisions</p>
            </div>
            <button
              onClick={() => setShowAddScheduleModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Scheduled Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map(sched => (
              <div 
                key={sched.id} 
                className={`bg-white rounded-3xl p-5 border space-y-3 ${
                  sched.status === 'MOVED' 
                    ? 'border-indigo-200 bg-indigo-50/20' 
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {sched.code}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sched.status === 'MOVED'
                          ? 'bg-purple-100 text-purple-800'
                          : sched.status === 'RESCHEDULED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sched.status}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{sched.title}</h4>
                    <p className="text-xs text-slate-500">{sched.department} · {sched.instructor}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="font-bold text-slate-800">{sched.startTime} - {sched.endTime}</div>
                    <span className="text-slate-400 text-[10px]">{sched.date}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-800">{sched.roomName}</span>
                      {sched.originalRoomName && (
                        <span className="text-[11px] text-purple-700 block">
                          Moved from: {sched.originalRoomName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-slate-500 text-[11px]">{sched.registeredCount} Enrolled Students</span>
                </div>

                {sched.resolutionNote && (
                  <p className="text-[11px] text-purple-800 italic bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                    ℹ️ {sched.resolutionNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 4: ADMINISTRATION CONFLICT ALERTS                     */}
      {/* ============================================================= */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base">Administration Conflict Alert Center</h3>
            <p className="text-xs text-slate-500">Automated warning tickets generated when placement drives overlap with academic timetables</p>
          </div>

          {alerts.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">All Clear! No Active Conflicts</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No scheduled classes or university exams collide with existing company placement allocations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-3xl p-5 border space-y-3 ${
                    alert.status === 'ACTIVE' 
                      ? 'border-rose-300 bg-rose-50/20 shadow-xs' 
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${alert.status === 'ACTIVE' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {alert.status === 'ACTIVE' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{alert.companyName} ⚡ {alert.roomName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            alert.status === 'ACTIVE' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">{alert.date} · Slot: {alert.timeSlot}</span>
                      </div>
                    </div>

                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => setActiveResolutionAlert(alert)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Resolve Conflict</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-2xl border border-slate-200/80 leading-relaxed">
                    {alert.alertMessage}
                  </p>

                  {alert.resolutionDetails && (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900 text-xs">
                      <strong className="block mb-0.5">✓ Resolution Confirmed:</strong>
                      <span>{alert.resolutionDetails}</span>
                      <div className="text-[10px] text-emerald-700 font-mono mt-1">
                        Resolved By: {alert.resolvedBy} · {alert.resolvedAt}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* SUB-TAB 5: TARGETED NOTIFICATION HISTORY & AUDIT LOGS         */}
      {/* ============================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base">Registered Student Notification Logs</h3>
            <p className="text-xs text-slate-500">History of room allotment and venue update dispatches sent directly to registered candidate profiles</p>
          </div>

          <div className="space-y-3">
            {allocations
              .filter(a => a.notificationStatus === 'SENT' || a.notificationStatus === 'UPDATED')
              .map(alloc => (
                <div key={alloc.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          📍 Room Allotment Notification: {alloc.companyName}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Dispatched: {alloc.lastNotifiedAt || alloc.updatedAt}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                      Delivered to {alloc.notificationsSentCount} Registered Students
                    </span>
                  </div>

                  {/* Render exact notification card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-sans">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Company & Round</span>
                        <strong className="text-slate-900">{alloc.companyName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Placement Venue</span>
                        <strong className="text-indigo-600 font-bold">{alloc.allocatedRoomName} ({alloc.allocatedRoomBlock})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Date & Time</span>
                        <strong className="text-slate-900">{alloc.date} | {alloc.startTime} - {alloc.endTime}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[9px]">Reporting Time</span>
                        <strong className="text-amber-800">{alloc.reportingTime}</strong>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                      <strong>Instructions:</strong> {alloc.importantInstructions}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: ADD NEW COMPANY VISIT SLOT WITH LIVE CONFLICT CHECK  */}
      {/* ============================================================= */}
      {showAddAllocationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Schedule Visiting Company & Allot Room</h3>
                <p className="text-xs text-slate-500">System checks room capacity, college timetables, and existing bookings</p>
              </div>
              <button onClick={() => setShowAddAllocationModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAllocationSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newAllocForm.companyName}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, companyName: e.target.value })}
                    placeholder="e.g. TCS, Google, Infosys"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={newAllocForm.jobTitle}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, jobTitle: e.target.value })}
                    placeholder="e.g. SDE-1, Systems Engineer"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Drive Round</label>
                <input
                  type="text"
                  required
                  value={newAllocForm.driveRound}
                  onChange={(e) => setNewAllocForm({ ...newAllocForm, driveRound: e.target.value })}
                  placeholder="e.g. Online Assessment, Technical Interview, PPT"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newAllocForm.date}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newAllocForm.startTime}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, startTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newAllocForm.endTime}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, endTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Registered Students Count</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newAllocForm.registeredStudentsCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10) || 10;
                      setNewAllocForm({ ...newAllocForm, registeredStudentsCount: count, requiredCapacity: count });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Reporting Time</label>
                  <input
                    type="text"
                    required
                    value={newAllocForm.reportingTime}
                    onChange={(e) => setNewAllocForm({ ...newAllocForm, reportingTime: e.target.value })}
                    placeholder="e.g. 09:30 AM (30 mins before)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* LIVE SUGGESTED ROOMS SELECTOR */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Select Placement Room / Suggested Available Halls</span>
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">Auto-Ranked by Fit</span>
                </div>

                <select
                  value={newAllocForm.allocatedRoomId}
                  onChange={(e) => setNewAllocForm({ ...newAllocForm, allocatedRoomId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 cursor-pointer"
                >
                  {rooms.map(room => {
                    const sugg = liveSuggestions.find(s => s.room.id === room.id);
                    const conflictText = sugg?.hasConflict ? ' [⚠️ CONFLICT DETECTED]' : ' [✓ Free Slot]';
                    return (
                      <option key={room.id} value={room.id}>
                        {room.name} (Cap: {room.capacity} · {room.block}) {conflictText}
                      </option>
                    );
                  })}
                </select>

                {/* Conflict warning if chosen room has conflict */}
                {liveSuggestions.find(s => s.room.id === newAllocForm.allocatedRoomId)?.hasConflict && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Warning: A regular class or exam is scheduled in this hall. Saving will issue an Administration Alert!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Important Instructions for Registered Students</label>
                <textarea
                  rows={2}
                  value={newAllocForm.importantInstructions}
                  onChange={(e) => setNewAllocForm({ ...newAllocForm, importantInstructions: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAllocationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Allocate Room & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: ADMINISTRATION CONFLICT RESOLUTION MODAL             */}
      {/* ============================================================= */}
      {activeResolutionAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Resolve Administration Room Conflict</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeResolutionAlert.roomName} · {activeResolutionAlert.timeSlot}</p>
                </div>
              </div>
              <button onClick={() => setActiveResolutionAlert(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exact Prompt Alert Message Box */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-semibold leading-relaxed space-y-1">
              <div className="font-black text-rose-800 flex items-center gap-1.5 uppercase text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Alert Notice:
              </div>
              <p>{activeResolutionAlert.alertMessage}</p>
            </div>

            <form onSubmit={handleResolveConflictSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 font-extrabold mb-1.5">
                  Select Conflict Resolution Strategy:
                </label>
                
                <div className="space-y-2">
                  {/* Option 1: Change the classroom */}
                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    resolutionAction === 'CHANGE_CLASSROOM' 
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'CHANGE_CLASSROOM'}
                      onChange={() => setResolutionAction('CHANGE_CLASSROOM')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <strong className="block font-bold">1. Change the Classroom (Relocate regular class)</strong>
                      <span className="text-[11px] text-slate-500">
                        Move '{activeResolutionAlert.conflictingScheduleTitle}' to an alternate available classroom. The placement drive keeps {activeResolutionAlert.roomName}.
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Change the placement room */}
                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    resolutionAction === 'CHANGE_PLACEMENT_ROOM' 
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'CHANGE_PLACEMENT_ROOM'}
                      onChange={() => setResolutionAction('CHANGE_PLACEMENT_ROOM')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <strong className="block font-bold">2. Change the Placement Room (Relocate company drive)</strong>
                      <span className="text-[11px] text-slate-500">
                        Move {activeResolutionAlert.companyName} placement drive to another available hall of equal or greater capacity. Academic class remains untouched.
                      </span>
                    </div>
                  </label>

                  {/* Option 3: Reschedule the class */}
                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    resolutionAction === 'RESCHEDULE_CLASS' 
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}>
                    <input
                      type="radio"
                      name="resolutionAction"
                      checked={resolutionAction === 'RESCHEDULE_CLASS'}
                      onChange={() => setResolutionAction('RESCHEDULE_CLASS')}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <strong className="block font-bold">3. Reschedule the Academic Class</strong>
                      <span className="text-[11px] text-slate-500">
                        Adjust the class timing to a non-overlapping afternoon slot on the same date.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Form Field for Alternate Room Picker */}
              {(resolutionAction === 'CHANGE_CLASSROOM' || resolutionAction === 'CHANGE_PLACEMENT_ROOM') && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block">
                    {resolutionAction === 'CHANGE_CLASSROOM' 
                      ? 'Choose Target Alternate Classroom for Class:' 
                      : `Choose Target Alternate Hall for ${activeResolutionAlert.companyName}:`}
                  </label>
                  
                  <select
                    required
                    value={selectedAlternateRoomId}
                    onChange={(e) => setSelectedAlternateRoomId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Select Available Alternate Room --</option>
                    {rooms
                      .filter(r => r.id !== activeResolutionAlert.roomId)
                      .map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} (Capacity: {r.capacity} · {r.block})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Dynamic Form Field for Rescheduling Time Slot */}
              {resolutionAction === 'RESCHEDULE_CLASS' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block">New Non-Conflicting Class Time Slot:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Start Time</span>
                      <input
                        type="time"
                        value={rescheduleSlot.startTime}
                        onChange={(e) => setRescheduleSlot({ ...rescheduleSlot, startTime: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">End Time</span>
                      <input
                        type="time"
                        value={rescheduleSlot.endTime}
                        onChange={(e) => setRescheduleSlot({ ...rescheduleSlot, endTime: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic">
                * When confirmed, affected students and instructors are automatically updated with the revised room notification.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveResolutionAlert(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingResolution || ((resolutionAction === 'CHANGE_CLASSROOM' || resolutionAction === 'CHANGE_PLACEMENT_ROOM') && !selectedAlternateRoomId)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {isProcessingResolution ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving & Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Resolution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: CONFIRM ALLOCATION & TARGETED STUDENT NOTIFICATION  */}
      {/* ============================================================= */}
      {selectedAllocationForNotify && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Confirm Allocation & Send Notification</h3>
                  <p className="text-xs text-slate-500">Only sent to students registered for {selectedAllocationForNotify.companyName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAllocationForNotify(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Card Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Student Notification Preview
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 font-sans">
                <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-100 text-indigo-700 text-xs">📍</span>
                  <span>Room Allotment: {selectedAllocationForNotify.companyName} ({selectedAllocationForNotify.allocatedRoomName})</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div><strong>Company:</strong> {selectedAllocationForNotify.companyName}</div>
                  <div><strong>Round:</strong> {selectedAllocationForNotify.driveRound}</div>
                  <div><strong>Date:</strong> {selectedAllocationForNotify.date}</div>
                  <div><strong>Time:</strong> {selectedAllocationForNotify.startTime} - {selectedAllocationForNotify.endTime}</div>
                  <div><strong>Room/Hall:</strong> <span className="text-indigo-600 font-bold">{selectedAllocationForNotify.allocatedRoomName}</span></div>
                  <div><strong>Reporting:</strong> <span className="text-amber-800 font-bold">{selectedAllocationForNotify.reportingTime}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  <strong>Instructions:</strong> {selectedAllocationForNotify.importantInstructions}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Delivered directly to {selectedAllocationForNotify.registeredStudentsCount} registered student dashboards and notification trays.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAllocationForNotify(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAndNotify(selectedAllocationForNotify)}
                disabled={isNotifyingStudents}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {isNotifyingStudents ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Alerts...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Room Allotment Notification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: ADD NEW CAMPUS ROOM                                  */}
      {/* ============================================================= */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Register New Campus Hall / Room</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  await api.createCollegeRoom({
                    name: form.name.value,
                    code: form.code.value,
                    block: form.block.value,
                    floor: form.floor.value,
                    capacity: parseInt(form.capacity.value, 10),
                    type: form.type.value,
                    facilities: ['AC', 'Dual Projectors', 'WiFi', 'Power Backup'],
                    isActive: true
                  });
                  setShowAddRoomModal(false);
                  await loadData();
                } catch (err: any) {
                  alert(err.message || 'Failed to add room');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Room Name</label>
                <input name="name" required placeholder="e.g. Vikram Sarabhai Seminar Hall 3" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Room Code</label>
                  <input name="code" required placeholder="e.g. SH-301" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Capacity</label>
                  <input name="capacity" type="number" required placeholder="e.g. 150" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Room Type</label>
                <select name="type" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Conference Room">Conference Room</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Campus Block</label>
                  <input name="block" required placeholder="e.g. Block C - Tech Wing" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Floor</label>
                  <input name="floor" required placeholder="e.g. 2nd Floor" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddRoomModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: ADD NEW ACADEMIC SCHEDULE / REGULAR CLASS            */}
      {/* ============================================================= */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Schedule Academic Class / Examination</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                const roomObj = rooms.find(r => r.id === form.roomId.value);
                try {
                  await api.createAcademicSchedule({
                    code: form.code.value,
                    title: form.title.value,
                    department: form.department.value,
                    instructor: form.instructor.value,
                    roomId: form.roomId.value,
                    roomName: roomObj?.name || 'Classroom',
                    date: form.date.value,
                    startTime: form.startTime.value,
                    endTime: form.endTime.value,
                    type: form.type.value,
                    registeredCount: parseInt(form.registeredCount.value, 10) || 60,
                    status: 'SCHEDULED'
                  });
                  setShowAddScheduleModal(false);
                  await loadData();
                } catch (err: any) {
                  alert(err.message || 'Failed to add class schedule');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject Title</label>
                <input name="title" required placeholder="e.g. CS401 - Cloud Computing & Microservices" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course Code</label>
                  <input name="code" required placeholder="e.g. CS401" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Schedule Type</label>
                  <select name="type" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                    <option value="Class">Regular Class</option>
                    <option value="Examination">Examination</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Faculty / Instructor</label>
                  <input name="instructor" required placeholder="e.g. Dr. K. Sharma" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <input name="department" required placeholder="e.g. CSE Dept" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Classroom / Hall</label>
                <select name="roomId" required className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer">
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date</label>
                  <input name="date" type="date" defaultValue="2026-09-30" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input name="startTime" type="time" defaultValue="11:00" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input name="endTime" type="time" defaultValue="12:30" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Enrolled Students Count</label>
                <input name="registeredCount" type="number" defaultValue="65" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddScheduleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs">Add Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
