// ==============================================================================
// VibeConnect — Professional Settings & Privacy Dashboard (Screen 11)
// Light/Dark Theme, Notification Sounds, Read Receipts, Blocked Users,
// Cloud Database configuration, and Account Security / Deletion
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
  ExternalLink,
  Sun,
  Moon,
  Ban,
  UserX,
  LogOut,
  Trash2,
  AlertTriangle,
  Server
} from 'lucide-react';
import { store } from '../../services/store';
import { sound } from '../../services/audio';

export default function SettingsView() {
  const currentUser = store.currentUser;
  const [theme, setTheme] = useState(store.settings.theme || 'dark');
  const [readReceipts, setReadReceipts] = useState(store.settings.readReceipts);
  const [soundAlerts, setSoundAlerts] = useState(store.settings.soundAlerts);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const blockedUsers = (currentUser?.blockedUserIds || []).map(id => store.getUserById(id)).filter(Boolean);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    store.updateSettings({ theme: newTheme });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleToggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    sound.toggleSound(next);
    store.updateSettings({ soundAlerts: next });
  };

  const handleToggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    store.updateSettings({ readReceipts: next });
  };

  const handleUnblock = (userId) => {
    store.unblockUser(userId);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleDeleteAccount = () => {
    store.deleteAccount();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] overflow-y-auto p-4 sm:p-8 select-none text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">Settings</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Configure appearance, privacy, sound alerts, and account security</p>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        {/* 1. Appearance & Theme */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base mb-1">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Appearance & Theme</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              <Moon className="w-6 h-6 text-purple-400" />
              <div className="text-center">
                <span className="text-xs font-bold block">Dark Mode</span>
                <span className="text-[10px] opacity-70">Sleek obsidian night theme</span>
              </div>
            </button>

            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-900 shadow-md'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              <Sun className="w-6 h-6 text-amber-500" />
              <div className="text-center">
                <span className="text-xs font-bold block">Light Mode</span>
                <span className="text-[10px] opacity-70">Clean daylight contrast</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Privacy & Notifications */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base mb-1">
            <Lock className="w-5 h-5 text-purple-400" />
            <span>Privacy & Notifications</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)] block">Read Receipts</span>
              <span className="text-[11px] text-[var(--text-secondary)]">Show blue checkmarks when messages have been read</span>
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
              <span className="text-xs font-semibold text-[var(--text-primary)] block">Notification Chimes & Sounds</span>
              <span className="text-[11px] text-[var(--text-secondary)]">Play call melodies and message delivery alerts</span>
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

        {/* 3. Blocked Contacts Management */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base">
              <Ban className="w-5 h-5 text-rose-400" />
              <span>Blocked Contacts</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-[var(--border-color)] text-[var(--text-muted)]">
              {blockedUsers.length}
            </span>
          </div>

          {blockedUsers.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-2">
              You haven't blocked any users. To block someone, open their contact details and select "Block".
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {blockedUsers.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-[var(--border-color)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{user.avatar || '👤'}</span>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">{user.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">@{user.username}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Backend Server Architecture */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Active Backend Service</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              🟢 Node.js & WebSockets Live
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Connected to <strong>VibeConnect Server</strong> with WebSocket signaling, persistent message storage in <code className="text-purple-400">/data/db.json</code>, and peer-to-peer WebRTC video/audio streaming.
          </p>
        </div>

        {/* 5. Account Security & Deletion */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-rose-500/20 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-heading font-bold text-base mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">Delete Account</span>
              <span className="text-[11px] text-[var(--text-muted)]">Permanently erase your messages, profile, and group memberships</span>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-[#101422] border border-rose-500/30 rounded-3xl p-6 text-center shadow-2xl space-y-4 text-white">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This action is irreversible. All your messages, private group associations, and profile details will be permanently removed.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer shadow-md shadow-rose-600/30"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
