const socket = io();
const params = new URLSearchParams(window.location.search);
const room = params.get("id");
const video = document.getElementById("video");

let stream;

socket.emit("join-room", room, "host");

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(localStream => {
  stream = localStream;
  video.srcObject = stream;

  socket.on("viewer-connected", viewerId => {
    const peer = new RTCPeerConnection();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("ice-candidate", viewerId, event.candidate);
      }
    };

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.emit("offer", viewerId, offer);
    });

    socket.on("answer-" + viewerId, answer => {
      peer.setRemoteDescription(answer);
    });

    socket.on("ice-candidate-" + viewerId, candidate => {
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    });
  });
});

// Actualizar contador
socket.on("viewer-count", count => {
  document.getElementById("viewerCount").textContent = count;
});
