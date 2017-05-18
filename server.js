const PORT = 3002;
// we need https so getUserMedia works
const https = require('https');
const connect = require('connect');
const connectStatic = require('serve-static');
const _ = require('underscore');
const fs = require('fs');

// static file server over https
const app = connect();
app.use(connectStatic('dist'))
const server = https.createServer({
  key: fs.readFileSync('ssl/key.pem'),
  cert: fs.readFileSync('ssl/cert.pem')
}, app);
server.listen(PORT, console.log.bind(this, 'server listening on port %s', PORT));

// signaling server implementation
const turnservers = require('./config').turnservers;

// add socket.io middleware to https server
// so the client can download /socket.io/socket.io.js
const io = require('socket.io')(server);
const adapter = io.nsps['/'].adapter;

io.on('connection', client => {
  const socketIds = _.without(_.keys(adapter.sids), client.id);

  // send turn servers information
  // and already connected users' ids
  client.emit('startingData', turnservers, socketIds);

  // just forward messages between peers
  client.on('msg', (type, to, msg) => {
    const from = client.id;
    io.to(to).emit('msg', type, from, msg);
  });
  client.on('disconnect', () => client.broadcast.emit('peerDisconnected', client.id));
});
