// ==============================================================================
// VibeConnect — Welcome & Onboarding Screen (Screen 1)
// ==============================================================================

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Video, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  PhoneCall, 
  MessageSquareHeart,
  CheckCircle2
} from 'lucide-react';
import { store } from '../../services/store';

export default function WelcomeScreen({ onGetStarted, onQuickLogin }) {
  const [selectedDemoUser, setSelectedDemoUser] = useState('usr_anju');

  const demoAccounts = store.users.slice(0, 4);

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
              VibeConnect
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                STRICT 5-MEMBER GROUPS
              </span>
            </h1>
            <p className="text-xs text-slate-400">Private 1-on-1 & Group Chat & Calling</p>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Real Conversations. Pure Privacy. No Noise.</span>
        </div>

        <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-[1.15] mb-5">
          Private Chat & Calls for You and Your <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Inner Circle</span>.
        </h2>

        <p className="text-slate-300/80 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
          Chat freely with friends, customize personal nicknames, and create private groups strictly limited to 
          <strong className="text-purple-300"> 5 members max</strong>. Experience crystal-clear 1-on-1 and group voice & video calls.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10 text-left">
          <div className="p-5 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 mb-3.5">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5 flex items-center gap-2">
              Strict 5-Member Groups
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">Max 5</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforced at the database level. No massive chaotic channels—only intimate circles of up to 5 people.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3.5">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5">
              HD Voice & Video Calls
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              WebRTC multi-peer calling for 1-on-1 and groups up to 5. Screen sharing, camera flip, and synthesized rings.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-3.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5">
              Custom Friend Nicknames
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Give your friends private personal nicknames visible only to you. Full typing status, media, and reactions.
            </p>
          </div>
        </div>

        {/* Demo Quick Logins / Primary CTA */}
        <div className="w-full max-w-lg p-6 rounded-2xl bg-[#101422]/95 border border-purple-500/25 shadow-2xl backdrop-blur-xl">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-3">
            Instant Test Login (Select a Profile)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {demoAccounts.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedDemoUser(user.id);
                  onQuickLogin(user.id);
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  selectedDemoUser === user.id
                    ? 'bg-purple-600/25 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl">{user.avatar}</span>
                <span className="text-xs font-semibold truncate w-full">{user.nickname}</span>
                <span className="text-[10px] text-slate-400 truncate w-full">@{user.username}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onGetStarted}
            className="w-full py-3 px-5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
          >
            <span>Enter VibeConnect Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 relative z-10 border-t border-white/5">
        <p>© 2026 VibeConnect. Real 1-to-1 & Group Messaging with WebRTC Audio/Video.</p>
      </footer>
    </div>
  );
}
