import React, { useState } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api.ts';

interface StudentRegistrationViewProps {
  onOtpRequested: (email: string, maskedEmail?: string, previewOtp?: string) => void;
  onNavigateLogin: () => void;
  onExploreDemo?: () => void;
}

const BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'MCA',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other'
];

export const StudentRegistrationView: React.FC<StudentRegistrationViewProps> = ({
  onOtpRequested,
  onNavigateLogin,
  onExploreDemo
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college_id: '',
    phone: '',
    branch: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (score === 3) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score: 75, label: 'Good', color: 'bg-indigo-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Student Name is required.';
        if (value.trim().length < 2) return 'Student Name must be at least 2 characters.';
        return null;
      case 'email':
        if (!value.trim()) return 'Email ID is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return '⚠ Please enter a valid email address.';
        }
        return null;
      case 'college_id':
        if (!value.trim()) return 'College ID is required.';
        return null;
      case 'phone': {
        const clean = value.replace(/\D/g, '');
        if (!value.trim()) return 'Student Phone Number is required.';
        if (clean.length < 10) return '⚠ Please enter a valid 10-digit Indian phone number.';
        return null;
      }
      case 'branch':
        if (!value.trim()) return 'Please select your branch.';
        return null;
      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
        return null;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.password) return 'Passwords do not match.';
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const err = validateField(field, value);
    setErrors(prev => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field];
      }
      return next;
    });
    if (serverError) setServerError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, (formData as any)[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await api.registerStudent({
        name: formData.name,
        email: formData.email,
        college_id: formData.college_id,
        phone: formData.phone,
        branch: formData.branch,
        password: formData.password
      });

      if (res.verification_required) {
        onOtpRequested(res.email, res.maskedEmail, res.previewOtp);
      }
    } catch (err: any) {
      if (err.field) {
        setErrors(prev => ({ ...prev, [err.field]: err.message }));
      } else {
        setServerError(err.message || 'Failed to submit registration. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Quick fill sample for fast testing
  const handlePrefillSample = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sample = {
      name: 'Bishnupriya Sahoo',
      email: 'sahoobishnu8249@gmail.com',
      college_id: `MCA2026${randomNum}`,
      phone: '+91 98765 43210',
      branch: 'MCA',
      password: 'Campus@2026Secure',
      confirmPassword: 'Campus@2026Secure'
    };
    setFormData(sample);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl shadow-indigo-100/70 border border-indigo-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT SIDE: Brand & Value Pillars */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#1E1B4B] via-[#2E1065] to-[#1E1B4B] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Backing Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          {/* Top Branding */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-mono text-2xl font-black tracking-wider text-white">CAMPUSLINK</span>
                <span className="block text-[11px] font-semibold text-purple-200 uppercase tracking-widest">Ecosystem</span>
              </div>
            </div>

            <p className="text-xl sm:text-2xl font-semibold text-indigo-100 leading-snug pt-2">
              "Your journey from campus to career starts here."
            </p>
            <p className="text-sm text-purple-200/80 leading-relaxed">
              Verify your official student email once to unlock AI eligibility scoring, verified university drives, and fast-track interview pipeline tracking.
            </p>
          </div>

          {/* 3 Small Feature Cards */}
          <div className="relative z-10 space-y-3.5 my-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:bg-white/15">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Readiness Analysis</h4>
                <p className="text-xs text-purple-200/70 mt-0.5">Benchmark your technical, academic, and interview readiness before dream placements.</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:bg-white/15">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Smart Job Matching</h4>
                <p className="text-xs text-purple-200/70 mt-0.5">Transparent fit scores with clear skill gap recommendations tailored to tier-1 roles.</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-start gap-3.5 transition-all hover:bg-white/15">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Placement Tracking</h4>
                <p className="text-xs text-purple-200/70 mt-0.5">Live real-time pipeline monitoring from shortlisting to official offer release.</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Note & Demo Option */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-purple-200/80">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Campus Verified · 256-Bit TLS</span>
            </div>
            {onExploreDemo && (
              <button 
                type="button" 
                onClick={onExploreDemo}
                className="underline hover:text-white transition-colors cursor-pointer"
              >
                Skip to Demo
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Registration Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  Student Onboarding
                </span>

                <button
                  type="button"
                  onClick={handlePrefillSample}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer"
                >
                  ⚡ Prefill Sample Student
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 font-sans tracking-tight">
                Create Your CAMPUSLINK Account
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Join your campus placement ecosystem and get AI-powered career insights.
              </p>

              {/* 3-Step Verification Pipeline Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Registration</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-purple-200" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                  <span>Email OTP</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
                  <span>Dashboard</span>
                </div>
              </div>
            </div>

            {/* Server Alert Message */}
            {serverError && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold">Registration Issue</p>
                  <p className="text-xs mt-0.5 text-rose-600">{serverError}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field 1: Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.name 
                      ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                  </p>
                )}
              </div>

              {/* Field 2 & 3: Email ID & College ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.email 
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    College ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your college ID"
                    value={formData.college_id}
                    onChange={(e) => handleInputChange('college_id', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.college_id 
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                    }`}
                  />
                  {errors.college_id && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.college_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Field 4 & 5: Student Phone Number & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Student Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.phone 
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 bg-slate-50/50 hover:bg-white focus:bg-white ${
                      errors.branch 
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                        : 'border-slate-200 focus:border-purple-600 focus:ring-purple-100'
                    }`}
                  >
                    <option value="">Select Branch ▼</option>
                    {BRANCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {errors.branch && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.branch}
                    </p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.password 
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                        errors.confirmPassword 
                          ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200 focus:border-rose-500' 
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-purple-600 focus:ring-purple-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements & Strength Meter */}
              {formData.password && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Password strength:</span>
                    <span className="font-semibold text-slate-700">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`} 
                      style={{ width: `${passwordStrength.score}%` }} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                    <span className={formData.password.length >= 8 ? 'text-emerald-600 font-medium' : ''}>
                      ✓ Min 8 characters
                    </span>
                    <span className={/[A-Z]/.test(formData.password) ? 'text-emerald-600 font-medium' : ''}>
                      ✓ Uppercase letter
                    </span>
                    <span className={/[a-z]/.test(formData.password) ? 'text-emerald-600 font-medium' : ''}>
                      ✓ Lowercase letter
                    </span>
                    <span className={/[0-9]/.test(formData.password) ? 'text-emerald-600 font-medium' : ''}>
                      ✓ Numeric digit
                    </span>
                  </div>
                </div>
              )}

              {/* Create Account Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validating & Generating OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Already have an account? Login */}
              <div className="text-center pt-3 text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
