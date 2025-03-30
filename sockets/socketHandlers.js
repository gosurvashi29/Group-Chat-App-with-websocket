const Message = require('../models/messages');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/user');
const Group = require('../models/group');
const { verifyToken } = require('../util/jwt');

function socketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Join room (for group chat)
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
    });

    // Leave room (for group chat)
    socket.on("leaveRoom", (roomId) => {
      socket.leave(roomId);
    });

    // Handle new private message
    socket.on("newMessage", async (data) => {
      try {
        const { messageText, recipientEmail, senderToken, uniqueKey } = data;
        const decoded = verifyToken(senderToken);
        const senderId = decoded.userId;
        console.log(uniqueKey)

        const recipient = await User.findOne({ where: { email: recipientEmail } });
        if (!recipient) {
          return socket.emit("error", { message: "Recipient not found" });
        }

        const newMessage = await Message.create({
          message: messageText,
          userId: senderId,
          recipientId: recipient.id,
          uniqueKey: uniqueKey // Store the unique key
        });

        const response = {
          id: newMessage.id,
          sender: decoded.name,
          recipient: recipient.name,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
          uniqueKey: uniqueKey
        };

        return io.to(uniqueKey).emit("newMessage", response);
      } catch (error) {
        console.error("Error handling private message:", error);
        socket.emit("error", {
          message: "An error occurred while sending the message",
        });
      }
    });

    // Handle new group message
    socket.on("newGroupMessage", async (data) => {
      console.log(data)
      try {
        const { messageText, groupId, senderToken } = data;
        const decoded = verifyToken(senderToken);
        const senderId = decoded.userId;

        const group = await Group.findByPk(groupId);
        if (!group) {
          return socket.emit("error", { message: "Group not found" });
        }

        const newGroupMessage = await GroupMessage.create({
          message: messageText,
          userId: senderId,
          groupId: groupId
        });

        const response = {
          id: newGroupMessage.id,
          sender: decoded.name,
          message: newGroupMessage.message,
          createdAt: newGroupMessage.createdAt,
          groupId: groupId
        };

        return io.to(groupId).emit("newGroupMessage", response);
      } catch (error) {
        console.error("Error handling group message:", error);
        socket.emit("error", {
          message: "An error occurred while sending the group message",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}

module.exports = socketHandlers;
