// ==============================================================================
// VibeConnect — Professional Password Reset Modal
// Real backend verification, reset code validation, and new password setup
// ==============================================================================

import React, { useState } from 'react';
import { Mail, ArrowRight, X, CheckCircle2, Lock, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code & new password, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setStep(2);
      if (res.devResetCode) {
        setResetCode(res.devResetCode);
        setInfoMsg(`Verification code generated: ${res.devResetCode} (Pre-filled for testing)`);
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetCode.trim()) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Password reset failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold font-heading mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && 'Enter your registered email address'}
            {step === 2 && 'Enter the reset code and your new password'}
            {step === 3 && 'Password successfully updated'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2 animate-fadeIn">
            <span>{infoMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anju@vibeconnect.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Email...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter Reset Code & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                6-Digit Reset Code
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-center font-mono text-base tracking-widest focus:outline-none focus:border-purple-500"
                maxLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-sm text-slate-200">
              Your password has been securely reset. You can now log in with your new password!
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Proceed to Sign In
            </button>
          </div>
        )}

        {step !== 3 && onBackToLogin && (
          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
