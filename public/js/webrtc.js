// ===================================================================
// DuoConnect - WebRTC Peer Connection & Media Management
// ===================================================================

class WebRTCManager {
  constructor({ onIceCandidate, onRemoteTrack, onConnectionStateChange }) {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    
    this.onIceCandidate = onIceCandidate;
    this.onRemoteTrack = onRemoteTrack;
    this.onConnectionStateChange = onConnectionStateChange;

    this.isMuted = false;
    this.isCameraOff = false;
    this.isScreenSharing = false;
    this.currentCallType = null; // 'video' | 'voice'

    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' }
    ];
  }

  // Acquire local media stream (camera / mic)
  async getLocalMedia(callType = 'video') {
    this.currentCallType = callType;
    const constraints = {
      audio: true,
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
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
      console.error('Failed to get local media:', err);
      // Fallback: if video fails, try audio only
      if (callType === 'video') {
        console.warn('Attempting audio-only fallback...');
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.isCameraOff = true;
        this.currentCallType = 'voice';
        return this.localStream;
      }
      throw err;
    }
  }

  // Initialize RTCPeerConnection
  initPeerConnection() {
    if (this.peerConnection) {
      this.closePeerConnection();
    }

    this.remoteStream = new MediaStream();
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // ICE Candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // Remote Track handler
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else {
        this.remoteStream.addTrack(event.track);
      }
      if (this.onRemoteTrack) {
        this.onRemoteTrack(this.remoteStream, event.track);
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log(`[WebRTC Connection State]: ${state}`);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(`[WebRTC ICE State]: ${this.peerConnection.iceConnectionState}`);
    };
  }

  // Create and send SDP Offer (Caller side)
  async createOffer() {
    if (!this.peerConnection) this.initPeerConnection();

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // Create and send SDP Answer (Callee side)
  async handleOfferAndCreateAnswer(offer) {
    if (!this.peerConnection) this.initPeerConnection();

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  // Handle SDP Answer on Caller side
  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Add ICE candidate received from peer
  async addIceCandidate(candidate) {
    if (!this.peerConnection || !candidate) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding received ICE candidate:', err);
    }
  }

  // Toggle Microphone
  toggleMute() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMuted = !audioTrack.enabled;
      return this.isMuted;
    }
    return false;
  }

  // Toggle Camera
  async toggleCamera() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isCameraOff = !videoTrack.enabled;
      return this.isCameraOff;
    } else {
      // If no video track existed (e.g. started as voice call), request video track
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = vStream.getVideoTracks()[0];
        this.localStream.addTrack(newTrack);

        if (this.peerConnection) {
          const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(newTrack);
          } else {
            this.peerConnection.addTrack(newTrack, this.localStream);
          }
        }
        this.isCameraOff = false;
        return false;
      } catch (err) {
        console.error('Unable to enable camera:', err);
        return true;
      }
    }
  }

  // Screen Sharing
  async toggleScreenShare() {
    if (this.isScreenSharing) {
      this.stopScreenShare();
      return false;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const screenVideoTrack = this.screenStream.getVideoTracks()[0];

      // Handle user stopping screen share via native browser banner
      screenVideoTrack.onended = () => {
        this.stopScreenShare();
      };

      // Replace video track in peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenVideoTrack);
        } else {
          this.peerConnection.addTrack(screenVideoTrack, this.screenStream);
        }
      }

      this.isScreenSharing = true;
      return true;
    } catch (err) {
      console.warn('Screen share canceled or failed:', err);
      this.isScreenSharing = false;
      return false;
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    // Revert back to camera track if local stream has one
    if (this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      if (this.peerConnection && cameraTrack) {
        const sender = this.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrack);
        }
      }
    }

    this.isScreenSharing = false;
  }

  // Stop local stream media devices
  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.stopScreenShare();
  }

  // Close connection
  closePeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.stopLocalMedia();
    this.remoteStream = null;
    this.isMuted = false;
    this.isCameraOff = false;
    this.isScreenSharing = false;
    this.currentCallType = null;
  }
}

window.WebRTCManager = WebRTCManager;
