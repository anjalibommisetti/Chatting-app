// ==============================================================================
// VibeConnect — Core State Management, Mobile Number Discovery & Request Engine
// ==============================================================================

import { sound } from './audio';

// Pre-registered Directory of Sample Mobile Numbers for Local Testing
// In Supabase, this queries the `profiles` table directly.
const REGISTERED_USERS = [
  {
    id: 'usr_anju',
    phone: '9876543210',
    username: 'anju',
    nickname: 'Anju',
    avatar: '🦊',
    bio: 'Using VibeConnect ✨',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_priya',
    phone: '9876543211',
    username: 'priya',
    nickname: 'Priya',
    avatar: '🌸',
    bio: 'Coffee & Code ☕',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_alex',
    phone: '9876543212',
    username: 'alex',
    nickname: 'Alex',
    avatar: '⚡',
    bio: 'Available for video calls 🎧',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_sam',
    phone: '9876543213',
    username: 'sammy',
    nickname: 'Sammy',
    avatar: '🚀',
    bio: 'Exploring tech!',
    status: 'away',
    lastSeen: '10m ago'
  }
];

class StoreService {
  constructor() {
    this.listeners = new Set();
    this.channel = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('vibeconnect_sync') : null;
    
    // Clean initial state — NO fake random conversations or fake dummy messages!
    this.currentUser = this.loadStorage('vibe_current_user', REGISTERED_USERS[0]);
    this.users = this.loadStorage('vibe_users', REGISTERED_USERS);
    this.groups = this.loadStorage('vibe_groups', []);
    this.conversations = this.loadStorage('vibe_conversations', []);
    this.messages = this.loadStorage('vibe_messages', []);
    this.callLogs = this.loadStorage('vibe_call_logs', []);
    this.chatRequests = this.loadStorage('vibe_chat_requests', []);
    this.friendNicknames = this.loadStorage('vibe_friend_nicknames', {}); // friendId -> custom nickname
    this.settings = this.loadStorage('vibe_settings', {
      readReceipts: true,
      soundAlerts: true,
      theme: 'dark'
    });

    if (this.channel) {
      this.channel.onmessage = (event) => {
        if (event.data && event.data.type === 'STORE_SYNC') {
          this.syncFromExternal();
        }
      };
    }
  }

  loadStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  notify() {
    this.saveStorage('vibe_current_user', this.currentUser);
    this.saveStorage('vibe_users', this.users);
    this.saveStorage('vibe_groups', this.groups);
    this.saveStorage('vibe_conversations', this.conversations);
    this.saveStorage('vibe_messages', this.messages);
    this.saveStorage('vibe_call_logs', this.callLogs);
    this.saveStorage('vibe_chat_requests', this.chatRequests);
    this.saveStorage('vibe_friend_nicknames', this.friendNicknames);
    this.saveStorage('vibe_settings', this.settings);

    if (this.channel) {
      this.channel.postMessage({ type: 'STORE_SYNC' });
    }

    this.listeners.forEach(fn => fn());
  }

  syncFromExternal() {
    this.currentUser = this.loadStorage('vibe_current_user', this.currentUser);
    this.users = this.loadStorage('vibe_users', this.users);
    this.groups = this.loadStorage('vibe_groups', this.groups);
    this.conversations = this.loadStorage('vibe_conversations', this.conversations);
    this.messages = this.loadStorage('vibe_messages', this.messages);
    this.callLogs = this.loadStorage('vibe_call_logs', this.callLogs);
    this.chatRequests = this.loadStorage('vibe_chat_requests', this.chatRequests);
    this.friendNicknames = this.loadStorage('vibe_friend_nicknames', this.friendNicknames);
    this.settings = this.loadStorage('vibe_settings', this.settings);
    this.listeners.forEach(fn => fn());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============================================================================
  // PHONE NUMBER AUTH & REGISTRATION
  // ============================================================================

  loginWithPhone({ phone, name, avatar }) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    // Check if phone already registered
    let user = this.users.find(u => u.phone === cleanPhone);

    if (!user) {
      // Create new user profile with this phone number
      const nickname = (name || 'User ' + cleanPhone.slice(-4)).trim();
      user = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        phone: cleanPhone,
        username: nickname.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user' + cleanPhone.slice(-4),
        nickname: nickname,
        avatar: avatar || '🦊',
        bio: 'Using VibeConnect ✨',
        status: 'online',
        lastSeen: 'Active now'
      };
      this.users.push(user);
    } else {
      user.status = 'online';
      user.lastSeen = 'Active now';
      if (name && name.trim()) user.nickname = name.trim();
      if (avatar) user.avatar = avatar;
    }

    this.currentUser = user;
    this.notify();
    return user;
  }

  quickSwitchUser(userId) {
    const target = this.users.find(u => u.id === userId);
    if (target) {
      this.currentUser = target;
      target.status = 'online';
      this.notify();
    }
  }

  logOut() {
    if (this.currentUser) {
      this.currentUser.status = 'offline';
      this.currentUser.lastSeen = 'Just now';
    }
    this.currentUser = null;
    this.notify();
  }

  updateProfile({ nickname, bio, avatar, status }) {
    if (!this.currentUser) return;
    if (nickname !== undefined) this.currentUser.nickname = nickname.trim();
    if (bio !== undefined) this.currentUser.bio = bio.trim();
    if (avatar !== undefined) this.currentUser.avatar = avatar;
    if (status !== undefined) this.currentUser.status = status;

    const idx = this.users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentUser };
    }
    this.notify();
  }

  // ============================================================================
  // FIND BY MOBILE NUMBER & MESSAGE REQUESTS
  // ============================================================================

  findUserByPhone(phone) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;
    return this.users.find(u => u.phone === cleanPhone) || null;
  }

  sendChatRequest(targetPhone) {
    if (!this.currentUser) throw new Error('Please log in first.');

    const cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    if (this.currentUser.phone === cleanPhone) {
      throw new Error('You cannot send a chat request to your own mobile number.');
    }

    const targetUser = this.findUserByPhone(cleanPhone);
    if (!targetUser) {
      throw new Error(`No user registered with mobile number "${cleanPhone}". Ask your friend to open VibeConnect and enter their number!`);
    }

    // Check if conversation already exists
    const existingConv = this.conversations.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(this.currentUser.id) && 
      c.participantIds.includes(targetUser.id)
    );
    if (existingConv) {
      return { status: 'already_connected', conversation: existingConv };
    }

    // Check if request already pending
    const existingReq = this.chatRequests.find(r => 
      r.status === 'pending' && 
      ((r.senderId === this.currentUser.id && r.receiverId === targetUser.id) ||
       (r.senderId === targetUser.id && r.receiverId === this.currentUser.id))
    );
    if (existingReq) {
      throw new Error(`A chat request with ${targetUser.nickname} is already pending!`);
    }

    const newReq = {
      id: 'req_' + Date.now(),
      senderId: this.currentUser.id,
      receiverId: targetUser.id,
      status: 'pending',
      createdAt: Date.now()
    };

    this.chatRequests.unshift(newReq);
    this.notify();
    return { status: 'sent', targetUser };
  }

  acceptChatRequest(requestId) {
    const req = this.chatRequests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'accepted';

    // Create 1-on-1 direct conversation between the two users!
    const sender = this.getUserById(req.senderId);
    const receiver = this.getUserById(req.receiverId);

    let conv = this.conversations.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(req.senderId) && 
      c.participantIds.includes(req.receiverId)
    );

    if (!conv) {
      conv = {
        id: 'conv_' + Date.now() + '_' + req.senderId,
        type: 'direct',
        participantIds: [req.senderId, req.receiverId],
        groupId: null,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        unreadCount: 0,
        lastMessagePreview: 'Chat request accepted! Say hello 👋',
        lastMessageTime: Date.now()
      };
      this.conversations.unshift(conv);

      // Add a system welcome message
      this.messages.push({
        id: 'msg_welcome_' + Date.now(),
        conversationId: conv.id,
        senderId: req.senderId,
        text: '👋 Hey! Chat request accepted. We can now chat, voice call, and video call.',
        timestamp: Date.now(),
        replyTo: null,
        reactions: {},
        isEdited: false
      });
    }

    sound.playCallConnected();
    this.notify();
    return conv;
  }

  declineChatRequest(requestId) {
    this.chatRequests = this.chatRequests.filter(r => r.id !== requestId);
    this.notify();
  }

  getPendingRequestsForMe() {
    if (!this.currentUser) return [];
    return this.chatRequests.filter(r => r.receiverId === this.currentUser.id && r.status === 'pending');
  }

  // ============================================================================
  // NICKNAMES & CONTACTS
  // ============================================================================

  setFriendNickname(friendId, nickname) {
    if (!nickname || !nickname.trim()) {
      delete this.friendNicknames[friendId];
    } else {
      this.friendNicknames[friendId] = nickname.trim();
    }
    this.notify();
  }

  getDisplayName(user) {
    if (!user) return 'Unknown';
    if (this.friendNicknames[user.id]) {
      return this.friendNicknames[user.id];
    }
    return user.nickname || user.username || user.phone || 'User';
  }

  getUserById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  // ============================================================================
  // PRIVATE GROUPS (STRICT 5-MEMBER MAXIMUM)
  // ============================================================================

  createGroup({ name, avatar, memberIds }) {
    if (!this.currentUser) throw new Error('You must be logged in.');

    const distinctMembers = Array.from(new Set([this.currentUser.id, ...(memberIds || [])]));

    if (distinctMembers.length > 5) {
      throw new Error('Group limit exceeded! Private groups cannot have more than 5 members (including creator).');
    }

    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    let code = 'VIBE-';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));

    const newGroup = {
      id: 'grp_' + Date.now(),
      name: name.trim(),
      avatar: avatar || '✨',
      creatorId: this.currentUser.id,
      inviteCode: code,
      maxMembers: 5,
      members: distinctMembers,
      createdAt: Date.now()
    };

    this.groups.push(newGroup);

    const newConv = {
      id: 'conv_' + newGroup.id,
      type: 'group',
      participantIds: distinctMembers,
      groupId: newGroup.id,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      lastMessagePreview: `Private group created by ${this.currentUser.nickname}`,
      lastMessageTime: Date.now()
    };
    this.conversations.unshift(newConv);

    this.notify();
    return newGroup;
  }

  joinGroupByCode(inviteCode) {
    if (!this.currentUser) throw new Error('You must be logged in.');
    const cleanCode = (inviteCode || '').trim().toUpperCase();

    const group = this.groups.find(g => g.inviteCode.toUpperCase() === cleanCode);
    if (!group) {
      throw new Error('Invalid invite code! No group found with this code.');
    }

    if (group.members.includes(this.currentUser.id)) {
      return group;
    }

    // STRICT 5-MEMBER ENFORCEMENT
    if (group.members.length >= 5) {
      throw new Error('This private group is full! It has reached the strict maximum limit of 5 members.');
    }

    group.members.push(this.currentUser.id);

    const conv = this.conversations.find(c => c.groupId === group.id);
    if (conv && !conv.participantIds.includes(this.currentUser.id)) {
      conv.participantIds.push(this.currentUser.id);
    }

    this.notify();
    return group;
  }

  addMemberToGroup(groupId, userId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');

    if (group.members.includes(userId)) return group;

    if (group.members.length >= 5) {
      throw new Error('Cannot add member: This group already has 5 members (maximum allowed).');
    }

    group.members.push(userId);
    const conv = this.conversations.find(c => c.groupId === groupId);
    if (conv && !conv.participantIds.includes(userId)) {
      conv.participantIds.push(userId);
    }

    this.notify();
    return group;
  }

  removeMemberFromGroup(groupId, userId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found.');

    group.members = group.members.filter(id => id !== userId);
    const conv = this.conversations.find(c => c.groupId === groupId);
    if (conv) {
      conv.participantIds = conv.participantIds.filter(id => id !== userId);
    }

    this.notify();
  }

  // ============================================================================
  // CONVERSATIONS & CHAT
  // ============================================================================

  getDirectConversation(targetUserId) {
    if (!this.currentUser) return null;
    let conv = this.conversations.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(this.currentUser.id) && 
      c.participantIds.includes(targetUserId)
    );

    if (!conv) {
      conv = {
        id: 'conv_' + Date.now() + '_' + targetUserId,
        type: 'direct',
        participantIds: [this.currentUser.id, targetUserId],
        groupId: null,
        isPinned: false,
        isMuted: false,
        isArchived: false,
        unreadCount: 0,
        lastMessagePreview: 'Started chat',
        lastMessageTime: Date.now()
      };
      this.conversations.unshift(conv);
      this.notify();
    }
    return conv;
  }

  sendMessage({ conversationId, text, attachment, replyToId }) {
    if (!this.currentUser) return null;
    const cleanText = (text || '').trim();
    if (!cleanText && !attachment) return null;

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      conversationId,
      senderId: this.currentUser.id,
      text: cleanText,
      attachment: attachment || null,
      replyTo: replyToId ? (this.messages.find(m => m.id === replyToId) || null) : null,
      timestamp: Date.now(),
      reactions: {},
      isEdited: false
    };

    this.messages.push(newMsg);

    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessagePreview = cleanText || (attachment ? `📎 ${attachment.name || 'Attachment'}` : 'New message');
      conv.lastMessageTime = Date.now();
      this.conversations = [conv, ...this.conversations.filter(c => c.id !== conversationId)];
    }

    sound.playMessageSent();
    this.notify();
    return newMsg;
  }

  editMessage(messageId, newText) {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== this.currentUser?.id) return;
    msg.text = newText.trim();
    msg.isEdited = true;
    this.notify();
  }

  deleteMessage(messageId) {
    this.messages = this.messages.filter(m => m.id !== messageId);
    this.notify();
  }

  toggleReaction(messageId, emoji) {
    if (!this.currentUser) return;
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const uid = this.currentUser.id;
    if (msg.reactions[emoji].includes(uid)) {
      msg.reactions[emoji] = msg.reactions[emoji].filter(id => id !== uid);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(uid);
    }

    this.notify();
  }

  markConversationRead(conversationId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.notify();
    }
  }

  togglePin(conversationId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      this.notify();
    }
  }

  toggleMute(conversationId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isMuted = !conv.isMuted;
      this.notify();
    }
  }

  toggleArchive(conversationId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.isArchived = !conv.isArchived;
      this.notify();
    }
  }

  // ============================================================================
  // CALL LOGS
  // ============================================================================

  logCall({ peerId, groupId, callType, status, duration = 0 }) {
    const newCall = {
      id: 'call_' + Date.now(),
      peerId: peerId || null,
      groupId: groupId || null,
      callType,
      status,
      duration,
      timestamp: Date.now()
    };
    this.callLogs.unshift(newCall);
    this.notify();
  }
}

export const store = new StoreService();
