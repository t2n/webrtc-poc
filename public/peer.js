export default class Peer {
  constructor(opts) {
    const { sid, turnservers, socket, stream, offer } = opts;

    this.ice = [];
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
      .then(() => {
        this.emitSignal('offer', this.connection.localDescription);
      });
    }

    this.connection.addEventListener('icecandidate', e => {
      if (e.candidate) {
        this.emitSignal('icecandidate', e.candidate);
      }
    });

    this.connection.addEventListener('addstream', e => {
      const video = document.createElement('video');
      video.setAttribute('id', 'id_' + sid);
      video.setAttribute('autoplay', true);
      video.setAttribute('width', 300);
      document.body.appendChild(video);
      video.srcObject = e.stream;
    });
  }

  addIce(candidate) {
    // we can't start adding ICE candidates
    // unless we have remote offer
    // this is wrong with spec
    // but that's how chrome works atm
    if (this.connection.remoteDescription) {
        this.ice.forEach(ice => {
          this.connection.addIceCandidate(new RTCIceCandidate(ice))
        });
        this.ice = [];
    } else {
      this.ice.push(candidate);
    }
  }

  handleMessage(type, msg) {
    switch (type) {
      case 'icecandidate':
        this.addIce(msg)
        break;
      case 'offer':
        this.connection.setRemoteDescription(new RTCSessionDescription(msg))
        .then(() => this.connection.addStream(this.stream))
        .then(() => this.connection.createAnswer())
        .then(answer => this.connection.setLocalDescription(answer))
        .then(() => this.emitSignal('answer', this.connection.localDescription));
        break;
      case 'answer':
        this.connection.setRemoteDescription(new RTCSessionDescription(msg));
        break;
    }
  }
};
