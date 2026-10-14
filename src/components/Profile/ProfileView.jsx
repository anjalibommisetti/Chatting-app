// ==============================================================================
// VibeConnect — Profile View & Settings (Screen 10 & 13)
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
  Radio 
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
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '🦊');
  const [status, setStatus] = useState(currentUser?.status || 'online');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    store.updateProfile({
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
    <div className="flex-1 h-full flex flex-col bg-[#07090F] overflow-y-auto p-4 sm:p-8 select-none">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-white">Your Profile</h2>
            <p className="text-xs text-slate-400 mt-1">Manage your identity, avatar, and active status</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {savedFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Profile details saved successfully!</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-[#101422] border border-white/5 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-5xl shadow-xl">
                {currentUser?.avatar || '🦊'}
              </div>
              <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-[#101422] ${
                STATUS_OPTIONS.find(s => s.id === currentUser?.status)?.color || 'bg-emerald-500'
              }`}></span>
            </div>

            <div className="flex flex-col text-center sm:text-left space-y-1">
              <h3 className="font-heading font-extrabold text-xl text-white">
                {currentUser?.nickname || currentUser?.username}
              </h3>
              <span className="text-xs text-purple-400 font-medium">@{currentUser?.username}</span>
              <span className="text-xs text-slate-400">{currentUser?.email}</span>
            </div>
          </div>

          {/* Status Quick Picker */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              Active Status
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => store.updateProfile({ status: opt.id })}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer ${
                    currentUser?.status === opt.id
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bio display */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
              About / Bio
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
              {currentUser?.bio || 'No bio specified.'}
            </p>
          </div>

          {/* Registered Phone & Sign Out */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Logged in with Mobile Number:</span>
              <span className="text-sm font-bold text-purple-300 font-mono">{currentUser?.phone || 'Demo Account'}</span>
            </div>
            <button
              onClick={() => store.logOut()}
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out / Sign In with Your Number</span>
            </button>
          </div>
        </div>

        {/* Edit Form Modal/Drawer */}
        {isEditing && (
          <form onSubmit={handleSave} className="p-6 rounded-3xl bg-[#101422] border border-purple-500/30 shadow-2xl space-y-4 animate-fadeIn">
            <h4 className="font-heading font-bold text-base text-white">Edit Profile Details</h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Display Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Custom Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Switcher (Simulates 2nd User Testing) */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Test Multi-User Experience (Switch Active User)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {store.users.map(u => (
              <button
                key={u.id}
                onClick={() => store.quickSwitchUser(u.id)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  currentUser?.id === u.id
                    ? 'bg-purple-600/25 border-purple-500 text-white'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{u.avatar}</span>
                <span className="text-[11px] font-semibold truncate w-full">{u.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
