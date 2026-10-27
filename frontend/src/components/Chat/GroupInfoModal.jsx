// ==============================================================================
// VibeConnect — Group Details & Member Management Modal
// ==============================================================================

import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Copy, 
  Check, 
  UserMinus, 
  UserPlus, 
  ShieldCheck, 
  LogOut, 
  AlertCircle 
} from 'lucide-react';
import { store } from '../../services/store';

export default function GroupInfoModal({ isOpen, onClose, groupId }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  if (!isOpen || !groupId) return null;

  const currentUser = store.currentUser;
  const group = store.groups.find(g => g.id === groupId);
  if (!group) return null;

  const isAdmin = group.creatorId === currentUser?.id;
  const members = group.members.map(id => store.getUserById(id)).filter(Boolean);
  const nonMembers = store.users.filter(u => !group.members.includes(u.id));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (userId) => {
    if (confirm('Remove this member from the private group?')) {
      try {
        await store.removeMemberFromGroup(groupId, userId);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleAddMember = async (userId) => {
    setError('');
    try {
      await store.addMemberToGroup(groupId, userId);
      setShowAddMember(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLeaveGroup = async () => {
    if (confirm('Are you sure you want to leave this private group?')) {
      await store.removeMemberFromGroup(groupId, currentUser.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#101422] border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Group Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-3xl shadow-inner mb-3">
            {group.avatar}
          </div>
          <h3 className="font-heading font-extrabold text-xl text-white">{group.name}</h3>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mt-1">
            <Users className="w-3.5 h-3.5" />
            <span>{group.members.length} / 5 Members (Strict Max 5)</span>
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invite Code Bar */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between mb-5">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Group Invite Code</span>
            <span className="text-sm font-mono font-bold text-white tracking-wider">{group.inviteCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Members ({group.members.length}/5)
            </span>
            {isAdmin && group.members.length < 5 && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Add member picker if toggled */}
          {showAddMember && (
            <div className="p-3 rounded-xl bg-black/40 border border-purple-500/30 space-y-2 animate-fadeIn">
              <span className="text-[11px] text-purple-300 font-medium block">Select friend to add:</span>
              {nonMembers.length === 0 ? (
                <p className="text-xs text-slate-400">All available contacts are already in this group.</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {nonMembers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{user.avatar}</span>
                        <span className="text-white font-medium">{store.getDisplayName(user)}</span>
                      </div>
                      <span className="text-purple-400 font-bold">+ Add</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {members.map(member => {
              const isCreator = group.creatorId === member.id;
              const displayName = store.getDisplayName(member);

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="text-2xl">{member.avatar}</span>
                      {member.status === 'online' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#101422]"></span>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        {displayName}
                        {isCreator && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                            ADMIN
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">@{member.username}</span>
                    </div>
                  </div>

                  {isAdmin && member.id !== currentUser.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Group */}
        <button
          onClick={handleLeaveGroup}
          className="w-full py-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Private Group</span>
        </button>
      </div>
    </div>
  );
}
