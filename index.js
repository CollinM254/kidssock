//const socketIO = require("socket.io");
//const http = require("http");
//const express = require("express");
//const cors = require("cors");
//const app = express();
//const server = http.createServer(app);
//const io = socketIO(server);
//
//require("dotenv").config({
//  path: "./.env",
//});
//
//app.use(cors());
//app.use(express.json());
//
//app.get("/", (req, res) => {
//  res.send("Hello world from socket server!");
//});
//
//let users = [];
//
//const addUser = (userId, socketId) => {
//  !users.some((user) => user.userId === userId) &&
//    users.push({ userId, socketId });
//};
//
//const removeUser = (socketId) => {
//  users = users.filter((user) => user.socketId !== socketId);
//};
//
//const getUser = (receiverId) => {
//  return users.find((user) => user.userId === receiverId);
//};
//
//// Define a message object with a seen property
//const createMessage = ({ senderId, receiverId, text, images }) => ({
//  senderId,
//  receiverId,
//  text,
//  images,
//  seen: false,
//});
//
//io.on("connection", (socket) => {
//  // when connect
//  console.log(`a user is connected`);
//
//  // take userId and socketId from user
//  socket.on("addUser", (userId) => {
//    addUser(userId, socket.id);
//    io.emit("getUsers", users);
//  });
//
//  // send and get message
//  const messages = {}; // Object to track messages sent to each user
//
//  socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
//    const message = createMessage({ senderId, receiverId, text, images });
//
//    const user = getUser(receiverId);
//
//    // Store the messages in the `messages` object
//    if (!messages[receiverId]) {
//      messages[receiverId] = [message];
//    } else {
//      messages[receiverId].push(message);
//    }
//
//    // send the message to the recevier
//    io.to(user?.socketId).emit("getMessage", message);
//  });
//
//  socket.on("messageSeen", ({ senderId, receiverId, messageId }) => {
//    const user = getUser(senderId);
//
//    // update the seen flag for the message
//    if (messages[senderId]) {
//      const message = messages[senderId].find(
//        (message) =>
//          message.receiverId === receiverId && message.id === messageId
//      );
//      if (message) {
//        message.seen = true;
//
//        // send a message seen event to the sender
//        io.to(user?.socketId).emit("messageSeen", {
//          senderId,
//          receiverId,
//          messageId,
//        });
//      }
//    }
//  });
//
//  // update and get last message
//  socket.on("updateLastMessage", ({ lastMessage, lastMessagesId }) => {
//    io.emit("getLastMessage", {
//      lastMessage,
//      lastMessagesId,
//    });
//  });
//
//  //when disconnect
//  socket.on("disconnect", () => {
//    console.log(`a user disconnected!`);
//    removeUser(socket.id);
//    io.emit("getUsers", users);
//  });
//});
//
//server.listen(process.env.PORT || 4000, () => {
//  console.log(`server is running on port ${process.env.PORT || 4000}`);
//});
const socketIO = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

require("dotenv").config({
  path: "./.env",
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world from socket server!");
});

// Track connected users and their socket IDs
let users = [];

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
      senderType: 'regular' // For regular school-parent chat
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

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log(`user disconnected with socket ID: ${socket.id}`);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

server.listen(process.env.PORT || 4000, () => {
  console.log(`Socket server running on port ${process.env.PORT || 4000}`);
});
