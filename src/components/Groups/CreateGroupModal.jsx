// ==============================================================================
// VibeConnect — Private Group Creation Screen (Screen 5)
// STRICT 5-MEMBER MAXIMUM ENFORCEMENT
// ==============================================================================

import React, { useState } from 'react';
import { Users, X, Plus, Check, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { store } from '../../services/store';

const GROUP_AVATARS = ['✨', '🚀', '🔥', '💜', '🍕', '🎉', '🌟', '🎧', '⚡', '☕', '🎯', '👾'];

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('✨');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentUser = store.currentUser;
  const friends = store.users.filter(u => u.id !== currentUser?.id);

  // Creator takes 1 slot, so max selectable friends is 4!
  const maxFriendsToSelect = 4;
  const totalMemberCount = 1 + selectedFriendIds.length;

  const toggleFriend = (id) => {
    setError('');
    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedFriendIds.length >= maxFriendsToSelect) {
        setError('Limit Reached: Groups are strictly capped at 5 members max (including you)!');
        return;
      }
      setSelectedFriendIds(prev => [...prev, id]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    if (totalMemberCount > 5) {
      setError('Strict limit exceeded: maximum 5 members permitted per private group.');
      return;
    }

    try {
      const group = await store.createGroup({
        name,
        avatar,
        memberIds: selectedFriendIds
      });
      onGroupCreated(group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center text-2xl font-bold font-heading mb-3 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white">Create Private Group</h2>
          <p className="text-xs text-slate-400 mt-1">
            Intimate circles for your closest friends (Strictly capped at 5 members)
          </p>
        </div>

        {/* 5-Member Rule Alert */}
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-3 mb-5">
          <ShieldAlert className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <strong className="text-purple-300 block font-semibold mb-0.5">Strict 5-Member Policy</strong>
            VibeConnect groups can never exceed 5 members. This is strictly enforced on the server and database to prevent massive group spam.
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Group Icon Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Group Icon
            </label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                {avatar}
              </div>
              <div className="flex gap-2 flex-wrap flex-1">
                {GROUP_AVATARS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg cursor-pointer transition-transform ${
                      avatar === item ? 'bg-purple-600 scale-110 shadow-sm' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study Circle, Gaming Crew"
              maxLength={40}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          {/* Select Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Add Members (Optional)
              </label>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                totalMemberCount >= 5 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {totalMemberCount} / 5 Members
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {friends.map((friend) => {
                const isSelected = selectedFriendIds.includes(friend.id);
                const displayName = store.getDisplayName(friend);
                return (
                  <div
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{friend.avatar}</span>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold">{displayName}</span>
                        <span className="text-[10px] text-slate-400">@{friend.username}</span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-vibe-gradient hover:opacity-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Private Group</span>
          </button>
        </form>
      </div>
    </div>
  );
}
