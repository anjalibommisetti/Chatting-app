// ==============================================================================
// VibeConnect — Welcome & Onboarding Screen (Screen 1)
// ==============================================================================

import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  Video, 
  Sparkles, 
  ArrowRight, 
  Phone, 
  Lock 
} from 'lucide-react';
import { store } from '../../services/store';

export default function WelcomeScreen({ onGetStarted, onQuickLogin }) {
  const sampleAccounts = store.users.slice(0, 4);

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
            <p className="text-xs text-slate-400">Private Messenger by Mobile Number</p>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-5xl mx-auto px-6 py-8 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Real Conversations. Pure Privacy. Connect by Phone Number.</span>
        </div>

        <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-[1.15] mb-5">
          Enter Your Mobile Number. <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">Connect Instantly</span>.
        </h2>

        <p className="text-slate-300/80 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
          No random dummy messages. Enter your friend's mobile number, send a message request, and once they accept, enjoy private chats, HD voice calls, and video calls.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10 text-left">
          <div className="p-5 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 mb-3.5">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5">
              Mobile Number Discovery
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find contacts by their phone number. Send a message request before starting a conversation for total privacy.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101422]/90 border border-white/5 shadow-xl hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 mb-3.5">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-1.5 flex items-center gap-2">
              Strict 5-Member Groups
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">Max 5</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforced at the database level. No massive chaotic groups—only intimate circles of up to 5 people.
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
              Real WebRTC calls for 1-on-1 and groups up to 5 members with front/back camera switch and screen share.
            </p>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="w-full max-w-lg p-6 rounded-2xl bg-[#101422]/95 border border-purple-500/25 shadow-2xl backdrop-blur-xl">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2">
            Instant Test Login (Select a Profile)
          </span>
          <p className="text-[11px] text-slate-400 mb-3">
            To test on two phones, open on Phone 1 as Anju, and on Phone 2 enter Priya's phone number (<strong className="text-purple-300">9876543211</strong>)!
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {sampleAccounts.map((user) => (
              <button
                key={user.id}
                onClick={() => onQuickLogin(user.id)}
                className="p-2.5 rounded-xl border bg-white/5 border-white/5 text-slate-300 hover:bg-purple-600/20 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{user.avatar}</span>
                <span className="text-xs font-semibold truncate w-full">{user.nickname}</span>
                <span className="text-[10px] text-purple-300 font-mono truncate w-full">{user.phone}</span>
              </button>
            ))}
          </div>

          <button
            onClick={onGetStarted}
            className="w-full py-3 px-5 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
          >
            <span>Enter With Mobile Number</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500 relative z-10 border-t border-white/5">
        <p>© 2026 VibeConnect. Real 1-to-1 & Group Messaging with WebRTC Audio/Video.</p>
      </footer>
    </div>
  );
}
