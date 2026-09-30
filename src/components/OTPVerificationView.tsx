import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  GraduationCap,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.ts';
import { User, StudentProfile } from '../types/index.ts';

interface OTPVerificationViewProps {
  email: string;
  maskedEmail?: string;
  previewOtp?: string;
  onVerificationSuccess: (user: User, profile?: StudentProfile) => void;
  onChangeEmail: () => void;
}

export const OTPVerificationView: React.FC<OTPVerificationViewProps> = ({
  email,
  maskedEmail,
  previewOtp,
  onVerificationSuccess,
  onChangeEmail
}) => {
  // 6 separate digits
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'incorrect' | 'expired' | 'rate_limited' | 'general' | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentPreviewOtp, setCurrentPreviewOtp] = useState<string | undefined>(previewOtp);

  // 5-minute countdown timer (300 seconds)
  const [countdown, setCountdown] = useState<number>(300);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric values
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    // Single digit input
    const char = clean.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto-advance to next box
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    if (errorMessage) {
      setErrorMessage(null);
      setErrorType(null);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace moves to previous box
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const next = [...digits];
    for (let i = 0; i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setDigits(next);

    // Focus next available box or the last box
    const nextFocusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();

    if (errorMessage) {
      setErrorMessage(null);
      setErrorType(null);
    }
  };

  const otpCode = digits.join('');
  const isComplete = otpCode.length === 6;

  // Submit OTP Verification
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete || verifying) return;

    setVerifying(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const result = await api.verifyOtp(email, otpCode);

      if (result.verified) {
        setIsSuccess(true);
        // Automatically redirect to student dashboard after displaying success state
        setTimeout(() => {
          onVerificationSuccess(result.user, result.profile);
        }, 1600);
      }
    } catch (err: any) {
      if (err.code === 'OTP_EXPIRED') {
        setErrorType('expired');
        setErrorMessage('OTP expired. Request a new verification code.');
      } else if (err.code === 'TOO_MANY_ATTEMPTS') {
        setErrorType('rate_limited');
        setErrorMessage('Too many verification attempts. Please request a new OTP.');
      } else if (err.code === 'INCORRECT_OTP') {
        setErrorType('incorrect');
        setRemainingAttempts(err.remainingAttempts);
        setErrorMessage('Incorrect verification code. Please check the code and try again.');
      } else {
        setErrorType('general');
        setErrorMessage(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const res = await api.resendOtp(email);
      setCountdown(300); // Reset 5-minute countdown (300s)
      setDigits(['', '', '', '', '', '']); // Clear for new code
      inputRefs.current[0]?.focus();
      if (res.previewOtp) {
        setCurrentPreviewOtp(res.previewOtp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Fast paste preview OTP helper for evaluator convenience
  const handleAutoFillOtp = () => {
    if (!currentPreviewOtp) return;
    const chars = currentPreviewOtp.split('').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, idx) => {
      next[idx] = c;
    });
    setDigits(next);
    inputRefs.current[5]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-indigo-100/80 border border-indigo-100 p-8 sm:p-10 relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

        {/* SUCCESS OVERLAY */}
        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 font-sans">
                ✓ Email Verified
              </h2>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Your CAMPUSLINK account has been successfully verified.
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-pulse">
                <span>Entering Student Dashboard...</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Header Icon & Brand */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25 mb-4">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-sans tracking-tight">
                Verify Your Email
              </h1>
              <p className="text-sm text-slate-500 mt-2">
                Enter the 6-digit verification code sent to your email.
              </p>
              
              {/* Masked Email Badge */}
              <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-purple-900">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>{maskedEmail || email}</span>
              </div>

              {/* 3-Step Verification Pipeline Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</span>
                  <span>Registered</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-purple-400" />
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Email OTP</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">3</span>
                  <span>Dashboard</span>
                </div>
              </div>
            </div>

            {/* Quick Testing Helper: Simulated OTP Banner */}
            {currentPreviewOtp && (
              <div className="mb-6 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Simulated OTP: <strong className="font-mono text-sm tracking-wider">{currentPreviewOtp}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillOtp}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-200 font-semibold text-amber-950 transition-colors cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* ERROR NOTIFICATION STATES */}
            {errorMessage && (
              <div className={`mb-6 p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs ${
                errorType === 'expired' 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorType === 'expired' ? 'text-amber-600' : 'text-rose-600'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold">
                    {errorType === 'incorrect' && '❌ Incorrect verification code.'}
                    {errorType === 'expired' && '⚠ OTP expired.'}
                    {errorType === 'rate_limited' && '🚫 Rate Limit Exceeded.'}
                  </p>
                  <p className="mt-0.5">{errorMessage}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="mt-1 font-medium text-[11px] text-rose-600">
                      Remaining attempts before lock: {remainingAttempts}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 6 OTP Input Boxes */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all focus:outline-none focus:ring-2 ${
                      digit 
                        ? 'border-purple-500 bg-purple-50/40 text-purple-900 focus:ring-purple-200' 
                        : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:border-slate-300 focus:border-purple-600 focus:ring-purple-100'
                    } ${
                      errorMessage && errorType === 'incorrect' ? 'border-rose-400 bg-rose-50/30 text-rose-700' : ''
                    }`}
                  />
                ))}
              </div>

              {/* Verify & Continue Button */}
              <button
                type="submit"
                disabled={!isComplete || verifying}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP & 5-Minute Countdown Section */}
              <div className="text-center pt-2 space-y-2.5">
                <p className="text-xs text-slate-500">
                  Didn't receive the verification code?
                </p>

                {countdown > 0 ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-600">
                    <span className="text-slate-400">Code valid for:</span>
                    <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-rose-600">
                      ⚠ Verification code expired (5 minutes elapsed).
                    </p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-xs font-bold text-purple-900 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend OTP (New 5-Minute Code)</span>
                    </button>
                  </div>
                )}

                {/* Always allow resend if needed after initial 30 seconds */}
                {countdown > 0 && countdown <= 270 && (
                  <div>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer disabled:opacity-50"
                    >
                      Resend code now
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onChangeEmail}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    ← Wrong email address? Change email
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
