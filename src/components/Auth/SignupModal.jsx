// ==============================================================================
// VibeConnect — Sign Up Screen / Modal (Screen 2B)
// ==============================================================================

import React, { useState } from 'react';
import { Mail, Lock, User, Smile, ArrowRight, X, AlertCircle, Sparkles } from 'lucide-react';
import { store } from '../../services/store';

const AVATAR_OPTIONS = ['🦊', '🌸', '⚡', '🚀', '🐼', '🌟', '🦁', '🔥', '🦋', '🍀', '☕', '🐱'];

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !username.trim()) {
      setError('Please fill in email, username, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      store.signUp({
        email,
        password,
        username,
        nickname: nickname || username,
        avatar
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white text-2xl font-bold font-heading mb-3 shadow-lg shadow-purple-600/30">
            V
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Create Account</h2>
          <p className="text-xs text-slate-400 mt-1">Join the private 1-on-1 & 5-member group messenger</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                {avatar}
              </div>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {AVATAR_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base cursor-pointer transition-transform ${
                      avatar === item ? 'bg-purple-600 scale-110 shadow-sm' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Display Nickname
            </label>
            <div className="relative">
              <Smile className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Anju"
                maxLength={25}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. anju_dev"
                maxLength={20}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password (min 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400">
          <span>Already have an account? </span>
          <button
            onClick={onSwitchToLogin}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
