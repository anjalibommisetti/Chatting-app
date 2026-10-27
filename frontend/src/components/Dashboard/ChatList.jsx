// ==============================================================================
// VibeChat — Modern Conversation List & PhonePe-Style Contact Lookup
// Clean WhatsApp/Telegram UX with PhonePe Instant Name Lookup by Mobile Number
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Users, 
  User, 
  Pin, 
  VolumeX, 
  Plus, 
  Phone,
  Video, 
  Check,
  CheckCircle2,
  X, 
  Sparkles,
  MessageSquare,
  MessageSquarePlus,
  Inbox,
  Loader2,
  UserCheck
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
  
  // PhonePe-style live search result
  const [phoneMatchedUser, setPhoneMatchedUser] = useState(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);

  const currentUser = store.currentUser;
  const conversations = store.conversations;
  const groups = store.groups;

  // PhonePe Number Recognition
  const cleanDigits = searchQuery.replace(/[^0-9]/g, '');

  useEffect(() => {
    if (cleanDigits.length < 5) {
      setPhoneMatchedUser(null);
      setIsSearchingPhone(false);
      return;
    }

    // Live instant local match
    const local = store.findUserByPhone(cleanDigits);
    if (local) {
      setPhoneMatchedUser(local);
      setIsSearchingPhone(false);
      return;
    }

    // If 10 digits, search online
    if (cleanDigits.length >= 10) {
      setIsSearchingPhone(true);
      let isCancelled = false;
      store.searchUserByPhoneOnline(cleanDigits).then((matched) => {
        if (!isCancelled) {
          setPhoneMatchedUser(matched);
          setIsSearchingPhone(false);
        }
      }).catch(() => {
        if (!isCancelled) setIsSearchingPhone(false);
      });

      return () => {
        isCancelled = true;
      };
    } else {
      setPhoneMatchedUser(null);
      setIsSearchingPhone(false);
    }
  }, [cleanDigits]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (filterTab === 'direct' && conv.type !== 'direct') return false;
    if (filterTab === 'groups' && conv.type !== 'group') return false;
    if (filterTab === 'unread' && (!conv.unreadCount || conv.unreadCount === 0)) return false;

    if (searchQuery.trim() && cleanDigits.length < 10) {
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

  const handleStartChatWithPhoneUser = async (user) => {
    if (!user) return;
    try {
      const conv = await store.getDirectConversation(user.id);
      if (conv) {
        onSelectConversation(conv.id);
        setSearchQuery('');
        setPhoneMatchedUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex-shrink-0 select-none text-[var(--text-primary)]">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-[var(--border-color)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-extrabold text-xl text-[var(--text-primary)] tracking-tight">
              Chats
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Live
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenNewChatByPhone}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-md shadow-purple-600/25 active:scale-95"
              title="Find Contact by Mobile Number"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>+ New Chat</span>
            </button>
          </div>
        </div>

        {/* Search Input with PhonePe-style Lookup Support */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type name or 10-digit number (PhonePe)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPhoneMatchedUser(null);
              }}
              className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1">
          {['all', 'direct', 'groups', 'unread'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PHONEPE-STYLE CONTACT LOOKUP CARD (When typing mobile digits) */}
      {cleanDigits.length >= 5 && (
        <div className="p-3 border-b border-[var(--border-color)] bg-purple-950/20 animate-fadeIn">
          {isSearchingPhone ? (
            <div className="flex items-center justify-center py-2 text-xs text-purple-300 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Checking registered name for +91 {cleanDigits}...</span>
            </div>
          ) : phoneMatchedUser ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1c1b33] to-[#121626] border border-purple-500/40 shadow-lg">
              {/* PhonePe Verified Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Contact (PhonePe Style)
                </span>
                <span className="text-[10px] text-purple-300 font-mono">
                  {phoneMatchedUser.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                </span>
              </div>

              {/* Name & Phone Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                  {phoneMatchedUser.avatar || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-extrabold text-white text-sm truncate">
                    {phoneMatchedUser.name || phoneMatchedUser.nickname}
                  </h4>
                  <p className="text-xs text-purple-300 font-mono">
                    +91 {phoneMatchedUser.phone}
                  </p>
                </div>
              </div>

              {/* 1-Tap Action Buttons: Chat, Voice Call, Video Call */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStartChatWithPhoneUser(phoneMatchedUser)}
                  className="py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => {
                    onStartCall({
                      type: 'voice',
                      isGroup: false,
                      targetId: phoneMatchedUser.id,
                      targetName: phoneMatchedUser.name || phoneMatchedUser.nickname,
                      targetAvatar: phoneMatchedUser.avatar || '👤',
                      participants: [phoneMatchedUser.id]
                    });
                  }}
                  className="py-1.5 px-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => {
                    onStartCall({
                      type: 'video',
                      isGroup: false,
                      targetId: phoneMatchedUser.id,
                      targetName: phoneMatchedUser.name || phoneMatchedUser.nickname,
                      targetAvatar: phoneMatchedUser.avatar || '👤',
                      participants: [phoneMatchedUser.id]
                    });
                  }}
                  className="py-1.5 px-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
              </div>
            </div>
          ) : cleanDigits.length >= 10 ? (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <p className="text-xs text-slate-300 font-medium">
                No user registered with <strong className="text-purple-300">+91 {cleanDigits}</strong>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Share this app with them so they can join!
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-xs flex flex-col items-center justify-center h-48">
            <Inbox className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
            <p className="font-semibold">No conversations yet.</p>
            <p className="text-[11px] opacity-70 mt-1">
              Enter any friend's mobile number above to chat or call instantly!
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.type === 'group';
            const group = isGroup ? groups.find(g => g.id === conv.groupId) : null;
            const peerId = !isGroup ? conv.participantIds.find(id => id !== currentUser?.id) : null;
            const peer = !isGroup ? store.getUserById(peerId) : null;

            const title = isGroup ? (group?.name || 'Group') : store.getDisplayName(peer);
            const avatar = isGroup ? (group?.avatar || '👥') : (peer?.avatar || '👤');
            const isActive = activeConversationId === conv.id;

            // Typing status
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
                    className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-600 transition-colors cursor-pointer"
                    title="Audio Call"
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
                    className="p-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
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
