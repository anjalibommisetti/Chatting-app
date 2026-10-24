// ==============================================================================
// VibeConnect Duo — 2-Member Private Messenger Welcome & Onboarding Screen
// ==============================================================================

import React from 'react';
import { 
  ShieldCheck, 
  Video, 
  Sparkles, 
  Lock, 
  UserPlus, 
  LogIn, 
  Heart,
  EyeOff,
  Flame,
  Phone
} from 'lucide-react';
import { store } from '../../services/store';

export default function WelcomeScreen({ onOpenLogin, onOpenSignup, onQuickLogin }) {
  const duoMembers = store.users.slice(0, 2);

  return (
    <div className="min-h-screen w-full bg-[#07090F] flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-600/15 blur-[140px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-indigo-600/10 blur-[130px] pointer-events-none rounded-full"></div>

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 font-bold text-2xl font-heading">
            V
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
              VibeConnect Duo
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                2-MEMBER VAULT
              </span>
            </h1>
            <p className="text-xs text-slate-400">Exclusive 1-on-1 Chat, HD Calling & Private Key Protection</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={onOpenSignup}
            className="px-4 py-2 rounded-xl bg-vibe-gradient hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-6 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Real-time Online Status • Video & Voice Calls • Private Key Protection</span>
        </div>

        <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-[1.15] mb-4">
          Built Exclusively For <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Two Members</span>.
        </h2>

        <p className="text-slate-300/80 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
          A private, locked sanctuary for 2 people. Zero random clutter, real-time online presence, 1-click HD video & voice calls, animated GIFs, and view-once photos locked behind your secret Private Key.
        </p>

        {/* Feature Cards Grid (4 Key Features) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 w-full max-w-4xl mb-8 text-left">
          <div className="p-4 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 mb-2.5">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm text-white mb-1">
              Private Key Vault
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Chats, calls, and media are hidden until you enter your secret Private Key.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2.5">
              <Video className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm text-white mb-1">
              HD Video & Voice
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct WebRTC peer-to-peer video and crystal-clear voice calls with 1 click.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-2.5">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm text-white mb-1">
              View-Once Photos
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Send confidential photos that automatically burn and expire after 1 viewing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-400 mb-2.5">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-bold text-sm text-white mb-1">
              Animated GIFs & Files
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Built-in animated GIF reaction search and seamless document/image sharing.
            </p>
          </div>
        </div>

        {/* Quick Duo Login Box */}
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#101422]/95 border border-purple-500/25 shadow-2xl backdrop-blur-xl">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
            Enter Duo Sanctuary
          </span>
          <p className="text-xs text-slate-400 mb-4">
            Select your account below (open another tab to test between Member 1 and Member 2):
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {duoMembers.map((user, idx) => (
              <button
                key={user.id}
                onClick={() => onQuickLogin(user.id)}
                className="p-3.5 rounded-2xl border bg-white/5 border-white/10 text-slate-300 hover:bg-purple-600/20 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center gap-1.5 active:scale-95 group shadow-sm"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{user.avatar}</span>
                <span className="text-xs font-bold text-white truncate w-full">
                  {idx === 0 ? 'Member 1 (Anju)' : 'Member 2 (Partner)'}
                </span>
                <span className="text-[10px] text-purple-300 font-mono truncate w-full">
                  {user.phone || user.username}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold mt-1">
                  Click to Enter
                </span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenLogin}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Custom Sign In
            </button>
            <button
              onClick={onOpenSignup}
              className="flex-1 py-2.5 px-4 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-purple-600/20"
            >
              Register New Account
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-500 relative z-10 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span>VibeConnect Duo</span>
          <span>•</span>
          <span>End-to-End Private Messaging</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Surveillance • Private Key Secured</span>
        </div>
      </footer>
    </div>
  );
}
