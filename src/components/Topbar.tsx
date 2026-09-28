import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  Sparkles, 
  ChevronDown, 
  Check, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, NotificationItem } from '../types/index.ts';
import { NavTab } from './Sidebar.tsx';

interface TopbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  setMobileOpen: (open: boolean) => void;
  onOpenAiAssistant: () => void;
  onOpenFlowModal?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers,
  onSwitchUser,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  setMobileOpen,
  onOpenAiAssistant,
  onOpenFlowModal,
  searchQuery,
  setSearchQuery
}) => {
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getBreadcrumbTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'register':
        return 'Student & Corporate Partner Registration';
      case 'flow':
        return 'Placement Architecture Flow (8 Steps)';
      case 'overview':
      case 'dashboard': 
        return currentUser?.role === 'tpo' ? 'Placement Command Center' : currentUser?.role === 'recruiter' ? 'Recruiter Portal' : 'Student Overview';
      case 'discover':
      case 'jobs': 
        return 'Campus Drives & Job Roles';
      case 'applications': 
        return 'My Placement Pipeline & Applications';
      case 'prep': 
        return 'AI Interview Preparation & Practice';
      case 'events':
      case 'scheduling': 
        return 'Campus Drives & Events Schedule';
      case 'resume':
      case 'documents': 
        return 'Resume Studio & Verification';
      case 'readiness': 
        return 'AI Employability & Readiness Scoring';
      case 'skillgap': 
        return 'AI Skill Gap Detection & Roadmap';
      case 'aimatching': 
        return 'AI Match Engine & Explainability';
      case 'students': 
        return 'Student Directory & Profiles';
      case 'atrisk': 
        return 'At-Risk Student Intervention';
      case 'companies': 
        return 'Hiring Partners';
      case 'analytics': 
        return 'Placement Conversion Analytics';
      case 'notifications': 
        return 'Notifications';
      case 'settings': 
        return 'Scoring Weights & Configuration';
      case 'profile': 
        return 'Student Profile';
      default: 
        return 'CAMPUSLINK';
    }
  };

  const isOverview = activeTab === 'overview' || activeTab === 'dashboard';

  return (
    <header className="sticky top-0 z-20 bg-[#F7F3EC]/95 backdrop-blur-xs border-b border-[#ECE4D9] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-[#7A7268] hover:text-[#1E2522] hover:bg-[#EAE3D9]/60 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#7A7268] font-medium">
            <span>CAMPUSLINK</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{currentUser?.role === 'tpo' ? 'Placement Cell' : currentUser?.role || 'Student'}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-[#1E2522] tracking-tight leading-tight">
            {getBreadcrumbTitle(activeTab)}
          </h1>
        </div>
      </div>

      {/* Middle: Global Search (shown when not on overview or on wide screens) */}
      {!isOverview && (
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8377]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles, skills (Python, SQL), or drives..."
              className="w-full pl-9 pr-4 py-1.5 bg-white text-xs text-[#1E2522] placeholder-[#8C8377] rounded-full border border-[#E3DCD1] focus:outline-hidden focus:border-[#1C4631] shadow-2xs transition-all"
            />
          </div>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Process Flow Architecture Quick Button */}
        {onOpenFlowModal && (
          <button
            onClick={onOpenFlowModal}
            className="px-3 py-1.5 bg-[#FAF4EA] hover:bg-[#F2E8D7] text-[#8C5D19] border border-[#E9D9BF] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer"
            title="Inspect 8-Stage Placement Architecture Flow"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B5781E]" />
            <span className="hidden md:inline">Process Flow (8 Steps)</span>
            <span className="md:hidden">Flow</span>
          </button>
        )}

        {/* Register Button */}
        <button
          onClick={() => setActiveTab('register')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
            activeTab === 'register'
              ? 'bg-[#1C4631] text-white border-[#1C4631] shadow-2xs'
              : 'bg-white hover:bg-[#F9F6F0] text-[#1E2522] border-[#E3DCD1]'
          }`}
          title="Student & Company Registration Page"
        >
          <span className="hidden sm:inline">Registration</span>
          <span className="sm:hidden">Reg</span>
        </button>

        {/* Ask CampusLink Button */}
        <button
          onClick={onOpenAiAssistant}
          className="px-3.5 py-1.5 bg-[#1C4631] hover:bg-[#153826] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
          title="Ask CampusLink AI"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Ask CampusLink</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#5E574E] hover:text-[#1C4631] hover:bg-[#EAE3D9]/60 rounded-xl relative transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B8552D] rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#ECE4D9] p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#1E2522]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-[#FCE8DE] text-[#B8552D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    className="text-[11px] font-semibold text-[#1C4631] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto py-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#7A7268]">
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        !n.read 
                          ? 'bg-[#F9F6F0] border-[#E3DCD1]' 
                          : 'bg-white border-[#F0EAE1] hover:bg-[#FDFBF7]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-[#1E2522] text-xs flex items-center gap-1.5">
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#1C4631] shrink-0" />}
                          <span>{n.title}</span>
                        </div>
                        <span className="text-[10px] text-[#7A7268] whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5E574E] mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#F0EAE1] text-center">
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-[#1C4631] hover:underline"
                >
                  View all notification history →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-white hover:bg-[#F0EAE1] rounded-xl transition-colors border border-[#ECE4D9] cursor-pointer shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full bg-[#FCE8DE] text-[#B8552D] flex items-center justify-center font-bold text-[11px]">
              {currentUser?.avatar || currentUser?.name?.[0] || 'AR'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#1E2522] truncate max-w-[100px]">
                {currentUser?.name || 'Aarav Reddy'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#7A7268] ml-0.5" />
          </button>

          {showPersonaDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#ECE4D9] p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#7A7268] border-b border-[#F0EAE1] pb-1.5 mb-2">
                Quick Demo Switcher
              </div>

              <div className="space-y-1">
                {allUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowPersonaDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isCurrent ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'hover:bg-[#F9F6F0] text-[#1E2522]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#FCE8DE] text-[#B8552D] flex items-center justify-center font-bold text-xs">
                          {u.avatar || u.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-[#1E2522] text-xs">{u.name}</div>
                          <div className="text-[10px] text-[#7A7268]">
                            {u.role === 'student' ? 'Student' : u.role === 'tpo' ? 'Placement Cell' : 'Recruiter'}
                          </div>
                        </div>
                      </div>

                      {isCurrent && <Check className="w-4 h-4 text-[#1C4631]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-[#F0EAE1]">
                <button
                  onClick={() => {
                    setActiveTab('register');
                    setShowPersonaDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-2 bg-[#F4FAF6] hover:bg-[#EAF5ED] text-[#1C4631] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[#D5EAD9]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1C4631]" />
                  <span>+ Register New Student / Partner</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
