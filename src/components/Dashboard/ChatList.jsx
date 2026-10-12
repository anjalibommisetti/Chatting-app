// ==============================================================================
// VibeConnect — Conversation List & Incoming Requests Banner (Screen 3)
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
  PhoneCall
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
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'direct', 'groups', 'requests'

  const currentUser = store.currentUser;
  const conversations = store.conversations;
  const groups = store.groups;
  const pendingRequests = store.getPendingRequestsForMe();

  const handleAcceptRequest = (requestId) => {
    const conv = store.acceptChatRequest(requestId);
    if (conv) {
      onSelectConversation(conv.id);
    }
  };

  const handleDeclineRequest = (requestId) => {
    store.declineChatRequest(requestId);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (filterTab === 'direct' && conv.type !== 'direct') return false;
    if (filterTab === 'groups' && conv.type !== 'group') return false;

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
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#0B0E17] border-r border-white/5 flex-shrink-0 select-none">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
            <span>Chats</span>
            {pendingRequests.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white animate-pulse">
                {pendingRequests.length} New
              </span>
            )}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenNewChatByPhone}
              className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Add by Mobile Number"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">+ Phone</span>
            </button>
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
            placeholder="Search chats or mobile numbers..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/5 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups (Max 5)' },
            { id: 'requests', label: `Requests (${pendingRequests.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${
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

      {/* PENDING CHAT REQUESTS BANNER */}
      {pendingRequests.length > 0 && filterTab !== 'requests' && (
        <div className="p-3 bg-purple-500/10 border-b border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Incoming Message Requests</span>
            </span>
            <button
              onClick={() => setFilterTab('requests')}
              className="text-[11px] underline hover:text-white"
            >
              View all ({pendingRequests.length})
            </button>
          </div>
        </div>
      )}

      {/* REQUESTS LIST TAB VIEW */}
      {filterTab === 'requests' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Pending Message Requests
          </span>
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-400" />
              <p>No pending message requests.</p>
              <p className="text-[11px] text-slate-500 mt-1">When someone enters your mobile number, requests appear here.</p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const sender = store.getUserById(req.senderId);
              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-[#101422] border border-purple-500/30 shadow-lg space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl flex-shrink-0">
                      {sender?.avatar || '👤'}
                    </div>
                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <span className="text-sm font-bold text-white truncate">{sender?.nickname || 'Friend'}</span>
                      <span className="text-xs text-purple-300 font-mono">Mobile: {sender?.phone || 'Unknown'}</span>
                      <span className="text-[10px] text-slate-400">Wants to start a conversation with you</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="flex-1 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      <span>Decline</span>
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm shadow-purple-600/30 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CONVERSATIONS LIST */
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-3xl">
                📱
              </div>
              <div className="space-y-1 max-w-xs">
                <p className="font-semibold text-white">No Conversations Yet</p>
                <p className="text-[11px] text-slate-400">
                  Enter your friend's mobile number to send them a chat request and start talking!
                </p>
              </div>
              <button
                onClick={onOpenNewChatByPhone}
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer mt-2"
              >
                <Phone className="w-4 h-4" />
                <span>Enter Mobile Number</span>
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = activeConversationId === conv.id;
              let title = '';
              let avatar = '';
              let isOnline = false;
              let memberCountText = '';
              let phoneDisplay = '';

              if (conv.type === 'direct') {
                const peerId = conv.participantIds.find(id => id !== currentUser?.id);
                const peer = store.getUserById(peerId);
                title = store.getDisplayName(peer);
                avatar = peer?.avatar || '👤';
                isOnline = peer?.status === 'online';
                phoneDisplay = peer?.phone || '';
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
                      className="p-1.5 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
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
                      className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
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
      )}
    </div>
  );
}
