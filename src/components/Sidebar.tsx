import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Sparkles,
  ChevronRight,
  LogOut,
  X,
  Users,
  Building2,
  BarChart3,
  AlertTriangle,
  Settings,
  Check,
  UserPlus
} from 'lucide-react';
import { User } from '../types/index.ts';

export type NavTab = 
  | 'overview'
  | 'dashboard'
  | 'discover'
  | 'jobs'
  | 'applications'
  | 'prep'
  | 'events'
  | 'scheduling'
  | 'resume'
  | 'documents'
  | 'readiness'
  | 'skillgap'
  | 'aimatching'
  | 'students'
  | 'atrisk'
  | 'companies'
  | 'analytics'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'interviews'
  | 'offers'
  | 'flow'
  | 'register';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: User | null;
  allUsers?: User[];
  onSwitchUser?: (userId: string) => void;
  unreadCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  allUsers = [],
  onSwitchUser,
  unreadCount,
  mobileOpen,
  setMobileOpen,
  onLogout
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const role = currentUser?.role || 'student';

  // Map active tab to primary student tabs from screenshot
  const isOverview = activeTab === 'overview' || activeTab === 'dashboard' || activeTab === 'readiness';
  const isDiscover = activeTab === 'discover' || activeTab === 'jobs' || activeTab === 'aimatching';
  const isApplications = activeTab === 'applications' || activeTab === 'offers' || activeTab === 'interviews';
  const isPrep = activeTab === 'prep' || activeTab === 'skillgap';
  const isEvents = activeTab === 'events' || activeTab === 'scheduling';
  const isResume = activeTab === 'resume' || activeTab === 'documents';

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      isActive: isOverview
    },
    {
      id: 'discover' as NavTab,
      label: 'Discover roles',
      icon: Search,
      isActive: isDiscover
    },
    {
      id: 'applications' as NavTab,
      label: 'My applications',
      icon: Briefcase,
      isActive: isApplications
    },
    {
      id: 'prep' as NavTab,
      label: 'Interview prep',
      icon: MessageSquare,
      isActive: isPrep
    },
    {
      id: 'events' as NavTab,
      label: 'Campus events',
      icon: Calendar,
      isActive: isEvents
    },
    {
      id: 'resume' as NavTab,
      label: 'Resume studio',
      icon: FileText,
      isActive: isResume
    },
    {
      id: 'flow' as NavTab,
      label: 'Placement flow (8 steps)',
      icon: Sparkles,
      isActive: activeTab === 'flow'
    },
    {
      id: 'register' as NavTab,
      label: 'Registration page',
      icon: UserPlus,
      isActive: activeTab === 'register'
    }
  ];

  // Additional TPO / Recruiter tools if in admin mode
  const isStaff = role === 'tpo' || role === 'recruiter';

  const content = (
    <div className="flex flex-col h-full bg-[#F9F6F0] text-[#1E2522] w-64 border-r border-[#EAE3D9] select-none">
      
      {/* Brand Header matching screenshot */}
      <div className="p-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Green circle CL logo */}
          <div className="w-10 h-10 rounded-full bg-[#1C4631] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0">
            CL
          </div>
          <div>
            <div className="font-extrabold text-[#1C4631] text-base tracking-tight leading-tight">
              CAMPUSLINK
            </div>
            <p className="text-[12px] text-[#7A7268] font-normal leading-none mt-0.5">
              Placement, decoded
            </p>
          </div>
        </div>

        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-[#7A7268] hover:text-[#1E2522] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-medium transition-colors text-left ${
                active 
                  ? 'bg-[#DCE8DF] text-[#1C4631] font-semibold shadow-2xs' 
                  : 'text-[#5E574E] hover:text-[#1E2522] hover:bg-[#F0EAE1]/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#1C4631]' : 'text-[#7A7268]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {/* Admin Section (for TPO / Recruiter) */}
        {isStaff && (
          <div className="pt-4 mt-3 border-t border-[#EAE3D9] space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8377]">
              {role === 'tpo' ? 'TPO Portal' : 'Recruiter Portal'}
            </div>
            {role === 'tpo' && (
              <>
                <button
                  onClick={() => handleNavClick('analytics')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                    activeTab === 'analytics' ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'text-[#5E574E] hover:bg-[#F0EAE1]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Placement Analytics</span>
                </button>
                <button
                  onClick={() => handleNavClick('atrisk')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                    activeTab === 'atrisk' ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'text-[#5E574E] hover:bg-[#F0EAE1]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Students At Risk</span>
                </button>
                <button
                  onClick={() => handleNavClick('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                    activeTab === 'settings' ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'text-[#5E574E] hover:bg-[#F0EAE1]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Scoring Weights</span>
                </button>
              </>
            )}
            {role === 'recruiter' && (
              <button
                onClick={() => handleNavClick('students')}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs transition-colors ${
                  activeTab === 'students' ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'text-[#5E574E] hover:bg-[#F0EAE1]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Candidate Pool</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Area: CAREER READINESS card matching screenshot */}
      <div className="p-4 pt-2 space-y-2.5">
        
        {/* Placement Architecture Flow Card */}
        <div 
          onClick={() => handleNavClick('flow')}
          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
            activeTab === 'flow'
              ? 'bg-[#1C4631] text-white border-[#1C4631] shadow-2xs'
              : 'bg-[#EAF3ED] hover:bg-[#DDEEE1] text-[#1C4631] border-[#C8E1CE]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'flow' ? 'text-emerald-300' : 'text-[#1C4631]'}`} />
              <span>Placement Flow</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === 'flow' 
                ? 'bg-white/20 text-white' 
                : 'bg-white text-[#1C4631] border border-[#C8E1CE]'
            }`}>
              8 Steps
            </span>
          </div>
          <p className={`text-[11px] mt-1 leading-snug ${activeTab === 'flow' ? 'text-emerald-100' : 'text-[#2D4E3B]'}`}>
            Interactive candidate & drive pipeline flow.
          </p>
        </div>

        {/* Career Readiness Box */}
        <div 
          onClick={() => handleNavClick('readiness')}
          className="bg-[#F0EAE1] hover:bg-[#ECE5DC] border border-[#E3DCD1] rounded-2xl p-4 cursor-pointer transition-all"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A7268]">
            CAREER READINESS
          </div>
          
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-serif text-3xl font-bold text-[#1E2522]">78</span>
            <span className="text-sm font-medium text-[#7A7268]">/100</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#DDD5C7] rounded-full mt-2.5 overflow-hidden">
            <div 
              className="h-full bg-[#1C4631] rounded-full transition-all duration-500" 
              style={{ width: '78%' }}
            />
          </div>

          <div className="mt-2 text-[11px] text-[#7A7268] flex items-center gap-1 font-medium">
            <span>+6 this week</span>
            <span aria-hidden="true">·</span>
            <span>top 18% of cohort</span>
          </div>
        </div>

        {/* User Profile Bar matching screenshot */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-[#EAE3D9]/60 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Peach circle AR avatar */}
              <div className="w-9 h-9 rounded-full bg-[#FCE8DE] text-[#B8552D] flex items-center justify-center font-bold text-xs shrink-0 border border-[#F4D1C1]">
                {currentUser?.avatar || 'AR'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1E2522] truncate">
                  {currentUser?.name || 'Aarav Reddy'}
                </div>
                <div className="text-[11px] text-[#7A7268] truncate">
                  {currentUser?.title || 'B.Tech CSE · 2026'}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#8C8377] shrink-0" />
          </button>

          {/* Persona Switcher Dropdown */}
          {showPersonaMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-[#E3DCD1] p-3 z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8C8377] border-b border-[#F0EAE1] pb-1.5 mb-2">
                Switch Perspective
              </div>
              <div className="space-y-1">
                {allUsers.slice(0, 4).map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser?.(u.id);
                        setShowPersonaMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                        isCurrent ? 'bg-[#DCE8DF] text-[#1C4631] font-bold' : 'hover:bg-[#F9F6F0] text-[#1E2522]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-[10px] text-[#7A7268]">
                          {u.role === 'student' ? 'Student' : u.role === 'tpo' ? 'TPO Officer' : 'Recruiter'}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#1C4631]" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-2 border-t border-[#F0EAE1]">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 p-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Platform</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-[#1E2522]/40 backdrop-blur-xs flex">
          <div className="h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
