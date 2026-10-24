// ==============================================================================
// VibeConnect — Professional Settings & Privacy Dashboard (Screen 11)
// Light/Dark Theme, Notifications, Chats Backup & Restore, Session & Log Out
// ==============================================================================

import React, { useState, useRef } from 'react';
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
  Server,
  Download,
  Upload,
  RefreshCw,
  FileText
} from 'lucide-react';
import { store } from '../../services/store';
import { sound } from '../../services/audio';
import { notifications } from '../../services/notifications';

export default function SettingsView() {
  const currentUser = store.currentUser;
  const [theme, setTheme] = useState(store.settings.theme || 'dark');
  const [readReceipts, setReadReceipts] = useState(store.settings.readReceipts);
  const [soundAlerts, setSoundAlerts] = useState(store.settings.soundAlerts);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('Settings updated successfully!');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [oldKeyInput, setOldKeyInput] = useState('');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const restoreFileRef = useRef(null);

  const blockedUsers = (currentUser?.blockedUserIds || []).map(id => store.getUserById(id)).filter(Boolean);

  const showToast = (msg) => {
    setFeedbackMessage(msg);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleChangeKey = (e) => {
    if (e) e.preventDefault();
    if (!newKeyInput.trim() || newKeyInput.trim().length < 4) {
      setKeyError('New key must be at least 4 digits/characters');
      return;
    }
    if (newKeyInput.trim() !== confirmKeyInput.trim()) {
      setKeyError('New keys do not match');
      return;
    }
    const success = store.changePrivateKey(oldKeyInput.trim(), newKeyInput.trim());
    if (success) {
      setShowKeyModal(false);
      setOldKeyInput('');
      setNewKeyInput('');
      setConfirmKeyInput('');
      setKeyError('');
      showToast('Private Key updated successfully! 🔐');
    } else {
      setKeyError('Current Private Key is incorrect');
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    store.updateSettings({ theme: newTheme });
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const handleToggleSound = () => {
    const next = !soundAlerts;
    setSoundAlerts(next);
    sound.toggleSound(next);
    store.updateSettings({ soundAlerts: next });
    showToast(`Notification sounds ${next ? 'enabled' : 'disabled'}`);
  };

  const handleToggleReadReceipts = () => {
    const next = !readReceipts;
    setReadReceipts(next);
    store.updateSettings({ readReceipts: next });
    showToast(`Read receipts ${next ? 'enabled' : 'disabled'}`);
  };

  const handleRequestNotifications = async () => {
    const perm = await notifications.requestPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Desktop notifications enabled! 🔔');
      notifications.showMessageNotification({
        senderName: 'VibeConnect Team',
        text: 'Desktop notifications are now active! You will receive alerts for new messages and calls.'
      });
    } else {
      showToast('Notification permission was not granted.');
    }
  };

  const handleTestNotification = () => {
    notifications.showMessageNotification({
      senderName: 'Test Alert',
      text: 'This is a test notification from VibeConnect!'
    });
    showToast('Test notification triggered!');
  };

  // Chats Backup
  const handleBackupChats = () => {
    store.backupChats();
    showToast('Chats backup downloaded successfully! 📁');
  };

  // Chats Restore
  const handleRestoreFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        await store.restoreChats(backupData);
        showToast('Chats restored successfully from backup!');
      } catch (err) {
        showToast('Failed to restore backup: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleUnblock = (userId) => {
    store.unblockUser(userId);
    showToast('Contact unblocked');
  };

  const handleLogOut = () => {
    store.logOut();
  };

  const handleDeleteAccount = () => {
    store.deleteAccount();
  };

  const handleResetData = () => {
    store.clearAllLocalData();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] overflow-y-auto p-4 sm:p-8 select-none text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">Settings</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Configure appearance, notifications, chats backup, and account security</p>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* 0. Duo Private Key & Vault Security */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-purple-500/30 shadow-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>Duo Private Key & Security</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Protected
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Your 2-member chats, photos, calls, and files are hidden behind your secret Private Key. Without this key, nothing is exposed when opening the app.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="py-2.5 px-4 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Change Private Key</span>
            </button>

            <button
              onClick={() => store.lockVault()}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-primary)] border border-white/10 font-semibold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Lock Vault Now (Esc)</span>
            </button>
          </div>
        </div>

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
            <Bell className="w-5 h-5 text-purple-400" />
            <span>Notifications & Privacy</span>
          </div>

          {/* Desktop Push Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-[var(--border-color)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] block">Desktop Web Notifications</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  notificationPermission === 'granted' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {notificationPermission === 'granted' ? 'Active' : 'Not Enabled'}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Receive system alerts for incoming messages and phone calls</span>
            </div>
            <div className="flex items-center gap-2">
              {notificationPermission !== 'granted' ? (
                <button
                  onClick={handleRequestNotifications}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Enable Alerts
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer border border-[var(--border-color)]"
                >
                  Test Alert
                </button>
              )}
            </div>
          </div>

          {/* Read Receipts */}
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-color)]">
            <div>
              <span className="text-xs font-semibold text-[var(--text-primary)] block">Read Receipts</span>
              <span className="text-[11px] text-[var(--text-secondary)]">Show blue checkmarks (✓✓) when messages have been read</span>
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

          {/* Sound Alerts */}
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

        {/* 3. Chats Backup & Restore (Requested by user) */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base mb-1">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Chats Backup & Restore</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Export a complete encrypted backup copy of your conversations, private group records, and messages to your local device, or restore from a previous backup file.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleBackupChats}
              className="p-4 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white flex items-center gap-3 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Backup Chats</span>
                <span className="text-[10px] opacity-70">Download JSON backup file</span>
              </div>
            </button>

            <button
              onClick={() => restoreFileRef.current?.click()}
              className="p-4 rounded-2xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white flex items-center gap-3 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block">Restore Chats</span>
                <span className="text-[10px] opacity-70">Import backup JSON file</span>
              </div>
            </button>
            <input 
              ref={restoreFileRef}
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleRestoreFileChange}
            />
          </div>
        </div>

        {/* 4. Blocked Contacts Management */}
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

        {/* 5. Account Session & Log Out (Prominent Log Out Button) */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-heading font-bold text-base mb-1">
            <LogOut className="w-5 h-5 text-amber-400" />
            <span>Account Session</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <span className="text-xs font-bold text-[var(--text-primary)] block">Log Out of VibeConnect</span>
              <span className="text-[11px] text-[var(--text-muted)]">Sign out of your active session on this device. Your data remains safe on the server.</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 6. Danger Zone (Delete Account & Fresh Reset) */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-rose-500/20 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 text-rose-400 font-heading font-bold text-base mb-1">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </div>

          <div className="space-y-4 divide-y divide-[var(--border-color)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Reset Application Data</span>
                <span className="text-[11px] text-[var(--text-muted)]">Clear all local browser cached chats, mock contacts, and reset to fresh installation</span>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Fresh</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
              <div>
                <span className="text-xs font-bold text-rose-400 block">Delete Account Permanently</span>
                <span className="text-[11px] text-[var(--text-muted)]">Permanently erase your account, messages, profile, and memberships</span>
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
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-[#101422] border border-white/10 rounded-3xl p-6 text-center shadow-2xl space-y-4 text-white">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">Log Out Confirmation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to log out? You can sign back in anytime with your credentials.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogOut}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white cursor-pointer shadow-md shadow-amber-600/30"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-[#101422] border border-white/10 rounded-3xl p-6 text-center shadow-2xl space-y-4 text-white">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">Reset to Fresh State?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will clear local cache and old mock data from your browser, giving you a completely clean, fresh install experience.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white cursor-pointer shadow-md shadow-purple-600/30"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Private Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-[#101422] border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <h3 className="font-heading font-extrabold text-lg text-white">Change Private Key</h3>
                </div>
                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setKeyError('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangeKey} className="space-y-3">
                {store.hasPrivateKey() && (
                  <div>
                    <label className="text-xs font-semibold text-purple-300 block mb-1">
                      Current Private Key
                    </label>
                    <input
                      type="password"
                      value={oldKeyInput}
                      onChange={(e) => setOldKeyInput(e.target.value)}
                      placeholder="Enter current key"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-purple-300 block mb-1">
                    New Private Key (PIN or Passphrase)
                  </label>
                  <input
                    type="password"
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-purple-300 block mb-1">
                    Confirm New Private Key
                  </label>
                  <input
                    type="password"
                    value={confirmKeyInput}
                    onChange={(e) => setConfirmKeyInput(e.target.value)}
                    placeholder="Repeat new key"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                {keyError && (
                  <p className="text-xs text-rose-400 font-semibold">{keyError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKeyModal(false);
                      setKeyError('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-vibe-gradient hover:opacity-95 text-xs font-semibold text-white cursor-pointer shadow-md shadow-purple-600/30"
                  >
                    Save New Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
