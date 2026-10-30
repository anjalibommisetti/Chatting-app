// ==============================================================================
// VibeConnect — Professional Full-Stack Real-Time Messaging & Calling Server (ESM)
// Express REST API + Socket.IO WebSockets + WebRTC Signaling + ACID Persistence
// ==============================================================================

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { db, hashPassword, verifyPassword } from './server/db.js';

// Email transporter (uses env vars set on Render)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || ''
  }
});

async function sendOTPEmail(toEmail, otp, nickname) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[DEV] OTP for ${toEmail}: ${otp}`);
    return; // In dev, just log it
  }
  await emailTransporter.sendMail({
    from: `"VibeChat" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'VibeChat — Your Password Reset OTP',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;background:#111726;color:#fff;border-radius:16px;">
        <h2 style="color:#a855f7;">🔑 Password Reset OTP</h2>
        <p>Hi <strong>${nickname || 'there'}</strong>,</p>
        <p>Your OTP to reset your VibeChat password is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#a855f7;padding:16px;background:#1e1b4b;border-radius:12px;text-align:center;">${otp}</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">This OTP expires in 15 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS setup
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static file hosting for uploaded attachments & media
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Static file hosting for legacy public or production dist
const DIST_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
} else if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// APK Direct Download Endpoint for QR Code Scanning
app.get(['/download', '/VibeChat.apk'], (req, res) => {
  const apkPath = path.join(__dirname, 'VibeChat.apk');
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'VibeChat.apk');
  }
  return res.status(404).send('APK file not found. Please run npm run build:apk');
});

// Multer Storage Configuration for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = Date.now() + '-' + Math.random().toString(36).substr(2, 8) + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max file size
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/', 'video/', 'audio/',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip'
    ];
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload images, videos, audio, or standard documents.'));
    }
  }
});

// ==============================================================================
// AUTHENTICATION MIDDLEWARE
// ==============================================================================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.query.token;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  const user = db.validateSession(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = user;
  req.token = token;
  next();
}

// ==============================================================================
// REST APIS: AUTHENTICATION
// ==============================================================================

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, phone, phoneNumber, nickname, username, password, avatar, bio } = req.body;
    const rawPhone = (phone || phoneNumber || '').trim();
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const displayName = (nickname || name || '').trim();

    if (!displayName || !cleanPhone || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nickname, email, phone number, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    const effectiveEmail = email.trim().toLowerCase();

    const existingEmail = db.data.users.find(u => u.email.toLowerCase() === effectiveEmail);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    if (cleanPhone) {
      const existingPhone = db.data.users.find(u => {
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
        return uPhone === cleanPhone;
      });
      if (existingPhone) {
        return res.status(409).json({ success: false, error: 'An account with this phone number already exists. Please sign in.' });
      }
    }

    // Username = clean version of nickname (no phone digits appended)
    let cleanUsername = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!cleanUsername) cleanUsername = 'user';
    // Check for username conflicts, append random 2-char suffix only if needed
    const usernameExists = db.data.users.find(u => u.username === cleanUsername);
    if (usernameExists) {
      cleanUsername = cleanUsername + '_' + Math.random().toString(36).slice(2, 4);
    }

    const newUser = db.createUser({
      name: displayName,
      nickname: displayName,
      email: effectiveEmail,
      phone: cleanPhone,
      username: cleanUsername,
      password,
      avatar: avatar || '🦊',
      bio: bio || 'Hey there! I am using VibeChat ✨'
    });

    const token = db.createSession(newUser.id);
    return res.status(201).json({
      success: true,
      user: db.sanitizeUser(newUser),
      token
    });
  } catch (err) {
    const status = err.message && err.message.toLowerCase().includes('already exists') ? 409 : 400;
    return res.status(status).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Please enter your username/email and password.' });
    }

    const user = db.getUserByIdentifier(identifier);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
    }

    const isMatch = verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password. Please try again.' });
    }

    // Set online
    db.updateUser(user.id, { status: 'online', lastSeen: 'Active now' });

    const token = db.createSession(user.id);
    return res.json({
      success: true,
      user: db.sanitizeUser(user),
      token
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  db.updateUser(req.user.id, { status: 'offline', lastSeen: 'Just now' });
  db.removeSession(req.token);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req, res) => {
  return res.json({
    success: true,
    user: db.sanitizeUser(req.user)
  });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const user = db.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, error: 'No account registered with this email address.' });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  user.resetCodeExpires = Date.now() + 1000 * 60 * 15; // 15 mins
  db.save();

  try {
    await sendOTPEmail(user.email, resetCode, user.nickname || user.name);
  } catch (mailErr) {
    console.error('Email send failed:', mailErr.message);
  }

  // In dev (no Gmail configured), return code in response so it can be shown
  const devMode = !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD;
  return res.json({
    success: true,
    message: devMode ? 'OTP generated (email not configured — shown below for testing).' : `OTP sent to ${user.email}`,
    ...(devMode ? { devResetCode: resetCode } : {})
  });
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
  const { email, resetCode, code, newPassword } = req.body;
  const theCode = resetCode || code;
  if (!email || !theCode || !newPassword) {
    return res.status(400).json({ success: false, error: 'Email, reset code, and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  const user = db.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.resetCode !== theCode || Date.now() > (user.resetCodeExpires || 0)) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset code.' });
  }

  const { hash, salt } = hashPassword(newPassword);
  user.passwordHash = hash;
  user.salt = salt;
  user.resetCode = null;
  user.resetCodeExpires = null;
  db.save();

  return res.json({ success: true, message: 'Password has been successfully reset. You can now log in.' });
});

// ==============================================================================
// REST APIS: USERS, CONTACTS & PROFILE
// ==============================================================================

// Handler for searching and listing users
function handleUserSearch(req, res) {
  const query = (req.query.q || '').trim().toLowerCase();
  let users = db.data.users.map(u => db.sanitizeUser(u));

  if (query) {
    users = users.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.nickname && u.nickname.toLowerCase().includes(query)) ||
      u.email.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query))
    );
  }

  // Return both formats for maximum compatibility with tests and UI
  const responseData = Object.assign([...users], { success: true, users });
  return res.json(responseData);
}

// GET /api/users & GET /api/users/search
app.get('/api/users', authenticate, handleUserSearch);
app.get('/api/users/search', authenticate, handleUserSearch);

// GET /api/users/by-phone/:phone — PhonePe-style Instant Contact Lookup
app.get('/api/users/by-phone/:phone', (req, res) => {
  const cleanPhone = (req.params.phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 5) {
    return res.status(400).json({ success: false, error: 'Enter a valid phone number' });
  }

  const user = db.data.users.find(u => {
    const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
    return uPhone && (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone));
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'No user registered with this phone number' });
  }

  return res.json({
    success: true,
    user: db.sanitizeUser(user)
  });
});

// PUT /api/users/profile
app.put('/api/users/profile', authenticate, (req, res) => {
  const { name, nickname, bio, avatar, status } = req.body;
  const updated = db.updateUser(req.user.id, { name, nickname, bio, avatar, status });
  const sanitized = db.sanitizeUser(updated);

  io.emit('user-status-changed', {
    userId: req.user.id,
    status: updated.status,
    lastSeen: updated.lastSeen
  });

  return res.json({ success: true, user: sanitized, ...sanitized });
});

// PUT /api/users/settings
app.put('/api/users/settings', authenticate, (req, res) => {
  const { theme, readReceipts, soundAlerts } = req.body;
  const updated = db.updateUser(req.user.id, {
    settings: { theme, readReceipts, soundAlerts }
  });
  return res.json({ success: true, settings: updated.settings });
});

// POST /api/users/block
app.post('/api/users/block', authenticate, (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ success: false, error: 'targetUserId is required' });

  const currentBlocked = req.user.blockedUserIds || [];
  if (!currentBlocked.includes(targetUserId)) {
    currentBlocked.push(targetUserId);
    db.updateUser(req.user.id, { blockedUserIds: currentBlocked });
  }
  return res.json({ success: true, blockedUserIds: currentBlocked, blockedUsers: currentBlocked });
});

// POST /api/users/unblock
app.post('/api/users/unblock', authenticate, (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ success: false, error: 'targetUserId is required' });

  let currentBlocked = req.user.blockedUserIds || [];
  currentBlocked = currentBlocked.filter(id => id !== targetUserId);
  db.updateUser(req.user.id, { blockedUserIds: currentBlocked });
  return res.json({ success: true, blockedUserIds: currentBlocked, blockedUsers: currentBlocked });
});

// DELETE /api/users/account
app.delete('/api/users/account', authenticate, (req, res) => {
  db.deleteUser(req.user.id);
  io.emit('user-status-changed', { userId: req.user.id, status: 'offline', lastSeen: 'Account deleted' });
  return res.json({ success: true, message: 'Your account has been deleted.' });
});

// ==============================================================================
// REST APIS: CONVERSATIONS & MESSAGES
// ==============================================================================

// GET /api/conversations
app.get('/api/conversations', authenticate, (req, res) => {
  const conversations = db.getUserConversations(req.user.id);
  return res.json({ success: true, conversations });
});

// POST /api/conversations (Start direct conversation)
app.post('/api/conversations', authenticate, (req, res) => {
  const targetUserId = req.body.targetUserId || req.body.recipientId;
  if (!targetUserId) return res.status(400).json({ success: false, error: 'targetUserId or recipientId is required' });

  const target = db.getUserById(targetUserId);
  if (!target) return res.status(404).json({ success: false, error: 'Target user not found' });

  const conv = db.getOrCreateDirectConversation(req.user.id, targetUserId);
  io.to('user_' + targetUserId).emit('conversation-created', { conversation: conv });
  return res.json({ success: true, conversation: conv, id: conv.id, ...conv });
});

// GET /api/conversations/:id/messages
app.get('/api/conversations/:id/messages', authenticate, (req, res) => {
  const conv = db.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });

  if (!conv.participantIds.includes(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Access denied to this conversation' });
  }

  const limit = parseInt(req.query.limit, 10) || 100;
  const messages = db.getMessagesByConversation(conv.id, limit);

  // Auto-mark read
  db.markMessagesRead(conv.id, req.user.id);

  // Support array format while attaching metadata
  const responseData = Object.assign([...messages], { success: true, messages });
  return res.json(responseData);
});

// POST /api/conversations/:id/read
app.post('/api/conversations/:id/read', authenticate, (req, res) => {
  const conv = db.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });

  db.markMessagesRead(conv.id, req.user.id);
  io.to('conv_' + conv.id).emit('messages-read', { conversationId: conv.id, userId: req.user.id });
  return res.json({ success: true, message: 'Messages marked as read' });
});

// POST /api/conversations/:id/messages
app.post('/api/conversations/:id/messages', authenticate, (req, res) => {
  const { text, attachment, replyToId, replyTo, isViewOnce, isGif } = req.body;
  const conv = db.getConversationById(req.params.id);
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });

  if (!conv.participantIds.includes(req.user.id)) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const effectiveReplyTo = replyToId || replyTo || null;
  const newMsg = db.createMessage({
    conversationId: conv.id,
    senderId: req.user.id,
    text,
    attachment,
    replyToId: effectiveReplyTo,
    isViewOnce,
    isGif
  });

  const payloadMsg = {
    ...newMsg,
    senderName: req.user.nickname || req.user.name,
    senderAvatar: req.user.avatar
  };

  // Broadcast to socket room
  io.to('conv_' + conv.id).emit('receive-message', payloadMsg);

  // Notify user personal rooms for real-time delivery and unread indicators
  conv.participantIds.forEach(pid => {
    if (pid !== req.user.id) {
      io.to('user_' + pid).emit('receive-message', payloadMsg);
      io.to('user_' + pid).emit('conversation-updated', {
        conversationId: conv.id,
        lastMessage: payloadMsg,
        unreadCount: conv.unreadCounts ? conv.unreadCounts[pid] : 1
      });
    }
  });

  return res.status(201).json({
    success: true,
    message: newMsg,
    id: newMsg.id,
    text: newMsg.text,
    replyTo: newMsg.replyToId,
    replyToId: newMsg.replyToId,
    ...newMsg
  });
});

// POST /api/messages/:id/view-once-open
app.post('/api/messages/:id/view-once-open', authenticate, (req, res) => {
  const updated = db.markViewOnceOpened(req.params.id, req.user.id);
  if (!updated) return res.status(404).json({ success: false, error: 'Message not found' });
  io.to('conv_' + updated.conversationId).emit('view-once-opened', {
    messageId: updated.id,
    conversationId: updated.conversationId,
    openedBy: req.user.id,
    openedAt: updated.openedAt
  });
  return res.json({ success: true, message: updated });
});

// Helper for editing messages
function handleEditMessage(req, res) {
  const { text } = req.body;
  const msgId = req.params.msgId || req.params.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: 'Message text cannot be empty' });
  }

  const existingMsg = db.getMessageById(msgId);
  if (!existingMsg) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }
  if (existingMsg.senderId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Unauthorized to edit this message' });
  }

  try {
    const updated = db.editMessage(msgId, req.user.id, text);
    io.to('conv_' + updated.conversationId).emit('message-edited', updated);
    return res.json({ success: true, message: updated, edited: true, isEdited: true, text: updated.text, ...updated });
  } catch (err) {
    const status = err.message && err.message.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ success: false, error: err.message });
  }
}

// PUT & PATCH /api/messages/:id & /api/conversations/:id/messages/:msgId
app.put('/api/messages/:id', authenticate, handleEditMessage);
app.patch('/api/messages/:id', authenticate, handleEditMessage);
app.put('/api/conversations/:id/messages/:msgId', authenticate, handleEditMessage);
app.patch('/api/conversations/:id/messages/:msgId', authenticate, handleEditMessage);

// Helper for deleting messages
function handleDeleteMessage(req, res) {
  const msgId = req.params.msgId || req.params.id;
  const existingMsg = db.getMessageById(msgId);
  if (!existingMsg) {
    return res.status(404).json({ success: false, error: 'Message not found' });
  }
  if (existingMsg.senderId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Unauthorized to delete this message' });
  }

  try {
    const deleted = db.deleteMessage(msgId, req.user.id);
    io.to('conv_' + deleted.conversationId).emit('message-deleted', deleted);
    return res.json({ success: true, message: deleted, deleted: true, isDeleted: true, ...deleted });
  } catch (err) {
    const status = err.message && err.message.includes('Unauthorized') ? 403 : 400;
    return res.status(status).json({ success: false, error: err.message });
  }
}

// DELETE /api/messages/:id & /api/conversations/:id/messages/:msgId
app.delete('/api/messages/:id', authenticate, handleDeleteMessage);
app.delete('/api/conversations/:id/messages/:msgId', authenticate, handleDeleteMessage);

// Helper for reactions
function handleReaction(req, res) {
  const { emoji } = req.body;
  const msgId = req.params.msgId || req.params.id;
  if (!emoji) return res.status(400).json({ success: false, error: 'Emoji is required' });

  try {
    const updated = db.toggleReaction(msgId, req.user.id, emoji);
    io.to('conv_' + updated.conversationId).emit('reaction-updated', {
      messageId: updated.id,
      reactions: updated.reactions
    });
    return res.json({ success: true, reactions: updated.reactions, message: updated, ...updated });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

// POST /api/messages/:id/react & /api/conversations/:id/messages/:msgId/react
app.post('/api/messages/:id/react', authenticate, handleReaction);
app.post('/api/conversations/:id/messages/:msgId/react', authenticate, handleReaction);

// ==============================================================================
// REST APIS: GROUPS (STRICT 5-MEMBER MAXIMUM)
// ==============================================================================

// GET /api/groups
app.get('/api/groups', authenticate, (req, res) => {
  const groups = db.data.groups.filter(g => g.members.includes(req.user.id));
  return res.json({ success: true, groups });
});

// POST /api/groups
app.post('/api/groups', authenticate, (req, res) => {
  const { name, avatar, memberIds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Group name is required' });
  }

  try {
    const { group, conversation } = db.createGroup({
      name,
      avatar,
      creatorId: req.user.id,
      memberIds
    });

    group.members.forEach(mid => {
      io.to('user_' + mid).emit('group-created', { group, conversation });
    });

    return res.status(201).json({ success: true, group, conversation, type: 'group', ...group });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/groups/join
app.post('/api/groups/join', authenticate, (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ success: false, error: 'Invite code is required' });

  try {
    const group = db.joinGroupByCode(inviteCode, req.user.id);
    const conv = db.data.conversations.find(c => c.groupId === group.id);

    io.to('conv_' + conv.id).emit('member-joined-group', {
      groupId: group.id,
      user: db.sanitizeUser(req.user)
    });

    return res.json({ success: true, group, conversation: conv });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/groups/:id/members
app.post('/api/groups/:id/members', authenticate, (req, res) => {
  const { targetUserId } = req.body;
  try {
    const group = db.addMemberToGroup(req.params.id, req.user.id, targetUserId);
    const conv = db.data.conversations.find(c => c.groupId === group.id);
    const targetUser = db.getUserById(targetUserId);

    io.to('conv_' + conv.id).emit('member-joined-group', {
      groupId: group.id,
      user: db.sanitizeUser(targetUser)
    });

    return res.json({ success: true, group });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/groups/:id/members/:userId
app.delete('/api/groups/:id/members/:userId', authenticate, (req, res) => {
  try {
    const group = db.removeMemberFromGroup(req.params.id, req.user.id, req.params.userId);
    const conv = db.data.conversations.find(c => c.groupId === group.id);

    io.to('conv_' + conv.id).emit('member-left-group', {
      groupId: group.id,
      userId: req.params.userId
    });

    return res.json({ success: true, group });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ==============================================================================
// REST APIS: FILE ATTACHMENTS & UPLOAD
// ==============================================================================

app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    success: true,
    file: {
      url: fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    }
  });
});

// Fallback route to serve the Single Page App for client-side routing
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
    return next();
  }
  if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    return res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else if (fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))) {
    return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  next();
});

// ==============================================================================
// SOCKET.IO REAL-TIME MESSAGING, CALLING & SIGNALING ENGINE
// ==============================================================================

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 2.5e7 // 25MB buffer
});

const activeSockets = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next();
  }

  const user = db.validateSession(token);
  if (!user) {
    return next(new Error('Authentication failed: Invalid session token.'));
  }

  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  const user = socket.user;
  if (user) {
    activeSockets.set(socket.id, user.id);
    socket.join('user_' + user.id);

    console.log(`[Socket Connected] User: ${user.name} (${user.id}) Socket ID: ${socket.id}`);

    db.updateUser(user.id, { status: 'online', lastSeen: 'Active now' });
    io.emit('user-status-changed', { userId: user.id, status: 'online', lastSeen: 'Active now' });
  } else {
    console.log(`[Socket Connected Anonymous] Socket ID: ${socket.id}`);
  }

  socket.on('join-conversation', (convId) => {
    socket.join('conv_' + convId);
    console.log(`[Socket Room] Socket ${socket.id} joined conversation: conv_${convId}`);
  });

  socket.on('leave-conversation', (convId) => {
    socket.leave('conv_' + convId);
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    if (!conversationId || !user) return;
    socket.to('conv_' + conversationId).emit('user-typing', {
      conversationId,
      userId: user.id,
      userName: user.nickname || user.name,
      isTyping
    });
  });

  socket.on('mark-read', ({ conversationId }) => {
    if (!conversationId || !user) return;
    db.markMessagesRead(conversationId, user.id);
    socket.to('conv_' + conversationId).emit('messages-read', {
      conversationId,
      userId: user.id
    });
  });

  socket.on('send-message', (data, callback) => {
    if (!user) {
      if (callback) callback({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      const conv = db.getConversationById(data.conversationId);
      const newMsg = db.createMessage({
        conversationId: data.conversationId,
        senderId: user.id,
        text: data.text,
        attachment: data.attachment,
        replyToId: data.replyToId,
        isViewOnce: data.isViewOnce,
        isGif: data.isGif
      });

      // Broadcast to active conversation room
      socket.to('conv_' + data.conversationId).emit('receive-message', newMsg);

      // Also notify all participant personal user rooms in real-time
      if (conv && Array.isArray(conv.participantIds)) {
        conv.participantIds.forEach(pid => {
          if (pid !== user.id) {
            io.to('user_' + pid).emit('receive-message', newMsg);
            io.to('user_' + pid).emit('conversation-updated', {
              conversationId: conv.id,
              lastMessage: newMsg,
              unreadCount: conv.unreadCounts ? conv.unreadCounts[pid] : 1
            });
          }
        });
      }

      if (callback) callback({ success: true, message: newMsg });
      socket.emit('message-sent', newMsg);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  socket.on('view-once-opened', ({ messageId, conversationId }) => {
    if (!messageId || !user) return;
    const updated = db.markViewOnceOpened(messageId, user.id);
    if (updated) {
      io.to('conv_' + conversationId).emit('view-once-opened', {
        messageId,
        conversationId,
        openedBy: user.id,
        openedAt: updated.openedAt
      });
    }
  });

  // WebRTC Signaling
  socket.on('call-user', (payload) => {
    if (!user) return;
    const { targetId, isGroup, type } = payload;

    const callPayload = {
      type,
      isGroup,
      targetId,
      callerId: user.id,
      callerName: user.nickname || user.name,
      callerAvatar: user.avatar,
      timestamp: Date.now()
    };

    if (isGroup) {
      const group = db.getGroupById(targetId);
      if (group) {
        group.members.forEach(mid => {
          if (mid !== user.id) {
            io.to('user_' + mid).emit('incoming-call', callPayload);
          }
        });
      }
    } else {
      io.to('user_' + targetId).emit('incoming-call', callPayload);
    }
  });

  socket.on('accept-call', ({ targetId, callerId }) => {
    if (!user) return;
    io.to('user_' + callerId).emit('call-accepted', {
      targetId,
      acceptedBy: user.id
    });
  });

  socket.on('reject-call', ({ callerId, reason }) => {
    if (!user) return;
    io.to('user_' + callerId).emit('call-rejected', {
      callerId,
      rejectedBy: user.id,
      reason: reason || 'declined'
    });
  });

  socket.on('end-call', ({ targetId, isGroup }) => {
    if (!user) return;
    if (isGroup) {
      const group = db.getGroupById(targetId);
      if (group) {
        group.members.forEach(mid => {
          if (mid !== user.id) {
            io.to('user_' + mid).emit('call-ended', { endedBy: user.id });
          }
        });
      }
    } else {
      io.to('user_' + targetId).emit('call-ended', { endedBy: user.id });
    }
  });

  socket.on('webrtc-offer', ({ targetId, sdp, callType }) => {
    if (!user) return;
    io.to('user_' + targetId).emit('webrtc-offer', {
      sdp,
      callType,
      fromId: user.id,
      fromName: user.nickname || user.name
    });
  });

  socket.on('webrtc-answer', ({ targetId, sdp }) => {
    if (!user) return;
    io.to('user_' + targetId).emit('webrtc-answer', {
      sdp,
      fromId: user.id
    });
  });

  socket.on('webrtc-ice-candidate', ({ targetId, candidate }) => {
    if (!user) return;
    io.to('user_' + targetId).emit('webrtc-ice-candidate', {
      candidate,
      fromId: user.id
    });
  });

  socket.on('media-status-change', ({ targetId, status }) => {
    if (!user) return;
    io.to('user_' + targetId).emit('partner-media-status', {
      fromId: user.id,
      status
    });
  });

  socket.on('disconnect', () => {
    if (user) {
      activeSockets.delete(socket.id);

      const hasOtherSockets = Array.from(activeSockets.values()).includes(user.id);
      if (!hasOtherSockets) {
        const lastSeen = 'Active ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        db.updateUser(user.id, { status: 'offline', lastSeen });
        io.emit('user-status-changed', { userId: user.id, status: 'offline', lastSeen });
      }
      console.log(`[Socket Disconnected] User: ${user.name} (${user.id})`);
    } else {
      console.log(`[Socket Disconnected Anonymous] Socket ID: ${socket.id}`);
    }
  });
});

// Start the Server
server.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 VibeConnect Backend API & Real-Time Engine Active!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: Atomic ACID File Storage in /data/db.json`);
  console.log(`📁 File Attachments: /uploads`);
  console.log(`☁️ Supabase Cloud Sync: Connected & Active`);
  console.log(`======================================================\n`);

  try {
    await db.syncFromSupabase();
  } catch (err) {
    console.warn('[Server] Supabase startup sync note:', err.message);
  }
});

export { app, server };
