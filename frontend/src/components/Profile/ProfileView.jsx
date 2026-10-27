// ==============================================================================
// VibeConnect — Professional Profile View & Settings (Screen 10 & 13)
// ==============================================================================

import React, { useState } from 'react';
import { 
  User, 
  Smile, 
  Mail, 
  Edit3, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  Radio,
  Phone
} from 'lucide-react';
import { store } from '../../services/store';

const AVATAR_PRESETS = ['🦊', '🌸', '⚡', '🚀', '🐼', '🌟', '🦁', '🔥', '🦋', '🍀', '☕', '🐱'];
const STATUS_OPTIONS = [
  { id: 'online', label: 'Online', color: 'bg-emerald-500' },
  { id: 'away', label: 'Away', color: 'bg-amber-500' },
  { id: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500' },
  { id: 'offline', label: 'Invisible', color: 'bg-slate-500' }
];

export default function ProfileView() {
  const currentUser = store.currentUser;
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '🦊');
  const [status, setStatus] = useState(currentUser?.status || 'online');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await store.updateProfile({
      name,
      nickname,
      bio,
      avatar,
      status
    });
    setIsEditing(false);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[var(--bg-main)] overflow-y-auto p-4 sm:p-8 select-none text-[var(--text-primary)]">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-[var(--text-primary)]">Your Profile</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Manage your identity, avatar, and active status</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-400 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Profile details saved successfully!</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-5xl shadow-xl">
                {currentUser?.avatar || '🦊'}
              </div>
              <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-[var(--bg-card)] ${
                STATUS_OPTIONS.find(s => s.id === currentUser?.status)?.color || 'bg-emerald-500'
              }`}></span>
            </div>

            <div className="flex flex-col text-center sm:text-left space-y-1">
              <h3 className="font-heading font-extrabold text-xl text-[var(--text-primary)]">
                {currentUser?.name || currentUser?.nickname || currentUser?.username}
              </h3>
              <span className="text-xs text-purple-400 font-medium">@{currentUser?.username}</span>
              <span className="text-xs text-[var(--text-secondary)]">{currentUser?.email}</span>
              {currentUser?.phone && (
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 justify-center sm:justify-start">
                  <Phone className="w-3 h-3" />
                  <span>{currentUser.phone}</span>
                </span>
              )}
            </div>

            <button
              onClick={() => store.logOut()}
              className="sm:ml-auto px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Status Quick Picker */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2.5">
              Active Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => store.updateProfile({ status: opt.id })}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    currentUser?.status === opt.id
                      ? 'bg-purple-600/20 border-purple-500 text-[var(--text-primary)] font-semibold'
                      : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio Preview */}
          {!isEditing && (
            <div className="pt-4 border-t border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-1">
                Bio / About
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed italic">
                "{currentUser?.bio || 'Hey there! I am using VibeConnect.'}"
              </p>
            </div>
          )}
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl space-y-4 animate-fadeIn">
            <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] mb-2">Edit Information</h4>

            {/* Avatar Select */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Select Avatar
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_PRESETS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg cursor-pointer ${
                      avatar === item ? 'bg-purple-600 scale-110 shadow-sm' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Display Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
                Custom Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-purple-600/30 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Quick Multi-User Test Switcher */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Test Multi-User Experience (Switch Active Account)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {store.users.slice(0, 4).map(u => (
              <button
                key={u.id}
                onClick={() => store.quickSwitchUser(u.id)}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  currentUser?.id === u.id
                    ? 'bg-purple-600/25 border-purple-500 text-[var(--text-primary)] font-bold'
                    : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{u.avatar}</span>
                <span className="text-[11px] font-semibold truncate w-full">{u.nickname || u.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Log Out Action */}
        <div className="pt-2">
          <button
            onClick={() => store.logOut()}
            className="w-full py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of VibeConnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}
