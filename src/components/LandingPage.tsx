import React, { useState } from 'react';
import { 
  GraduationCap, 
  Cpu, 
  Sparkles, 
  CalendarClock, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Building2, 
  Award,
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { User } from '../types/index.ts';

interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPersona: (userId: string) => void;
  onOpenRegister?: () => void;
  allUsers: User[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSelectPersona,
  onOpenRegister,
  allUsers
}) => {
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight font-mono">CAMPUSLINK</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                AI Powered
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRoleSelect(true)}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Demo Personas
          </button>
          <button
            onClick={onGetStarted}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:scale-102 active:scale-98 flex items-center gap-1.5"
          >
            <span>Enter Platform</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-300/30 to-purple-300/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* AI Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 shadow-xs mb-6 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900">
            Intelligent College Placement Management & Analytics Platform
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl leading-[1.12]">
          Connect Campus Talent with the <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">Right Opportunity.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          AI-powered placement management, intelligent matching and data-driven career insights. Replace scattered spreadsheets and WhatsApp coordination with one intelligent placement ecosystem.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowRoleSelect(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Switch Role / Login</span>
          </button>

          {onOpenRegister && (
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#F4FAF6] hover:bg-[#EAF5ED] text-[#1C4631] font-bold text-sm rounded-xl border border-[#CDE1D4] shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-4 h-4 text-[#1C4631]" />
              <span>Register New Student / Company</span>
            </button>
          )}
        </div>

        {/* Live Ecosystem Stats Pill */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-medium">Students Enrolled</div>
            <div className="text-2xl font-black text-slate-900 mt-1">1,248</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">↑ 92% Profile Complete</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-medium">Placement Rate</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">72.4%</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">326 Offers Logged</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-medium">Peak CTC Extended</div>
            <div className="text-2xl font-black text-slate-900 mt-1">₹48.0 LPA</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Google Super Dream</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="text-slate-400 text-xs font-medium">Scheduling Clashes</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">0 Clashes</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">AI Conflict-Free Engine</div>
          </div>
        </div>

        {/* Interactive Lifecycle Flowchart Strip */}
        <div className="mt-14 w-full max-w-5xl bg-white p-6 rounded-3xl border border-slate-200 shadow-md text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Unified Workflow Architecture</div>
              <h3 className="text-base font-extrabold text-slate-900">End-to-End Campus-to-Corporate Placement Flow</h3>
            </div>
            <span className="hidden sm:inline text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
              100% Automated Stages
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-5 text-center text-xs">
            {[
              { title: 'Readiness', desc: 'AI Scoring 82/100', icon: '1' },
              { title: 'Skill Gap', desc: 'Target Roadmap', icon: '2' },
              { title: 'Company JD', desc: 'Criteria & CGPA', icon: '3' },
              { title: 'AI Matching', desc: 'TF-IDF Similarity', icon: '4' },
              { title: 'Scheduling', desc: 'Conflict-Free', icon: '5' },
              { title: 'Interviews', desc: 'Live Scorecards', icon: '6' },
              { title: 'Offers', desc: 'Official Letters', icon: '7' },
              { title: 'Analytics', desc: 'TPO Funnel', icon: '8' }
            ].map((step, idx) => (
              <div key={idx} className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 transition-colors">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center mx-auto mb-2 shadow-xs">
                  {step.icon}
                </div>
                <div className="font-extrabold text-slate-900 text-xs">{step.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Feature Cards Grid */}
      <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Engineered for Academic Rigor & Corporate Agility
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Every AI prediction is explainable, transparent, and grounded in verified academic and assessment records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card 1: AI Readiness */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">AI Readiness Scoring</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Multi-dimensional scoring across technical skills, CGPA, projects, certifications, aptitude, and mock interviews.
            </p>
          </div>

          {/* Card 2: Smart Matching */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Smart Matching</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              TF-IDF content similarity paired with strict hard eligibility rules (minimum CGPA, branches, active backlogs).
            </p>
          </div>

          {/* Card 3: Conflict-Free Scheduling */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CalendarClock className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Conflict-Free Drives</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automated conflict checks for student shortlist overlaps, venue bookings, and panel member availability.
            </p>
          </div>

          {/* Card 4: Explainable AI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">Explainable AI</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Never just "Rejected". Students receive granular breakdown of matched skills, gap areas, and remedial steps.
            </p>
          </div>

          {/* Card 5: Placement Analytics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">TPO Analytics</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Branch-wise conversion funnels, package distributions, skill demand trends, and at-risk student monitoring.
            </p>
          </div>

        </div>
      </section>

      {/* Role Selection Modal */}
      {showRoleSelect && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Select Demo Persona</h3>
                <p className="text-xs text-slate-500">Experience CAMPUSLINK from different roles</p>
              </div>
              <button
                onClick={() => setShowRoleSelect(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectPersona(u.id);
                    setShowRoleSelect(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {u.avatar || u.name[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {u.title || (u.role === 'tpo' ? 'Head of Placement Cell' : u.role === 'student' ? 'Final Year Student' : 'Corporate Recruiter')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onGetStarted}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Continue with Default Student (Bishnu Sahoo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <p className="font-mono">
          CAMPUSLINK · AI-Powered Campus-to-Corporate Placement Management & Analytics Platform
        </p>
      </footer>

    </div>
  );
};
