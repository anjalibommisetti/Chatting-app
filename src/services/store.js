// ==============================================================================
// VibeConnect — Core State Management, Persistence & Business Logic
// ==============================================================================

import { sound } from './audio';

// Pre-seeded Demo Friends & Users
const INITIAL_USERS = [
  {
    id: 'usr_anju',
    email: 'anju@vibeconnect.io',
    username: 'anju',
    nickname: 'Anju',
    avatar: '🦊',
    bio: 'Building awesome apps with VibeConnect ✨',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_priya',
    email: 'priya@vibeconnect.io',
    username: 'priya_k',
    nickname: 'Priya',
    avatar: '🌸',
    bio: 'Coffee, code, and good vibes ☕',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_alex',
    email: 'alex@vibeconnect.io',
    username: 'alex_dev',
    nickname: 'Alex',
    avatar: '⚡',
    bio: 'Always up for a quick call 🎧',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_sam',
    email: 'sam@vibeconnect.io',
    username: 'sammy',
    nickname: 'Sammy',
    avatar: '🚀',
    bio: 'Exploring new technologies!',
    status: 'away',
    lastSeen: '10m ago'
  },
  {
    id: 'usr_jordan',
    email: 'jordan@vibeconnect.io',
    username: 'jordan_b',
    nickname: 'Jordy',
    avatar: '🦁',
    bio: 'Design enthusiast & gamer 🎮',
    status: 'offline',
    lastSeen: '1h ago'
  }
];

const INITIAL_GROUPS = [
  {
    id: 'grp_vibesquad',
    name: 'Vibe Squad 💜',
    avatar: '✨',
    creatorId: 'usr_anju',
    inviteCode: 'VIBE-779',
    maxMembers: 5,
    members: ['usr_anju', 'usr_priya', 'usr_alex'], // 3 members (limit is 5)
    createdAt: Date.now() - 86400000 * 3
  }
];

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv_priya',
    type: 'direct',
    participantIds: ['usr_anju', 'usr_priya'],
    groupId: null,
    isPinned: true,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    lastMessagePreview: 'Hey Anju! Are you free for a video call?',
    lastMessageTime: Date.now() - 1000 * 60 * 5
  },
  {
    id: 'conv_vibesquad',
    type: 'group',
    participantIds: ['usr_anju', 'usr_priya', 'usr_alex'],
    groupId: 'grp_vibesquad',
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 1,
    lastMessagePreview: 'Alex: Shared the presentation slides!',
    lastMessageTime: Date.now() - 1000 * 60 * 30
  },
  {
    id: 'conv_alex',
    type: 'direct',
    participantIds: ['usr_anju', 'usr_alex'],
    groupId: null,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCount: 0,
    lastMessagePreview: 'Voice call ended (14m 20s)',
    lastMessageTime: Date.now() - 1000 * 60 * 180
  }
];

const INITIAL_MESSAGES = [
  {
    id: 'msg_1',
    conversationId: 'conv_priya',
    senderId: 'usr_priya',
    text: 'Hey Anju! How is your day going?',
    timestamp: Date.now() - 1000 * 60 * 20,
    replyTo: null,
    reactions: { '❤️': ['usr_anju'] },
    isEdited: false
  },
  {
    id: 'msg_2',
    conversationId: 'conv_priya',
    senderId: 'usr_anju',
    text: 'Hey Priya! Pretty good, working on VibeConnect right now.',
    timestamp: Date.now() - 1000 * 60 * 15,
    replyTo: null,
    reactions: {},
    isEdited: false
  },
  {
    id: 'msg_3',
    conversationId: 'conv_priya',
    senderId: 'usr_priya',
    text: 'Awesome! Are you free for a video call?',
    timestamp: Date.now() - 1000 * 60 * 5,
    replyTo: null,
    reactions: { '👍': ['usr_anju'] },
    isEdited: false
  },
  {
    id: 'msg_4',
    conversationId: 'conv_vibesquad',
    senderId: 'usr_anju',
    text: 'Welcome everyone to the private group! Remember we keep it to a strict max of 5 members for privacy.',
    timestamp: Date.now() - 1000 * 60 * 60,
    replyTo: null,
    reactions: { '🔥': ['usr_alex', 'usr_priya'] },
    isEdited: false
  },
  {
    id: 'msg_5',
    conversationId: 'conv_vibesquad',
    senderId: 'usr_alex',
    text: 'Shared the presentation slides!',
    timestamp: Date.now() - 1000 * 60 * 30,
    replyTo: null,
    reactions: {},
    isEdited: false
  }
];

const INITIAL_CALL_LOGS = [
  {
    id: 'call_1',
    peerId: 'usr_priya',
    groupId: null,
    callType: 'video',
    status: 'completed',
    duration: 520, // seconds
    timestamp: Date.now() - 1000 * 60 * 120
  },
  {
    id: 'call_2',
    peerId: 'usr_alex',
    groupId: null,
    callType: 'voice',
    status: 'completed',
    duration: 860,
    timestamp: Date.now() - 1000 * 60 * 180
  },
  {
    id: 'call_3',
    peerId: 'usr_sam',
    groupId: null,
    callType: 'video',
    status: 'missed',
    duration: 0,
    timestamp: Date.now() - 1000 * 60 * 600
  }
];

class StoreService {
  constructor() {
    this.listeners = new Set();
    this.channel = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('vibeconnect_sync') : null;
    
    // Load from local storage or initialize
    this.currentUser = this.loadStorage('vibe_current_user', INITIAL_USERS[0]);
    this.users = this.loadStorage('vibe_users', INITIAL_USERS);
    this.groups = this.loadStorage('vibe_groups', INITIAL_GROUPS);
    this.conversations = this.loadStorage('vibe_conversations', INITIAL_CONVERSATIONS);
    this.messages = this.loadStorage('vibe_messages', INITIAL_MESSAGES);
    this.callLogs = this.loadStorage('vibe_call_logs', INITIAL_CALL_LOGS);
    this.friendNicknames = this.loadStorage('vibe_friend_nicknames', {}); // friendId -> custom nickname
    this.settings = this.loadStorage('vibe_settings', {
      readReceipts: true,
      soundAlerts: true,
      lastSeenPrivacy: 'everyone',
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
    this.friendNicknames = this.loadStorage('vibe_friend_nicknames', this.friendNicknames);
    this.settings = this.loadStorage('vibe_settings', this.settings);
    this.listeners.forEach(fn => fn());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============================================================================
  // AUTHENTICATION & PROFILES
  // ============================================================================

  signUp({ email, password, username, nickname, avatar }) {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      email: email.trim(),
      username: username.trim().toLowerCase(),
      nickname: (nickname || username).trim(),
      avatar: avatar || '🦊',
      bio: 'New member of VibeConnect ✨',
      status: 'online',
      lastSeen: 'Active now'
    };

    this.users.push(newUser);
    this.currentUser = newUser;
    this.notify();
    return newUser;
  }

  logIn({ email, password }) {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      // Auto-create convenience for testing or demo logins
      return this.signUp({
        email,
        password,
        username: email.split('@')[0],
        nickname: email.split('@')[0],
        avatar: '🦊'
      });
    }

    user.status = 'online';
    user.lastSeen = 'Active now';
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

    // Update in user list
    const idx = this.users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentUser };
    }
    this.notify();
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
    // 1. Check if current user gave this friend a custom personal nickname
    if (this.friendNicknames[user.id]) {
      return this.friendNicknames[user.id];
    }
    // 2. Fall back to user's own nickname or username
    return user.nickname || user.username || 'User';
  }

  getUserById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  // ============================================================================
  // PRIVATE GROUPS (STRICT 5-MEMBER MAXIMUM)
  // ============================================================================

  createGroup({ name, avatar, memberIds }) {
    if (!this.currentUser) throw new Error('You must be logged in.');

    // Ensure creator is in the members list
    const distinctMembers = Array.from(new Set([this.currentUser.id, ...(memberIds || [])]));

    // STRICT 5 MEMBER LIMIT ENFORCEMENT
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

    // Create corresponding group conversation
    const newConv = {
      id: 'conv_' + newGroup.id,
      type: 'group',
      participantIds: distinctMembers,
      groupId: newGroup.id,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      lastMessagePreview: `Group created by ${this.currentUser.nickname}`,
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

    // Check if already a member
    if (group.members.includes(this.currentUser.id)) {
      return group;
    }

    // STRICT 5-MEMBER ENFORCEMENT
    if (group.members.length >= 5) {
      throw new Error('This private group is full! It has reached the strict maximum limit of 5 members.');
    }

    group.members.push(this.currentUser.id);

    // Update conversation participants
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

    // STRICT 5-MEMBER ENFORCEMENT
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
        lastMessagePreview: 'Started a new conversation',
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

    // Update conversation metadata
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessagePreview = cleanText || (attachment ? `📎 ${attachment.name || 'Attachment'}` : 'New message');
      conv.lastMessageTime = Date.now();
      // Move conversation to top
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
      callType, // 'voice' | 'video'
      status, // 'completed' | 'missed' | 'declined'
      duration,
      timestamp: Date.now()
    };
    this.callLogs.unshift(newCall);
    this.notify();
  }
}

export const store = new StoreService();
