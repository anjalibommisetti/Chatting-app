// ==============================================================================
// VibeConnect — Forgot Password Screen / Modal (Screen 2C)
// ==============================================================================

import React, { useState } from 'react';
import { Mail, ArrowRight, X, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold font-heading mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">We'll send you instructions to reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-200">
              Password reset link has been simulated for <strong className="text-purple-300">{email}</strong>.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
            >
              <span>Send Reset Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          <button
            onClick={onBackToLogin}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
