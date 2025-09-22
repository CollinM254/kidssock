
// const socketIO = require("socket.io");
// const http = require("http");
// const express = require("express");
// const cors = require("cors");
// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });

// require("dotenv").config({
//   path: "./.env",
// });




// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Hello world from socket server!");
// });

// // Track connected users and their socket IDs
// let users = [];

// const addUser = (userId, socketId) => {
//   !users.some((user) => user.userId === userId) &&
//     users.push({ userId, socketId });
// };

// const removeUser = (socketId) => {
//   users = users.filter((user) => user.socketId !== socketId);
// };

// const getUser = (userId) => {
//   return users.find((user) => user.userId === userId);
// };

// // Helper function to create message objects
// const createMessage = ({ senderId, receiverId, text, images, conversationId, senderType }) => ({
//   senderId,
//   receiverId,
//   text,
//   images,
//   conversationId,
//   senderType,
//   seen: false,
//   createdAt: new Date()
// });

// io.on("connection", (socket) => {
//   console.log(`a user connected with socket ID: ${socket.id}`);

//   // When a user connects, add them to the users list
//   socket.on("addUser", (userId) => {
//     addUser(userId, socket.id);
//     io.emit("getUsers", users);
//     console.log(`User ${userId} connected with socket ID: ${socket.id}`);
//   });

//   // Regular chat messages (school-parent)
//   socket.on("sendMessage", ({ senderId, receiverId, text, images, conversationId }) => {
//     const message = createMessage({
//       senderId,
//       receiverId,
//       text,
//       images,
//       conversationId,
//       senderType: 'regular' // For regular school-parent chat
//     });

//     const receiver = getUser(receiverId);

//     // Emit to the specific conversation room
//     io.to(`chat_${conversationId}`).emit("getMessage", message);

//     // Also emit directly to receiver if they're online
//     if (receiver) {
//       io.to(receiver.socketId).emit("getMessage", message);
//     }

//     console.log(`Regular message sent from ${senderId} to ${receiverId}`);
//   });

//   // Support chat messages (school-admin)
//   socket.on("sendSupportMessage", ({ senderId, receiverId, text, images, conversationId, senderType }) => {
//     const message = createMessage({
//       senderId,
//       receiverId,
//       text,
//       images,
//       conversationId,
//       senderType
//     });

//     const receiver = getUser(receiverId);

//     // Emit to the specific support conversation room
//     io.to(`support_${conversationId}`).emit("getSupportMessage", message);

//     // Also emit directly to receiver if they're online
//     if (receiver) {
//       io.to(receiver.socketId).emit("getSupportMessage", message);
//     }

//     console.log(`Support message sent from ${senderId} (${senderType}) to ${receiverId}`);
//   });

//   // Join regular chat room
//   socket.on("joinChat", (conversationId) => {
//     socket.join(`chat_${conversationId}`);
//     console.log(`User joined chat room: chat_${conversationId}`);
//   });

//   // Join support chat room
//   socket.on("joinSupportChat", (conversationId) => {
//     socket.join(`support_${conversationId}`);
//     console.log(`User joined support room: support_${conversationId}`);
//   });

//   // Message seen events for regular chat
//   socket.on("messageSeen", ({ conversationId, messageId }) => {
//     io.to(`chat_${conversationId}`).emit("messageSeen", { messageId });
//     console.log(`Message ${messageId} marked as seen in chat ${conversationId}`);
//   });

//   // Message seen events for support chat
//   socket.on("supportMessageSeen", ({ conversationId, messageId }) => {
//     io.to(`support_${conversationId}`).emit("supportMessageSeen", { messageId });
//     console.log(`Support message ${messageId} marked as seen in conversation ${conversationId}`);
//   });

//   // Last message updates for regular chat
//   socket.on("updateLastMessage", ({ conversationId, lastMessage }) => {
//     io.to(`chat_${conversationId}`).emit("updateLastMessage", { lastMessage });
//     console.log(`Last message updated in chat ${conversationId}`);
//   });

//   // Last message updates for support chat
//   socket.on("updateSupportLastMessage", ({ conversationId, lastMessage }) => {
//     io.to(`support_${conversationId}`).emit("updateSupportLastMessage", { lastMessage });
//     console.log(`Last support message updated in conversation ${conversationId}`);
//   });

//   // When a user disconnects
//   socket.on("disconnect", () => {
//     console.log(`user disconnected with socket ID: ${socket.id}`);
//     removeUser(socket.id);
//     io.emit("getUsers", users);
//   });
// });

// server.listen(process.env.PORT || 4000, () => {
//   console.log(`Socket server running on port ${process.env.PORT || 4000}`);
// });


const socketIO = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

require("dotenv").config({
  path: "./.env",
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world from socket server!");
});

// Track connected users and their socket IDs for chat
let users = [];

// School-isolated video rooms: Map<schoolId, Map<meetingId, participants>>
const schoolVideoRooms = new Map();

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

// Helper function to create message objects
const createMessage = ({ senderId, receiverId, text, images, conversationId, senderType }) => ({
  senderId,
  receiverId,
  text,
  images,
  conversationId,
  senderType,
  seen: false,
  createdAt: new Date()
});

io.on("connection", (socket) => {
  console.log(`a user connected with socket ID: ${socket.id}`);

  // ==================== CHAT FUNCTIONALITY ====================
  
  // When a user connects, add them to the users list
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
    console.log(`User ${userId} connected with socket ID: ${socket.id}`);
  });

  // Regular chat messages (school-parent)
  socket.on("sendMessage", ({ senderId, receiverId, text, images, conversationId }) => {
    const message = createMessage({
      senderId,
      receiverId,
      text,
      images,
      conversationId,
      senderType: 'regular'
    });

    const receiver = getUser(receiverId);

    // Emit to the specific conversation room
    io.to(`chat_${conversationId}`).emit("getMessage", message);

    // Also emit directly to receiver if they're online
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", message);
    }

    console.log(`Regular message sent from ${senderId} to ${receiverId}`);
  });

  // Support chat messages (school-admin)
  socket.on("sendSupportMessage", ({ senderId, receiverId, text, images, conversationId, senderType }) => {
    const message = createMessage({
      senderId,
      receiverId,
      text,
      images,
      conversationId,
      senderType
    });

    const receiver = getUser(receiverId);

    // Emit to the specific support conversation room
    io.to(`support_${conversationId}`).emit("getSupportMessage", message);

    // Also emit directly to receiver if they're online
    if (receiver) {
      io.to(receiver.socketId).emit("getSupportMessage", message);
    }

    console.log(`Support message sent from ${senderId} (${senderType}) to ${receiverId}`);
  });

  // Join regular chat room
  socket.on("joinChat", (conversationId) => {
    socket.join(`chat_${conversationId}`);
    console.log(`User joined chat room: chat_${conversationId}`);
  });

  // Join support chat room
  socket.on("joinSupportChat", (conversationId) => {
    socket.join(`support_${conversationId}`);
    console.log(`User joined support room: support_${conversationId}`);
  });

  // Message seen events for regular chat
  socket.on("messageSeen", ({ conversationId, messageId }) => {
    io.to(`chat_${conversationId}`).emit("messageSeen", { messageId });
    console.log(`Message ${messageId} marked as seen in chat ${conversationId}`);
  });

  // Message seen events for support chat
  socket.on("supportMessageSeen", ({ conversationId, messageId }) => {
    io.to(`support_${conversationId}`).emit("supportMessageSeen", { messageId });
    console.log(`Support message ${messageId} marked as seen in conversation ${conversationId}`);
  });

  // Last message updates for regular chat
  socket.on("updateLastMessage", ({ conversationId, lastMessage }) => {
    io.to(`chat_${conversationId}`).emit("updateLastMessage", { lastMessage });
    console.log(`Last message updated in chat ${conversationId}`);
  });

  // Last message updates for support chat
  socket.on("updateSupportLastMessage", ({ conversationId, lastMessage }) => {
    io.to(`support_${conversationId}`).emit("updateSupportLastMessage", { lastMessage });
    console.log(`Last support message updated in conversation ${conversationId}`);
  });

  // ==================== VIDEO CONFERENCING FUNCTIONALITY ====================

  // Join video room with SCHOOL ISOLATION
  socket.on("join-video-room", async (data) => {
    const { meetingId, userId, userType, userName, schoolId } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    // Initialize school rooms if not exists
    if (!schoolVideoRooms.has(schoolId)) {
      schoolVideoRooms.set(schoolId, new Map());
    }

    const schoolRooms = schoolVideoRooms.get(schoolId);
    
    socket.join(`${schoolId}_${meetingId}`);
    
    if (!schoolRooms.has(meetingId)) {
      schoolRooms.set(meetingId, new Map());
    }
    
    const room = schoolRooms.get(meetingId);
    room.set(socket.id, { 
      userId, 
      userType, 
      userName,
      schoolId
    });
    
    // Notify others in the same SCHOOL and MEETING
    socket.to(`${schoolId}_${meetingId}`).emit("user-joined", {
      userId,
      userName,
      userType,
      socketId: socket.id
    });
    
    // Send existing participants (from same school only)
    const participants = Array.from(room.entries()).map(([id, user]) => ({
      socketId: id,
      ...user
    })).filter(participant => participant.socketId !== socket.id);
    
    socket.emit("existing-participants", participants);
    
    console.log(`User ${userName} joined video room ${meetingId} in school ${schoolId}`);
  });

  // WebRTC signaling - SCHOOL ISOLATED
  socket.on("webrtc-offer", (data) => {
    const { meetingId, schoolId, targetSocketId, offer } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("webrtc-offer", {
      offer,
      senderSocketId: socket.id,
      targetSocketId
    });
  });

  socket.on("webrtc-answer", (data) => {
    const { meetingId, schoolId, targetSocketId, answer } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("webrtc-answer", {
      answer,
      senderSocketId: socket.id,
      targetSocketId
    });
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const { meetingId, schoolId, targetSocketId, candidate } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("webrtc-ice-candidate", {
      candidate,
      senderSocketId: socket.id,
      targetSocketId
    });
  });

  // Room controls - VERIFY TEACHER AND SCHOOL
  socket.on("mute-participant", (data) => {
    const { targetUserId, meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    // Verify the muter is a teacher
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can mute participants' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("participant-muted", { 
      userId: targetUserId 
    });
  });

  socket.on("unmute-participant", (data) => {
    const { targetUserId, meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can unmute participants' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("participant-unmuted", { 
      userId: targetUserId 
    });
  });

  socket.on("remove-participant", (data) => {
    const { targetSocketId, meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can remove participants' });
    }
    
    socket.to(targetSocketId).emit("removed-from-meeting");
    socket.to(`${schoolId}_${meetingId}`).emit("participant-removed", { 
      socketId: targetSocketId 
    });
  });

  // Screen sharing with school isolation
  socket.on("start-screen-share", (data) => {
    const { meetingId, schoolId, userName } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("screen-share-started", {
      socketId: socket.id,
      userName
    });
  });

  socket.on("stop-screen-share", (data) => {
    const { meetingId, schoolId } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("screen-share-stopped", {
      socketId: socket.id
    });
  });

  // Reactions
  socket.on("send-reaction", (data) => {
    const { meetingId, schoolId, userId, userName, reaction } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("reaction-received", {
      userId,
      userName,
      reaction
    });
  });

  // Chat messages in video call with school isolation
  socket.on("send-video-chat-message", (data) => {
    const { meetingId, schoolId, userId, userName, message } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    io.to(`${schoolId}_${meetingId}`).emit("video-chat-message", {
      userId,
      userName,
      message,
      timestamp: new Date()
    });
  });

  // Raise hand feature
  socket.on("raise-hand", (data) => {
    const { meetingId, schoolId, userId, userName } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("hand-raised", {
      userId,
      userName,
      socketId: socket.id
    });
  });

  socket.on("lower-hand", (data) => {
    const { meetingId, schoolId, userId } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("hand-lowered", {
      userId
    });
  });

  // Teacher can lower all hands
  socket.on("lower-all-hands", (data) => {
    const { meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can lower all hands' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("all-hands-lowered");
  });

  // Recording controls (teacher only)
  socket.on("start-recording", (data) => {
    const { meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can start recording' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("recording-started");
  });

  socket.on("stop-recording", (data) => {
    const { meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can stop recording' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("recording-stopped");
  });

  // Whiteboard collaboration
  socket.on("whiteboard-draw", (data) => {
    const { meetingId, schoolId, userType, drawingData } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    // Only teachers can draw by default, or implement permission system
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can use whiteboard' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("whiteboard-update", {
      drawingData,
      drawnBy: socket.id
    });
  });

  socket.on("whiteboard-clear", (data) => {
    const { meetingId, schoolId, userType } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can clear whiteboard' });
    }
    
    socket.to(`${schoolId}_${meetingId}`).emit("whiteboard-cleared");
  });

  // Breakout rooms (teacher only)
  socket.on("create-breakout-room", (data) => {
    const { meetingId, schoolId, userType, roomName, participants } = data;
    
    if (!schoolId) {
      socket.emit('error', { message: 'School ID is required' });
      return;
    }
    
    if (userType !== 'teacher') {
      return socket.emit('error', { message: 'Only teachers can create breakout rooms' });
    }
    
    // Logic to create breakout room and move participants
    socket.to(`${schoolId}_${meetingId}`).emit("breakout-room-created", {
      roomName,
      participants
    });
  });

  // ==================== DISCONNECTION HANDLING ====================

  socket.on("disconnect", () => {
    console.log(`user disconnected with socket ID: ${socket.id}`);
    
    // Remove from chat users
    removeUser(socket.id);
    io.emit("getUsers", users);
    
    // Remove from video rooms with SCHOOL CLEANUP
    for (const [schoolId, schoolRooms] of schoolVideoRooms.entries()) {
      for (const [meetingId, room] of schoolRooms.entries()) {
        if (room.has(socket.id)) {
          const user = room.get(socket.id);
          
          socket.to(`${schoolId}_${meetingId}`).emit("user-left", {
            socketId: socket.id,
            userId: user.userId,
            userName: user.userName
          });
          
          room.delete(socket.id);
          
          // Clean up empty rooms
          if (room.size === 0) {
            schoolRooms.delete(meetingId);
          }
          
          // Clean up school if no rooms left
          if (schoolRooms.size === 0) {
            schoolVideoRooms.delete(schoolId);
          }
          
          break;
        }
      }
    }
  });

  // ==================== PING/PONG FOR CONNECTION MONITORING ====================

  socket.on("ping", (data) => {
    socket.emit("pong", {
      timestamp: new Date().toISOString(),
      ...data
    });
  });

  // ==================== ERROR HANDLING ====================

  socket.on("error", (error) => {
    console.error(`Socket error from ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    connectedUsers: users.length,
    activeVideoRooms: Array.from(schoolVideoRooms.values()).reduce((acc, schoolRooms) => 
      acc + schoolRooms.size, 0
    ),
    totalSchools: schoolVideoRooms.size
  });
});

// Get server stats endpoint
app.get("/stats", (req, res) => {
  const stats = {
    totalConnections: users.length,
    schools: Array.from(schoolVideoRooms.entries()).map(([schoolId, rooms]) => ({
      schoolId,
      activeMeetings: Array.from(rooms.entries()).map(([meetingId, participants]) => ({
        meetingId,
        participantCount: participants.size
      }))
    })),
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});

server.listen(process.env.PORT || 4000, () => {
  console.log(`Socket server running on port ${process.env.PORT || 4000}`);
});