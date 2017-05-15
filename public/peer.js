export default class Peer {
  constructor(opts) {
    const { sid, turnservers, socket, stream, offer } = opts;

    this.stream = stream;
    this.connection = new RTCPeerConnection(turnservers);
    this.emitSignal = (type, data) => socket.emit('msg', type, sid, data);

    if (offer) {
      this.connection.addStream(this.stream);
      this.connection.createOffer({
        offerToReceiveVideo: 1,
        offerToReceiveAudio: 1
      })
      .then(offer => this.connection.setLocalDescription(offer))
      .then(new Promise(resolve => {
        this.connection.addEventListener('icecandidate', e => {
          if (e.candidate === null) {
            resolve();
          }
        });
      }))
      .then(() => {
        this.emitSignal('offer', this.connection.localDescription);
      });
    }

    this.connection.addEventListener('addstream', e => {
      const video = document.createElement('video');
      video.setAttribute('id', 'id_' + sid);
      video.setAttribute('autoplay', true);
      video.setAttribute('width', 300);
      document.body.appendChild(video);
      video.srcObject = e.stream;
    });
  }

  handleMessage(type, msg) {
    switch (type) {
      case 'offer':
        this.connection.setRemoteDescription(new RTCSessionDescription(msg))
        .then(() => this.connection.addStream(this.stream))
        .then(() => this.connection.createAnswer())
        .then(answer => this.connection.setLocalDescription(answer))
        .then(() => {
          var that = this;
          setTimeout(function() {
            that.emitSignal('answer', that.connection.localDescription)
          }, 500);
        });
        break;
      case 'answer':
        this.connection.setRemoteDescription(new RTCSessionDescription(msg));
        break;
    }
  }
};
