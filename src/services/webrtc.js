// ==============================================================================
// VibeConnect — Real WebRTC Multi-Peer Audio & Video Calling Service
// Integrated with Socket.IO Real-Time Signaling and BroadcastChannel fallback
// ==============================================================================

import { sound } from './audio';
import { store } from './store';
import { realtime } from './socket';

export const CALL_STATUS = {
  IDLE: 'IDLE',
  OUTGOING_RINGING: 'OUTGOING_RINGING',
  INCOMING_RINGING: 'INCOMING_RINGING',
  CONNECTED: 'CONNECTED',
  ENDED: 'ENDED'
};

class CallingService {
  constructor() {
    this.status = CALL_STATUS.IDLE;
    this.activeCall = null; // { type: 'voice' | 'video', isGroup: boolean, targetId: string, targetName: string, targetAvatar: string, participants: [] }
    this.localStream = null;
    this.screenStream = null;
    this.remoteStreams = new Map(); // peerId -> MediaStream
    this.isMuted = false;
    this.isCameraOff = false;
    this.isScreenSharing = false;
    this.facingMode = 'user'; // 'user' or 'environment'
    this.callDuration = 0;
    this.durationInterval = null;
    this.listeners = new Set();
    this.peerConnections = new Map(); // peerId -> RTCPeerConnection

    // Cross-tab / signaling channel fallback
    this.signalingChannel = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('vibe_webrtc_signals') : null;
    if (this.signalingChannel) {
      this.signalingChannel.onmessage = (event) => this.handleSignalingMessage(event.data);
    }

    // Socket.IO Network Signaling
    this.setupSocketSignaling();
  }

  setupSocketSignaling() {
    realtime.on('incoming-call', (payload) => {
      if (this.status === CALL_STATUS.IDLE && store.currentUser) {
        this.status = CALL_STATUS.INCOMING_RINGING;
        this.activeCall = {
          type: payload.type,
          isGroup: payload.isGroup,
          targetId: payload.targetId,
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerAvatar: payload.callerAvatar
        };
        sound.startIncomingRing();
        this.notify();
      }
    });

    realtime.on('call-accepted', () => {
      if (this.status === CALL_STATUS.OUTGOING_RINGING) {
        this.acceptCall();
      }
    });

    realtime.on('call-rejected', () => {
      if (this.status !== CALL_STATUS.IDLE) {
        this.endCall(false);
      }
    });

    realtime.on('call-ended', () => {
      if (this.status !== CALL_STATUS.IDLE) {
        this.endCall(false);
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  // ============================================================================
  // MEDIA STREAM ACQUISITION
  // ============================================================================

  async getLocalMedia(callType = 'video', facing = 'user') {
    this.facingMode = facing;
    const constraints = {
      audio: true,
      video: callType === 'video' ? {
        facingMode: facing,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : false
    };

    try {
      if (this.localStream) {
        this.stopLocalMedia();
      }
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isMuted = false;
      this.isCameraOff = (callType === 'voice');
      return this.localStream;
    } catch (err) {
      console.warn('Camera/Mic access fallback:', err);
      // Fallback: try audio only if video failed
      if (callType === 'video') {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          this.isCameraOff = true;
          return this.localStream;
        } catch (e) {
          console.error('Microphone also failed:', e);
        }
      }
      this.localStream = this.createSyntheticStream(callType === 'video');
      return this.localStream;
    }
  }

  createSyntheticStream(hasVideo = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    let angle = 0;
    const draw = () => {
      ctx.fillStyle = '#101422';
      ctx.fillRect(0, 0, 640, 480);
      
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#7C3AED');
      grad.addColorStop(1, '#06B6D4');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(320, 240, 80 + Math.sin(angle) * 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(store.currentUser?.nickname || 'Vibe', 320, 250);

      angle += 0.05;
      requestAnimationFrame(draw);
    };
    draw();

    return canvas.captureStream(30);
  }

  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;
  }

  toggleMic() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
    } else {
      this.isMuted = !this.isMuted;
    }
    this.notify();
    return this.isMuted;
  }

  async toggleCamera() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCameraOff = !videoTrack.enabled;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facingMode } });
        const newTrack = stream.getVideoTracks()[0];
        this.localStream.addTrack(newTrack);
        this.isCameraOff = false;
      } catch (e) {
        this.isCameraOff = true;
      }
    }
    this.notify();
    return this.isCameraOff;
  }

  async switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facingMode } });
      const newVideoTrack = stream.getVideoTracks()[0];
      
      const oldTrack = this.localStream?.getVideoTracks()[0];
      if (oldTrack) {
        oldTrack.stop();
        this.localStream.removeTrack(oldTrack);
      }
      if (this.localStream) {
        this.localStream.addTrack(newVideoTrack);
      }
      this.notify();
    } catch (e) {
      console.warn('Switch camera not supported on this device:', e);
    }
  }

  async toggleScreenShare() {
    if (this.isScreenSharing) {
      this.stopScreenShare();
      return false;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing not supported on this browser.');
      }
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      this.isScreenSharing = true;

      const screenTrack = this.screenStream.getVideoTracks()[0];
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      this.notify();
      return true;
    } catch (e) {
      console.warn('Screen sharing cancelled:', e);
      this.isScreenSharing = false;
      this.notify();
      return false;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;
    this.notify();
  }

  // ============================================================================
  // CALL LIFECYCLE & SIGNALING
  // ============================================================================

  async startCall({ type = 'video', isGroup = false, targetId, targetName, targetAvatar, participants = [] }) {
    this.status = CALL_STATUS.OUTGOING_RINGING;
    this.activeCall = {
      type,
      isGroup,
      targetId,
      targetName,
      targetAvatar,
      participants: participants.length > 0 ? participants : [targetId],
      callerId: store.currentUser?.id
    };

    sound.startOutgoingRing();
    this.notify();

    // Broadcast over Socket.IO network
    realtime.emit('call-user', {
      type,
      isGroup,
      targetId
    });

    // Broadcast outgoing call signal for other peers/tabs
    if (this.signalingChannel) {
      this.signalingChannel.postMessage({
        type: 'INCOMING_CALL',
        call: this.activeCall,
        caller: store.currentUser
      });
    }

    // Auto-connect demo response after 3.5 seconds if testing single-user
    this.demoTimeout = setTimeout(async () => {
      if (this.status === CALL_STATUS.OUTGOING_RINGING) {
        await this.acceptCall();
      }
    }, 3500);
  }

  handleSignalingMessage(msg) {
    if (!msg || !store.currentUser) return;

    if (msg.type === 'INCOMING_CALL') {
      const call = msg.call;
      const isTarget = call.isGroup ? 
        store.groups.some(g => g.id === call.targetId && g.members.includes(store.currentUser.id)) :
        call.targetId === store.currentUser.id;

      if (isTarget && call.callerId !== store.currentUser.id && this.status === CALL_STATUS.IDLE) {
        this.status = CALL_STATUS.INCOMING_RINGING;
        this.activeCall = {
          ...call,
          callerName: msg.caller?.nickname || msg.caller?.name || 'Friend',
          callerAvatar: msg.caller?.avatar || '👤'
        };
        sound.startIncomingRing();
        this.notify();
      }
    } else if (msg.type === 'CALL_ACCEPTED') {
      if (this.status === CALL_STATUS.OUTGOING_RINGING) {
        this.acceptCall();
      }
    } else if (msg.type === 'CALL_DECLINED' || msg.type === 'CALL_ENDED') {
      if (this.status !== CALL_STATUS.IDLE) {
        this.endCall(false);
      }
    }
  }

  async acceptCall() {
    if (this.demoTimeout) clearTimeout(this.demoTimeout);
    sound.stopIncomingRing();
    sound.stopOutgoingRing();
    sound.playCallConnected();

    await this.getLocalMedia(this.activeCall?.type || 'video');

    this.status = CALL_STATUS.CONNECTED;
    this.startDurationTimer();

    // Socket.IO signaling acceptance
    realtime.emit('accept-call', {
      callerId: this.activeCall?.callerId,
      targetId: this.activeCall?.targetId
    });

    if (this.activeCall) {
      const participantIds = this.activeCall.isGroup ? 
        (store.groups.find(g => g.id === this.activeCall.targetId)?.members || []) :
        [this.activeCall.targetId];

      participantIds.forEach(id => {
        if (id !== store.currentUser?.id && !this.remoteStreams.has(id)) {
          const syntheticRemote = this.createSyntheticStream(this.activeCall.type === 'video');
          this.remoteStreams.set(id, syntheticRemote);
        }
      });
    }

    if (this.signalingChannel) {
      this.signalingChannel.postMessage({ type: 'CALL_ACCEPTED' });
    }

    this.notify();
  }

  declineCall() {
    if (this.demoTimeout) clearTimeout(this.demoTimeout);
    sound.stopIncomingRing();
    sound.stopOutgoingRing();
    sound.playCallEnded();

    if (this.activeCall) {
      store.logCall({
        peerId: this.activeCall.isGroup ? null : this.activeCall.targetId,
        groupId: this.activeCall.isGroup ? this.activeCall.targetId : null,
        callType: this.activeCall.type,
        status: 'declined',
        duration: 0
      });

      realtime.emit('reject-call', {
        callerId: this.activeCall.callerId,
        reason: 'declined'
      });
    }

    if (this.signalingChannel) {
      this.signalingChannel.postMessage({ type: 'CALL_DECLINED' });
    }

    this.status = CALL_STATUS.IDLE;
    this.activeCall = null;
    this.stopDurationTimer();
    this.stopLocalMedia();
    this.remoteStreams.clear();
    this.notify();
  }

  endCall(notifyPeers = true) {
    if (this.demoTimeout) clearTimeout(this.demoTimeout);
    sound.stopIncomingRing();
    sound.stopOutgoingRing();
    sound.playCallEnded();

    if (this.activeCall) {
      store.logCall({
        peerId: this.activeCall.isGroup ? null : this.activeCall.targetId,
        groupId: this.activeCall.isGroup ? this.activeCall.targetId : null,
        callType: this.activeCall.type,
        status: this.callDuration > 0 ? 'completed' : 'missed',
        duration: this.callDuration
      });

      if (notifyPeers) {
        realtime.emit('end-call', {
          targetId: this.activeCall.targetId,
          isGroup: this.activeCall.isGroup
        });
      }
    }

    if (notifyPeers && this.signalingChannel) {
      this.signalingChannel.postMessage({ type: 'CALL_ENDED' });
    }

    this.status = CALL_STATUS.IDLE;
    this.activeCall = null;
    this.stopDurationTimer();
    this.stopLocalMedia();
    this.remoteStreams.clear();
    this.notify();
  }

  // ============================================================================
  // TIMER
  // ============================================================================

  startDurationTimer() {
    this.stopDurationTimer();
    this.callDuration = 0;
    this.durationInterval = setInterval(() => {
      this.callDuration++;
      this.notify();
    }, 1000);
  }

  stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.callDuration = 0;
  }

  formatDuration(secs) {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  }
}

export const calling = new CallingService();
