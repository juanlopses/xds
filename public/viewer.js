const socket = io();
const params = new URLSearchParams(window.location.search);
const room = params.get("id");
const video = document.getElementById("video");

const peer = new RTCPeerConnection();

socket.emit("join-room", room, "viewer");

peer.ontrack = event => {
  video.srcObject = event.streams[0];
};

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit("ice-candidate", room, event.candidate);
  }
};

socket.on("offer", async (offer) => {
  await peer.setRemoteDescription(offer);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit("answer", room, answer);
});

socket.on("ice-candidate", candidate => {
  peer.addIceCandidate(new RTCIceCandidate(candidate));
});

// Actualizar contador
socket.on("viewer-count", count => {
  document.getElementById("viewerCount").textContent = count;
});
