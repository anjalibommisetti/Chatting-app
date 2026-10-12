// ==============================================================================
// VibeConnect — Contacts & Friends View (Screen 9)
// Custom Personal Friend Nicknames & Direct Actions
// ==============================================================================

import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  UserPlus, 
  MessageSquare, 
  Phone, 
  Video, 
  Edit3, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { store } from '../../services/store';

export default function ContactsView({ onOpenChat, onStartCall }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [customNicknameInput, setCustomNicknameInput] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState('');

  const currentUser = store.currentUser;
  const friends = store.users.filter(u => u.id !== currentUser?.id);

  const filteredFriends = friends.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const displayName = store.getDisplayName(f).toLowerCase();
    const username = f.username.toLowerCase();
    const email = f.email.toLowerCase();
    return displayName.includes(q) || username.includes(q) || email.includes(q);
  });

  const handleSaveNickname = (friendId) => {
    store.setFriendNickname(friendId, customNicknameInput);
    setEditingFriendId(null);
    setCustomNicknameInput('');
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (!addFriendInput.trim()) return;
    setAddFriendFeedback(`Friend request sent to ${addFriendInput}!`);
    setAddFriendInput('');
    setTimeout(() => setAddFriendFeedback(''), 3000);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#07090F] overflow-y-auto p-4 sm:p-8 select-none">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-white">Friends & Contacts</h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage your private circle and assign custom personal nicknames
            </p>
          </div>

          {/* Add Friend bar */}
          <form onSubmit={handleAddFriend} className="flex items-center gap-2">
            <input
              type="text"
              value={addFriendInput}
              onChange={(e) => setAddFriendInput(e.target.value)}
              placeholder="Username or email..."
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-500 transition-colors w-44"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {addFriendFeedback && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{addFriendFeedback}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by name or username..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101422] border border-white/5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Friend List */}
        <div className="space-y-3">
          {filteredFriends.map((friend) => {
            const hasCustomNickname = !!store.friendNicknames[friend.id];
            const displayName = store.getDisplayName(friend);
            const isEditing = editingFriendId === friend.id;

            return (
              <div
                key={friend.id}
                className="p-4 rounded-2xl bg-[#101422] border border-white/5 hover:border-white/10 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                      {friend.avatar}
                    </div>
                    {friend.status === 'online' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#101422]"></span>
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-white">
                        {displayName}
                      </span>
                      {hasCustomNickname && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                          Custom Nickname
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      @{friend.username} • <span className="capitalize">{friend.status}</span>
                    </span>
                    {friend.bio && (
                      <p className="text-[11px] text-slate-400/80 mt-0.5 max-w-xs truncate">
                        "{friend.bio}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Nickname Editing or Actions */}
                {isEditing ? (
                  <div className="flex items-center gap-2 self-end sm:self-auto animate-fadeIn">
                    <input
                      type="text"
                      value={customNicknameInput}
                      onChange={(e) => setCustomNicknameInput(e.target.value)}
                      placeholder="Personal Nickname..."
                      className="px-3 py-1.5 rounded-xl bg-black/40 border border-purple-500/40 text-white text-xs focus:outline-none w-36"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveNickname(friend.id)}
                      className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500"
                      title="Save Nickname"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingFriendId(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        setEditingFriendId(friend.id);
                        setCustomNicknameInput(store.friendNicknames[friend.id] || '');
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                      title="Assign Personal Nickname"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const conv = store.getDirectConversation(friend.id);
                        if (conv) onOpenChat(conv.id);
                      }}
                      className="p-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:text-white transition-colors cursor-pointer"
                      title="Open Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onStartCall({
                        type: 'voice',
                        isGroup: false,
                        targetId: friend.id,
                        targetName: displayName,
                        targetAvatar: friend.avatar
                      })}
                      className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onStartCall({
                        type: 'video',
                        isGroup: false,
                        targetId: friend.id,
                        targetName: displayName,
                        targetAvatar: friend.avatar
                      })}
                      className="p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                      title="Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
