const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

const cors = require("cors");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use("/peerjs", peerServer);
app.use(cors());

app.get("/", (req, res) => {
  const roomId = uuidv4();
  console.log(`Redirecting to new room: ${roomId}`);
  res.redirect(`/${roomId}`);
});

app.get("/:room", (req, res) => {
  const roomId = req.params.room;
  console.log(`User accessing room: ${roomId}`);
  res.render("room", { roomId });
});

// Handle Socket.io connections
io.on("connection", (socket) => {
  console.log("New socket connection established:", socket.id);
  let currentRoom = null;

  socket.on("join-room", (roomId, userId) => {
    currentRoom = roomId;
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
    socket.to(roomId).broadcast.emit("user-connected", userId);
  });

  socket.on("message", (message) => {
    if (currentRoom) {
      console.log(`Message in room ${currentRoom} from ${socket.id}: ${message}`);
      io.to(currentRoom).emit("createMessage", message);
    } else {
      console.log("Message received but user hasn't joined any room yet.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (currentRoom) {
      console.log(`User ${socket.id} left room ${currentRoom}`);
      // Optionally notify others (if you're tracking userIds separately)
    }
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
