import React, { useState } from 'react';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api.ts';
import { User, StudentProfile, RecruiterProfile } from '../types/index.ts';

interface LoginViewProps {
  onLoginSuccess: (user: User, profile?: StudentProfile | RecruiterProfile | null) => void;
  onNavigateRegister: () => void;
  onRequireVerification: (email: string, maskedEmail?: string, previewOtp?: string) => void;
  onExploreDemo?: () => void;
  allUsers?: User[];
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onRequireVerification,
  onExploreDemo,
  allUsers = []
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email ID.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.login(email.trim(), password);

      // Check if email requires verification
      if (res.verification_required && res.email) {
        onRequireVerification(res.email, res.maskedEmail, res.previewOtp);
        return;
      }

      if (res.verified && res.user) {
        onLoginSuccess(res.user, res.profile);
      } else {
        setErrorMsg(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials or user not found.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLoginAs = (user: User) => {
    setEmail(user.email);
    setPassword('Campus@2026Secure');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-indigo-100/80 border border-indigo-100 p-8 sm:p-10 relative overflow-hidden">
        
        {/* Subtle Ambient Backing Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        {/* Branding & Logo */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25 mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-mono text-xl font-black tracking-wider text-slate-900 block">CAMPUSLINK</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-2 font-sans">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your campus placement dashboard & AI insights
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email ID
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-600 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-600 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 mt-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Helper */}
        {allUsers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100 relative z-10">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Test Personas
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {allUsers.slice(0, 4).map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLoginAs(u)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  {u.name.split(' ')[0]} ({u.role})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer: Create Account */}
        <div className="text-center pt-5 mt-4 border-t border-slate-100 text-xs text-slate-600 relative z-10 space-y-2">
          <div>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Create Account
            </button>
          </div>

          {onExploreDemo && (
            <div>
              <button
                type="button"
                onClick={onExploreDemo}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Skip to Demo Mode
              </button>
            </div>
          )}
        </div>

      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Reset Your Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered college or campus email address to receive password recovery instructions.
            </p>

            {forgotSent ? (
              <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="font-semibold text-center">Password Reset Email Dispatched</p>
                <p className="text-center text-slate-600">
                  We've sent recovery instructions to <strong>{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotSent(false);
                  }}
                  className="w-full mt-3 py-2 rounded-xl bg-emerald-600 text-white font-medium cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotEmail) setForgotSent(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Send Instructions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
