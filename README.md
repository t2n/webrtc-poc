this project is a vanilla webrtc poc for chrome and nodejs

first you need to create `config.js` file containing turnservers information like:

```
module.exports.turnservers = {
  turnservers: {
    iceServers: [{
      username: 'username',
      credential: 'password',
      url: 'turn:TURNSERVER_IP',
    }]
  }
};
```
