const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const liveRooms = {};

io.on("connection", socket => {
  socket.on("join-room", (roomId, role) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = role;

    if (!liveRooms[roomId]) {
      liveRooms[roomId] = { host: null, viewers: new Set() };
    }

    if (role === "host") {
      liveRooms[roomId].host = socket;
    } else {
      liveRooms[roomId].viewers.add(socket.id);
      if (liveRooms[roomId].host) {
        liveRooms[roomId].host.emit("viewer-connected", socket.id);
      }
    }

    updateViewerCount(roomId);
  });

  socket.on("offer", (to, offer) => {
    io.to(to).emit("offer", offer);
  });

  socket.on("answer", (roomId, answer) => {
    if (liveRooms[roomId]?.host) {
      liveRooms[roomId].host.emit("answer-" + socket.id, answer);
    }
  });

  socket.on("ice-candidate", (toOrRoom, candidate) => {
    const isHost = socket.role === "host";
    if (isHost) {
      io.to(toOrRoom).emit("ice-candidate", candidate);
    } else {
      if (liveRooms[toOrRoom]?.host) {
        liveRooms[toOrRoom].host.emit("ice-candidate-" + socket.id, candidate);
      }
    }
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (roomId && liveRooms[roomId]) {
      if (socket.role === "viewer") {
        liveRooms[roomId].viewers.delete(socket.id);
      }
      updateViewerCount(roomId);
    }
  });

  function updateViewerCount(roomId) {
    const count = liveRooms[roomId]?.viewers.size || 0;
    io.to(roomId).emit("viewer-count", count);
  }
});

server.listen(3000, () => console.log("Servidor en http://localhost:3000"));
