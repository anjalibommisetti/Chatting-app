// ==============================================================================
// VibeConnect — Settings & Privacy View (Screen 11)
// Privacy, Notification Sounds & Supabase Backend Integration
// ==============================================================================

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  Volume2, 
  VolumeX, 
  Database, 
  Check, 
  Sparkles, 
  Lock, 
  ExternalLink 
} from 'lucide-react';
import { store } from '../../services/store';
import { sound } from '../../services/audio';
import { isSupabaseConfigured, setSupabaseConfig } from '../../services/supabase';

export default function SettingsView() {
  const [readReceipts, setReadReceipts] = useState(store.settings.readReceipts);
  const [soundAlerts, setSoundAlerts] = useState(store.settings.soundAlerts);
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('vibe_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('vibe_supabase_anon_key') || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const isConfigured = isSupabaseConfigured();

  const handleToggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    sound.toggleSound(next);
    store.settings.soundAlerts = next;
    store.notify();
  };

  const handleToggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    store.settings.readReceipts = next;
    store.notify();
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    setSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#07090F] overflow-y-auto p-4 sm:p-8 select-none">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Settings</h2>
          <p className="text-xs text-slate-400 mt-1">Configure your privacy, notifications, and cloud database</p>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        {/* Privacy & Security */}
        <div className="p-6 rounded-3xl bg-[#101422] border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-white font-heading font-bold text-base mb-1">
            <Lock className="w-5 h-5 text-purple-400" />
            <span>Privacy & Security</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="text-xs font-semibold text-white block">Read Receipts</span>
              <span className="text-[11px] text-slate-400">Let contacts know when you have read their messages</span>
            </div>
            <button
              onClick={handleToggleReadReceipts}
              className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                readReceipts ? 'bg-purple-600' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                readReceipts ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs font-semibold text-white block">Sound Alerts & Ringtones</span>
              <span className="text-[11px] text-slate-400">Play incoming call melodies and message notification chimes</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer ${
                soundAlerts ? 'bg-purple-600' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                soundAlerts ? 'translate-x-5' : 'translate-x-0'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Supabase Cloud Connection */}
        <div className="p-6 rounded-3xl bg-[#101422] border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white font-heading font-bold text-base">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Supabase Backend Integration</span>
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isConfigured 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
            }`}>
              {isConfigured ? '🟢 Connected' : '⚡ Local Reactive Engine'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            VibeConnect includes a turnkey local reactive database for instant out-of-the-box operation. 
            To connect your live Supabase cloud project, paste your URL and Anon Key below (also configured via <code className="text-purple-300">.env.example</code>).
          </p>

          <form onSubmit={handleSaveSupabase} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                SQL schema is ready in <code className="text-purple-300">supabase/schema.sql</code>
              </span>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Save Credentials
              </button>
            </div>
          </form>
        </div>

        {/* Group Rule Information */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
            About VibeConnect Architecture
          </span>
          <p className="text-xs text-slate-400 leading-relaxed">
            VibeConnect strictly enforces a 5-member limit on private groups to maintain high intimacy and trust. 
            Real-time multi-peer WebRTC mesh connects voice and video calls directly between browser peers without third-party surveillance.
          </p>
        </div>
      </div>
    </div>
  );
}
