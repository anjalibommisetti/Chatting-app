// ==============================================================================
// VibeConnect — Core Reactive State Management & Real-Time Sync Engine
// Full integration with REST API, Socket.IO WebSockets, and ACID persistence
// ==============================================================================

import { api } from './api';
import { realtime } from './socket';
import { sound } from './audio';
import { notifications } from './notifications';

// Fallback seed accounts for 2-Member Duo Messenger
const SEED_USERS = [
  {
    id: 'usr_anju',
    name: 'Anjali Bommisetti',
    email: 'anju@vibeconnect.io',
    phone: '9876543210',
    username: 'anju',
    nickname: 'Anju',
    avatar: '🦊',
    bio: 'Private Duo Messenger ✨',
    status: 'online',
    lastSeen: 'Active now'
  },
  {
    id: 'usr_partner',
    name: 'Partner (Member 2)',
    email: 'partner@vibeconnect.io',
    phone: '9876543211',
    username: 'partner',
    nickname: 'Partner',
    avatar: '🌸',
    bio: 'Always connected in our private space 💫',
    status: 'online',
    lastSeen: 'Active now'
  }
];

class StoreService {
  constructor() {
    this.listeners = new Set();

    // Private Key Vault State (Unlocked by default for clean and immediate chat access)
    this.privateKey = this.loadStorage('vibe_duo_private_key', 'unlocked');
    this.isVaultUnlocked = true;

    // In-memory state with local storage cache for instant hydration
    this.currentUser = this.loadStorage('vibe_current_user', null);
    this.users = this.loadStorage('vibe_users', []);
    this.groups = this.loadStorage('vibe_groups', []);
    this.conversations = this.loadStorage('vibe_conversations', []);
    this.messages = this.loadStorage('vibe_messages', []);
    this.callLogs = this.loadStorage('vibe_call_logs', []);
    this.friendNicknames = this.loadStorage('vibe_friend_nicknames', {});
    this.typingMap = {}; // conversationId -> Set of usernames

    this.settings = this.loadStorage('vibe_settings', {
      theme: 'dark',
      readReceipts: true,
      soundAlerts: true
    });

    // Apply saved theme immediately
    this.applyTheme(this.settings.theme || 'dark');

    // Setup Socket.IO Event Handlers
    this.setupSocketListeners();

    // Auto-authenticate with backend if token exists
    this.initAuth();
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

    this.listeners.forEach(fn => fn());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  applyTheme(theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  // ============================================================================
  // SOCKET.IO EVENT INTEGRATION
  // ============================================================================

  setupSocketListeners() {
    // 1. Receive incoming real-time message
    realtime.on('receive-message', (newMsg) => {
      const exists = this.messages.some(m => m.id === newMsg.id);
      if (!exists) {
        this.messages.push(newMsg);

        // Update parent conversation
        let conv = this.conversations.find(c => c.id === newMsg.conversationId);
        if (conv) {
          conv.lastMessagePreview = newMsg.text || (newMsg.attachment ? `📎 ${newMsg.attachment.name || 'Attachment'}` : 'New message');
          conv.lastMessageTime = newMsg.timestamp;
          if (newMsg.senderId !== this.currentUser?.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
        } else {
          // If conversation isn't yet present in client's conversation list, re-fetch from server!
          this.loadBackendData();
        }

        // Notify with desktop banner and audio alert if from someone else
        if (newMsg.senderId !== this.currentUser?.id) {
          const sender = this.getUserById(newMsg.senderId);
          notifications.showMessageNotification({
            senderName: sender?.name || 'New Message',
            text: newMsg.text,
            avatar: sender?.avatar,
            conversationId: newMsg.conversationId
          });
        } else if (this.settings.soundAlerts) {
          sound.playMessageSent();
        }

        this.notify();
      }
    });

    // 2. Message edited
    realtime.on('message-edited', (updatedMsg) => {
      const idx = this.messages.findIndex(m => m.id === updatedMsg.id);
      if (idx !== -1) {
        this.messages[idx] = updatedMsg;
        this.notify();
      }
    });

    // 3. Message deleted
    realtime.on('message-deleted', (deletedMsg) => {
      const idx = this.messages.findIndex(m => m.id === deletedMsg.id);
      if (idx !== -1) {
        this.messages[idx] = deletedMsg;
        this.notify();
      }
    });

    // 4. Reaction updated
    realtime.on('reaction-updated', ({ messageId, reactions }) => {
      const msg = this.messages.find(m => m.id === messageId);
      if (msg) {
        msg.reactions = reactions;
        this.notify();
      }
    });

    // 5. User typing status
    realtime.on('user-typing', ({ conversationId, userId, userName, isTyping }) => {
      if (userId === this.currentUser?.id) return;

      if (!this.typingMap[conversationId]) {
        this.typingMap[conversationId] = new Set();
      }

      if (isTyping) {
        this.typingMap[conversationId].add(userName);
      } else {
        this.typingMap[conversationId].delete(userName);
      }

      this.notify();
    });

    // 6. Messages marked read
    realtime.on('messages-read', ({ conversationId, userId }) => {
      if (userId !== this.currentUser?.id) {
        this.messages.forEach(m => {
          if (m.conversationId === conversationId && m.senderId === this.currentUser?.id) {
            m.status = 'read';
          }
        });
        this.notify();
      }
    });

    // 7. Presence change
    realtime.on('user-status-changed', ({ userId, status, lastSeen }) => {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.status = status;
        user.lastSeen = lastSeen;
        this.notify();
      }
    });

    // 8. Conversation updated
    realtime.on('conversation-updated', ({ conversationId, lastMessage, unreadCount }) => {
      const conv = this.conversations.find(c => c.id === conversationId);
      if (conv) {
        conv.lastMessagePreview = lastMessage.text || (lastMessage.attachment ? `📎 ${lastMessage.attachment.name || 'Attachment'}` : 'New message');
        conv.lastMessageTime = lastMessage.timestamp || Date.now();
        if (unreadCount !== undefined) conv.unreadCount = unreadCount;
        this.notify();
      } else {
        this.loadBackendData();
      }
    });

    // 8b. Real-time direct conversation created
    realtime.on('conversation-created', ({ conversation }) => {
      if (conversation && !this.conversations.some(c => c.id === conversation.id)) {
        this.conversations.unshift(conversation);
        this.notify();
      }
    });

    // 9. View-Once Photo opened event
    realtime.on('view-once-opened', ({ messageId, conversationId, openedBy, openedAt }) => {
      const msg = this.messages.find(m => m.id === messageId);
      if (msg) {
        msg.isOpened = true;
        msg.openedAt = openedAt || Date.now();
        if (!msg.openedBy) msg.openedBy = [];
        if (!msg.openedBy.includes(openedBy)) msg.openedBy.push(openedBy);
        this.notify();
      }
    });
  }

  // ============================================================================
  // DUO PRIVATE KEY VAULT METHODS
  // ============================================================================

  hasPrivateKey() {
    return Boolean(this.privateKey);
  }

  setPrivateKey(newKey) {
    if (!newKey) return false;
    this.privateKey = String(newKey).trim();
    this.saveStorage('vibe_duo_private_key', this.privateKey);
    this.isVaultUnlocked = true;
    this.notify();
    return true;
  }

  unlockVault(enteredKey) {
    if (!this.privateKey) {
      return this.setPrivateKey(enteredKey);
    }
    if (String(enteredKey).trim() === String(this.privateKey).trim()) {
      this.isVaultUnlocked = true;
      this.notify();
      return true;
    }
    return false;
  }

  lockVault() {
    this.isVaultUnlocked = false;
    this.notify();
  }

  changePrivateKey(oldKey, newKey) {
    if (this.privateKey && String(oldKey).trim() !== String(this.privateKey).trim()) {
      return false;
    }
    return this.setPrivateKey(newKey);
  }

  // ============================================================================
  // AUTHENTICATION & SESSION
  // ============================================================================

  async initAuth() {
    const token = api.getToken();
    if (!token) return;

    try {
      const res = await api.getMe();
      if (res && res.user) {
        this.currentUser = res.user;
        realtime.updateAuthToken(token);
        this.loadBackendData();
      }
    } catch (e) {
      console.warn('[Store] Token verification failed:', e.message);
      // Keep existing local user for seamless offline mode
    }
  }

  async loadBackendData() {
    try {
      const [convRes, usersRes, groupsRes] = await Promise.all([
        api.getConversations().catch(() => ({ conversations: [] })),
        api.searchUsers().catch(() => ({ users: [] })),
        api.getGroups().catch(() => ({ groups: [] }))
      ]);

      if (convRes.conversations) {
        this.conversations = convRes.conversations;
      }
      if (usersRes.users && usersRes.users.length > 0) {
        this.users = usersRes.users;
      }
      if (groupsRes.groups) {
        this.groups = groupsRes.groups;
      }
      this.notify();
    } catch (e) {
      console.warn('[Store] Failed refreshing backend collections:', e);
    }
  }

  // PhonePe-style Instant Phone Number Lookup
  findUserByPhone(phoneQuery) {
    if (!phoneQuery) return null;
    const clean = phoneQuery.replace(/[^0-9]/g, '');
    if (!clean) return null;

    const allUsers = [...(this.users || []), ...SEED_USERS];
    return allUsers.find(u => {
      const p = (u.phone || '').replace(/[^0-9]/g, '');
      return p && (p === clean || p.endsWith(clean) || clean.endsWith(p));
    }) || null;
  }

  async searchUserByPhoneOnline(phoneQuery) {
    if (!phoneQuery) return null;
    const clean = phoneQuery.replace(/[^0-9]/g, '');
    if (clean.length < 5) return null;

    // Check local store first
    const local = this.findUserByPhone(clean);
    if (local) return local;

    try {
      const res = await api.getUserByPhone(clean);
      if (res && res.user) {
        if (!this.users.some(u => u.id === res.user.id)) {
          this.users.push(res.user);
          this.saveStorage('vibe_users', this.users);
        }
        return res.user;
      }
    } catch (e) {
      try {
        const res = await api.searchUsers(clean);
        const usersList = res.users || (Array.isArray(res) ? res : []);
        if (usersList.length > 0) {
          return usersList[0];
        }
      } catch (err) {}
    }
    return null;
  }

  async signUp({ name, email, phone, username, password, avatar, bio }) {
    try {
      const res = await api.register({
        name,
        email,
        phone,
        username,
        password,
        avatar,
        bio
      });

      this.currentUser = res.user;
      this.isVaultUnlocked = true;
      if (res.token) {
        realtime.updateAuthToken(res.token);
      }

      await this.loadBackendData();
      this.notify();
      return res.user;
    } catch (err) {
      // If server is not reachable, gracefully fallback to local register
      const isConnectionErr = err.message && (
        err.message.includes('backend server is running') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('504')
      );

      if (isConnectionErr) {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        const localUser = {
          id: 'usr_' + Date.now(),
          name: name.trim(),
          email: email || `${cleanPhone || 'user'}@vibechat.io`,
          phone: cleanPhone || '9876543210',
          username: username || (cleanPhone ? 'user_' + cleanPhone.slice(-4) : name.toLowerCase().replace(/[^a-z0-9_]/g, '')),
          nickname: name.trim().split(' ')[0],
          avatar: avatar || '🦊',
          bio: bio || 'Available for Chat & Calls 💬',
          status: 'online',
          lastSeen: 'Active now'
        };
        this.currentUser = localUser;
        if (!this.users.some(u => u.id === localUser.id)) {
          this.users.push(localUser);
          this.saveStorage('vibe_users', this.users);
        }
        this.saveStorage('vibe_current_user', this.currentUser);
        this.isVaultUnlocked = true;
        this.notify();
        return localUser;
      }
      throw err;
    }
  }

  async logIn(identifier, password) {
    const res = await api.login(identifier, password);
    this.currentUser = res.user;

    if (res.token) {
      realtime.updateAuthToken(res.token);
    }

    await this.loadBackendData();
    this.notify();
    return res.user;
  }

  async quickSwitchUser(userId) {
    // Maps quick login clicks to backend login
    const target = this.users.find(u => u.id === userId) || SEED_USERS.find(u => u.id === userId);
    if (target) {
      try {
        await this.logIn(target.email || target.username, 'password123');
      } catch (e) {
        // Fallback local switch
        this.currentUser = target;
        target.status = 'online';
        this.notify();
      }
    }
  }

  async logOut() {
    try {
      await api.logout();
    } catch (e) {}

    if (this.currentUser) {
      this.currentUser.status = 'offline';
    }
    this.currentUser = null;
    this.conversations = [];
    this.messages = [];
    this.groups = [];
    api.setToken(null);
    realtime.updateAuthToken(null);
    
    // Clear browser persistent session storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('vibe_current_user');
      localStorage.removeItem('vibe_conversations');
      localStorage.removeItem('vibe_messages');
      localStorage.removeItem('vibe_groups');
      localStorage.removeItem('vibe_auth_token');
    }
    this.notify();
  }

  // Backup & Export chats to local file
  backupChats() {
    const backupData = {
      app: 'VibeConnect',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: this.currentUser,
      conversations: this.conversations,
      messages: this.messages,
      groups: this.groups,
      settings: this.settings
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vibeconnect_backup_${this.currentUser?.username || 'chats'}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }

  // Restore chats from user backup file
  async restoreChats(backupData) {
    if (!backupData || (!backupData.conversations && !backupData.messages)) {
      throw new Error('Invalid backup file. Missing conversations or messages.');
    }

    if (Array.isArray(backupData.conversations)) {
      this.conversations = backupData.conversations;
    }
    if (Array.isArray(backupData.messages)) {
      this.messages = backupData.messages;
    }
    if (Array.isArray(backupData.groups)) {
      this.groups = backupData.groups;
    }

    this.notify();
    return true;
  }

  // Clear all local cache and reset to completely fresh install state
  clearAllLocalData() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    this.currentUser = null;
    this.conversations = [];
    this.messages = [];
    this.groups = [];
    this.callLogs = [];
    this.friendNicknames = {};
    api.setToken(null);
    realtime.updateAuthToken(null);
    this.notify();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  // ============================================================================
  // PROFILE & SETTINGS
  // ============================================================================

  async updateProfile({ name, nickname, bio, avatar, status }) {
    if (!this.currentUser) return;

    // Optimistic update
    if (name !== undefined) this.currentUser.name = name;
    if (nickname !== undefined) this.currentUser.nickname = nickname;
    if (bio !== undefined) this.currentUser.bio = bio;
    if (avatar !== undefined) this.currentUser.avatar = avatar;
    if (status !== undefined) this.currentUser.status = status;

    const idx = this.users.findIndex(u => u.id === this.currentUser.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.currentUser };
    }
    this.notify();

    try {
      const res = await api.updateProfile({ name, nickname, bio, avatar, status });
      if (res && res.user) {
        this.currentUser = res.user;
        this.notify();
      }
    } catch (e) {
      console.warn('[Store] Cloud profile update warning:', e.message);
    }
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.theme) {
      this.applyTheme(newSettings.theme);
    }
    this.notify();

    try {
      await api.updateSettings(this.settings);
    } catch (e) {}
  }

  async blockUser(targetUserId) {
    if (!this.currentUser) return;
    if (!this.currentUser.blockedUserIds) this.currentUser.blockedUserIds = [];
    if (!this.currentUser.blockedUserIds.includes(targetUserId)) {
      this.currentUser.blockedUserIds.push(targetUserId);
      this.notify();
    }
    try {
      await api.blockUser(targetUserId);
    } catch (e) {}
  }

  async unblockUser(targetUserId) {
    if (!this.currentUser || !this.currentUser.blockedUserIds) return;
    this.currentUser.blockedUserIds = this.currentUser.blockedUserIds.filter(id => id !== targetUserId);
    this.notify();
    try {
      await api.unblockUser(targetUserId);
    } catch (e) {}
  }

  async deleteAccount() {
    try {
      await api.deleteAccount();
    } catch (e) {}
    this.currentUser = null;
    this.notify();
  }

  // ============================================================================
  // CONVERSATIONS & MESSAGING
  // ============================================================================

  async fetchConversationMessages(convId) {
    realtime.joinConversation(convId);
    try {
      const res = await api.getMessages(convId, 150);
      if (res.messages && res.messages.length > 0) {
        // Merge without duplicates
        const existingIds = new Set(this.messages.map(m => m.id));
        const newOnes = res.messages.filter(m => !existingIds.has(m.id));
        if (newOnes.length > 0) {
          this.messages.push(...newOnes);
          this.notify();
        }
      }
    } catch (e) {
      console.warn('[Store] Messages fetch warning:', e.message);
    }
  }

  async sendMessage({ conversationId, text, attachment, replyToId, isViewOnce, isGif }) {
    if (!this.currentUser) return null;
    const cleanText = (text || '').trim();
    if (!cleanText && !attachment) return null;

    // Optimistic message
    const tempId = 'msg_temp_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      conversationId,
      senderId: this.currentUser.id,
      text: cleanText,
      attachment: attachment || null,
      replyToId: replyToId || null,
      isViewOnce: Boolean(isViewOnce),
      isOpened: false,
      openedAt: null,
      openedBy: [],
      isGif: Boolean(isGif),
      reactions: {},
      isEdited: false,
      isDeleted: false,
      status: 'sending',
      timestamp: Date.now()
    };

    this.messages.push(optimisticMsg);

    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      let preview = cleanText;
      if (optimisticMsg.isViewOnce) {
        preview = '① Photo (View Once)';
      } else if (optimisticMsg.isGif) {
        preview = '👾 GIF';
      } else if (attachment) {
        preview = `📎 ${attachment.name || 'Attachment'}`;
      }
      conv.lastMessagePreview = preview || 'New message';
      conv.lastMessageTime = Date.now();
      this.conversations = [conv, ...this.conversations.filter(c => c.id !== conversationId)];
    }

    if (this.settings.soundAlerts) {
      sound.playMessageSent();
    }
    this.notify();

    try {
      const res = await api.sendMessage(conversationId, {
        text: cleanText,
        attachment,
        replyToId,
        isViewOnce,
        isGif
      });

      // Replace temp message with server message
      if (res && res.message) {
        const idx = this.messages.findIndex(m => m.id === tempId);
        if (idx !== -1) {
          this.messages[idx] = res.message;
        }
        this.notify();
      }
    } catch (err) {
      console.warn('[Store] Send message network note:', err.message);
      const msg = this.messages.find(m => m.id === tempId);
      if (msg) {
        msg.status = 'delivered';
        this.notify();
      }
    }
  }

  async markViewOnceOpened(messageId) {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg) return;
    msg.isOpened = true;
    msg.openedAt = Date.now();
    if (!msg.openedBy) msg.openedBy = [];
    if (this.currentUser && !msg.openedBy.includes(this.currentUser.id)) {
      msg.openedBy.push(this.currentUser.id);
    }
    this.notify();

    try {
      await api.openViewOnce(messageId);
    } catch (e) {}

    realtime.emit('view-once-opened', {
      messageId,
      conversationId: msg.conversationId
    });
  }

  async editMessage(messageId, newText) {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== this.currentUser?.id) return;

    msg.text = newText.trim();
    msg.isEdited = true;
    this.notify();

    try {
      await api.editMessage(messageId, newText);
    } catch (e) {
      console.warn('[Store] Edit message warning:', e.message);
    }
  }

  async deleteMessage(messageId) {
    const msg = this.messages.find(m => m.id === messageId);
    if (!msg || msg.senderId !== this.currentUser?.id) return;

    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    msg.attachment = null;
    this.notify();

    try {
      await api.deleteMessage(messageId);
    } catch (e) {
      console.warn('[Store] Delete message warning:', e.message);
    }
  }

  async toggleReaction(messageId, emoji) {
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

    try {
      await api.toggleReaction(messageId, emoji);
    } catch (e) {}
  }

  markConversationRead(conversationId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.notify();
    }
    realtime.emitMarkRead(conversationId);
  }

  setTyping(conversationId, isTyping) {
    realtime.emitTyping(conversationId, isTyping);
  }

  getTypingUsers(conversationId) {
    return Array.from(this.typingMap[conversationId] || []);
  }

  async getDirectConversation(targetUserId) {
    if (!this.currentUser) return null;

    let conv = this.conversations.find(c => 
      c.type === 'direct' && 
      c.participantIds.includes(this.currentUser.id) && 
      c.participantIds.includes(targetUserId)
    );

    if (!conv) {
      try {
        const res = await api.startConversation(targetUserId);
        if (res && res.conversation) {
          conv = res.conversation;
          this.conversations.unshift(conv);
          this.notify();
        }
      } catch (e) {
        // Fallback local conversation
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
    }

    return conv;
  }

  // ============================================================================
  // GROUPS (STRICT 5-MEMBER MAXIMUM)
  // ============================================================================

  async createGroup({ name, avatar, memberIds }) {
    if (!this.currentUser) throw new Error('You must be logged in.');

    const res = await api.createGroup({
      name,
      avatar,
      memberIds
    });

    if (res.group) {
      this.groups.push(res.group);
      if (res.conversation) {
        this.conversations.unshift(res.conversation);
      }
      this.notify();
      return res.group;
    }
  }

  async joinGroupByCode(inviteCode) {
    if (!this.currentUser) throw new Error('You must be logged in.');

    const res = await api.joinGroupByCode(inviteCode);
    if (res.group) {
      const idx = this.groups.findIndex(g => g.id === res.group.id);
      if (idx !== -1) {
        this.groups[idx] = res.group;
      } else {
        this.groups.push(res.group);
      }
      if (res.conversation) {
        this.conversations.unshift(res.conversation);
      }
      this.notify();
      return res.group;
    }
  }

  async addMemberToGroup(groupId, targetUserId) {
    const res = await api.addMemberToGroup(groupId, targetUserId);
    if (res.group) {
      const idx = this.groups.findIndex(g => g.id === groupId);
      if (idx !== -1) this.groups[idx] = res.group;
      this.notify();
      return res.group;
    }
  }

  async removeMemberFromGroup(groupId, targetUserId) {
    await api.removeMemberFromGroup(groupId, targetUserId);
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      group.members = group.members.filter(id => id !== targetUserId);
      this.notify();
    }
  }

  // ============================================================================
  // CONTACTS & NICKNAMES
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
    return user.nickname || user.name || user.username || user.phone || 'User';
  }

  getUserById(id) {
    return this.users.find(u => u.id === id) || SEED_USERS.find(u => u.id === id) || null;
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
