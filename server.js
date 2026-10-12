const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB limit for image attachments in chat
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Store active 1-on-1 rooms
// roomId -> { users: [ { id: socket.id, name, avatar } ] }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // Join a 1-on-1 room
  socket.on('join-room', ({ roomId, userName, avatar }, callback) => {
    const cleanRoomId = (roomId || '').trim().toUpperCase();

    if (!cleanRoomId) {
      if (callback) callback({ success: false, message: 'Invalid Room ID' });
      return;
    }

    let room = rooms.get(cleanRoomId);

    if (!room) {
      room = { users: [], createdAt: Date.now() };
      rooms.set(cleanRoomId, room);
    }

    // Check 2-member limit
    if (room.users.length >= 2) {
      if (callback) callback({ 
        success: false, 
        message: 'This room is full! Only 2 members are allowed in this private session.' 
      });
      return;
    }

    const userData = {
      id: socket.id,
      name: (userName || 'Anonymous').trim().slice(0, 30),
      avatar: avatar || 'avatar-1'
    };

    room.users.push(userData);
    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.userData = userData;

    console.log(`[User Joined] ${userData.name} (${socket.id}) joined room: ${cleanRoomId}. Users in room: ${room.users.length}`);

    const partner = room.users.find(u => u.id !== socket.id);

    // Reply to joining user
    if (callback) {
      callback({
        success: true,
        roomId: cleanRoomId,
        user: userData,
        partner: partner || null,
        isInitiator: room.users.length === 1
      });
    }

    // If partner is already present, notify them
    if (partner) {
      socket.to(partner.id).emit('partner-joined', {
        partner: userData
      });
    }
  });

  // Call Initiation (Video or Voice)
  socket.on('call-user', ({ callType }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('incoming-call', {
        from: socket.userData,
        callType // 'video' or 'voice'
      });
    }
  });

  // Call Accepted by Callee
  socket.on('accept-call', ({ callType }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('call-accepted', {
        from: socket.userData,
        callType
      });
    }
  });

  // Call Rejected
  socket.on('reject-call', ({ reason }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('call-rejected', {
        from: socket.userData,
        reason: reason || 'declined'
      });
    }
  });

  // Call Ended / Hung Up
  socket.on('end-call', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('call-ended', {
        from: socket.userData
      });
    }
  });

  // WebRTC Signaling: SDP Offer
  socket.on('webrtc-offer', (payload) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('webrtc-offer', {
        sdp: payload.sdp,
        callType: payload.callType,
        from: socket.userData
      });
    }
  });

  // WebRTC Signaling: SDP Answer
  socket.on('webrtc-answer', (payload) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('webrtc-answer', {
        sdp: payload.sdp
      });
    }
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc-ice-candidate', (payload) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('webrtc-ice-candidate', {
        candidate: payload.candidate
      });
    }
  });

  // Media Track Status Changes (Muted, Camera Off, Screen Share)
  socket.on('media-status-change', (status) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('partner-media-status', status);
    }
  });

  // Chat Messaging
  socket.on('send-message', (msgData) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    const enrichedMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      senderId: socket.id,
      senderName: socket.userData ? socket.userData.name : 'Unknown',
      text: msgData.text || '',
      attachment: msgData.attachment || null, // dataUrl, fileName, fileType, fileSize
      timestamp: Date.now()
    };

    // Send to partner
    if (partner) {
      io.to(partner.id).emit('receive-message', enrichedMsg);
    }

    // Acknowledge back to sender with generated message ID and timestamp
    socket.emit('message-sent', enrichedMsg);
  });

  // Typing indicators
  socket.on('typing', ({ isTyping }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('partner-typing', { isTyping, from: socket.userData });
    }
  });

  // Read receipts
  socket.on('mark-read', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const partner = room.users.find(u => u.id !== socket.id);
    if (partner) {
      io.to(partner.id).emit('messages-read');
    }
  });

  // Disconnection handling
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    console.log(`[Socket Disconnected] ID: ${socket.id}`);

    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.users = room.users.filter(u => u.id !== socket.id);

      // Notify remaining partner
      if (room.users.length > 0) {
        socket.to(roomId).emit('partner-left', {
          user: socket.userData
        });
      } else {
        // If empty, delete room
        rooms.delete(roomId);
        console.log(`[Room Deleted] Room ${roomId} is now empty and cleaned up.`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 DuoConnect 1-on-1 Chat & Video Server running at http://localhost:${PORT}`);
});
