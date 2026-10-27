// ==============================================================================
// VibeConnect — Real-Time WebSocket Client (Socket.IO)
// Manages live message events, typing indicators, read receipts, and WebRTC
// ==============================================================================

import { io } from 'socket.io-client';
import { getServerUrl } from './api';

class RealtimeSocket {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.currentConvId = null;
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('vibe_auth_token');
    const serverUrl = getServerUrl() || undefined;

    this.socket = io(serverUrl, {
      autoConnect: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to backend server:', this.socket.id);
      if (this.currentConvId) {
        this.socket.emit('join-conversation', this.currentConvId);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO] Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO] Disconnected:', reason);
    });
  }

  updateAuthToken(token) {
    if (!this.socket) return;
    this.socket.auth = { token };
    this.socket.disconnect().connect();
  }

  joinConversation(convId) {
    if (!this.socket || !convId) return;
    if (this.currentConvId && this.currentConvId !== convId) {
      this.socket.emit('leave-conversation', this.currentConvId);
    }
    this.currentConvId = convId;
    this.socket.emit('join-conversation', convId);
  }

  leaveConversation(convId) {
    if (!this.socket || !convId) return;
    this.socket.emit('leave-conversation', convId);
    if (this.currentConvId === convId) {
      this.currentConvId = null;
    }
  }

  emitTyping(conversationId, isTyping) {
    if (!this.socket) return;
    this.socket.emit('typing', { conversationId, isTyping });
  }

  emitMarkRead(conversationId) {
    if (!this.socket) return;
    this.socket.emit('mark-read', { conversationId });
  }

  on(event, callback) {
    if (!this.socket) return () => {};
    this.socket.on(event, callback);
    return () => {
      this.socket.off(event, callback);
    };
  }

  emit(event, data, callback) {
    if (!this.socket) return;
    this.socket.emit(event, data, callback);
  }
}

export const realtime = new RealtimeSocket();
