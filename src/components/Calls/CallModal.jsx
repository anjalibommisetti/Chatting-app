// ==============================================================================
// VibeConnect — Real Voice & Video Calling Interface (Screen 7 & 8)
// Real WebRTC Streams, Up to 5 Group Members, Controls & Timers
// ==============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MonitorUp, 
  MonitorX, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Users, 
  ShieldCheck
} from 'lucide-react';
import { calling, CALL_STATUS } from '../../services/webrtc';
import { store } from '../../services/store';

export default function CallModal() {
  const [, setTick] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  // Subscribe to calling state updates
  useEffect(() => {
    return calling.subscribe(() => setTick(t => t + 1));
  }, []);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && calling.localStream) {
      localVideoRef.current.srcObject = calling.localStream;
    }
  }, [calling.localStream, calling.status]);

  if (calling.status === CALL_STATUS.IDLE) {
    return null;
  }

  const activeCall = calling.activeCall;
  const isVideo = activeCall?.type === 'video';
  const isGroup = activeCall?.isGroup;

  // ---------------------------------------------------------------------------
  // 1. INCOMING CALL SCREEN
  // ---------------------------------------------------------------------------
  if (calling.status === CALL_STATUS.INCOMING_RINGING) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
        <div className="w-full max-w-sm bg-[#101422] border border-purple-500/30 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          {/* Pulsing rings */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ring-pulse"></div>
            <div className="absolute inset-3 rounded-full border-2 border-indigo-500/40 animate-ring-pulse" style={{ animationDelay: '0.6s' }}></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-5xl shadow-xl shadow-purple-600/40 z-10">
              {activeCall?.callerAvatar || '👤'}
            </div>
          </div>

          <h3 className="font-heading font-extrabold text-2xl text-white mb-1">
            {activeCall?.callerName || 'Friend'}
          </h3>
          <span className="text-xs font-semibold text-purple-300 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 mb-8 flex items-center gap-1.5">
            {isVideo ? <Video className="w-3.5 h-3.5 text-cyan-400" /> : <Phone className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Incoming {isGroup ? 'Group' : '1-on-1'} {isVideo ? 'Video' : 'Voice'} Call...</span>
          </span>

          {/* Accept / Decline actions */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => calling.declineCall()}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/40 transition-transform group-hover:scale-105 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Decline</span>
            </button>

            <button
              onClick={() => calling.acceptCall()}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 group-hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/40 transition-transform group-hover:scale-105 active:scale-95">
                <PhoneCall className="w-7 h-7 animate-bounce" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. OUTGOING RINGING SCREEN
  // ---------------------------------------------------------------------------
  if (calling.status === CALL_STATUS.OUTGOING_RINGING) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
        <div className="w-full max-w-sm bg-[#101422] border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          {/* Pulsing rings */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ring-pulse"></div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-5xl shadow-xl shadow-purple-600/30 z-10">
              {activeCall?.targetAvatar || '👤'}
            </div>
          </div>

          <h3 className="font-heading font-extrabold text-2xl text-white mb-1">
            {activeCall?.targetName || 'Friend'}
          </h3>
          <span className="text-xs text-purple-300/80 mb-8 flex items-center gap-1.5 animate-pulse">
            <span>{calling.callNotice || `Ringing (${isGroup ? 'Private Group Call' : '1-on-1 Call'})... Waiting for friend to answer`}</span>
          </span>

          <button
            onClick={() => calling.endCall()}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-600/40 transition-transform group-hover:scale-105 active:scale-95">
              <PhoneOff className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-slate-300">End Call</span>
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. FULL-SCREEN ACTIVE CALL STAGE (UP TO 5 PARTICIPANTS)
  // ---------------------------------------------------------------------------
  const participantIds = isGroup 
    ? (store.groups.find(g => g.id === activeCall?.targetId)?.members || []) 
    : [activeCall?.targetId];

  const remoteParticipants = participantIds
    .filter(id => id !== store.currentUser?.id)
    .map(id => store.getUserById(id))
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-[#07090F] flex flex-col select-none overflow-hidden animate-fadeIn">
      {/* Call Header Bar */}
      <header className="h-16 px-6 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            {activeCall?.targetAvatar || '📞'}
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              {activeCall?.targetName}
              {isGroup && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                  {remoteParticipants.length + 1}/5 Members
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-purple-300 font-medium">
                {calling.formatDuration(calling.callDuration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>P2P Direct Call</span>
          </span>
        </div>
      </header>

      {/* Main Video & Audio Stage Grid (Supports 1-to-5 participants) */}
      <main className="flex-1 p-4 md:p-6 flex items-center justify-center overflow-hidden relative">
        <div className={`w-full h-full max-w-6xl grid gap-4 items-center justify-center ${
          remoteParticipants.length <= 1 
            ? 'grid-cols-1' 
            : remoteParticipants.length <= 3 
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
              : 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {/* Remote Participant Tiles */}
          {remoteParticipants.map((peer) => {
            const displayName = store.getDisplayName(peer);
            return (
              <div 
                key={peer.id}
                className="relative w-full h-full min-h-[220px] rounded-3xl bg-[#101422] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl group"
              >
                {/* Simulated / Remote Video Element */}
                <video
                  ref={(el) => {
                    if (el && calling.remoteStreams.has(peer.id)) {
                      el.srcObject = calling.remoteStreams.get(peer.id);
                    }
                  }}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${!isVideo ? 'hidden' : ''}`}
                />

                {/* Voice Call or Camera Off Avatar Overlay */}
                {(!isVideo || calling.remoteStreams.size === 0) && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-28 h-28 rounded-full bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-6xl shadow-xl">
                      {peer.avatar}
                      <span className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-30"></span>
                    </div>
                    <span className="font-heading font-bold text-lg text-white">{displayName}</span>
                    <span className="text-xs text-purple-300/80">Audio Active 🎧</span>
                  </div>
                )}

                {/* Participant Name Badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-xs text-white font-medium border border-white/10">
                  <span>{displayName}</span>
                </div>
              </div>
            );
          })}

          {/* Local User Tile (Full grid tile in group, or floating PiP in 1-on-1) */}
          <div className={`${
            remoteParticipants.length <= 1 
              ? 'absolute bottom-6 right-6 w-48 sm:w-60 h-32 sm:h-40 rounded-2xl shadow-2xl z-20 border-2 border-purple-500/40 overflow-hidden bg-black' 
              : 'relative w-full h-full min-h-[220px] rounded-3xl bg-[#101422] border border-purple-500/30 overflow-hidden flex items-center justify-center shadow-2xl'
          }`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${calling.isCameraOff ? 'hidden' : ''}`}
            />

            {calling.isCameraOff && (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <span className="text-3xl mb-1">{store.currentUser?.avatar || '🦊'}</span>
                <span className="text-xs text-slate-400 font-medium">Camera Off</span>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[11px] text-white font-medium flex items-center gap-1.5">
              <span>You</span>
              {calling.isMuted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>
          </div>
        </div>
      </main>

      {/* Call Floating Dock Controls */}
      <footer className="h-24 px-6 bg-black/60 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-3 sm:gap-4 z-30 flex-shrink-0">
        {/* Mic Toggle */}
        <button
          onClick={() => calling.toggleMic()}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            calling.isMuted 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' 
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
          }`}
          title={calling.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {calling.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={() => calling.toggleCamera()}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            calling.isCameraOff 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' 
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
          }`}
          title={calling.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {calling.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Switch Camera (Front/Rear) */}
        <button
          onClick={() => calling.switchCamera()}
          className="w-13 h-13 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Switch Front/Rear Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Screen Share */}
        <button
          onClick={() => calling.toggleScreenShare()}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
            calling.isScreenSharing 
              ? 'bg-purple-600 text-white border border-purple-400 shadow-purple-600/50' 
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
          }`}
          title={calling.isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          {calling.isScreenSharing ? <MonitorX className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={() => calling.endCall()}
          className="w-16 h-13 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-transform shadow-lg shadow-red-600/40 active:scale-95 cursor-pointer ml-2"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
}
