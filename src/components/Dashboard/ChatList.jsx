// ==============================================================================
// VibeConnect — Main Chat Dashboard / Conversation List (Screen 3)
// ==============================================================================

import React, { useState } from 'react';
import { 
  Search, 
  Users, 
  User, 
  Pin, 
  VolumeX, 
  Plus, 
  KeyRound, 
  CheckCheck,
  Video,
  Phone
} from 'lucide-react';
import { store } from '../../services/store';

export default function ChatList({ 
  activeConversationId, 
  onSelectConversation, 
  onOpenCreateGroup, 
  onOpenJoinGroup,
  onStartCall 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'direct', 'groups', 'unread'

  const currentUser = store.currentUser;
  const conversations = store.conversations;
  const users = store.users;
  const groups = store.groups;

  // Online friends for carousel
  const onlineFriends = users.filter(u => u.id !== currentUser?.id && u.status === 'online');

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    // Tab filter
    if (filterTab === 'direct' && conv.type !== 'direct') return false;
    if (filterTab === 'groups' && conv.type !== 'group') return false;
    if (filterTab === 'unread' && (!conv.unreadCount || conv.unreadCount === 0)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (conv.type === 'direct') {
        const peerId = conv.participantIds.find(id => id !== currentUser?.id);
        const peer = store.getUserById(peerId);
        const displayName = store.getDisplayName(peer).toLowerCase();
        const username = (peer?.username || '').toLowerCase();
        const preview = (conv.lastMessagePreview || '').toLowerCase();
        return displayName.includes(q) || username.includes(q) || preview.includes(q);
      } else {
        const group = groups.find(g => g.id === conv.groupId);
        const groupName = (group?.name || '').toLowerCase();
        const preview = (conv.lastMessagePreview || '').toLowerCase();
        return groupName.includes(q) || preview.includes(q);
      }
    }
    return true;
  });

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (now.toDateString() === date.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#0B0E17] border-r border-white/5 flex-shrink-0 select-none">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-xl text-white tracking-tight">
            Messages
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenJoinGroup}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Join Group with Code"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-sm shadow-purple-600/30 cursor-pointer"
              title="New Private Group (Max 5)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, contacts, or groups..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups (Max 5)' },
            { id: 'unread', label: 'Unread' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Online Friends Carousel */}
      {onlineFriends.length > 0 && (
        <div className="p-3 border-b border-white/5 bg-white/[0.01]">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Online Friends ({onlineFriends.length})
          </span>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {onlineFriends.map(friend => {
              const displayName = store.getDisplayName(friend);
              return (
                <button
                  key={friend.id}
                  onClick={() => {
                    const conv = store.getDirectConversation(friend.id);
                    if (conv) onSelectConversation(conv.id);
                  }}
                  className="flex flex-col items-center gap-1 min-w-[54px] cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                      {friend.avatar}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]"></span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-300 truncate max-w-[58px]">
                    {displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
            <p>No conversations found.</p>
            <p className="text-[11px] text-slate-400 mt-1">Start a direct chat or create a 5-member private group.</p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isSelected = activeConversationId === conv.id;
            let title = '';
            let avatar = '';
            let isOnline = false;
            let memberCountText = '';

            if (conv.type === 'direct') {
              const peerId = conv.participantIds.find(id => id !== currentUser?.id);
              const peer = store.getUserById(peerId);
              title = store.getDisplayName(peer);
              avatar = peer?.avatar || '👤';
              isOnline = peer?.status === 'online';
            } else {
              const group = groups.find(g => g.id === conv.groupId);
              title = group?.name || 'Private Group';
              avatar = group?.avatar || '👥';
              memberCountText = `${group?.members?.length || 0}/5`;
            }

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`flex items-center gap-3 p-3.5 transition-all cursor-pointer relative group ${
                  isSelected 
                    ? 'bg-purple-600/15 border-l-4 border-purple-500' 
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                    {avatar}
                  </div>
                  {conv.type === 'direct' ? (
                    isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E17]"></span>
                    )
                  ) : (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-purple-600 text-[9px] font-bold text-white border border-[#0B0E17]">
                      {memberCountText}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-white truncate flex items-center gap-1.5">
                      {title}
                      {conv.isPinned && <Pin className="w-3 h-3 text-purple-400 rotate-45" />}
                      {conv.isMuted && <VolumeX className="w-3 h-3 text-slate-400" />}
                    </span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate pr-2">
                      {conv.lastMessagePreview || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm shadow-purple-600/50">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Quick Call Action */}
                <div className="hidden group-hover:flex items-center gap-1 absolute right-3 top-3.5 bg-[#101422]/90 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (conv.type === 'direct') {
                        const peerId = conv.participantIds.find(id => id !== currentUser?.id);
                        const peer = store.getUserById(peerId);
                        onStartCall({
                          type: 'voice',
                          isGroup: false,
                          targetId: peerId,
                          targetName: store.getDisplayName(peer),
                          targetAvatar: peer?.avatar || '👤'
                        });
                      } else {
                        const group = groups.find(g => g.id === conv.groupId);
                        onStartCall({
                          type: 'voice',
                          isGroup: true,
                          targetId: group.id,
                          targetName: group.name,
                          targetAvatar: group.avatar,
                          participants: group.members
                        });
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Voice Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (conv.type === 'direct') {
                        const peerId = conv.participantIds.find(id => id !== currentUser?.id);
                        const peer = store.getUserById(peerId);
                        onStartCall({
                          type: 'video',
                          isGroup: false,
                          targetId: peerId,
                          targetName: store.getDisplayName(peer),
                          targetAvatar: peer?.avatar || '👤'
                        });
                      } else {
                        const group = groups.find(g => g.id === conv.groupId);
                        onStartCall({
                          type: 'video',
                          isGroup: true,
                          targetId: group.id,
                          targetName: group.name,
                          targetAvatar: group.avatar,
                          participants: group.members
                        });
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    title="Video Call"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
