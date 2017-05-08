import Peer from "./peer";
const socket = io();
const peers = {};
var _localStream = null;
var _turnServers = [];

socket.on('startingData', (turnServers, socketIds) => {
  _turnServers = turnServers;
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then((stream) => {
    _localStream = stream;
    var video = document.querySelector('video')
    video.srcObject = stream;
    return stream;
  })
  .then((stream) => {
    socketIds.forEach(sid => {
      if (!peers[sid]) {
        peers[sid] = new Peer({
          turnservers: _turnServers,
          stream: _localStream,
          offer: true,
          socket,
          sid,
        });
      }
    });
  })
  .catch(err => console.log(err));
});

socket.on('msg', (type, from, msg) => {

  // create peer if that's first time
  // we receive message from that id
  if (!peers[from]) {
    peers[from] = new Peer({
      turnservers: _turnServers,
      stream: _localStream,
      offer: false,
      socket,
      sid: from,
    });
  }

  peers[from].handleMessage(type, msg);
});

socket.on('peerDisconnected', sid => {
  const $el = document.querySelector('#id_' + sid);

  if ($el) {
    $el.remove();
  }
});
