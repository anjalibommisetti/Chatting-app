// ==============================================================================
// VibeConnect — Professional Conversation List & Search Dashboard (Screen 3)
// WhatsApp & Telegram UX: Active chat highlighting, unread badges, typing status,
// Pin/Mute indicators, search filter, and light/dark theme compatibility
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
  Phone,
  Video,
  UserCheck,
  Check,
  X,
  Sparkles,
  MessageSquarePlus,
  Inbox
} from 'lucide-react';
import { store } from '../../services/store';

export default function ChatList({ 
  activeConversationId, 
  onSelectConversation, 
  onOpenCreateGroup, 
  onOpenJoinGroup,
  onOpenNewChatByPhone,
  onStartCall 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'direct', 'groups', 'unread'

  const currentUser = store.currentUser;
  const conversations = store.conversations;
  const groups = store.groups;

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (filterTab === 'direct' && conv.type !== 'direct') return false;
    if (filterTab === 'groups' && conv.type !== 'group') return false;
    if (filterTab === 'unread' && (!conv.unreadCount || conv.unreadCount === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (conv.type === 'direct') {
        const peerId = conv.participantIds.find(id => id !== currentUser?.id);
        const peer = store.getUserById(peerId);
        const displayName = store.getDisplayName(peer).toLowerCase();
        const phone = (peer?.phone || '').toLowerCase();
        const preview = (conv.lastMessagePreview || '').toLowerCase();
        return displayName.includes(q) || phone.includes(q) || preview.includes(q);
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
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex-shrink-0 select-none text-[var(--text-primary)]">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-xl text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <span>Chats</span>
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenNewChatByPhone}
              className="p-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 border border-purple-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="New Chat by Contact"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px]">+ Chat</span>
            </button>
            <button
              onClick={onOpenJoinGroup}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Join Group with Code"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="p-2 rounded-xl bg-vibe-gradient hover:opacity-95 text-white transition-colors shadow-sm shadow-purple-600/30 cursor-pointer"
              title="New Private Group (Max 5)"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, contacts, or messages..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border-color)] text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups' },
            { id: 'unread', label: 'Unread' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
                filterTab === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center h-48">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
            <p className="font-semibold">No conversations found.</p>
            <p className="text-[11px] opacity-70 mt-1">Start a new chat or create a group to begin messaging.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.type === 'group';
            const group = isGroup ? groups.find(g => g.id === conv.groupId) : null;
            const peerId = !isGroup ? conv.participantIds.find(id => id !== currentUser?.id) : null;
            const peer = !isGroup ? store.getUserById(peerId) : null;

            const title = isGroup ? (group?.name || 'Private Group') : store.getDisplayName(peer);
            const avatar = isGroup ? (group?.avatar || '👥') : (peer?.avatar || '👤');
            const isActive = activeConversationId === conv.id;

            // Check if anyone is typing in this conversation
            const typingUsers = store.getTypingUsers(conv.id);
            const isTyping = typingUsers.length > 0;

            const unreadCount = conv.unreadCount || (conv.unreadCounts && conv.unreadCounts[currentUser?.id]) || 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative group ${
                  isActive
                    ? 'bg-purple-600/15 border border-purple-500/30 shadow-xs'
                    : 'hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {/* Avatar with Status Badge */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                    {avatar}
                  </div>
                  {!isGroup && peer?.status === 'online' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]"></span>
                  )}
                </div>

                {/* Information */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-heading font-bold text-sm text-[var(--text-primary)] truncate flex items-center gap-1.5">
                      {title}
                      {conv.isPinned && <Pin className="w-3 h-3 text-purple-400 rotate-45" />}
                      {conv.isMuted && <VolumeX className="w-3 h-3 text-[var(--text-muted)]" />}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] flex-shrink-0">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${
                      isTyping 
                        ? 'text-purple-400 font-semibold' 
                        : unreadCount > 0 
                          ? 'text-[var(--text-primary)] font-semibold' 
                          : 'text-[var(--text-secondary)]'
                    }`}>
                      {isTyping ? (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-1"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-2"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-3"></span>
                          <span>Typing...</span>
                        </span>
                      ) : (
                        conv.lastMessagePreview || 'No messages yet'
                      )}
                    </p>

                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Call Actions on Hover */}
                <div className="hidden group-hover:flex items-center gap-1 absolute right-2 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-color)] shadow-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartCall({
                        type: 'voice',
                        isGroup,
                        targetId: isGroup ? group?.id : peerId,
                        targetName: title,
                        targetAvatar: avatar,
                        participants: isGroup ? group?.members : [peerId]
                      });
                    }}
                    className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600 transition-colors"
                    title="Voice Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartCall({
                        type: 'video',
                        isGroup,
                        targetId: isGroup ? group?.id : peerId,
                        targetName: title,
                        targetAvatar: avatar,
                        participants: isGroup ? group?.members : [peerId]
                      });
                    }}
                    className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors"
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
