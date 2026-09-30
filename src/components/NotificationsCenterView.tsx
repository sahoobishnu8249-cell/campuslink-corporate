import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Search, 
  Filter, 
  MapPin, 
  Award, 
  Briefcase, 
  Video, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  DoorOpen, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Volume2
} from 'lucide-react';
import { NotificationItem, User, Application, JobPosting } from '../types/index.ts';
import { NavTab } from './Sidebar.tsx';

interface NotificationsCenterViewProps {
  notifications: NotificationItem[];
  currentUser: User | null;
  applications: Application[];
  jobs: JobPosting[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onClearReadNotifications: () => Promise<void>;
  onNavigateTab: (tab: NavTab) => void;
  onOpenTracker: (application: Application) => void;
  onBroadcastNotification?: (payload: { title: string; message: string; type: string; linkTab?: string; targetRole?: string }) => Promise<void>;
}

export const NotificationsCenterView: React.FC<NotificationsCenterViewProps> = ({
  notifications,
  currentUser,
  applications,
  jobs,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onClearReadNotifications,
  onNavigateTab,
  onOpenTracker,
  onBroadcastNotification
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  
  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('Drive Announcement');
  const [broadcastLinkTab, setBroadcastLinkTab] = useState<string>('jobs');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<'all' | 'student' | 'tpo'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const isTPO = currentUser?.role === 'tpo';

  // Categorize
  const roomNotifications = notifications.filter(n => 
    n.type === 'Room Allotment' || 
    n.linkTab === 'roomallocation' || 
    n.title.toLowerCase().includes('room') || 
    n.title.toLowerCase().includes('hall')
  );

  const appNotifications = notifications.filter(n => 
    n.type === 'Shortlisted' || 
    n.type === 'New Application' || 
    n.type === 'status_change' || 
    n.applicationId || 
    n.linkTab === 'applications'
  );

  const interviewNotifications = notifications.filter(n => 
    n.type === 'Interview Schedule' || 
    n.title.toLowerCase().includes('interview') || 
    n.message.toLowerCase().includes('interview') || 
    n.linkTab === 'prep'
  );

  const driveNotifications = notifications.filter(n => 
    n.type === 'Drive Announcement' || 
    n.type === 'drive_announcement' || 
    n.title.toLowerCase().includes('drive')
  );

  const offerNotifications = notifications.filter(n => 
    n.type === 'Offer Letter' || 
    n.type === 'offer_extended' || 
    n.type === 'Offer Accepted' || 
    n.type === 'Offer Declined' || 
    n.linkTab === 'offers'
  );

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    // Tab filter
    if (filterType === 'unread' && n.read) return false;
    if (filterType === 'room') {
      const match = n.type === 'Room Allotment' || n.linkTab === 'roomallocation' || n.title.toLowerCase().includes('room');
      if (!match) return false;
    }
    if (filterType === 'apps') {
      const match = n.type === 'Shortlisted' || n.type === 'New Application' || n.type === 'status_change' || n.applicationId || n.linkTab === 'applications';
      if (!match) return false;
    }
    if (filterType === 'interviews') {
      const match = n.type === 'Interview Schedule' || n.title.toLowerCase().includes('interview') || n.message.toLowerCase().includes('interview') || n.linkTab === 'prep';
      if (!match) return false;
    }
    if (filterType === 'drives') {
      const match = n.type === 'Drive Announcement' || n.type === 'drive_announcement' || n.title.toLowerCase().includes('drive');
      if (!match) return false;
    }
    if (filterType === 'offers') {
      const match = n.type === 'Offer Letter' || n.type === 'offer_extended' || n.type === 'Offer Accepted' || n.type === 'Offer Declined' || n.linkTab === 'offers';
      if (!match) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchType = (n.type || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchType) return false;
    }

    return true;
  });

  const handleOpenActionForNotification = (notif: NotificationItem) => {
    // First mark as read
    if (!notif.read) {
      onMarkRead(notif.id);
    }

    // If notification has an application ID, open the dedicated live status tracker!
    if (notif.applicationId) {
      const matchedApp = applications.find(a => a.id === notif.applicationId);
      if (matchedApp) {
        onOpenTracker(matchedApp);
        return;
      }
      // If not in applications list, check if jobId is present to synthesize/find
      if (notif.jobId) {
        const job = jobs.find(j => j.id === notif.jobId);
        if (job) {
          const synthApp: Application = {
            id: notif.applicationId,
            jobId: job.id,
            jobTitle: job.title,
            companyName: job.companyName,
            companyLogo: job.companyLogo,
            jobLocation: job.location,
            jobType: job.type,
            ctcOrStipend: job.ctcOrStipend,
            studentId: currentUser?.id || 'current_student',
            studentName: currentUser?.name || 'Student',
            studentEmail: currentUser?.email || '',
            studentPhone: '+91 98765 43210',
            studentCgpa: 8.85,
            studentDegree: 'B.Tech',
            studentBranch: 'Computer Science & Engineering',
            studentGraduationYear: 2026,
            studentSkills: job.skills || ['React', 'Node.js', 'TypeScript'],
            studentResumeFilename: 'resume.pdf',
            studentResumeUrl: '#',
            coverNote: notif.message,
            eligibilityStatus: 'Eligible',
            matchScore: 90,
            matchBreakdown: {
              technicalSkillMatch: 90,
              academicEligibility: 95,
              projectRelevance: 85,
              certificationMatch: 80,
              interviewPerformance: 85
            },
            explainableMatch: {
              isShortlisted: true,
              summary: 'Shortlisted candidate profile matching campus drive requirements.',
              matchedSkills: job.skills.slice(0, 3),
              missingSkills: [],
              positiveFactors: ['Skill alignment', 'Academic eligibility met'],
              gapFactors: [],
              recommendedAction: 'Proceed with recruitment process',
              assessmentBenchmark: 'Top candidate'
            },
            stage: 'applied',
            stageHistory: [
              { stage: 'applied', label: 'Application Logged', timestamp: notif.createdAt, note: notif.message }
            ],
            evaluations: [],
            createdAt: notif.createdAt,
            updatedAt: notif.createdAt
          };
          onOpenTracker(synthApp);
          return;
        }
      }
    }

    // If specific linkTab is provided
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab as NavTab);
      return;
    }

    // Role-based fallbacks based on type
    if (notif.type === 'Room Allotment' || notif.title.toLowerCase().includes('room')) {
      onNavigateTab('roomallocation');
    } else if (notif.type === 'Interview Schedule') {
      onNavigateTab('prep');
    } else if (notif.type === 'Drive Announcement' || notif.type === 'drive_announcement') {
      onNavigateTab('jobs');
    } else if (notif.type === 'Offer Letter' || notif.type === 'offer_extended') {
      onNavigateTab('offers');
    } else {
      onNavigateTab('applications');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    if (onBroadcastNotification) {
      setIsSubmittingBroadcast(true);
      try {
        await onBroadcastNotification({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          linkTab: broadcastLinkTab,
          targetRole: broadcastTargetRole
        });
        setBroadcastTitle('');
        setBroadcastMessage('');
        setShowBroadcastModal(false);
      } catch (err) {
        console.error('Failed to broadcast notification:', err);
      } finally {
        setIsSubmittingBroadcast(false);
      }
    }
  };

  const getNotificationIcon = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const titleL = title.toLowerCase();

    if (t === 'room allotment' || titleL.includes('room') || titleL.includes('hall')) {
      return <DoorOpen className="w-4 h-4 text-emerald-600" />;
    }
    if (t === 'shortlisted' || titleL.includes('shortlist')) {
      return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
    if (t === 'interview schedule' || titleL.includes('interview')) {
      return <Video className="w-4 h-4 text-amber-600" />;
    }
    if (t === 'drive announcement' || t === 'drive_announcement' || titleL.includes('drive')) {
      return <Briefcase className="w-4 h-4 text-purple-600" />;
    }
    if (t === 'offer letter' || t === 'offer_extended' || titleL.includes('offer')) {
      return <Award className="w-4 h-4 text-emerald-600" />;
    }
    if (t === 'conflict alert') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
    return <Bell className="w-4 h-4 text-slate-600" />;
  };

  const getNotificationBadgeColor = (type: string, title: string) => {
    const t = (type || '').toLowerCase();
    const titleL = title.toLowerCase();

    if (t === 'room allotment' || titleL.includes('room') || titleL.includes('hall')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (t === 'shortlisted' || titleL.includes('shortlist')) {
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
    if (t === 'interview schedule' || titleL.includes('interview')) {
      return 'bg-amber-50 text-amber-900 border-amber-200';
    }
    if (t === 'drive announcement' || t === 'drive_announcement' || titleL.includes('drive')) {
      return 'bg-purple-50 text-purple-900 border-purple-200';
    }
    if (t === 'offer letter' || t === 'offer_extended') {
      return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    }
    if (t === 'conflict alert') {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Campus Recruitment Real-Time Dispatch</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px]">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Placement Notification & Alerts Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Real-time dispatch system for placement drive schedules, AI shortlist qualifications, room allotments, interview links, and official job offers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              onClick={onClearReadNotifications}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Remove already read notifications"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-300" />
              <span>Clear Read</span>
            </button>

            {isTPO && (
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Broadcast Alert</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Scrollable Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs font-semibold">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount, badgeColor: 'bg-emerald-100 text-emerald-800' },
              { id: 'room', label: 'Room Allotment 📍', count: roomNotifications.length },
              { id: 'apps', label: 'Shortlists & Apps 🎯', count: appNotifications.length },
              { id: 'interviews', label: 'Interviews 🎙️', count: interviewNotifications.length },
              { id: 'drives', label: 'Drives & Jobs 🚀', count: driveNotifications.length },
              { id: 'offers', label: 'Offer Letters 🎓', count: offerNotifications.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  filterType === tab.id ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No notifications found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery 
                ? `No notifications matched "${searchQuery}". Try clearing your search.` 
                : 'You have no alerts in this category right now. Any active updates for campus drives or rooms will appear here automatically.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map(notif => {
            const hasApplication = Boolean(notif.applicationId);
            const hasRoomLink = notif.linkTab === 'roomallocation' || notif.type === 'Room Allotment' || notif.title.toLowerCase().includes('room');

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
                  !notif.read
                    ? 'bg-gradient-to-r from-indigo-50/70 to-purple-50/40 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Icon & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      !notif.read ? 'bg-white border-indigo-200 shadow-xs' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {getNotificationIcon(notif.type, notif.title)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getNotificationBadgeColor(notif.type, notif.title)}`}>
                          {notif.type || 'Notice'}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                        {notif.title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        
                        {/* Status tracker button */}
                        {hasApplication && (
                          <button
                            onClick={() => handleOpenActionForNotification(notif)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <span>View Status Tracker</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Room Allocation button */}
                        {hasRoomLink && !hasApplication && (
                          <button
                            onClick={() => handleOpenActionForNotification(notif)}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>View Room Allotment</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Other primary action if linkTab */}
                        {notif.linkTab && notif.linkTab !== 'roomallocation' && notif.linkTab !== 'applications' && (
                          <button
                            onClick={() => handleOpenActionForNotification(notif)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <span>Open {notif.linkTab.toUpperCase()}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Mark read / unread toggle */}
                        {!notif.read ? (
                          <button
                            onClick={() => onMarkRead(notif.id)}
                            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium px-2 py-1 flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>Read</span>
                          </span>
                        )}

                      </div>

                    </div>
                  </div>

                  {/* Right: Delete button */}
                  <button
                    onClick={() => onDeleteNotification(notif.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Modal for Placement Cell (TPO) */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Broadcast Notification</h3>
                  <p className="text-xs text-slate-500">Dispatch live alerts to students or placement officers</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={broadcastTargetRole}
                  onChange={(e) => setBroadcastTargetRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  <option value="all">All CampusLink Users (Broadcast to Everyone)</option>
                  <option value="student">All Students Registered for Placements</option>
                  <option value="tpo">Placement Cell & Faculty Coordinators</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notification Category
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  <option value="Drive Announcement">🚀 Placement Drive Announcement</option>
                  <option value="Room Allotment">📍 Room Allotment & Venue Notice</option>
                  <option value="Interview Schedule">🎙️ Interview Schedule Update</option>
                  <option value="Document Deadline">📑 Document / Resume Verification Deadline</option>
                  <option value="Offer Letter">🎓 Offer Letter Extension</option>
                  <option value="General">📢 General Campus Announcement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. 📢 Google Drive: Round 2 Scheduled at Seminar Hall 1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter detailed notification message for students..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link / Destination Tab
                </label>
                <select
                  value={broadcastLinkTab}
                  onChange={(e) => setBroadcastLinkTab(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  <option value="jobs">Campus Drives (Discovery Page)</option>
                  <option value="roomallocation">Room Allocation Hub</option>
                  <option value="applications">Applications Pipeline</option>
                  <option value="prep">AI Interview Preparation Center</option>
                  <option value="offers">Offer Letters Tracker</option>
                  <option value="overview">Dashboard Overview</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingBroadcast ? 'Broadcasting...' : 'Broadcast to Campus'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
